import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBlocks, useMyProfile } from "@/hooks/use-auth";
import { usePlus } from "@/hooks/use-plus";
import { AppShell } from "@/components/tagalong/AppShell";
import { PlanCard } from "@/components/tagalong/PlanCard";
import { Empty } from "@/components/tagalong/bits";
import { ExploreControls } from "@/components/tagalong/ExploreControls";
import { SimilarPeople } from "@/components/tagalong/SimilarPeople";
import { CityInput } from "@/components/tagalong/CityInput";
import { PLAN_SELECT, type PlanWithHost } from "@/lib/tagalong";
import { emptyFilters, matchesPlan } from "@/lib/explore-filters";
import { cityName } from "@/lib/catalog";
export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Explore plans near you — Tagalong" },
      { name: "description", content: "Find your people through colourful local plans." },
      { property: "og:title", content: "Explore plans near you — Tagalong" },
      { property: "og:description", content: "Find your people through colourful local plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});
function Feed() {
  const { profile } = useMyProfile();
  const blocks = useBlocks();
  const { plus } = usePlus();
  const [filters, setFilters] = useState(() => emptyFilters("Paris"));
  const [location, setLocation] = useState("Paris");
  useEffect(() => {
    const city = cityName(profile?.home_city ?? "Paris");
    setLocation(city);
    setFilters((f) => ({ ...f, city, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  }, [profile?.home_city]);
  const plans = useQuery({
    queryKey: ["plans", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_SELECT)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as unknown as PlanWithHost[];
    },
  });
  const visible = useMemo(
    () =>
      (plans.data ?? []).filter(
        (p) =>
          !p.is_travel &&
          !(p.host_id && blocks.data?.has(p.host_id)) &&
          matchesPlan(p, filters, plus),
      ),
    [plans.data, blocks.data, filters, plus],
  );
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="eyebrow">A little plan. A new connection.</p>
          <h1 className="mt-2 text-4xl font-semibold">Near you</h1>
        </div>
        <span className="rounded-full bg-sunflower px-3 py-2 text-xs font-bold">
          {visible.length} plans
        </span>
      </div>
      <div className="mt-5 max-w-sm">
        <CityInput
          id="explore-city"
          value={location}
          onChange={(v) => {
            setLocation(v);
            setFilters((f) => ({ ...f, city: cityName(v) }));
          }}
        />
      </div>
      <ExploreControls filters={filters} onChange={setFilters} plus={plus} />
      {plans.error ? (
        <Empty>Plans couldn’t load. Please try again.</Empty>
      ) : plans.isLoading ? (
        <Empty>Loading your next plans…</Empty>
      ) : !visible.length ? (
        <Empty>No plans match yet. Try fewer filters, or save an alert.</Empty>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      )}
      <SimilarPeople
        city={filters.city}
        activity={filters.activity}
        level={plus ? filters.level : ""}
      />
    </AppShell>
  );
}
