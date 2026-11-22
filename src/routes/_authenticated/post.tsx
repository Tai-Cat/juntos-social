import { MapLink } from "@/components/tagalong/MapLink";
import { VisibilitySelect, type Visibility } from "@/components/tagalong/PlanVisibility";
import { canUseHostTools } from "@/lib/membership";
import { CITY_CENTERS } from "@/lib/spatial";
import { usePlus } from "@/hooks/use-plus";
import { ACTIVITIES, genreOf, cityName, GENRES } from "@/lib/catalog";
import { Choice } from "@/components/tagalong/Choice";
import { PlusCard } from "@/components/tagalong/PlusCard";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensurePlanPhotos } from "@/lib/image-search.functions";
import { PhotoUploader } from "@/components/tagalong/PhotoUploader";
import { InterestSearch } from "@/components/tagalong/InterestSearch";
import { createFileRoute, useNavigate,Link } from "@tanstack/react-router";
import {useAge} from "@/hooks/use-age";
import {useOrganisations,useOrgMemberships} from "@/hooks/use-organisations";
import {AGE_BRACKETS} from "@/lib/age";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Lock, Plus, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { Chip } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AUDIENCE_LABEL, errMsg } from "@/lib/tagalong";

const search = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  travel: z.boolean().optional(),
  from: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/post")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Post a plan — Juntos" },
      {
        name: "description",
        content: "Turn something you're already doing into a plan others can join.",
      },
      { property: "og:title", content: "Post a plan — Juntos" },
      {
        property: "og:description",
        content: "Turn something you're already doing into a plan others can join.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostPlan,
});

const TEMPLATES = [
  { title: "Dog walk", category: "Dog walk", kind: "chill", capacity: 5 },
  { title: "Laundry run + coffee", category: "Errands", kind: "chill", capacity: 4 },
  { title: "Market wander", category: "Market", kind: "chill", capacity: 6 },
  { title: "Co-working session", category: "Co-working", kind: "chill", capacity: 6 },
  { title: "Pottery class", category: "Pottery", kind: "partner_venue", capacity: 8 },
  { title: "Dinner", category: "Dinner", kind: "partner_venue", capacity: 6 },
  { title: "Climbing", category: "Climbing", kind: "chill", capacity: 6 },
] as const;

