// Verified against MCP commit cc89c7f57edc79126afb015c57d5483e8f145e1e.
// Same-origin only: HttpOnly session cookies remain owned by the backend.
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export class LegacyApi {
  constructor(private transport: typeof fetch = fetch) {}
  async request<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.transport(path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.headers.get("content-type")?.includes("application/json"))
      throw new ApiError(
        "A API não está disponível neste endereço.",
        res.status,
      );
    const data = await res.json();
    if (!res.ok)
      throw new ApiError(
        data.erro ?? "Não foi possível concluir a solicitação.",
        res.status,
      );
    return data as T;
  }
  login(username: string, password: string) {
    return this.request("/api/login", { username, password });
  }
  register(username: string, password: string, invite: string) {
    return this.request("/api/register", { username, password, invite });
  }
  me() {
    return this.request<{ usuario: { id: string; username: string } }>(
      "/api/me",
    );
  }
  logout() {
    return this.request("/api/logout", {});
  }
  game() {
    return this.request("/api/game");
  }
  analyze(texto: string) {
    return this.request("/api/analisar", { texto });
  }
  // Do not map C4 missions to the incompatible legacy four-scenario write endpoint.
}
export const backendEnabled = import.meta.env.VITE_BACKEND_ENABLED === "true";
