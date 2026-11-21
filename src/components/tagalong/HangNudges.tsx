import { SocialExamples } from "./SocialExamples";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Choice } from "./Choice";
import { useActivities } from "@/hooks/use-activities";
import { toast } from "sonner";
import { firstName } from "@/lib/tagalong";
export function HangNudges({ inbox = false }: { inbox?: boolean }) {
  const { user } = useSession(),
    qc = useQueryClient(),
    navigate = useNavigate(),
    activities = useActivities();
  const [person, setPerson] = useState<{ id: string; name: string } | null>(null),
    [windowLabel, setWindow] = useState("this week"),
    [activity, setActivity] = useState(""),
    [time, setTime] = useState("any"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const q = useQuery({
    queryKey: ["hang-candidates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("hang_candidates");
      if (error) throw error;
      return data;
    },
  });
  const proposals = useQuery({
    queryKey: ["hang-proposals", user?.id],
    enabled: !!user && inbox,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hang_proposals")
        .select(
          "*,from:profiles!hang_proposals_sender_fkey(name),to:profiles!hang_proposals_recipient_fkey(name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function send() {
    if (!user || !person) return;
    const now = new Date();
    const start =
      windowLabel === "custom dates"
        ? new Date(`${from}T12:00:00`)
        : new Date(now.getTime() + (windowLabel === "next week" ? 7 : 1) * 86400000);
    const end =
      windowLabel === "custom dates"
        ? new Date(`${to}T23:59:00`)
        : new Date(start.getTime() + (windowLabel === "this month" ? 30 : 7) * 86400000);
    const { error } = await supabase
      .from("hang_proposals")
      .insert({
        sender: user.id,
        recipient: person.id,
        activity,
        window_label: windowLabel,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        time_of_day: time,
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Private proposal sent");
    setPerson(null);
    qc.invalidateQueries({ queryKey: ["hang-candidates"] });
    qc.invalidateQueries({ queryKey: ["hang-proposals"] });
  }
  async function respond(id: string, action: string) {
    const suggestion = action === "suggested" ? (prompt("What time would work better?") ?? "") : "";
    if (action === "suggested" && !suggestion) return;
    const { data, error } = await supabase.rpc("respond_proposal", {
      _id: id,
      _action: action,
      _suggestion: suggestion,
    });
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["hang-proposals"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
      if (data) navigate({ to: "/plans/$planId", params: { planId: data } });
      else toast.success(action === "declined" ? "No problem — not now" : "Suggestion sent");
    }
  }
  if (!user) return null;
  return (
    <section className="my-7">
      <h2 className="mb-3 text-2xl">Hang again</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.data?.map((p) => (
          <article key={p.person_id} className="genre-ideas rounded-lg border border-border p-4">
            <p className="text-sm">
              You went to {p.title} with {p.name}{" "}
              {Math.round((Date.now() - new Date(p.last_met).getTime()) / 86400000)} days ago.
            </p>
            <h3 className="my-3 text-xl">Want to do something again?</h3>
            <Button size="sm" onClick={() => setPerson({ id: p.person_id, name: p.name })}>
              Make a little plan
            </Button>
          </article>
        ))}
      </div>
      {inbox &&
        proposals.data?.map((h) => (
          <article key={h.id} className="mt-3 rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-tangerine">
              {h.sender === user.id
                ? `To ${firstName(h.to?.name)}`
                : `From ${firstName(h.from?.name)}`}
            </p>
            <h3 className="mt-2 text-xl">
              {h.activity || "Something together"} · {h.window_label}
            </h3>
            <p className="mt-2 text-sm capitalize">
              {h.time_of_day} · {h.status}
            </p>
            {h.suggestion && <p className="mt-2 text-sm">{h.suggestion}</p>}
            {h.recipient === user.id && ["pending", "suggested"].includes(h.status) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => respond(h.id, "accepted")}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => respond(h.id, "suggested")}>
                  Suggest another time
                </Button>
                <Button size="sm" variant="ghost" onClick={() => respond(h.id, "declined")}>
                  Not now
                </Button>
              </div>
            )}
            {h.plan_id && (
              <Button
                variant="outline"
                className="mt-3"
                onClick={() =>
                  navigate({ to: "/plans/$planId", params: { planId: h.plan_id ?? "" } })
                }
              >
                View private plan
              </Button>
            )}
          </article>
        ))}
      <SocialExamples kind="nudge"/>
      <Drawer
        open={!!person}
        onOpenChange={(v) => {
          if (!v) setPerson(null);
        }}
        shouldScaleBackground={false}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-xl space-y-4 p-5">
            <DrawerHeader>
              <DrawerTitle>A little plan with {person?.name}</DrawerTitle>
            </DrawerHeader>
            <Choice
              label="When"
              value={windowLabel}
              onChange={setWindow}
              options={["this week", "next week", "this month", "custom dates"]}
            />
            {windowLabel === "custom dates" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  aria-label="From date"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <Input
                  aria-label="To date"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            )}
            <Choice
              label="Any time of day"
              value={time}
              onChange={setTime}
              options={["any", "morning", "afternoon", "evening", "late"]}
            />
            <Input
              aria-label="Proposal activity"
              list="proposal-activities"
              placeholder="Activity — or leave it open"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
            <datalist id="proposal-activities">
              {activities.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <Button
              className="w-full"
              onClick={send}
              disabled={windowLabel === "custom dates" && (!from || !to || to < from)}
            >
              Send private proposal
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
