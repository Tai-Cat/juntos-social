import {photoOr,isRealPhoto} from "@/lib/placeholder";
import {Link} from "@tanstack/react-router";
import {Heart,Lock,ChevronRight} from "lucide-react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "@/hooks/use-auth";
import {useAuthAction} from "./AuthSheet";
import {activityLabel,genreClass,imageFor} from "@/lib/catalog";
import {ageLabel} from "@/lib/age";
import {formatWhen,type PlanWithHost} from "@/lib/tagalong";
import {toast} from "sonner";
import {useGallery} from "@/hooks/use-gallery";
export function SaveHeart({planId}:{planId:string}){
 const {user}=useSession(),auth=useAuthAction(),qc=useQueryClient();
 const q=useQuery({queryKey:["saved-plan",planId,user?.id],enabled:!!user,queryFn:async()=>{if(!user)return false;return !!(await supabase.from("saved_plans").select("plan_id").eq("plan_id",planId).eq("user_id",user.id).maybeSingle()).data;}});
 return <Button size="icon" variant="outline" aria-label={q.data?"Unsave plan":"Save plan"} className="h-8 w-8 rounded-full bg-card/95" onClick={()=>auth(async account=>{const r=q.data?await supabase.from("saved_plans").delete().eq("user_id",account.id).eq("plan_id",planId):await supabase.from("saved_plans").upsert({user_id:account.id,plan_id:planId});if(r.error)toast.error(r.error.message);else qc.invalidateQueries({queryKey:["saved-plan"]});},"save this plan")}><Heart className={q.data?"fill-tomato text-tomato":""}/></Button>;
}
export function SmallEventCard({plan}:{plan:PlanWithHost}){
 const photos=useGallery(plan.id,plan.photos);
 const bracket=ageLabel(plan.age_min,plan.age_max);
 return <article className="min-w-0"><div className="relative"><Link to="/plans/$planId" params={{planId:plan.id}}><img src={photos[0]||imageFor(plan.activity)} alt={plan.title} className="aspect-square w-full rounded-lg object-cover" loading="lazy"/></Link><span className="absolute right-2 top-2"><SaveHeart planId={plan.id}/></span>{plan.is_example&&<span className="absolute bottom-2 left-2 rounded bg-card/95 px-1.5 py-0.5 text-[10px] font-bold">Example</span>}</div><h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug"><Link to="/plans/$planId" params={{planId:plan.id}}>{plan.title}</Link></h3><p className="mt-1 truncate text-[11px] text-muted-foreground">{formatWhen(plan.starts_at)}</p><p className="truncate text-[11px] text-muted-foreground">{plan.area_label}</p><p className="mt-1 text-xs font-bold">{Number(plan.base_price)===0?"Free":`~€${plan.base_price}`}{bracket&&<span className="ml-2 font-normal text-muted-foreground">{bracket}</span>}</p></article>;
}
export function EventRow({title,plans}:{title:string;plans:PlanWithHost[]}){
 return <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><ChevronRight className="h-4 w-4 text-muted-foreground"/></div>{plans.length?<div className="grid auto-cols-[42%] grid-flow-col gap-3 overflow-x-auto pb-3 sm:auto-cols-[27%] lg:auto-cols-[17%] xl:auto-cols-[15%]">{plans.map(plan=><SmallEventCard key={plan.id} plan={plan}/>)}</div>:<p className="border-b border-border py-4 text-xs text-muted-foreground">No plans yet.</p>}</section>;
}
export function CompactEventList({plans}:{plans:PlanWithHost[]}){
 const groups=new Map<string,PlanWithHost[]>();
 for(const p of plans){const day=new Date(p.starts_at).toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});groups.set(day,[...(groups.get(day)??[]),p]);}
 return <div>{[...groups].map(([day,items])=><section className="mt-6" key={day}><h2 className="mb-2 border-b border-border pb-2 text-lg">{day}</h2><div className="grid gap-x-8 md:grid-cols-2">{items.map(p=><article className="flex min-w-0 items-center gap-3 border-b border-border py-3" key={p.id}><Link to="/plans/$planId" params={{planId:p.id}} className="shrink-0"><img src={photoOr(p.image_url,p.genre)} alt={p.title} className="h-20 w-20 rounded-lg object-cover"/></Link><div className="min-w-0 flex-1"><p className="text-[11px] text-muted-foreground">{new Date(p.starts_at).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}{p.is_example?" · Example":""}</p><h3 className="mt-0.5 text-sm font-bold"><Link to="/plans/$planId" params={{planId:p.id}}>{p.title}</Link></h3><p className="mt-1 truncate text-xs text-muted-foreground">{p.area_label}</p><p className="mt-1 text-xs"><span className="font-bold">{Number(p.base_price)===0?"Free":`~€${p.base_price}`}</span><span className="ml-2">{ageLabel(p.age_min,p.age_max)}</span></p></div><SaveHeart planId={p.id}/></article>)}</div></section>)}</div>;
}
export function LockedEventTeaser({plan}:{plan:{id:string;title:string;image_url:string|null;starts_at:string;area_label:string;base_price:number;is_example:boolean}}){return <Link to="/plans/$planId" params={{planId:plan.id}} className="flex items-center gap-3 border-b border-border py-3">{isRealPhoto(plan.image_url)&&plan.image_url&&<img src={plan.image_url} alt="" className="h-16 w-16 rounded-lg object-cover"/>}<div><p className="flex items-center gap-1 text-xs text-grass"><Lock className="h-3 w-3"/>Members only{plan.is_example?" · Example":""}</p><h3 className="mt-1 text-sm font-bold">{plan.title}</h3><p className="mt-1 text-xs text-muted-foreground">{formatWhen(plan.starts_at)} · {plan.area_label} · {Number(plan.base_price)===0?"Free":`€${plan.base_price}`}</p></div></Link>;}