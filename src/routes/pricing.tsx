import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { PayLink } from "@/components/tagalong/PayLink";
import { CLUB_ONCE_LINK, CLUB_PAYMENT_LINK, CLUB_PERKS, MANAGE_SUBSCRIPTION_LINK, PLUS_ONCE_LINK, PLUS_PAYMENT_LINK } from "@/lib/plus";
import { AppShell } from "@/components/tagalong/AppShell";
import { PLUS_FEATURES } from "@/components/tagalong/Membership";
import { BenefitsCompare } from "@/components/tagalong/BenefitsCompare";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Membership — Juntos Free, Plus and Club" },
      { name: "description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month; Juntos Club is 10 EUR per month with featured plans and extra guests." },
      { property: "og:title", content: "Membership — Juntos Free, Plus and Club" },
      { property: "og:description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month; Juntos Club is 10 EUR per month with featured plans and extra guests." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/pricing" }],
  }),
  component: Pricing,
});

const SOON = PLUS_FEATURES.filter((f) => !f.ready);


function Pricing() {
  const { user } = useSession();
  return (
    <AppShell>
      <p className="eyebrow">Membership</p>
      <h1 className="mt-2 text-4xl">Choose your membership</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Juntos is free to join. Plus and Club add benefits for people who go out a lot or host.</p>
      <div className="mt-6 grid max-w-4xl gap-4 md:grid-cols-3">
        <article className="flex flex-col rounded-lg border border-border bg-card p-5">
          <p className="eyebrow">Free</p>
          <p className="mt-1 font-display text-3xl">€0</p>
          <p className="mt-2 text-sm text-muted-foreground">Find plans, join, chat and make friends.</p>
        </article>
        <article className="genre-ideas flex flex-col rounded-lg border border-tangerine p-5">
          <p className="eyebrow">Juntos Plus · most popular</p>
          <p className="mt-1 font-display text-3xl">€5 <span className="text-base">/ month</span></p>
          <p className="mt-2 flex-1 text-sm">Level filters, unlimited alerts and groups, host tools.</p>
          <TierButtons tier="Plus" price={5} monthly={PLUS_PAYMENT_LINK} once={PLUS_ONCE_LINK} />
        </article>
        <article className="flex flex-col rounded-lg border-2 border-foreground bg-card p-5">
          <p className="eyebrow">Juntos Club</p>
          <p className="mt-1 font-display text-3xl">€10 <span className="text-base">/ month</span></p>
          <ul className="mt-2 flex-1 space-y-1 text-sm">
            <li>Everything in Plus, and:</li>
            {CLUB_PERKS.map((p) => (
              <li key={p} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-grass" aria-hidden />{p}</li>
            ))}
          </ul>
          <TierButtons tier="Club" price={10} monthly={CLUB_PAYMENT_LINK} once={CLUB_ONCE_LINK} />
        </article>
      </div>
      <p className="mt-3 max-w-4xl text-xs text-muted-foreground">
        <b>Monthly</b> renews automatically each month until you cancel; cancelling keeps your benefits to the end of the month you paid for.{" "}
        <b>1 month</b> is a single payment that simply ends after 30 days, with nothing to cancel. Payments by Stripe.{" "}
        <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer" className="underline">Manage your subscription</a>.
      </p>
      <h2 className="mt-10 text-2xl">Compare benefits</h2>
      <div className="mt-3 max-w-2xl">
        <BenefitsCompare />
      </div>
      {SOON.length > 0 && (
        <p className="mt-4 max-w-4xl text-xs text-muted-foreground">On the way for members: {SOON.map((f) => f.name).join(", ")}.</p>
      )}
    </AppShell>
  );
}

/** Two clear choices per paid tier: a monthly subscription, or one month paid once. */
function TierButtons({ tier, price, monthly, once }: { tier: string; price: number; monthly: string; once: string }) {
  return (
    <div className="mt-4 space-y-2">
      <Button asChild className="w-full">
        <PayLink href={monthly}><Crown />{tier} monthly · €{price} · auto-renews</PayLink>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <PayLink href={once}>{tier} for 1 month · €{price} · no renewal</PayLink>
      </Button>
      <p className="text-xs text-muted-foreground">You'll sign in or create your free account first, so the membership is linked to you. Benefits switch on as soon as the payment goes through.</p>
    </div>
  );
}
