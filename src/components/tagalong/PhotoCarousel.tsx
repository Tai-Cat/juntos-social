import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGallery } from "@/hooks/use-gallery";
import { usePhotoCredits } from "@/hooks/use-photos";
import { placeholderImage } from "@/lib/placeholder";
export function PhotoCarousel({ photos:source, label,planId,genre="outdoors",credits=false,example=false }: { photos: string[]; label: string;planId?:string;genre?:string;credits?:boolean;example?:boolean }) {
  const gallery=useGallery(planId,source);
  const photos=gallery.length?gallery:[placeholderImage(genre)];
  const creditRows=usePhotoCredits(credits?photos:[]);
  const uploads=source.filter(p=>p.startsWith("storage:")).length>0;
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
      {credits && (()=>{const url=photos[index]??"";const c=creditRows.find(r=>r.photo===url);return <p className="absolute bottom-0 right-0 max-w-full truncate rounded-tl-md bg-card/90 px-2 py-0.5 text-[10px] text-muted-foreground">{example&&"Example · "}{c?<>Photo by <a className="underline" href={c.photographer_url} target="_blank" rel="noreferrer">{c.photographer}</a> on <a className="underline" href={c.source_url} target="_blank" rel="noreferrer">{c.provider==="unsplash"?"Unsplash":"Pexels"}</a></>:url.startsWith("data:")?"Photo coming soon":uploads?"Photo uploaded by the host":"Photo"}</p>;})()}
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
