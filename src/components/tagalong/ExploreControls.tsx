import { canSaveAlert } from "@/lib/membership";
import { useState } from "react";
import { Bell, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PlusCard } from "./PlusCard";
import { GENRES,activityLabel,normalizeActivity } from "@/lib/catalog";
import { AGE_BRACKETS } from "@/lib/age";
import { useOrganisations } from "@/hooks/use-organisations";
import { AUDIENCE_LABEL } from "@/lib/tagalong";
import type { ExploreFilters } from "@/lib/explore-filters";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useActivities } from "@/hooks/use-activities";
import { useAuthAction } from "./AuthSheet";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
type Key = Exclude<keyof ExploreFilters, "city" | "timezone">;
const CHIPS: { key: Key; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "price", label: "Price" },
  { key: "audience", label: "Audience" },
  { key: "genre", label: "Genre" },
  { key: "activity", label: "Activity" },
  { key: "level", label: "Level" },
  { key: "allAbilities", label: "All abilities" },
  { key: "stepFree", label: "Step-free" },
  { key: "daytime", label: "Daytime" },
  { key: "age", label: "Age" },
  { key: "organisation", label: "Organisation" },
];
const PRICES = [
  { value: "free", label: "Free" },
  { value: "under10", label: "Under €10" },
  { value: "10to30", label: "€10–30" },
  { value: "30to60", label: "€30–60" },
  { value: "60plus", label: "€60+" },
];
export function ExploreControls({
  filters: f,
  onChange,
  plus,
}: {
  filters: ExploreFilters;
  onChange: (v: ExploreFilters) => void;
  plus: boolean;
}) {
  const [sheet, setSheet] = useState<Key | "save" | null>(null),
    [draft, setDraft] = useState<string | boolean>(""),
    [search, setSearch] = useState(""),
    [name, setName] = useState("");
  const { user } = useSession();
  const auth = useAuthAction();
  const qc = useQueryClient();
  const activities = useActivities();
  const orgs=useOrganisations();
  const options =
    sheet === "age" ? AGE_BRACKETS : sheet === "organisation" ? (orgs.data??[]).map(o=>({value:o.id,label:o.name})) : sheet === "price"
      ? PRICES
      : sheet === "audience"
        ? Object.entries(AUDIENCE_LABEL).map(([value, label]) => ({ value, label }))
        : sheet === "genre"
          ? GENRES.map((g) => ({ value: g.id, label: g.label }))
          : sheet === "activity"
            ? activities
                .filter((a) => a.includes(normalizeActivity(search)))
                .map((a) => ({ value: a, label: activityLabel(a) }))
            : sheet === "time"
              ? ["morning", "afternoon", "evening", "late"].map((value) => ({
                  value,
                  label: value,
                }))
              : sheet === "level"
                ? ["beginner", "intermediate", "advanced"].map((value) => ({ value, label: value }))
                : [
                    { value: "true", label: CHIPS.find((c) => c.key === sheet)?.label ?? "On" },
                    { value: "false", label: "Off" },
                  ];
  const labelFor = (key: Key) => {
    const value = f[key];
    return key === "genre"
      ? GENRES.find((g) => g.id === value)?.label
      : key === "audience"
        ? AUDIENCE_LABEL[String(value)]
        : key === "price"
          ? PRICES.find((p) => p.value === value)?.label
          : typeof value === "boolean"
            ? ""
            : key==="age" ? AGE_BRACKETS.find(b=>b.value===value)?.label : key==="organisation" ? orgs.data?.find(o=>o.id===value)?.name : activityLabel(String(value??""));
  };
  async function saveAlert() {
    if (!user || !name.trim()) return;
    const { count } = await supabase.from("saved_alerts").select("id",{head:true,count:"exact"}).eq("user_id",user.id);
    if (!canSaveAlert(plus,count??0)) { toast.error("Free includes 2 saved alerts. Plus includes unlimited alerts."); return; }
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
    setSheet(null);
    toast.success("Alert saved");
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }
  return (
    <section className="my-5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-2" aria-label="Plan filters">
          {CHIPS.map(({ key, label }) => (
            <Button
              key={key}
              variant={f[key] ? "secondary" : "outline"}
              className={`shrink-0 rounded-full ${f[key] ? "bg-sunflower border-sunflower" : ""}`}
              onClick={() => {
                setDraft(f[key]??"");
                setSearch("");
                setSheet(key);
              }}
            >
              {key === "level" && !plus && <Lock className="h-3 w-3" />}
              {label}
              {f[key] && typeof f[key] !== "boolean" && (
                <span className={key === "genre" ? "genre-label max-w-32 truncate" : "max-w-32 truncate capitalize"}>· {labelFor(key)}</span>
              )}
              {typeof f[key] === "boolean" && f[key] && <Check />}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Save alert"
          title="Save alert"
          className="shrink-0 self-start"
          onClick={() => user ?
            auth(() => {
              setName([f.activity || "Plans", f.time, f.city].filter(Boolean).join(" · "));
              setSheet("save");
            }, "save an alert") : auth(async account=>{
              const {error}=await supabase.from("saved_alerts").insert({user_id:account.id,name:[f.activity||"Plans",f.time,f.city].filter(Boolean).join(" · "),filters:{...f,level:plus?f.level:""}});
              if(error)toast.error(error.message);else toast.success("Alert saved");
            },"save an alert",{kind:"alert",name:[f.activity||"Plans",f.time,f.city].filter(Boolean).join(" · "),filters:{...f,level:plus?f.level:""}})
          }
        >
          <Bell />
        </Button>
      </div>
      <Drawer
        open={sheet !== null}
        onOpenChange={(v) => {
          if (!v) setSheet(null);
        }}
        shouldScaleBackground={false}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-xl p-5">
            <DrawerHeader>
              <DrawerTitle>
                {sheet === "save" ? "Save a plan alert" : CHIPS.find((c) => c.key === sheet)?.label}
              </DrawerTitle>
            </DrawerHeader>
            {sheet === "save" ? (
              <div className="space-y-4">
                <Input
                  aria-label="Alert name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {plus ? "Unlimited alerts with Plus" : "Free includes 2 saved alerts"}
                </p>
                <Button className="w-full" onClick={saveAlert} disabled={!name.trim()}>
                  <Bell />
                  Save alert
                </Button>
              </div>
            ) : sheet === "level" && !plus ? (
              <PlusCard />
            ) : (
              <>
                <div className="max-h-[48dvh] overflow-y-auto">
                  {sheet === "date" ? (
                    <Input
                      aria-label="Filter date"
                      type="date"
                      className="h-12"
                      value={String(draft)}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  ) : (
                    <>
                      {sheet === "activity" && (
                        <Input
                          aria-label="Search activities"
                          placeholder="Search activities"
                          className="mb-3 h-12"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      )}
                      <div className="space-y-1">
                        {options.map((o) => (
                          <Button
                            key={o.value}
                            variant={String(draft) === o.value ? "secondary" : "ghost"}
                            className={`h-12 w-full justify-between ${sheet === "genre" ? "genre-label" : o.value==="ai"?"":"capitalize"}`}
                            onClick={() =>
                              setDraft(
                                ["allAbilities", "stepFree", "daytime"].includes(sheet ?? "")
                                  ? o.value === "true"
                                  : o.value,
                              )
                            }
                          >
                            {o.label}
                            {String(draft) === o.value && <Check />}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDraft(typeof draft === "boolean" ? false : "")}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="accent"
                    onClick={() => {
                      if (!sheet) return;
                      onChange({
                        ...f,
                        [sheet]: draft,
                        ...(sheet === "genre" ? { activity: "" } : {}),
                      });
                      setSheet(null);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
