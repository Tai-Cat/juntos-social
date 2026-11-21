import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/tagalong/AppShell";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/lib/how-it-works";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Juntos — good plans, great company" },
      { name: "description", content: "How Juntos works: find a plan, join the company, meet in real life." },
      { property: "og:title", content: "About Juntos — good plans, great company" },
      { property: "og:description", content: "Turn your plans into plus-ones, and venues' empty slots into full tables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});
function About() {
  return (
    <AppShell>
      <p className="eyebrow">Juntos means together</p>
      <h1 className="mt-2 text-4xl">Good plans, great company.</h1>
      <p className="mt-3 max-w-xl text-lg">Turn your plans into plus-ones, and venues' empty slots into full tables.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((c, i) => (
          <article key={c.title} className={`rounded-lg p-6 ${c.tone}`}>
            <p className="eyebrow">Step {i + 1}</p>
            <h2 className="mt-2 text-2xl">{c.title}</h2>
            <p className="mt-2 text-sm">{c.body}</p>
          </article>
        ))}
      </div>
      <Button asChild className="mt-8"><Link to="/feed">Find a plan</Link></Button>
    </AppShell>
  );
}
