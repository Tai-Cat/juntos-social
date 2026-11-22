import { planFallback } from "@/lib/placeholder";
import { priceLabel } from "@/lib/tagalong";
import { FriendsGoing } from "./PlanInvites";
import { PhotoCarousel } from "./PhotoCarousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { distanceKm } from "@/lib/spatial";
import { genreClass } from "@/lib/catalog";
import { Link } from "@tanstack/react-router";
import { Accessibility, MapPin } from "lucide-react";
import { AUDIENCE_LABEL, formatWhen, hostOf, type PlanWithHost } from "@/lib/tagalong";
import { activeTier, nextTierCopy, parseTiers, priceFor, tierLabel, tierProgress } from "@/lib/discount";
import { ExampleTag, VerifiedBadge } from "./bits";
import {ageLabel} from "@/lib/age";
import { useSession } from "@/hooks/use-auth";

export function DiscountBar({ going, basePrice, tiers: raw, city }: { going: number; basePrice: number; tiers: unknown; city?: string | null }) {
  const currency = city === "Singapore" ? "S$" : "€";
  const tiers = parseTiers(raw);
  const active = activeTier(tiers, going);
  const next = nextTierCopy(going, tiers, currency);
  const top = tiers[tiers.length - 1];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span>
          {active ? (
            <>
              <span className="font-medium">{currency}{priceFor(basePrice, going, tiers)}</span>{" "}
              <span className="text-muted-foreground line-through">{currency}{basePrice}</span>
            </>
          ) : (
            <span className="font-medium">{currency}{basePrice}</span>
          )}
          <span className="text-muted-foreground"> / person</span>
        </span>
        {tiers.length > 0 && <span className="text-xs text-muted-foreground">{next ?? `${tierLabel(active ?? top!, currency)} unlocked`}</span>}
      </div>
      {tiers.length > 0 && (
        <>
          <div className="relative h-1 w-full rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 rounded-full bg-tangerine" style={{ width: `${tierProgress(going, tiers) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
            {tiers.map((t) => <span key={t.min}>{t.min}+ · {tierLabel(t, currency)}</span>)}
          </div>
        </>
      )}
    </div>
  );
}

export function PlanCard({
  plan,
  position,
}: {
  plan: PlanWithHost;
  position?: { lat: number; lng: number } | null;
}) {
  const { user } = useSession();
  const hostQ = useQuery({
    queryKey: ["public-host", plan.host_id],
    enabled: !!plan.host_id,
    queryFn: async () => {
      if (!plan.host_id) return null;
      return (await supabase.rpc("public_host", { _id: plan.host_id })).data?.[0] ?? null;
    },
  });
  const host = hostQ.data
    ? {
        name: hostQ.data.name,
        verified: hostQ.data.verified,
        reliability: hostQ.data.reliability_score,
      }
    : hostOf(plan);
  return (
    <article className={`plan-card block ${genreClass(plan.genre)}`}>
      <div className="relative">
        <PhotoCarousel
          planId={plan.id}
          photos={plan.photos}
          genre={plan.genre}
          label={plan.activity}
          fallback={planFallback(plan)}
        />
        {plan.going_count >= plan.capacity && !plan.is_example && (
          <span className="absolute bottom-3 left-3 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">Sold out</span>
        )}
        <div className="absolute left-3 top-3">
          <span className={`category-chip ${genreClass(plan.genre)}`}>{plan.activity}</span>
        </div>
        {plan.is_example && (
          <span className="absolute right-3 top-3 rounded-full bg-card px-2 py-1">
            <ExampleTag />
          </span>
        )}
        {!plan.is_example && plan.host_id === user?.id && (
          <span className="absolute right-3 bottom-3 rounded-full bg-card px-3 py-1 text-xs font-bold text-tangerine shadow-sm">You're hosting</span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold text-tangerine">{formatWhen(plan.starts_at)}</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight">
          <Link to="/plans/$planId" params={{ planId: plan.id }}>
            {plan.title}
          </Link>
        </h3>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {plan.description || `A little ${plan.activity}, good company included.`}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {plan.area_label}
          {position && plan.area_lat !== null && plan.area_lng !== null && (
            <span>
              · ~{distanceKm(position, { lat: plan.area_lat, lng: plan.area_lng }).toFixed(1)} km
            </span>
          )}
          {plan.step_free && <Accessibility className="ml-auto h-4 w-4" aria-label="Step-free" />}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex -space-x-2" aria-label="Going avatars">
            {Array.from({ length: plan.going_count >= plan.capacity ? 0 : Math.min(4, plan.going_count) }, (_, i) => (
              <span
                key={i}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-sunflower text-[10px] font-bold"
              >
                {i === 0 ? host.name.charAt(0) : "+"}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-card px-2.5 py-1 font-semibold">
            {plan.going_count >= plan.capacity ? "Sold out" : `${plan.going_count}/${plan.capacity} going`}
          </span>
          <span className="font-bold">
            {Number(plan.base_price) > 0 ? `${priceLabel(plan)} / person` : priceLabel(plan)}
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
        <FriendsGoing planId={plan.id} />
        {plan.early_booking && (
          <p className="mt-2 text-xs font-bold text-tangerine">Plus early booking · Coming soon</p>
        )}
        {plan.audience !== "everyone" && (
          <p className="mt-2 text-xs">{AUDIENCE_LABEL[plan.audience]}</p>
        )}
        {ageLabel(plan.age_min,plan.age_max)&&<p className="mt-2 text-xs font-bold">Ages {ageLabel(plan.age_min,plan.age_max)}</p>}
        {Number(plan.base_price) > 0 && (
          <div className="mt-4">
            <DiscountBar going={plan.going_count} basePrice={Number(plan.base_price)} tiers={plan.discount_tiers} city={plan.city} />
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-bold text-grass">
            {plan.going_count >= plan.capacity ? "Waiting list open" : `${Math.max(0, plan.capacity - plan.going_count)} spots left`}
          </span>
          <Link
            to="/plans/$planId"
            params={{ planId: plan.id }}
            className="font-bold text-tangerine"
          >
            View plan →
          </Link>
        </div>
      </div>
    </article>
  );
}
