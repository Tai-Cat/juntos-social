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
      <TextPage eyebrow="Juntos Plus and Club" title="Terms of sale">
        <h2>Price and billing</h2>
        <p>Juntos Plus costs €5 per month and Juntos Club costs €10 per month, either as a monthly subscription that renews automatically until you cancel, or as a single one-month payment that ends after 30 days without renewing. Payments are handled by Stripe. Prices include any applicable taxes. Your membership usually switches on as soon as Stripe confirms the payment, and at the latest within 24 hours.</p>
        <h2>What each membership includes</h2>
        <p>The features of each membership are listed on the <Link to="/pricing" className="font-bold text-tangerine underline">Membership page</Link>. Features marked as on the way are not part of what you pay for until they launch.</p>
        <h2>Cancellation</h2>
        <p>You can cancel anytime from <a href="https://billing.stripe.com/p/login/3cI5kDcPR9y9cLEf5V5J600" target="_blank" rel="noopener noreferrer" className="font-bold text-tangerine underline">Manage subscription</a> (sign in with the email you paid with). Cancellation takes effect at the end of the period you have already paid for; you keep your membership until then.</p>
        <h2>Refunds</h2>
        <p>Payments are not refunded automatically. If something went wrong (for example you didn't mean to subscribe, picked the wrong tier or were charged twice), use <b>Request a refund</b> in your profile's Membership section or the <Link to="/contact" className="font-bold text-tangerine underline">contact form</Link>. We review each request and reply by email; approved refunds go back to the card you paid with.</p>
        <h2>Right of withdrawal (EU)</h2>
        <p>You have 14 days from subscribing to withdraw and get a refund. If you ask for immediate access to your membership during those 14 days, you accept paying for the days already used, and any refund is reduced accordingly.</p>
        <h2>Group discounts</h2>
        <p>Group discounts shown on plans are set by the venues, not by Juntos, and may change.</p>
        <h2>Questions</h2>
        <p>Reach us through the <Link to="/contact" className="font-bold text-tangerine underline">contact form</Link>.</p>
      </TextPage>
    </AppShell>
  ),
});
