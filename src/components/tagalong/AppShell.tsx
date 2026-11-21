import { useAuthAction } from "./AuthSheet";
import { Button } from "@/components/ui/button";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Compass, Plane, Inbox, Plus, User, CalendarDays, Map, List, ArrowLeft, Bell } from "lucide-react";
import { useMyProfile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LocationPicker } from "./LocationPicker";
import { setExplorePrefs, useExplorePrefs } from "@/lib/explore-prefs";
import { cityName } from "@/lib/catalog";
import { JuntosLogo } from "./JuntosLogo";
import { SiteFooter } from "./SiteFooter";
import { useNotificationFeed } from "./Notifications";
const NAV = [
  { to: "/feed", label: "Explore", icon: Compass },
  { to: "/travel", label: "Travel", icon: Plane },
  { to: "/post", label: "Post", icon: Plus },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/profile", label: "Profile", icon: User },
] as const;
export function AppShell({ children }: { children: ReactNode; title?: string }) {
  const { profile, loading, user } = useMyProfile();
  const auth = useAuthAction();
  const loc = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const prefs = useExplorePrefs();
  const city = prefs.city ?? cityName(profile?.home_city ?? "Paris");
  const onExplore = loc.pathname === "/" || loc.pathname === "/feed";
  useEffect(() => {
    if (
      !loading &&
      profile &&
      !profile.onboarded &&
      !loc.pathname.startsWith("/onboarding") &&
      !loc.pathname.startsWith("/verify")
    )
      navigate({ to: "/onboarding" });
  }, [profile, loading, loc.pathname, navigate]);
  const mapOn = prefs.view === "map";
  const unread = useNotificationFeed();
  const badge = unread > 9 ? "9+" : String(unread);
  return (
    <div className="mx-auto min-h-screen max-w-7xl border-x border-border">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:gap-3 sm:px-8">
        <Link to="/feed" aria-label="Juntos home" className="shrink-0"><JuntosLogo /></Link>
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <LocationPicker
            compact
            autoLocate={!prefs.city}
            value={city}
            onChange={(v) => setExplorePrefs({ city: v })}
            onPosition={(position) => setExplorePrefs({ position })}
          />
          <Button
            size="icon"
            variant={onExplore && mapOn ? "secondary" : "ghost"}
            aria-label={mapOn ? "Show list" : "Show map"}
            title={mapOn ? "Show list" : "Show map"}
            onClick={() => {
              setExplorePrefs({ view: onExplore && mapOn ? "browse" : "map" });
              if (!onExplore) navigate({ to: "/feed" });
            }}
          >
            {onExplore && mapOn ? <List className="h-5 w-5" /> : <Map className="h-5 w-5" />}
          </Button>
          <Button asChild size="sm" variant={loc.pathname === "/pricing" ? "secondary" : "ghost"} className="px-2 text-xs font-bold">
            <Link to="/pricing">Pricing</Link>
          </Button>
          <Button asChild size="icon" variant={loc.pathname.startsWith("/calendar") ? "secondary" : "ghost"} aria-label="Calendar" title="Calendar">
            <Link to="/calendar"><CalendarDays className="h-5 w-5" /></Link>
          </Button>
          {user && (
            <Button asChild size="icon" variant="ghost" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
              <Link to="/inbox" search={{ tab: "notifications" }}>
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-logo-pink px-1 text-[10px] font-bold text-primary-foreground">{badge}</span>}
              </Link>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            aria-label={user ? "Your profile" : "Sign in"}
            onClick={() => auth(() => navigate({ to: "/profile" }), "profile")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-tangerine-soft font-display text-sm font-bold text-tangerine">
              {profile?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
            </span>
          </Button>
        </div>
      </header>
      <main className="app-main px-4 pb-28 pt-4 sm:px-8">
        {!onExplore && (
          <div className="mb-4 flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => (window.history.length > 1 ? router.history.back() : navigate({ to: "/feed" }))}>
              <ArrowLeft /> Back
            </Button>
            <span className="text-muted-foreground">·</span>
            <Button asChild variant="link" size="sm" className="text-tangerine"><Link to="/feed">Explore</Link></Button>
          </div>
        )}
        {children}
        <SiteFooter />
      </main>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to) || (to === "/feed" && loc.pathname === "/");
            return (
              <Button
                variant="ghost"
                key={to}
                onClick={() => {
                  const go = () => navigate({ to, search: {} });
                  if (["/post", "/inbox", "/profile"].includes(to)) auth(go, label.toLowerCase());
                  else go();
                }}
                className={cn(
                  "h-auto rounded-none flex min-w-0 flex-col items-center gap-1 py-3 text-[10px] font-bold sm:text-xs",
                  active ? "text-tangerine" : "text-muted-foreground",
                )}
              >
                <span className={cn("relative grid h-8 w-10 place-items-center rounded-lg", active && "bg-tangerine-soft")}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                  {to === "/profile" && unread > 0 && <span aria-label={`${unread} unread notifications`} className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-logo-pink px-1 text-[10px] font-bold text-primary-foreground">{badge}</span>}
                </span>
                {label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
