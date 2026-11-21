import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { CLUB_PERKS, MANAGE_SUBSCRIPTION_LINK, clubCheckoutUrl } from "@/lib/plus";
import { AppShell } from "@/components/tagalong/AppShell";
import { PLUS_FEATURES } from "@/components/tagalong/Membership";
import { PlusCheckoutButton } from "@/components/tagalong/PlusCheckout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Juntos Free and Plus" },
      { name: "description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month; Juntos Club is 10 EUR per month with featured plans and extra guests." },
      { property: "og:title", content: "Pricing — Juntos Free and Plus" },
      { property: "og:description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month; Juntos Club is 10 EUR per month with featured plans and extra guests." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/pricing" }],
  }),
  component: Pricing,
});

type Cell3 = string | boolean;
const ROWS: { name: string; free: Cell3; plus: Cell3; club: Cell3 }[] = [
  { name: "Browse, join, chat, make friends", free: true, plus: true, club: true },
  { name: "Group discounts set by venues", free: true, plus: true, club: true },
  { name: "Saved alerts", free: "2", plus: "Unlimited", club: "Unlimited" },
  { name: "Create groups and communities", free: "3", plus: "Unlimited", club: "Unlimited" },
  ...PLUS_FEATURES.filter((f) => f.ready && f.name !== "Unlimited saved alerts").map((f) => ({ name: f.name, free: false, plus: true, club: true })),
  { name: "Featured plans: yours show first in Explore", free: false, plus: false, club: true },
  { name: "Guests per plan", free: "+1", plus: "+1", club: "+2" },
  { name: "Early access to Travel matches", free: false, plus: false, club: true },
  { name: "Club badge on your profile", free: false, plus: false, club: true },
];
const SOON = PLUS_FEATURES.filter((f) => !f.ready);

function Cell({ v }: { v: Cell3 }) {
  if (typeof v === "string") return <span className="text-xs font-semibold">{v}</span>;
  return v ? <Check className="mx-auto h-4 w-4 text-grass" aria-label="Included" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Not included" />;
}

function Pricing() {
  const { user } = useSession();
  return (
    <AppShell>
      <p className="eyebrow">Pricing</p>
      <h1 className="mt-2 text-4xl">Free to join. More if you want it.</h1>
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
          <div className="mt-4"><PlusCheckoutButton label="Get Plus" /></div>
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
          <div className="mt-4">
            <Button asChild className="w-full">
              <a href={clubCheckoutUrl(user)} target="_blank" rel="noopener noreferrer"><Crown />Join Club · €10 / month</a>
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">Club activates within 24 hours of payment.</p>
          </div>
        </article>
      </div>
      <p className="mt-3 max-w-4xl text-xs text-muted-foreground">Billed monthly by Stripe. Cancel anytime: <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer" className="underline">manage your subscription</a>.</p>
      <div className="mt-8 max-w-4xl overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="border-b border-border text-left"><th className="py-2">Feature</th><th className="w-16 text-center">Free</th><th className="w-16 text-center">Plus</th><th className="w-16 text-center">Club</th></tr></thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className="border-b border-border"><td className="py-2.5 pr-2">{r.name}</td><td className="text-center"><Cell v={r.free} /></td><td className="text-center"><Cell v={r.plus} /></td><td className="text-center"><Cell v={r.club} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {SOON.length > 0 && (
        <p className="mt-4 max-w-4xl text-xs text-muted-foreground">On the way for members: {SOON.map((f) => f.name).join(", ")}.</p>
      )}
    </AppShell>
  );
}