function PostPlan() {
  const s = Route.useSearch();
  const { user, profile } = useMyProfile();
  const { plus } = usePlus();
  const age=useAge(),organisations=useOrganisations(),memberships=useOrgMemberships();
  const hostRoles=["owner","admin","host"];
  const myOrgIds=new Set((memberships.data??[]).filter(m=>hostRoles.includes(m.role)).map(m=>m.organisation_id));
  const adminOrgIds=new Set((memberships.data??[]).filter(m=>m.role==="owner"||m.role==="admin").map(m=>m.organisation_id));
  const postAsOptions=(organisations.data??[]).filter(o=>!o.archived&&(myOrgIds.has(o.id)||(!!o.parent_id&&adminOrgIds.has(o.parent_id)))).map(o=>{const parent=o.parent_id?organisations.data?.find(p=>p.id===o.parent_id):undefined;return {value:o.id,label:parent?`${parent.name} › ${o.name}`:o.name};});
  const [ageBrackets,setAgeBrackets]=useState<string[]>([]),[customAge,setCustomAge]=useState(false),[ageMin,setAgeMin]=useState(18),[ageMax,setAgeMax]=useState(34),[orgId,setOrgId]=useState("");
  const [photoFiles,setPhotoFiles]=useState<File[]>([]);
  const [tags,setTags]=useState<string[]>([]);
  const fillPhotos=useServerFn(ensurePlanPhotos);
  const [level, setLevel] = useState("");
  const [activity, setActivity] = useState(s.category ? s.category.toLowerCase() : "co-working");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState(s.title ?? "");
  const [category, setCategory] = useState(s.category ?? "");
  const [description, setDescription] = useState(s.description ?? "");
  const [bring, setBring] = useState("");
  const [duration, setDuration] = useState(120);
  const [intro, setIntro] = useState("");
  const [privatePlan, setPrivatePlan] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [early, setEarly] = useState(false);
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState("");
  const [moreWhens, setMoreWhens] = useState<string[]>([]);
  const [capacityInput, setCapacityInput] = useState("6");
  const [kind, setKind] = useState<"chill" | "partner_venue">("chill");
  const [venueType, setVenueType] = useState<"public" | "partner_venue" | "private">("public");
  const [priceMode, setPriceMode] = useState<"free" | "paid">("free");
  const [priceInput, setPriceInput] = useState("0");
  const [discountTiers, setDiscountTiers] = useState<{ min: string; type: "pct" | "amount"; value: string }[]>([]);
  const [audience, setAudience] = useState("everyone");
  const [stepFree, setStepFree] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const city = cityName(s.city ?? profile?.home_city ?? "Paris");
  const country = s.country ?? (city === "Paris" ? "France" : "");
  const isTravel = s.travel ?? (!!s.city && s.city !== profile?.home_city);

  // Your recent plans: one tap fills the form again (duplicate, then just change the date).
  const myPlans = useQuery({
    queryKey: ["my-hosted-plans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id,title,category,activity,kind,venue_type,capacity,base_price,discount_tiers,duration_minutes,host_intro,what_to_bring,description,area_label,audience,step_free,interest_tags,age_min,age_max,visibility,starts_at")
        .eq("host_id", user?.id ?? "")
        .order("starts_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });
  const intros = [...new Set((myPlans.data ?? []).map((pl) => (pl.host_intro ?? "").trim()).filter(Boolean))].slice(0, 3);

  // Remember the last host intro so it's filled in automatically next time.
  useEffect(() => {
    if (intro) return;
    try {
      const saved = localStorage.getItem("juntos-host-intro");
      if (saved) setIntro(saved);
      else if (intros[0]) setIntro(intros[0]);
    } catch {
      if (intros[0]) setIntro(intros[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intros[0]]);

  async function fillFrom(planId: string) {
    const pl = myPlans.data?.find((x) => x.id === planId) ?? (await supabase.from("plans").select("id,title,category,activity,kind,venue_type,capacity,base_price,discount_tiers,duration_minutes,host_intro,what_to_bring,description,area_label,audience,step_free,interest_tags,age_min,age_max,visibility,starts_at").eq("id", planId).maybeSingle()).data;
    if (!pl) return;
    setTitle(pl.title);
    setCategory(pl.category ?? "");
    setActivity(pl.activity ?? "");
    setKind(pl.kind as "chill" | "partner_venue");
    setVenueType((pl.venue_type as "public" | "partner_venue" | "private") ?? (pl.kind === "partner_venue" ? "partner_venue" : "public"));
    setCapacityInput(String(pl.capacity));
    setPriceInput(String(Math.max(0, Number(pl.base_price))));
    setPriceMode(Number(pl.base_price) > 0 ? "paid" : "free");
    setDiscountTiers(Array.isArray(pl.discount_tiers) ? pl.discount_tiers.map((t: any) => ({ min: String(t.min), type: t.type, value: String(t.value) })) : []);
    setDuration(pl.duration_minutes);
    if (pl.host_intro) setIntro(pl.host_intro);
    setBring(pl.what_to_bring ?? "");
    setDescription(pl.description ?? "");
    setArea(pl.area_label);
    setAudience(pl.audience);
    setStepFree(pl.step_free);
    setTags(pl.interest_tags ?? []);
    if (pl.visibility) setVisibility(pl.visibility as Visibility);
    const match = AGE_BRACKETS.filter((b) => pl.age_min != null && pl.age_max != null && b.min >= pl.age_min && b.max <= pl.age_max).map((b) => b.value);
    if (match.length) setAgeBrackets(match);
    else if (pl.age_min != null || pl.age_max != null) { setCustomAge(true); setAgeMin(pl.age_min ?? 18); setAgeMax(pl.age_max ?? 120); }
    const { data: addr } = await supabase.rpc("get_plan_address", { _plan: pl.id });
    if (typeof addr === "string") setAddress(addr);
    setWhen("");
    setMoreWhens([]);
    toast.message("Copied from your plan. Pick the new date and time.");
  }
  useEffect(() => {
    if (s.from) void fillFrom(s.from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.from]);

  function useTemplate(t: (typeof TEMPLATES)[number]) {
    setTitle(t.title);
    setCategory(t.category);
    setKind(t.kind);
    setVenueType(t.kind === "partner_venue" ? "partner_venue" : "public");
    setCapacityInput(String(t.capacity));
    const map: Record<string, string> = {
      "Dog walk": "dog walks",
      Errands: "laundry runs",
      Market: "markets",
      "Co-working": "co-working",
      Pottery: "pottery",
      Dinner: "dinner parties",
      Climbing: "climbing and bouldering",
    };
    setActivity(map[t.category] ?? t.category.toLowerCase());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if(!age.data?.date_of_birth){toast.error("Add your date of birth and confirm you are 18 or over before hosting.");return;}
    const capacityValue = Number(capacityInput);
    const priceValue = priceMode === "paid" ? Number(priceInput) : 0;
    if (!Number.isInteger(capacityValue) || capacityValue < 2 || capacityValue > (plus ? 30 : 8)) {
      toast.error(`Choose a whole number of people between 2 and ${plus ? 30 : 8}.`);
      return;
    }
    if (priceMode === "paid" && (!priceInput.trim() || !Number.isFinite(priceValue) || priceValue <= 0)) {
      toast.error("Enter a price greater than zero, or choose Free.");
      return;
    }
    const dates = [when, ...moreWhens].filter(Boolean);
    if (!when || !Number.isFinite(new Date(when).getTime()) || new Date(when).getTime() <= Date.now()) {
      toast.error("Choose a start date and time in the future.");
      return;
    }
    if (dates.some((d) => !Number.isFinite(new Date(d).getTime()) || new Date(d).getTime() <= Date.now())) {
      toast.error("Choose a future time for each additional date, or remove that date.");
      return;
    }
    const normalizedTiers = priceValue > 0 ? discountTiers.map((t) => ({ min: Number(t.min), type: t.type, value: Number(t.value) })) : [];
    if (normalizedTiers.some((t) => !Number.isInteger(t.min) || t.min < 2 || t.min > capacityValue || !Number.isFinite(t.value) || t.value <= 0 || (t.type === "pct" && t.value > 50) || (t.type === "amount" && t.value > priceValue))) {
      toast.error("Check each discount: the group size must fit the event, and the discount cannot exceed 50% or the ticket price.");
      return;
    }
    if (!canUseHostTools(plus,capacityValue,weekly,autoApprove)) { toast.error("These host tools require Juntos Plus"); return; }
    setBusy(true);
    try {
      const photos:string[]=[];
      for(const file of photoFiles){const suffix=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const path=`${user.id}/${crypto.randomUUID()}.${suffix}`;const {error}=await supabase.storage.from("plan-photos").upload(path,file,{contentType:file.type});if(error)throw error;photos.push(`storage:plan-photos/${path}`);}
      // Several brackets become one span (e.g. 18–24 + 25–34 = 18–34).
      const picked=AGE_BRACKETS.filter(b=>ageBrackets.includes(b.value));
      const spanMin=customAge?ageMin:picked.length?Math.min(...picked.map(b=>b.min)):null;
      const spanMax=customAge?ageMax:picked.length?Math.max(...picked.map(b=>b.max)):null;
      try { if (intro.trim()) localStorage.setItem("juntos-host-intro", intro.trim()); } catch { /* storage blocked */ }
      let firstId = "";
      for (const date of dates) {
      const { data, error } = await supabase
        .from("plans")
        .insert({
          host_id: user.id,
          title,
          category: activity,
          activity: activity.toLowerCase().trim(),
          genre: genreOf(activity),
          image_url:null,
          photos,
          interest_tags:tags,
          age_min:spanMin,
          age_max:spanMax,
          organisation_id:orgId||null,
          area_lat: CITY_CENTERS[city]?.[0] ?? null,
          area_lng: CITY_CENTERS[city]?.[1] ?? null,
          what_to_bring: bring,
          duration_minutes: duration,
          host_intro: intro,
          is_private: privatePlan,
          visibility,
          early_booking: plus && early,
          required_level: plus && level ? level : "any",
          kind,
          venue_type: venueType,
          area_label: area,
          starts_at: new Date(date).toISOString(),
          capacity: capacityValue,
          base_price: priceValue,
          discount_tiers: normalizedTiers,
          audience,
          step_free: stepFree,
          recurring_weekly: plus && weekly,
          auto_approve: venueType === "private" ? false : plus && autoApprove,
          description: description || null,
          city,
          country: country || city,
          is_travel: isTravel,
          is_public_place: venueType !== "private",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("plan_addresses")
        .insert({ plan_id: data.id, address });
      if (e2) throw e2;
      if(!photos.length){try{const r=await fillPhotos({data:{planId:data.id}});if(r.status==="missing_keys")toast.message("Stock photos aren't switched on yet, so a placeholder is shown.");}catch{/* placeholder stays */}}
      if (!firstId) firstId = data.id;
      }
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success(dates.length > 1 ? `${dates.length} plans posted` : "Plan posted");
      navigate({ to: "/plans/$planId", params: { planId: firstId } });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="New plan" hideBackExplore>
      <h1 className="text-3xl">Post a plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        In {city}
        {isTravel && " · travel plan"}
      </p>

      {!!myPlans.data?.length && (
        <>
          <p className="eyebrow mb-2 mt-6">Repeat one of your plans</p>
          <div className="flex flex-wrap gap-2 pb-1">
            {myPlans.data.map((pl) => (
              <Chip key={pl.id} active={false} onClick={() => void fillFrom(pl.id)}>
                <Copy className="h-3 w-3" aria-hidden /> {pl.title}
              </Chip>
            ))}
          </div>
        </>
      )}
      <p className="eyebrow mb-2 mt-6">Quick start</p>
      <div className="flex flex-wrap gap-2 pb-1">
        {TEMPLATES.map((t) => (
          <Chip key={t.title} active={title === t.title} onClick={() => useTemplate(t)}>
            {t.title}
          </Chip>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <Field label="What's the plan called?" id="t">
            <Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunday run along the Seine" />
          </Field>
        <div className="space-y-2">
          <Label>Type of activity</Label>
          <Input
            aria-label="Activity"
            list="post-activities"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
            maxLength={80}
          />
          <datalist id="post-activities">
            {ACTIVITIES.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        </div>
        {age.data&&!age.data.date_of_birth&&<div className="border-y border-border py-4"><p className="text-sm">Add your date of birth (18+) before hosting.</p><Button asChild variant="outline" className="mt-2"><Link to="/onboarding">Add date of birth</Link></Button></div>}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Label>Does this plan have a cost?</Label>
          <div className="flex gap-2">
            <Chip active={priceMode === "free"} onClick={() => { setPriceMode("free"); setPriceInput("0"); setDiscountTiers([]); }}>Free</Chip>
            <Chip active={priceMode === "paid"} onClick={() => setPriceMode("paid")}>Has a cost</Chip>
          </div>
          <p className="text-xs text-muted-foreground">{priceMode === "free" ? "People can join without paying." : "Add an estimated price per person below."}</p>
          <Label>Venue type (optional)</Label>
          <div className="flex flex-wrap gap-2">
            <Chip active={venueType === "public"} onClick={() => { setVenueType("public"); setKind("chill"); }}>Public space</Chip>
            <Chip active={venueType === "partner_venue"} onClick={() => { setVenueType("partner_venue"); setKind("partner_venue"); }}>Partner venue</Chip>
            <Chip active={venueType === "private"} onClick={() => { setVenueType("private"); setKind("chill"); setAutoApprove(false); }}>Private home / private venue</Chip>
          </div>
          {venueType === "private" && <p className="text-xs text-muted-foreground">Private venues always require the host to approve each attendee. Your exact address remains protected.</p>}
        </div>
        <PhotoUploader files={photoFiles} onChange={setPhotoFiles}/>
        <div className="space-y-2"><Label>Tag interests (optional)</Label><InterestSearch label="Tag an interest" exclude={tags} disabled={tags.length>=8} onAdd={t=>setTags(v=>[...v,t])}/>{tags.length>0&&<div className="flex flex-wrap gap-2">{tags.map(t=><Chip key={t} active onClick={()=>setTags(v=>v.filter(x=>x!==t))}>{t} ×</Chip>)}</div>}<p className="text-xs text-muted-foreground">Helps people with matching personal interests find this plan.</p></div>
        <div className="space-y-2"><Label>Age ranges (optional)</Label><p className="text-xs text-muted-foreground">Pick one or more. Leave empty for any adult.</p><div className="flex flex-wrap gap-2">{AGE_BRACKETS.map(b=><Chip key={b.value} active={!customAge&&ageBrackets.includes(b.value)} onClick={()=>{setCustomAge(false);setAgeBrackets(v=>v.includes(b.value)?v.filter(x=>x!==b.value):[...v,b.value]);}}>{b.label}</Chip>)}<Chip active={customAge} onClick={()=>{setCustomAge(v=>!v);setAgeBrackets([]);}}>Custom</Chip></div>{customAge&&<div className="grid grid-cols-2 gap-3"><Input aria-label="Minimum age" type="number" min={18} max={120} value={ageMin} onChange={e=>setAgeMin(Number(e.target.value))}/><Input aria-label="Maximum age" type="number" min={ageMin} max={120} value={ageMax} onChange={e=>setAgeMax(Number(e.target.value))}/></div>}</div>
        {postAsOptions.length>0&&<div className="space-y-2"><Label>Post as</Label><Choice label="Myself" value={orgId} onChange={setOrgId} options={postAsOptions}/><p className="text-xs text-muted-foreground">Post as yourself, or any organisation or group you host or admin.</p></div>}
        <div className="space-y-2">
          <Label>Required level</Label>
          {plus ? (
            <Choice
              label="All abilities welcome"
              value={level}
              onChange={setLevel}
              options={["beginner", "intermediate", "advanced"]}
            />
          ) : (
            <PlusCard />
          )}
        </div>
        <Field label="Details (optional)" id="d">
          <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="What to bring" id="bring">
          <Input id="bring" value={bring} onChange={(e) => setBring(e.target.value)} />
        </Field>
        <Field label="How long?" id="duration">
          <div className="flex items-center gap-3">
            <input
              aria-label="Duration slider"
              type="range"
              min={15}
              max={480}
              step={15}
              value={Math.min(duration, 480)}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[var(--logo-pink)]"
            />
            <div className="flex items-center gap-1">
              <Input id="duration" type="number" min={15} max={1440} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-20" />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{Math.floor(duration / 60) ? `${Math.floor(duration / 60)} h ` : ""}{duration % 60 ? `${duration % 60} min` : ""}</p>
        </Field>
        <Field label="Host intro" id="intro">
          <Textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="A line about you, e.g. I run here most Sundays and love showing newcomers around." />
          {intros.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {intros.map((t) => (
                <Chip key={t} active={intro === t} onClick={() => setIntro(t)}>
                  {t.length > 40 ? `${t.slice(0, 40)}…` : t}
                </Chip>
              ))}
            </div>
          )}
        </Field>
        <Field label="Area shown publicly" id="a" hint="Neighbourhood only, e.g. Bastille, 11e">
          <Input id="a" required value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <Field
          label="Meet-up address and directions"
          id="ad"
          hint={
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private. Shared with approved people 2 hours before.
            </span>
          }
        >
          <Input id="ad" required value={address} onChange={(e) => setAddress(e.target.value)} />
          {address.trim().length > 4 && (
            <p className="mt-1.5 text-xs">
              <MapLink query={address.trim()}>Check this address on the map</MapLink>
            </p>
          )}
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="When" id="w">
            <Input
              id="w"
              type="datetime-local"
              required
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            {moreWhens.map((w, i) => (
              <div key={i} className="mt-2 flex items-center gap-2">
                <Input aria-label={`Extra date ${i + 1}`} type="datetime-local" value={w} onChange={(e) => setMoreWhens((v) => v.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove this date" onClick={() => setMoreWhens((v) => v.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setMoreWhens((v) => [...v, ""])}>
              <Plus className="h-4 w-4" /> Add another date
            </Button>
          </Field>
          <Field label="People (incl. you)" id="c">
            <Input
              id="c"
              type="number"
              min={2}
              max={plus ? 30 : 8}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
            />
          </Field>
        </div>
        {priceMode === "paid" && <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <Field label="Estimated price per person (€)" id="pr">
            <Input id="pr" type="number" min={0.01} step="0.5" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="e.g. 18" />
          </Field>
          <div className="space-y-3 border-t border-border pt-3">
            <div>
              <p className="font-semibold">Discount (optional)</p>
              <p className="text-xs text-muted-foreground">Set group discounts for this plan. Leave blank to offer no discount.</p>
            </div>
            {discountTiers.map((tier, index) => <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <div><Label>People</Label><Input aria-label="Minimum people for discount" type="number" min={2} max={Number(capacityInput) || 500} value={tier.min} onChange={e => setDiscountTiers(v => v.map((t,i) => i === index ? {...t,min:e.target.value} : t))} placeholder="4" /></div>
              <div><Label>Type</Label><select aria-label="Discount type" className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={tier.type} onChange={e => setDiscountTiers(v => v.map((t,i) => i === index ? {...t,type:e.target.value as "pct"|"amount"} : t))}><option value="pct">% off</option><option value="amount">€ off</option></select></div>
              <div><Label>Amount</Label><Input aria-label="Discount value" type="number" min={0.01} step="0.5" value={tier.value} onChange={e => setDiscountTiers(v => v.map((t,i) => i === index ? {...t,value:e.target.value} : t))} placeholder={tier.type === "pct" ? "15" : "5"} /></div>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove discount" onClick={() => setDiscountTiers(v => v.filter((_,i) => i !== index))}><X /></Button>
            </div>)}
            {discountTiers.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setDiscountTiers(v => [...v,{min:"4",type:"pct",value:"15"}])}><Plus className="h-4 w-4" /> Add discount</Button>}
          </div>
        </div>}
        <div className="space-y-2">
          <Label>Who can join</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AUDIENCE_LABEL).map(([k, l]) => (
              <Chip key={k} active={audience === k} onClick={() => setAudience(k)}>
                {l}
              </Chip>
            ))}
          </div>
          {["women_only", "men_only", "nonbinary_only"].includes(audience) && (
            <p className="text-xs text-muted-foreground">
              Only verified people whose self-described gender matches can join.
            </p>
          )}
        </div>
        <div className="divide-y divide-border border-y border-border">
          <VisibilitySelect value={visibility} onChange={setVisibility} />
          <Toggle label="Invite-only for chosen people" checked={privatePlan} onChange={setPrivatePlan} />
          <Toggle
            label="Plus early booking badge (coming soon)"
            checked={early}
            onChange={(v) => {
              if (plus) setEarly(v);
              else toast("Early booking badge is a Plus host tool");
            }}
          />
          <Toggle label="Step-free access" checked={stepFree} onChange={setStepFree} />
          <Toggle
            label="Repeat weekly"
            checked={weekly}
            onChange={(v) => {
              if (plus) setWeekly(v);
              else toast("Recurring plans are a Plus host tool");
            }}
          />
          <Toggle
            label="Instant join for reliable people"
            hint="People with 2+ no-shows always need your approval"
            checked={autoApprove}
            onChange={(v) => {
              if (plus) setAutoApprove(v);
              else toast("Reliable-only joining is a Plus host tool");
            }}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          variant="accent"
          className="w-full"
          disabled={busy || !age.data?.date_of_birth}
        >
          {busy ? "Posting…" : "Post plan"}
        </Button>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
