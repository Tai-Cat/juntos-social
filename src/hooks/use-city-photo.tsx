import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCityPhoto } from "@/lib/image-search.functions";
import { cityImage } from "@/lib/catalog";
/** Real skyline photo for a city, with an illustrated fallback so cards are never blank. */
export function useCityPhoto(city: string | undefined) {
  const fn = useServerFn(getCityPhoto);
  const q = useQuery({ queryKey: ["city-photo", city?.toLowerCase()], enabled: !!city, staleTime: Infinity, retry: false, queryFn: async () => (city ? (await fn({ data: { city } })).photo : null) });
  return q.data ?? cityImage(city ?? "");
}
export function CityPhoto({ city, alt, className }: { city: string; alt: string; className?: string }) {
  const src = useCityPhoto(city);
  return <img src={src} alt={alt} className={className} loading="lazy" onError={(e) => { e.currentTarget.src = cityImage(city); }} />;
}
