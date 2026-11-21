import {z} from "zod";
import {supabase} from "@/integrations/supabase/client";
import {safeReturn} from "./auth-return";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("join"),planId:z.string().uuid(),buddy:z.boolean()}),
 z.object({kind:z.literal("rsvp"),token:z.string().uuid(),status:z.enum(["going","maybe","declined"])}),
 z.object({kind:z.literal("invite"),planId:z.string().uuid()}),
 z.object({kind:z.literal("alert"),name:z.string().max(200),filters:z.record(z.union([z.string(),z.boolean()]))}),
]);
export type AuthIntent=z.infer<typeof schema>;
const key="tagalong-action";
export function rememberIntent(intent:AuthIntent){localStorage.setItem(key,JSON.stringify({intent,url:window.location.pathname+window.location.search}));}
export function readIntent(){try{const saved=JSON.parse(localStorage.getItem(key)??"null") as {intent?:unknown;url?:string}|null;const parsed=schema.safeParse(saved?.intent);return parsed.success?{intent:parsed.data,url:safeReturn(saved?.url??null)}:null;}catch{return null;}}
export function clearIntent(){localStorage.removeItem(key);}
export async function completeIntent(intent:AuthIntent,userId:string){
 if(intent.kind==="join"){
 const {data}=await supabase.from("join_requests").select("id").eq("plan_id",intent.planId).eq("user_id",userId).maybeSingle();
 if(!data){const {error}=await supabase.from("join_requests").insert({user_id:userId,plan_id:intent.planId,bring_buddy:intent.buddy});if(error)throw error;}
 }else if(intent.kind==="rsvp"){const {error}=await supabase.rpc("respond_invite_link",{_token:intent.token,_status:intent.status});if(error)throw error;
 }else if(intent.kind==="alert"){
 const {data}=await supabase.from("saved_alerts").select("id").eq("user_id",userId).eq("name",intent.name).contains("filters",intent.filters).limit(1);
 if(!data?.length){const {error}=await supabase.from("saved_alerts").insert({user_id:userId,name:intent.name,filters:intent.filters});if(error)throw error;}
 }
}