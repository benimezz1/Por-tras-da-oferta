import { missions } from "./content";
import type { GameState, GameAction, MissionRecord, Reflection } from "./types";
export function sessionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export const emptyRecord = (): MissionRecord => ({ seen: [], likes: [] });
export function createGame(
  name: string,
  mode: "demo" | "account" = "demo",
  id: string = sessionId(),
): GameState {
  return {
    version: 1,
    player: { id, name: name.trim().slice(0, 24) || "Visitante", mode },
    campaignId: "c4-v1",
    sessionId: sessionId(),
    balance: 50000,
    recurring: 0,
    current: 0,
    records: {},
    events: [],
    startedAt: new Date().toISOString(),
  };
}
export function gameReducer(state: GameState, action: GameAction): GameState {
  const mission = missions[state.current];
  if (!mission || action.mission !== mission.id) return state;
  const record = state.records[mission.id] ?? emptyRecord();
  if (record.completedAt) return state;
  let next = { ...record };
  let balance = state.balance,
    recurring = state.recurring,
    current = state.current;
  if (action.type === "inspect") {
    if (
      !mission.evidence.some((e) => e.id === action.evidence) ||
      record.seen.includes(action.evidence)
    )
      return state;
    next.seen = [...record.seen, action.evidence];
  } else if (action.type === "like") {
    next.likes = record.likes.includes(action.target)
      ? record.likes.filter((x) => x !== action.target)
      : [...record.likes, action.target];
  } else if (action.type === "decide") {
    const o = action.outcome;
    if (
      record.outcome ||
      !Number.isSafeInteger(o.cost) ||
      !Number.isSafeInteger(o.recurring) ||
      o.cost < 0 ||
      o.recurring < 0 ||
      o.cost + o.recurring > balance
    )
      return state;
    if (o.cost + state.recurring + o.recurring > balance) return state;
    next.outcome = { ...o };
    balance -= o.cost;
    recurring += o.recurring;
  } else {
    if (
      !record.outcome ||
      action.reflection.reason.trim().length < 15 ||
      !action.reflection.criteria.length
    )
      return state;
    const assignments: Reflection["assignments"] = {};
    for (const e of mission.evidence)
      if (record.seen.includes(e.id))
        assignments[e.id] = [
          ...new Set(action.reflection.assignments[e.id] ?? []),
        ];
    next.reflection = {
      ...action.reflection,
      reason: action.reflection.reason.trim().slice(0, 1500),
      assignments,
    };
    next.completedAt = new Date().toISOString();
    current++;
  }
  return {
    ...state,
    balance,
    recurring,
    current,
    records: { ...state.records, [mission.id]: next },
    events: [
      ...state.events,
      {
        mission: mission.id,
        action: action.type,
        target:
          action.type === "inspect"
            ? action.evidence
            : action.type === "like"
              ? action.target
              : action.type === "decide"
                ? action.outcome.label
                : "reflection",
        at: new Date().toISOString(),
      },
    ].slice(-400),
  };
}
export function assess(missionId: string, record: MissionRecord) {
  const mission = missions.find((m) => m.id === missionId)!;
  const expected = new Set(mission.evidence.flatMap((e) => e.strategies));
  const recognized = new Set(
    mission.evidence.flatMap((e) =>
      e.strategies.filter(
        (s) =>
          record.seen.includes(e.id) &&
          record.reflection?.assignments[e.id]?.includes(s),
      ),
    ),
  );
  const unsupported = mission.evidence.flatMap((e) =>
    (record.reflection?.assignments[e.id] ?? [])
      .filter((s) => !e.strategies.includes(s))
      .map((strategy) => ({ evidence: e.label, strategy })),
  );
  return {
    recognized: [...recognized],
    review: [...expected].filter((s) => !recognized.has(s)),
    unsupported,
    investigated: record.seen.length,
    total: mission.evidence.length,
  };
}
