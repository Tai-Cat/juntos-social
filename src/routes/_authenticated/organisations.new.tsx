import {useState} from "react";
import {createFileRoute,useNavigate} from "@tanstack/react-router";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {z} from "zod";
import {AppShell} from "@/components/tagalong/AppShell";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Choice} from "@/components/tagalong/Choice";
import {supabase} from "@/integrations/supabase/client";
const search=z.object({kind:z.enum(["community","business","institution"]).optional()});
export const Route=createFileRoute("/_authenticated/organisations/new")({validateSearch:search,head:()=>({meta:[{title:"Create a group or organisation — Juntos"},{name:"description",content:"Start a community, club, business or institution page on Juntos."},{property:"og:title",content:"Create a group or organisation — Juntos"},{property:"og:description",content:"Start a community or organisation on Juntos."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:NewOrg});
const slugify=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);
function NewOrg(){
 const {kind:initial}=Route.useSearch(),navigate=useNavigate(),qc=useQueryClient();
 const [kind,setKind]=useState<string>(initial??"community");
 const [name,setName]=useState(""),[handle,setHandle]=useState(""),[description,setDescription]=useState(""),[category,setCategory]=useState(""),[city,setCity]=useState(""),[visibility,setVisibility]=useState("open"),[question,setQuestion]=useState(""),[pass,setPass]=useState(""),[website,setWebsite]=useState(""),[email,setEmail]=useState(""),[cover,setCover]=useState(""),[busy,setBusy]=useState(false);
 const isGroup=kind==="community";
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);
  const slug=handle||slugify(name);
  const {error}=await supabase.rpc("create_organisation",{_kind:kind,_name:name,_slug:slug,_description:description,_category:category,_city:city,_visibility:visibility,_question:visibility==="members"?question:"",...website?{_website:website}:{},...email?{_email:email}:{},...cover?{_cover:cover}:{},...pass&&visibility==="members"?{_passphrase:pass}:{}});
  setBusy(false);
  if(error){toast.error(error.message);return;}
  await qc.invalidateQueries();toast.success(isGroup?"Group created. You're its host and admin.":"Organisation created. It shows as Pending until it's approved as Official.");
  navigate({to:"/organisations/$slug",params:{slug}});
 }
 return <AppShell title="Create"><form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
  <h1 className="text-3xl">{isGroup?"Create a group":"Create an organisation"}</h1>
  <Choice label="Type" value={kind} onChange={setKind} options={[{value:"community",label:"Group or community"},{value:"business",label:"Business"},{value:"institution",label:"Institution"}]}/>
  <p className="text-xs text-muted-foreground">{isGroup?"Run clubs, book clubs, cohorts, study groups or friend groups. Free accounts can create up to 3 groups.":kind==="business"?"Venues, studios, shops, restaurants and partner venues. Shows as Pending until approved.":"Schools, universities, companies, clubs and associations. Shows as Pending until approved."}</p>
  <div><Label htmlFor="o-name">Name</Label><Input id="o-name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></div>
  <div><Label htmlFor="o-handle">Handle</Label><Input id="o-handle" placeholder={slugify(name)||"my-group"} value={handle} onChange={e=>setHandle(slugify(e.target.value))}/></div>
  <div><Label htmlFor="o-desc">Description</Label><Textarea id="o-desc" maxLength={3000} value={description} onChange={e=>setDescription(e.target.value)}/></div>
  <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="o-cat">Category</Label><Input id="o-cat" placeholder={isGroup?"Running":"Restaurant"} value={category} onChange={e=>setCategory(e.target.value)}/></div><div><Label htmlFor="o-city">{isGroup?"City":"Area or city"}</Label><Input id="o-city" value={city} onChange={e=>setCity(e.target.value)}/></div></div>
  <div><Label htmlFor="o-cover">Cover image link (optional)</Label><Input id="o-cover" type="url" placeholder="https://…" value={cover} onChange={e=>setCover(e.target.value)}/><p className="mt-1 text-xs text-muted-foreground">Leave empty and we'll add a matching photo.</p></div>
  {!isGroup&&<div className="grid grid-cols-2 gap-3"><div><Label htmlFor="o-web">Website</Label><Input id="o-web" type="url" value={website} onChange={e=>setWebsite(e.target.value)}/></div><div><Label htmlFor="o-mail">Contact email</Label><Input id="o-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div></div>}
  <div><Label>Privacy</Label><Choice label="Privacy" value={visibility} onChange={setVisibility} options={[{value:"open",label:"Open"},{value:"members",label:"Members only"},{value:"private",label:"Private · invite only"}]}/></div>
  {visibility==="members"&&<><div><Label htmlFor="o-q">Join question</Label><Input id="o-q" required maxLength={500} placeholder="Why would you like to join?" value={question} onChange={e=>setQuestion(e.target.value)}/></div><div><Label htmlFor="o-pass">Passphrase for instant approval (optional)</Label><Input id="o-pass" type="password" autoComplete="new-password" value={pass} onChange={e=>setPass(e.target.value)}/></div></>}
  <Button type="submit" disabled={busy||name.trim().length<2}>{busy?"Creating…":isGroup?"Create group":"Create organisation"}</Button>
 </form></AppShell>;
}
