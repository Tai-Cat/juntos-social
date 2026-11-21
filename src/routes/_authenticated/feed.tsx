import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBlocks, useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { PlanCard } from "@/components/tagalong/PlanCard";
import { AddTripButton } from "@/components/tagalong/TripForm";
import { Chip, Empty, Section } from "@/components/tagalong/bits";
import { AUDIENCE_LABEL, PLAN_SELECT, formatDates, isDaytime, isEvening, isOffPeak, isToday, type PlanWithHost } from "@/lib/tagalong";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Plans near you — Tagalong" }, { name: "description", content: "Join plans happening near you or where you're travelling." }] }),
  component: Feed,
});

const FILTERS = ["Today", "Daytime", "Evening", "Off-peak", "Free", "Partner venues", "Step-free"] as const;
type Filter = (typeof FILTERS)[number];

function applyFilter(p: PlanWithHost, f: Filter) {
  switch (f) {
    case "Today": return isToday(p.starts_at);
    case "Daytime": return isDaytime(p.starts_at);
    case "Evening": return isEvening(p.starts_at);
    case "Off-peak": return isOffPeak(p.starts_at);
    case "Free": return Number(p.base_price) === 0;
    case "Partner venues": return p.kind === "partner_venue";
    case "Step-free": return p.step_free;
  }
}

function Feed() {
  const { profile, user } = useMyProfile();
  const blocks = useBlocks();
  const [tab, setTab] = useState<"near" | "travel">("near");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [audience, setAudience] = useState<string | null>(null);
  const city = profile?.home_city ?? "Paris";

  const plans = useQuery({
    queryKey: ["plans", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select(PLAN_SELECT).gte("starts_at", new Date().toISOString()).order("starts_at");
      if (error) throw error;
      return data as unknown as PlanWithHost[];
    },
  });
  const myTrips = useQuery({
    queryKey: ["trips", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("trips").select("*").eq("user_id", user!.id).order("start_date")).data ?? [],
  });

  const visible = useMemo(() => (plans.data ?? []).filter((p) => !(p.host_id && blocks.data?.has(p.host_id))), [plans.data, blocks.data]);
  const near = visible
    .filter((p) => !p.is_travel && p.city.toLowerCase() === city.toLowerCase())
    .filter((p) => filters.every((f) => applyFilter(p, f)))
    .filter((p) => !audience || p.audience === audience);
  const tripCities = new Set((myTrips.data ?? []).map((t) => t.city.toLowerCase()));
  const travelPlans = visible.filter((p) => p.is_travel && (tripCities.size === 0 || tripCities.has(p.city.toLowerCase())));

  const toggle = (f: Filter) => setFilters((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  return (
    <AppShell>
      <div className="grid grid-cols-2 border-b border-border">
        {(["near", "travel"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 pb-3 text-sm", tab === t ? "border-tangerine text-foreground" : "border-transparent text-muted-foreground")}>
            {t === "near" ? "Near you" : "Travelling"}
          </button>
        ))}
      </div>

      {tab === "near" ? (
        <div className="mt-5 space-y-5">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {FILTERS.map((f) => <Chip key={f} active={filters.includes(f)} onClick={() => toggle(f)}>{f}</Chip>)}
          </div>
          <div>
            <p className="eyebrow mb-2">Audience</p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {Object.entries(AUDIENCE_LABEL).map(([k, label]) => (
                <Chip key={k} active={audience === k || (k === "everyone" && !audience)} onClick={() => setAudience(k === "everyone" ? null : audience === k ? null : k)}>{label}</Chip>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{near.length} plans in {city}</p>
          <div className="space-y-4">
            {plans.isLoading ? <Empty>Loading plans…</Empty> : near.length === 0 ? <Empty>No plans match. Try fewer filters, or post your own.</Empty> : near.map((p) => <PlanCard key={p.id} plan={p} />)}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <Section title="Your trips">
            <div className="space-y-3">
              {(myTrips.data ?? []).map((t) => (
                <Link key={t.id} to="/trips/$tripId" params={{ tripId: t.id }} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-foreground/30">
                  <div><p className="font-display text-lg">{t.city}</p><p className="text-xs text-muted-foreground">{t.country} · {formatDates(t.start_date, t.end_date)}</p></div>
                  <span className="text-sm text-muted-foreground">Open</span>
                </Link>
              ))}
              <AddTripButton />
            </div>
          </Section>
          <Section title={tripCities.size ? "Plans where you're going" : "Travel plans"}>
            <div className="space-y-4">
              {travelPlans.length === 0 ? <Empty>No plans in your trip cities yet. Add a trip to Lisbon, Porto, Rome or Barcelona to see examples.</Empty> : travelPlans.map((p) => <PlanCard key={p.id} plan={p} />)}
            </div>
          </Section>
        </div>
      )}
    </AppShell>
  );
}
