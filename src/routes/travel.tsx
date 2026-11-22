import { useState } from "react";
import { fadeExamples } from "@/lib/examples";
import { useExamplesHidden } from "@/hooks/use-app-config";
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
import { Switch } from "@/components/ui/switch";
import { Minus, Plus } from "lucide-react";
import { CityPhoto } from "@/hooks/use-city-photo";
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
  const [travellers,setTravellers]=useState(1);
  const [groupOnly,setGroupOnly]=useState(false);
  const [interest,setInterest]=useState("");
  const [whereOpen,setWhereOpen]=useState(false);
  const who=interest.trim();
  const examplesHidden=useExamplesHidden();
  const fits=(p:PlanWithHost)=>(p.capacity-p.going_count)>=travellers&&(!groupOnly||p.capacity>=4);
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
        .neq("status", "cancelled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as unknown as PlanWithHost[];
    },
  });
  const cityResults=(()=>{const m=new Map<string,{city:string;country:string}>();for(const r of [...(examples.data??[]),...(plans.data??[])])if(r.city&&!m.has(r.city))m.set(r.city,{city:r.city,country:r.country});const q=citySearch.toLowerCase().trim();return [...m.values()].filter(c=>!q||`${c.city} ${c.country}`.toLowerCase().includes(q)).slice(0,6);})();
  return (
    <AppShell>
      <h1 className="text-4xl">Somewhere new, together</h1>
      <div className="mt-5 grid grid-cols-1 rounded-2xl border border-border bg-card sm:grid-cols-3">
        <div className="relative border-b border-border px-5 py-2 sm:border-b-0 sm:border-r">
          <label><span className="block text-xs font-bold">Where</span><Input className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Where" placeholder="Search a city" value={citySearch} onFocus={()=>setWhereOpen(true)} onBlur={()=>setTimeout(()=>setWhereOpen(false),150)} onChange={e=>{setCitySearch(e.target.value);setWhereOpen(true);}}/></label>
          {whereOpen&&cityResults.length>0&&<ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">{cityResults.map(c=><li key={c.city}><button type="button" className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted" onMouseDown={e=>e.preventDefault()} onClick={()=>{setCitySearch(c.city);setWhereOpen(false);}}><CityPhoto city={c.city} alt={`${c.city} skyline`} className="h-12 w-16 shrink-0 rounded-md object-cover"/><span><span className="block text-sm font-bold">{c.city}</span><span className="text-xs text-muted-foreground">{c.country}</span></span></button></li>)}</ul>}
        </div>
        <label className="border-b border-border px-5 py-2 sm:border-b-0 sm:border-r"><span className="block text-xs font-bold">When</span><Input type="month" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="When" value={when} onChange={e=>setWhen(e.target.value)}/></label>
        <div className="px-5 py-2">
          <span className="block text-xs font-bold">Who</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">{travellers} traveller{travellers>1?"s":""}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Fewer travellers" disabled={travellers<=1} onClick={()=>setTravellers(n=>Math.max(1,n-1))} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40"><Minus className="h-3 w-3"/></button>
              <button type="button" aria-label="More travellers" disabled={travellers>=10} onClick={()=>setTravellers(n=>Math.min(10,n+1))} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40"><Plus className="h-3 w-3"/></button>
            </div>
          </div>
          <label className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">Looking for a group<Switch checked={groupOnly} onCheckedChange={setGroupOnly} aria-label="Looking for a group"/></label>
        </div>
      </div>
      <label className="mt-3 flex max-w-sm items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5"><span className="text-xs font-bold">Interests</span><Input className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Interests (optional)" placeholder="Optional, e.g. surfing" value={interest} onChange={e=>setInterest(e.target.value)}/></label>
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
        {fadeExamples([...(trips.data??[]).filter(t=>!t.is_example),...(examples.data??[])],{hideAll:examplesHidden}).filter(t=>t.is_example).filter(t=>`${t.city} ${t.country}`.toLowerCase().includes(citySearch.toLowerCase())&&onDate(t.start_date)&&(!who||t.interests.join(" ").toLowerCase().includes(who.toLowerCase()))).map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
      <h2 className="mb-4 mt-8 text-2xl">Plans worth the trip</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {fadeExamples(plans.data??[],{hideAll:examplesHidden}).filter(t=>`${t.city} ${t.country}`.toLowerCase().includes(citySearch.toLowerCase())&&onDate(t.starts_at)&&fits(t)&&(!who||`${t.activity} ${t.title}`.toLowerCase().includes(who.toLowerCase()))).map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>
    </AppShell>
  );
}
