import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const AdminLocationMap = lazy(() => import("@/components/tagalong/AdminLocationMap"));
import { AdminNav } from "@/components/tagalong/AdminNav";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/tagalong/AppShell";
import { Empty } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { getAdminStats, type AdminMember } from "@/lib/admin-stats.functions";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Juntos admin" },
    { name: "description", content: "Admin-only overview of sign-ups, paid members and plans." },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminDashboard,
});

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—";

function Tile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return <article className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </article>;
}

function Bars({ title, data }: { title: string; data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-baseline justify-between gap-2"><h2 className="text-base font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{total} in 30 days</span></div>
    <div className="mt-3 flex h-24 items-end gap-[2px]" role="img" aria-label={`${title}: ${total} in the last 30 days`}>
      {data.map((d) => <div key={d.day} title={`${fmtDate(d.day)}: ${d.count}`} className="flex-1 rounded-t-sm bg-tangerine" style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.2 }} />)}
    </div>
    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{fmtDate(data[0]?.day ?? null)}</span><span>Today</span></div>
  </section>;
}

function CityBars({ title, rows, unit }: { title: string; rows: { city: string; count: number }[]; unit: string }) {
  const top = rows.slice(0, 7);
  const rest = rows.slice(7).reduce((n, r) => n + r.count, 0);
  const all = rest ? [...top, { city: `${rows.length - 7} other places`, count: rest }] : top;
  const max = Math.max(1, ...all.map((r) => r.count));
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-baseline justify-between gap-2"><h2 className="text-base font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{rows.length} place{rows.length === 1 ? "" : "s"}</span></div>
    {all.length ? <ul className="mt-3 space-y-2">{all.map((r) => <li key={r.city} className="grid grid-cols-[minmax(0,7rem)_1fr_2rem] items-center gap-2 text-sm">
      <span className="truncate">{r.city}</span>
      <span className="h-3 rounded-full bg-muted"><span className="block h-3 rounded-full bg-tangerine" style={{ width: `${(r.count / max) * 100}%` }} /></span>
      <span className="text-right tabular-nums text-muted-foreground" title={`${r.count} ${unit}`}>{r.count}</span>
    </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>}
  </section>;
}

function MemberRow({ m }: { m: AdminMember }) {
  return <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 first:border-t-0">
    <div className="min-w-0">
      <p className="break-words font-semibold">{m.name || "New member"}</p>
      <p className="break-all text-sm text-tangerine">{m.email ?? "No email"}</p>
      <p className="text-xs text-muted-foreground">Joined {fmtDate(m.created_at)}</p>
    </div>
    <div className="text-right text-xs">
      <span className={m.tier === "free" ? "rounded-full bg-muted px-2.5 py-1 font-semibold" : "rounded-full bg-tangerine-soft px-2.5 py-1 font-semibold text-tangerine"}>{m.tier === "club" ? "Club" : m.tier === "plus" ? "Plus" : "Free"}</span>
      <p className="mt-1 text-muted-foreground">{m.paid_by_stripe ? (m.membership_until ? `Pass until ${fmtDate(m.membership_until)}` : "Stripe, monthly") : m.tier !== "free" ? "Turned on by hand" : m.email_confirmed ? (m.last_sign_in_at ? `Last in ${fmtDate(m.last_sign_in_at)}` : "Never signed in") : "Email not confirmed"}</p>
    </div>
  </li>;
}

function AdminDashboard() {
  const isAdmin = useIsAppAdmin();
  const stats = useQuery({ queryKey: ["admin-stats"], enabled: isAdmin, queryFn: () => getAdminStats(), refetchInterval: 60000 });

  if (!isAdmin) return <AppShell title="Dashboard" hideBackExplore><Empty>Only Juntos app admins can open this page.</Empty></AppShell>;
  const s = stats.data;
  const paid = s?.memberList.filter((m) => m.tier !== "free") ?? [];
  const unconfirmed = s?.memberList.filter((m) => !m.email_confirmed) ?? [];

  return <AppShell title="Dashboard" hideBackExplore>
    <AdminNav />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">Juntos administration</p>
        <h1 className="text-3xl">Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground">{s ? `Updated ${new Date(s.generatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · refreshes every minute` : "Loading…"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => stats.refetch()} disabled={stats.isFetching}>{stats.isFetching ? "Refreshing…" : "Refresh"}</Button>
      </div>
    </div>

    {stats.isLoading ? <Empty>Loading the numbers…</Empty> :
     stats.error || !s ? <p role="alert" className="mt-5 rounded-xl border border-border p-4 text-sm">Couldn't load the dashboard: {(stats.error as Error | null)?.message ?? "unknown error"}</p> :
     <>
      <h2 className="mt-6 eyebrow">Sign-ups</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total sign-ups" value={s.signups.total} hint={`${s.signups.last7} this week · ${s.signups.last30} in 30 days`} />
        <Tile label="Email confirmed" value={s.signups.confirmed} hint={`${s.signups.unconfirmed} still to confirm`} />
        <Tile label="Never signed in" value={s.signups.neverSignedIn} />
        <Tile label="Onboarded profiles" value={s.memberList.filter((m) => m.onboarded).length} />
      </div>

      <h2 className="mt-6 eyebrow">Paid members</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Paying (Plus + Club)" value={s.members.plus + s.members.club} hint={`${s.members.paidByStripe} via Stripe · ${s.members.manualPlus} by hand`} />
        <Tile label="Club" value={s.members.club} />
        <Tile label="Plus" value={s.members.plus} />
        <Tile label="Free" value={s.members.free} />
      </div>

      <h2 className="mt-6 eyebrow">Plans (events)</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Plans created by members" value={s.plans.real} hint={`${s.plans.last7} this week`} />
        <Tile label="Upcoming" value={s.plans.upcoming} hint={`${s.plans.cancelled} cancelled`} />
        <Tile label="Joins approved" value={s.activity.approvedJoins} hint={`${s.activity.joinRequests} requests in all`} />
        <Tile label="Trips added" value={s.activity.trips} hint={`${s.plans.examples} example plans`} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Bars title="Sign-ups per day" data={s.signups.byDay} />
        <Bars title="Plans created per day" data={s.plans.byDay} />
      </div>

      <h2 className="mt-6 eyebrow">Where</h2>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <CityBars title="Plans by city" rows={s.locations.plans} unit="plans" />
        <CityBars title="Members by home city" rows={s.locations.members} unit="members" />
      </div>
      <ClientOnly fallback={null}><Suspense fallback={null}><AdminLocationMap plans={s.locations.plans} members={s.locations.members} /></Suspense></ClientOnly>

      {s.plans.topHosts.length > 0 && <section className="mt-6">
        <h2 className="eyebrow">Top hosts</h2>
        <ul className="mt-2 overflow-hidden rounded-xl border border-border bg-card">{s.plans.topHosts.map((h, i) => <li key={i} className="flex justify-between border-t border-border px-4 py-2 text-sm first:border-t-0"><span>{h.name}</span><span className="tabular-nums text-muted-foreground">{h.count} plan{h.count === 1 ? "" : "s"}</span></li>)}</ul>
      </section>}

      <section className="mt-6">
        <h2 className="eyebrow">Paid members ({paid.length})</h2>
        {paid.length ? <ul className="mt-2 overflow-hidden rounded-xl border border-border bg-card">{paid.map((m) => <MemberRow key={m.id} m={m} />)}</ul> : <Empty>No paid members yet.</Empty>}
      </section>

      {unconfirmed.length > 0 && <section className="mt-6">
        <h2 className="eyebrow">Waiting to confirm their email ({unconfirmed.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">These people signed up but haven't clicked the link in their confirmation email. They can ask for a new one from the sign-in page.</p>
        <ul className="mt-2 overflow-hidden rounded-xl border border-border bg-card">{unconfirmed.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
      </section>}

      <section className="mt-6">
        <h2 className="eyebrow">Newest sign-ups</h2>
        <ul className="mt-2 overflow-hidden rounded-xl border border-border bg-card">{s.memberList.slice(0, 10).map((m) => <MemberRow key={m.id} m={m} />)}</ul>
      </section>
      <p className="mt-5 text-xs text-muted-foreground">Admin only. Paid status comes from Stripe through the webhook; "by hand" means Plus was switched on in the app. Example (demo) plans are not counted as member plans.</p>
     </>}
  </AppShell>;
}
