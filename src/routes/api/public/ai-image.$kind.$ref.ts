import { createFileRoute } from "@tanstack/react-router";

const TINT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none"><rect width="400" height="300" fill="#F3ECE0"/></svg>`;
const tint = (seconds: number) => new Response(TINT, { headers: { "content-type": "image/svg+xml", "cache-control": `public, max-age=${seconds}` } });

export const Route = createFileRoute("/api/public/ai-image/$kind/$ref")({
  server: {
    handlers: {
      // Public by design: images only, and prompts are built solely from existing records.
      GET: async ({ params }) => {
        const kind = params.kind;
        const ref = decodeURIComponent(params.ref).trim().toLowerCase().slice(0, 80);
        if (!["plan", "interest", "city", "org"].includes(kind) || !ref) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getOrCreate } = await import("@/lib/ai-image.server");
        const img = await getOrCreate(supabaseAdmin, kind, ref);
        if (img === "pending") return tint(20);
        if (!img) return tint(300);
        const bytes = Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0));
        return new Response(bytes, { headers: { "content-type": img.mime, "cache-control": "public, max-age=604800, immutable" } });
      },
    },
  },
});
