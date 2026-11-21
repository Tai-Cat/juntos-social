import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2Off, RefreshCw, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthAction } from "./AuthSheet";
import type { Database } from "@/integrations/supabase/types";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Visibility = "public" | "friends" | "link";
export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Appears in feeds, search, map and calendar." },
  { value: "friends", label: "Friends and groups", hint: "Only your friends or the group's members see it." },
  { value: "link", label: "Anyone with the link", hint: "Hidden everywhere; only people with the private link can view and RSVP." },
];
export const shareUrl = (token: string) => `${window.location.origin}/e/${token}`;

export function VisibilitySelect({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <div className="space-y-1 py-3">
      <p className="text-sm font-bold">Visibility</p>
      <Select value={value} onValueChange={(v) => onChange(v as Visibility)}>
        <SelectTrigger aria-label="Visibility"><SelectValue /></SelectTrigger>
        <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{VISIBILITY_OPTIONS.find((o) => o.value === value)?.hint}</p>
    </div>
  );
}

/** Host-only: change visibility, copy/share the private link, reset or turn it off. */
export function PlanVisibilityPanel({ plan }: { plan: Plan }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["plan", plan.id] }).then(() => qc.invalidateQueries());
  async function setVisibility(v: Visibility) {
    const { error } = await supabase.from("plans").update({ visibility: v, link_enabled: true }).eq("id", plan.id);
    if (error) toast.error(error.message); else { toast.success("Visibility updated"); refresh(); }
  }
  async function copy() { await navigator.clipboard.writeText(shareUrl(plan.share_token)); toast.success("Private link copied"); }
  async function share() {
    const url = shareUrl(plan.share_token);
    if (navigator.share) { try { await navigator.share({ title: plan.title, url }); } catch { /* cancelled */ } } else copy();
  }
  async function reset() {
    const { error } = await supabase.rpc("reset_plan_link", { _plan: plan.id });
    if (error) toast.error(error.message); else { toast.success("New link created. The old one no longer works."); refresh(); }
  }
  async function disable() {
    const { error } = await supabase.from("plans").update({ link_enabled: false }).eq("id", plan.id);
    if (error) toast.error(error.message); else { toast.success("Link turned off"); refresh(); }
  }
  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-4">
      <VisibilitySelect value={plan.visibility as Visibility} onChange={setVisibility} />
      {plan.visibility === "link" && (
        plan.link_enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copy}><Copy />Copy link</Button>
            <Button size="sm" variant="outline" onClick={share}><Share2 />Share</Button>
            <Button size="sm" variant="outline" onClick={reset}><RefreshCw />Reset link</Button>
            <Button size="sm" variant="ghost" onClick={disable}><Link2Off />Turn off link</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">The link is off.<Button size="sm" variant="outline" onClick={reset}><RefreshCw />Create a new link</Button></div>
        )
      )}
    </section>
  );
}

/** Members-only note (e.g. a discount code); RLS returns nothing to non-members. */
export function MemberNote({ planId }: { planId: string }) {
  const q = useQuery({ queryKey: ["member-note", planId], queryFn: async () => (await supabase.from("plan_member_notes").select("note").eq("plan_id", planId).maybeSingle()).data });
  return q.data ? <p className="mt-3 rounded-lg border border-grass bg-grass-soft p-3 text-sm"><strong>Members only: </strong>{q.data.note}</p> : null;
}

export function InterestedButton({ planId }: { planId: string }) {
  const auth = useAuthAction();
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4">
      <p className="text-sm">Save the date. Details are still being confirmed.</p>
      <Button className="mt-3" onClick={() => auth(async (account) => {
        const { error } = await supabase.from("saved_plans").upsert({ user_id: account.id, plan_id: planId });
        if (error) toast.error(error.message); else toast.success("Marked as interested. It's in your saved plans.");
      }, "mark yourself interested")}><Star />I'm interested</Button>
    </div>
  );
}
