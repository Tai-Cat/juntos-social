import { describe, expect, it } from "vitest";
import { isSafeDescription, searchTerms } from "./image-search.server";
describe("plan photo searches", () => {
  it("market plans search for fruit and vegetable stalls, never the title", () => {
    expect(searchTerms("markets", "Marché d'Aligre wander")[0]).toBe("fruit vegetable market stall");
    expect(searchTerms("markets", "Marché d'Aligre wander").join(" ")).not.toContain("wander");
  });
  it("the gala uses a dinner table setting", () => {
    expect(searchTerms("dinner parties", "MIM2028 Winter Gala Dinner")[0]).toBe("gala dinner table setting");
  });
  it("rejects stock-chart and people photos", () => {
    expect(isSafeDescription("stock market trading chart")).toBe(false);
    expect(isSafeDescription("woman holding apples")).toBe(false);
    expect(isSafeDescription("crates of tomatoes at a market")).toBe(true);
  });
});
