import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useAuthAction } from "./AuthSheet";
import { Button } from "@/components/ui/button";

type Person = { user_id: string; name: string | null; verified: boolean; status: string; hidden: boolean };

function Avatar({ p }: { p: Person }) {
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-base font-bold ${p.hidden ? "bg-muted text-muted-foreground" : "bg-tangerine-soft text-tangerine"}`}>{p.hidden ? <Lock className="h-4 w-4" /> : (p.name?.[0]?.toUpperCase() ?? "?")}</span>;
}

/** Going and Interested people on a plan; names of private profiles stay hidden (hosts see everyone). */
export function PlanPeople({ planId }: { planId: string }) {
  const { user } = useSession();
  const auth = useAuthAction();
  const q = useQuery({
    queryKey: ["plan-people", planId, user?.id],
    enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.rpc("plan_people", { _plan: planId }); if (error) throw error; return (data ?? []) as Person[]; },
  });
  if (!user) return (
    <section className="mt-8 rounded-lg border border-border bg-card p-4 text-sm">
      <p className="eyebrow mb-2">Who's coming</p>
      <p className="text-muted-foreground">Sign in to see who's going and who's interested.</p>
      <Button size="sm" variant="outline" className="mt-3" onClick={() => auth(() => {}, "see who's going")}>Sign in</Button>
    </section>
  );
  const groups = [["going", "Going"], ["interested", "Interested"]] as const;
  const people = q.data ?? [];
  return (
    <section className="mt-8">
      {groups.map(([key, label]) => {
        const list = people.filter((p) => p.status === key);
        return (
          <div key={key} className="mb-5">
            <p className="eyebrow mb-3">{label} · {list.length}</p>
            {!list.length ? <p className="text-sm text-muted-foreground">{key === "going" ? "Nobody yet. Be the first." : "Nobody has saved this yet."}</p> : (
              <ul className="flex flex-wrap gap-3">
                {list.map((p) => (
                  <li key={p.user_id} className="w-16 text-center">
                    {p.hidden || p.user_id === user.id ? (
                      <div className="flex flex-col items-center gap-1"><Avatar p={p} /><span className="w-full truncate text-xs">{p.user_id === user.id ? "You" : "Private"}</span></div>
                    ) : (
                      <Link to="/people/$userId" params={{ userId: p.user_id }} className="flex flex-col items-center gap-1" aria-label={`View ${p.name}'s profile`}><Avatar p={p} /><span className="w-full truncate text-xs font-semibold">{p.name}</span></Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
