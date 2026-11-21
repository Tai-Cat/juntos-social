import { useAuthAction } from "./AuthSheet";
import { Button } from "@/components/ui/button";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Compass, Plane, Inbox, Plus, User, MapPin } from "lucide-react";
import { useMyProfile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
const NAV = [
  { to: "/feed", label: "Explore", icon: Compass },
  { to: "/travel", label: "Travel", icon: Plane },
  { to: "/post", label: "Post", icon: Plus },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/profile", label: "Profile", icon: User },
] as const;
export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { profile, loading, user } = useMyProfile();
  const auth = useAuthAction();
  const loc = useLocation();
  const navigate = useNavigate();
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
  return (
    <div className="mx-auto min-h-screen max-w-6xl border-x border-border">
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
        <Link to="/feed" className="font-display text-3xl font-semibold">
          Tagalong<span className="text-tangerine">.</span>
        </Link>
        <span className="flex min-w-0 items-center gap-1 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-tangerine" />
          {title ?? (user ? profile?.home_city : "Good company, nearby")}
        </span>
      </header>
      <main className="app-main px-4 pb-28 pt-6 sm:px-8">{children}</main>
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
                <span
                  className={cn(
                    "grid h-8 w-10 place-items-center rounded-lg",
                    active && "bg-tangerine-soft",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
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
