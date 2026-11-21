import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { type PlanWithHost, formatWhen } from "@/lib/tagalong";
import { CITY_CENTERS, type Bounds } from "@/lib/spatial";
import type { Map } from "leaflet";
export default function ExploreMap({
  plans,
  city,
  onArea,
}: {
  plans: PlanWithHost[];
  city: string;
  onArea: (bounds: Bounds | null) => void;
}) {
  const el = useRef<HTMLDivElement>(null),
    map = useRef<Map | null>(null);
  const [selected, setSelected] = useState<PlanWithHost | null>(null);
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    import("leaflet").then((L) => {
      if (!active || !el.current) return;
      const center = CITY_CENTERS[city] ?? [48.8566, 2.3522];
      const m = L.map(el.current).setView(center, 12);
      map.current = m;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19,
      }).addTo(m);
      setReady(true);
    });
    return () => {
      active = false;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const center = CITY_CENTERS[city];
    if (center && map.current) map.current.setView(center, 12);
  }, [city, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const m = map.current;

    let active = true;
    let cleanup = () => {};
    import("leaflet").then((L) => {
      if (!active) return;
      const layer = L.layerGroup().addTo(m);
      plans.forEach((p) => {
        if (p.area_lat === null || p.area_lng === null) return;
        const icon = L.divIcon({
          className: `map-pin genre-${p.genre}`,
          html: "<span></span>",
          iconSize: [24, 24],
        });
        L.marker([p.area_lat, p.area_lng], { icon })
          .addTo(layer)
          .on("click", () => setSelected(p));
      });
      cleanup = () => {
        layer.remove();
      };
    });
    return () => { active = false; cleanup(); };
  }, [ready, plans, city]);
  return (
    <section className="relative isolate z-0">
      <div
        ref={el}
        className="h-[58dvh] min-h-80 w-full overflow-hidden rounded-lg border border-border"
        aria-label="Approximate plan areas map"
      />
      <div className="absolute left-1/2 top-3 z-[401] flex -translate-x-1/2 gap-2">
        <Button
          variant="outline"
          className="bg-card shadow-sm"
          onClick={() => {
            const b = map.current?.getBounds();
            if (b)
              onArea({
                south: b.getSouth(),
                north: b.getNorth(),
                west: b.getWest(),
                east: b.getEast(),
              });
          }}
        >
          Search this area
        </Button>
        <Button variant="outline" className="bg-card" onClick={() => onArea(null)}>
          Clear area
        </Button>
      </div>
      {selected && (
        <div className="absolute inset-x-3 bottom-5 z-[401] rounded-lg border border-border bg-card p-4">
          <h3 className="text-xl">{selected.title}</h3>
          <p className="mt-1 text-xs">
            {formatWhen(selected.starts_at)} ·{" "}
            {Number(selected.base_price) === 0 ? "Free" : `€${selected.base_price}`}
          </p>
          <p className="my-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {selected.area_label} · approximate area
          </p>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/plans/$planId", params: { planId: selected.id } })}
          >
            View
          </Button>
        </div>
      )}
    </section>
  );
}
