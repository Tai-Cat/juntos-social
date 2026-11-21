import { describe, expect, it } from "vitest";
import { safeReturn } from "./auth-return";
describe("sign-in return", () => {
  it("preserves the exact plan and query", () => expect(safeReturn("/plans/123?invite=abc")).toBe("/plans/123?invite=abc"));
  it("rejects external redirects", () => expect(safeReturn("//attacker.example")).toBe("/feed"));
  it("rejects backslash redirects",()=>expect(safeReturn("/\\attacker.example")).toBe("/feed"));
});