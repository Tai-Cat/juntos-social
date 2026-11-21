import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Compass, Inbox, Plus, User } from "lucide-react";
import { useMyProfile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/feed", label: "Plans", icon: Compass },
  { to: "/post", label: "Post", icon: Plus },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/profile", label: "You", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { profile } = useMyProfile();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && !profile.onboarded && !loc.pathname.startsWith("/onboarding") && !loc.pathname.startsWith("/verify")) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, loc.pathname, navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Link to="/feed" className="font-display text-2xl">Tagalong</Link>
        {title && <span className="eyebrow">{title}</span>}
      </header>
      <main className="flex-1 px-5 pb-28 pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} search={{}} className={cn("flex flex-col items-center gap-1 py-3 text-[11px]", active ? "text-foreground" : "text-muted-foreground")}>
                <Icon className={cn("h-5 w-5", active && to === "/post" && "text-tangerine")} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
