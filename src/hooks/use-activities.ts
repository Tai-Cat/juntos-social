import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITIES, normalizeActivity } from "@/lib/catalog";
export function useActivities() {
  const q = useQuery({ queryKey: ["activities"], queryFn: async () => {
    const { data, error } = await supabase.from("activities").select("name");
    if (error) throw error;
    return data.map(a => a.name);
  }});
  return [...new Set([...ACTIVITIES, ...(q.data ?? []).map(normalizeActivity)].map(normalizeActivity).filter(Boolean))].sort((a,b) => a.localeCompare(b));
}