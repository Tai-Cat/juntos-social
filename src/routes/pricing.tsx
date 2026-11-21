import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { AppShell } from "@/components/tagalong/AppShell";
import { PLUS_FEATURES } from "@/components/tagalong/Membership";
import { PlusCheckoutButton } from "@/components/tagalong/PlusCheckout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Juntos Free and Plus" },
      { name: "description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month for level filters, unlimited alerts and host tools." },
      { property: "og:title", content: "Pricing — Juntos Free and Plus" },
      { property: "og:description", content: "Juntos is free to browse, join and chat. Juntos Plus is 5 EUR per month for level filters, unlimited alerts and host tools." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/pricing" }],
  }),
  component: Pricing,
});

const ROWS: { name: string; free: string | boolean; plus: string | boolean }[] = [
  { name: "Browse, join, chat, make friends", free: true, plus: true },
  { name: "Group discounts set by venues", free: true, plus: true },
  { name: "Saved alerts", free: "2", plus: "Unlimited" },
  { name: "Create groups and communities", free: "3", plus: "Unlimited" },
  ...PLUS_FEATURES.filter((f) => f.ready && f.name !== "Unlimited saved alerts").map((f) => ({ name: f.name, free: false, plus: true })),
];
const SOON = PLUS_FEATURES.filter((f) => !f.ready);

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span className="text-xs font-semibold">{v}</span>;
  return v ? <Check className="mx-auto h-4 w-4 text-grass" aria-label="Included" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Not included" />;
}

function Pricing() {
  return (
    <AppShell>
      <p className="eyebrow">Pricing</p>
      <h1 className="mt-2 text-4xl">Free to join. Plus if you want more.</h1>
      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <p className="eyebrow">Free</p>
          <p className="mt-1 font-display text-3xl">€0</p>
          <p className="mt-2 text-sm text-muted-foreground">Find plans, join, chat and make friends.</p>
        </article>
        <article className="genre-ideas rounded-lg border border-tangerine p-5">
          <p className="eyebrow">Juntos Plus</p>
          <p className="mt-1 font-display text-3xl">€5 <span className="text-base">/ month</span></p>
          <p className="mt-2 text-sm">Billed monthly by Stripe. Cancel anytime.</p>
          <div className="mt-4"><PlusCheckoutButton label="Get Plus" /></div>
        </article>
      </div>
      <table className="mt-8 w-full max-w-2xl text-sm">
        <thead><tr className="border-b border-border text-left"><th className="py-2">Feature</th><th className="w-20 text-center">Free</th><th className="w-20 text-center">Plus</th></tr></thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name} className="border-b border-border"><td className="py-2.5">{r.name}</td><td className="text-center"><Cell v={r.free} /></td><td className="text-center"><Cell v={r.plus} /></td></tr>
          ))}
        </tbody>
      </table>
      {SOON.length > 0 && (
        <p className="mt-4 max-w-2xl text-xs text-muted-foreground">Coming to Plus: {SOON.map((f) => f.name).join(", ")}.</p>
      )}
    </AppShell>
  );
}
