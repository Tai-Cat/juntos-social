import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { AppShell } from "@/components/tagalong/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/tagalong/bits";
import { SafetyMenu } from "@/components/tagalong/SafetyMenu";
import { toast } from "sonner";
export const Route = createFileRoute("/_authenticated/chat/$userId")({
  head: () => ({
    meta: [
      { title: "Your conversation — Tagalong" },
      { name: "description", content: "Talk privately about plans, shared interests and trips." },
      { property: "og:title", content: "Your conversation — Tagalong" },
      {
        property: "og:description",
        content: "Talk privately about plans, shared interests and trips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Chat,
});
function Chat() {
  const { userId } = Route.useParams();
  const { user } = useMyProfile();
  const qc = useQueryClient();
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false);
  const person = useQuery({
    queryKey: ["person", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data;
    },
  });
  const blocked = useQuery({
    queryKey: ["blocks", "conversation", user?.id, userId],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return true;
      const { data, error } = await supabase.rpc("people_blocked", { a: user.id, b: userId });
      if (error) throw error;
      return data;
    },
  });
  const messages = useQuery({
    queryKey: ["direct", user?.id, userId],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`,
        )
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["direct"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    };
    const ch = supabase
      .channel(`dm-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || blocked.data) return;
    setSending(true);
    const { error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: user.id, recipient_id: userId, body: text.trim() });
    setSending(false);
    if (error) {
      toast.error("Message could not be sent. This conversation may be blocked.");
      return;
    }
    setText("");
    await qc.invalidateQueries({ queryKey: ["direct"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }
  return (
    <AppShell title="Messages">
      <div className="mx-auto max-w-2xl">
        <Link to="/inbox" className="inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Inbox
        </Link>
        <header className="my-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl">{person.data?.name || "Conversation"}</h1>
            <div className="mt-2 flex gap-3">
              <VerifiedBadge verified={person.data?.verified ?? false} />
              <span className="text-xs text-muted-foreground">
                {person.data?.reliability_score ?? 100}% reliable
              </span>
            </div>
          </div>
          <SafetyMenu userId={userId} label={person.data?.name || "this person"} />
        </header>
        <div className="min-h-80 space-y-3 py-3" aria-live="polite">
          {blocked.data ? (
            <p className="text-center text-muted-foreground">This conversation is blocked.</p>
          ) : messages.isLoading ? (
            <p>Loading messages…</p>
          ) : messages.error ? (
            <p role="alert">Messages couldn’t load.</p>
          ) : !messages.data?.length ? (
            <p className="py-10 text-center text-muted-foreground">Start with a hello.</p>
          ) : (
            messages.data.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg p-3 ${m.sender_id === user?.id ? "genre-food ml-auto" : "genre-tech"}`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={send}
          className="sticky bottom-24 grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-background py-3"
        >
          <Input
            aria-label="Message"
            placeholder="Say hello…"
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            disabled={blocked.data === true}
          />
          <Button
            type="submit"
            variant="accent"
            size="icon"
            aria-label="Send message"
            disabled={!text.trim() || sending || blocked.data === true || userId === user?.id}
          >
            <Send />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
