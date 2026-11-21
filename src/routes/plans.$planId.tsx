import { PlanInvites } from "@/components/tagalong/PlanInvites";
import { PhotoCarousel } from "@/components/tagalong/PhotoCarousel";
import { Share2, Bookmark,Download } from "lucide-react";
import { useAge } from "@/hooks/use-age";
import { ageAllowed,ageLabel } from "@/lib/age";
import { rememberIntent } from "@/lib/auth-intent";
import { OrganisationAccess } from "@/components/tagalong/Organisations";
import { LockedEventTeaser } from "@/components/tagalong/EventViews";
import { useOrganisations } from "@/hooks/use-organisations";
import { downloadICS } from "@/lib/calendar";
import { useAuthAction } from "@/components/tagalong/AuthSheet";
import { SimilarPeople } from "@/components/tagalong/SimilarPeople";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Accessibility,
  ArrowLeft,
  Clock,
  Heart,
  Lock,
  MapPin,
  Repeat,
  Send,
  Unlock,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { DiscountBar } from "@/components/tagalong/PlanCard";
import { SafetyMenu } from "@/components/tagalong/SafetyMenu";
import { Card, Empty, ExampleTag, VerifiedBadge } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AUDIENCE_LABEL,
  PLAN_SELECT,
  errMsg,
  firstName,
  formatWhen,
  hostOf,
  type PlanWithHost,
} from "@/lib/tagalong";

