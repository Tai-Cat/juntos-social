import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tagalong — turn your plans into plus-ones" },
      { name: "description", content: "Meet people in real life by joining plans they're already doing, at home or while travelling." },
      { property: "og:title", content: "Tagalong — turn your plans into plus-ones" },
      { property: "og:description", content: "Turn your plans into plus-ones, and venues' empty slots into full tables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "01", title: "Post what you're already doing", body: "A dog walk, a laundry run, pottery on Thursday. Add how many can tag along." },
  { n: "02", title: "Request to join", body: "Browse plans near you or where you're travelling. The host approves who comes." },
  { n: "03", title: "Meet in a public place", body: "The exact spot unlocks two hours before. Partner venues get cheaper as the table fills." },
];

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-display text-2xl">Tagalong</span>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>

      <section className="pb-14 pt-16">
        <p className="eyebrow">Paris · Lisbon · Porto · Rome · Barcelona</p>
        <h1 className="mt-5 text-[2.6rem] leading-[1.08]">
          Turn your plans into plus-ones, and venues' empty slots into full tables.
        </h1>
        <p className="mt-6 text-muted-foreground">
          Meet people in real life by joining what they're already doing, locally and while travelling.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Button asChild size="lg" variant="accent"><Link to="/feed">Find a plan</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/post" search={{}}>Post a plan</Link></Button>
        </div>
      </section>

      <section className="border-t border-border py-12">
        <p className="eyebrow">How it works</p>
        <ol className="mt-6 divide-y divide-border">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5 py-6">
              <span className="font-display text-lg text-tangerine">{s.n}</span>
              <div>
                <h3 className="text-lg">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border py-8 text-xs text-muted-foreground">
        Public places and partner venues only. Verified hosts. Report and block, always one tap away.
      </footer>
    </div>
  );
}
