import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cachedSearch, claimPhotos, photoKeys, searchTerms } from "./image-search.server";

type Result = { photos: string[]; status: "ok" | "missing_keys" | "none" };

/** Fills a plan with 3–5 licensed stock photos when the host uploaded none. Idempotent per plan. */
export const ensurePlanPhotos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ planId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { photos: [], status: "none" };
    const bearer = getRequestHeader("authorization");
    const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { ...(bearer ? { headers: { Authorization: bearer } } : {}), fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } } });
    // Only plans the caller can already see are eligible.
    const { data: plan } = await client.from("plans").select("id,title,activity,photos").eq("id", data.planId).maybeSingle();
    if (!plan) return { photos: [], status: "none" };
    if (plan.photos.some((p) => p.startsWith("storage:"))) return { photos: [], status: "none" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("photo_credits").select("photo").eq("plan_id", plan.id).order("created_at");
    if (existing?.length) return { photos: existing.map((e) => e.photo), status: "ok" };
    const keys = photoKeys();
    if (!keys.unsplash && !keys.pexels) return { photos: [], status: "missing_keys" };
    const candidates = [];
    // Stop early: the free Unsplash tier allows ~50 searches an hour.
    for (const term of searchTerms(plan.activity, plan.title)) { candidates.push(...(await cachedSearch(supabaseAdmin, term))); if (candidates.length >= 8) break; }
    const claimed = await claimPhotos(supabaseAdmin, candidates, 5, { plan_id: plan.id });
    if (!claimed.length) return { photos: [], status: "none" };
    const photos = claimed.map((c) => c.url);
    const { error } = await supabaseAdmin.from("plans").update({ photos, image_url: photos[0] ?? null }).eq("id", plan.id);
    if (error) console.error("plan photo update failed", error.message);
    return { photos, status: "ok" };
  });

/** One real photo per interest, shared by everyone who picks it. */
export const ensureInterestPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ interest: z.string().trim().toLowerCase().min(1).max(60) }).parse(input))
  .handler(async ({ data }): Promise<{ photo: string | null; status: Result["status"] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("photo_credits").select("photo").eq("interest", data.interest).maybeSingle();
    if (row) return { photo: row.photo, status: "ok" };
    const keys = photoKeys();
    if (!keys.unsplash && !keys.pexels) return { photo: null, status: "missing_keys" };
    const claimed = await claimPhotos(supabaseAdmin, await cachedSearch(supabaseAdmin, data.interest), 1, { interest: data.interest });
    return { photo: claimed[0]?.url ?? null, status: claimed.length ? "ok" : "none" };
  });

/** A shared skyline/landmark photo per city for trip and city cards. Public: cities are not private. */
export const getCityPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ city: z.string().trim().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<{ photo: string | null }> => {
    const keys = photoKeys();
    if (!keys.unsplash && !keys.pexels) return { photo: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results = await cachedSearch(supabaseAdmin, `${data.city} city skyline landmark`);
    return { photo: results[0]?.url ?? null };
  });
