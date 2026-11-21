import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-auth";
export function useExamplesHidden() {
  return useQuery({ queryKey: ["app-config"], staleTime: 60_000, queryFn: async () => { const { data } = await supabase.from("app_config").select("hide_examples").maybeSingle(); return !!data?.hide_examples; } }).data ?? false;
}
export function useIsAppAdmin() {
  const { user } = useSession();
  return useQuery({ queryKey: ["app-admin", user?.id], enabled: !!user, queryFn: async () => { if (!user) return false; const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(); return !!data; } }).data ?? false;
}
