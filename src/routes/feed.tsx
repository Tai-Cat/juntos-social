import { HangNudges } from "@/components/tagalong/HangNudges";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { List, Map } from "lucide-react";
import { inBounds, type Bounds } from "@/lib/spatial";
const ExploreMap = lazy(() => import("@/components/tagalong/ExploreMap"));
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LocationPicker, type Position } from "@/components/tagalong/LocationPicker";
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
export const Route = createFileRoute("/feed")({
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
export function Feed() {
  const { profile } = useMyProfile();
  const blocks = useBlocks();
  const { plus } = usePlus();
  const [filters, setFilters] = useState(() => emptyFilters("Paris"));
  const [location, setLocation] = useState("Paris");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [area, setArea] = useState<Bounds | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
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
          (!area || inBounds(p.area_lat, p.area_lng, area)) &&
          matchesPlan(p, filters, plus) &&
          (!search ||
            `${p.title} ${p.activity} ${p.description ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [plans.data, blocks.data, filters, plus, search, area],
  );
  return (
    <AppShell>
      <section className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LocationPicker
            value={location}
            onChange={(v) => {
              setLocation(v);
              setFilters((f) => ({ ...f, city: v }));
            }}
            onPosition={setPosition}
          />
          <span className="rounded-full bg-sunflower px-3 py-2 text-xs font-bold">
            {visible.length} plans
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold">Tagalong</h1>
        <p className="mt-2 text-base">
          Turn your plans into plus-ones, and venues' empty slots into full tables.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
          <span className="text-tangerine">01 · Find a plan</span>
          <span className="text-grass">02 · Join the good company</span>
          <span className="text-sky">03 · Meet in real life</span>
        </div>
      </section>
      <div className="relative mt-5">
        <Search className="absolute left-4 top-4 h-5 w-5 text-tangerine" />
        <Input
          aria-label="Search plans"
          placeholder="What would you like to do?"
          className="h-14 rounded-full bg-card pl-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ExploreControls filters={filters} onChange={setFilters} plus={plus} />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl">Near you</h2>
        <div className="flex rounded-full border border-border bg-card p-1">
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => setView("list")}
          >
            <List />
            List
          </Button>
          <Button
            size="sm"
            variant={view === "map" ? "secondary" : "ghost"}
            onClick={() => setView("map")}
          >
            <Map />
            Map
          </Button>
        </div>
      </div>
      {view === "map" ? (
        <ClientOnly fallback={<Empty>Loading map…</Empty>}>
          <Suspense fallback={<Empty>Loading map…</Empty>}>
            <ExploreMap plans={visible} city={filters.city} onArea={setArea} />
          </Suspense>
        </ClientOnly>
      ) : plans.error ? (
        <Empty>Plans couldn’t load. Please try again.</Empty>
      ) : plans.isLoading ? (
        <Empty>Loading your next plans…</Empty>
      ) : !visible.length ? (
        <Empty>No plans match yet. Try fewer filters, or save an alert.</Empty>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PlanCard key={p.id} plan={p} position={position} />
          ))}
        </div>
      )}
      <HangNudges />
      <SimilarPeople
        city={filters.city}
        activity={filters.activity}
        level={plus ? filters.level : ""}
      />
    </AppShell>
  );
}
