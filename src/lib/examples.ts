/** Example content only fills gaps: per city, examples top up real upcoming public items to TARGET and always rank after them. */
export const EXAMPLE_TARGET = 6;
type Item = { is_example: boolean; city: string; visibility?: string | null };
export function fadeExamples<T extends Item>(items: T[], opts: { hideAll?: boolean; target?: number } = {}): T[] {
  const target = opts.target ?? EXAMPLE_TARGET;
  const real = items.filter((i) => !i.is_example);
  if (opts.hideAll) return real;
  const realByCity = new Map<string, number>();
  for (const r of real) if ((r.visibility ?? "public") === "public") realByCity.set(r.city.toLowerCase(), (realByCity.get(r.city.toLowerCase()) ?? 0) + 1);
  const usedByCity = new Map<string, number>();
  const examples = items.filter((i) => {
    if (!i.is_example) return false;
    const c = i.city.toLowerCase();
    const room = target - (realByCity.get(c) ?? 0) - (usedByCity.get(c) ?? 0);
    if (room <= 0) return false;
    usedByCity.set(c, (usedByCity.get(c) ?? 0) + 1);
    return true;
  });
  return [...real, ...examples];
}
/** Keeps real items first without disturbing their order. */
export const realFirst = <T extends { is_example: boolean }>(items: T[]) => [...items.filter((i) => !i.is_example), ...items.filter((i) => i.is_example)];
