import {useEffect,useState} from "react";
import {createFileRoute,Link,useNavigate} from "@tanstack/react-router";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {AppShell} from "@/components/tagalong/AppShell";
import {PlanVisibilityPanel} from "@/components/tagalong/PlanVisibility";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {supabase} from "@/integrations/supabase/client";
import {useSession} from "@/hooks/use-auth";
export const Route=createFileRoute("/_authenticated/edit-plan/$planId")({head:()=>({meta:[{title:"Edit plan — Juntos"},{name:"description",content:"Change your plan's details and who can see it."},{property:"og:title",content:"Edit plan — Juntos"},{property:"og:description",content:"Edit your Juntos plan."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex"}]}),component:EditPlan});
const toLocal=(iso:string)=>{const d=new Date(iso);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);};
function EditPlan(){
 const {planId}=Route.useParams(),{user}=useSession(),qc=useQueryClient(),navigate=useNavigate();
 const q=useQuery({queryKey:["plan",planId,user?.id,"edit"],queryFn:async()=>{const {data,error}=await supabase.from("plans").select("*").eq("id",planId).maybeSingle();if(error)throw error;return data;}});
 const plan=q.data;
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[startsAt,setStartsAt]=useState(""),[duration,setDuration]=useState("90"),[capacity,setCapacity]=useState("4"),[area,setArea]=useState(""),[bring,setBring]=useState(""),[venueTbc,setVenueTbc]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{if(plan){setTitle(plan.title);setDescription(plan.description??"");setStartsAt(toLocal(plan.starts_at));setDuration(String(plan.duration_minutes));setCapacity(String(plan.capacity));setArea(plan.area_label);setBring(plan.what_to_bring);setVenueTbc(plan.venue_tbc);}},[plan]);
 if(q.isLoading)return <AppShell title="Edit plan"><p className="py-10">Loading…</p></AppShell>;
 if(!plan||plan.host_id!==user?.id)return <AppShell title="Edit plan"><p className="py-10">Only the host can edit this plan.</p></AppShell>;
 async function save(e:React.FormEvent){e.preventDefault();if(!plan)return;
  const capacityValue=Number(capacity),durationValue=Number(duration);
  if(!Number.isInteger(capacityValue)||capacityValue<2||capacityValue>500){toast.error("Choose a whole number of spots between 2 and 500.");return;}
  if(!Number.isFinite(durationValue)||durationValue<15||durationValue>720){toast.error("Choose a duration between 15 and 720 minutes.");return;}
  if(!startsAt||!Number.isFinite(new Date(startsAt).getTime())||new Date(startsAt).getTime()<=Date.now()){toast.error("Choose a start date and time in the future.");return;}
  setBusy(true);
  const {error}=await supabase.from("plans").update({title:title.trim(),description:description.trim()||null,starts_at:new Date(startsAt).toISOString(),duration_minutes:durationValue,capacity:capacityValue,discount_tiers:Array.isArray(plan.discount_tiers)?plan.discount_tiers.filter((t:any)=>Number(t.min)<=capacityValue):[],area_label:area.trim(),what_to_bring:bring,venue_tbc:venueTbc}).eq("id",plan.id);
  setBusy(false);if(error){toast.error(error.message);return;}
  await qc.invalidateQueries();toast.success("Plan updated");navigate({to:"/plans/$planId",params:{planId:plan.id}});}
 return <AppShell title="Edit plan"><div className="mx-auto max-w-xl"><h1 className="text-3xl">Edit plan</h1>
  <h2 className="mt-6 text-lg">Who can see it</h2><PlanVisibilityPanel plan={plan}/>
  <form onSubmit={save} className="mt-6 space-y-4">
   <div><Label htmlFor="e-title">Title</Label><Input id="e-title" required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></div>
   <div><Label htmlFor="e-desc">Description</Label><Textarea id="e-desc" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></div>
   <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="e-when">Starts</Label><Input id="e-when" type="datetime-local" required value={startsAt} onChange={e=>setStartsAt(e.target.value)}/></div><div><Label htmlFor="e-dur">Length (minutes)</Label><Input id="e-dur" type="number" min={15} max={720} value={duration} onChange={e=>setDuration(e.target.value)}/></div></div>
   <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="e-cap">Spots</Label><Input id="e-cap" type="number" min={2} max={500} value={capacity} onChange={e=>setCapacity(e.target.value)}/></div><div><Label htmlFor="e-area">Area (shown publicly)</Label><Input id="e-area" required value={area} onChange={e=>setArea(e.target.value)}/></div></div>
   <div><Label htmlFor="e-bring">What to bring</Label><Input id="e-bring" value={bring} onChange={e=>setBring(e.target.value)}/></div>
   <label className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">Venue to be confirmed<Switch checked={venueTbc} onCheckedChange={setVenueTbc} aria-label="Venue to be confirmed"/></label>
   <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy?"Saving…":"Save changes"}</Button><Button asChild variant="outline"><Link to="/plans/$planId" params={{planId:plan.id}}>Cancel</Link></Button></div>
  </form></div></AppShell>;
}
