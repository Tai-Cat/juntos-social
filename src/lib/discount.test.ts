import { describe, expect, it } from "vitest";
import { LEGACY_TIERS, activeTier, nextTierCopy, parseTiers, priceFor, type DiscountTier } from "./discount";

describe("legacy plans keep their old discounts", () => {
  it("gives no discount below 4 people", () => expect(priceFor(20, 3, LEGACY_TIERS)).toBe(20));
  it("gives 15% off at 4 people", () => expect(priceFor(20, 4, LEGACY_TIERS)).toBe(17));
  it("prices a €20 plan at €15 with 6 going", () => expect(priceFor(20, 6, LEGACY_TIERS)).toBe(15));
  it("says 2 more for 15% off at 2 going", () => expect(nextTierCopy(2, LEGACY_TIERS)).toBe("2 more for 15% off"));
});

describe("host-set discounts", () => {
  const tiers: DiscountTier[] = [{ min: 3, type: "amount", value: 5 }, { min: 5, type: "pct", value: 20 }];
  it("applies an amount off at the minimum", () => expect(priceFor(12, 3, tiers)).toBe(7));
  it("applies the highest tier reached", () => expect(priceFor(12, 5, tiers)).toBe(9.6));
  it("never goes below zero", () => expect(priceFor(3, 3, [{ min: 2, type: "amount", value: 10 }])).toBe(0));
  it("caps percentages at 50%", () => expect(priceFor(10, 2, [{ min: 2, type: "pct", value: 90 }])).toBe(5));
  it("has no discount with no tiers", () => {
    expect(priceFor(10, 8, [])).toBe(10);
    expect(nextTierCopy(1, [])).toBeNull();
  });
  it("ignores malformed tiers", () => expect(parseTiers([{ min: 1, type: "pct", value: 10 }, "x"])).toEqual([]));
  it("finds no active tier below the first minimum", () => expect(activeTier(tiers, 2)).toBeNull());
});
