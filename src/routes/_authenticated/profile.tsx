import { usePlus } from "@/hooks/use-plus";
import { Switch } from "@/components/ui/switch";
import { Choice } from "@/components/tagalong/Choice";
import { TripCard } from "@/components/tagalong/TripCard";
import { imageFor, PLUS_MONTHLY_EUR } from "@/lib/catalog";
import { toast } from "sonner";
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
  head: () => ({
    meta: [
      { title: "Your profile — Tagalong" },
      { name: "description", content: "Your plans, trips and reliability." },
      { property: "og:title", content: "Your profile — Tagalong" },
      { property: "og:description", content: "Your plans, trips and reliability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile } = useMyProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { plus, setPlus } = usePlus();
  const levels = useQuery({
    queryKey: ["interest-levels", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("interest_levels")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });
  async function setLevel(interest: string, level: string) {
    if (!user) return;
    const { error } = await supabase
      .from("interest_levels")
      .upsert({ user_id: user.id, interest, level: level || "any" }, { onConflict: "user_id,interest" });
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["interest-levels"] });
  }

  const hosting = useQuery({
    queryKey: ["plans", "hosting", user?.id],
    enabled: !!user,
    queryFn: async () =>
      ((
        await supabase
          .from("plans")
          .select(PLAN_SELECT)
          .eq("host_id", user?.id ?? "")
          .order("starts_at", { ascending: false })
      ).data ?? []) as unknown as PlanWithHost[],
  });
  const joined = useQuery({
    queryKey: ["plans", "joined", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("join_requests")
          .select("status, plans(id, title, starts_at, area_label)")
          .eq("user_id", user?.id ?? "")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const trips = useQuery({
    queryKey: ["trips", "mine", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("trips")
          .select("*")
          .eq("user_id", user?.id ?? "")
          .order("start_date")
      ).data ?? [],
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!profile)
    return (
      <AppShell>
        <Empty>Loading…</Empty>
      </AppShell>
    );
  const statusLabel: Record<string, string> = {
    pending: "Waiting for approval",
    approved: "Going",
    declined: "Declined",
  };

  return (
    <AppShell title="Profile">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl">{profile.name || "You"}</h1>
          {profile.pronouns && (
            <p className="mt-1 text-sm text-muted-foreground">{profile.pronouns}</p>
          )}
        </div>
        <Link to="/onboarding" className="text-sm text-muted-foreground hover:text-foreground">
          Edit
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        {profile.verified ? (
          <VerifiedBadge verified />
        ) : (
          <Link to="/verify" className="text-tangerine">
            Verify it's you
          </Link>
        )}
        <span>{profile.reliability_score}% reliable</span>
        <span className="text-muted-foreground">{profile.home_city}</span>
      </div>
      <section className="mt-7">
        <h2 className="mb-3 text-2xl">Your interests and levels</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.interests.map((i) => (
            <div
              key={i}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <img
                src={imageFor(i)}
                alt=""
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-sm font-bold capitalize">{i}</p>
                <Choice
                  label="Any level"
                  value={levels.data?.find((l) => l.interest === i)?.level ?? "any"}
                  onChange={(v) => setLevel(i, v)}
                  options={["any", "beginner", "intermediate", "advanced"]}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      {profile.learning_interests.length > 0 && (
        <section className="mt-6">
          <h2 className="text-2xl">I want to learn</h2>
          <p className="mt-2 text-sm">{profile.learning_interests.join(" · ")}</p>
        </section>
      )}
      <section className="genre-ideas mt-7 rounded-lg border border-border p-5">
        <h2 className="text-2xl">Settings</h2>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="font-bold">Tagalong Plus · {PLUS_MONTHLY_EUR} EUR a month</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulate Plus (demo) · no payment taken
            </p>
          </div>
          <Switch aria-label="Simulate Plus" checked={plus} onCheckedChange={setPlus} />
        </div>
      </section>

      <div className="mt-10 space-y-10">
        <Section title="Hosting">
          {(hosting.data ?? []).length === 0 ? (
            <Empty>You haven't posted a plan yet.</Empty>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {(hosting.data ?? []).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/plans/$planId"
                    params={{ planId: p.id }}
                    className="flex justify-between py-3 text-sm"
                  >
                    <span>{p.title}</span>
                    <span className="text-muted-foreground">{formatWhen(p.starts_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Joining">
          {(joined.data ?? []).length === 0 ? (
            <Empty>No plans joined yet.</Empty>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {(joined.data ?? []).map((j) => {
                const p = j.plans as { id: string; title: string; starts_at: string } | null;
                if (!p) return null;
                return (
                  <li key={p.id}>
                    <Link
                      to="/plans/$planId"
                      params={{ planId: p.id }}
                      className="flex justify-between py-3 text-sm"
                    >
                      <span>{p.title}</span>
                      <span className="text-muted-foreground">{statusLabel[j.status]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
        <Section title="Trips">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(trips.data ?? []).map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
            <AddTripButton />
          </div>
        </Section>
        <Button variant="ghost" className="w-full" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
