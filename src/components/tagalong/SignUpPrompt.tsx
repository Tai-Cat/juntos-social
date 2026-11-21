import { UserPlus } from "lucide-react";
import { JuntosMark } from "./JuntosLogo";
import { useAuthAction } from "./AuthSheet";

const PERKS = ["Join plans and meet people", "See which friends are going", "Get matched with people who like what you like"];

/** Friendly sign-up card shown to signed-out visitors in place of friend and people sections. */
export function SignUpPrompt() {
  const auth = useAuthAction();
  return (
    <section className="my-7 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="signup-prompt-title">
      <div className="flex items-center gap-3">
        <JuntosMark className="h-11 w-11 shrink-0" />
        <div>
          <h2 id="signup-prompt-title" className="font-display text-2xl leading-tight">Join Juntos, it's free</h2>
          <p className="text-sm text-muted-foreground">Takes a minute. No card needed.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-tangerine" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="welcome-cta !w-auto flex-1 !py-3 !text-base" onClick={() => auth(() => {}, "join plans and meet people")}>
          <UserPlus className="h-5 w-5" aria-hidden /> Create my account
        </button>
        <a href="/auth" className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-bold hover:bg-muted">
          I have an account
        </a>
      </div>
    </section>
  );
}
