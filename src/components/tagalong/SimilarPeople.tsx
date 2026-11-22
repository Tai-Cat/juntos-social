import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "./bits";
import { SafetyMenu } from "./SafetyMenu";
import { sharedInterests } from "@/lib/tagalong";
import { activityLabel } from "@/lib/catalog";
export function SimilarPeople({
  city,
  activity = "",
  level = "",
}: {
  city: string;
  activity?: string;
  level?: string;
}) {
  const { profile, user } = useMyProfile();
  const interests = activity
    ? [activity, ...(profile?.interests ?? [])]
    : (profile?.interests ?? []);
  const q = useQuery({
    queryKey: ["similar", user?.id, city, activity, level, interests],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("similar_people", {
        _city: city,
        _interests: interests,
        _activity: activity,
        _level: level,
      });
      if (error) throw error;
      return data;
    },
  });
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-2"><h2 className="text-2xl">People with similar interests</h2>{!!q.data?.length && <span className="text-xs text-muted-foreground">Swipe →</span>}</div>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Finding your people…</p>
      ) : q.error ? (
        <p className="text-sm text-muted-foreground">People couldn’t load. Try again shortly.</p>
      ) : !q.data?.length ? (
        <p className="border-y border-border py-5 text-sm text-muted-foreground">
          Your people are on their way. Add interests to find more matches.
        </p>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0" aria-label="People with similar interests, swipe to see more">
          {q.data.map((p) => {
            const shared = sharedInterests(interests, p.interests).map(activityLabel);
            const others = p.interests.filter((i) => !shared.some((x) => x.toLowerCase() === activityLabel(i).toLowerCase())).slice(0, 3).map(activityLabel);
            return (
              <article key={p.id} className="genre-ideas flex w-[78%] max-w-xs shrink-0 snap-start flex-col rounded-2xl border border-border p-4 sm:w-72">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sunflower font-display text-xl">{p.name.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl leading-tight"><Link to="/people/$userId" params={{ userId: p.id }}>{p.name}</Link></h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs"><VerifiedBadge verified={p.verified} /><span>{p.reliability_score}% reliable</span></div>
                  </div>
                  <SafetyMenu userId={p.id} label={p.name} />
                </div>
                <p className="eyebrow mt-4">{shared.length} in common</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {shared.slice(0, 6).map((i) => <span key={i} className="rounded-full bg-tangerine-soft px-2.5 py-1 text-xs font-bold text-tangerine">{i}</span>)}
                  {others.map((i) => <span key={i} className="rounded-full bg-card px-2.5 py-1 text-xs">{i}</span>)}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button asChild size="sm" className="flex-1"><Link to="/chat/$userId" params={{ userId: p.id }}>Say hi</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/people/$userId" params={{ userId: p.id }}>Profile</Link></Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
