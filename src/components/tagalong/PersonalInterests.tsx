import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/tagalong/Choice";
import { InterestSearch } from "@/components/tagalong/InterestSearch";
import { useInterestPhoto } from "@/hooks/use-photos";
import { activityLabel, genreClass, genreOf, imageFor } from "@/lib/catalog";
import { addInterest, MAX_INTERESTS, moveInterest } from "@/lib/interests";

function Row({ interest, index, total, level, onLevel, onMove, onRemove, onDragStart, onDrop }: { interest: string; index: number; total: number; level?: string | undefined; onLevel?: ((l: string) => void) | undefined; onMove: (to: number) => void; onRemove: () => void; onDragStart: () => void; onDrop: () => void }) {
  const photo = useInterestPhoto(interest);
  return (
    <li draggable onDragStart={onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className={`flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-2 ${genreClass(genreOf(interest))}`}>
      <img src={photo ?? imageFor(interest)} alt="" className="h-12 w-14 shrink-0 cursor-grab rounded-md object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${interest === "ai" ? "" : "capitalize"}`}>{activityLabel(interest)}</p>
        {onLevel && <div className="mt-1 max-w-44"><Choice label="Any level" value={level ?? "any"} onChange={onLevel} options={["any", "beginner", "intermediate", "advanced"]} /></div>}
      </div>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${interest} up`} disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${interest} down`} disabled={index === total - 1} onClick={() => onMove(index + 1)}><ArrowDown /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remove ${interest}`} onClick={onRemove}><X /></Button>
    </li>
  );
}

/** Ordered personal interests (max 30): add from search or free text, reorder, remove, optional level. */
export function PersonalInterests({ interests, onChange, levels, onLevel }: { interests: string[]; onChange: (v: string[]) => void; levels?: Record<string, string>; onLevel?: (interest: string, level: string) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <InterestSearch exclude={interests} disabled={interests.length >= MAX_INTERESTS} onAdd={(v) => { const next = addInterest(interests, v); if (!next) toast.error(`Up to ${MAX_INTERESTS} interests.`); else onChange(next); }} />
      <p className="text-xs text-muted-foreground">{interests.length} of {MAX_INTERESTS} · New interests appear for everyone once 3 people add them.</p>
      {interests.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {interests.map((i, idx) => (
            <Row key={i} interest={i} index={idx} total={interests.length} level={levels?.[i]} onLevel={onLevel ? (l) => onLevel(i, l) : undefined} onMove={(to) => onChange(moveInterest(interests, idx, to))} onRemove={() => onChange(interests.filter((x) => x !== i))} onDragStart={() => setDrag(idx)} onDrop={() => { if (drag !== null) onChange(moveInterest(interests, drag, idx)); setDrag(null); }} />
          ))}
        </ul>
      )}
    </div>
  );
}
