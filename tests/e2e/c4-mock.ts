import type { Page, Route } from "@playwright/test";

/** API fake in browser tests. Real auth, CORS and storage are tested in MCP repository. */
export async function mockC4Service(page: Page) {
  let current = { id: "player-e2e", username: "aluno_teste" };
  await page.route("**/api/c4/client/**", async (route: Route) => {
    const req = route.request(), path = new URL(req.url()).pathname;
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type,Authorization",
      "content-type": "application/json; charset=utf-8",
    };
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: cors, body: "" });
    }
    const input = req.postDataJSON?.() ?? {};
    if (path.endsWith("/signup") || path.endsWith("/login")) {
      current = { id: "player-e2e", username: String(input.username || "aluno_teste") };
      return route.fulfill({
        status: 200, headers: cors, body: JSON.stringify({
          token: "a".repeat(43),
          usuario: current,
          expiresEm: new Date(Date.now() + 3600_000).toISOString(),
        }),
      });
    }
    if (path.endsWith("/me")) {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ usuario: current }) });
    }
    if (path.endsWith("/logout")) {
      return route.fulfill({ status: 200, headers: cors, body: '{"sucesso":true}' });
    }
    if (path.endsWith("/complete")) {
      const doc = input;
      if (doc.formato !== "por-tras-da-oferta/c4-semana" ||
          doc.estado?.endStep !== 3 || Object.keys(doc.estado.quiz || {}).length !== 5)
        return route.fulfill({ status: 422, headers: cors, body: '{"erro":"Quiz incompleto"}' });
      return route.fulfill({ status: 201, headers: cors, body: JSON.stringify({
        sucesso: true, importado: true, partida: doc.sessao.id,
        usuario: current,
      }) });
    }
    return route.fulfill({ status: 404, headers: cors, body: '{"erro":"Não encontrado"}' });
  });
}
