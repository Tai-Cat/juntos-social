import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type StockPhoto = { provider: "unsplash" | "pexels"; provider_id: string; url: string; photographer: string; photographer_url: string; source_url: string; download?: string };
type Admin = SupabaseClient<Database>;
const UTM = "utm_source=tagalong&utm_medium=referral";

export function photoKeys() {
  return { unsplash: process.env["UNSPLASH_ACCESS_KEY"] ?? "", pexels: process.env["PEXELS_API_KEY"] ?? "" };
}

export function searchTerms(activity: string, title = "") {
  const stop = new Set(["the", "and", "with", "for", "a", "an", "in", "at", "of", "to", "on", "our", "your", "example", "night", "session", "evening", "morning", "club", "intro"]);
  const words = title.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w));
  return [...new Set([activity.toLowerCase().trim(), [activity, ...words.slice(0, 2)].join(" ").trim()])].filter(Boolean);
}

async function fetchProviders(query: string): Promise<StockPhoto[]> {
  const keys = photoKeys();
  const out: StockPhoto[] = [];
  const jobs: Promise<void>[] = [];
  if (keys.unsplash) jobs.push((async () => {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15&content_filter=high`, { headers: { Authorization: `Client-ID ${keys.unsplash}`, "Accept-Version": "v1" } });
    if (!r.ok) { console.error("unsplash search failed", r.status); return; }
    const j = (await r.json()) as { results: { id: string; urls: { regular: string }; links: { html: string; download_location: string }; user: { name: string; links: { html: string } } }[] };
    for (const p of j.results) out.push({ provider: "unsplash", provider_id: `unsplash:${p.id}`, url: p.urls.regular, photographer: p.user.name, photographer_url: `${p.user.links.html}?${UTM}`, source_url: `${p.links.html}?${UTM}`, download: p.links.download_location });
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
