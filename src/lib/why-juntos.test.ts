import { afterEach, describe, expect, it } from "vitest";
import { WHY_DISMISS_KEY, dismissWhyLine, whyLineDismissed } from "./why-juntos";

describe("why-juntos slim line", () => {
  afterEach(() => localStorage.removeItem(WHY_DISMISS_KEY));

  it("shows the line while nothing was dismissed", () => {
    expect(whyLineDismissed()).toBe(false);
  });

  it("hides the line for this browser once the X is tapped", () => {
    dismissWhyLine();
    expect(whyLineDismissed()).toBe(true);
    expect(localStorage.getItem(WHY_DISMISS_KEY)).toBe("1");
  });

  it("keeps the line hidden on the next visit", () => {
    localStorage.setItem(WHY_DISMISS_KEY, "1");
    expect(whyLineDismissed()).toBe(true);
  });
});
