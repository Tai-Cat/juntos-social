import { createFileRoute } from "@tanstack/react-router";
import { useAuthAction } from "@/components/tagalong/AuthSheet";
import { AppShell } from "@/components/tagalong/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export const Route=createFileRoute("/friends/invite")({validateSearch:(s:Record<string,unknown>)=>({code:typeof s["code"]==="string"?s["code"]:""}),head:()=>({meta:[{title:"A friend invitation — Juntos"},{name:"description",content:"Connect with a friend on Juntos."},{property:"og:title",content:"A friend invitation — Juntos"},{property:"og:description",content:"Connect with a friend on Juntos."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:Invite});
function Invite(){const {code}=Route.useSearch();const auth=useAuthAction();return <AppShell><h1 className="text-4xl">You're invited</h1><p className="my-4">A friend wants to bring you along for the next good plan.</p><Button onClick={()=>auth(async()=>{const {error}=await supabase.rpc("redeem_friend_code",{_code:code});if(error)toast.error("This invite code is unavailable");else toast.success("Friend request sent");},"connect with a friend")}>Connect with your friend</Button></AppShell>;}