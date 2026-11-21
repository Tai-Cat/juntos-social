import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {AppShell} from "@/components/tagalong/AppShell";
import {Button} from "@/components/ui/button";
import {supabase} from "@/integrations/supabase/client";
import {useIsAppAdmin} from "@/hooks/use-app-config";
export const Route=createFileRoute("/_authenticated/admin/review")({head:()=>({meta:[{title:"Official status reviews — Juntos"},{name:"description",content:"Review organisations requesting Official status."},{property:"og:title",content:"Official status reviews — Juntos"},{property:"og:description",content:"Juntos admin review queue."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex"}]}),component:Review});
function Review(){
 const isAdmin=useIsAppAdmin(),qc=useQueryClient();
 const q=useQuery({queryKey:["official-requests"],enabled:isAdmin,queryFn:async()=>{const {data,error}=await supabase.from("official_requests").select("*,organisations(name,slug,kind)").order("created_at",{ascending:false});if(error)throw error;return data;}});
 async function review(id:string,approve:boolean){const {error}=await supabase.rpc("review_official",{_request:id,_approve:approve});if(error)toast.error(error.message);else{toast.success(approve?"Approved as Official":"Request rejected");await qc.invalidateQueries();}}
 const pending=q.data?.filter(r=>r.status==="pending")??[],done=q.data?.filter(r=>r.status!=="pending")??[];
 return <AppShell title="Reviews">{!isAdmin?<p className="py-10">Only the Juntos app admin can open this page.</p>:<>
  <h1 className="text-3xl">Official status requests</h1>
  {!pending.length&&<p className="mt-4 text-sm text-muted-foreground">No requests waiting.</p>}
  {pending.map(r=><article key={r.id} className="mt-4 rounded-lg border border-border bg-card p-4"><p className="font-bold">{r.organisations?<Link className="underline" to="/organisations/$slug" params={{slug:r.organisations.slug}}>{r.organisations.name}</Link>:"Organisation"} <span className="text-xs font-normal text-muted-foreground">· {r.organisations?.kind}</span></p>{r.work_email&&<p className="mt-1 text-sm">Work email: {r.work_email}</p>}{r.website&&<p className="text-sm">Website: <a className="underline" href={r.website} target="_blank" rel="noreferrer">{r.website}</a></p>}{r.note&&<p className="mt-2 whitespace-pre-wrap text-sm">{r.note}</p>}<div className="mt-3 flex gap-2"><Button size="sm" onClick={()=>review(r.id,true)}>Approve</Button><Button size="sm" variant="outline" onClick={()=>review(r.id,false)}>Reject</Button></div></article>)}
  {done.length>0&&<><h2 className="mt-8 text-xl">Reviewed</h2>{done.map(r=><p key={r.id} className="border-b border-border py-2 text-sm">{r.organisations?.name} · {r.status}</p>)}</>}
 </>}</AppShell>;
}
