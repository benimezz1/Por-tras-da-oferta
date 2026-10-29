import { describe, it, expect, vi } from "vitest";
import {
  createGame,
  gameReducer,
  assess,
  emptyRecord,
  sessionId,
} from "../src/game/engine";
import { missions } from "../src/game/content";
import type { GameState, Outcome, Reflection } from "../src/game/types";
const reflection: Reflection = {
  assignments: {},
  reason: "Comparei o custo total e considerei a reserva para sábado.",
  criteria: ["Orçamento e reserva"],
};
const skip: Outcome = {
  kind: "skip",
  label: "Usar alternativa",
  cost: 0,
  recurring: 0,
};
function advance(state: GameState, outcome = skip) {
  const mission = missions[state.current].id;
  state = gameReducer(state, { type: "decide", mission, outcome });
  return gameReducer(state, { type: "complete", mission, reflection });
}
describe("campanha C4", () => {
  it("começa com orçamento em centavos e identidades independentes", () => {
    const a = createGame("A"),
      b = createGame("B");
    expect(a.balance).toBe(50000);
    expect(a.player.id).not.toBe(b.player.id);
    expect(a.sessionId).not.toBe(b.sessionId);
  });
  it("gera identificador também em prévia HTTP sem randomUUID", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    try {
      expect(sessionId()).toMatch(/^[a-f0-9]{32}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("não permite pular capítulos", () => {
    const s = createGame("A");
    expect(
      gameReducer(s, { type: "decide", mission: "final", outcome: skip }),
    ).toBe(s);
  });
  it("não avança sem decisão ou justificativa mínima", () => {
    let s = createGame("A");
    expect(
      gameReducer(s, { type: "complete", mission: "feed", reflection }),
    ).toBe(s);
    s = gameReducer(s, { type: "decide", mission: "feed", outcome: skip });
    expect(
      gameReducer(s, {
        type: "complete",
        mission: "feed",
        reflection: { ...reflection, reason: "sim" },
      }),
    ).toBe(s);
    expect(
      gameReducer(s, {
        type: "complete",
        mission: "feed",
        reflection: { ...reflection, criteria: [] },
      }),
    ).toBe(s);
  });
  it("uma compra é cobrada uma vez, mesmo com duplo clique", () => {
    let s = advance(createGame("A"));
    const action = {
      type: "decide" as const,
      mission: "store",
      outcome: { ...skip, kind: "buy" as const, label: "Pulse", cost: 18000 },
    };
    s = gameReducer(s, action);
    expect(s.balance).toBe(32000);
    expect(gameReducer(s, action)).toBe(s);
  });
  it.each([-1, NaN, Infinity, 0.1, 50001])(
    "rejeita custo inválido %s",
    (cost) => {
      const s = createGame("A");
      expect(
        gameReducer(s, {
          type: "decide",
          mission: "feed",
          outcome: { ...skip, cost },
        }),
      ).toBe(s);
    },
  );
  it("reserva cobranças futuras sem descontá-las hoje", () => {
    let s = createGame("A");
    for (let i = 0; i < 4; i++) s = advance(s);
    s = advance(s, {
      kind: "subscribe",
      label: "Teste sem extras",
      cost: 0,
      recurring: 3500,
    });
    expect(s.balance).toBe(50000);
    expect(s.recurring).toBe(3500);
    s = gameReducer(s, {
      type: "decide",
      mission: "final",
      outcome: { ...skip, cost: 47000 },
    });
    expect(s.records.final?.outcome).toBeUndefined();
  });
  it("inspeção é idempotente e rejeita evidências de outro capítulo", () => {
    const s = createGame("A");
    expect(
      gameReducer(s, { type: "inspect", mission: "feed", evidence: "stock" }),
    ).toBe(s);
    const a = gameReducer(s, {
      type: "inspect",
      mission: "feed",
      evidence: "ad",
    });
    expect(a.records.feed.seen).toEqual(["ad"]);
    expect(
      gameReducer(a, { type: "inspect", mission: "feed", evidence: "ad" }),
    ).toBe(a);
  });
  it("avança os seis capítulos e preserva os registros", () => {
    let s = createGame("A");
    for (let i = 0; i < 6; i++) s = advance(s);
    expect(s.current).toBe(6);
    expect(Object.keys(s.records)).toHaveLength(6);
    expect(s.balance).toBe(50000);
    expect(
      gameReducer(s, { type: "inspect", mission: "final", evidence: "borrow" }),
    ).toBe(s);
  });
  it("reconhecimento independe da decisão de comprar", () => {
    const base = {
      ...emptyRecord(),
      seen: ["ad"],
      reflection: {
        ...reflection,
        assignments: { ad: ["personalizacao" as const] },
      },
    };
    const a = assess("feed", { ...base, outcome: skip });
    const b = assess("feed", {
      ...base,
      outcome: { ...skip, kind: "buy", cost: 18000 },
    });
    expect(a).toEqual(b);
    expect(a.recognized).toEqual(["personalizacao"]);
    expect(a.review).toEqual(["fomo", "influenciadores"]);
  });
  it("não premia associação em evidência não investigada e aponta associações sem suporte", () => {
    const r = {
      ...emptyRecord(),
      seen: ["trend"],
      reflection: {
        ...reflection,
        assignments: {
          ad: ["personalizacao" as const],
          trend: ["escassez" as const],
        },
      },
    };
    const a = assess("feed", r);
    expect(a.recognized).toEqual([]);
    expect(a.unsupported).toEqual([
      { evidence: "A conversa do grupo", strategy: "escassez" },
    ]);
  });
  it("mantém somente evidências vistas ao concluir", () => {
    let s = createGame("A");
    s = gameReducer(s, { type: "decide", mission: "feed", outcome: skip });
    s = gameReducer(s, {
      type: "complete",
      mission: "feed",
      reflection: { ...reflection, assignments: { ad: ["personalizacao"] } },
    });
    expect(s.records.feed.reflection?.assignments).toEqual({});
  });
});

describe("rascunhos de reflexão", () => {
  it("guarda texto parcial sem concluir o capítulo, preserva ao investigar e limpa ao concluir", () => {
    let s = createGame("Teste");
    s = gameReducer(s, { type: "decide", mission: "feed", outcome: skip });
    const draft = { ...reflection, reason: "Ainda estou pensando." };
    s = gameReducer(s, { type: "draft", mission: "feed", reflection: draft });
    expect(s.current).toBe(0);
    expect(s.records.feed.draft).toEqual(draft);
    expect(s.records.feed.completedAt).toBeUndefined();
    s = gameReducer(s, { type: "inspect", mission: "feed", evidence: "ad" });
    expect(s.records.feed.draft?.reason).toBe("Ainda estou pensando.");
    s = gameReducer(s, { type: "complete", mission: "feed", reflection });
    expect(s.current).toBe(1);
    expect(s.records.feed.draft).toBeUndefined();
  });
  it("não inicia rascunho antes da decisão e não modifica capítulo já encerrado", () => {
    const s = createGame("Teste");
    expect(gameReducer(s, { type: "draft", mission: "feed", reflection })).toBe(
      s,
    );
    const done = advance(s);
    expect(
      gameReducer(done, { type: "draft", mission: "feed", reflection }),
    ).toBe(done);
  });
});
