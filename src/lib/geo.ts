import { useQueries } from "@tanstack/react-query";
import { CITY_CENTERS, distanceKm } from "./spatial";

export type Point = { lat: number; lng: number };
/** Special location value: show plans from every city. */
export const ANYWHERE = "Anywhere";
/** Distances at or above this are treated as "Worldwide" (no distance limit). */
export const WORLDWIDE_KM = 20000;

/** Centres for cities we already know, so most lookups need no network call. */
const KNOWN: Record<string, [number, number]> = {
  ...CITY_CENTERS,
  Fontainebleau: [48.4047, 2.7016], Avon: [48.4083, 2.7194], Melun: [48.5396, 2.6608],
  Versailles: [48.8049, 2.1204], Lyon: [45.764, 4.8357], Marseille: [43.2965, 5.3698], Nice: [43.7102, 7.262],
  Bordeaux: [44.8378, -0.5792], Toulouse: [43.6047, 1.4442], Lille: [50.6292, 3.0573], Nantes: [47.2184, -1.5536],
  Madrid: [40.4168, -3.7038], Seville: [37.3891, -5.9845], Valencia: [39.4699, -0.3763], Braga: [41.5454, -8.4265],
  Manchester: [53.4808, -2.2426], Edinburgh: [55.9533, -3.1883], Dublin: [53.3498, -6.2603], Amsterdam: [52.3676, 4.9041],
  Brussels: [50.8503, 4.3517], Berlin: [52.52, 13.405], Munich: [48.1351, 11.582], Milan: [45.4642, 9.19],
  Vienna: [48.2082, 16.3738], Zurich: [47.3769, 8.5417], Geneva: [46.2044, 6.1432], Copenhagen: [55.6761, 12.5683],
  Stockholm: [59.3293, 18.0686], Athens: [37.9838, 23.7275], Istanbul: [41.0082, 28.9784], Dubai: [25.2048, 55.2708],
  Singapore: [1.3521, 103.8198], Tokyo: [35.6762, 139.6503], Kyoto: [35.0116, 135.7681], Bangkok: [13.7563, 100.5018],
  Sydney: [-33.8688, 151.2093], "San Francisco": [37.7749, -122.4194], "Los Angeles": [34.0522, -118.2437],
  "Abu Dhabi": [24.4539, 54.3773], "Hong Kong": [22.3193, 114.1694], Mumbai: [19.076, 72.8777],
};
export const bareCity = (c: string) => c.split(",")[0]!.trim();
export function knownCenter(city: string): Point | null {
  const k = KNOWN[bareCity(city)];
  return k ? { lat: k[0], lng: k[1] } : null;
}

const CACHE = "juntos-geo-v1";
function readCache(): Record<string, Point | null> {
  try { return JSON.parse(localStorage.getItem(CACHE) ?? "{}"); } catch { return {}; }
}
/** City centre from the built-in list, then a cached OpenStreetMap lookup. */
export async function geocodeCity(city: string): Promise<Point | null> {
  const known = knownCenter(city);
  if (known) return known;
  const key = city.toLowerCase().trim();
  const cache = readCache();
  if (key in cache) return cache[key] ?? null;
  const point = await geocodeQuery(city);
  try { localStorage.setItem(CACHE, JSON.stringify({ ...readCache(), [key]: point })); } catch { /* storage blocked */ }
  return point;
}
/** Free-text lookup (an address or a city) through OpenStreetMap Nominatim. */
export async function geocodeQuery(q: string): Promise<Point | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch { return null; }
}
/** Neighbourhood-level name for a point, used to suggest the public area label. */
export async function areaNameFor(p: Point): Promise<string | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&lat=${p.lat}&lon=${p.lng}`);
    if (!res.ok) return null;
    const a = ((await res.json()) as { address?: Record<string, string> }).address ?? {};
    const local = a["neighbourhood"] ?? a["suburb"] ?? a["quarter"] ?? a["city_district"] ?? a["village"] ?? a["town"];
    const town = a["city"] ?? a["town"] ?? a["village"];
    return [local, town !== local ? town : undefined].filter(Boolean).join(", ") || null;
  } catch { return null; }
}

/** Centres for a list of cities (known ones instantly, others looked up once and cached). */
export function useCityCenters(cities: string[]): Record<string, Point> {
  const unique = [...new Set(cities.filter(Boolean).map((c) => bareCity(c)))];
  const results = useQueries({
    queries: unique.map((c) => ({
      queryKey: ["city-center", c.toLowerCase()],
      queryFn: () => geocodeCity(c),
      staleTime: Infinity,
      enabled: typeof window !== "undefined",
    })),
  });
  const out: Record<string, Point> = {};
  unique.forEach((c, i) => { const p = results[i]?.data ?? knownCenter(c); if (p) out[c.toLowerCase()] = p; });
  return out;
}
/** A plan's approximate point: its own area pin, else its city's centre. */
export function pointOf(p: { area_lat: number | null; area_lng: number | null; city: string }, centers: Record<string, Point>): Point | null {
  if (p.area_lat !== null && p.area_lng !== null) return { lat: p.area_lat, lng: p.area_lng };
  return centers[bareCity(p.city).toLowerCase()] ?? null;
}
export const kmFrom = (a: Point | null, b: Point | null) => (a && b ? distanceKm(a, b) : null);
export const formatKm = (km: number) => (km < 1 ? "<1 km" : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString()} km`);
/** Moves a point by up to `maxKm` in a random direction, so a public pin never sits on the exact address. */
export function blur(p: Point, maxKm: number): Point {
  const r = (Math.random() * 0.6 + 0.2) * maxKm, t = Math.random() * 2 * Math.PI;
  return { lat: p.lat + (r / 111) * Math.cos(t), lng: p.lng + (r / (111 * Math.cos((p.lat * Math.PI) / 180))) * Math.sin(t) };
}
