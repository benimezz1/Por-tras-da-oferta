export const pages = [
  "feed",
  "explore",
  "saved",
  "profile",
  "messages",
  "shop",
  "account",
] as const;
export type SimPage = (typeof pages)[number];
export type SimRoute = { page: SimPage; person?: string };
export type SocialEntry = {
  id: string;
  thread: string;
  text: string;
  author: string;
};
export type SimulationState = {
  trail: SimRoute[];
  cursor: number;
  comments: SocialEntry[];
  messages: SocialEntry[];
  storyViews: string[];
  selections: Record<string, string>;
};
export const initialSimulation = (mission: string): SimulationState => ({
  trail: [{ page: mission === "store" ? "shop" : "feed" }],
  cursor: 0,
  comments: [],
  messages: [],
  storyViews: [],
  selections: {},
});
export function navigateSimulation(
  world: SimulationState,
  route: SimRoute,
): Partial<SimulationState> {
  const current = world.trail[world.cursor];
  if (current.page === route.page && current.person === route.person) return {};
  const trail = [...world.trail.slice(0, world.cursor + 1), route].slice(-30);
  return { trail, cursor: trail.length - 1 };
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validSimulation(v: unknown): v is SimulationState {
  if (
    !obj(v) ||
    !Array.isArray(v.trail) ||
    !v.trail.length ||
    v.trail.length > 30 ||
    !Number.isInteger(v.cursor) ||
    Number(v.cursor) < 0 ||
    Number(v.cursor) >= v.trail.length ||
    !v.trail.every(
      (r) =>
        obj(r) &&
        pages.includes(r.page as SimPage) &&
        (r.person === undefined ||
          (typeof r.person === "string" && r.person.length <= 40)),
    ) ||
    !Array.isArray(v.storyViews) ||
    v.storyViews.length > 100 ||
    !v.storyViews.every((x) => typeof x === "string" && x.length <= 80) ||
    !obj(v.selections) ||
    Object.keys(v.selections).length > 40 ||
    !Object.entries(v.selections).every(
      ([k, x]) => k.length <= 40 && typeof x === "string" && x.length <= 100,
    )
  )
    return false;
  return [v.comments, v.messages].every(
    (entries) =>
      Array.isArray(entries) &&
      entries.length <= 80 &&
      entries.every(
        (e) =>
          obj(e) &&
          ["id", "thread", "text", "author"].every(
            (k) => typeof e[k] === "string",
          ) &&
          String(e.text).length <= 280 &&
          String(e.id).length <= 80 &&
          String(e.thread).length <= 40 &&
          String(e.author).length <= 40,
      ),
  );
}
