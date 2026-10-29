import type { SimulationState } from "./simulation";
export type Strategy =
  | "urgencia"
  | "escassez"
  | "prova_social"
  | "influenciadores"
  | "fomo"
  | "descontos"
  | "personalizacao"
  | "padroes_obscuros";
export type Evidence = {
  id: string;
  label: string;
  detail: string;
  strategies: Strategy[];
};
export type Mission = {
  id: string;
  title: string;
  app: string;
  category: string;
  subtitle: string;
  brief: string;
  need: string;
  duration: string;
  color: string;
  evidence: Evidence[];
};
export type Outcome = {
  kind: "buy" | "wait" | "skip" | "subscribe" | "cancel";
  label: string;
  cost: number;
  recurring: number;
};
export type Reflection = {
  assignments: Record<string, Strategy[]>;
  reason: string;
  criteria: string[];
};
export type MissionRecord = {
  world?: SimulationState;
  seen: string[];
  likes: string[];
  outcome?: Outcome;
  draft?: Reflection;
  reflection?: Reflection;
  completedAt?: string;
};
export type GameState = {
  version: 1;
  player: { id: string; name: string; mode: "demo" | "account" };
  campaignId: "c4-v1";
  sessionId: string;
  balance: number;
  recurring: number;
  current: number;
  records: Record<string, MissionRecord>;
  events: { mission: string; action: string; target: string; at: string }[];
  startedAt: string;
};
export type GameAction =
  | { type: "world"; mission: string; patch: Partial<SimulationState> }
  | { type: "inspect"; mission: string; evidence: string }
  | { type: "like"; mission: string; target: string }
  | { type: "decide"; mission: string; outcome: Outcome }
  | { type: "draft"; mission: string; reflection: Reflection }
  | { type: "complete"; mission: string; reflection: Reflection };
