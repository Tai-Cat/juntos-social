import { Link } from "@tanstack/react-router";
import type { Trip } from "@/lib/tagalong";
import { formatDates } from "@/lib/tagalong";
import { countryFlag } from "@/lib/catalog";
import { CityPhoto } from "@/hooks/use-city-photo";
import { ExampleTag } from "./bits";
export function TripCard({ trip: t }: { trip: Trip }) {
  return (
    <Link to="/trips/$tripId" params={{ tripId: t.id }} className="plan-card genre-tech block">
      <CityPhoto city={t.city} alt={`${t.city}, ${t.country} skyline`} className="aspect-[16/9] w-full object-cover" />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span aria-label={t.country}>{countryFlag(t.country)}</span>
          <span className="text-xs font-semibold">{t.country}</span>
          {t.is_example && <ExampleTag />}
        </div>
        <h3 className="mt-2 text-3xl">{t.city}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDates(t.start_date, t.end_date)}
        </p>
        <p className="mt-3 text-xs">{t.interests.slice(0, 3).join(" · ")}</p>
      </div>
    </Link>
  );
}
