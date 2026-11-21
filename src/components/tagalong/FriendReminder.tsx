import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Choice } from "./Choice";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
/** Private per-friend hang-again reminder preferences. */
export function FriendReminder({ friendId, name }: { friendId: string; name: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["friend-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("friend_preferences").select("*"); if (error) throw error; return data; },
  });
  const pref = q.data?.find((p) => p.friend_id === friendId);
  const [note, setNote] = useState<string | null>(null);
  async function save(patch: { frequency?: string; time_window?: string; note?: string }) {
    if (!user) return;
    const { error } = await supabase.from("friend_preferences").upsert({ user_id: user.id, friend_id: friendId, frequency: pref?.frequency ?? "default", time_window: pref?.time_window ?? "any", note: pref?.note ?? "", ...patch });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["friend-prefs"] });
  }
  return (
    <Popover>
      <PopoverTrigger asChild><Button size="icon" variant="ghost" aria-label={`Reminders for ${name}`} title="Reminders"><BellRing className={pref && pref.frequency !== "default" ? "text-tangerine" : ""} /></Button></PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <p className="font-bold">Hang out with {name}</p>
        <Choice label="How often" value={pref?.frequency ?? "default"} options={[{ value: "default", label: "Use my default" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "every_2_months", label: "Every 2 months" }, { value: "never", label: "Never" }]} onChange={(v) => save({ frequency: v })} />
        <Choice label="Best time" value={pref?.time_window ?? "any"} options={[{ value: "any", label: "Any time" }, { value: "weekday_evenings", label: "Weekday evenings" }, { value: "weekends", label: "Weekends" }, { value: "daytime", label: "Daytime" }]} onChange={(v) => save({ time_window: v })} />
        <Textarea aria-label="Private note" maxLength={300} placeholder="Private note, e.g. loves padel" value={note ?? pref?.note ?? ""} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== null && save({ note })} />
        <p className="text-xs text-muted-foreground">Only you can see this.</p>
      </PopoverContent>
    </Popover>
  );
}
