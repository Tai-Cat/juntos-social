import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TABS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/plans", label: "Plans" },
  { to: "/admin/review", label: "Reviews" },
] as const;

/** Back to Profile plus tabs between admin pages, so admins never have to retrace their steps. */
export function AdminNav() {
  const path = useLocation().pathname;
  return (
    <nav aria-label="Admin" className="-mx-1 mb-5 flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <Link to="/profile" className="mr-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Profile
      </Link>
      {TABS.map((t) => (
        <Link key={t.to} to={t.to} aria-current={path === t.to ? "page" : undefined} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${path === t.to ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
