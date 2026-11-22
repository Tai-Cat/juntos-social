import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/tagalong/AppShell";
import { Empty } from "@/components/tagalong/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { supabase } from "@/integrations/supabase/client";

type AdminPlan = {
  id: string;
  title: string;
  city: string;
  country: string;
  area_label: string;
  starts_at: string;
  host_name: string;
  visibility: string;
  status: string;
  going_count: number;
  capacity: number;
  is_example: boolean;
  venue_type: string;
  base_price: number;
};

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({ meta: [
    { title: "All plans — Juntos admin" },
    { name: "description", content: "Privacy-safe overview of plans across Juntos." },
    { name: "robots", content: "noindex" }
  ] }),
  component: AdminPlans,
});

function AdminPlans() {
  const isAdmin = useIsAppAdmin();
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("real");
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["admin-all-plans", city, status],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_all_plans", {
        ...(city ? { _city: city } : {}),
        ...(status ? { _status: status } : {}),
      });
      if (error) throw error;
      return (data ?? []) as AdminPlan[];
    },
  });
  const cities = useMemo(() => [...new Set((q.data ?? []).map(p => p.city).filter(Boolean))].sort(), [q.data]);
  const rows = useMemo(() => (q.data ?? []).filter(p =>
    (scope === "all" || (scope === "examples" ? p.is_example : !p.is_example)) &&
    (!search || `${p.title} ${p.city} ${p.country} ${p.host_name}`.toLowerCase().includes(search.toLowerCase()))
  ), [q.data, search, scope]);
  const realCount = (q.data ?? []).filter(p => !p.is_example).length;
  const exampleCount = (q.data ?? []).filter(p => p.is_example).length;

  if (!isAdmin) return <AppShell title="All plans"><Empty>Only Juntos app admins can open this page.</Empty></AppShell>;

  return <AppShell title="All plans">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="eyebrow">Juntos administration</p><h1 className="text-3xl">All plans</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">A site-wide overview across every location, including restricted plans. This view intentionally excludes exact addresses and attendee details.</p></div>
      <div className="flex flex-wrap gap-2"><span className="rounded-full bg-card px-3 py-1 text-xs font-semibold">{q.data?.length ?? 0} total</span><span className="rounded-full bg-card px-3 py-1 text-xs font-semibold">{realCount} real posts</span><span className="rounded-full bg-card px-3 py-1 text-xs font-semibold">{exampleCount} examples</span></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input aria-label="Search plans" placeholder="Search title, city or host" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Filter by city" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={city} onChange={e => setCity(e.target.value)}>
        <option value="">All locations</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select aria-label="Filter by status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">All statuses</option><option value="active">Active</option><option value="cancelled">Cancelled</option>
      </select>
      <select aria-label="Filter real or example plans" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={scope} onChange={e=>setScope(e.target.value)}><option value="real">Real member posts</option><option value="examples">Example posts</option><option value="all">All posts</option></select>
    </div>
    {q.isLoading ? <Empty>Loading all plans…</Empty> : q.error ? <div role="alert" className="mt-5 rounded-xl border border-border p-4 text-sm">Could not load the admin plan list. Refresh and try again.</div> : !rows.length ? <Empty>No plans match these filters.</Empty> : <div className="mt-5 space-y-3">
      {rows.map(p => <article key={p.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="font-semibold">{p.title}</h2><p className="mt-1 text-sm text-muted-foreground">{p.city}{p.country ? `, ${p.country}` : ""} · {p.area_label}</p><p className="mt-1 text-xs text-muted-foreground">Hosted by {p.host_name} · {new Date(p.starts_at).toLocaleString()}</p></div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">{p.status}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{p.going_count}/{p.capacity} going</span><span>·</span><span className="capitalize">{p.venue_type.replaceAll("_", " ")}</span><span>·</span><span>{p.visibility === "public" ? "Public" : p.visibility === "friends" ? "Friends and groups" : "Link / restricted"}</span><span>·</span><span>{p.base_price < 0 ? "Price TBA" : p.base_price === 0 ? "Free" : `€${p.base_price} per person`}</span>{p.is_example && <span>· Example</span>}
        </div>
      </article>)}
    </div>}
    <p className="mt-5 text-xs text-muted-foreground">The admin query is permission-checked by the database. Exact venue addresses, messages and participant lists are never returned here. Results are capped at 1,000 plans.</p>
  </AppShell>;
}
