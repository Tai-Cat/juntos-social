import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MAX_PLAN_PHOTOS = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
async function hash(f: File) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await f.arrayBuffer()))).join(""); }

/** First photo is the cover. Drag (or use the arrows) to reorder. */
export function PhotoUploader({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => { if (to < 0 || to >= files.length) return; const next = [...files]; const [f] = next.splice(from, 1); if (f) next.splice(to, 0, f); onChange(next); };
  async function add(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (picked.some((f) => !TYPES.includes(f.type) || f.size > 8 * 1024 * 1024)) { toast.error("Use JPG, PNG or WebP photos under 8 MB each."); return; }
    const all = [...files, ...picked];
    if (all.length > MAX_PLAN_PHOTOS) { toast.error(`Up to ${MAX_PLAN_PHOTOS} photos per plan.`); return; }
    const hashes = await Promise.all(all.map(hash));
    if (new Set(hashes).size !== all.length) { toast.error("Each photo needs to be different."); return; }
    onChange(all);
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="event-photos">Your photos (optional, up to {MAX_PLAN_PHOTOS})</Label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {files.map((f, i) => (
          <figure key={`${f.name}-${f.size}-${f.lastModified}`} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }} className={`relative overflow-hidden rounded-lg border-2 ${i === 0 ? "border-tangerine" : "border-border"} bg-card`} aria-label={`Photo ${i + 1}${i === 0 ? ", cover" : ""}`}>
            <img src={urls[i]} alt="" className="aspect-[4/3] w-full cursor-grab object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-tangerine px-1.5 text-[10px] font-bold text-primary-foreground">Cover</span>}
            <Button type="button" size="icon" variant="outline" aria-label="Remove photo" className="absolute right-1 top-1 h-6 w-6 bg-card/90" onClick={() => onChange(files.filter((_, j) => j !== i))}><X /></Button>
            <div className="flex justify-between bg-card p-1">
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Move earlier" onClick={() => move(i, i - 1)}><ArrowLeft /></Button>
              {i !== 0 && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Make cover" onClick={() => move(i, 0)}><Star /></Button>}
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Move later" onClick={() => move(i, i + 1)}><ArrowRight /></Button>
            </div>
          </figure>
        ))}
      </div>
      {files.length < MAX_PLAN_PHOTOS && <Input id="event-photos" type="file" accept={TYPES.join(",")} multiple onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />}
      <p className="text-xs text-muted-foreground">{files.length ? "Drag to reorder. The first photo is the cover." : "No photos? We'll add credited photos from Unsplash or Pexels."}</p>
    </div>
  );
}
