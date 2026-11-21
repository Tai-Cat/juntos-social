import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cityImage, countryFlag } from "@/lib/catalog";
import { useBlocks } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { PlanCard } from "@/components/tagalong/PlanCard";
import { SafetyMenu } from "@/components/tagalong/SafetyMenu";
import { Empty, ExampleTag, Section, VerifiedBadge } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import {
  PLAN_SELECT,
  datesOverlap,
  errMsg,
  firstName,
  formatDates,
  sharedInterests,
  type PlanWithHost,
} from "@/lib/tagalong";
import { whatsOn } from "@/lib/whats-on.functions";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Your trip — Tagalong" },
      {
        name: "description",
        content: "Travellers overlapping with you, plans and what's on in the city.",
      },
      { property: "og:title", content: "Your trip — Tagalong" },
      {
        property: "og:description",
        content: "Travellers overlapping with you, plans and what's on in the city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const { tripId } = Route.useParams();
  const { user } = useMyProfile();
  const blocks = useBlocks();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const trip = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => (await supabase.from("trips").select("*").eq("id", tripId).single()).data,
  });
  const t = trip.data;

  const others = useQuery({
    queryKey: ["trips", "city", t?.city],
    enabled: !!t,
    queryFn: async () =>
      (
        await supabase
          .from("trips")
          .select("*, profiles(name, verified, reliability_score)")
          .ilike("city", t?.city ?? "")
          .neq("id", t?.id ?? "")
      ).data ?? [],
  });
  const plans = useQuery({
    queryKey: ["plans", "city", t?.city],
    enabled: !!t,
    queryFn: async () =>
      ((
        await supabase
          .from("plans")
          .select(PLAN_SELECT)
          .ilike("city", t?.city ?? "")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
      ).data ?? []) as unknown as PlanWithHost[],
  });
  const waves = useQuery({
    queryKey: ["waves", user?.id],
    enabled: !!user,
    queryFn: async () =>
      new Set(
        (
          (
            await supabase
              .from("waves")
              .select("to_trip")
              .eq("from_user", user?.id ?? "")
          ).data ?? []
        ).map((w) => w.to_trip),
      ),
  });

  if (!t)
    return (
      <AppShell>
        <Empty>{trip.isLoading ? "Loading…" : "Trip not found."}</Empty>
      </AppShell>
    );

  const overlapping = (others.data ?? [])
    .filter(
      (o) =>
        o.user_id !== user?.id &&
        !(o.user_id && blocks.data?.has(o.user_id)) &&
        datesOverlap(t.start_date, t.end_date, o.start_date, o.end_date),
    )
    .map((o) => ({ ...o, shared: sharedInterests(t.interests, o.interests) }))
    .sort((a, b) => b.shared.length - a.shared.length);

  async function sayHi(id: string, personId: string | null) {
    if (personId) {
      navigate({ to: "/chat/$userId", params: { userId: personId } });
      return;
    }
    if (!user) return;
    const { error } = await supabase.from("waves").insert({ from_user: user.id, to_trip: id });
    if (error && !error.message.includes("duplicate")) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Hi sent. If they wave back, you can plan something together.");
    qc.invalidateQueries({ queryKey: ["waves"] });
  }

  return (
    <AppShell title="Trip">
      <Link
        to="/feed"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Plans
      </Link>
      <img
        src={cityImage(t.city)}
        alt={t.city}
        className="mt-5 aspect-[16/9] max-h-96 w-full rounded-lg object-cover"
      />
      <p className="eyebrow mt-6">
        {countryFlag(t.country)} {t.country}
      </p>
      <h1 className="mt-1 text-4xl">{t.city}</h1>
      <p className="mt-1 text-muted-foreground">{formatDates(t.start_date, t.end_date)}</p>

      <div className="mt-10 space-y-10">
        <Section title="Travellers overlapping with you">
          {overlapping.length === 0 ? (
            <Empty>No one else in {t.city} on these dates yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {overlapping.map((o) => {
                const p = o.profiles as {
                  name: string;
                  verified: boolean;
                  reliability_score: number;
                } | null;
                const name = o.is_example ? (o.example_name ?? "Traveller") : firstName(p?.name);
                const verified = o.is_example ? !!o.example_verified : !!p?.verified;
                const waved = waves.data?.has(o.id);
                return (
                  <li key={o.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg">{name}</span>
                      <VerifiedBadge verified={verified} />
                      <span className="text-xs text-muted-foreground">
                        {p?.reliability_score ?? 100}% reliable
                      </span>
                      {o.is_example && <ExampleTag />}
                      <span className="ml-auto">
                        <SafetyMenu userId={o.user_id} label={name} />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDates(o.start_date, o.end_date)} · {o.shared.length} shared interest
                      {o.shared.length === 1 ? "" : "s"}
                    </p>
                    {o.shared.length > 0 && <p className="mt-2 text-sm">{o.shared.join(", ")}</p>}
                    <Button
                      size="sm"
                      variant={waved ? "outline" : "default"}
                      className="mt-3"
                      disabled={waved}
                      onClick={() => sayHi(o.id, o.user_id)}
                    >
                      {waved ? "Hi sent" : "Say hi"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section
          title={`Plans in ${t.city}`}
          action={
            <Link
              to="/post"
              search={{ city: t.city, country: t.country, travel: true }}
              className="text-sm text-tangerine"
            >
              Post one
            </Link>
          }
        >
          <div className="space-y-4">
            {(plans.data ?? []).length === 0 ? (
              <Empty>No plans here yet.</Empty>
            ) : (
              (plans.data ?? []).map((p) => <PlanCard key={p.id} plan={p} />)
            )}
          </div>
        </Section>

        <WhatsOn city={t.city} country={t.country} start={t.start_date} end={t.end_date} />
      </div>
    </AppShell>
  );
}

function WhatsOn({
  city,
  country,
  start,
  end,
}: {
  city: string;
  country: string;
  start: string;
  end: string;
}) {
  const fn = useServerFn(whatsOn);
  const [enabled, setEnabled] = useState(false);
  const s = new Date(start),
    e = new Date(end);
  const dates = `${s.getDate()}-${e.getDate()} ${e.toLocaleDateString("en-GB", { month: "long" })}`;
  const q = useQuery({
    queryKey: ["whats-on", city, dates],
    enabled,
    staleTime: 1000 * 60 * 30,
    queryFn: () => fn({ data: { city, dates } }),
  });

  return (
    <Section title={`What's on in ${city}`}>
      {!enabled ? (
        <Button variant="outline" className="w-full" onClick={() => setEnabled(true)}>
          Find events for {dates}
        </Button>
      ) : q.isLoading ? (
        <Empty>Searching the web…</Empty>
      ) : q.data?.error ? (
        <Empty>{q.data.error}</Empty>
      ) : (
        <div className="space-y-3">
          {q.data?.answer && <p className="text-sm text-muted-foreground">{q.data.answer}</p>}
          {(q.data?.results ?? []).map((r) => (
            <div key={r.url} className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-lg leading-snug">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {new URL(r.url).hostname.replace("www.", "")}
                </a>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/post"
                    search={{
                      title: r.title.slice(0, 80),
                      category: "Event",
                      description: `${r.summary}\n\nSource: ${r.url}`,
                      city,
                      country,
                      travel: true,
                    }}
                  >
                    Turn into a plan
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
