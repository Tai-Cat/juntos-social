import { describe, expect, it } from "vitest";
import { fadeExamples } from "./examples";
const mk = (n: number, city: string, is_example: boolean) => Array.from({ length: n }, () => ({ city, is_example, visibility: "public" }));
describe("example fade-out", () => {
  it("hides all examples for a city with 6 real upcoming public events", () => {
    const out = fadeExamples([...mk(4, "Paris", true), ...mk(6, "Paris", false)]);
    expect(out.filter((p) => p.is_example)).toHaveLength(0);
  });
  it("tops up to 6 with examples when a city has fewer real events", () => {
    const out = fadeExamples([...mk(5, "Lisbon", true), ...mk(2, "Lisbon", false)]);
    expect(out).toHaveLength(6);
    expect(out.filter((p) => p.is_example)).toHaveLength(4);
  });
  it("always sorts examples after real events", () => {
    const out = fadeExamples([...mk(2, "Rome", true), ...mk(1, "Rome", false)]);
    expect(out[0]?.is_example).toBe(false);
  });
  it("private real events do not count towards the 6", () => {
    const priv = Array.from({ length: 6 }, () => ({ city: "Porto", is_example: false, visibility: "link" }));
    expect(fadeExamples([...priv, ...mk(1, "Porto", true)]).filter((p) => p.is_example)).toHaveLength(1);
  });
  it("admin switch hides every example", () => {
    expect(fadeExamples([...mk(3, "Paris", true)], { hideAll: true })).toHaveLength(0);
  });
});
