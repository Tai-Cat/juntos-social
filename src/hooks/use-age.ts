import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "./use-auth";
export function useAge(){
 const {user}=useSession();
 return useQuery({queryKey:["private-age",user?.id],enabled:!!user,queryFn:async()=>{if(!user)return null;const {data,error}=await supabase.from("profile_private").select("date_of_birth,age_verified,meet_age_min,meet_age_max").eq("user_id",user.id).maybeSingle();if(error)throw error;return data;}});
}