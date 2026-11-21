// Partner venue group discounts: 4+ people = 15% off, 6+ people = 25% off.
export const DISCOUNT_TIERS = [
  { min: 4, pct: 15 },
  { min: 6, pct: 25 },
] as const;

export function discountFor(going: number): number {
  let pct = 0;
  for (const t of DISCOUNT_TIERS) if (going >= t.min) pct = t.pct;
  return pct;
}

export function priceFor(basePrice: number, going: number): number {
  return Math.round(basePrice * (1 - discountFor(going) / 100) * 100) / 100;
}

/** e.g. "2 more for 15% off", or null when the top tier is reached */
export function nextTierCopy(going: number): string | null {
  const next = DISCOUNT_TIERS.find((t) => going < t.min);
  if (!next) return null;
  const n = next.min - going;
  return `${n} more for ${next.pct}% off`;
}

/** 0..1 progress toward the top tier */
export function tierProgress(going: number): number {
  const top = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]!.min;
  return Math.min(1, going / top);
}
