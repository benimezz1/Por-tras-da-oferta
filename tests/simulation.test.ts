import { describe, expect, it } from "vitest";
import { createGame, gameReducer } from "../src/game/engine";
import {
  initialSimulation,
  navigateSimulation,
  validSimulation,
} from "../src/game/simulation";
import { isGameState } from "../src/services/persistence";
import { missions } from "../src/game/content";
import type { GameState, Outcome } from "../src/game/types";
const reflection = {
  assignments: {},
  reason: "Comparei o preço e a necessidade antes de escolher.",
  criteria: ["Preço total"],
};
const skip: Outcome = {
  kind: "skip",
  label: "Usar o que tenho",
  cost: 0,
  recurring: 0,
};
function finish(s: GameState, outcome: Outcome = skip) {
  const mission = missions[s.current].id;
  return gameReducer(gameReducer(s, { type: "decide", mission, outcome }), {
    type: "complete",
    mission,
    reflection,
  });
}
describe("navegação e continuidade da simulação", () => {
  it("voltar e abrir outra página descarta somente o caminho adiante", () => {
    let w = initialSimulation("feed");
    w = { ...w, ...navigateSimulation(w, { page: "shop" }) };
    w = { ...w, ...navigateSimulation(w, { page: "profile", person: "lia" }) };
    w = { ...w, cursor: 1 };
    w = {
      ...w,
      ...navigateSimulation(w, { page: "messages", person: "oficina" }),
    };
    expect(w.trail.map((r) => r.page)).toEqual(["feed", "shop", "messages"]);
    expect(w.cursor).toBe(2);
    expect(validSimulation(w)).toBe(true);
  });
  it("limita histórico sem perder a página atual", () => {
    let w = initialSimulation("feed");
    for (let i = 0; i < 80; i++)
      w = { ...w, ...navigateSimulation(w, { page: i % 2 ? "shop" : "feed" }) };
    expect(w.trail).toHaveLength(30);
    expect(w.cursor).toBe(29);
    expect(validSimulation(w)).toBe(true);
  });
  it("restaura comentários, conversas e seleções sem alterar orçamento ou avançar", () => {
    const s = createGame("Teste");
    const world = {
      ...initialSimulation("feed"),
      comments: [
        {
          id: "c1",
          thread: "lia",
          text: "Vou comparar primeiro.",
          author: "Teste",
        },
      ],
      messages: [
        { id: "m1", thread: "grupo", text: "Precisa trocar?", author: "Teste" },
      ],
      selections: { size: "40" },
    };
    const next = gameReducer(s, {
      type: "world",
      mission: "feed",
      patch: world,
    });
    expect(isGameState(JSON.parse(JSON.stringify(next)))).toBe(true);
    expect(next.records.feed.world).toEqual(world);
    expect(next.balance).toBe(50000);
    expect(next.current).toBe(0);
    expect(next.events).toEqual([]);
    expect(createGame("Outra pessoa").records).toEqual({});
  });
  it("rejeita página, cursor e texto inválidos no estado persistido", () => {
    expect(validSimulation({ ...initialSimulation("feed"), cursor: 8 })).toBe(
      false,
    );
    expect(
      validSimulation({
        ...initialSimulation("feed"),
        trail: [{ page: "https://outro.site" }],
      }),
    ).toBe(false);
    const s = createGame("Teste");
    const patch = {
      comments: [
        { id: "x", thread: "lia", author: "Teste", text: "x".repeat(281) },
      ],
    };
    expect(gameReducer(s, { type: "world", mission: "feed", patch })).toBe(s);
  });
  it("carrega perfis seguidos e conversas para a próxima fase, sem misturar comentários", () => {
    let s = createGame("Teste");
    s = gameReducer(s, { type: "like", mission: "feed", target: "follow:lia" });
    s = gameReducer(s, { type: "like", mission: "feed", target: "lia" });
    s = gameReducer(s, {
      type: "world",
      mission: "feed",
      patch: {
        messages: [
          { id: "m", thread: "grupo", text: "Até sábado", author: "Teste" },
        ],
      },
    });
    s = finish(s);
    expect(s.records.store.likes).toEqual(["follow:lia"]);
    expect(s.records.store.world?.messages[0].text).toBe("Até sábado");
    expect(s.records.store.world?.comments).toEqual([]);
    expect(s.records.store.world?.trail).toEqual([{ page: "shop" }]);
  });
  it("compra pelo anúncio é debitada uma vez e impede nova cobrança do fone na fase seguinte", () => {
    let s = finish(createGame("Teste"), {
      kind: "buy",
      label: "Fone Pulse",
      cost: 18000,
      recurring: 0,
    });
    expect(s.balance).toBe(32000);
    expect(
      gameReducer(s, {
        type: "decide",
        mission: "store",
        outcome: {
          kind: "buy",
          label: "Fone Pulse",
          cost: 18000,
          recurring: 0,
        },
      }),
    ).toBe(s);
    s = finish(s);
    expect(s.balance).toBe(32000);
    expect(s.current).toBe(2);
  });
  it("cancelar o teste remove o compromisso futuro uma única vez", () => {
    let s = createGame("Teste");
    for (let i = 0; i < 4; i++) s = finish(s);
    s = gameReducer(s, {
      type: "decide",
      mission: "subscription",
      outcome: {
        kind: "subscribe",
        label: "Teste com extra",
        cost: 0,
        recurring: 4400,
      },
    });
    expect(s.recurring).toBe(4400);
    const action = {
      type: "decide" as const,
      mission: "subscription",
      outcome: {
        kind: "cancel" as const,
        label: "Cancelar renovação",
        cost: 0,
        recurring: 0,
      },
    };
    s = gameReducer(s, action);
    expect(s.recurring).toBe(0);
    expect(s.balance).toBe(50000);
    expect(gameReducer(s, action)).toBe(s);
    expect(isGameState(s)).toBe(true);
  });
  it("preserva saves anteriores sem campos sociais e recusa mudanças em fase concluída", () => {
    let s = createGame("Teste");
    expect(isGameState(s)).toBe(true);
    s = finish(s);
    expect(
      gameReducer(s, { type: "world", mission: "feed", patch: { cursor: 0 } }),
    ).toBe(s);
  });
});
