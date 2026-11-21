import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { errMsg } from "@/lib/tagalong";

export function SafetyMenu({
  userId,
  planId,
  label = "this",
}: {
  userId?: string | null;
  planId?: string;
  label?: string;
}) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function report() {
    if (!user) return;
    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_user_id: userId ?? null,
        target_plan_id: planId ?? null,
        reason,
      });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Thanks. Our team will review this.");
    setOpen(false);
    setReason("");
  }
  async function block() {
    if (!user || !userId) {
      toast("Example profiles can't be blocked");
      return;
    }
    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: user.id, blocked_id: userId });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    qc.invalidateQueries({ queryKey: ["blocks"] });
    qc.invalidateQueries({ queryKey: ["direct"] });
    qc.invalidateQueries({ queryKey: ["similar"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["trips"] });
    toast.success("Blocked. You won't see their plans.");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Safety options for ${label}`}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>Report</DropdownMenuItem>
          <DropdownMenuItem onClick={block}>Block</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Report {label}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="What happened?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={report} disabled={!reason.trim()}>
            Send report
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
