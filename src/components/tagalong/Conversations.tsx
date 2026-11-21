import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { VerifiedBadge } from "./bits";
export function Conversations() {
  const { user } = useMyProfile();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("direct_messages")
        .select(
          "*,sender:profiles!direct_messages_sender_id_fkey(id,name,verified),recipient:profiles!direct_messages_recipient_id_fkey(id,name,verified)",
        )
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const seen = new Set<string>();
      return (data ?? []).flatMap((m) => {
        const person = m.sender_id === user.id ? m.recipient : m.sender;
        if (!person || seen.has(person.id)) return [];
        seen.add(person.id);
        return [{ person, body: m.body, id: m.id }];
      });
    },
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`inbox-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["conversations"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-2xl">Messages</h2>
      {!q.data?.length ? (
        <p className="border-y border-border py-4 text-sm text-muted-foreground">
          No conversations yet. Say hi to someone with shared interests.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {q.data.map((m) => (
            <Link
              key={m.id}
              to="/chat/$userId"
              params={{ userId: m.person.id }}
              className="block py-4"
            >
              <div className="flex gap-3">
                <h3 className="text-xl">{m.person.name}</h3>
                <VerifiedBadge verified={m.person.verified} />
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{m.body}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
