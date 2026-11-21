/** The "Why Juntos" problem statement, shown on About and as a slim line on Explore. */
export const WHY_JUNTOS =
  "Making friends as an adult is hard: finding a place, matching schedules and the cost all get in the way. Juntos sorts all three. The plan, the time and a group discount are already there; you just tap Join.";

/** localStorage key: once set, the slim Explore line stays hidden for this browser. */
export const WHY_DISMISS_KEY = "juntos-why-line-dismissed";

export function whyLineDismissed(): boolean {
  try {
    return localStorage.getItem(WHY_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissWhyLine(): void {
  try {
    localStorage.setItem(WHY_DISMISS_KEY, "1");
  } catch {
    /* storage unavailable: the line simply comes back next visit */
  }
}
