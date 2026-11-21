import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "./use-auth";
export function useOrganisations(){const {user}=useSession();return useQuery({queryKey:["organisations",user?.id],queryFn:async()=>{const {data,error}=await supabase.from("organisations").select("*").order("name");if(error)throw error;return data;}});}
export function useOrgMemberships(){const {user}=useSession();return useQuery({queryKey:["org-memberships",user?.id],enabled:!!user,queryFn:async()=>{if(!user)return [];const {data,error}=await supabase.from("organisation_members").select("*").eq("user_id",user.id);if(error)throw error;return data;}});}