import { Link } from "@tanstack/react-router";
import { MANAGE_SUBSCRIPTION_LINK } from "@/lib/plus";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { PlusCheckoutButton } from "./PlusCheckout";
import { Lock, Check } from "lucide-react";
import { usePlus } from "@/hooks/use-plus";
import { Switch } from "@/components/ui/switch";
export const PLUS_FEATURES = [
  { name: "Filter by level and find skill partners", ready: true },
  { name: "Priority spots and waitlist priority", ready: false },
  { name: "Early booking · 24 hours before everyone", ready: false },
  { name: "Unlimited saved alerts", ready: true },
  { name: "Host tools · recurring plans, bigger groups and reliable-only joining", ready: true },
  { name: "Co-host tools", ready: false },
  { name: "Extra 5% venue perk on top of group discounts", ready: false },
  { name: "Verified Plus and priority ID check", ready: false },
  { name: "Trusted circle for direct invites", ready: false },
  { name: "Traveller matching before arrival", ready: false },
  { name: "One-tap trip plans from What's on", ready: false },
  { name: "Progress badges and level history", ready: false },
  { name: "Advanced hang-again scheduling", ready: false },
];
export function Membership() {
  const { plus, setPlus } = usePlus();
  const isAdmin = useIsAppAdmin();
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl">Membership</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <p className="eyebrow">{plus ? "Free membership" : "Your membership"}</p>
          <h3 className="mt-2 text-3xl">Free</h3>
          <p className="mt-3 text-sm">
            Browse and join plans, make friends, chat, and save 2 alerts.
          </p>
        </article>
        <article className="genre-ideas rounded-lg border border-border p-5">
          <p className="eyebrow">{plus ? "Your membership" : "A little more Juntos"}</p>
          <h3 className="mt-2 text-3xl">Juntos Plus</h3>
          <p className="mt-2 font-bold">€5 / month</p>
          {isAdmin ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm">Simulate Plus (admin only)</span>
              <Switch aria-label="Simulate Plus" checked={plus} onCheckedChange={setPlus} />
            </div>
          ) : !plus && <div className="mt-4"><PlusCheckoutButton label="Get Plus" /></div>}
        </article>
      </div>
      <p className="mt-3 text-sm">
        Want more? <Link to="/pricing" className="font-bold text-tangerine underline">Juntos Club is €10 / month</Link>.{" "}
        Already a member? <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer" className="font-bold underline">Manage or cancel your subscription</a>.
      </p>
      <ul className="mt-5 divide-y divide-border">
        {PLUS_FEATURES.map((f) => (
          <li key={f.name} className="flex items-center gap-3 py-3 text-sm">
            {f.ready && plus ? (
              <Check className="h-4 w-4 shrink-0 text-grass" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1">{f.name}</span>
            <span className="text-xs text-muted-foreground">
              {!f.ready ? "Coming soon" : plus ? "Included" : "Plus"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
