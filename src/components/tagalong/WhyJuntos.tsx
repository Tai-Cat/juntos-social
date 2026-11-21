import { X } from "lucide-react";
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
