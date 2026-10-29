import type { GameState } from "../game/types";
import { missions, strategies } from "../game/content";
const KEY = "pto.c4.session.v1";
export interface ProgressStore {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const stringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const cents = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
export function isGameState(value: unknown): value is GameState {
  if (!object(value) || !object(value.player) || !object(value.records))
    return false;
  const v = value;
  const player = value.player;
  const records = value.records;
  if (
    v.version !== 1 ||
    v.campaignId !== "c4-v1" ||
    typeof player.id !== "string" ||
    typeof player.name !== "string" ||
    player.name.length > 24 ||
    !["demo", "account"].includes(String(player.mode)) ||
    typeof v.sessionId !== "string" ||
    !Number.isInteger(v.current) ||
    Number(v.current) < 0 ||
    Number(v.current) > 6 ||
    !cents(v.balance) ||
    !cents(v.recurring) ||
    typeof v.startedAt !== "string" ||
    !Array.isArray(v.events) ||
    v.events.length > 400
  )
    return false;
  for (const [id, r] of Object.entries(records)) {
    const mission = missions.find((m) => m.id === id);
    if (
      !mission ||
      !object(r) ||
      !stringArray(r.seen) ||
      !stringArray(r.likes) ||
      r.seen.some((e) => !mission.evidence.some((x) => x.id === e))
    )
      return false;
    if (
      r.outcome !== undefined &&
      (!object(r.outcome) ||
        !["buy", "wait", "skip", "subscribe", "cancel"].includes(
          String(r.outcome.kind),
        ) ||
        typeof r.outcome.label !== "string" ||
        !cents(r.outcome.cost) ||
        !cents(r.outcome.recurring))
    )
      return false;
    const seen = r.seen;
    for (const f of [r.draft, r.reflection]) {
      if (f === undefined) continue;
      if (
        !object(f) ||
        typeof f.reason !== "string" ||
        f.reason.length > 1500 ||
        !stringArray(f.criteria) ||
        !object(f.assignments) ||
        Object.entries(f.assignments).some(
          ([key, tags]) =>
            !seen.includes(key) ||
            !stringArray(tags) ||
            tags.some((t) => !Object.hasOwn(strategies, t)),
        )
      )
        return false;
    }
    if (
      r.completedAt !== undefined &&
      (typeof r.completedAt !== "string" || !r.outcome || !r.reflection)
    )
      return false;
  }
  // Reject incomplete or nonsequential save files rather than guessing at a migration.
  if (missions.some((m, i) => i < Number(v.current) && !object(records[m.id])))
    return false;
  if (
    missions.some(
      (m, i) =>
        i < Number(v.current) &&
        !(records[m.id] as Record<string, unknown>)?.completedAt,
    )
  )
    return false;
  return true;
}
export class TabProgressStore implements ProgressStore {
  constructor(private storage: Storage) {}
  load() {
    try {
      const v = JSON.parse(this.storage.getItem(KEY) ?? "null");
      return isGameState(v) ? v : null;
    } catch {
      return null;
    }
  }
  save(state: GameState) {
    this.storage.setItem(KEY, JSON.stringify(state));
  }
  clear() {
    this.storage.removeItem(KEY);
  }
}
export function exportProgress(state: GameState) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          ...state,
          storage: "browser-session-only",
          notice: "Registro educativo fictício. Sem diagnóstico psicológico.",
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "por-tras-da-oferta-percurso.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
