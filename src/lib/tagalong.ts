import type { Database } from "@/integrations/supabase/types";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type JoinRequest = Database["public"]["Tables"]["join_requests"]["Row"];

export type HostInfo = Pick<Profile, "id" | "name" | "verified" | "reliability_score"> | null;
export type PlanWithHost = Plan & { host: HostInfo };

export const PLAN_SELECT = "*, host:profiles!plans_host_id_fkey(id, name, verified, reliability_score)";

export const AUDIENCE_LABEL: Record<string, string> = {
  everyone: "Everyone",
  women_only: "Women only",
  men_only: "Men only",
  nonbinary_only: "Non-binary only",
  lgbtq_friendly: "LGBTQ+ friendly",
};

export const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function firstName(name?: string | null) {
  return (name ?? "").trim().split(/\s+/)[0] || "Someone";
}

export function hostOf(p: PlanWithHost) {
  if (p.is_example)
    return { name: p.example_host_name ?? "Host", verified: !!p.example_host_verified, reliability: p.example_host_reliability ?? 90 };
  return { name: firstName(p.host?.name), verified: !!p.host?.verified, reliability: p.host?.reliability_score ?? 100 };
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

export function formatDates(a: string, b: string) {
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(a).toLocaleDateString(undefined, o)} – ${new Date(b).toLocaleDateString(undefined, o)}`;
}

export function isDaytime(iso: string) {
  const h = new Date(iso).getHours();
  return h >= 7 && h < 17;
}
export function isEvening(iso: string) {
  const h = new Date(iso).getHours();
  return h >= 17 || h < 2;
}
/** Off-peak: weekday, outside lunch (12–14) and evening rush (18–22) */
export function isOffPeak(iso: string) {
  const d = new Date(iso);
  const day = d.getDay();
  const h = d.getHours();
  return day >= 1 && day <= 5 && !(h >= 12 && h < 14) && !(h >= 18 && h < 22);
}
export function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong";
}

export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}
export function sharedInterests(a: string[], b: string[]) {
  const s = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => s.has(x.toLowerCase()));
}
