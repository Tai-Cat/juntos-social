// Host-defined group discounts. Each plan stores its own tiers (plans.discount_tiers);
// the database validates them. Plans with no tiers have no discount.
export type DiscountTier = { min: number; type: "pct" | "amount"; value: number };

/** The tiers every plan had before hosts could set their own (kept on old plans). */
export const LEGACY_TIERS: DiscountTier[] = [
  { min: 4, type: "pct", value: 15 },
  { min: 6, type: "pct", value: 25 },
];

export function parseTiers(raw: unknown): DiscountTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is DiscountTier => !!t && typeof t === "object" && Number((t as DiscountTier).min) >= 2 && ((t as DiscountTier).type === "pct" || (t as DiscountTier).type === "amount") && Number((t as DiscountTier).value) > 0)
    .map((t) => ({ min: Math.round(Number(t.min)), type: t.type, value: Number(t.value) }))
    .sort((a, b) => a.min - b.min);
}

/** The best tier reached with this many people going, or null. */
export function activeTier(tiers: DiscountTier[], going: number): DiscountTier | null {
  let best: DiscountTier | null = null;
  for (const t of parseTiers(tiers)) if (going >= t.min) best = t;
  return best;
}

export function tierLabel(t: DiscountTier, currency = "€"): string {
  return t.type === "pct" ? `${t.value}% off` : `${currency}${t.value} off`;
}

export function priceFor(basePrice: number, going: number, tiers: DiscountTier[]): number {
  const t = activeTier(tiers, going);
  if (!t) return basePrice;
  const p = t.type === "pct" ? basePrice * (1 - Math.min(t.value, 50) / 100) : basePrice - t.value;
  return Math.max(0, Math.round(p * 100) / 100);
}

/** e.g. "2 more for 15% off", or null when the top tier is reached / no tiers. */
export function nextTierCopy(going: number, tiers: DiscountTier[]): string | null {
  const next = parseTiers(tiers).find((t) => going < t.min);
  if (!next) return null;
  return `${next.min - going} more for ${tierLabel(next)}`;
}

/** 0..1 progress toward the top tier */
export function tierProgress(going: number, tiers: DiscountTier[]): number {
  const list = parseTiers(tiers);
  const top = list[list.length - 1];
  return top ? Math.min(1, going / top.min) : 0;
}
