import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/tagalong/AppShell";
import { useAuthAction } from "@/components/tagalong/AuthSheet";
import { Button } from "@/components/ui/button";
import { placeholderImage, isRealPhoto } from "@/lib/placeholder";
import { formatWhen } from "@/lib/tagalong";

export const Route = createFileRoute("/e/$token")({
  head: () => ({
    meta: [
      { title: "You're invited — Juntos" },
      { name: "description", content: "A private Juntos plan shared with you by link." },
      { property: "og:title", content: "You're invited — Juntos" },
      { property: "og:description", content: "A private Juntos plan shared with you by link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LinkPlan,
});

function LinkPlan() {
  const { token } = Route.useParams();
  const auth = useAuthAction();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["link-teaser", token], queryFn: async () => { const { data, error } = await supabase.rpc("plan_link_teaser", { _token: token }); if (error) throw error; return data?.[0] ?? null; } });
  const p = q.data;
  return (
    <AppShell title="Private plan">
      {q.isLoading ? <p className="py-10">Loading…</p> : !p ? (
        <p className="py-10">This link has been reset or turned off. Ask the host for a new one.</p>
      ) : (
        <article className="mx-auto max-w-xl py-6">
          <img src={isRealPhoto(p.image_url) && p.image_url ? p.image_url : placeholderImage(p.genre)} alt={p.title} className="aspect-[16/10] w-full rounded-lg object-cover" />
          <p className="mt-4 inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-bold"><Lock className="h-3 w-3" />Private</p>
          <h1 className="mt-2 text-3xl">{p.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{formatWhen(p.starts_at)} · {p.area_label}</p>
          <p className="mt-1 text-sm">Hosted by {p.host_name ?? "a Juntos host"}</p>
          <p className="mt-4 text-xs text-muted-foreground">The exact address is shared once the host approves you.</p>
          <Button className="mt-5 w-full" onClick={() => auth(async () => {
            const { data, error } = await supabase.rpc("open_plan_link", { _token: token });
            if (error || !data) toast.error(error?.message ?? "This link no longer works");
            else navigate({ to: "/plans/$planId", params: { planId: data } });
          }, "see this plan and RSVP")}>See details and RSVP</Button>
        </article>
      )}
    </AppShell>
  );
}
