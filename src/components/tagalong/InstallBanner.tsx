import { useEffect, useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JuntosMark } from "./JuntosLogo";
import { isInstalled } from "@/lib/push";

/** Chrome / Android fires this when the site can be installed as an app. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "juntos-install-dismissed";

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - t < 3 * 24 * 60 * 60 * 1000; // ask again after 3 days
  } catch {
    return false;
  }
}

const ua = () => navigator.userAgent;
const isIos = () => /iPhone|iPad|iPod/.test(ua()) || (ua().includes("Mac") && "ontouchend" in document);
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(ua()) || (ua().includes("Mac") && "ontouchend" in document);
const welcomeOpen = () => !!document.querySelector(".welcome-screen") && document.documentElement.dataset["welcome"] !== "seen";

/**
 * "Get the Juntos app" pop-up for phone visitors who haven't installed it.
 * Android/Chrome: "Install" opens the phone's own install dialog (one more tap: Install).
 * iPhone: Apple lets only the person add a website to the home screen, so the pop-up
 * shows the two Safari taps with pictures. It waits until the welcome screen is closed.
 */
export function InstallBanner() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios" | "ios-other">("hidden");
  const [ready, setReady] = useState<"android" | "ios" | "ios-other" | null>(null);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInstalled() || dismissedRecently() || !isMobile()) return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/push-sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
      setReady("android");
    };
    const onInstalled = () => setMode("hidden");
    if (isIos()) {
      const safari = /Safari/.test(ua()) && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV|WhatsApp/.test(ua());
      setReady(safari ? "ios" : "ios-other");
    } else {
      window.addEventListener("beforeinstallprompt", onPrompt);
      window.addEventListener("appinstalled", onInstalled);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Pop up a moment after the page settles, and never on top of the welcome screen.
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const show = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setMode(ready), 900);
    };
    if (welcomeOpen()) window.addEventListener("juntos-welcome-closed", show, { once: true });
    else show();
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("juntos-welcome-closed", show);
    };
  }, [ready]);

  if (mode === "hidden") return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked: the pop-up returns next visit */
    }
    setMode("hidden");
  };

  return (
    <div className="install-popup-backdrop" role="presentation" onClick={close}>
      <div className="install-popup" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Not now" onClick={close} className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] border border-border bg-background shadow-sm">
          <JuntosMark className="h-14 w-14" />
        </span>
        <h2 id="install-title" className="mt-4 text-center font-display text-2xl">Get the Juntos app</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">Free. On your home screen, full screen, with plan alerts.</p>

        {mode === "android" && promptEvent && (
          <button
            type="button"
            className="welcome-cta mt-5"
            onClick={async () => {
              await promptEvent.prompt();
              const { outcome } = await promptEvent.userChoice;
              if (outcome === "accepted") setMode("hidden");
            }}
          >
            Yes, install the app
          </button>
        )}

        {mode === "ios" && (
          <ol className="mt-5 space-y-3">
            <li className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card shadow-sm"><Share className="h-5 w-5 text-[#0A84FF]" aria-hidden /></span>
              <span>Tap <b>Share</b> in Safari's bottom bar</span>
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card shadow-sm"><SquarePlus className="h-5 w-5" aria-hidden /></span>
              <span>Choose <b>Add to Home Screen</b>, then <b>Add</b></span>
            </li>
          </ol>
        )}

        {mode === "ios-other" && (
          <p className="mt-5 rounded-xl bg-background p-3 text-center text-sm">
            Open this link in <b>Safari</b> to install Juntos. iPhone only adds apps to the home screen from Safari.
          </p>
        )}

        <button type="button" onClick={close} className="mt-4 w-full text-center text-sm font-bold text-muted-foreground">
          {mode === "ios" ? "Got it" : "Not now"}
        </button>
      </div>
    </div>
  );
}


/**
 * Inside the installed app, signed-out visitors land straight on a sign-up card
 * so the first thing they see after installing is "create your account".
 */
export function InstalledWelcome() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(isInstalled()), []);
  if (!show) return null;
  return (
    <div className="mb-4 rounded-xl border border-tangerine bg-card p-4">
      <div className="flex items-center gap-3">
        <JuntosMark className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-tight">Welcome to Juntos</p>
          <p className="text-xs text-muted-foreground">Create your free account to join plans and meet people.</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button asChild className="flex-1"><a href="/auth?mode=signup">Sign up</a></Button>
        <Button asChild variant="outline"><a href="/auth">Sign in</a></Button>
      </div>
    </div>
  );
}
