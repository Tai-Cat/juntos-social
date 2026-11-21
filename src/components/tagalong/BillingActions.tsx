import { useState } from "react";
import { CircleX, ReceiptEuro } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { MANAGE_SUBSCRIPTION_LINK } from "@/lib/plus";

const REASONS = [
  "I didn't mean to subscribe",
  "I picked the wrong tier (Plus or Club)",
  "I was charged twice",
  "It's not what I expected",
  "I can't use it right now",
  "Something else",
] as const;

/**
 * Cancel and refund for members.
 * Cancel: Stripe's customer portal, which ends the membership at the end of the paid month.
 * Refund: a request with a reason. It reaches the admins' notifications and Taira decides
 * and refunds in Stripe; nothing is refunded automatically.
 */
export function BillingActions() {
  const { user, profile } = useMyProfile();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const message = `REFUND REQUEST · Reason: ${reason}${note.trim() ? ` · Note: ${note.trim()}` : ""}`;
    const { error } = await supabase.rpc("submit_contact", {
      _name: profile?.name || "Juntos member",
      _email: (email || user?.email || "").trim(),
      _message: message,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-bold">Billing</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Your membership stays active until the end of the month you've paid for, even after you cancel.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer">
            <CircleX /> Cancel subscription
          </a>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ReceiptEuro /> Request a refund
        </Button>
      </div>

      {open && !sent && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <Label htmlFor="refund-reason">Why are you asking for a refund?</Label>
            <select
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {!user?.email && (
            <div>
              <Label htmlFor="refund-email">Email you paid with</Label>
              <Input id="refund-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
          )}
          <div>
            <Label htmlFor="refund-note">Anything else? (optional)</Label>
            <Textarea id="refund-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className="mt-1" />
          </div>
          <p className="text-xs text-muted-foreground">
            We review every request and reply by email. Refunds go back to the card you paid with. Your EU right to withdraw within 14 days still applies.
          </p>
          <Button type="submit" disabled={busy} size="sm">{busy ? "Sending…" : "Send refund request"}</Button>
        </form>
      )}
      {sent && (
        <p className="mt-4 border-t border-border pt-4 text-sm">
          Thanks. Your refund request is in, and we'll reply by email.
        </p>
      )}
    </div>
  );
}
