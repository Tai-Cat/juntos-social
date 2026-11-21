import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
export function AlertsInbox() {
  const { user } = useMyProfile();
  const qc = useQueryClient();
  const alerts = useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function remove(id: string) {
    const { error } = await supabase.from("saved_alerts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-2xl">Your plan alerts</h2>
      {!alerts.data?.length ? (
        <p className="text-sm text-muted-foreground">
          Save a filter combination in Explore to get matching plans here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {alerts.data.map((a) => (
            <span
              key={a.id}
              className="genre-ideas flex items-center gap-2 rounded-lg px-3 py-1 text-xs"
            >
              <Bell className="h-3 w-3" />
              {a.name}
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete alert ${a.name}`}
                onClick={() => remove(a.id)}
              >
                <Trash2 />
              </Button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
