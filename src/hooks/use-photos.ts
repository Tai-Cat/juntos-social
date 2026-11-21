import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ensureInterestPhoto } from "@/lib/image-search.functions";
import { useSession } from "./use-auth";

export function usePhotoCredits(urls: string[]) {
  const stock = urls.filter((u) => u.startsWith("https://images."));
  return useQuery({ queryKey: ["photo-credits", stock], enabled: stock.length > 0, staleTime: Infinity, queryFn: async () => {
    const { data, error } = await supabase.from("photo_credits").select("photo,provider,photographer,photographer_url,source_url").in("photo", stock);
    if (error) throw error;
    return data;
  } }).data ?? [];
}

export function useInterestPhoto(interest: string) {
  const { user } = useSession();
  const ensure = useServerFn(ensureInterestPhoto);
  return useQuery({ queryKey: ["interest-photo", interest], staleTime: Infinity, retry: false, queryFn: async () => {
    const { data } = await supabase.from("photo_credits").select("photo").eq("interest", interest).maybeSingle();
    if (data) return data.photo;
    return user ? (await ensure({ data: { interest } })).photo : null;
  } }).data ?? null;
}
