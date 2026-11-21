import { useEffect, useState } from "react";
import { MapPin, LocateFixed, Search } from "lucide-react";
import { CITIES, cityName } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
export type Position = { lat: number; lng: number };
export function LocationPicker({
  value,
  onChange,
  onPosition,
  autoLocate = true,
  compact = false,
}: {
  autoLocate?: boolean;
  compact?: boolean;
  value: string;
  onChange: (city: string) => void;
  onPosition?: (position: Position) => void;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("tagalong-places") ?? "[]"));
    } catch {}
  }, []);
  function choose(city: string) {
    onChange(cityName(city));
    setOpen(false);
    setSearch("");
    const next = [city, ...recent.filter((r) => r !== city)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("tagalong-places", JSON.stringify(next));
  }
  function locate() {
    if (!navigator.geolocation) {
      toast("Location isn't available. Choose a city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const point = { lat: p.coords.latitude, lng: p.coords.longitude };
        onPosition?.(point);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=10`,
          );
          if (!res.ok) throw new Error();
          const data = (await res.json()) as {
            address?: { city?: string; town?: string; village?: string; country?: string };
          };
          const city = data.address?.city ?? data.address?.town ?? data.address?.village;
          if (city) choose([city, data.address?.country].filter(Boolean).join(", "));
        } catch {
          toast("Couldn't find your city. Your saved city is still selected.");
        }
      },
      () => toast("Location unavailable. Your home city is selected."),
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  useEffect(() => {
    if (autoLocate) locate();
  }, []);
  const results = search
    ? CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())).slice(0, 12)
    : recent;
  return (
    <>
      <Button variant="outline" size={compact ? "sm" : "default"} aria-label={`Location: ${cityName(value || "Paris")}`} className="min-w-0 max-w-[9rem] rounded-full bg-card sm:max-w-[14rem]" onClick={() => setOpen(true)}>
        <MapPin className="text-tangerine" />
        <span className="min-w-0 truncate font-bold">{cityName(value || "Paris")}</span>
      </Button>
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-xl p-5">
            <DrawerHeader>
              <DrawerTitle>Where shall we go?</DrawerTitle>
            </DrawerHeader>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search places"
                className="h-12 pl-10"
                placeholder="Search a city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" className="my-3 h-12 w-full justify-start" onClick={locate}>
              <LocateFixed />
              Use my location
            </Button>
            {!search && <p className="eyebrow mb-2">Recent places</p>}
            <div className="max-h-[45dvh] overflow-y-auto">
              {results.map((c) => (
                <Button
                  variant="ghost"
                  className="h-12 w-full justify-start"
                  key={c}
                  onClick={() => choose(c)}
                >
                  <MapPin />
                  {c}
                </Button>
              ))}
              {search && !results.length && (
                <Button
                  variant="outline"
                  className="my-3 h-12 w-full"
                  onClick={() => choose(search)}
                >
                  Use {search}
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
