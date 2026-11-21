import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";

/** Google Maps search link; on iPhone and iPad we use Apple Maps, which opens the Maps app. */
export function mapsUrl(query: string, apple: boolean): string {
  const q = encodeURIComponent(query);
  return apple ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Tappable place or address that opens the phone's maps app (Google Maps elsewhere). */
export function MapLink({ query, children }: { query: string; children: ReactNode }) {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setApple(/iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document));
  }, []);
  return (
    <a
      href={mapsUrl(query, apple)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:decoration-foreground"
      title="Open in Maps"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">(opens in Maps)</span>
    </a>
  );
}
