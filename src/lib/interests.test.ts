import { describe, expect, it } from "vitest";
import { addInterest, INTEREST_LEVELS, matchesInterests, normalizeInterest } from "./interests";
describe("personal interests", () => {
  it("lowercases and de-duplicates a new interest", () => expect(addInterest(["bonsai"], "  Urban   Beekeeping ")).toEqual(["bonsai", "urban beekeeping"]));
  it("ignores an interest already added in another case", () => expect(addInterest(["bonsai"], "BONSAI")).toEqual(["bonsai"]));
  it("merges older alternate spellings into one interest", () => {
    expect(normalizeInterest("Bird Watching")).toBe("birdwatching");
    expect(addInterest(["book clubs"], "Book Club")).toEqual(["book club"]);
  });
  it("has no cap: a 31st and 100th interest can be added", () => {
    const thirty = Array.from({ length: 30 }, (_, i) => `i${i}`);
    expect(addInterest(thirty, "one more")).toHaveLength(31);
    expect(addInterest(Array.from({ length: 99 }, (_, i) => `i${i}`), "hundredth")).toHaveLength(100);
  });
  it("offers Beginner, Intermediate, Advanced, Professional or Not set", () => expect(INTEREST_LEVELS.map((l) => l.label)).toEqual(["Not set", "Beginner", "Intermediate", "Advanced", "Professional"]));
});
describe("suggested plans", () => {
  it("matches a plan tagged with a personal interest", () => expect(matchesInterests({ activity: "co-working", interest_tags: ["urban beekeeping"] }, ["Urban Beekeeping"])).toBe(true));
  it("does not match unrelated plans", () => expect(matchesInterests({ activity: "pottery", interest_tags: [] }, ["bonsai"])).toBe(false));
  it("matches legacy activity names to their canonical interest", () => expect(matchesInterests({ activity: "bird watching", interest_tags: [] }, ["birdwatching"])).toBe(true));
});
