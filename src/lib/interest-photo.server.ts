import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { cachedSearch, claimPhotos, searchTerms } from "./image-search.server";

type Admin = SupabaseClient<Database>;

/**
 * A real stock photo for an interest tile.
 * Reuses the photo already claimed for this interest; otherwise searches (cached per
 * query) and claims one unused photo, recording the photographer credit.
 * Only known interests (catalogue activities or ones people picked) are searched.
 */
export async function interestPhoto(admin: Admin, interest: string): Promise<string | null> {
  const { data: existing } = await admin.from("photo_credits").select("photo").eq("interest", interest).limit(1);
  if (existing?.[0]?.photo) return existing[0].photo;

  const [a, pr] = await Promise.all([
    admin.from("activities").select("name").ilike("name", interest).limit(1),
    admin.from("profiles").select("id").contains("interests", [interest]).limit(1),
  ]);
  if (!a.data?.length && !pr.data?.length) return null;

  for (const term of searchTerms(interest)) {
    const results = await cachedSearch(admin, term);
    if (!results.length) continue;
    const [claimed] = await claimPhotos(admin, results, 1, { interest });
    if (claimed) return claimed.url;
  }
  return null;
}
