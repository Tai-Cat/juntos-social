import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/tagalong/AppShell";
import { TextPage } from "@/components/tagalong/SiteFooter";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal notice — Juntos" },
      { name: "description", content: "Publisher, contact, hosting and payment providers for Juntos." },
      { property: "og:title", content: "Legal notice — Juntos" },
      { property: "og:description", content: "Publisher, contact, hosting and payment providers for Juntos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/legal" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/legal" }],
  }),
  component: () => (
    <AppShell>
      <TextPage eyebrow="Legal" title="Legal notice">
        <h2>Publisher</h2>
        <p>Juntos is published by Taira Ribeiro, individual founder, Fontainebleau, France.</p>
        <h2>Contact</h2>
        <p>Use the <Link to="/contact" className="font-bold text-tangerine underline">contact form</Link>.</p>
        <h2>Hosting</h2>
        <p>The app is hosted by Lovable. Data is stored with Supabase.</p>
        <h2>Payments</h2>
        <p>Juntos Plus payments are processed by Stripe. Juntos never sees or stores your card details.</p>
      </TextPage>
    </AppShell>
  ),
});
