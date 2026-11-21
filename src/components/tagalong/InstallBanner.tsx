import { useEffect, useState } from "react";
import { Share, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JuntosMark } from "./JuntosLogo";
import { isInstalled } from "@/lib/push";

/** Chrome / Android / desktop Chrome fire this when the site can be installed as an app. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "juntos-install-dismissed";
/** Anything on the page can open the pop-up with: window.dispatchEvent(new Event(OPEN_INSTALL)) */
export const OPEN_INSTALL = "juntos-open-install";

function dismissedRecently(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < 3 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

const ua = () => navigator.userAgent;
const isIos = () => /iPhone|iPad|iPod/.test(ua()) || (ua().includes("Mac") && "ontouchend" in document);
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(ua()) || isIos();
const isIosSafari = () => isIos() && /Safari/.test(ua()) && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV|WhatsApp/.test(ua());
const welcomeOpen = () => !!document.querySelector(".welcome-screen") && document.documentElement.dataset["welcome"] !== "seen";

// Chrome fires beforeinstallprompt once, often before React mounts: catch it early.
let earlyPrompt: InstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    earlyPrompt = e as InstallPromptEvent;
  });
}

/**
 * "Download Juntos as an app?" with Yes / No.
 * Android and Chrome: Yes opens the phone's own install confirmation.
 * iPhone: Apple doesn't let websites install themselves, so Yes shows the two Safari taps.
 * Opens by itself once on phones, and any time from "Get the app" links (OPEN_INSTALL).
 */
export function InstallBanner() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"ask" | "ios" | "ios-other" | "done">("ask");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (earlyPrompt) setPromptEvent(earlyPrompt);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setOpen(false);
    const onOpen = () => {
      setStep("ask");
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(OPEN_INSTALL, onOpen);

    let t = 0;
    const auto = () => {
      t = window.setTimeout(() => setOpen(true), 900);
    };
    if (!isInstalled() && !dismissedRecently() && isMobile()) {
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("/push-sw.js").catch(() => {});
      if (welcomeOpen()) window.addEventListener("juntos-welcome-closed", auto, { once: true });
      else auto();
    }
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(OPEN_INSTALL, onOpen);
      window.removeEventListener("juntos-welcome-closed", auto);
    };
  }, []);

  if (!open) return null;

  const no = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked: the pop-up returns next visit */
    }
    setOpen(false);
  };

  const yes = async () => {
    const p = promptEvent ?? earlyPrompt;
    if (p) {
      await p.prompt();
      const { outcome } = await p.userChoice;
      earlyPrompt = null;
      setPromptEvent(null);
      if (outcome === "accepted") setOpen(false);
      return;
    }
    if (isIos()) {
      setStep(isIosSafari() ? "ios" : "ios-other");
      return;
    }
    setStep("done");
  };

  return (
    <div className="install-popup-backdrop" role="presentation" onClick={no}>
      <div className="install-popup" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] border border-border bg-background shadow-sm">
          <JuntosMark className="h-14 w-14" />
        </span>

        {step === "ask" && (
          <>
            <h2 id="install-title" className="mt-4 text-center font-display text-2xl">Download Juntos as an app?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">Free, on your home screen, with plan alerts.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" className="rounded-full" onClick={no}>No</Button>
              <button type="button" className="welcome-cta !py-3" onClick={yes}>Yes</button>
            </div>
          </>
        )}

        {step === "ios" && (
          <>
            <h2 id="install-title" className="mt-4 text-center font-display text-2xl">Two taps and it's yours</h2>
            <ol className="mt-4 space-y-3">
              <li className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card shadow-sm"><Share className="h-5 w-5 text-[#0A84FF]" aria-hidden /></span>
                <span>Tap <b>Share</b> at the bottom of Safari</span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-background p-3 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card shadow-sm"><SquarePlus className="h-5 w-5" aria-hidden /></span>
                <span>Tap <b>Add to Home Screen</b>, then <b>Add</b></span>
              </li>
            </ol>
            <Button className="mt-4 w-full rounded-full" variant="outline" onClick={() => setOpen(false)}>Done</Button>
          </>
        )}

        {step === "ios-other" && (
          <>
            <h2 id="install-title" className="mt-4 text-center font-display text-2xl">Open in Safari first</h2>
            <p className="mt-2 text-center text-sm">iPhone only installs apps from Safari. Open this link in Safari, then tap <b>Get the app</b> again.</p>
            <Button className="mt-4 w-full rounded-full" variant="outline" onClick={() => setOpen(false)}>OK</Button>
          </>
        )}

        {step === "done" && (
          <>
            <h2 id="install-title" className="mt-4 text-center font-display text-2xl">Use your browser's menu</h2>
            <p className="mt-2 text-center text-sm">Open your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.</p>
            <Button className="mt-4 w-full rounded-full" variant="outline" onClick={() => setOpen(false)}>OK</Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Small "Get the app" link that opens the pop-up; hidden inside the installed app. */
export function GetAppLink({ className = "" }: { className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!isInstalled()), []);
  if (!show) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL))}>
      Get the app
    </button>
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
