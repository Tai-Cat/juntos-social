import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useOrganisations, useOrgMemberships } from "@/hooks/use-organisations";
/** Organisation memberships with status, leave and manage actions. */
export function ProfileMemberships() {
  const { user } = useSession();
  const qc = useQueryClient();
  const orgs = useOrganisations(), members = useOrgMemberships();
  const requests = useQuery({ queryKey: ["org-requests-mine", user?.id], enabled: !!user, queryFn: async () => { const { data, error } = await supabase.from("organisation_requests").select("*").eq("user_id", user?.id ?? ""); if (error) throw error; return data; } });
  const name = (id: string) => orgs.data?.find((o) => o.id === id);
  const rows = [
    ...(members.data ?? []).map((m) => ({ org: m.organisation_id, status: ({ owner: "Owner", admin: "Admin", host: "Co-host" } as Record<string, string>)[m.role] ?? "Member", role: m.role })),
    ...(requests.data ?? []).filter((r) => r.status === "pending" && !members.data?.some((m) => m.organisation_id === r.organisation_id)).map((r) => ({ org: r.organisation_id, status: "Request pending", role: "pending" })),
  ];
  async function leave(org: string) {
    const { error } = await supabase.rpc("leave_org", { _org: org });
    if (error) toast.error(error.message); else { toast("You left the organisation."); qc.invalidateQueries({ queryKey: ["org-memberships"] }); }
  }
  return (
    <details className="group mt-8 rounded-2xl border border-border bg-card px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1"><span className="text-xl font-semibold">Groups and communities <span className="text-sm font-normal text-muted-foreground">· {rows.length}</span></span><span className="text-sm text-tangerine group-open:hidden">Show</span><span className="hidden text-sm text-tangerine group-open:inline">Hide</span></summary>
      <div className="mb-3 mt-3 flex flex-wrap items-center justify-end gap-2"><div className="flex gap-2"><Button asChild size="sm"><Link to="/organisations/new" search={{ kind: "community" }}>Create group</Link></Button><Button asChild size="sm" variant="outline"><Link to="/organisations/new" search={{ kind: "business" }}>Create organisation</Link></Button></div></div>
      {!rows.length ? <p className="text-sm text-muted-foreground">You're not part of any organisation yet. Find one on Explore.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => { const o = name(r.org); return (
            <article key={r.org} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{o?.name ?? "Organisation"}</p><p className={`text-xs ${r.role === "pending" ? "text-muted-foreground" : "text-grass"}`}>{r.status}</p></div>
              {o && <Button asChild size="sm" variant="ghost"><Link to="/organisations/$slug" params={{ slug: o.slug }}>View</Link></Button>}
              {(r.role === "admin" || r.role === "owner") && <Button asChild size="sm" variant="outline"><Link to="/organisation-admin/$orgId" params={{ orgId: r.org }}>Manage</Link></Button>}
              {r.role === "member" && <Button size="sm" variant="outline" onClick={() => leave(r.org)}>Leave</Button>}
            </article>); })}
        </div>
      )}
    </details>
  );
}
