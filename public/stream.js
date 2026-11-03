/* Seletor de publicações e anúncios para o feed contínuo fictício.
   Mistura fontes e temas; o objetivo financeiro não entra no ranking. */
(function (root) {
  root.NoFeedStream = (function createStreamEngine(model) {
  const topics = ["fone", "tenis", "plano", "mochila"];
  const hash = (value) => {
    let h = 2166136261 >>> 0;
    for (const char of String(value)) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
    return h / 4294967295;
  };
  const clamp = (n, low, high) => Math.max(low, Math.min(high, Number.isFinite(n) ? n : 0));
  const recent = (shown) => shown.slice(-3);
  function scorePost(post, args) {
    const history = recent(args.shown || []);
    const sameTopic = history.some((x) => x.topic === post.topic);
    const last = history.at(-1);
    const parts = {
      atualidade: 1.3 + (12 - post.order) * 0.045,
      popularidade: Math.log10(1 + Math.max(0, post.likes || 0)) * 0.33,
      proximidade: post.source === "friend" ? 0.67 : 0.32,
      interesse: args.personalized ? clamp(model.affinity(args.profile, post.topic, args.phase), -8, 12) * 0.62 : 0,
      criador: args.personalized ? clamp(model.authorAffinity(args.profile, post.author, args.phase), -6, 8) * 0.33 : 0,
      diversidade: sameTopic ? -1.32 : 0,
      repeticao: last?.author === post.author ? -0.86 : 0,
      descoberta: args.personalized ? hash("post:" + post.id) * 0.49 : 0,
    };
    return { score: Object.values(parts).reduce((a,b) => a+b,0), parts };
  }
  function choosePost(posts, args) {
    const used = new Set(args.shown.map(item => item.id));
    const available = posts.filter(post => !used.has(post.id));
    if (!available.length) return null;
    if (!args.personalized) {
      available.sort((a,b) => a.order - b.order);
      return available[0];
    }
    available.sort((a,b) => scorePost(b,args).score-scorePost(a,args).score || a.order-b.order || a.id.localeCompare(b.id));
    return available[0];
  }
  function scoreAd(ad, args) {
    const views = model.exposureCount(args.profile, ad.id);
    const affinity = args.personalized ? model.affinity(args.profile, ad.topic, args.phase) : 0;
    const inCart = args.cart.includes(ad.topic);
    const alreadySeenTopic = args.shown.some(x => x.kind === "ad" && x.topic === ad.topic);
    const previous = args.shown.at(-1);
    const parts = {
      comercial: ad.kind === "retarget" ? 1.85 : 2.0,
      afinidade: args.personalized ? affinity * 0.62 : 0,
      carrinho: args.personalized && inCart ? 2.7 : 0,
      lembranca: args.personalized && args.viewed.includes(ad.topic) ? 1.0 : 0,
      repeticao: -views*1.5 - (alreadySeenTopic ? 0.55 : 0),
      diversidade: previous?.topic === ad.topic ? -0.7 : 0,
      exploracao: hash("ad:"+ad.topic) * 0.43,
    };
    return { score:Object.values(parts).reduce((a,b)=>a+b,0), parts };
  }
  function chooseAd(args) {
    const published = new Set(args.shown.map(item=>item.id));
    const candidates = topics.filter(t=>!args.purchased.includes(t)).flatMap(topic=>{
      const out = [];
      if (!published.has("ad-main-"+topic)) out.push({ kind:"ad", id:"ad-main-"+topic, topic, retarget:false });
      const repeated = "ad-ret-"+topic;
      const known = args.viewed.includes(topic) || args.cart.includes(topic) || model.affinity(args.profile,topic,args.phase)>1.2;
      if (args.personalized && known && !published.has(repeated)
        && model.exposureCount(args.profile,repeated) < 2
        && published.has("ad-main-"+topic)) out.push({kind:"retarget",id:repeated,topic,retarget:true});
      return out;
    });
    if (!candidates.length) return null;
    if (!args.personalized) {
      candidates.sort((a,b)=>topics.indexOf(a.topic)-topics.indexOf(b.topic));
      return { ...candidates[0], kind:"ad" };
    }
    candidates.sort((a,b) => scoreAd(b,args).score-scoreAd(a,args).score
      || topics.indexOf(a.topic)-topics.indexOf(b.topic));
    return { ...candidates[0], kind:"ad" };
  }
  function nextBatch(posts, opts, size=5) {
    const args = { ...opts, shown: [...opts.shown] };
    const out = [];
    let attempts=0;
    while(out.length<size && attempts++<size+5) {
      const index=args.shown.length;
      let selected=null;
      if(index % 4 === 3) selected=chooseAd(args);
      if(!selected) {
        const post=choosePost(posts,args);
        if (post) selected={kind:"post",id:post.id,topic:post.topic,author:post.author};
      }
      if(!selected) break;
      args.shown.push(selected);
      out.push(selected);
    }
    return out;
  }
  const isDone = (posts, shown) => posts.every(p=>shown.some(x=>x.kind==="post" && x.id===p.id));
  return Object.freeze({topics,scorePost,scoreAd,choosePost,chooseAd,nextBatch,isDone});
})(root.NoFeedRecommender);
})(typeof window !== "undefined" ? window : globalThis);
