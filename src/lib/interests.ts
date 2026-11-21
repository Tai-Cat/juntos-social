export const MAX_INTERESTS = 30;
export const COMMUNITY_THRESHOLD = 3;
export const normalizeInterest = (v: string) => v.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 60);
/** Adds a normalized interest to the end, ignoring duplicates; returns null once the 30 limit is reached. */
export function addInterest(list: string[], raw: string): string[] | null {
  const n = normalizeInterest(raw);
  if (!n || list.includes(n)) return list;
  if (list.length >= MAX_INTERESTS) return null;
  return [...list, n];
}
export function moveInterest(list: string[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list]; const [x] = next.splice(from, 1); if (x !== undefined) next.splice(to, 0, x); return next;
}
/** A plan suits someone when its activity or any interest tag is one of their interests. */
export function matchesInterests(plan: { activity: string; interest_tags?: string[] | null }, interests: string[]) {
  const mine = new Set(interests.map(normalizeInterest));
  return mine.has(normalizeInterest(plan.activity)) || (plan.interest_tags ?? []).some((t) => mine.has(normalizeInterest(t)));
}
