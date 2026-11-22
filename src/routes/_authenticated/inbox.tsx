import { SocialExamples } from "@/components/tagalong/SocialExamples";
import { useState } from "react";
import { Plus } from "lucide-react";
import { FindPeople, FriendsPanel } from "@/components/tagalong/Friends";
import { InvitesInbox } from "@/components/tagalong/PlanInvites";
import { HangNudges } from "@/components/tagalong/HangNudges";
import { Conversations } from "@/components/tagalong/Conversations";
import { NotificationsList } from "@/components/tagalong/Notifications";
import { AlertsInbox } from "@/components/tagalong/AlertsInbox";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { SafetyMenu } from "@/components/tagalong/SafetyMenu";
import { Empty, VerifiedBadge } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { errMsg, firstName, formatWhen } from "@/lib/tagalong";
import { GENRES, genreClass } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "My Activity — Juntos" },
      { name: "description", content: "Your plans, invitations, messages and activity." },
      { property: "og:title", content: "My Activity — Juntos" },
      {
        property: "og:description",
        content: "Your plans, invitations, messages and activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: string } => (typeof s["tab"] === "string" ? { tab: s["tab"] } : {}),
  component: Inbox,
});

function Inbox() {
  const { user } = useSession();
  const search = Route.useSearch();
  const [tab, setTab] = useState(search.tab ?? "plans"),
    [find, setFind] = useState(false);
  const qc = useQueryClient();
  const hosted = useQuery({
    queryKey: ["activity-hosted", user?.id], enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("plans").select("id,title,starts_at,status,going_count,capacity,city,area_label,genre").eq("host_id", user?.id ?? "").order("starts_at", { ascending: true }); if (error) throw error; return data ?? []; },
  });
  const attending = useQuery({
    queryKey: ["activity-attending", user?.id], enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("join_requests").select("id,status,plans!inner(id,title,starts_at,status,city,area_label,host_id,genre)").eq("user_id", user?.id ?? "").in("status", ["pending", "approved", "cancelled"]).order("created_at", { ascending: false }); if (error) throw error; return data ?? []; },
  });
  const saved = useQuery({
    queryKey: ["activity-saved", user?.id], enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("saved_plans").select("plan_id,plans!inner(id,title,starts_at,city,area_label,status,genre)").eq("user_id", user?.id ?? "").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; },
  });
  const q = useQuery({
    queryKey: ["inbox", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("join_requests")
        .select(
          "id, status, bring_buddy, created_at, user_id, profiles(name, verified, reliability_score, no_show_count), plans!inner(id, title, starts_at, host_id, capacity, going_count)",
        )
        .eq("plans.host_id", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function cancelHosted(id: string, title: string) {
    if (!window.confirm(`Cancel “${title}”? Attendees and people waiting for approval will be notified.`)) return;
    const { error } = await supabase.rpc("cancel_plan", { _plan: id });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Plan cancelled and attendees notified");
    await Promise.all([qc.invalidateQueries({ queryKey: ["activity-hosted"] }), qc.invalidateQueries({ queryKey: ["activity-attending"] }), qc.invalidateQueries({ queryKey: ["plans"] })]);
  }
  async function cancelAttendance(id: string, title: string) {
    if (!window.confirm(`Cancel your place or request for “${title}”?`)) return;
    const { error } = await supabase.rpc("cancel_my_join", { _plan: id });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Your place or request was cancelled");
    await Promise.all([qc.invalidateQueries({ queryKey: ["activity-attending"] }), qc.invalidateQueries({ queryKey: ["plans"] })]);
  }

  async function decide(id: string, status: "approved" | "declined") {
    const { error } = await supabase.from("join_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success(status === "approved" ? "Approved" : "Declined");
    qc.invalidateQueries({ queryKey: ["inbox"] });
    qc.invalidateQueries({ queryKey: ["plans"] });
  }

  const pending = (q.data ?? []).filter((r) => r.status === "pending");
  const done = (q.data ?? []).filter((r) => r.status !== "pending");

  return (
    <AppShell title="My Activity">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-4xl">My Activity</h1>
        <Button
          size="icon"
          variant="outline"
          aria-label="New connection"
          onClick={() => setFind(true)}
        >
          <Plus />
        </Button>
      </div>
      <FindPeople open={find} onOpenChange={setFind} />
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {["plans", "messages", "notifications", "invites", "requests", "nudges"].map((t) => (
          <Button
            className="capitalize"
            key={t}
            variant={tab === t ? "secondary" : "outline"}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      {tab === "plans" ? (
        <section className="space-y-8">
          <div>
            <h2 className="mb-3 text-2xl">Plans you're hosting</h2>
            {hosted.isLoading ? <Empty>Loading your plans…</Empty> : !hosted.data?.length ? <Empty>You haven't hosted a plan yet.</Empty> : <div className="space-y-2">{GENRES.map(g => { const items = hosted.data.filter(p => p.genre === g.id); return items.length ? <details key={g.id} className={`rounded-xl border border-border ${genreClass(g.id)}`}><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold"><span className="genre-label">{g.label}</span><span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span></summary><div className="space-y-2 border-t border-border p-3">{items.map(p => <article key={p.id} className="rounded-lg border border-border bg-card p-3"><Link to="/plans/$planId" params={{planId:p.id}} className="font-semibold">{p.title}</Link><p className="mt-1 text-xs text-muted-foreground">{formatWhen(p.starts_at)} · {p.area_label}, {p.city} · {p.going_count}/{p.capacity} going</p><div className="mt-3 flex items-center justify-between"><span className="text-xs capitalize text-muted-foreground">{p.status === "cancelled" ? "Cancelled" : new Date(p.starts_at).getTime() < Date.now() ? "Past" : "Active"}</span>{p.status !== "cancelled" && new Date(p.starts_at).getTime() > Date.now() && <Button size="sm" variant="destructive" onClick={() => cancelHosted(p.id,p.title)}>Cancel plan</Button>}</div></article>)}</div></details> : null; })}</div>}
          </div>
          <div>
            <h2 className="mb-3 text-2xl">Plans you're joining</h2>
            {attending.isLoading ? <Empty>Loading your plans…</Empty> : !attending.data?.length ? <Empty>You haven't joined or requested a place yet.</Empty> : <div className="space-y-2">{GENRES.map(g => { const items = attending.data.filter(r => (r.plans as {genre?:string}|null)?.genre === g.id); return items.length ? <details key={g.id} className={`rounded-xl border border-border ${genreClass(g.id)}`}><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold"><span className="genre-label">{g.label}</span><span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span></summary><div className="space-y-2 border-t border-border p-3">{items.map(r => { const p = r.plans as {id:string;title:string;starts_at:string;status:string;city:string;area_label:string}|null; if(!p)return null; return <article key={r.id} className="rounded-lg border border-border bg-card p-3"><Link to="/plans/$planId" params={{planId:p.id}} className="font-semibold">{p.title}</Link><p className="mt-1 text-xs text-muted-foreground">{formatWhen(p.starts_at)} · {p.area_label}, {p.city} · {r.status === "cancelled" ? "Cancelled" : r.status === "approved" ? "Going" : "Awaiting approval"}</p><div className="mt-3 flex justify-end">{r.status !== "cancelled" && p.status !== "cancelled" && new Date(p.starts_at).getTime() > Date.now() && <Button size="sm" variant="outline" onClick={() => cancelAttendance(p.id,p.title)}>Cancel my place</Button>}</div></article>; })}</div></details> : null; })}</div>}
          </div>
          <div>
            <h2 className="mb-3 text-2xl">Saved plans</h2>
            {!saved.data?.length ? <Empty>No saved plans yet.</Empty> : <div className="space-y-2">{GENRES.map(g => { const items = saved.data.filter(s => (s.plans as {genre?:string}|null)?.genre === g.id); return items.length ? <details key={g.id} className={`rounded-xl border border-border ${genreClass(g.id)}`}><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold"><span className="genre-label">{g.label}</span><span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span></summary><ul className="divide-y divide-border border-t border-border px-3">{items.map(s => { const p=s.plans as {id:string;title:string;starts_at:string;status:string}|null; return p ? <li key={p.id} className="py-3"><Link to="/plans/$planId" params={{planId:p.id}} className="font-medium">{p.title}</Link><p className="text-xs text-muted-foreground">{formatWhen(p.starts_at)} {p.status === "cancelled" ? "· Cancelled" : ""}</p></li> : null; })}</ul></details> : null; })}</div>}
          </div>
        </section>
      ) : tab === "messages" ? (
        <>
          <Conversations /><SocialExamples kind="message"/>
          <AlertsInbox />
        </>
      ) : tab === "notifications" ? (
        <NotificationsList />
      ) : tab === "invites" ? (
        <InvitesInbox />
      ) : tab === "nudges" ? (
        <HangNudges inbox />
      ) : (
        <>
          <FriendsPanel />
          <h2 className="text-2xl">Join requests</h2>
          <div className="mt-6 space-y-4">
            {q.isLoading ? (
              <Empty>Loading…</Empty>
            ) : pending.length === 0 ? (
              <Empty>
                No pending requests. When someone asks to join your plan, they'll show up here.
              </Empty>
            ) : (
              pending.map((r) => {
                const p = r.profiles as {
                  name: string;
                  verified: boolean;
                  reliability_score: number;
                  no_show_count: number;
                } | null;
                const plan = r.plans as {
                  id: string;
                  title: string;
                  starts_at: string;
                  capacity: number;
                  going_count: number;
                };
                return (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl">{firstName(p?.name)}</span>
                      <VerifiedBadge verified={!!p?.verified} />
                      <span className="ml-auto">
                        <SafetyMenu userId={r.user_id} label={firstName(p?.name)} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p?.reliability_score ?? 100}% reliable
                      {r.bring_buddy && " · Bringing a buddy (+1)"}
                      {(p?.no_show_count ?? 0) >= 2 && " · 2+ no-shows"}
                    </p>
                    <Link
                      to="/plans/$planId"
                      params={{ planId: plan.id }}
                      className="mt-3 block border-t border-border pt-3 text-sm"
                    >
                      {plan.title}{" "}
                      <span className="text-muted-foreground">
                        · {formatWhen(plan.starts_at)} · {plan.going_count}/{plan.capacity}
                      </span>
                    </Link>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => decide(r.id, "declined")}>
                        Decline
                      </Button>
                      <Button onClick={() => decide(r.id, "approved")}>Approve</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {done.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow mb-3">Handled</p>
              <ul className="divide-y divide-border border-y border-border text-sm">
                {done.map((r) => (
                  <li key={r.id} className="flex justify-between py-3">
                    <span>
                      {firstName((r.profiles as { name: string } | null)?.name)} ·{" "}
                      {(r.plans as { title: string }).title}
                    </span>
                    <span className="text-muted-foreground capitalize">{r.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}
