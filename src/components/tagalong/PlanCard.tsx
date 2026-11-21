import { genreClass, imageFor } from "@/lib/catalog";
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
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-tangerine"
          style={{ width: `${tierProgress(going) * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-muted-foreground/50"
          style={{ left: `${(4 / 6) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="ml-auto mr-[28%]">4+ · 15%</span>
        <span>6+ · 25%</span>
      </div>
    </div>
  );
}

export function PlanCard({ plan }: { plan: PlanWithHost }) {
  const host = hostOf(plan);
  return (
    <Link
      to="/plans/$planId"
      params={{ planId: plan.id }}
      className={`plan-card block ${genreClass(plan.genre)}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={plan.image_url || imageFor(plan.activity, plan.genre)}
          alt={plan.activity}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <span className={`category-chip ${genreClass(plan.genre)}`}>{plan.activity}</span>
        </div>
        {plan.is_example && (
          <span className="absolute right-3 top-3 rounded-full bg-card px-2 py-1">
            <ExampleTag />
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold text-tangerine">{formatWhen(plan.starts_at)}</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight">{plan.title}</h3>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {plan.description || `A little ${plan.activity}, good company included.`}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {plan.area_label}
          {plan.step_free && <Accessibility className="ml-auto h-4 w-4" aria-label="Step-free" />}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-card px-2.5 py-1 font-semibold">
            {plan.going_count}/{plan.capacity} going
          </span>
          <span className="font-bold">
            {Number(plan.base_price) === 0 ? "Free" : `~€${Number(plan.base_price)} / person`}
          </span>
          <span className="ml-auto capitalize">
            {plan.required_level === "any" ? "All abilities" : plan.required_level}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
          <span className="font-bold">{host.name}</span>
          <VerifiedBadge verified={host.verified} />
          <span className="rounded-full bg-card px-2 py-1">{host.reliability}% reliable</span>
        </div>
        {plan.audience !== "everyone" && (
          <p className="mt-2 text-xs">{AUDIENCE_LABEL[plan.audience]}</p>
        )}
        {plan.kind === "partner_venue" && Number(plan.base_price) > 0 && (
          <div className="mt-4">
            <DiscountBar going={plan.going_count} basePrice={Number(plan.base_price)} />
          </div>
        )}
      </div>
    </Link>
  );
}
