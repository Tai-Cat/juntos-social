import { useEffect, useState } from "react";
import { MapPin, LocateFixed, Search, Globe2, Loader2 } from "lucide-react";
import { CITIES, cityName } from "@/lib/catalog";
import { ANYWHERE } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
export type Position = { lat: number; lng: number };

/**
 * Header location pill. A bottom sheet with a fixed height (same pattern as Find people),
 * so typing never pushes the search box above the screen on phones.
 */
export function LocationPicker({
  value,
  onChange,
  onNearMe,
  nearMe = false,
  compact = false,
}: {
  autoLocate?: boolean;
  compact?: boolean;
  nearMe?: boolean;
  value: string;
  onChange: (city: string) => void;
  onNearMe?: (position: Position, city: string | null) => void;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [locating, setLocating] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("tagalong-places") ?? "[]"));
    } catch {}
  }, []);
  function remember(city: string) {
    const next = [city, ...recent.filter((r) => r !== city)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem("tagalong-places", JSON.stringify(next)); } catch {}
  }
  function choose(city: string) {
    onChange(city === ANYWHERE ? ANYWHERE : cityName(city));
    setOpen(false);
    setSearch("");
    if (city !== ANYWHERE) remember(city);
  }
  // Asks the browser each time it is tapped; the browser itself remembers the person's answer.
  function locate() {
    if (!navigator.geolocation) {
      toast("Location isn't available on this device. Pick a city instead.", { id: "juntos-location" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const point = { lat: p.coords.latitude, lng: p.coords.longitude };
        let city: string | null = null;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=10`);
          if (res.ok) {
            const data = (await res.json()) as { address?: { city?: string; town?: string; village?: string } };
            city = data.address?.city ?? data.address?.town ?? data.address?.village ?? null;
          }
        } catch { /* distance still works without a name */ }
        setLocating(false);
        onNearMe?.(point, city);
        setOpen(false);
        setSearch("");
      },
      (err) => {
        setLocating(false);
        toast(err.code === err.PERMISSION_DENIED ? "Location is blocked for Juntos. Allow it in your browser settings, or pick a city." : "Couldn't find your location. Pick a city instead.", { id: "juntos-location" });
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  const results = search
    ? CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())).slice(0, 12)
    : recent;
  const label = value === ANYWHERE ? "Anywhere" : nearMe ? `Near me${value ? ` · ${cityName(value)}` : ""}` : cityName(value || "Paris");
  return (
    <>
      <Button variant="outline" size={compact ? "sm" : "default"} aria-label={`Location: ${label}`} className="h-9 min-w-0 max-w-[10rem] items-center justify-center gap-1.5 rounded-full bg-card px-3 sm:max-w-[14rem]" onClick={() => setOpen(true)}>
        {value === ANYWHERE ? <Globe2 className="h-4 w-4 shrink-0 text-tangerine" aria-hidden /> : nearMe ? <LocateFixed className="h-4 w-4 shrink-0 text-tangerine" aria-hidden /> : <MapPin className="h-4 w-4 shrink-0 text-tangerine" aria-hidden />}
        <span className="min-w-0 truncate font-bold">{label}</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto flex h-[min(80dvh,640px)] max-h-[calc(100dvh-12px)] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-t-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-6 sm:px-6">
          <SheetHeader className="mb-3 shrink-0 pr-8 text-left">
            <SheetTitle className="font-display text-2xl">Where shall we go?</SheetTitle>
          </SheetHeader>
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search places"
              className="h-12 pl-10 text-base"
              placeholder="Search a city"
              value={search}
              enterKeyHint="search"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) choose(results[0] ?? search.trim()); }}
            />
          </div>
          <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
            <Button variant={nearMe ? "secondary" : "outline"} className="h-11 justify-start" onClick={locate} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
              {locating ? "Finding you…" : "Use my location"}
            </Button>
            <Button variant={value === ANYWHERE ? "secondary" : "outline"} className="h-11 justify-start" onClick={() => choose(ANYWHERE)}>
              <Globe2 />
              Anywhere
            </Button>
          </div>
          {!search && !!results.length && <p className="eyebrow mb-1 mt-4 shrink-0">Recent places</p>}
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {results.map((c) => (
              <Button variant="ghost" className="h-12 w-full justify-start" key={c} onClick={() => choose(c)}>
                <MapPin />
                {c}
              </Button>
            ))}
            {search && !results.length && (
              <Button variant="outline" className="my-3 h-12 w-full" onClick={() => choose(search.trim())}>
                Use {search.trim()}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
