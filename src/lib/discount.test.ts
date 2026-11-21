import { describe, expect, it } from "vitest";
import { discountFor, nextTierCopy, priceFor } from "./discount";

describe("partner venue discounts", () => {
  it("gives no discount below 4 people", () => expect(discountFor(3)).toBe(0));
  it("gives 15% off at 4 people", () => expect(discountFor(4)).toBe(15));
  it("gives 25% off at 6 people", () => expect(discountFor(6)).toBe(25));
  it("prices a €20 plan at €15 with 6 going", () => expect(priceFor(20, 6)).toBe(15));
  it("says 2 more for 15% off at 2 going", () => expect(nextTierCopy(2)).toBe("2 more for 15% off"));
  it("says 1 more for 25% off at 5 going", () => expect(nextTierCopy(5)).toBe("1 more for 25% off"));
});
