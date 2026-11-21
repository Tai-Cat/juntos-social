import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/lib/how-it-works";
const KEY = "juntos-how-it-works-seen";
/** Three swipeable how-it-works cards shown once on a first visit; skippable. */
export function FirstVisitCards() {
  const [show, setShow] = useState(false);
  const [ref, api] = useEmblaCarousel();
  const [index, setIndex] = useState(0);
  useEffect(() => { try { setShow(localStorage.getItem(KEY) !== "1"); } catch {} }, []);
  const onSelect = useCallback(() => setIndex(api?.selectedScrollSnap() ?? 0), [api]);
  useEffect(() => { api?.on("select", onSelect); return () => { api?.off("select", onSelect); }; }, [api, onSelect]);
  if (!show) return null;
  const done = () => { try { localStorage.setItem(KEY, "1"); } catch {} setShow(false); };
  const last = index === HOW_IT_WORKS.length - 1;
  return (
    <section aria-label="How Juntos works" className="relative mb-5 rounded-xl border border-border bg-card p-4">
      <Button variant="ghost" size="sm" className="absolute right-2 top-2 z-10" onClick={done}>Skip <X /></Button>
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {HOW_IT_WORKS.map((c, i) => (
            <article key={c.title} className={`mr-3 min-w-0 flex-[0_0_88%] rounded-lg p-5 sm:flex-[0_0_60%] ${c.tone}`}>
              <p className="eyebrow">{i + 1} of 3</p>
              <h2 className="mt-2 text-2xl">{c.title}</h2>
              <p className="mt-2 text-sm">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">{HOW_IT_WORKS.map((c, i) => <span key={c.title} className={`h-2 w-2 rounded-full ${i === index ? "bg-tangerine" : "bg-border"}`} />)}</div>
        <Button size="sm" onClick={() => (last ? done() : api?.scrollNext())}>{last ? "Let's go" : "Next"}</Button>
      </div>
    </section>
  );
}
