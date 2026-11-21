import {createServerFn} from "@tanstack/react-start";
import {getRequestHeader} from "@tanstack/react-start/server";
import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import type {Database} from "@/integrations/supabase/types";
export const getGallery=createServerFn({method:"POST"}).inputValidator((input:unknown)=>z.object({planId:z.string().uuid()}).parse(input)).handler(async({data})=>{
 const key=process.env["SUPABASE_PUBLISHABLE_KEY"];
 const url=process.env["SUPABASE_URL"];
 if(!key||!url)throw new Error("Photos unavailable");
 const bearer=getRequestHeader("authorization");
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{...(bearer?{headers:{Authorization:bearer}}:{}),fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith("sb_")&&headers.get("Authorization")===`Bearer ${key}`)headers.delete("Authorization");headers.set("apikey",key);return fetch(input,{...init,headers});}}});
 // The caller's RLS-visible plan is the authorization boundary, not the storage path input.
 const {data:plan,error}=await client.from("plans").select("photos,host_id").eq("id",data.planId).maybeSingle();
 if(error||!plan)return [];
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 return Promise.all(plan.photos.map(async photo=>{
 if(!photo.startsWith("storage:plan-photos/"))return photo;
 const path=photo.slice("storage:plan-photos/".length);
 if(!plan.host_id||!path.startsWith(`${plan.host_id}/`)||path.includes(".."))return "";
 const result=await supabaseAdmin.storage.from("plan-photos").createSignedUrl(path,3600);
 if(result.error)throw new Error("Photo couldn't load");
 return result.data.signedUrl;
 }));
});