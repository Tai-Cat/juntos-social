import { GetAppLink } from "./InstallBanner";
import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/help", label: "Help & FAQs" },
  { to: "/pricing", label: "Membership" },
  { to: "/legal", label: "Legal notice" },
  { to: "/terms", label: "Terms of sale" },
  { to: "/privacy", label: "Privacy" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-foreground hover:underline">{l.label}</Link>
        ))}
        <GetAppLink className="hover:text-foreground hover:underline" />
      </nav>
      <p className="mt-3">© {new Date().getFullYear()} Juntos · Good plans, great company</p>
      <p className="mt-1">Photos by photographers on <a href="https://unsplash.com/?utm_source=juntos&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a> and by Juntos hosts.</p>
    </footer>
  );
}

/** Simple wrapper for text pages (legal, terms, privacy). */
export function TextPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <article className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </article>
  );
}
