import { SignUpPrompt } from "@/components/tagalong/SignUpPrompt";
import {matchesInterests} from "@/lib/interests";
import { fadeExamples } from "@/lib/examples";
import { useExamplesHidden } from "@/hooks/use-app-config";
import { HangNudges } from "@/components/tagalong/HangNudges";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { List, Map, LayoutGrid, CalendarDays, Dumbbell, Utensils, Palette, Laptop, BookOpen, Trees, Dice5, Flower2 } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { EventRow, CompactEventList } from "@/components/tagalong/EventViews";
import { OrganisationDirectory } from "@/components/tagalong/Organisations";
import { GENRES,genreClass } from "@/lib/catalog";
import { useSession } from "@/hooks/use-auth";
import { inBounds, type Bounds } from "@/lib/spatial";
const ExploreMap = lazy(() => import("@/components/tagalong/ExploreMap"));
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBlocks, useMyProfile } from "@/hooks/use-auth";
import { usePlus } from "@/hooks/use-plus";
import { setExplorePrefs, useExplorePrefs, type ExploreView } from "@/lib/explore-prefs";
import { AppShell } from "@/components/tagalong/AppShell";
import { PlanCard } from "@/components/tagalong/PlanCard";
import { Empty } from "@/components/tagalong/bits";
import { ExploreControls } from "@/components/tagalong/ExploreControls";
import { SimilarPeople } from "@/components/tagalong/SimilarPeople";
import { CityInput } from "@/components/tagalong/CityInput";
import { WelcomeScreen } from "@/components/tagalong/WelcomeScreen";
import { PLAN_SELECT, type PlanWithHost } from "@/lib/tagalong";
import { emptyFilters, matchesPlan } from "@/lib/explore-filters";
import { cityName } from "@/lib/catalog";
import { ANYWHERE, WORLDWIDE_KM, bareCity, kmFrom, pointOf, useCityCenters } from "@/lib/geo";
import { useSettings } from "@/components/tagalong/SettingsSheet";
export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Explore plans near you — Juntos" },
      { name: "description", content: "Find your people through colourful local plans." },
      { property: "og:title", content: "Explore plans near you — Juntos" },
      { property: "og:description", content: "Find your people through colourful local plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});
export function Feed() {
  const isHome = useLocation().pathname === "/";
  const { profile } = useMyProfile();
  const blocks = useBlocks();
  const { plus } = usePlus();
  const [filters, setFilters] = useState(() => emptyFilters("Paris"));
  const [search, setSearch] = useState("");
  const prefs = useExplorePrefs();
  const view = prefs.view;
  const setView = (v: ExploreView) => setExplorePrefs({ view: v });
  const {user, ready}=useSession();
  const friendPlans=useQuery({queryKey:["calendar-friends",user?.id],enabled:!!user,queryFn:async()=>{const {data,error}=await supabase.rpc("calendar_friend_plans");if(error)throw error;return data;}});
  const [area, setArea] = useState<Bounds | null>(null);
  const city = prefs.city ?? cityName(profile?.home_city ?? "Paris");
  useEffect(() => {
    setFilters((f) => ({ ...f, city, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  }, [city]);
  const plans = useQuery({
    queryKey: ["plans", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_SELECT)
        .gte("starts_at", new Date().toISOString())
        .neq("status", "cancelled")
        .order("starts_at");
      if (error) throw error;
      return data as unknown as PlanWithHost[];
    },
  });
  const examplesHidden = useExamplesHidden();
  const settings = useSettings().data;
  const radius = settings?.max_distance_km && settings.max_distance_km < WORLDWIDE_KM ? settings.max_distance_km : null;
  const anywhere = city === ANYWHERE;
  const nearMe = !anywhere && prefs.nearMe && !!prefs.position;
  // Every filter except the city; the city is handled below so an empty city never means an empty page.
  const base = useMemo(
    () =>
      fadeExamples(plans.data ?? [], { hideAll: examplesHidden }).filter(
        (p) =>
          !p.is_travel &&
          !(p.host_id && blocks.data?.has(p.host_id)) &&
          (!area || inBounds(p.area_lat, p.area_lng, area)) &&
          matchesPlan(p, { ...filters, city: "" }, plus) &&
          (!search ||
            `${p.title} ${p.activity} ${p.description ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [plans.data, blocks.data, filters, plus, search, area, examplesHidden],
  );
  const centers = useCityCenters([...base.map((p) => p.city), anywhere ? "" : city]);
  const origin = nearMe ? prefs.position : anywhere ? null : centers[bareCity(city).toLowerCase()] ?? null;
  const { visible, note } = useMemo(() => {
    const withKm = base.map((p) => ({ ...p, distance_km: kmFrom(origin, pointOf(p, centers)) }));
    const byKm = (a: { distance_km: number | null }, b: { distance_km: number | null }) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9);
    if (anywhere) return { visible: withKm, note: "" };
    if (nearMe) {
      const close = withKm.filter((p) => p.distance_km !== null && (radius === null || p.distance_km <= radius));
      if (close.length) return { visible: close, note: "" };
      const nearest = [...withKm].filter((p) => p.distance_km !== null).sort(byKm).slice(0, 12);
      return { visible: nearest, note: nearest.length ? `Nothing within ${radius} km of you yet. These are the closest plans.` : "" };
    }
    const inCity = withKm.filter((p) => bareCity(p.city).toLowerCase() === bareCity(city).toLowerCase());
    if (inCity.length) return { visible: inCity, note: "" };
    const nearest = [...withKm].sort(byKm).slice(0, 12);
    return { visible: nearest, note: nearest.length ? `No plans in ${cityName(city)} yet. Here are the closest ones${origin ? ", with distance from " + cityName(city) : ""}.` : "" };
  }, [base, centers, origin, anywhere, nearMe, radius, city]);
  const placeLabel = anywhere ? "everywhere" : nearMe ? "near you" : cityName(city);
  return (
    <AppShell>
      <h1 className="sr-only">Good plans, great company — plans {placeLabel}</h1>
      {isHome && <WelcomeScreen />}
      <div className="relative">
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{anywhere ? "Everywhere" : nearMe ? "Near you" : `In ${cityName(city)}`}</h2>
        <div className="flex rounded-full border border-border bg-card p-1">
          <Button size="sm" variant={view==="browse"?"secondary":"ghost"} onClick={()=>setView("browse")}><LayoutGrid/>Browse</Button>
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => setView("list")}
          >
            <List />
            List
          </Button>
          <Button asChild size="sm" variant="ghost"><Link to="/calendar"><CalendarDays/><span className="hidden sm:inline">Calendar</span></Link></Button>
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
            <ExploreMap plans={visible.map((p) => { const pt = pointOf(p, centers); return pt && p.area_lat === null ? { ...p, area_lat: pt.lat, area_lng: pt.lng } : p; })} city={filters.city} center={origin} onArea={setArea} />
          </Suspense>
        </ClientOnly>
      ) : plans.error ? (
        <Empty>Plans couldn’t load. Please try again.</Empty>
      ) : plans.isLoading ? (
        <Empty>Loading your next plans…</Empty>
      ) : !visible.length ? (
        <Empty>No plans match yet. Try fewer filters, or save an alert.</Empty>
      ) : view==="list" ? <>{note&&<NearestNote text={note}/>}<CompactEventList plans={visible}/></> : <>
        {note&&<NearestNote text={note}/>}
        {!!profile?.interests.length&&<EventRow title="Suggested for you" plans={visible.filter(p=>matchesInterests(p,profile.interests))}/>}
        <EventRow title="This week" plans={visible.filter(p=>new Date(p.starts_at).getTime()<Date.now()+7*86400000)}/>
        {ready && !user && <SignUpPrompt/>}
        <EventRow title={nearMe ? "Closest to you" : anywhere ? "Coming up" : `Near ${cityName(city)}`} plans={nearMe || note ? [...visible].sort((a,b)=>(a.distance_km??1e9)-(b.distance_km??1e9)) : visible}/>
        {user && <EventRow title="Friends are going" plans={visible.filter(p=>friendPlans.data?.some(f=>f.plan_id===p.id))}/>}
        <EventRow title="Free and chill" plans={visible.filter(p=>Number(p.base_price)===0)}/>
        <EventRow title={`Popular ${anywhere ? "everywhere" : nearMe ? "near you" : "in " + cityName(city)}`} plans={[...visible].sort((a,b)=>b.going_count-a.going_count)}/>
        <section className="mt-8 border-t border-border pt-5"><h2 className="text-xl">Browse by category</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{GENRES.map((g,i)=>{const Icon=[Dumbbell,Utensils,Palette,Laptop,BookOpen,Trees,Dice5,Flower2][i]??BookOpen;return <Button key={g.id} variant="outline" className={`h-auto min-w-0 items-start justify-start gap-3 whitespace-normal rounded-lg p-4 text-left ${genreClass(g.id)}`} onClick={()=>setFilters(f=>({...f,genre:f.genre===g.id?"":g.id}))}><Icon className="h-5 w-5 shrink-0"/><span><span className="genre-label block text-xs font-bold">{g.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{visible.filter(p=>p.genre===g.id).length} events</span></span></Button>;})}</div></section>
        <OrganisationDirectory/>
      </>}
      {/* Friends and people only for signed-in members. */}
      {user && (
        <>
          <HangNudges />
          <SimilarPeople
            city={anywhere ? "" : bareCity(city)}
            activity={filters.activity}
            level={plus ? filters.level : ""}
          />
        </>
      )}
    </AppShell>
  );
}

function NearestNote({ text }: { text: string }) {
  return <p className="mb-2 mt-1 rounded-xl border border-border bg-card px-4 py-3 text-sm">{text}</p>;
}
