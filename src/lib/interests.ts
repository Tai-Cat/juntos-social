export const COMMUNITY_THRESHOLD = 3;
/** Optional skill levels set from Profile; "any" means Not set. Several interests may share a level. */
export const INTEREST_LEVELS = [
  { value: "any", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
] as const;
export const normalizeInterest = (v: string) => v.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 60);
/** Adds a normalized interest to the end, ignoring duplicates. There is no limit on how many. */
export function addInterest(list: string[], raw: string): string[] {
  const n = normalizeInterest(raw);
  if (!n || list.includes(n)) return list;
  return [...list, n];
}
/** A plan suits someone when its activity or any interest tag is one of their interests. */
export function matchesInterests(plan: { activity: string; interest_tags?: string[] | null }, interests: string[]) {
  const mine = new Set(interests.map(normalizeInterest));
  return mine.has(normalizeInterest(plan.activity)) || (plan.interest_tags ?? []).some((t) => mine.has(normalizeInterest(t)));
}
