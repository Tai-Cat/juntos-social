import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { User } from "@supabase/supabase-js";

export type AdminMember = {
  id: string;
  name: string;
  email: string | null;
  home_city: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  onboarded: boolean;
  verified: boolean;
  reliability_score: number;
  no_show_count: number;
  tier: "free" | "plus" | "club";
  paid_by_stripe: boolean;
  membership_until: string | null;
  has_plus: boolean;
};

export type AdminStats = {
  generatedAt: string;
  signups: { total: number; confirmed: number; unconfirmed: number; neverSignedIn: number; last7: number; last30: number; byDay: { day: string; count: number }[] };
  members: { free: number; plus: number; club: number; paidByStripe: number; manualPlus: number };
  plans: { real: number; examples: number; upcoming: number; cancelled: number; last7: number; byDay: { day: string; count: number }[]; topHosts: { name: string; count: number }[] };
  activity: { joinRequests: number; approvedJoins: number; trips: number };
  locations: { plans: { city: string; count: number; upcoming: number; lat: number | null; lng: number | null }[]; members: { city: string; count: number }[] };
  memberList: AdminMember[];
};

const dayKey = (iso: string) => iso.slice(0, 10);
function lastDays(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10));
  return out;
}

/**
 * Admin-only overview: sign-ups, paid members, plans created and joins.
 * Runs on the server with the service role, after checking the caller is an app admin,
 * so no database change is needed. Paid tier comes from the Stripe webhook's
 * app_metadata.membership; "manual Plus" is user_settings.demo_plus without a Stripe tier.
 */
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Only Juntos app admins can see this.");

    const users: User[] = [];
    for (let page = 1; page < 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const real = users.filter((u) => !u.is_anonymous);

    const [profiles, settings, plans, joins, trips] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,name,home_city,onboarded,verified,reliability_score,no_show_count"),
      supabaseAdmin.from("user_settings").select("user_id,demo_plus"),
      supabaseAdmin.from("plans").select("id,host_id,created_at,starts_at,status,is_example,city,area_lat,area_lng"),
      supabaseAdmin.from("join_requests").select("status", { count: "exact", head: false }),
      supabaseAdmin.from("trips").select("id", { count: "exact", head: true }).eq("is_example", false),
    ]);
    const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const plusById = new Map((settings.data ?? []).map((s) => [s.user_id, !!s.demo_plus]));
    const now = Date.now();

    const memberList: AdminMember[] = real.map((u) => {
      const p = profileById.get(u.id);
      const meta = (u.app_metadata ?? {}) as { membership?: string | null; membership_until?: string | null };
      const until = meta.membership_until ?? null;
      const stripeActive = !!meta.membership && (!until || new Date(until).getTime() > now);
      const manual = plusById.get(u.id) ?? false;
      const tier: AdminMember["tier"] = stripeActive ? (meta.membership === "club" ? "club" : "plus") : manual ? "plus" : "free";
      return {
        id: u.id,
        name: p?.name || (u.user_metadata?.["name"] as string | undefined) || "",
        email: u.email ?? null,
        home_city: p?.home_city ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: !!u.email_confirmed_at,
        onboarded: !!p?.onboarded,
        verified: !!p?.verified,
        reliability_score: p?.reliability_score ?? 0,
        no_show_count: p?.no_show_count ?? 0,
        tier,
        paid_by_stripe: stripeActive,
        membership_until: stripeActive ? until : null,
        has_plus: tier !== "free",
      };
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));

    const days30 = lastDays(30);
    const since = (d: number) => now - d * 86400000;
    const signupCount = new Map<string, number>();
    for (const u of real) signupCount.set(dayKey(u.created_at), (signupCount.get(dayKey(u.created_at)) ?? 0) + 1);

    const realPlans = (plans.data ?? []).filter((p) => !p.is_example);
    const planCount = new Map<string, number>();
    const hostCount = new Map<string, number>();
    for (const p of realPlans) {
      planCount.set(dayKey(p.created_at), (planCount.get(dayKey(p.created_at)) ?? 0) + 1);
      if (p.host_id) hostCount.set(p.host_id, (hostCount.get(p.host_id) ?? 0) + 1);
    }

    const cityKey = (c: string | null | undefined) => (c ?? "").split(",")[0]!.trim() || "Not set";
    const planCities = new Map<string, { city: string; count: number; upcoming: number; lat: number | null; lng: number | null }>();
    for (const p of realPlans) {
      const k = cityKey(p.city);
      const row = planCities.get(k.toLowerCase()) ?? { city: k, count: 0, upcoming: 0, lat: null, lng: null };
      row.count++;
      if (p.status !== "cancelled" && new Date(p.starts_at).getTime() > now) row.upcoming++;
      if (row.lat === null && p.area_lat !== null && p.area_lng !== null) { row.lat = p.area_lat; row.lng = p.area_lng; }
      planCities.set(k.toLowerCase(), row);
    }
    const memberCities = new Map<string, { city: string; count: number }>();
    for (const m of memberList) {
      const k = cityKey(m.home_city);
      const row = memberCities.get(k.toLowerCase()) ?? { city: k, count: 0 };
      row.count++;
      memberCities.set(k.toLowerCase(), row);
    }
    return {
      locations: {
        plans: [...planCities.values()].sort((a, b) => b.count - a.count),
        members: [...memberCities.values()].sort((a, b) => b.count - a.count),
      },
      generatedAt: new Date().toISOString(),
      signups: {
        total: real.length,
        confirmed: real.filter((u) => !!u.email_confirmed_at).length,
        unconfirmed: real.filter((u) => !u.email_confirmed_at).length,
        neverSignedIn: real.filter((u) => !u.last_sign_in_at).length,
        last7: real.filter((u) => new Date(u.created_at).getTime() >= since(7)).length,
        last30: real.filter((u) => new Date(u.created_at).getTime() >= since(30)).length,
        byDay: days30.map((day) => ({ day, count: signupCount.get(day) ?? 0 })),
      },
      members: {
        free: memberList.filter((m) => m.tier === "free").length,
        plus: memberList.filter((m) => m.tier === "plus").length,
        club: memberList.filter((m) => m.tier === "club").length,
        paidByStripe: memberList.filter((m) => m.paid_by_stripe).length,
        manualPlus: memberList.filter((m) => m.tier !== "free" && !m.paid_by_stripe).length,
      },
      plans: {
        real: realPlans.length,
        examples: (plans.data ?? []).length - realPlans.length,
        upcoming: realPlans.filter((p) => p.status !== "cancelled" && new Date(p.starts_at).getTime() > now).length,
        cancelled: realPlans.filter((p) => p.status === "cancelled").length,
        last7: realPlans.filter((p) => new Date(p.created_at).getTime() >= since(7)).length,
        byDay: days30.map((day) => ({ day, count: planCount.get(day) ?? 0 })),
        topHosts: [...hostCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ name: profileById.get(id)?.name || "Member", count })),
      },
      activity: {
        joinRequests: joins.data?.length ?? 0,
        approvedJoins: (joins.data ?? []).filter((j) => j.status === "approved").length,
        trips: trips.count ?? 0,
      },
      memberList,
    };
  });
