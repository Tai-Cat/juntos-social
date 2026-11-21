import { usePlus } from "@/hooks/use-plus";
import { ACTIVITIES, genreOf, imageFor, cityName } from "@/lib/catalog";
import { Choice } from "@/components/tagalong/Choice";
import { PlusCard } from "@/components/tagalong/PlusCard";
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { Chip } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AUDIENCE_LABEL, errMsg } from "@/lib/tagalong";

const search = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  travel: z.boolean().optional(),
});

export const Route = createFileRoute("/_authenticated/post")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Post a plan — Tagalong" },
      {
        name: "description",
        content: "Turn something you're already doing into a plan others can join.",
      },
      { property: "og:title", content: "Post a plan — Tagalong" },
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
  const [level, setLevel] = useState("");
  const [activity, setActivity] = useState(s.category ? s.category.toLowerCase() : "co-working");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState(s.title ?? "");
  const [category, setCategory] = useState(s.category ?? "");
  const [description, setDescription] = useState(s.description ?? "");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [kind, setKind] = useState<"chill" | "partner_venue">("chill");
  const [price, setPrice] = useState(0);
  const [audience, setAudience] = useState("everyone");
  const [stepFree, setStepFree] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [publicPlace, setPublicPlace] = useState(false);
  const [busy, setBusy] = useState(false);
  const city = cityName(s.city ?? profile?.home_city ?? "Paris");
  const country = s.country ?? (city === "Paris" ? "France" : "");
  const isTravel = s.travel ?? (!!s.city && s.city !== profile?.home_city);

  function useTemplate(t: (typeof TEMPLATES)[number]) {
    setTitle(t.title);
    setCategory(t.category);
    setKind(t.kind);
    setCapacity(t.capacity);
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
    if (!publicPlace) {
      toast.error("Plans must be at a public place or partner venue");
      return;
    }
    if (new Date(when).getTime() < Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .insert({
          host_id: user.id,
          title,
          category: activity,
          activity,
          genre: genreOf(activity),
          image_url: imageFor(activity),
          required_level: plus && level ? level : "any",
          kind,
          area_label: area,
          starts_at: new Date(when).toISOString(),
          capacity,
          base_price: price,
          audience,
          step_free: stepFree,
          recurring_weekly: weekly,
          auto_approve: autoApprove,
          description: description || null,
          city,
          country: country || city,
          is_travel: isTravel,
          is_public_place: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("plan_addresses")
        .insert({ plan_id: data.id, address });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan posted");
      navigate({ to: "/plans/$planId", params: { planId: data.id } });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="New plan">
      <h1 className="text-3xl">Post a plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        In {city}
        {isTravel && " · travel plan"}
      </p>

      <p className="eyebrow mb-2 mt-6">Quick start</p>
      <div className="flex flex-wrap gap-2 pb-1">
        {TEMPLATES.map((t) => (
          <Chip key={t.title} active={title === t.title} onClick={() => useTemplate(t)}>
            {t.title}
          </Chip>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label>Activity</Label>
          <Choice
            label="Choose an activity"
            value={activity}
            onChange={setActivity}
            options={ACTIVITIES}
          />
        </div>
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
        <Field label="Title" id="t">
          <Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Details (optional)" id="d">
          <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Area shown publicly" id="a" hint="Neighbourhood only, e.g. Bastille, 11e">
          <Input id="a" required value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <Field
          label="Exact address"
          id="ad"
          hint={
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private. Shared with approved people 2 hours before.
            </span>
          }
        >
          <Input id="ad" required value={address} onChange={(e) => setAddress(e.target.value)} />
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
          </Field>
          <Field label="People (incl. you)" id="c">
            <Input
              id="c"
              type="number"
              min={2}
              max={30}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="space-y-2">
          <Label>Kind</Label>
          <div className="flex gap-2">
            <Chip active={kind === "chill"} onClick={() => setKind("chill")}>
              Chill, free
            </Chip>
            <Chip active={kind === "partner_venue"} onClick={() => setKind("partner_venue")}>
              Partner venue
            </Chip>
          </div>
        </div>
        {
          <Field
            label="Estimated price per person (€)"
            id="pr"
            hint="4+ people get 15% off, 6+ get 25% off"
          >
            <Input
              id="pr"
              type="number"
              min={0}
              step="0.5"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </Field>
        }
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
          <Toggle label="Step-free access" checked={stepFree} onChange={setStepFree} />
          <Toggle label="Repeat weekly" checked={weekly} onChange={setWeekly} />
          <Toggle
            label="Instant join for reliable people"
            hint="People with 2+ no-shows always need your approval"
            checked={autoApprove}
            onChange={setAutoApprove}
          />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={publicPlace}
            onCheckedChange={(v) => setPublicPlace(!!v)}
            className="mt-0.5"
          />
          This is a public place or partner venue
        </label>
        <Button
          type="submit"
          size="lg"
          variant="accent"
          className="w-full"
          disabled={busy || !publicPlace}
        >
          Post plan
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
