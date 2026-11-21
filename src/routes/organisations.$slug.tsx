import {useState} from "react";
import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {ChevronRight} from "lucide-react";
import {toast} from "sonner";
import {AppShell} from "@/components/tagalong/AppShell";
import {OfficialBadge,OrganisationAccess,OrganisationLogo,FollowOrganisation,orgCover} from "@/components/tagalong/Organisations";
import {useOrganisations,useOrgMemberships} from "@/hooks/use-organisations";
import {EventRow,LockedEventTeaser} from "@/components/tagalong/EventViews";
import {useAuthAction} from "@/components/tagalong/AuthSheet";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "@/hooks/use-auth";
import {Button} from "@/components/ui/button";
import type {PlanWithHost} from "@/lib/tagalong";
import type {Database} from "@/integrations/supabase/types";
type Org=Database["public"]["Tables"]["organisations"]["Row"];
import {SECTION_ORDER} from "@/lib/org-sections";
export const Route=createFileRoute("/organisations/$slug")({head:()=>({meta:[{title:"Organisation events — Juntos"},{name:"description",content:"Meet through institutions, clubs and communities on Juntos."},{property:"og:title",content:"Organisation events — Juntos"},{property:"og:description",content:"Discover events from institutions, clubs and communities."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:OrganisationPage});
const isPastPlan=(p:{starts_at:string;ends_at?:string|null})=>new Date(p.ends_at??p.starts_at).getTime()<Date.now();
function OrganisationPage(){
 const {slug}=Route.useParams(),{user}=useSession(),members=useOrgMemberships(),all=useOrganisations();
 const orgQ=useQuery({queryKey:["organisation",slug,user?.id],queryFn:async()=>{const {data,error}=await supabase.from("organisations").select("*").eq("slug",slug).maybeSingle();if(error)throw error;return data;}});
 const org=orgQ.data;
 const parent=org?.parent_id?all.data?.find(o=>o.id===org.parent_id):undefined;
 const children=(all.data??[]).filter(o=>o.parent_id&&o.parent_id===org?.id&&!o.archived);
 const ids=org?[org.id,...children.map(c=>c.id)]:[];
 const events=useQuery({queryKey:["org-events",ids.join(","),user?.id],enabled:!!org,queryFn:async()=>{const {data,error}=await supabase.from("plans").select("*").in("organisation_id",ids).order("starts_at");if(error)throw error;return data as PlanWithHost[];}});
 const clubTeasers=useQuery({queryKey:["club-teasers",ids.join(","),user?.id],enabled:children.length>0,queryFn:async()=>{const rows=await Promise.all(children.map(c=>supabase.rpc("org_plan_teasers",{_org:c.id}).then(r=>r.data??[])));return rows.flat().map(r=>({id:r.id,organisation_id:r.organisation_id,starts_at:r.starts_at}));}});
 const teasers=useQuery({queryKey:["org-teasers",org?.id,user?.id],enabled:!!org,queryFn:async()=>{if(!org)return [];const {data,error}=await supabase.rpc("org_plan_teasers",{_org:org.id});if(error)throw error;return data;}});
 const access=useQuery({queryKey:["org-access",org?.id,user?.id],enabled:!!org&&!!user,queryFn:async()=>{if(!org||!user)return {member:false,admin:false,host:false};const [m,a,h]=await Promise.all([supabase.rpc("org_member",{_org:org.id,_user:user.id}),supabase.rpc("org_admin",{_org:org.id,_user:user.id}),supabase.rpc("org_host",{_org:org.id,_user:user.id})]);return {member:!!m.data,admin:!!a.data,host:!!h.data};}});
 const role=members.data?.find(m=>m.organisation_id===org?.id)?.role;
 // Club events show the club name as the host line on the parent's feed.
 const hostLine=(p:PlanWithHost)=>children.find(c=>c.id===p.organisation_id)?.name;
 const plans=(events.data??[]).map(p=>({...p,example_host_name:hostLine(p)??p.example_host_name}));
 return <AppShell title="Organisations">{!org?<p className="py-10">{orgQ.isLoading?"Loading organisation…":"This organisation is private or unavailable."}</p>:<>
  {parent&&<nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-sm text-muted-foreground"><Link className="underline" to="/organisations/$slug" params={{slug:parent.slug}}>{parent.name}</Link><ChevronRight className="h-4 w-4"/><span className="text-foreground">{org.name}</span></nav>}
  <img src={orgCover(org)} alt="" className="mb-4 aspect-[3/1] max-h-48 w-full rounded-lg object-cover"/>
  <header className="flex flex-wrap items-center gap-4 border-b border-border pb-6"><OrganisationLogo org={org}/><div className="min-w-0 flex-1"><p className="text-xs text-grass">{org.is_example?"Example · ":""}{org.kind==="community"?"Community · ":""}{org.visibility==="open"?"Open":org.visibility==="private"?"Invite only":"Members only"}{org.official_status==="pending"?" · Official status pending":""}</p><h1 className="mt-1 text-3xl">{org.name} <OfficialBadge org={org}/></h1>{(org.category||org.city)&&<p className="mt-1 text-xs text-muted-foreground">{[org.category,org.city].filter(Boolean).join(" · ")}</p>}</div><FollowOrganisation org={org}/></header>
  <p className="my-5 max-w-3xl text-sm text-muted-foreground">{org.description}</p>{org.about&&<p className="mt-3 max-w-2xl text-sm">{org.about}</p>}
  {(org.website||org.contact_email)&&<p className="mt-2 text-sm">{org.website&&<a className="underline" href={org.website} target="_blank" rel="noreferrer">Website</a>}{org.website&&org.contact_email&&" · "}{org.contact_email&&<a className="underline" href={`mailto:${org.contact_email}`}>{org.contact_email}</a>}</p>}
  <div className="mt-3 flex flex-wrap gap-2">
   {access.data?.admin&&<Button asChild variant="outline"><Link to="/organisation-admin/$orgId" params={{orgId:org.id}}>Manage</Link></Button>}
   {access.data?.host&&<Button asChild variant="outline"><Link to="/post">Post an event</Link></Button>}
  </div>
  {parent&&!org.question&&!access.data?.member&&<ClubJoin org={org} parent={parent}/>}
  {parent&&!org.question&&access.data?.member&&!role&&<ClubJoin org={org} parent={parent} inherited/>}
  {(!parent||org.question)&&<OrganisationAccess org={org}/>}
  {children.length>0&&<SubGroupSections children={children} plans={[...(events.data??[]),...(clubTeasers.data??[]).filter(t=>!(events.data??[]).some(e=>e.id===t.id))]}/>}
  <OrgEventTabs plans={plans}/>{teasers.data?.map(p=><LockedEventTeaser key={p.id} plan={p}/>)}
  {access.data?.member&&<MembersList org={org}/>}
 </>}</AppShell>;
}
function ClubJoin({org,parent,inherited=false}:{org:Org;parent:Org;inherited?:boolean}){
 const auth=useAuthAction(),qc=useQueryClient();
 return <section className="my-4 rounded-lg border border-border bg-card p-4 text-sm"><p>{inherited?`You can see ${org.name} through your ${parent.name} membership.`:`${parent.name} members can join ${org.name} without another check.`}</p><Button className="mt-2" size="sm" onClick={()=>auth(async()=>{const {data,error}=await supabase.rpc("request_org_access",{_org:org.id,_answer:""});if(error)toast.error(error.message.includes("Answer")?`Join ${parent.name} first to access this club.`:error.message);else{toast.success(data==="approved"?`You joined ${org.name}`:"Request sent");await qc.invalidateQueries();}},`join ${org.name}`)}>Join club</Button></section>;
}
function SubGroupSections({children,plans}:{children:Org[];plans:{id:string;organisation_id:string|null;starts_at:string;ends_at?:string|null}[]}){
 const sections=[...new Set([...SECTION_ORDER.filter(s=>children.some(c=>c.section===s)),...children.map(c=>c.section||"Other")])];
 return <div className="mt-6 space-y-6">{sections.map(s=>{const list=children.filter(c=>(c.section||"Other")===s);if(!list.length)return null;return <section key={s}><h2 className="text-xl">{s}</h2><div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(c=>{const mine=plans.filter(p=>p.organisation_id===c.id),n=mine.filter(p=>!isPastPlan(p)).length,pastN=mine.length-n;return <article key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"><img src={orgCover(c)} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" loading="lazy"/><div className="min-w-0 flex-1"><Link className="block truncate text-sm font-bold" to="/organisations/$slug" params={{slug:c.slug}}>{c.name}</Link><p className="text-xs text-muted-foreground">{n>0||pastN===0?`${n} upcoming ${n===1?"event":"events"}`:`${pastN} past ${pastN===1?"event":"events"}`}</p></div><FollowOrganisation org={c}/></article>;})}</div></section>;})}</div>;
}
function MembersList({org}:{org:Org}){
 const q=useQuery({queryKey:["org-members-list",org.id],queryFn:async()=>{const {data,error}=await supabase.from("organisation_members").select("user_id,role,profiles(name)").eq("organisation_id",org.id);if(error)throw error;return data;}});
 if(!q.data?.length)return null;
 return <section className="mt-8 border-t border-border pt-5"><h2 className="text-xl">Members <span className="text-sm text-muted-foreground">· visible to members only</span></h2><ul className="mt-2 flex flex-wrap gap-2">{q.data.map(m=><li key={m.user_id} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{m.profiles?.name??"Member"}{m.role!=="member"&&<span className="ml-1 text-xs text-muted-foreground">· {m.role}</span>}</li>)}</ul></section>;
}
function OrgEventTabs({plans}:{plans:PlanWithHost[]}){
 const upcoming=plans.filter(p=>!isPastPlan(p)),past=plans.filter(isPastPlan).reverse();
 const [pick,setTab]=useState<"upcoming"|"past"|null>(null);const tab=pick??(upcoming.length===0&&past.length>0?"past":"upcoming");
 return <section className="mt-6"><div role="tablist" className="flex gap-2">{(["upcoming","past"] as const).map(t=><Button key={t} role="tab" aria-selected={tab===t} size="sm" variant={tab===t?"default":"outline"} onClick={()=>setTab(t)}>{t==="upcoming"?`Upcoming (${upcoming.length})`:`Past (${past.length})`}</Button>)}</div>{tab==="upcoming"?(upcoming.length?<EventRow title="Events" plans={upcoming}/>:<p className="mt-4 text-sm text-muted-foreground">No upcoming events yet.</p>):(past.length?<EventRow title="Past events" plans={past}/>:<p className="mt-4 text-sm text-muted-foreground">No past events yet.</p>)}</section>;
}
