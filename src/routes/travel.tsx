import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fadeExamples } from "@/lib/examples";
import { useExamplesHidden } from "@/hooks/use-app-config";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile, useBlocks } from "@/hooks/use-auth";
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
  const blocks = useBlocks();
  const [citySearch,setCitySearch]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [timeOfDay,setTimeOfDay]=useState("any");
  const [budget,setBudget]=useState("any");
  const [travellers,setTravellers]=useState(1);
  const [groupOnly,setGroupOnly]=useState(false);
  const [interest,setInterest]=useState("");
  const [whereOpen,setWhereOpen]=useState(false);
  const who=interest.trim();
  const examplesHidden=useExamplesHidden();
  const fits=(p:PlanWithHost)=>(p.capacity-p.going_count)>=travellers&&(!groupOnly||p.capacity>=4);
  const cityFits=(city:string,country:string)=>!citySearch.trim()||`${city} ${country}`.toLowerCase().includes(citySearch.trim().toLowerCase());
  const tripDateFits=(start:string,end:string)=>{
    if(dateFrom && end < dateFrom) return false;
    if(dateTo && start > dateTo) return false;
    return true;
  };
  const planDateFits=(value:string)=>{
    const date=new Date(value);
    if(dateFrom && date < new Date(dateFrom+"T00:00:00")) return false;
    if(dateTo && date > new Date(dateTo+"T23:59:59")) return false;
    const hour=date.getHours();
    if(timeOfDay==="morning" && !(hour>=5 && hour<12)) return false;
    if(timeOfDay==="afternoon" && !(hour>=12 && hour<17)) return false;
    if(timeOfDay==="evening" && !(hour>=17 && hour<22)) return false;
    if(timeOfDay==="late" && !(hour>=22 || hour<5)) return false;
    return true;
  };
  const planBudgetFits=(price:number)=>budget==="any" || (budget==="free" && price===0) || (budget==="under25" && price>0 && price<25) || (budget==="25to100" && price>=25 && price<100) || (budget==="100plus" && price>=100);
  function clearFilters(){setCitySearch("");setDateFrom("");setDateTo("");setTimeOfDay("any");setBudget("any");setTravellers(1);setGroupOnly(false);setInterest("");}
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
  const realTravellers = useQuery({
    queryKey: ["trips", "public-travellers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, profiles(name, verified, reliability_score)")
        .eq("is_example", false)
        .neq("user_id", user?.id ?? "")
        .gte("end_date", new Date().toISOString().slice(0, 10))
        .order("start_date");
      if (error) throw error;
      return data ?? [];
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
  const cityResults=(()=>{const m=new Map<string,{city:string;country:string}>();for(const r of [...(examples.data??[]),...(plans.data??[])])if(r.city&&!m.has(r.city))m.set(r.city,{city:r.city,country:r.country});const q=citySearch.toLowerCase().trim();return [...m.values()].filter(c=>!q||`${c.city} ${c.country}`.toLowerCase().includes(q)).slice(0,8);})();
  const matchingTravellers=fadeExamples([...(realTravellers.data??[]).filter(t=>!t.user_id||!blocks.data?.has(t.user_id)),...(examples.data??[])],{hideAll:examplesHidden}).filter(t=>cityFits(t.city,t.country)&&tripDateFits(t.start_date,t.end_date)&&(!who||t.interests.join(" ").toLowerCase().includes(who.toLowerCase())));
  const matchingPlans=fadeExamples(plans.data??[],{hideAll:examplesHidden}).filter(p=>cityFits(p.city,p.country)&&planDateFits(p.starts_at)&&fits(p)&&planBudgetFits(Number(p.base_price))&&(!who||`${p.activity} ${p.title} ${p.description??""}`.toLowerCase().includes(who.toLowerCase())));
  return (
    <AppShell hideBackExplore>
      <h1 className="text-4xl">Somewhere new, together</h1>
      <div className="mt-5 grid grid-cols-1 gap-0 rounded-2xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative border-b border-border px-5 py-2 sm:border-b-0 sm:border-r">
          <label><span className="block text-xs font-bold">Where</span><Input className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Where" placeholder="Search a city" value={citySearch} onFocus={()=>setWhereOpen(true)} onBlur={()=>setTimeout(()=>setWhereOpen(false),150)} onChange={e=>{setCitySearch(e.target.value);setWhereOpen(true);}}/></label>
          {whereOpen&&cityResults.length>0&&<ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">{cityResults.map(c=><li key={c.city}><button type="button" className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted" onMouseDown={e=>e.preventDefault()} onClick={()=>{setCitySearch(c.city);setWhereOpen(false);}}><CityPhoto city={c.city} alt={`${c.city} skyline`} className="h-12 w-16 shrink-0 rounded-md object-cover"/><span><span className="block text-sm font-bold">{c.city}</span><span className="text-xs text-muted-foreground">{c.country}</span></span></button></li>)}</ul>}
        </div>
        <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-2 sm:border-r lg:border-b-0">
          <label><span className="block text-xs font-bold">From</span><Input type="date" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Travel from date" value={dateFrom} max={dateTo||undefined} onChange={e=>setDateFrom(e.target.value)}/></label>
          <label><span className="block text-xs font-bold">To</span><Input type="date" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Travel to date" value={dateTo} min={dateFrom||undefined} onChange={e=>setDateTo(e.target.value)}/></label>
        </div>
        <div className="border-b border-border px-5 py-2 sm:border-r lg:border-b-0">
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
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2"><span className="shrink-0 text-xs font-bold">Interests</span><Input className="h-8 min-w-0 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" aria-label="Interests (optional)" placeholder="e.g. surfing, food, photography" value={interest} onChange={e=>setInterest(e.target.value)}/></label>
        <label className="rounded-xl border border-border bg-card px-4 py-2"><span className="block text-xs font-bold">Time of day</span><select aria-label="Time of day" className="h-8 w-full bg-transparent text-sm" value={timeOfDay} onChange={e=>setTimeOfDay(e.target.value)}><option value="any">Any time</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="late">Late</option></select></label>
        <label className="rounded-xl border border-border bg-card px-4 py-2"><span className="block text-xs font-bold">Budget per person</span><select aria-label="Budget" className="h-8 w-full bg-transparent text-sm" value={budget} onChange={e=>setBudget(e.target.value)}><option value="any">Any budget</option><option value="free">Free</option><option value="under25">Under €25</option><option value="25to100">€25–100</option><option value="100plus">€100+</option></select></label>
        <Button variant="outline" className="h-full min-h-12" onClick={clearFilters}>Clear filters</Button>
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
      <h2 className="mb-4 mt-8 text-2xl">Travellers on the move <span className="text-sm font-normal text-muted-foreground">· {matchingTravellers.length} matches</span></h2>
      {matchingTravellers.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{matchingTravellers.map(t=><TripCard key={t.id} trip={t} hostName={t.is_example ? (t.example_name ?? "Traveller") : (t.profiles as { name?: string } | null)?.name ?? "Traveller"}/>)}</div> : <Empty>No travellers match these filters. Try a wider date range, another destination or clear your filters.</Empty>}
      <h2 className="mb-4 mt-8 text-2xl">Plans worth the trip <span className="text-sm font-normal text-muted-foreground">· {matchingPlans.length} matches</span></h2>
      {matchingPlans.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{matchingPlans.map(p=><PlanCard key={p.id} plan={p}/>)}</div> : <Empty>No plans match those dates and preferences yet. Your filters are still saved above, so you can widen the dates or clear them to see more.</Empty>}
    </AppShell>
  );
}
