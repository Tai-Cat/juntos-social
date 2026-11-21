import { Conversations } from "@/components/tagalong/Conversations";
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

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Join requests — Tagalong" },
      { name: "description", content: "Approve or decline people who want to join your plans." },
      { property: "og:title", content: "Join requests — Tagalong" },
      {
        property: "og:description",
        content: "Approve or decline people who want to join your plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const { user } = useSession();
  const qc = useQueryClient();
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
    <AppShell title="Inbox">
      <h1 className="mb-6 text-4xl">Inbox</h1>
      <Conversations />
      <AlertsInbox />
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
    </AppShell>
  );
}
