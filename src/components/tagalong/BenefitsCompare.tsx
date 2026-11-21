import { Check, Minus } from "lucide-react";
import { PLUS_FEATURES } from "./Membership";

type Cell = string | boolean;
type Row = { name: string; free: Cell; plus: Cell; club: Cell };

export const BENEFIT_ROWS: Row[] = [
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

const TIERS = [
  { key: "free", label: "Free" },
  { key: "plus", label: "Plus" },
  { key: "club", label: "Club" },
] as const;

function Value({ v }: { v: Cell }) {
  if (typeof v === "string") return <span className="text-sm font-bold">{v}</span>;
  return v ? (
    <Check className="h-5 w-5 text-grass" aria-label="Included" />
  ) : (
    <Minus className="h-5 w-5 text-muted-foreground/50" aria-label="Not included" />
  );
}

/**
 * Benefits comparison that reads well on a phone: one card per benefit, with the
 * three tiers side by side underneath, instead of a cramped table.
 */
export function BenefitsCompare({ tiers = ["free", "plus", "club"] }: { tiers?: ("free" | "plus" | "club")[] }) {
  const shown = TIERS.filter((t) => tiers.includes(t.key));
  return (
    <div className="space-y-2">
      <div className="sticky top-14 z-10 -mx-1 grid gap-2 rounded-xl bg-background/95 px-1 py-2 backdrop-blur" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((t) => (
          <p key={t.key} className={`rounded-full py-1 text-center text-xs font-bold uppercase tracking-wide ${t.key === "plus" ? "bg-tangerine-soft text-tangerine" : t.key === "club" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
            {t.label}
          </p>
        ))}
      </div>
      {BENEFIT_ROWS.map((r) => (
        <div key={r.name} className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold leading-snug">{r.name}</p>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
            {shown.map((t) => (
              <div key={t.key} className="flex h-8 items-center justify-center rounded-lg bg-background">
                <span className="sr-only">{t.label}: </span>
                <Value v={r[t.key]} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
