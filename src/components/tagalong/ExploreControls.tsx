import { useState } from "react";
import { Bell, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Choice } from "./Choice";
import { PlusCard } from "./PlusCard";
import { ACTIVITIES, GENRES } from "@/lib/catalog";
import { AUDIENCE_LABEL } from "@/lib/tagalong";
import type { ExploreFilters } from "@/lib/explore-filters";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
export function ExploreControls({
  filters: f,
  onChange,
  plus,
}: {
  filters: ExploreFilters;
  onChange: (v: ExploreFilters) => void;
  plus: boolean;
}) {
  const [gate, setGate] = useState(false),
    [save, setSave] = useState(false),
    [name, setName] = useState("");
  const { user } = useSession();
  const qc = useQueryClient();
  const change = (key: keyof ExploreFilters, value: string | boolean) =>
    onChange({ ...f, [key]: value });
  async function saveAlert() {
    if (!user || !name.trim()) return;
    const { error } = await supabase
      .from("saved_alerts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        filters: { ...f, level: plus ? f.level : "" },
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSave(false);
    toast.success("Alert saved");
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }
  const active = Object.entries(f).filter(
    ([k, v]) => !["city", "timezone"].includes(k) && v !== "" && v !== false,
  );
  const labels: Record<string, string> = {
    allAbilities: "All abilities welcome",
    stepFree: "Step-free",
    daytime: "Daytime",
    under10: "Under €10",
    "10to30": "€10–30",
    "30to60": "€30–60",
    "60plus": "€60+",
    ...AUDIENCE_LABEL,
    ...Object.fromEntries(GENRES.map((g) => [g.id, g.label])),
  };
  return (
    <section className="my-5 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <div className="min-w-0">
          <Label htmlFor="filter-date" className="mb-1 block text-xs">
            Date
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={f.date}
            onChange={(e) => change("date", e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Time of day</Label>
          <Choice
            label="Any time"
            value={f.time}
            onChange={(v) => change("time", v)}
            options={["morning", "afternoon", "evening", "late"]}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Price</Label>
          <Choice
            label="Any price"
            value={f.price}
            onChange={(v) => change("price", v)}
            options={[
              { value: "free", label: "Free" },
              { value: "under10", label: "Under €10" },
              { value: "10to30", label: "€10–30" },
              { value: "30to60", label: "€30–60" },
              { value: "60plus", label: "€60+" },
            ]}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Audience</Label>
          <Choice
            label="Any audience"
            value={f.audience}
            onChange={(v) => change("audience", v)}
            options={Object.entries(AUDIENCE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Genre</Label>
          <Choice
            label="All genres"
            value={f.genre}
            onChange={(v) => onChange({ ...f, genre: v, activity: "" })}
            options={GENRES.map((g) => ({ value: g.id, label: g.label }))}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Activity</Label>
          <Choice
            label="Any activity"
            value={f.activity}
            onChange={(v) => change("activity", v)}
            options={
              f.genre ? (GENRES.find((g) => g.id === f.genre)?.items.split("|") ?? []) : ACTIVITIES
            }
          />
        </div>
        <div>
          <Label className="mb-1 flex items-center gap-1 text-xs">
            Level {!plus && <Lock className="h-3 w-3" />}
          </Label>
          {plus ? (
            <Choice
              label="Any level"
              value={f.level}
              onChange={(v) => change("level", v)}
              options={["beginner", "intermediate", "advanced"]}
            />
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setGate(true)}
            >
              <Lock />
              Plus levels
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {(["allAbilities", "stepFree", "daytime"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs">
            <Switch
              aria-label={labels[key]}
              checked={f[key]}
              onCheckedChange={(v) => change(key, v)}
            />
            {labels[key]}
          </label>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setName([f.activity || "Plans", f.time, f.city].filter(Boolean).join(" · "));
            setSave(true);
          }}
        >
          <Bell />
          Save alert
        </Button>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map(([k, v]) => (
            <Button
              key={k}
              size="sm"
              variant="secondary"
              className="capitalize"
              onClick={() => change(k as keyof ExploreFilters, typeof v === "boolean" ? false : "")}
            >
              {labels[String(v)] ?? labels[k] ?? String(v)}
              <X className="h-3 w-3" />
            </Button>
          ))}
        </div>
      )}
      <Dialog open={gate} onOpenChange={setGate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find your level</DialogTitle>
          </DialogHeader>
          <PlusCard />
        </DialogContent>
      </Dialog>
      <Dialog open={save} onOpenChange={setSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save a plan alert</DialogTitle>
          </DialogHeader>
          <Label htmlFor="alert-name">Alert name</Label>
          <Input id="alert-name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={saveAlert} disabled={!name.trim()}>
            <Bell />
            Save alert
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
