import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Choice } from "./Choice";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useDoodles } from "@/hooks/use-doodles";
import { useAge } from "@/hooks/use-age";
import { AGE_BRACKETS } from "@/lib/age";
import type { Database } from "@/integrations/supabase/types";
import { Settings } from "lucide-react";
import { useExamplesHidden, useIsAppAdmin } from "@/hooks/use-app-config";
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Update"];
const GENDERS = [["woman", "Women"], ["man", "Men"], ["non-binary", "Non-binary people"]] as const;
const LANGS = [
  "English", "French", "Portuguese", "Spanish", "Italian", "German", "Mandarin", "Arabic",
  "Japanese", "Korean", "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Greek",
  "Turkish", "Hindi", "Urdu", "Bengali", "Russian", "Ukrainian", "Polish", "Czech",
  "Thai", "Vietnamese", "Indonesian", "Swahili", "Hebrew", "Romanian", "Hungarian",
];
function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="border-b border-border py-4">
      <div className="flex items-center justify-between gap-4"><span className="font-bold">{label}</span>{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
export function useSettings() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: async () => (user ? (await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()).data : null),
  });
}
export function SettingsSheet() {
  const { user } = useSession();
  const qc = useQueryClient();
  const doodles = useDoodles();
  const age = useAge();
  const s = useSettings().data;
  const [distance, setDistance] = useState<number[]>([25]);
  useEffect(() => {
    if (s?.max_distance_km != null) setDistance([s.max_distance_km]);
  }, [s?.max_distance_km]);
  async function save(patch: SettingsRow) {
    if (!user) return;
    const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...patch });
    if (error) toast.error(error.message);
    else { qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["hang-candidates"] }); }
  }
  const toggleIn = (list: string[] | undefined, v: string) => (list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v];
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline"><Settings />Settings</Button></SheetTrigger>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-3xl">Settings</SheetTitle></SheetHeader>
        <h3 className="mt-6 eyebrow">Look</h3>
        <Row label="Doodle background" hint="Pale hand-drawn activities behind the app."><Switch aria-label="Doodle background" checked={doodles.enabled} onCheckedChange={doodles.toggle} /></Row>
        <h3 className="mt-6 eyebrow">People I'd like to meet</h3>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Age bracket</p>
          <Choice label="Any adult bracket" value={age.data?.meet_age_min ? `${age.data.meet_age_min}-${age.data.meet_age_max ?? 120}` : ""} options={AGE_BRACKETS} onChange={async (value) => {
            if (!user) return;
            const [min, max] = value ? value.split("-").map(Number) : [null, null];
            const { error } = await supabase.from("profile_private").upsert({ user_id: user.id, meet_age_min: min ?? null, meet_age_max: max ?? null });
            if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["private-age"] });
          }} />
          <p className="mt-1 text-xs text-muted-foreground">A preference, not a joining restriction.</p>
        </div>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Genders</p>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(([v, l]) => {
              const on = (s?.meet_genders ?? []).includes(v);
              return <Button key={v} size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => save({ meet_genders: toggleIn(s?.meet_genders, v) })}>{l}</Button>;
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">None selected means everyone.</p>
        </div>
        <Row label="Only show gender-restricted plans" hint="Show women-only, men-only or non-binary-only plans that match you."><Switch aria-label="Only gender-restricted plans" checked={!!s?.gender_plans_only} onCheckedChange={(v) => save({ gender_plans_only: v })} /></Row>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Languages</p>
          <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {LANGS.map((l) => {
              const on = (s?.languages ?? []).includes(l);
              return <Button key={l} size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => save({ languages: toggleIn(s?.languages, l) })}>{l}</Button>;
            })}
          </div>
        </div>
        <div className="border-b border-border py-4">
          <div className="flex justify-between"><span className="font-bold">Distance</span><span className="text-sm tabular-nums">{distance[0] ?? 25} km</span></div>
          <Slider className="mt-3 touch-pan-y" aria-label="Distance" min={1} max={100} step={1} value={distance} onValueChange={setDistance} onValueCommit={([v]) => save({ max_distance_km: v ?? 25 })} />
          <p className="mt-1 text-xs text-muted-foreground">Drag to choose how far away you're happy to meet people.</p>
        </div>
        <h3 className="mt-6 eyebrow">Notifications</h3>
        <Row label="Messages"><Switch aria-label="Message notifications" checked={s?.notify_messages ?? true} onCheckedChange={(v) => save({ notify_messages: v })} /></Row>
        <Row label="Invites and friend requests"><Switch aria-label="Invite notifications" checked={s?.notify_invites ?? true} onCheckedChange={(v) => save({ notify_invites: v })} /></Row>
        <Row label="Saved alert matches"><Switch aria-label="Alert notifications" checked={s?.notify_alerts ?? true} onCheckedChange={(v) => save({ notify_alerts: v })} /></Row>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Hang-again reminders</p>
          <Choice label="Reminder frequency" value={s?.hang_frequency ?? "monthly"} options={[{ value: "never", label: "Never" }, { value: "monthly", label: "Monthly" }, { value: "every_2_months", label: "Every 2 months" }]} onChange={(v) => save({ hang_frequency: v })} />
          <p className="mt-1 text-xs text-muted-foreground">Set reminders per friend from your Friends list.</p>
        </div>
        <h3 className="mt-6 eyebrow">Privacy</h3>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Who can see my plans</p>
          <Choice label="Profile visibility" value={s?.profile_visibility ?? "friends"} options={[{ value: "friends", label: "Friends only" }, { value: "link", label: "Anyone with my share link" }, { value: "nobody", label: "Only me" }]} onChange={(v) => save({ profile_visibility: v })} />
          <p className="mt-1 text-xs text-muted-foreground">Exact addresses and private plans are never shared.</p>
        </div>
        <h3 className="mt-6 eyebrow">Account</h3>
        <div className="border-b border-border py-4">
          <p className="mb-2 font-bold">Account type</p>
          <Choice label="Account type" value={s?.account_type ?? "personal"} options={[{ value: "personal", label: "Personal" }, { value: "business", label: "Business" }, { value: "institution", label: "Institution" }]} onChange={(v) => save({ account_type: v as "personal" })} />
          {s?.account_type && s.account_type !== "personal" && <Button asChild variant="outline" size="sm" className="mt-2"><Link to="/organisations/new" search={{ kind: s.account_type === "business" ? "business" : "institution" }}>Set up organisation profile</Link></Button>}
        </div>
        <AdminControls />
        <Button asChild variant="link" className="mt-4 px-0"><Link to="/about">How Juntos works</Link></Button>
      </SheetContent>
    </Sheet>
  );
}

