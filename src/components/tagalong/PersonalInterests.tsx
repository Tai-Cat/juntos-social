import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/tagalong/Choice";
import { InterestSearch } from "@/components/tagalong/InterestSearch";
import { useInterestPhoto } from "@/hooks/use-photos";
import { activityLabel, genreClass, genreOf, imageFor, GENRES } from "@/lib/catalog";
import { addInterest, INTEREST_LEVELS, normalizeInterest } from "@/lib/interests";

function Row({ interest, level, onLevel, onRemove }: { interest: string; level?: string | undefined; onLevel?: ((l: string) => void) | undefined; onRemove: () => void }) {
  const photo = useInterestPhoto(interest);
  return (
    <li className={`flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-2 ${genreClass(genreOf(interest))}`}>
      <img src={photo ?? imageFor(interest)} alt="" className="h-12 w-14 shrink-0 rounded-md object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${interest === "ai" ? "" : "capitalize"}`}>{activityLabel(interest)}</p>
        {onLevel && <div className="mt-1 max-w-44"><Choice label={`Level for ${activityLabel(interest)}`} value={level ?? "any"} onChange={onLevel} options={INTEREST_LEVELS.map((l) => ({ value: l.value, label: l.label }))} /></div>}
      </div>
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label={`Remove ${interest}`} onClick={onRemove}><X /></Button>
    </li>
  );
}

/** Personal interests: add from search or free text, remove, and (on Profile) an optional level per interest. No limit. */
export function PersonalInterests({ interests, onChange, levels, onLevel }: { interests: string[]; onChange: (v: string[]) => void; levels?: Record<string, string>; onLevel?: (interest: string, level: string) => void }) {
  const visibleInterests = [...new Set(interests.map(normalizeInterest).filter(Boolean))];
  const visibleLevels = Object.fromEntries(Object.entries(levels ?? {}).map(([key, value]) => [normalizeInterest(key), value]));
  return (
    <div className="space-y-3">
      <InterestSearch exclude={visibleInterests} onAdd={(v) => onChange(addInterest(interests, v))} />
      <p className="text-xs text-muted-foreground">{visibleInterests.length} interests · New interests appear for everyone once 3 people add them.</p>
      {visibleInterests.length > 0 && (
        <div className="space-y-2">
          {GENRES.map((genre) => {
            const items = visibleInterests.filter((interest) => genreOf(interest) === genre.id);
            if (!items.length) return null;
            return <details key={genre.id} className={`rounded-xl border border-border ${genreClass(genre.id)}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
                <span className="genre-label">{genre.label}</span><span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </summary>
              <ul className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
                {items.map((i) => <Row key={i} interest={i} level={visibleLevels[i]} onLevel={onLevel ? (l) => onLevel(i, l) : undefined} onRemove={() => onChange(visibleInterests.filter((x) => x !== i))} />)}
              </ul>
            </details>;
          })}
        </div>
      )}
    </div>
  );
}
