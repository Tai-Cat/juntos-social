import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PhotoCarousel({ photos, label }: { photos: string[]; label: string }) {
  const [ref, api] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);
  const select = useCallback(() => setIndex(api?.selectedScrollSnap() ?? 0), [api]);
  useEffect(() => {
    if (!api) return;
    api.on("select", select);
    return () => {
      api.off("select", select);
    };
  }, [api, select]);
  return (
    <div className="relative" role="region" aria-label={`${label} photos`}>
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {photos.map((url, i) => (
            <div key={`${url}-${i}`} className="min-w-0 shrink-0 basis-full">
              <img
                src={url}
                alt={`${label} · photo ${i + 1}`}
                className="aspect-[16/10] max-h-[32dvh] w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 h-7 w-7 -translate-y-1/2 bg-card/90"
            onClick={() => api?.scrollPrev()}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next photo"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 bg-card/90"
            onClick={() => api?.scrollNext()}
          >
            <ChevronRight />
          </Button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <Button
                key={i}
                size="icon"
                variant="ghost"
                aria-label={`Photo ${i + 1}`}
                className={`h-2 w-2 p-0 ${i === index ? "bg-card" : "bg-card/50"}`}
                onClick={() => api?.scrollTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
