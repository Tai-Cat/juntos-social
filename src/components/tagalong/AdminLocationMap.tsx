import { useEffect, useRef } from "react";
import type { Map } from "leaflet";
import { useCityCenters } from "@/lib/geo";

type Row = { city: string; count: number; lat?: number | null; lng?: number | null };

/** Bubble map for the admin dashboard: orange = plans, blue = members' home cities. */
export default function AdminLocationMap({ plans, members }: { plans: Row[]; members: Row[] }) {
  const el = useRef<HTMLDivElement>(null), map = useRef<Map | null>(null);
  const centers = useCityCenters([...plans, ...members].map((r) => r.city).filter((c) => c !== "Not set"));
  const key = JSON.stringify(centers);
  useEffect(() => {
    let active = true;
    import("leaflet").then((L) => {
      if (!active || !el.current) return;
      map.current?.remove();
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([48.85, 2.35], 3);
      map.current = m;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(m);
      const pts: [number, number][] = [];
      const draw = (rows: Row[], color: string, label: string) => rows.forEach((r) => {
        const c = r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : centers[r.city.toLowerCase()];
        if (!c) return;
        pts.push([c.lat, c.lng]);
        L.circleMarker([c.lat, c.lng], { radius: 6 + Math.sqrt(r.count) * 4, color, fillColor: color, fillOpacity: 0.35, weight: 2 })
          .bindTooltip(`${r.city}: ${r.count} ${label}`).addTo(m);
      });
      draw(members, "#3b82f6", "members");
      draw(plans, "#f97316", "plans");
      if (pts.length) m.fitBounds(pts, { padding: [24, 24], maxZoom: 9 });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, plans.length, members.length]);
  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);
  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
      <div ref={el} className="relative z-0 h-72 w-full" aria-label="Map of plans and members by city" />
      <p className="flex gap-4 px-4 py-2 text-xs text-muted-foreground">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#f97316]" />Plans</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />Members</span>
        <span>Bigger circle = more</span>
      </p>
    </section>
  );
}
