import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
export function ProfileShare() {
  const { user } = useSession(),
    qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["profile-share", user?.id],
    enabled: open && !!user,
    queryFn: async () => {
      if (!user) return null;
      let { data } = await supabase
        .from("profile_shares")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) {
        const r = await supabase
          .from("profile_shares")
          .insert({ user_id: user.id })
          .select("*")
          .single();
        if (r.error) throw r.error;
        data = r.data;
      }
      return data;
    },
  });
  async function update(values: { audience?: string; enabled?: boolean }) {
    if (!user) return;
    const { error } = await supabase.from("profile_shares").update(values).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["profile-share"] });
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2 />
        Share my plans
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share my plans</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Only your upcoming public plans. Private plans and exact addresses are never shared.
          </p>
          <div className="flex items-center justify-between">
            <span>Anyone with the link</span>
            <Switch
              aria-label="Anyone with the link"
              checked={q.data?.audience === "link"}
              onCheckedChange={(v) => update({ audience: v ? "link" : "friends" })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {q.data?.audience === "link"
              ? "Anyone with this private link can view your plans."
              : "Only signed-in friends can view your plans."}
          </p>
          <div className="flex items-center justify-between">
            <span>Link active</span>
            <Switch
              aria-label="Link active"
              checked={q.data?.enabled ?? true}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>
          <Button
            disabled={!q.data?.enabled}
            onClick={async () => {
              if (!q.data) return;
              await navigator.clipboard.writeText(
                `${window.location.origin}/shared/${q.data.token}`,
              );
              toast.success("Private link copied");
            }}
          >
            Copy private link
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
