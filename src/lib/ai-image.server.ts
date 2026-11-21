import { generateImage, GatewayError } from "@lovable.dev/ai-gateway";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;
const STYLE = "Realistic editorial photograph, natural light, object or scene focused, no visible faces, no people in focus, no text, no logos, no watermark.";

/** Builds a prompt only from records that exist, so the public route cannot be used to generate arbitrary images. */
export async function promptFor(admin: Admin, kind: string, ref: string): Promise<string | null> {
  if (kind === "plan") {
    if (!/^[0-9a-f-]{36}$/.test(ref)) return null;
    const { data } = await admin.from("plans").select("title,activity,city").eq("id", ref).maybeSingle();
    return data ? `${STYLE} Header image for an event called "${data.title}" (${data.activity}) in ${data.city}. Show the setting or objects of this activity.` : null;
  }
  if (kind === "city") {
    const name = ref.split(",")[0]?.trim() ?? "";
    const [p, t] = await Promise.all([
      admin.from("plans").select("id", { count: "exact", head: true }).ilike("city", name),
      admin.from("trips").select("id", { count: "exact", head: true }).ilike("city", name),
    ]);
    const known = (p.count ?? 0) + (t.count ?? 0) > 0;
    return known ? `${STYLE} Wide skyline or famous landmark of ${name}, travel photography.` : null;
  }
  if (kind === "interest") {
    const [a, pr] = await Promise.all([
      admin.from("activities").select("name").ilike("name", ref).limit(1),
      admin.from("profiles").select("id").contains("interests", [ref]).limit(1),
    ]);
    return a.data?.length || pr.data?.length ? `${STYLE} Still life or scene representing the hobby "${ref}".` : null;
  }
  if (kind === "org") {
    const { data } = await admin.from("organisations").select("name,category,city,kind").eq("slug", ref).maybeSingle();
    return data ? `${STYLE} Cover image for a ${data.kind === "community" ? "community group" : data.kind} called "${data.name}"${data.category ? ` (${data.category})` : ""}${data.city ? ` in ${data.city}` : ""}. Show its setting or activity.` : null;
  }
  return null;
}

/** Returns cached bytes or generates once. A row with null data acts as an in-flight lock. */
export async function getOrCreate(admin: Admin, kind: string, ref: string): Promise<{ data: string; mime: string } | "pending" | null> {
  const key = `${kind}:${ref}`;
  const { data: row } = await admin.from("generated_images").select("data,mime,created_at").eq("key", key).maybeSingle();
  if (row?.data) return { data: row.data, mime: row.mime };
  if (row && Date.now() - new Date(row.created_at).getTime() < 3 * 60 * 1000) return "pending";
  const prompt = await promptFor(admin, kind, ref);
  if (!prompt) return null;
  if (row) await admin.from("generated_images").delete().eq("key", key);
  const { error: lockErr } = await admin.from("generated_images").insert({ key, prompt });
  if (lockErr) return "pending";
  try {
    const res = await generateImage({ model: "openai/gpt-image-2.5-sunburst", prompt, size: "1536x1024", quality: "low", output_format: "jpeg", output_compression: 80 });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("no image returned");
    await admin.from("generated_images").update({ data: b64, mime: "image/jpeg" }).eq("key", key);
    return { data: b64, mime: "image/jpeg" };
  } catch (e) {
    console.error("ai image failed", key, e instanceof GatewayError ? `${e.code} ${e.httpStatus}` : e);
    await admin.from("generated_images").delete().eq("key", key);
    return null;
  }
}
