import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/tagalong/Choice";
import { InterestSearch } from "@/components/tagalong/InterestSearch";
import { useInterestPhoto } from "@/hooks/use-photos";
import { activityLabel, genreClass, genreOf, imageFor } from "@/lib/catalog";
import { addInterest, INTEREST_LEVELS } from "@/lib/interests";

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
  return (
    <div className="space-y-3">
      <InterestSearch exclude={interests} onAdd={(v) => onChange(addInterest(interests, v))} />
      <p className="text-xs text-muted-foreground">{interests.length} interests · New interests appear for everyone once 3 people add them.</p>
      {interests.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {interests.map((i) => (
            <Row key={i} interest={i} level={levels?.[i]} onLevel={onLevel ? (l) => onLevel(i, l) : undefined} onRemove={() => onChange(interests.filter((x) => x !== i))} />
          ))}
        </ul>
      )}
    </div>
  );
}
