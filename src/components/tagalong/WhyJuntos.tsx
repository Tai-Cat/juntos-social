import { Crown, X } from "lucide-react";
import { PLUS_PAYMENT_LINK } from "@/lib/plus";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WHY_JUNTOS, dismissWhyLine, whyLineDismissed } from "@/lib/why-juntos";

/** Small problem statement shown at the top of the About page. */
export function WhyJuntosCard() {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <p className="eyebrow">Why Juntos</p>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{WHY_JUNTOS}</p>
    </div>
  );
}

/** Problem statement shown to everyone at the top of Home and Explore. */
export function HomeHero() {
  return (
    <div className="mb-4">
      <p className="font-display text-2xl leading-tight sm:text-3xl">Good plans, great company</p>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{WHY_JUNTOS}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs">
          <span className="font-bold">Free to join.</span>{" "}
          <span className="text-muted-foreground">Plus</span> <span className="font-bold">€5</span> <span className="text-muted-foreground">· Club</span> <span className="font-bold">€10 / month</span>
        </p>
        <a
          href={PLUS_PAYMENT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden /> Get Plus
        </a>
        <Link to="/pricing" className="text-xs font-bold text-tangerine underline-offset-2 hover:underline">Compare plans</Link>
      </div>
    </div>
  );
}

/**
 * Slim one-line version under the Explore search bar, for signed-out visitors only.
 * The X hides it for this browser (localStorage).
 */
export function WhyJuntosLine() {
  // null = not read yet; never decide from storage during render so SSR and the
  // first client paint agree.
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  useEffect(() => setDismissed(whyLineDismissed()), []);
  if (dismissed !== false) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
      <p className="flex-1 text-[13px] leading-snug text-muted-foreground">{WHY_JUNTOS}</p>
      <button
        type="button"
        aria-label="Hide this message"
        onClick={() => {
          dismissWhyLine();
          setDismissed(true);
        }}
        className="-mr-1 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
