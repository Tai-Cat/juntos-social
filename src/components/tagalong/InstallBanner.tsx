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
    return Date.now() - t < 3 * 24 * 60 * 60 * 1000; // hide for 3 days after X
  } catch {
    return false;
  }
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

/**
 * "Get the Juntos app" banner for phone visitors who haven't installed it yet.
 * Android: one tap opens the system install dialog.
 * iPhone: Apple has no install button for websites, so we show the two Safari steps.
 */
export function InstallBanner() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios" | "ios-other">("hidden");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isInstalled() || dismissedRecently() || !isMobile()) return;
    // Registering the worker makes the app installable in Chrome and lets push work later.
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/push-sw.js").catch(() => {});
    if (isIos()) {
      const safari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV|WhatsApp/.test(navigator.userAgent);
      setMode(safari ? "ios" : "ios-other");
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked: banner simply returns next visit */
    }
    setMode("hidden");
  };

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3 shadow-sm" role="region" aria-label="Get the Juntos app">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-background">
          <JuntosMark className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Get the Juntos app</p>
          <p className="text-xs text-muted-foreground">Free · on your home screen · plan alerts</p>
        </div>
        {mode === "android" && promptEvent ? (
          <Button
            size="sm"
            onClick={async () => {
              await promptEvent.prompt();
              const { outcome } = await promptEvent.userChoice;
              if (outcome === "accepted") setMode("hidden");
            }}
          >
            Install
          </Button>
        ) : (
          <Button size="sm" onClick={() => setShowSteps((s) => !s)}>
            {showSteps ? "Hide" : "How"}
          </Button>
        )}
        <button type="button" aria-label="Not now" onClick={close} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {showSteps && mode === "ios" && (
        <ol className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          <li className="flex items-center gap-2">
            1. Tap <Share className="h-4 w-4 text-tangerine" aria-label="Share" /> <b>Share</b> at the bottom of Safari
          </li>
          <li className="flex items-center gap-2">
            2. Choose <SquarePlus className="h-4 w-4 text-tangerine" aria-hidden /> <b>Add to Home Screen</b>, then <b>Add</b>
          </li>
          <li className="text-xs text-muted-foreground">Open Juntos from your home screen and sign up. It works like any other app.</li>
        </ol>
      )}
      {showSteps && mode === "ios-other" && (
        <p className="mt-3 border-t border-border pt-3 text-sm">
          Open this link in <b>Safari</b>, tap <b>Share</b>, then <b>Add to Home Screen</b>. iPhone only installs apps from Safari.
        </p>
      )}
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
