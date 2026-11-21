import { useEffect, useState } from "react";
import { ArrowRight, Check, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { JuntosMark } from "./JuntosLogo";
import { WHY_JUNTOS } from "@/lib/why-juntos";
import { PLUS_PAYMENT_LINK } from "@/lib/plus";
import { PayLink } from "./PayLink";

/** localStorage key; the root head script turns it into html[data-welcome="seen"]. */
export const WELCOME_KEY = "juntos-welcome";

const STEPS = ["Pick a plan that's already happening", "Tap Join, no back-and-forth", "Meet people, save with group discounts"];

/**
 * First-visit welcome for the home link: what Juntos is, the price, and one clear
 * button into the app. It is in the server HTML (so the problem and price are on the
 * home page), and hidden by CSS for anyone who has already tapped through.
 */
export function WelcomeScreen() {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("welcome-open", document.documentElement.dataset["welcome"] !== "seen" && !closed);
    return () => document.body.classList.remove("welcome-open");
  }, [closed]);
  if (closed) return null;

  const enter = () => {
    try {
      localStorage.setItem(WELCOME_KEY, "seen");
    } catch {
      /* storage blocked: the welcome shows again next visit */
    }
    document.documentElement.dataset["welcome"] = "seen";
    setClosed(true);
    window.dispatchEvent(new Event("juntos-welcome-closed"));
  };

  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <JuntosMark className="mx-auto h-16 w-16" />
        <h1 id="welcome-title" className="mt-4 text-center font-display text-4xl leading-tight">
          Good plans, great company
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">{WHY_JUNTOS}</p>

        <ol className="mx-auto mt-5 max-w-sm space-y-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tangerine-soft text-xs font-bold text-tangerine">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <button type="button" onClick={enter} className="welcome-cta mt-6">
          Start exploring <ArrowRight className="h-5 w-5" aria-hidden />
        </button>

        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Free</p>
              <p className="font-display text-xl">€0</p>
            </div>
            <div className="rounded-xl bg-tangerine-soft py-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-tangerine">Plus</p>
              <p className="font-display text-xl">€5<span className="text-xs">/mo</span></p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Club</p>
              <p className="font-display text-xl">€10<span className="text-xs">/mo</span></p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <PayLink href={PLUS_PAYMENT_LINK} className="inline-flex items-center gap-1.5 font-bold text-tangerine">
              <Crown className="h-4 w-4" aria-hidden /> Get Plus
            </PayLink>
            <Link to="/pricing" onClick={enter} className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 hover:underline">
              <Check className="h-4 w-4" aria-hidden /> See all benefits
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
