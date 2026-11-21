import { Link } from "@tanstack/react-router";
import { Accessibility, MapPin } from "lucide-react";
import { AUDIENCE_LABEL, formatWhen, hostOf, type PlanWithHost } from "@/lib/tagalong";
import { discountFor, nextTierCopy, priceFor, tierProgress } from "@/lib/discount";
import { ExampleTag, VerifiedBadge } from "./bits";

export function DiscountBar({ going, basePrice }: { going: number; basePrice: number }) {
  const pct = discountFor(going);
  const next = nextTierCopy(going);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span>
          {pct > 0 ? (
            <>
              <span className="font-medium">€{priceFor(basePrice, going)}</span>{" "}
              <span className="text-muted-foreground line-through">€{basePrice}</span>
            </>
          ) : (
            <span className="font-medium">€{basePrice}</span>
          )}
          <span className="text-muted-foreground"> / person</span>
        </span>
        <span className="text-xs text-muted-foreground">{next ?? "25% off unlocked"}</span>
      </div>
      <div className="relative h-1 w-full rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-tangerine" style={{ width: `${tierProgress(going) * 100}%` }} />
        <div className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-muted-foreground/50" style={{ left: `${(4 / 6) * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span><span className="ml-auto mr-[28%]">4+ · 15%</span><span>6+ · 25%</span>
      </div>
    </div>
  );
}

export function PlanCard({ plan }: { plan: PlanWithHost }) {
  const host = hostOf(plan);
  return (
    <Link to="/plans/$planId" params={{ planId: plan.id }} className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{plan.category}{plan.kind === "partner_venue" && " · Partner venue"}</span>
        {plan.is_example && <ExampleTag />}
      </div>
      <h3 className="mt-2 text-xl leading-snug">{plan.title}</h3>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />{plan.area_label}</p>
        <p>{formatWhen(plan.starts_at)}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-sm">
        <span className="font-medium">{plan.going_count} of {plan.capacity} going</span>
        <span className="text-muted-foreground">·</span>
        <span>{host.name}</span>
        <VerifiedBadge verified={host.verified} />
        <span className="text-xs text-muted-foreground">{host.reliability}% reliable</span>
      </div>
      {(plan.audience !== "everyone" || plan.step_free) && (
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          {plan.audience !== "everyone" && <span>{AUDIENCE_LABEL[plan.audience]}</span>}
          {plan.step_free && <span className="inline-flex items-center gap-1"><Accessibility className="h-3 w-3" />Step-free</span>}
        </div>
      )}
      {plan.kind === "partner_venue" && Number(plan.base_price) > 0 && (
        <div className="mt-4"><DiscountBar going={plan.going_count} basePrice={Number(plan.base_price)} /></div>
      )}
    </Link>
  );
}
