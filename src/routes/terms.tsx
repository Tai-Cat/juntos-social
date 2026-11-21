import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/tagalong/AppShell";
import { TextPage } from "@/components/tagalong/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of sale — Juntos Plus" },
      { name: "description", content: "Juntos Plus costs 5 EUR per month, billed monthly by Stripe. Cancel anytime; 14-day EU right of withdrawal." },
      { property: "og:title", content: "Terms of sale — Juntos Plus" },
      { property: "og:description", content: "Juntos Plus costs 5 EUR per month, billed monthly by Stripe. Cancel anytime; 14-day EU right of withdrawal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/terms" }],
  }),
  component: () => (
    <AppShell>
      <TextPage eyebrow="Juntos Plus" title="Terms of sale">
        <h2>Price and billing</h2>
        <p>Juntos Plus costs €5 per month, billed monthly by Stripe. Plus activates within 24 hours of payment.</p>
        <h2>Cancellation</h2>
        <p>You can cancel anytime. Cancellation takes effect at the end of the period you have already paid for; you keep Plus until then.</p>
        <h2>Right of withdrawal (EU)</h2>
        <p>You have 14 days from subscribing to withdraw and get a refund. If you ask for immediate access to Plus during those 14 days, you accept paying for the days already used, and any refund is reduced accordingly.</p>
        <h2>Group discounts</h2>
        <p>Group discounts shown on plans are set by the venues, not by Juntos, and may change.</p>
        <h2>Questions</h2>
        <p>Reach us through the <Link to="/contact" className="font-bold text-tangerine underline">contact form</Link>.</p>
      </TextPage>
    </AppShell>
  ),
});
