import { SocialExamples } from "./SocialExamples";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Share2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useFriends } from "./Friends";
import { useAuthAction } from "./AuthSheet";
import { toast } from "sonner";
import { firstName, formatWhen } from "@/lib/tagalong";
export function FriendsGoing({ planId }: { planId: string }) {
  const { user } = useSession();
  const q = useQuery({
    queryKey: ["friends-going", planId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("friends_going", { _plan: planId });
      return data ?? [];
    },
  });
  return q.data?.length ? (
    <p className="my-3 text-xs font-semibold text-grass">
      {q.data.map((p) => p.name).join(", ")} {q.data.length === 1 ? "is" : "are"} going
    </p>
  ) : null;
}
export function PlanInvites({ planId, member }: { planId: string; member: boolean }) {
  const { user } = useSession(),
    friends = useFriends(),
    auth = useAuthAction(),
    qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["plan-invites", planId, user?.id],
    enabled: member,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_invites")
        .select("*,person:profiles!plan_invites_invitee_fkey(name)")
        .eq("plan_id", planId);
      if (error) throw error;
      return data;
    },
  });
  async function invite(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("plan_invites")
      .insert({ plan_id: planId, inviter: user.id, invitee: id });
    if (error) toast.error(error.message.includes("duplicate") ? "Already invited" : error.message);
    else {
      toast.success("Invitation sent");
      qc.invalidateQueries({ queryKey: ["plan-invites"] });
    }
  }
  return (
    <section className="mt-6">
      <FriendsGoing planId={planId} />
      <Button
        variant="outline"
        onClick={() =>
          auth(() => {
            if (!member) {
              toast("Join this plan before inviting friends.");
              return;
            }
            setOpen(true);
          }, "invite your friends")
        }
      >
        <UserPlus />
        Invite friends
      </Button>
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-xl p-5">
            <DrawerHeader>
              <DrawerTitle>A plan is better together</DrawerTitle>
            </DrawerHeader>
            <Button
              variant="outline"
              className="mb-4 w-full"
              onClick={async () => {
                if (!user) return;
                let { data } = await supabase
                  .from("plan_invite_links")
                  .select("token")
                  .eq("plan_id", planId)
                  .eq("inviter", user.id)
                  .maybeSingle();
                if (!data) {
                  const r = await supabase
                    .from("plan_invite_links")
                    .insert({ plan_id: planId, inviter: user.id })
                    .select("token")
                    .single();
                  if (r.error) {
                    toast.error(r.error.message);
                    return;
                  }
                  data = r.data;
                }
                if (!data) return;
                await navigator.clipboard.writeText(
                  `${window.location.origin}/invites/${data.token}`,
                );
                toast.success("Invite link copied");
              }}
            >
              <Share2 />
              Share plan link
            </Button>
            {friends.data
              ?.filter((f) => f.status === "accepted")
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between border-b border-border py-3"
                >
                  <span>{firstName(f.person?.name)}</span>
                  <Button
                    size="sm"
                    disabled={!f.person}
                    onClick={() => {
                      if (f.person) invite(f.person.id);
                    }}
                  >
                    Invite
                  </Button>
                </div>
              ))}
          </div>
        </DrawerContent>
      </Drawer>
      {member && q.data && q.data.length > 0 && (
        <div className="mt-5">
          <h2 className="text-2xl">Guest list</h2>
          {["going", "maybe", "invited"].map((status) => (
            <div key={status} className="mt-4">
              <h3 className="text-lg capitalize">{status}</h3>
              <div className="mt-2 flex flex-wrap gap-3">
                {q.data
                  .filter((i) => i.status === status)
                  .map((i) => (
                    <span className="flex items-center gap-2 text-xs" key={i.id}>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-sunflower font-bold">
                        {firstName(i.person?.name).charAt(0)}
                      </span>
                      {firstName(i.person?.name)}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export function InvitesInbox() {
  const { user } = useSession(),
    qc = useQueryClient();
  const q = useQuery({
    queryKey: ["invites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_invites")
        .select(
          "*,plan:plans(id,title,image_url,area_label,starts_at),from:profiles!plan_invites_inviter_fkey(name)",
        )
        .eq("invitee", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function rsvp(id: string, status: string) {
    const { data, error } = await supabase.rpc("respond_invite", { _id: id, _status: status });
    if (error) toast.error(error.message);
    else {
      toast.success(
        data === "approved"
          ? "You're going. Plan details are ready; the address unlocks 2 hours before."
          : data === "pending"
            ? "Waiting for host approval"
            : status === "maybe"
              ? "Maybe saved"
              : "Response saved",
      );
      qc.invalidateQueries({ queryKey: ["invites"] });
      qc.invalidateQueries({ queryKey: ["myreq"] });
    }
  }
  return (
    <section className="space-y-4">
      {q.data?.map(
        (i) =>
          i.plan && (
            <article key={i.id} className="overflow-hidden rounded-lg border border-border bg-card">
              {i.plan.image_url && (
                <img
                  className="aspect-[16/10] max-h-[28dvh] w-full object-cover"
                  src={i.plan.image_url}
                  alt=""
                />
              )}
              <div className="p-4">
                <p className="text-xs text-tangerine">{firstName(i.from?.name)} invited you</p>
                <h2 className="mt-2 text-2xl">{i.plan.title}</h2>
                <p className="my-2 text-sm text-muted-foreground">
                  {i.plan.area_label} · {formatWhen(i.plan.starts_at)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={i.status === "going" ? "accent" : "outline"}
                    onClick={() => rsvp(i.id, "going")}
                  >
                    Going
                  </Button>
                  <Button
                    size="sm"
                    variant={i.status === "maybe" ? "secondary" : "outline"}
                    onClick={() => rsvp(i.id, "maybe")}
                  >
                    Maybe
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rsvp(i.id, "declined")}>
                    Can't go
                  </Button>
                </div>
                {i.status === "going" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Your place follows the host's approval. Exact address stays locked until 2 hours
                    before.
                  </p>
                )}
                <Link
                  className="mt-3 block text-sm font-bold text-tangerine"
                  to="/plans/$planId"
                  params={{ planId: i.plan.id }}
                >
                  View plan
                </Link>
              </div>
            </article>
          ),
      )}
      <SocialExamples kind="invite"/>
      {!q.data?.length && (
        <p className="text-sm text-muted-foreground">Your next invitation will appear here.</p>
      )}
    </section>
  );
}