function AdminControls() {
  const isAdmin = useIsAppAdmin(), hidden = useExamplesHidden(), qc = useQueryClient();
  if (!isAdmin) return null;
  return (
    <>
      <h3 className="mt-6 eyebrow">App admin</h3>
      <Row label="Show example data" hint="Examples only fill gaps until each city has 6 real events.">
        <Switch aria-label="Show example data" checked={!hidden} onCheckedChange={async (v) => { const { error } = await supabase.rpc("set_hide_examples", { _hide: !v }); if (error) toast.error(error.message); else { await qc.invalidateQueries(); toast.success(v ? "Examples shown where needed" : "All examples hidden"); } }} />
      </Row>
      <div className="border-b border-border py-4 space-y-2">
        <Button asChild variant="outline" size="sm"><Link to="/admin/dashboard">Dashboard · sign-ups, paid members, plans</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/plans">All plans · real and examples</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/members">All accounts · free and Plus</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/review">Official status review queue</Link></Button>
        <Button variant="destructive" size="sm" className="block" onClick={async () => { if (!window.confirm("Permanently delete every example plan, traveller, organisation and social example? This cannot be undone.")) return; const { data, error } = await supabase.rpc("delete_all_examples"); if (error) toast.error(error.message); else { await qc.invalidateQueries(); toast.success(`Deleted ${data} example items`); } }}>Delete all examples permanently</Button>
      </div>
    </>
  );
}
