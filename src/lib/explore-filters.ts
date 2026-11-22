import type { Plan } from "./tagalong";
import { normalizeActivity } from "./catalog";
export type ExploreFilters = {
  city: string;
  date: string;
  time: string;
  price: string;
  audience: string;
  genre: string;
  activity: string;
  level: string;
  allAbilities: boolean;
  stepFree: boolean;
  daytime: boolean;
  timezone: string;
  age?: string;
  organisation?: string;
};
export const emptyFilters = (city: string): ExploreFilters => ({
  city,
  date: "",
  time: "",
  price: "",
  audience: "",
  genre: "",
  activity: "",
  level: "",
  allAbilities: false,
  stepFree: false,
  daytime: false,
  timezone: "UTC",
});
export function matchesPlan(p: Plan, f: ExploreFilters, plus = true) {
  if (f.organisation && p.organisation_id !== f.organisation) return false;
  if (f.age) {
    const [lo,hi]=f.age.split("-").map(Number);
    if (lo!==undefined && hi!==undefined && ((p.age_min??18)>hi || (p.age_max??120)<lo)) return false;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: f.timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(p.starts_at));
  const val = (type: string) => parts.find((x) => x.type === type)?.value ?? "";
  const h = Number(val("hour"));
  const date = `${val("year")}-${val("month")}-${val("day")}`;
  if (f.city && p.city.toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.date && f.date !== date) return false;
  if (
    f.time &&
    !(
      {
        morning: h >= 5 && h < 12,
        afternoon: h >= 12 && h < 17,
        evening: h >= 17 && h < 22,
        late: h >= 22 || h < 5,
      } as Record<string, boolean>
    )[f.time]
  )
    return false;
  const n = Number(p.base_price);
  if (
    f.price &&
    !(
      {
        free: n === 0,
        under10: n > 0 && n < 10,
        "10to30": n >= 10 && n < 30,
        "30to60": n >= 30 && n < 60,
        "60plus": n >= 60,
      } as Record<string, boolean>
    )[f.price]
  )
    return false;
  if (f.audience && p.audience !== f.audience) return false;
  if (f.genre && p.genre !== f.genre) return false;
  if (f.activity && normalizeActivity(p.activity) !== normalizeActivity(f.activity)) return false;
  if (plus && f.level && p.required_level !== f.level) return false;
  if (f.allAbilities && p.required_level !== "any") return false;
  if (f.stepFree && !p.step_free) return false;
  if (f.daytime && !(h >= 7 && h < 17)) return false;
  return true;
}
