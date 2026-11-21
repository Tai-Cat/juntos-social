import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enablePush, isInstalled, pushIsOn, pushSupported } from "@/lib/push";

type Req = { id: string; user_id: string; status: string; answer: string; profiles: { name: string } | null };
type Member = { user_id: string; role: string; joined_at: string | null; joined_via: string; profiles: { name: string } | null };

const RULES = [
  { value: "manual", label: "Manual approval", hint: "Admins approve every request." },
  { value: "domain", label: "Auto-approve verified emails", hint: "People with a confirmed email on an allowed domain join straight away. Everyone else waits for approval." },
  { value: "domain_and_answer", label: "Verified email plus answer", hint: "A confirmed email on an allowed domain and an answer to the question let people in. Everyone else waits for approval." },
] as const;

/** Requests tab, entry rules and recently joined list for the organisation Manage page. */
export function OrgRequests({ orgId, isSubgroup, entryRule, domains }: { orgId: string; isSubgroup: boolean; entryRule: string | null; domains: string[] }) {
  const qc = useQueryClient();
  const requests = useQuery({ queryKey: ["admin-org-requests", orgId], queryFn: async () => { const { data, error } = await supabase.from("organisation_requests").select("id,user_id,status,answer,profiles(name)").eq("organisation_id", orgId); if (error) throw error; return data as unknown as Req[]; } });
  const members = useQuery({ queryKey: ["admin-org-members", orgId], queryFn: async () => { const { data, error } = await supabase.from("organisation_members").select("*,profiles(name)").eq("organisation_id", orgId); if (error) throw error; return data as unknown as Member[]; } });
  const by = (s: string) => (requests.data ?? []).filter((r) => r.status === s);
  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_org_request", { _request: id, _approve: approve });
    if (error) toast.error(error.message); else { toast.success(approve ? "Member approved" : "Request declined"); await qc.invalidateQueries(); }
  }
  async function remove(userId: string) {
    const { error } = await supabase.rpc("remove_org_member", { _org: orgId, _user: userId });
    if (error) toast.error(error.message); else { toast.success("Removed"); await qc.invalidateQueries(); }
  }
  const recent = (members.data ?? []).filter((m) => m.joined_at && Date.now() - new Date(m.joined_at).getTime() < 30 * 864e5).sort((a, b) => (b.joined_at ?? "").localeCompare(a.joined_at ?? ""));
  const list = (rows: Req[], empty: string) => !rows.length ? <p className="py-4 text-sm text-muted-foreground">{empty}</p> : rows.map((r) => (
    <article key={r.id} className="border-b border-border py-4">
      <p className="text-sm font-bold">{r.profiles?.name?.split(" ")[0] ?? "Someone"}</p>
      <p className="my-2 whitespace-pre-wrap break-words text-sm">{r.answer}</p>
      <div className="flex gap-2">
        {r.status !== "approved" && <Button size="sm" onClick={() => review(r.id, true)}>Approve</Button>}
        {r.status === "pending" && <Button size="sm" variant="outline" onClick={() => review(r.id, false)}>Decline</Button>}
        {r.status === "approved" && <Button size="sm" variant="outline" onClick={() => remove(r.user_id)}>Remove</Button>}
      </div>
    </article>
  ));
  return (
    <>
      <section id="requests" className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h2 className="truncate text-2xl">Requests</h2><PushToggle /></div>
        <Tabs defaultValue="pending" className="mt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending {by("pending").length > 0 && `(${by("pending").length})`}</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">{list(by("pending"), "No pending requests.")}</TabsContent>
          <TabsContent value="approved">{list(by("approved"), "No approved requests yet.")}</TabsContent>
          <TabsContent value="declined">{list(by("declined"), "No declined requests.")}</TabsContent>
        </Tabs>
      </section>
      <EntryRules orgId={orgId} isSubgroup={isSubgroup} entryRule={entryRule} domains={domains} />
      <section className="mt-6">
        <h2 className="text-2xl">Recently joined</h2>
        <p className="text-xs text-muted-foreground">Everyone who joined in the last 30 days, including people let in automatically.</p>
        {!recent.length ? <p className="py-3 text-sm text-muted-foreground">Nobody new yet.</p> : recent.map((m) => (
          <div key={m.user_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-3 text-sm">
            <span className="min-w-0 truncate"><strong>{m.profiles?.name?.split(" ")[0] ?? "Member"}</strong> · {m.joined_via === "domain" ? "verified email" : m.joined_via === "inherited" ? "via parent" : m.joined_via === "passphrase" ? "passphrase" : "approved"} · {new Date(m.joined_at ?? "").toLocaleDateString()}</span>
            {m.role === "member" && <Button size="sm" variant="outline" onClick={() => remove(m.user_id)}>Remove</Button>}
          </div>
        ))}
      </section>
    </>
  );
}

function EntryRules({ orgId, isSubgroup, entryRule, domains }: { orgId: string; isSubgroup: boolean; entryRule: string | null; domains: string[] }) {
  const qc = useQueryClient();
  const [rule, setRule] = useState<string>(entryRule ?? (isSubgroup ? "inherit" : "manual"));
  useEffect(() => setRule(entryRule ?? (isSubgroup ? "inherit" : "manual")), [entryRule, isSubgroup]);
  async function save(v: string) {
    setRule(v);
    const { error } = await supabase.rpc("set_entry_rule", { _org: orgId, ...(v === "inherit" ? {} : { _rule: v }) } as { _org: string; _rule: string });
    if (error) toast.error(error.message); else { toast.success("Entry rule saved"); await qc.invalidateQueries(); }
  }
  const options = [...(isSubgroup ? [{ value: "inherit", label: "Same as parent", hint: "Use the parent organisation's rule. Parent members join without a second check." }] : []), ...RULES];
  return (
    <section className="mt-6">
      <h2 className="text-2xl">Entry rules</h2>
      <p className="text-xs text-muted-foreground">Allowed domains: {domains.length ? domains.join(", ") : "none yet (set them under Access below)"}. Email domains count only once the person has confirmed that email.</p>
      <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Entry rule">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={rule === o.value} onClick={() => save(o.value)} className={`rounded-lg border p-3 text-left text-sm ${rule === o.value ? "border-foreground bg-secondary" : "border-border bg-card"}`}>
            <span className="font-bold">{o.label}</span><br /><span className="text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PushToggle() {
  const { user } = useSession();
  const [on, setOn] = useState(false);
  useEffect(() => { void pushIsOn().then(setOn); }, []);
  if (on) return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bell className="h-3.5 w-3.5" />Phone alerts on</span>;
  return (
    <Button size="sm" variant="outline" onClick={async () => {
      if (!user) return;
      if (!pushSupported()) { toast(isInstalled() ? "This browser can't show notifications." : "Add Juntos to your home screen first (Share, then Add to Home Screen), then open it from there."); return; }
      try { const r = await enablePush(user.id); if (r === "on") { setOn(true); toast.success("Notifications turned on"); } else toast("Notifications are blocked. You can allow them in your phone settings."); } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't turn on notifications"); }
    }}><Bell />Turn on notifications</Button>
  );
}

export function RequestsLink({ orgId }: { orgId: string }) {
  return <Link to="/organisation-admin/$orgId" params={{ orgId }} hash="requests">Requests</Link>;
}
