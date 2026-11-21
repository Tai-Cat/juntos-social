import {useState} from "react";
import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {AppShell} from "@/components/tagalong/AppShell";
import {OfficialBadge,OrganisationAccess,OrganisationLogo,FollowOrganisation} from "@/components/tagalong/Organisations";
import {useOrgMemberships} from "@/hooks/use-organisations";
import {EventRow,LockedEventTeaser} from "@/components/tagalong/EventViews";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "@/hooks/use-auth";
import {Button} from "@/components/ui/button";
import type {PlanWithHost} from "@/lib/tagalong";
export const Route=createFileRoute("/organisations/$slug")({head:()=>({meta:[{title:"Organisation events — Juntos"},{name:"description",content:"Meet through institutions, clubs and communities on Juntos."},{property:"og:title",content:"Organisation events — Juntos"},{property:"og:description",content:"Discover events from institutions, clubs and communities."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:OrganisationPage});
function OrganisationPage(){
 const {slug}=Route.useParams(),{user}=useSession(),members=useOrgMemberships();
 const orgQ=useQuery({queryKey:["organisation",slug,user?.id],queryFn:async()=>{const {data,error}=await supabase.from("organisations").select("*").eq("slug",slug).maybeSingle();if(error)throw error;return data;}});
 const org=orgQ.data;
 const events=useQuery({queryKey:["org-events",org?.id,user?.id],enabled:!!org,queryFn:async()=>{if(!org)return [];const {data,error}=await supabase.from("plans").select("*").eq("organisation_id",org.id).order("starts_at");if(error)throw error;return data as PlanWithHost[];}});
 const teasers=useQuery({queryKey:["org-teasers",org?.id,user?.id],enabled:!!org,queryFn:async()=>{if(!org)return [];const {data,error}=await supabase.rpc("org_plan_teasers",{_org:org.id});if(error)throw error;return data;}});
 return <AppShell title="Organisations">{!org?<p className="py-10">{orgQ.isLoading?"Loading organisation…":"This organisation is private or unavailable."}</p>:<><header className="flex flex-wrap items-center gap-4 border-b border-border pb-6"><OrganisationLogo org={org}/><div className="min-w-0 flex-1"><p className="text-xs text-grass">{org.is_example?"Example · ":""}{org.visibility==="open"?"Open":"Members only"}</p><h1 className="mt-1 text-3xl">{org.name} <OfficialBadge org={org}/></h1></div><FollowOrganisation org={org}/></header><p className="my-5 max-w-3xl text-sm text-muted-foreground">{org.description}</p>{org.about&&<p className="mt-3 max-w-2xl text-sm">{org.about}</p>}{members.data?.some(m=>m.organisation_id===org.id&&m.role==="admin")&&<Button asChild variant="outline"><Link to="/organisation-admin/$orgId" params={{orgId:org.id}}>Organisation admin</Link></Button>}<OrganisationAccess org={org}/><OrgEventTabs plans={events.data??[]}/>{teasers.data?.map(p=><LockedEventTeaser key={p.id} plan={p}/>)}</>}</AppShell>;
}
function OrgEventTabs({plans}:{plans:PlanWithHost[]}){
 const [tab,setTab]=useState<"upcoming"|"past">("upcoming");
 const now=Date.now(),isPast=(p:PlanWithHost)=>new Date(p.ends_at??p.starts_at).getTime()<now;
 const upcoming=plans.filter(p=>!isPast(p)),past=plans.filter(isPast).reverse();
 return <section className="mt-6"><div role="tablist" className="flex gap-2">{(["upcoming","past"] as const).map(t=><Button key={t} role="tab" aria-selected={tab===t} size="sm" variant={tab===t?"default":"outline"} onClick={()=>setTab(t)}>{t==="upcoming"?`Upcoming (${upcoming.length})`:`Past (${past.length})`}</Button>)}</div>{tab==="upcoming"?(upcoming.length?<EventRow title="Events" plans={upcoming}/>:<p className="mt-4 text-sm text-muted-foreground">No upcoming events yet.</p>):(past.length?<EventRow title="Past events" plans={past}/>:<p className="mt-4 text-sm text-muted-foreground">No past events yet.</p>)}</section>;
}
