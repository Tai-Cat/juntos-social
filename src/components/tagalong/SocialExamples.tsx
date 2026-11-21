import {photoOr,isRealPhoto} from "@/lib/placeholder";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExampleTag } from "./bits";
export function SocialExamples({kind}:{kind:"friend"|"request"|"invite"|"nudge"|"message"}) {
 const [response,setResponse]=useState<Record<string,string>>({});
 const q=useQuery({queryKey:["social-examples",kind],queryFn:async()=>{const {data,error}=await supabase.from("social_examples").select("*").eq("kind",kind);if(error)throw error;return data;}});
 return <div className="mt-5 grid gap-3 sm:grid-cols-2">{q.data?.map(e=><article key={e.id} className="overflow-hidden rounded-lg border border-border bg-card">{isRealPhoto(e.photo)&&e.photo&&<img src={e.photo} alt={e.title} className="aspect-[16/10] max-h-[26dvh] w-full object-cover"/>}<div className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-sunflower font-bold">{e.name.charAt(0)}</span><span className="font-bold">{e.name}</span><ExampleTag/></div><h3 className="mt-3 text-xl">{kind==="friend"?e.name:e.title}</h3><p className="mt-2 text-sm text-muted-foreground">{e.body}</p>{e.plan_id&&kind==="friend"&&<Link to="/plans/$planId" params={{planId:e.plan_id}} className="mt-3 block text-xs font-bold text-tangerine">What {e.name} is doing →</Link>}{["request","invite","nudge"].includes(kind)&&<div className="mt-4 flex flex-wrap gap-2">{(kind==="invite"?["Going","Maybe","Can't go"]:kind==="request"?["Accept","Decline"]:["This week","Next week","Not now"]).map(label=><Button key={label} variant="outline" size="sm" onClick={()=>setResponse(r=>({...r,[e.id]:label}))}>{label}</Button>)}</div>}{response[e.id]&&<p className="mt-3 text-xs text-tangerine">Example response: {response[e.id]}</p>}</div></article>)}</div>;
}