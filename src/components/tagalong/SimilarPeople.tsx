import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "./bits";
import { SafetyMenu } from "./SafetyMenu";
import { sharedInterests } from "@/lib/tagalong";
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
      <h2 className="mb-4 text-2xl">People with similar interests</h2>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Finding your people…</p>
      ) : q.error ? (
        <p className="text-sm text-muted-foreground">People couldn’t load. Try again shortly.</p>
      ) : !q.data?.length ? (
        <p className="border-y border-border py-5 text-sm text-muted-foreground">
          Your people are on their way. Add interests to find more matches.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((p) => (
            <div key={p.id} className="genre-ideas rounded-lg border border-border p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
                <h3 className="truncate text-xl">{p.name}</h3>
                <SafetyMenu userId={p.id} label={p.name} />
              </div>
              <div className="my-2 flex flex-wrap gap-2 text-xs">
                <VerifiedBadge verified={p.verified} />
                <span>{p.reliability_score}% reliable</span>
              </div>
              <p className="mb-3 truncate text-xs text-muted-foreground">
                {sharedInterests(interests, p.interests).join(" · ")}
              </p>
              <Button asChild size="sm">
                <Link to="/chat/$userId" params={{ userId: p.id }}>
                  Say hi
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
