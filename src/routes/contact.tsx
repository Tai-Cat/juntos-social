import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/tagalong/AppShell";
import { TextPage } from "@/components/tagalong/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Juntos" },
      { name: "description", content: "Questions, feedback or an account deletion request? Send the Juntos team a message." },
      { property: "og:title", content: "Contact Juntos" },
      { property: "og:description", content: "Questions, feedback or an account deletion request? Send the Juntos team a message." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("submit_contact", { _name: name, _email: email || user?.email || "", _message: message });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };
  return (
    <AppShell>
      <TextPage eyebrow="Contact" title="Get in touch">
        {sent ? (
          <p className="rounded-lg border border-border bg-card p-4">Thanks, your message was sent. We'll reply by email.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input required aria-label="Your name" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            <Input required type="email" aria-label="Your email" placeholder={user?.email ?? "Your email"} autoComplete="email" value={email || ""} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            <Textarea required aria-label="Message" placeholder="Your message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
            <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
          </form>
        )}
      </TextPage>
    </AppShell>
  );
}
