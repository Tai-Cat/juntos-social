import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function useNotifications() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
}

/** One live subscription per signed-in session, mounted in the app shell. */
export function useNotificationFeed() {
  const { user } = useSession();
  const qc = useQueryClient();
  const q = useNotifications();
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifications-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        const title = (payload.new as { title?: string }).title;
        if (title) toast(title);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);
  return (q.data ?? []).filter((n) => !n.read).length;
}

export function NotificationsList() {
  const q = useNotifications();
  const qc = useQueryClient();
  async function read(id: string) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function readAll() {
    const ids = (q.data ?? []).filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">No notifications yet. Join requests, approvals and plan alerts show up here.</p>;
  return (
    <section>
      <div className="mb-3 flex justify-end"><Button size="sm" variant="ghost" onClick={readAll}>Mark all read</Button></div>
      <div className="space-y-2">
        {q.data.map((n) => {
          const href = n.link ?? (n.plan_id ? `/plans/${n.plan_id}` : null);
          return (
            <div key={n.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border p-3 ${n.read ? "bg-card" : "genre-social"}`}>
              <div className="min-w-0">
                {href ? <Link to={href as "/feed"} onClick={() => !n.read && read(n.id)} className="text-sm font-semibold">{n.title}</Link> : <p className="text-sm font-semibold">{n.title}</p>}
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && <Button size="icon" variant="ghost" aria-label="Mark notification read" onClick={() => read(n.id)}><Check /></Button>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
