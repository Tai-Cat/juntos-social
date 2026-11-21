import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, MapPin, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { SafetyMenu } from "@/components/tagalong/SafetyMenu";
import { VerifiedBadge } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { activityLabel } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/people/$userId")({
  head: () => ({ meta: [{ title: "Profile — Juntos" }, { name: "description", content: "See someone you'll meet at a plan and add them as a friend." }, { property: "og:title", content: "Profile — Juntos" }, { property: "og:description", content: "Meet people at plans on Juntos." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Person,
});

function Person() {
  const { userId } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["person", userId, user?.id], enabled: !!user, queryFn: async () => { const { data, error } = await supabase.rpc("person_card", { _user: userId }); if (error) throw error; return data?.[0] ?? null; } });
  const p = q.data;
  async function addFriend() {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester: user.id, recipient: userId });
    if (error) toast.error(error.message.includes("duplicate") ? "You're already connected or have a request pending" : error.message);
    else { toast.success("Friend request sent"); await qc.invalidateQueries({ queryKey: ["person"] }); await qc.invalidateQueries({ queryKey: ["friends"] }); }
  }
  if (q.isLoading) return <AppShell title="Profile"><p className="py-10 text-muted-foreground">Loading…</p></AppShell>;
  if (!p) return <AppShell title="Profile"><p className="py-10">This profile isn't available.</p></AppShell>;
  const fs = p.friend_status;
  return (
    <AppShell title="Profile">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-tangerine-soft font-display text-3xl font-bold text-tangerine">{p.hidden ? <Lock /> : p.name?.[0]?.toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-3xl">{p.hidden ? "Private profile" : p.name}<VerifiedBadge verified={p.verified} /></h1>
          {p.home_city && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.home_city}</p>}
        </div>
        {userId !== user?.id && <SafetyMenu userId={userId} label={p.name ?? "this person"} />}
      </div>
      {userId !== user?.id && (
        <div className="mt-6">
          {fs === "accepted" ? <p className="text-sm font-semibold">You're friends</p>
            : fs === "pending_sent" ? <Button disabled variant="outline">Request sent</Button>
            : fs === "pending_received" ? <p className="text-sm">They've asked to be your friend. Answer in Inbox, Requests.</p>
            : <Button onClick={addFriend}><UserPlus />Add friend</Button>}
        </div>
      )}
      {p.hidden ? <p className="mt-6 text-sm text-muted-foreground">This person keeps their profile private. You'll see more once you're friends.</p> : p.interests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl">Interests</h2>
          <div className="flex flex-wrap gap-2">{p.interests.map((i) => <span key={i} className="rounded-full border border-border bg-card px-3 py-1 text-sm capitalize">{activityLabel(i)}</span>)}</div>
        </section>
      )}
    </AppShell>
  );
}
