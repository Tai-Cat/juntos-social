import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { AddTripButton } from "@/components/tagalong/TripForm";
import { Empty, Section, VerifiedBadge } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { PLAN_SELECT, formatDates, formatWhen, type PlanWithHost } from "@/lib/tagalong";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — Tagalong" }, { name: "description", content: "Your plans, trips and reliability." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile } = useMyProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const hosting = useQuery({
    queryKey: ["plans", "hosting", user?.id],
    enabled: !!user,
    queryFn: async () => ((await supabase.from("plans").select(PLAN_SELECT).eq("host_id", user!.id).order("starts_at", { ascending: false })).data ?? []) as unknown as PlanWithHost[],
  });
  const joined = useQuery({
    queryKey: ["plans", "joined", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("join_requests").select("status, plans(id, title, starts_at, area_label)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const trips = useQuery({
    queryKey: ["trips", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("trips").select("*").eq("user_id", user!.id).order("start_date")).data ?? [],
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!profile) return <AppShell><Empty>Loading…</Empty></AppShell>;
  const statusLabel: Record<string, string> = { pending: "Waiting for approval", approved: "Going", declined: "Declined" };

  return (
    <AppShell title="Profile">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl">{profile.name || "You"}</h1>
          {profile.pronouns && <p className="mt-1 text-sm text-muted-foreground">{profile.pronouns}</p>}
        </div>
        <Link to="/onboarding" className="text-sm text-muted-foreground hover:text-foreground">Edit</Link>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        {profile.verified ? <VerifiedBadge verified /> : <Link to="/verify" className="text-tangerine">Verify it's you</Link>}
        <span>{profile.reliability_score}% reliable</span>
        <span className="text-muted-foreground">{profile.home_city}</span>
      </div>
      {profile.interests.length > 0 && <p className="mt-4 text-sm text-muted-foreground">{profile.interests.join(" · ")}</p>}

      <div className="mt-10 space-y-10">
        <Section title="Hosting">
          {(hosting.data ?? []).length === 0 ? <Empty>You haven't posted a plan yet.</Empty> : (
            <ul className="divide-y divide-border border-y border-border">
              {hosting.data!.map((p) => (
                <li key={p.id}><Link to="/plans/$planId" params={{ planId: p.id }} className="flex justify-between py-3 text-sm"><span>{p.title}</span><span className="text-muted-foreground">{formatWhen(p.starts_at)}</span></Link></li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Joining">
          {(joined.data ?? []).length === 0 ? <Empty>No plans joined yet.</Empty> : (
            <ul className="divide-y divide-border border-y border-border">
              {joined.data!.map((j) => {
                const p = j.plans as { id: string; title: string; starts_at: string } | null;
                if (!p) return null;
                return <li key={p.id}><Link to="/plans/$planId" params={{ planId: p.id }} className="flex justify-between py-3 text-sm"><span>{p.title}</span><span className="text-muted-foreground">{statusLabel[j.status]}</span></Link></li>;
              })}
            </ul>
          )}
        </Section>
        <Section title="Trips">
          <div className="space-y-3">
            {(trips.data ?? []).map((t) => (
              <Link key={t.id} to="/trips/$tripId" params={{ tripId: t.id }} className="flex justify-between rounded-lg border border-border bg-card p-4 text-sm">
                <span className="font-display text-lg">{t.city}</span><span className="text-muted-foreground">{formatDates(t.start_date, t.end_date)}</span>
              </Link>
            ))}
            <AddTripButton />
          </div>
        </Section>
        <Button variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
      </div>
    </AppShell>
  );
}
