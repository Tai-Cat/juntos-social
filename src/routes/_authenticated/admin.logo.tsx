import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { JuntosLogo, LIVE_LOGO, LOGO_OPTIONS, type LogoOption } from "@/components/tagalong/JuntosLogo";

export const Route = createFileRoute("/_authenticated/admin/logo")({
  head: () => ({ meta: [{ title: "Logo options — Juntos admin" }, { name: "description", content: "Compare Juntos logo colour options." }, { property: "og:title", content: "Logo options — Juntos admin" }, { property: "og:description", content: "Compare Juntos logo colour options." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: LogoPage,
});

function LogoPage() {
  const { user } = useSession();
  const admin = useQuery({ queryKey: ["is-admin", user?.id], enabled: !!user, queryFn: async () => { const { data } = await supabase.rpc("has_role", { _user_id: user?.id ?? "", _role: "admin" }); return !!data; } });
  if (!admin.data) return <AppShell title="Logo"><p className="py-10">{admin.isLoading ? "Checking access…" : "Only Juntos admins can open this page."}</p></AppShell>;
  return (
    <AppShell title="Logo">
      <h1 className="text-3xl">Logo options</h1>
      <p className="mt-1 text-sm text-muted-foreground">Option {LIVE_LOGO} is live on the logo, favicon, splash and share image. Tell me which one to keep.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {(Object.keys(LOGO_OPTIONS) as LogoOption[]).map((k) => (
          <article key={k} className={`rounded-xl border bg-card p-5 ${k === LIVE_LOGO ? "border-foreground" : "border-border"}`}>
            <p className="eyebrow">Option {k}{k === LIVE_LOGO ? " · live" : ""}</p>
            <p className="mb-5 text-sm font-bold">{LOGO_OPTIONS[k].label}</p>
            <div className="grid place-items-center rounded-lg bg-background py-8"><JuntosLogo option={k} /></div>
            <div className="mt-3 grid place-items-center rounded-lg bg-background py-6"><JuntosLogo option={k} size="lg" /></div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