export const Route = createFileRoute("/plans/$planId")({
  head: () => ({
    meta: [
      { title: "Plan — Tagalong" },
      { name: "description", content: "Join this plan and meet people in real life." },
      { property: "og:title", content: "Plan — Tagalong" },
      { property: "og:description", content: "Join this plan and meet people in real life." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanDetail,
});

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

function PlanDetail() {
  const { planId } = Route.useParams();
  const auth = useAuthAction();
  const { user, profile } = useMyProfile();
  const privateAge=useAge();
  const organisations=useOrganisations();
  const teaserQ=useQuery({queryKey:["locked-plan",planId,user?.id],queryFn:async()=>{const {data,error}=await supabase.rpc("org_plan_teasers",{_plan:planId});if(error)throw error;return data?.[0]??null;}});
  const qc = useQueryClient();
  const navigate = useNavigate();
  const now = useNow();
  const [buddy, setBuddy] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);

  const planQ = useQuery({
    queryKey: ["plan", planId,user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_SELECT)
        .eq("id", planId)
        .single();
      if (error) throw error;
      return data as unknown as PlanWithHost;
    },
  });
  const myReq = useQuery({
    queryKey: ["myreq", planId, user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("join_requests")
          .select("*")
          .eq("plan_id", planId)
          .eq("user_id", user?.id ?? "")
          .maybeSingle()
      ).data,
  });

  const plan = planQ.data;
  const hostQ = useQuery({queryKey:["public-host",plan?.host_id],enabled:!!plan?.host_id,queryFn:async()=>{if(!plan?.host_id)return null;return (await supabase.rpc("public_host",{_id:plan.host_id})).data?.[0]??null;}});
  const isHost = !!plan && plan.host_id === user?.id;
  const approved =
    myReq.data?.status === "approved" ||
    (!!user && !!plan?.is_private && plan.private_participants.includes(user.id));
  const isMember = isHost || approved;
  const start = plan ? new Date(plan.starts_at).getTime() : 0;
  const unlockAt = start - 2 * 3600 * 1000;
  const unlocked = isHost || (approved && now >= unlockAt);
  const ended = plan ? now >= start : false;
  const chatOpen = plan ? now < start + 24 * 3600 * 1000 : false;

  const address = useQuery({
    queryKey: ["address", planId, unlocked],
    enabled: !!plan && unlocked,
    queryFn: async () => (await supabase.rpc("get_plan_address", { _plan: planId })).data,
  });

  const members = useQuery({
    queryKey: ["members", planId],
    enabled: isMember,
    queryFn: async () =>
      (
        await supabase
          .from("join_requests")
          .select("id, user_id, bring_buddy, no_show, profiles(name, verified, reliability_score)")
          .eq("plan_id", planId)
          .eq("status", "approved")
      ).data ?? [],
  });

  const hang = useQuery({
    queryKey: ["hang", planId, user?.id],
    enabled: isMember && ended,
    queryFn: async () =>
      !!(
        await supabase
          .from("hang_again")
          .select("plan_id")
          .eq("plan_id", planId)
          .eq("user_id", user?.id ?? "")
          .maybeSingle()
      ).data,
  });

  if (planQ.isLoading)
    return (
      <AppShell>
        <Empty>Loading…</Empty>
      </AppShell>
    );
  if (!plan)
    return (
      <AppShell>
        {teaserQ.data?<><h1 className="text-3xl">{teaserQ.data.title}</h1><LockedEventTeaser plan={teaserQ.data}/>{organisations.data?.filter(o=>o.id===teaserQ.data?.organisation_id).map(o=><OrganisationAccess key={o.id} org={o}/>)}</>:<Empty>{teaserQ.isLoading?"Loading plan…":"Plan not found."}</Empty>}
      </AppShell>
    );
  const host = hostQ.data ? {name:hostQ.data.name,verified:hostQ.data.verified,reliability:hostQ.data.reliability_score} : hostOf(plan);
  const restricted = ["women_only", "men_only", "nonbinary_only"].includes(plan.audience);
  const ageMismatch=!!privateAge.data?.date_of_birth&&!ageAllowed(privateAge.data.date_of_birth,plan.age_min,plan.age_max,new Date(plan.starts_at));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["myreq", planId] });
    qc.invalidateQueries({ queryKey: ["plan", planId] });
    qc.invalidateQueries({ queryKey: ["plans"] });
  };

  async function join(accountId: string) {
    const {data:age}=await supabase.from("profile_private").select("date_of_birth,age_verified").eq("user_id",accountId).maybeSingle();
    if(!age?.age_verified){rememberIntent({kind:"join",planId,buddy});navigate({to:age?.date_of_birth?"/verify":"/onboarding"});return;}
    setBusy(true);
    const { data, error } = await supabase
      .from("join_requests")
      .insert({ plan_id: planId, user_id: accountId, bring_buddy: buddy })
      .select("status")
      .single();
    setBusy(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success(data.status === "approved" ? "You're in" : "Request sent");
    refresh();
  }
  async function cancel() {
    if (!myReq.data) return;
    const { error } = await supabase.from("join_requests").delete().eq("id", myReq.data.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    refresh();
  }
  async function repeat() {
    const { data, error } = await supabase.rpc("repeat_plan", { _plan: planId });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Same time next week — booked for the group");
    qc.invalidateQueries({ queryKey: ["plans"] });
    navigate({ to: "/plans/$planId", params: { planId: data as string } });
  }
  async function toggleHang() {
    if (!user) return;
    if (hang.data)
      await supabase.from("hang_again").delete().eq("plan_id", planId).eq("user_id", user.id);
    else {
      const { error } = await supabase
        .from("hang_again")
        .insert({ plan_id: planId, user_id: user.id });
      if (error) {
        toast.error(errMsg(error));
        return;
      }
    }
    qc.invalidateQueries({ queryKey: ["hang", planId] });
  }
  async function noShow(id: string) {
    const { error } = await supabase.rpc("mark_no_show", { _request: id });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast("Marked as no-show");
    qc.invalidateQueries({ queryKey: ["members", planId] });
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Plans
        </Link>
        <SafetyMenu userId={plan.host_id} planId={plan.id} label="this plan" />
      </div>

      <div className="mt-5 overflow-hidden rounded-lg">
        <PhotoCarousel
          planId={plan.id}
          photos={plan.photos}
          genre={plan.genre}
          label={plan.activity}
          credits
          example={plan.is_example}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" title="Add to my calendar" onClick={()=>{try{downloadICS({id:plan.id,planId:plan.id,title:plan.title,start:plan.starts_at,duration:plan.duration_minutes,kind:"going",example:plan.is_example,recurring:plan.recurring_weekly,area:plan.area_label,image:plan.image_url});}catch{toast.error("Calendar download couldn't complete");}}}><Download/><span className="hidden sm:inline">Calendar</span></Button>
        <Button
          variant="outline"
          onClick={() =>
            auth(async (account) => {
              const { error } = await supabase
                .from("saved_plans")
                .upsert({ user_id: account.id, plan_id: plan.id });
              if (error) toast.error(error.message);
              else toast.success("Plan saved");
            }, "save this plan")
          }
        >
          <Bookmark />
          Save
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: plan.title, url: window.location.href });
              } catch {}
            } else {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }
          }}
        >
          <Share2 />
          Share
        </Button>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <span className="eyebrow">
          {plan.category}
          {plan.kind === "partner_venue" && " · Partner venue"}
        </span>
        {plan.is_example && <ExampleTag />}
      </div>
      <h1 className="mt-2 text-3xl leading-tight">{plan.title}</h1>
      {ageLabel(plan.age_min,plan.age_max)&&<p className="mt-3 inline-flex rounded-full bg-sky-soft px-3 py-1 text-xs font-bold">Ages {ageLabel(plan.age_min,plan.age_max)}</p>}
      {plan.organisation_id&&organisations.data?.filter(o=>o.id===plan.organisation_id).map(o=><p className="mt-3 text-sm" key={o.id}>Hosted by <Link className="font-bold text-grass" to="/organisations/$slug" params={{slug:o.slug}}>{o.name}</Link></p>)}
      {plan.description && <p className="mt-3 text-muted-foreground">{plan.description}</p>}

      <section className="mt-6 border-y border-border py-5">
        <h2 className="text-2xl">What to expect</h2>
        <p className="mt-2 text-sm">
          {plan.description || `A relaxed ${plan.activity} session in good company.`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-bold text-sm">What to bring</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.what_to_bring || "Ask the host before the plan."}
            </p>
          </div>
          <div>
            <p className="font-bold text-sm">Duration and level</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.duration_minutes} minutes ·{" "}
              {plan.required_level === "any" ? "All abilities welcome" : plan.required_level}
            </p>
          </div>
          <div>
            <p className="font-bold text-sm">Accessibility</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.step_free ? "Step-free access" : "Contact the host about access needs"}
            </p>
          </div>
          <div>
            <p className="font-bold text-sm">Host intro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.host_intro || `${host.name} is bringing people together for ${plan.activity}.`}
            </p>
          </div>
        </div>
      </section>
      <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
        <Row icon={<Clock className="h-4 w-4" />}>
          {formatWhen(plan.starts_at)}
          {plan.recurring_weekly && <span className="text-muted-foreground"> · weekly</span>}
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />}>
          {plan.area_label}, {plan.city}
        </Row>
        <Row icon={<Users className="h-4 w-4" />}>
          {plan.going_count} of {plan.capacity} going · {AUDIENCE_LABEL[plan.audience]}
        </Row>
        {plan.step_free && <Row icon={<Accessibility className="h-4 w-4" />}>Step-free access</Row>}
      </dl>

      <div className="mt-5 flex items-center gap-2 text-sm">
        <span>
          Hosted by <span className="font-medium">{host.name}</span>
        </span>
        <VerifiedBadge verified={host.verified} />
        <span className="text-xs text-muted-foreground">{host.reliability}% reliable</span>
        {plan.host_id && !isHost && <SafetyMenu userId={plan.host_id} label={host.name} />}
      </div>

      {plan.kind === "partner_venue" && Number(plan.base_price) > 0 && (
        <Card className="mt-6 space-y-4">
          <DiscountBar going={plan.going_count} basePrice={Number(plan.base_price)} />
          <Button variant="outline" className="w-full" disabled>
            Reserve with €3 refundable deposit
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Deposits coming soon</p>
        </Card>
      )}

      <PlanInvites planId={plan.id} member={isMember} />
      {/* Venue */}
      {isMember && (
        <Card className="mt-6">
          {unlocked ? (
            <div className="flex gap-3">
              <Unlock className="mt-0.5 h-4 w-4 text-tangerine" />
              <div>
                <p className="eyebrow">Exact venue</p>
                <p className="mt-1 font-medium">{address.data ?? "Loading…"}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Lock className="mt-0.5 h-4 w-4" />
              <div>
                <p className="eyebrow">Exact venue unlocks in</p>
                <p className="mt-1 font-display text-2xl tabular-nums">
                  {fmtCountdown(unlockAt - now)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shared 2 hours before start, with approved people only.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Join / status */}
      {!isHost && (
        <div className="mt-6 space-y-4">
          {!myReq.data && !ended && (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">Bring a buddy (+1)</p>
                  <p className="text-xs text-muted-foreground">
                    They come with you, counted as one more.
                  </p>
                </div>
                <Switch checked={buddy} onCheckedChange={setBuddy} aria-label="Bring a buddy" disabled={plan.age_min!==null||plan.age_max!==null||plan.organisation_id!==null}/>
              </div>
              {plan.audience === "lgbtq_friendly" && (
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={optIn}
                    onCheckedChange={(v) => setOptIn(!!v)}
                    className="mt-0.5"
                  />
                  I'm joining an LGBTQ+ friendly plan and will keep it welcoming for everyone.
                </label>
              )}
              {restricted && !profile?.verified && (
                <p className="text-sm text-muted-foreground">
                  This plan is {AUDIENCE_LABEL[plan.audience]?.toLowerCase()}.{" "}
                  <Link to="/verify" className="underline">
                    Verify it's you
                  </Link>{" "}
                  to request to join.
                </p>
              )}
              {(profile?.no_show_count ?? 0) >= 2 && (
                <p className="text-xs text-muted-foreground">
                  Your requests always need host approval after two no-shows.
                </p>
              )}
              <Button
                size="lg"
                variant="accent"
                className="w-full"
                onClick={() =>
                  auth((account) => {
                    void join(account.id);
                  }, "join this plan",{kind:"join",planId,buddy})
                }
                disabled={
                  busy ||
                  ageMismatch ||
                  (plan.audience === "lgbtq_friendly" && !optIn) ||
                  plan.going_count >= plan.capacity
                }
              >
                {plan.going_count >= plan.capacity ? "Full" : "Request to join"}
              </Button>
              {ageMismatch&&<p className="text-sm text-muted-foreground">This plan welcomes ages {ageLabel(plan.age_min,plan.age_max)}. Your bracket is different — try another welcoming plan.</p>}
            </>
          )}
          {myReq.data?.status === "pending" && (
            <Card className="text-center">
              <p className="font-display text-xl">Waiting for host approval</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {myReq.data.bring_buddy ? "You + 1 buddy. " : ""}We'll show the venue here once
                you're in.
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={cancel}>
                Cancel request
              </Button>
            </Card>
          )}
          {myReq.data?.status === "declined" && (
            <Card className="text-center text-sm text-muted-foreground">
              The host couldn't fit you in this time.
            </Card>
          )}
          {approved && !ended && (
            <p className="text-center text-sm">
              You're going{myReq.data?.bring_buddy && " with a buddy"}.{" "}
              <button className="text-muted-foreground underline" onClick={cancel}>
                Leave
              </button>
            </p>
          )}
        </div>
      )}

      {/* After the plan */}
      {isMember && ended && (
        <Card className="mt-6 space-y-3">
          <p className="font-display text-xl">How was it?</p>
          <div className="flex gap-2">
            <Button
              variant={hang.data ? "default" : "outline"}
              className="flex-1"
              onClick={toggleHang}
            >
              <Heart className={hang.data ? "fill-current" : ""} />
              Would hang again
            </Button>
          </div>
          <Button variant="accent" className="w-full" onClick={repeat}>
            <Repeat />
            Same time next week?
          </Button>
        </Card>
      )}

      {isMember && (members.data?.length ?? 0) > 0 && (
        <section className="mt-8">
          <p className="eyebrow mb-3">Who's going</p>
          <ul className="divide-y divide-border border-y border-border">
            {(members.data ?? []).map((m) => {
              const p = m.profiles as {
                name: string;
                verified: boolean;
                reliability_score: number;
              } | null;
              return (
                <li key={m.id} className="flex items-center gap-2 py-3 text-sm">
                  <span className="font-medium">{firstName(p?.name)}</span>
                  <VerifiedBadge verified={!!p?.verified} />
                  {m.bring_buddy && <span className="text-xs text-muted-foreground">+1</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {isHost &&
                      ended &&
                      (m.no_show ? (
                        <span className="text-xs text-muted-foreground">No-show</span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => noShow(m.id)}>
                          No-show
                        </Button>
                      ))}
                    {m.user_id !== user?.id && (
                      <SafetyMenu userId={m.user_id} label={firstName(p?.name)} />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {isMember && plan.host_id && <PlanChat planId={plan.id} open={chatOpen} />}
      <SimilarPeople city={plan.city} activity={plan.activity} level={plan.required_level} />
      {isHost && (
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/inbox">Review join requests</Link>
        </Button>
      )}
    </AppShell>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function PlanChat({ planId, open }: { planId: string; open: boolean }) {
  const { user } = useMyProfile();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const msgs = useQuery({
    queryKey: ["chat", planId],
    refetchInterval: open ? 5000 : false,
    queryFn: async () =>
      (
        await supabase
          .from("plan_messages")
          .select("id, body, created_at, user_id, profiles(name)")
          .eq("plan_id", planId)
          .order("created_at")
      ).data ?? [],
  });
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const { error } = await supabase
      .from("plan_messages")
      .insert({ plan_id: planId, user_id: user.id, body: text.trim() });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["chat", planId] });
  }
  return (
    <section className="mt-8">
      <p className="eyebrow mb-3">Group chat</p>
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        {(msgs.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Say hello to the group.</p>
        )}
        {(msgs.data ?? []).map((m) => (
          <p key={m.id} className="text-sm">
            <span className="font-medium">
              {firstName((m.profiles as { name: string } | null)?.name)}
            </span>{" "}
            <span>{m.body}</span>
          </p>
        ))}
      </div>
      {open ? (
        <form onSubmit={send} className="mt-2 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" />
          <Button type="submit" size="icon" aria-label="Send">
            <Send />
          </Button>
        </form>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Chat closed 24 hours after the plan.</p>
      )}
    </section>
  );
}
