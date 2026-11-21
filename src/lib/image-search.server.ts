import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type StockPhoto = { provider: "unsplash" | "pexels"; provider_id: string; url: string; photographer: string; photographer_url: string; source_url: string; download?: string };
type Admin = SupabaseClient<Database>;
const UTM = "utm_source=juntos&utm_medium=referral";

export function photoKeys() {
  return { unsplash: process.env["UNSPLASH_ACCESS_KEY"] ?? "", pexels: process.env["PEXELS_API_KEY"] ?? "" };
}

/** Curated object or scene shots without faces. Titles are never used as queries: words like "wander" or "portfolio" pull unrelated images (e.g. stock charts). */
const OBJECT_QUERIES: Record<string, string[]> = {
  "sourdough baking": ["sourdough bread loaf", "sourdough starter jar"], pottery: ["pottery wheel clay", "handmade ceramic bowls"], ceramics: ["ceramic bowls studio"],
  "dog walks": ["dog on forest trail", "dog leash park"], coffee: ["coffee cup on table"], "climbing and bouldering": ["climbing wall holds", "bouldering gym wall"],
  tennis: ["empty tennis court"], markets: ["fruit vegetable market stall", "fresh produce market crates"], ramen: ["ramen bowl", "japanese noodle soup"],
  yoga: ["yoga mat studio"], cycling: ["bicycle street"], "wine tasting": ["wine barrels cellar", "port wine glasses"], "board games": ["board game pieces table"],
  "sauna and cold plunge": ["sauna interior wood", "spa towels stones"], running: ["riverside running path", "running shoes path"], "co-working": ["laptop desk cafe", "coworking space desks"],
  "laundry runs": ["laundromat machines"], museums: ["museum gallery hall", "art museum interior"], "book clubs": ["books stack cafe"], photography: ["vintage camera"],
  "street food crawls": ["street food stall", "food festival stalls"], "dinner parties": ["dinner table setting", "elegant dinner table candles"], ai: ["laptop code screen", "computer desk workspace"],
  "baking classes": ["pastel de nata", "pastry baking flour"], "chess in the park": ["chess board park", "chess pieces"], "urban sketching": ["sketchbook drawing pencils", "watercolor sketch city"],
  volleyball: ["beach volleyball net", "volleyball on sand"], "wellness walks": ["city viewpoint sunset", "evening street walk old town"],
};
export function searchTerms(activity: string, _title = "") {
  const a = activity.toLowerCase().trim();
  return [...new Set([...(OBJECT_QUERIES[a] ?? []), `${a} still life`, a])].filter(Boolean);
}
/** Drops photos whose description suggests faces/people or off-topic finance imagery. */
const BLOCKED = /\b(man|men|woman|women|person|people|girl|boy|face|portrait|selfie|child|kid|crowd|couple|chart|graph|stock|trading|crypto|bitcoin|finance|candlestick)\b/i;
export const isSafeDescription = (d: string | null | undefined) => !d || !BLOCKED.test(d);

async function fetchProviders(query: string): Promise<StockPhoto[]> {
  const keys = photoKeys();
  const out: StockPhoto[] = [];
  const jobs: Promise<void>[] = [];
  if (keys.unsplash) jobs.push((async () => {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15&content_filter=high`, { headers: { Authorization: `Client-ID ${keys.unsplash}`, "Accept-Version": "v1" } });
    if (!r.ok) { console.error("unsplash search failed", r.status); return; }
    const j = (await r.json()) as { results: { id: string; alt_description?: string | null; description?: string | null; urls: { regular: string }; links: { html: string; download_location: string }; user: { name: string; links: { html: string } } }[] };
    for (const p of j.results) if (isSafeDescription(`${p.alt_description ?? ""} ${p.description ?? ""}`)) out.push({ provider: "unsplash", provider_id: `unsplash:${p.id}`, url: p.urls.regular, photographer: p.user.name, photographer_url: `${p.user.links.html}?${UTM}`, source_url: `${p.links.html}?${UTM}`, download: p.links.download_location });
  })());
  if (keys.pexels) jobs.push((async () => {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15`, { headers: { Authorization: keys.pexels } });
    if (!r.ok) { console.error("pexels search failed", r.status); return; }
    const j = (await r.json()) as { photos: { id: number; url: string; photographer: string; photographer_url: string; src: { large: string } }[] };
    for (const p of j.photos) out.push({ provider: "pexels", provider_id: `pexels:${p.id}`, url: p.src.large, photographer: p.photographer, photographer_url: p.photographer_url, source_url: p.url });
  })());
  await Promise.all(jobs);
  // Interleave providers so a gallery mixes both sources.
  const u = out.filter((p) => p.provider === "unsplash"), x = out.filter((p) => p.provider === "pexels");
  return Array.from({ length: Math.max(u.length, x.length) }, (_, i) => [u[i], x[i]]).flat().filter((p): p is StockPhoto => !!p);
}

/** Cached per query so the same search never hits the providers twice. */
export async function cachedSearch(admin: Admin, query: string): Promise<StockPhoto[]> {
  const key = query.toLowerCase().trim();
  const { data } = await admin.from("photo_search_cache").select("results").eq("query", key).maybeSingle();
  if (data) return data.results as unknown as StockPhoto[];
  const results = await fetchProviders(key);
  if (results.length) await admin.from("photo_search_cache").upsert({ query: key, results: results as unknown as Database["public"]["Tables"]["photo_search_cache"]["Insert"]["results"] });
  return results;
}

/** Claims photos nobody else has used; the unique keys on photo_credits make reuse across plans impossible. */
export async function claimPhotos(admin: Admin, candidates: StockPhoto[], max: number, owner: { plan_id?: string; interest?: string }) {
  const claimed: StockPhoto[] = [];
  const ids = candidates.map((c) => c.provider_id);
  const { data: used } = ids.length ? await admin.from("photo_credits").select("provider_id").in("provider_id", ids) : { data: [] };
  const taken = new Set((used ?? []).map((u) => u.provider_id));
  for (const c of candidates) {
    if (claimed.length >= max) break;
    if (taken.has(c.provider_id)) continue;
    const { data, error } = await admin.from("photo_credits").upsert({ photo: c.url, provider_id: c.provider_id, provider: c.provider, photographer: c.photographer, photographer_url: c.photographer_url, source_url: c.source_url, plan_id: owner.plan_id ?? null, interest: owner.interest ?? null }, { onConflict: "photo", ignoreDuplicates: true }).select("photo");
    if (error || !data?.length) continue;
    claimed.push(c);
    const key = photoKeys().unsplash;
    if (c.download && key) fetch(c.download, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => undefined);
  }
  return claimed;
}
