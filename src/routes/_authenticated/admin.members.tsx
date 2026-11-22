import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/tagalong/AppShell";
import { Empty } from "@/components/tagalong/bits";
import { Input } from "@/components/ui/input";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  id: string;
  name: string;
  home_city: string | null;
  created_at: string;
  onboarded: boolean;
  verified: boolean;
  reliability_score: number;
  no_show_count: number;
  has_plus: boolean;
  membership_until: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({ meta: [
    { title: "Member accounts — Juntos admin" },
    { name: "description", content: "Admin-only overview of registered Juntos accounts." },
    { name: "robots", content: "noindex" }
  ] }),
  component: AdminMembers,
});

function AdminMembers() {
  const isAdmin = useIsAppAdmin();
  const [query, setQuery] = useState("");
  const [accountType, setAccountType] = useState("all");

  const members = useQuery({
    queryKey: ["admin-member-overview"],
    enabled: isAdmin,
    queryFn: async () => {
      // This RPC is intentionally admin-only and returns a privacy-minimised member record.
      const { data, error } = await (supabase as any).rpc("admin_member_overview");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const rows = useMemo(() => (members.data ?? []).filter((member) => {
    const typeMatches = accountType === "all" ||
      (accountType === "plus" && member.has_plus) ||
      (accountType === "free" && !member.has_plus);
    const textMatches = !query.trim() ||
      `${member.name} ${member.home_city ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return typeMatches && textMatches;
  }), [members.data, accountType, query]);

  const total = members.data?.length ?? 0;
  const plus = members.data?.filter((m) => m.has_plus).length ?? 0;
  const free = total - plus;
  const onboarded = members.data?.filter((m) => m.onboarded).length ?? 0;

  if (!isAdmin) return <AppShell title="Member accounts" hideBackExplore><Empty>Only Juntos app admins can open this page.</Empty></AppShell>;

  return <AppShell title="Member accounts" hideBackExplore>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="eyebrow">Juntos administration</p>
        <h1 className="text-3xl">Member accounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Registered accounts, including free accounts that have not purchased Plus. This view excludes email addresses, private profile fields, messages and exact locations.</p>
      </div>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Registered accounts</p><p className="mt-1 text-2xl font-semibold tabular-nums">{total}</p></article>
      <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Free accounts</p><p className="mt-1 text-2xl font-semibold tabular-nums">{free}</p></article>
      <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Active Plus memberships</p><p className="mt-1 text-2xl font-semibold tabular-nums">{plus}</p></article>
      <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Onboarded profiles</p><p className="mt-1 text-2xl font-semibold tabular-nums">{onboarded}</p></article>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
      <Input aria-label="Search members" placeholder="Search name or home city" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select aria-label="Filter account type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
        <option value="all">All accounts</option>
        <option value="free">Free accounts</option>
        <option value="plus">Active Plus</option>
      </select>
    </div>

    {members.isLoading ? <Empty>Loading registered accounts…</Empty> :
      members.error ? <p role="alert" className="mt-5 rounded-xl border border-border p-4 text-sm">Couldn't load accounts. Refresh and try again.</p> :
      rows.length === 0 ? <Empty>No accounts match these filters.</Empty> :
      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(120px,1fr)_120px_100px] gap-3 bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid">
          <span>Member</span><span>Joined</span><span>Profile</span><span>Account</span>
        </div>
        {rows.map((member) => <article key={member.id} className="grid gap-2 border-t border-border bg-card px-4 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(120px,1fr)_120px_100px] sm:items-center sm:gap-3">
          <div className="min-w-0"><p className="font-semibold">{member.name || "New member"}</p><p className="text-xs text-muted-foreground">{member.home_city || "Home city not set"}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{member.id.slice(0, 8)}…</p></div>
          <p className="text-xs text-muted-foreground"><span className="sm:hidden">Joined · </span>{new Date(member.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
          <div className="text-xs"><span className={member.onboarded ? "text-foreground" : "text-muted-foreground"}>{member.onboarded ? "Onboarded" : "Not completed"}</span><p className="mt-1 text-muted-foreground">{member.verified ? "Verified" : "Not verified"} · {member.reliability_score}% reliable</p></div>
          <div><span className={member.has_plus ? "rounded-full bg-tangerine-soft px-2.5 py-1 text-xs font-semibold text-tangerine" : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"}>{member.has_plus ? "Plus" : "Free"}</span>{member.has_plus && member.membership_until && <p className="mt-1 text-[10px] text-muted-foreground">Until {new Date(member.membership_until).toLocaleDateString()}</p>}</div>
        </article>)}
      </div>}
    <p className="mt-5 text-xs text-muted-foreground">The account total comes from registered, non-anonymous Auth accounts. Plus is shown only when the account has an active Plus entitlement. Free means a registered account without an active Plus entitlement; it does not mean the person has never made a payment in the past.</p>
  </AppShell>;
}
