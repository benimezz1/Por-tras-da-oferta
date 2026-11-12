/* Exportador da campanha atual (Semana até a viagem).
 * Somente cria arquivo local; o envio ao MCP requer escolha e login do jogador. */
(function (root) {
  "use strict";
  const FORMAT = "por-tras-da-oferta/c4-semana";
  const SCHEMA_VERSION = 1;
  const CAMPAIGN = "semana-ate-a-viagem";
  const FIELDS = [
    "version","started","finished","phase","day","feedItems","wallet","goal","cart",
    "purchases","viewed","liked","likedAds","bookmarks","hiddenPosts","lastOrder",
    "stories","reviews","signals","personalized","extraChecked","events","algorithm",
    "pressure","vibe","coins","coupons","card","invoice","subscriptions","timers",
    "stock","threads","notifs","variant","protection","streak","exitOffers","context",
    "fixes","anchors","endStep","quiz","flags","wake","wakeList","coinsOn",
    "payMethod","runId","startedAt","finishedAt","purchaseShares"
  ];
  const safeArray = v => Array.isArray(v) ? v : [];
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  function build(state, { pressure, recommender, now = new Date() } = {}) {
    if (!state || state.version !== 4 || !state.started)
      throw Error("Comece a semana antes de exportar seu percurso.");
    if (typeof state.runId !== "string" || !/^[a-zA-Z0-9_-]{12,100}$/.test(state.runId))
      throw Error("Identificador da partida inválido.");
    if (!pressure || !recommender)
      throw Error("Motores da campanha indisponíveis.");
    // O backend MCP v1 usa quatro etapas (0–3). A interface agora tem cinco
    // (0 resultado, 1 análise, 2 aprendizado, 3 quiz, 4 raio-x).
    // Mantemos a numeração original nos dados enviados.
    const uiStep = Math.max(0, Math.floor(num(state.endStep)));
    const legacyEndStep = Math.min(3, state.endFlowVersion === 2 && uiStep >= 2 ? uiStep - 1 : uiStep);
    const snapshot = {};
    for (const key of FIELDS) if (Object.prototype.hasOwnProperty.call(state, key))
      snapshot[key] = state[key] === undefined ? null : clone(state[key]);
    snapshot.endStep = legacyEndStep;
    // Somente contagens de interacoes proprias sao enviadas, sem legenda ou texto
    // de comentarios digitados pelo jogador. As decisoes sobre compartilhar
    // compras sao registros da simulacao (nao atitudes reais).
    snapshot.socialActivity = {
      postsCriados: safeArray(state.myPosts).length,
      storiesCriados: safeArray(state.myStories).length,
      comentariosCriados: safeArray(state.myPosts).reduce((sum,p)=>sum+safeArray(p?.comments).length,0)
    };
    const settlement = pressure.settle(state);
    const exposures = pressure.profile(state.pressure);
    const questions = pressure.quiz(state.pressure, 5);
    const answered = questions.filter(q => Object.prototype.hasOwnProperty.call(state.quiz || {}, q.id));
    const exportedAt = new Date(now).toISOString();
    const payload = {
      formato: FORMAT,
      versao: SCHEMA_VERSION,
      campanha: CAMPAIGN,
      exportadoEm: exportedAt,
      sessao: {
        id: state.runId,
        iniciadaEm: state.startedAt || null,
        concluidaEm: state.finishedAt || null
      },
      origem: "jogo-estatico-c4",
      simulado: true,
      estado: snapshot,
      resumo: {
        jornada: { iniciada: true, concluida: !!state.finished, diaAtual: state.day,
          etapaFinal: legacyEndStep, conteudosExibidos: safeArray(state.feedItems).length },
        economia: { saldoInicial: 620, metaViagem: state.goal, saldoAtual: state.wallet,
          moedas: state.coins, fechamento: settlement },
        consumo: { compras: safeArray(state.purchases).length,
          produtosVistos: safeArray(state.viewed).length,
          carrinho: safeArray(state.cart).length,
          assinaturasAtivas: safeArray(state.subscriptions).filter(x => x && x.active).length },
        social: { compartilhamentosAposCompra: safeArray(state.purchaseShares).length,
          feed: safeArray(state.purchaseShares).filter(x=>x?.channel==="feed").length,
          story: safeArray(state.purchaseShares).filter(x=>x?.channel==="story").length,
          ambos: safeArray(state.purchaseShares).filter(x=>x?.channel==="ambos").length,
          nenhum: safeArray(state.purchaseShares).filter(x=>x?.channel==="nenhum").length },
        estrategias: exposures.map(p => ({ codigo: p.key, nome: p.name,
          exposicoes: p.exposed, acoesInfluenciadas: p.influenced })),
        quiz: { total: questions.length, respondidas: answered.length,
          acertos: answered.filter(q => state.quiz[q.id] === q.answer).length },
        algoritmo: { personalizado: state.personalized !== false,
          ...recommender.summary(state.algorithm, state.phase) }
      },
      aviso: "Registro de uma simulacao educativa ficticia. Nao descreve compras reais, nem permite diagnosticos."
    };
    const json = JSON.stringify(payload);
    if (new TextEncoder().encode(json).length > 1024 * 1024)
      throw Error("O percurso excede o limite de exportacao de 1 MB.");
    return payload;
  }
  function download(payload, doc = document) {
    const pretty = JSON.stringify(payload, null, 2);
    const raw = new TextEncoder().encode(pretty).length <= 1024 * 1024 ? pretty : JSON.stringify(payload);
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = doc.createElement("a");
    link.href = url;
    link.download = "por-tras-da-oferta-semana-" + payload.sessao.id.slice(0, 12) + ".json";
    link.style.display = "none";
    doc.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  root.PorTrasExportC4 = Object.freeze({ FORMAT, SCHEMA_VERSION, CAMPAIGN, FIELDS, build, download });
})(typeof window !== "undefined" ? window : globalThis);
