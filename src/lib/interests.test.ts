import { describe, expect, it } from "vitest";
import { addInterest, MAX_INTERESTS, moveInterest } from "./interests";
describe("personal interests", () => {
  it("lowercases and de-duplicates a new interest", () => expect(addInterest(["bonsai"], "  Urban   Beekeeping ")).toEqual(["bonsai", "urban beekeeping"]));
  it("ignores an interest already added in another case", () => expect(addInterest(["bonsai"], "BONSAI")).toEqual(["bonsai"]));
  it("allows at most 30 interests", () => expect(addInterest(Array.from({ length: MAX_INTERESTS }, (_, i) => `i${i}`), "one more")).toBeNull());
  it("reorders interests", () => expect(moveInterest(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]));
});
import { matchesInterests } from "./interests";
describe("suggested plans", () => {
  it("matches a plan tagged with a personal interest", () => expect(matchesInterests({ activity: "co-working", interest_tags: ["urban beekeeping"] }, ["Urban Beekeeping"])).toBe(true));
  it("does not match unrelated plans", () => expect(matchesInterests({ activity: "pottery", interest_tags: [] }, ["bonsai"])).toBe(false));
});
