import { describe, it, expect, vi } from "vitest";
import { createGame } from "../src/game/engine";
import { TabProgressStore } from "../src/services/persistence";
import { LegacyApi, ApiError } from "../src/services/api";
function memory() {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
    clear: () => m.clear(),
  } satisfies Storage;
}
describe("persistência por sessão", () => {
  it("restaura uma sessão e apaga ao encerrar", () => {
    const storage = memory();
    const repo = new TabProgressStore(storage);
    const game = createGame("Ana");
    repo.save(game);
    expect(repo.load()).toEqual(game);
    repo.clear();
    expect(repo.load()).toBeNull();
  });
  it("sessões em abas separadas não compartilham registros", () => {
    const a = new TabProgressStore(memory()),
      b = new TabProgressStore(memory());
    a.save(createGame("A"));
    expect(b.load()).toBeNull();
  });
  it("ignora JSON corrompido e versões incompatíveis", () => {
    const storage = memory(),
      repo = new TabProgressStore(storage);
    storage.setItem("pto.c4.session.v1", "{");
    expect(repo.load()).toBeNull();
    storage.setItem(
      "pto.c4.session.v1",
      JSON.stringify({ ...createGame("A"), version: 99 }),
    );
    expect(repo.load()).toBeNull();
  });
  it("expõe falha de quota ao chamador para aviso visível", () => {
    const storage = memory();
    storage.setItem = () => {
      throw Error("QuotaExceeded");
    };
    expect(() => new TabProgressStore(storage).save(createGame("A"))).toThrow(
      "QuotaExceeded",
    );
  });
});
describe("adaptador HTTP do contrato existente", () => {
  it("usa cookie na mesma origem e nunca persiste senha", async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sucesso: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    await new LegacyApi(transport).login("apelido", "senha-ficticia");
    expect(transport).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          username: "apelido",
          password: "senha-ficticia",
        }),
      }),
    );
  });
  it("distingue sessão expirada de sucesso", async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ erro: "Faça login." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(new LegacyApi(transport).me()).rejects.toMatchObject({
      status: 401,
      message: "Faça login.",
    });
  });
  it("não interpreta HTML de fallback como gravação bem-sucedida", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        new Response("<html/>", { headers: { "Content-Type": "text/html" } }),
      );
    await expect(new LegacyApi(transport).me()).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
describe("dados locais danificados", () => {
  it.each([
    { current: 6, records: {} },
    { records: { feed: { seen: ["inexistente"], likes: [] } } },
    {
      records: {
        feed: {
          seen: ["ad"],
          likes: [],
          reflection: {
            reason: "teste",
            criteria: [],
            assignments: { ad: "personalizacao" },
          },
        },
      },
    },
    {
      records: {
        feed: {
          seen: ["ad"],
          likes: [],
          reflection: {
            reason: "teste",
            criteria: [],
            assignments: { ad: ["inexistente"] },
          },
        },
      },
    },
    {
      records: {
        feed: {
          seen: [],
          likes: [],
          outcome: { kind: "buy", label: "Produto", cost: -1, recurring: 0 },
        },
      },
    },
  ])("não restaura estado inválido %#", (invalid) => {
    const storage = memory();
    storage.setItem(
      "pto.c4.session.v1",
      JSON.stringify({ ...createGame("A"), ...invalid }),
    );
    expect(new TabProgressStore(storage).load()).toBeNull();
  });
});

it("restaura um rascunho válido e rejeita associações corrompidas no rascunho", () => {
  const repo = new TabProgressStore(memory());
  const s = createGame("Teste");
  s.records.feed = {
    seen: ["ad"],
    likes: [],
    outcome: { kind: "wait", label: "Comparar", cost: 0, recurring: 0 },
    draft: {
      assignments: { ad: ["personalizacao"] },
      reason: "Estou pensando",
      criteria: [],
    },
  };
  repo.save(s);
  expect(repo.load()?.records.feed.draft?.reason).toBe("Estou pensando");
  repo.save({
    ...s,
    records: {
      feed: {
        ...s.records.feed,
        draft: {
          ...s.records.feed.draft!,
          assignments: { ad: "personalizacao" as never },
        },
      },
    },
  });
  expect(repo.load()).toBeNull();
});
