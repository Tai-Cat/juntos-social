import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WhatsOnItem = { title: string; summary: string; url: string };

// "whats-on": searches Tavily for things to do in a city during a date range.
export const whatsOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ city: z.string().min(1).max(80), dates: z.string().max(60) }).parse(d))
  .handler(async ({ data }): Promise<{ answer: string | null; results: WhatsOnItem[]; error: string | null }> => {
    const key = process.env["TAVILY_API_KEY"];
    if (!key) return { answer: null, results: [], error: "Search isn't set up yet." };
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          api_key: key,
          query: `things to do and events in ${data.city} ${data.dates}`,
          search_depth: "advanced",
          max_results: 8,
          include_answer: true,
        }),
      });
      if (!res.ok) {
        console.error("Tavily error", res.status, await res.text());
        return { answer: null, results: [], error: "Couldn't load events right now." };
      }
      const json = (await res.json()) as { answer?: string; results?: { title: string; content: string; url: string }[] };
      return {
        answer: json.answer ?? null,
        results: (json.results ?? []).map((r) => ({ title: r.title, summary: (r.content ?? "").slice(0, 220), url: r.url })),
        error: null,
      };
    } catch (e) {
      console.error(e);
      return { answer: null, results: [], error: "Couldn't load events right now." };
    }
  });
