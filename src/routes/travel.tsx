import { useState } from "react";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { TripCard } from "@/components/tagalong/TripCard";
import { AddTripButton } from "@/components/tagalong/TripForm";
import { PlanCard } from "@/components/tagalong/PlanCard";
import { PLAN_SELECT, type PlanWithHost } from "@/lib/tagalong";
import { Empty } from "@/components/tagalong/bits";
export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "Travel together — Juntos" },
      {
        name: "description",
        content: "Meet overlapping travellers and join plans in your next city.",
      },
      { property: "og:title", content: "Travel together — Juntos" },
      {
        property: "og:description",
        content: "Meet overlapping travellers and join plans in your next city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Travel,
});
function Travel() {
  const { user } = useMyProfile();
  const [citySearch,setCitySearch]=useState("");
  const [when,setWhen]=useState("");
  const [who,setWho]=useState("");
  const onDate=(d:string)=>!when||d.slice(0,7)===when;
  const trips = useQuery({
    queryKey: ["trips", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date");
      if (error) throw error;
      return data;
    },
  });
  const examples = useQuery({
    queryKey: ["trips", "examples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("is_example", true)
        .order("start_date");
      if (error) throw error;
      return data;
    },
  });
  const plans = useQuery({
    queryKey: ["plans", "travel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_SELECT)
        .eq("is_travel", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as unknown as PlanWithHost[];
    },
  });
  return (
    <AppShell>
      <h1 className="text-4xl">Somewhere new, together</h1>
      <div className="mt-5 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:rounded-full">
        <label className="border-b border-border px-5 py-2 sm:border-b-0 sm:border-r"><span className="block text-xs font-bold">Where</span><Input className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Where" placeholder="Search a city" value={citySearch} onChange={e=>setCitySearch(e.target.value)}/></label>
        <label className="border-b border-border px-5 py-2 sm:border-b-0 sm:border-r"><span className="block text-xs font-bold">When</span><Input type="month" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="When" value={when} onChange={e=>setWhen(e.target.value)}/></label>
        <label className="px-5 py-2"><span className="block text-xs font-bold">Who</span><Input className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Who" placeholder="Interests, e.g. surfing" value={who} onChange={e=>setWho(e.target.value)}/></label>
      </div>
      <div className="my-5 max-w-xs">
        <AddTripButton />
      </div>
      <h2 className="mb-4 text-2xl">Your trips</h2>
      {!trips.data?.length ? (
        <Empty>No trips yet. Where are you going next?</Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trips.data.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      )}
      <h2 className="mb-4 mt-8 text-2xl">Travellers on the move</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {examples.data?.filter(t=>`${t.city} ${t.country}`.toLowerCase().includes(citySearch.toLowerCase())&&onDate(t.start_date)&&(!who||t.interests.join(" ").toLowerCase().includes(who.toLowerCase()))).map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
      <h2 className="mb-4 mt-8 text-2xl">Plans worth the trip</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.data?.filter(t=>`${t.city} ${t.country}`.toLowerCase().includes(citySearch.toLowerCase())&&onDate(t.starts_at)&&(!who||`${t.activity} ${t.title}`.toLowerCase().includes(who.toLowerCase()))).map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>
    </AppShell>
  );
}
