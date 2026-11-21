import { describe, it, expect } from "vitest";
import { emptyFilters, matchesPlan } from "./explore-filters";
import { canUseLevel, PLUS_MONTHLY_EUR } from "./catalog";
import type { Plan } from "./tagalong";
const p: Plan = {
  id: "a",
  age_min:null,age_max:null,organisation_id:null,
  is_private: false, ends_at: null, has_virtual_option: false, interest_only: false, link_enabled: true, members_note: null, share_token: "t", venue_tbc: false, visibility: "public", private_participants: [], photos: [], interest_tags: [], ticket_url: null, area_lat: null, area_lng: null, what_to_bring: "", duration_minutes: 120, host_intro: "", early_booking: false,
  host_id: null,
  title: "Tennis",
  category: "tennis",
  activity: "tennis",
  genre: "active",
  image_url: null,
  required_level: "advanced",
  area_label: "Paris centre",
  audience: "everyone",
  auto_approve: false,
  base_going: 1,
  base_price: 20,
  capacity: 6,
  city: "Paris",
  country: "France",
  created_at: "2026-11-21T00:00:00Z",
  description: null,
  example_host_name: null,
  example_host_reliability: null,
  example_host_verified: null,
  going_count: 1,
  is_example: false,
  is_public_place: true,
  is_travel: false,
  kind: "chill",
  parent_plan_id: null,
  recurring_weekly: false,
  starts_at: "2026-11-22T18:00:00Z",
  step_free: true,
};
describe("Explore rules", () => {
  it("Plus is 5 EUR monthly", () => expect(PLUS_MONTHLY_EUR).toBe(5));
  it("free users cannot use advanced filtering", () =>
    expect(canUseLevel(false, "advanced")).toBe(false));
  it("Plus users can use advanced filtering", () =>
    expect(canUseLevel(true, "advanced")).toBe(true));
  it("levels are not applied for free users", () =>
    expect(matchesPlan(p, { ...emptyFilters("Paris"), level: "beginner" }, false)).toBe(true));
  it("Plus level filter excludes advanced tennis from beginner", () =>
    expect(matchesPlan(p, { ...emptyFilters("Paris"), level: "beginner" }, true)).toBe(false));
  it("all abilities excludes a required advanced level", () =>
    expect(matchesPlan(p, { ...emptyFilters("Paris"), allAbilities: true })).toBe(false));
  it("evening tennis in Paris matches", () =>
    expect(
      matchesPlan(p, {
        ...emptyFilters("Paris"),
        activity: "tennis",
        time: "evening",
        price: "10to30",
      }),
    ).toBe(true));
  it("free excludes a 20 EUR plan", () =>
    expect(matchesPlan(p, { ...emptyFilters("Paris"), price: "free" })).toBe(false));
  it("under 10 excludes exactly 10 EUR", () =>
    expect(
      matchesPlan({ ...p, base_price: 10 }, { ...emptyFilters("Paris"), price: "under10" }),
    ).toBe(false));
  it("30 EUR belongs to 30 to 60", () =>
    expect(
      matchesPlan({ ...p, base_price: 30 }, { ...emptyFilters("Paris"), price: "30to60" }),
    ).toBe(true));
  it("60 EUR belongs to 60 plus", () =>
    expect(
      matchesPlan({ ...p, base_price: 60 }, { ...emptyFilters("Paris"), price: "60plus" }),
    ).toBe(true));
  it("date honours saved timezone", () =>
    expect(
      matchesPlan(
        { ...p, starts_at: "2026-11-22T23:30:00Z" },
        { ...emptyFilters("Paris"), timezone: "Europe/Paris", date: "2026-11-23" },
      ),
    ).toBe(true));
  it("morning and daytime exclude evening", () =>
    expect(matchesPlan(p, { ...emptyFilters("Paris"), time: "morning", daytime: true })).toBe(
      false,
    ));
  it("step-free excludes inaccessible plans", () =>
    expect(
      matchesPlan({ ...p, step_free: false }, { ...emptyFilters("Paris"), stepFree: true }),
    ).toBe(false));
});
import { priceLabel } from "./tagalong";
describe("price labels", () => {
  it("shows Price TBA for a to-be-announced price", () => expect(priceLabel({ base_price: -1 })).toBe("Price TBA"));
  it("shows Singapore prices in SGD", () => expect(priceLabel({ base_price: 29.98, city: "Singapore" })).toBe("S$29.98"));
  it("shows free plans as Free", () => expect(priceLabel({ base_price: 0 })).toBe("Free"));
});
