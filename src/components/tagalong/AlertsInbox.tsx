import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
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
  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`alerts-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          toast("A new plan matches your alert");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);
  async function remove(id: string) {
    const { error } = await supabase.from("saved_alerts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function read(id: string) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) toast.error(error.message);
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
      <div className="mt-3 space-y-2">
        {q.data?.map((n) => (
          <div
            key={n.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border p-3 ${n.read ? "bg-card" : "genre-food"}`}
          >
            <div className="min-w-0">
              {n.plan_id ? (
                <Link
                  to="/plans/$planId"
                  params={{ planId: n.plan_id }}
                  className="text-sm font-semibold"
                >
                  {n.title}
                </Link>
              ) : (
                <p>{n.title}</p>
              )}
            </div>
            {!n.read && (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Mark notification read"
                onClick={() => read(n.id)}
              >
                <Check />
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
