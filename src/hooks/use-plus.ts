import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-auth";
import { toast } from "sonner";
export function usePlus() {
  const { user } = useSession();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  async function setPlus(v: boolean) {
    if (!user) return;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, demo_plus: v });
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["settings"] });
  }
  return { plus: q.data?.demo_plus ?? false, setPlus, loading: q.isLoading };
}
