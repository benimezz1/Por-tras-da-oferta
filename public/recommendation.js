/* Motor de recomendação educativo e determinístico do No Feed.
   Só utiliza interações fictícias nesta aba, sem coleta externa.
   Os pesos não reproduzem algoritmos proprietários. */
(function (root) {
  root.NoFeedRecommender = (function recommendationFactory() {
  "use strict";
  const topics = ["fone", "tenis", "plano", "mochila"];
  const labels = { fone: "Fones e áudio", tenis: "Moda e tênis", plano: "Música e assinaturas", mochila: "Viagens e mochilas" };
  const weights = { impression: 0.08, dwell: 0.55, story: 1.2, like: 2.5, unlike: -2.5, bookmark: 3.1, unbookmark: -3.1, comments: 1.3, product: 2.8, adLike: 1.5, cart: 4.1, removeCart: -4.1, buy: 2.0, skip: -3.2, less: -4.5 };
  const once = new Set(["impression", "dwell", "story", "comments", "product", "adLike", "less"]);
  const cap = (n, min, max) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));
  function emptyProfile() { return { version: 1, events: [], impressions: {} }; }
  function normalize(raw) {
    const p = emptyProfile();
    if (!raw || typeof raw !== "object") return p;
    if (Array.isArray(raw.events)) p.events = raw.events
      .filter(e => e && topics.includes(e.topic) && Object.prototype.hasOwnProperty.call(weights, e.type) && Number.isInteger(e.phase) && e.phase >= 0 && e.phase <= 3)
      .slice(-160).map(e => ({ type: e.type, topic: e.topic, author: String(e.author || "").slice(0, 40), id: String(e.id || "").slice(0, 80), phase: e.phase }));
    if (raw.impressions && typeof raw.impressions === "object" && !Array.isArray(raw.impressions)) {
      for (const [key, val] of Object.entries(raw.impressions).slice(-120)) {
        if (/^[0-3]:[a-z0-9-]{1,80}$/i.test(key) && val === true) p.impressions[key] = true;
      }
    }
    return p;
  }
  function record(profile, event) {
    if (!profile || !event || !topics.includes(event.topic) || !Object.prototype.hasOwnProperty.call(weights, event.type)) return false;
    const type = event.type, phase = Number(event.phase), id = String(event.id || "").slice(0, 80);
    if (!Number.isInteger(phase) || phase < 0 || phase > 3) return false;
    if (once.has(type) && profile.events.some(e => e.type === type && e.phase === phase && e.id === id)) return false;
    if (type === "impression") {
      const key = `${phase}:${id}`;
      if (profile.impressions[key]) return false;
      profile.impressions[key] = true;
      const entries = Object.keys(profile.impressions);
      if (entries.length > 120) delete profile.impressions[entries[0]];
    }
    profile.events.push({ type, topic: event.topic, author: String(event.author || "").slice(0, 40), id, phase });
    if (profile.events.length > 160) profile.events.splice(0, profile.events.length - 160);
    return true;
  }
  function affinity(profile, topic, phase) {
    if (!profile || !Array.isArray(profile.events)) return 0;
    return cap(profile.events.reduce((sum, e) => e.topic === topic && e.phase <= phase
      ? sum + weights[e.type] * Math.pow(0.72, phase - e.phase) : sum, 0), -8, 12);
  }
  function authorAffinity(profile, author, phase) {
    if (!author || !profile || !Array.isArray(profile.events)) return 0;
    return cap(profile.events.reduce((sum, e) => e.author === author && e.phase <= phase
      ? sum + weights[e.type] * Math.pow(0.72, phase - e.phase) : sum, 0), -6, 8);
  }
  function exposureCount(profile, id) {
    if (!profile || !profile.impressions) return 0;
    return Object.keys(profile.impressions).filter(key => key.endsWith(`:${id}`) && profile.impressions[key]).length;
  }
  function stableNumber(text) {
    let hash = 2166136261;
    for (const ch of String(text)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
    return hash;
  }
  function scorePost(item, opts) {
    const { profile, phase, personalized } = opts, age = Math.max(0, phase - item.phase);
    const parts = {
      atualidade: cap(4.3 - age * 2.5, 0, 4.3),
      popularidade: cap(Math.log10(1 + (Number(item.likes) || 0)) * 0.23, 0, 0.9),
      proximidade: item.source === "friend" ? 0.7 : 0.3,
      interesse: personalized ? cap(affinity(profile, item.topic, phase) * 0.51, -4, 5) : 0,
      criador: personalized ? cap(authorAffinity(profile, item.author, phase) * 0.33, -2, 2.6) : 0,
      novidade: personalized && (stableNumber(`${phase}:${item.id}`) % 7 === 0) ? 0.38 : 0,
      repeticao: personalized ? -0.55 * exposureCount(profile, item.id) : 0
    };
    return { score: Object.values(parts).reduce((a,b)=>a+b,0), parts };
  }
  function rankPosts(items, opts) {
    const { profile, phase, personalized = true } = opts;
    const current = items.filter(p => p.phase === phase);
    const older = items.filter(p => p.phase < phase).sort((a,b) => scorePost(b, opts).score - scorePost(a, opts).score || a.order - b.order).slice(0, 2);
    const pool = [...current, ...older];
    if (!personalized || (phase === 0 && (!profile || profile.events.length === 0))) {
      return pool.sort((a,b) => b.phase-a.phase || a.order-b.order);
    }
    const ranked = [], pending = [...pool];
    while (pending.length) {
      const previous = ranked[ranked.length - 1];
      pending.sort((a,b) => {
        const adjust = item => scorePost(item, opts).score
          - (previous && previous.author === item.author ? 1.7 : 0)
          - (previous && previous.topic === item.topic ? 0.35 : 0);
        return adjust(b) - adjust(a) || b.phase-a.phase || a.order-b.order || a.id.localeCompare(b.id);
      });
      ranked.push(pending.shift());
    }
    return ranked;
  }
  function rankStories(items, opts) {
    if (!opts.personalized || !opts.profile || !opts.profile.events.length) return [...items];
    return [...items].sort((a,b) => {
      const score = v => authorAffinity(opts.profile, v.user, opts.phase) * 0.5
        + affinity(opts.profile, v.product, opts.phase) * 0.12
        + (v.source === "friend" ? 0.35 : 0) - v.idx * 0.015;
      return score(b) - score(a) || a.idx - b.idx;
    });
  }
  function scoreAd(topic, opts) {
    const interest = affinity(opts.profile, topic, opts.phase);
    const inCart = opts.cart.includes(topic);
    const impressions = exposureCount(opts.profile, `ad-ret-${topic}`);
    const parts = {
      campanha: ({ fone: 1.8, tenis: 1.95, plano: 1.65, mochila: 1.7 })[topic] || 1.5,
      interesse: opts.personalized ? interest * 0.83 : 0,
      carrinho: opts.personalized && inCart ? 2.9 : 0,
      repeticao: -impressions * 1.5
    };
    return { score: Object.values(parts).reduce((a,b)=>a+b,0), parts, impressions, interest };
  }
  function pickRetarget(opts) {
    if (!opts.personalized || opts.phase < 1) return null;
    const candidates = topics.filter(topic => topic !== opts.current && !opts.purchased.includes(topic)).map(topic => ({ topic, ...scoreAd(topic, opts) }))
      .filter(c => c.impressions < 2 && (c.interest > 1.1 || opts.cart.includes(c.topic)))
      .sort((a,b) => b.score-a.score || topics.indexOf(a.topic)-topics.indexOf(b.topic));
    return candidates[0] && candidates[0].score > 2.2 ? candidates[0] : null;
  }
  function summary(profile, phase) {
    return {
      events: profile?.events?.length || 0,
      affinities: Object.fromEntries(topics.map(t => [t, affinity(profile, t, phase)])),
      last: (profile?.events || []).slice(-6),
    };
  }
  return Object.freeze({ topics, labels, weights, emptyProfile, normalize, record, affinity, authorAffinity, exposureCount, scorePost, rankPosts, rankStories, scoreAd, pickRetarget, summary });
})();
})(typeof window !== "undefined" ? window : globalThis);
