import { useEffect, useRef } from "react";
import type { Map, LayerGroup } from "leaflet";

/**
 * Preview for Post a plan: the shaded circle is what people see before they're approved;
 * the small dot is the exact meet-up point, which only the host sees here.
 */
export default function AreaPreviewMap({ exact, center, radiusKm }: { exact: { lat: number; lng: number }; center: { lat: number; lng: number }; radiusKm: number }) {
  const el = useRef<HTMLDivElement>(null), map = useRef<Map | null>(null), layer = useRef<LayerGroup | null>(null);
  useEffect(() => {
    let active = true;
    import("leaflet").then((L) => {
      if (!active || !el.current || map.current) return;
      map.current = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView([center.lat, center.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(map.current);
      draw(L);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function draw(L: typeof import("leaflet")) {
    const m = map.current;
    if (!m) return;
    layer.current?.remove();
    const g = L.layerGroup().addTo(m);
    const circle = L.circle([center.lat, center.lng], { radius: radiusKm * 1000, color: "#f97316", fillColor: "#f97316", fillOpacity: 0.18, weight: 2 }).addTo(g);
    L.circleMarker([exact.lat, exact.lng], { radius: 5, color: "#111", fillColor: "#111", fillOpacity: 1 }).bindTooltip("Exact meet-up point · only you see this").addTo(g);
    layer.current = g;
    m.fitBounds(circle.getBounds(), { padding: [12, 12] });
  }
  useEffect(() => {
    import("leaflet").then((L) => draw(L));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exact.lat, exact.lng, center.lat, center.lng, radiusKm]);
  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);
  return <div ref={el} className="relative z-0 h-56 w-full overflow-hidden rounded-xl border border-border" aria-label={`Map preview: public area of about ${radiusKm} km`} />;
}
