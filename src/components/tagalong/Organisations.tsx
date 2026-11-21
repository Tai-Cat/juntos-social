import {useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Link} from "@tanstack/react-router";
import {BadgeCheck,Building2,Check,Lock,Plus} from "lucide-react";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "@/hooks/use-auth";
import {useOrganisations,useOrgMemberships} from "@/hooks/use-organisations";
import {useAuthAction} from "./AuthSheet";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {toast} from "sonner";
import {aiImage} from "@/lib/placeholder";
import {useExamplesHidden} from "@/hooks/use-app-config";
import type {Database} from "@/integrations/supabase/types";
type Org=Database["public"]["Tables"]["organisations"]["Row"];
export function OrganisationLogo({org}:{org:Org}){return <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-grass-soft font-display text-xl font-bold text-grass">{org.logo_url?<img src={org.logo_url} alt={`${org.name} logo`} className="h-full w-full object-contain"/>:org.name==="INSEAD"?"IN":<img src={orgCover(org)} alt="" className="h-full w-full object-cover" loading="lazy"/>}</span>;}
/** Organisation-level badge, distinct from the personal Verified tick. */
export function OfficialBadge({org}:{org:Org}){return org.is_official?<span title="Official organisation" className="inline-flex items-center gap-0.5 rounded-full border border-sky px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-sky"><BadgeCheck className="h-3 w-3"/>Official</span>:null;}
export function FollowOrganisation({org}:{org:Org}){
 const {user}=useSession(),auth=useAuthAction(),qc=useQueryClient();
 const q=useQuery({queryKey:["org-follow",org.id,user?.id],enabled:!!user,queryFn:async()=>{if(!user)return false;return !!(await supabase.from("organisation_follows").select("organisation_id").eq("organisation_id",org.id).eq("user_id",user.id).maybeSingle()).data;}});
 return <Button size="sm" variant={q.data?"secondary":"outline"} onClick={()=>auth(async account=>{const r=q.data?await supabase.from("organisation_follows").delete().eq("organisation_id",org.id).eq("user_id",account.id):await supabase.from("organisation_follows").insert({organisation_id:org.id,user_id:account.id});if(r.error)toast.error(r.error.message);else qc.invalidateQueries({queryKey:["org-follow",org.id]});},"follow this organisation")}>{q.data?<Check/>:<Plus/>}{q.data?"Following":"Follow"}</Button>;
}
export const orgCover=(org:Org)=>org.cover_url||aiImage("org",org.slug);
const KIND_LABEL:Record<string,string>={business:"Business",institution:"Institution",community:"Community"};
function DirectoryCard({org}:{org:Org}){return <article className="flex flex-wrap items-center gap-3 border-b border-border py-4"><OrganisationLogo org={org}/><div className="min-w-0 flex-1"><Link className="font-bold" to="/organisations/$slug" params={{slug:org.slug}}>{org.name}</Link> <OfficialBadge org={org}/><p className="mt-1 text-xs text-muted-foreground">{KIND_LABEL[org.kind]}{org.official_status==="pending"?" · Pending":""} · {org.visibility==="open"?"Open":org.visibility==="private"?"Invite only":"Members only"}{org.is_example?" · Example":""}</p></div><FollowOrganisation org={org}/></article>;}
/** Top-level organisations only (sub-groups live on their parent's page); official first, then organisations, then communities. Examples fill gaps. */
export function OrganisationDirectory({title="Browse by organisation"}:{title?:string}){
 const orgs=useOrganisations(),hidden=useExamplesHidden();
 const top=(orgs.data??[]).filter(o=>!o.parent_id&&!o.archived);
 const real=top.filter(o=>!o.is_example);
 const list=hidden||real.length>=6?real:[...real,...top.filter(o=>o.is_example).slice(0,6-real.length)];
 const orgsList=list.filter(o=>o.kind!=="community").sort((a,b)=>Number(b.is_official)-Number(a.is_official)||Number(a.is_example)-Number(b.is_example));
 const communities=list.filter(o=>o.kind==="community").sort((a,b)=>Number(b.is_official)-Number(a.is_official)||Number(a.is_example)-Number(b.is_example));
 return <section className="mt-8 border-t border-border pt-6"><h2 className="text-2xl">{title}</h2><div className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">{orgsList.map(org=><DirectoryCard key={org.id} org={org}/>)}</div>{communities.length>0&&<><h3 className="mt-6 text-lg">Communities</h3><div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">{communities.map(org=><DirectoryCard key={org.id} org={org}/>)}</div></>}</section>;
}
export function OrganisationAccess({org}:{org:Org}){
 const memberships=useOrgMemberships(),{user}=useSession(),auth=useAuthAction(),qc=useQueryClient();
 const [answer,setAnswer]=useState(""),[email,setEmail]=useState(""),[code,setCode]=useState(""),[demoCode,setDemoCode]=useState(""),[busy,setBusy]=useState(false);
 const req=useQuery({queryKey:["org-request",org.id,user?.id],enabled:!!user,queryFn:async()=>{if(!user)return null;return (await supabase.from("organisation_requests").select("status").eq("organisation_id",org.id).eq("user_id",user.id).maybeSingle()).data;}});
 if(org.visibility==="open" || memberships.data?.some(m=>m.organisation_id===org.id))return null;
 async function request(){setBusy(true);const {data,error}=await supabase.rpc("request_org_access",{_org:org.id,_answer:answer});setBusy(false);if(error)toast.error(error.message);else {toast.success(data==="approved"?"Access approved":"Request sent to the organisation admin");await qc.invalidateQueries();}}
 return <section className="my-6 border-y border-border py-6"><h2 className="flex items-center gap-2 text-2xl"><Lock className="h-5 w-5"/>Members only</h2><p className="my-3 text-sm text-muted-foreground">Join {org.name} to see full event details.</p><div className="grid gap-6 sm:grid-cols-2"><div className="space-y-3"><Label htmlFor={`question-${org.id}`}>{org.question}</Label><Input id={`question-${org.id}`} value={answer} maxLength={2000} onChange={e=>setAnswer(e.target.value)}/>{req.data&&<p className="text-sm text-muted-foreground">Request: {req.data.status}</p>}<Button disabled={!answer.trim()||busy} onClick={()=>auth(()=>void request(),"request organisation access")}>Request access</Button></div>{org.allowed_domains.length>0&&<div className="space-y-3"><p className="text-sm font-bold">Verify organisation email · Demo</p><p className="text-xs text-muted-foreground">Allowed: {org.allowed_domains.join(", ")}. Demo codes appear here; no email is sent.</p><Input aria-label="Organisation email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/><Button variant="outline" onClick={()=>auth(async()=>{const {data,error}=await supabase.rpc("start_org_email_demo",{_org:org.id,_email:email});if(error)toast.error(error.message);else setDemoCode(data);},"verify your organisation email")}>Get demo code</Button>{demoCode&&<><p className="text-sm">Demo code: <strong>{demoCode}</strong></p><Input aria-label="Confirmation code" value={code} onChange={e=>setCode(e.target.value)} maxLength={6}/><Button onClick={async()=>{const {data,error}=await supabase.rpc("confirm_org_email_demo",{_org:org.id,_code:code});if(error||!data)toast.error("Code incorrect or expired");else {toast.success("Demo email verified — access approved");await qc.invalidateQueries();}}}>Confirm code</Button></>}</div>}</div></section>;
}