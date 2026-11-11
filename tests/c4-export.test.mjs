import { describe, it, expect } from "vitest";
import "../public/pressure.js";
import "../public/recommendation.js";
import "../public/c4-export.js";

const P = globalThis.PorTrasPressure;
const R = globalThis.NoFeedRecommender;
const E = globalThis.PorTrasExportC4;

function fixture() {
  return {
    version: 4, started: true, finished: true, phase: 4, day: 5, endStep: 3,
    runId: "c4-test-session-1234", startedAt: "2026-11-04T12:00:00.000Z",
    finishedAt: "2026-11-04T12:15:00.000Z",
    feedItems: [{ kind: "post", id: "p1", day: 1 }],
    wallet: 400, goal: 400, coins: 5, purchases: [{ id: "fone", name: "Atmos Lite", cost: 100, method: "pix", day: 1 }],
    viewed: ["fone"], cart: [], personalized: true, algorithm: R.emptyProfile(),
    pressure: P.emptyLedger(), vibe: P.emptyVibe(), quiz: {},
    subscriptions: [], invoice: [], events: [{ phase: 0, type: "view", message: "fone" }],
    fixes: [], context: {}, reviews: [], notifs: []
  };
}

describe("arquivo JSON da Semana ate a viagem", () => {
  it("inclui escolhas de publicacao sem enviar legendas ou comentarios privados", () => {
    const state=fixture();
    state.myPosts=[{id:'me-compra-1',caption:'minha legenda pessoal',comments:[['você','meu comentario pessoal','agora']]}];
    state.myStories=[{id:'story-compra-1',text:'texto pessoal',day:1}];
    state.postComments={'extra-post-11':[['você','comentario no feed que deve ficar apenas no jogo','agora']]};
    state.purchaseShares=[{orderId:'pedido-um',day:1,products:['fone'],channel:'ambos',postId:'me-compra-1',storyId:'story-compra-1'}];
    const payload=E.build(state,{pressure:P,recommender:R});
    expect(payload.estado.purchaseShares).toHaveLength(1);
    expect(payload.estado.socialActivity).toEqual({postsCriados:1,storiesCriados:1,comentariosCriados:1});
    expect(payload.resumo.social.ambos).toBe(1);
    const serialized=JSON.stringify(payload);
    expect(serialized).not.toContain('minha legenda pessoal');
    expect(serialized).not.toContain('meu comentario pessoal');
    expect(serialized).not.toContain('texto pessoal');
    expect(serialized).not.toContain('comentario no feed que deve ficar apenas no jogo');
  });
  it("exporta o estado da campanha nova, as dez estrategias e o quiz", () => {
    const state = fixture();
    P.expose(state.pressure, "fomo", "Só falta você.");
    const firstQuiz = P.quiz(state.pressure, 5)[0];
    state.quiz[firstQuiz.id] = firstQuiz.answer;
    const payload = E.build(state, { pressure: P, recommender: R, now: "2026-11-04T14:00:00.000Z" });
    expect(payload).toMatchObject({
      formato: "por-tras-da-oferta/c4-semana",
      versao: 1,
      campanha: "semana-ate-a-viagem",
      simulado: true,
      sessao: { id: state.runId },
      resumo: { jornada: { concluida: true, diaAtual: 5 }, quiz: { respondidas: 1, acertos: 1 } }
    });
    expect(payload.estado).toMatchObject({ version: 4, goal: 400, wallet: 400, quiz: state.quiz });
    expect(payload.resumo.estrategias).toHaveLength(15);
    expect(payload.resumo.algoritmo).toHaveProperty("topTopics");
    expect(payload.resumo.economia.fechamento.tripPaid).toBe(true);
    expect(payload.estado.purchases[0].name).toBe("Atmos Lite");
    expect(payload).not.toHaveProperty("player.password");
  });
  it("gera cópia, sem alterar o estado original", () => {
    const state = fixture();
    const payload = E.build(state, { pressure: P, recommender: R });
    payload.estado.feedItems[0].id = "alterado";
    expect(state.feedItems[0].id).toBe("p1");
  });
  it("recusa partidas não iniciadas, estados de campanha antiga e IDs inválidos", () => {
    const base = fixture(), deps = { pressure: P, recommender: R };
    expect(() => E.build({ ...base, started: false }, deps)).toThrow();
    expect(() => E.build({ ...base, version: 1 }, deps)).toThrow();
    expect(() => E.build({ ...base, runId: "x" }, deps)).toThrow();
  });
  it("aceita campos opcionais ausentes ou indefinidos", () => {
    const state = fixture();
    state.lastOrder = undefined;
    const payload = E.build(state, { pressure: P, recommender: R });
    expect(payload.estado.lastOrder).toBe(null);
  });
});
