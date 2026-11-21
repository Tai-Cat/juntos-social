import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rememberIntent, readIntent, clearIntent, completeIntent, type AuthIntent } from "@/lib/auth-intent";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AuthForm } from "@/routes/auth";
import { useSession } from "@/hooks/use-auth";
const AuthContext = createContext<(action: (account: User) => void, reason?: string, intent?:AuthIntent) => void>(
  () => {},
);
export const useAuthAction = () => useContext(AuthContext);
export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("keep the good plans going");
  const [pending, setPending] = useState<((account: User) => void) | null>(null);
  const navigate = useNavigate();
  const loc=useLocation();
  const qc=useQueryClient();
  const processing=useRef(false);
  useEffect(()=>{
    const saved=readIntent();
    if(!user || !saved || processing.current || loc.pathname.startsWith("/verify") || loc.pathname.startsWith("/onboarding"))return;
    processing.current=true;
    void (async()=>{
      try{
        const {data:profile}=await supabase.from("profiles").select("onboarded").eq("id",user.id).single();
        if(!profile?.onboarded){await navigate({to:"/onboarding"});return;}
        if(saved.intent.kind==="join" || saved.intent.kind==="rsvp" && saved.intent.status==="going"){
          const {data:age}=await supabase.from("profile_private").select("date_of_birth").eq("user_id",user.id).maybeSingle();
          if(!age?.date_of_birth){await navigate({to:"/onboarding"});return;}
        }
        await completeIntent(saved.intent,user.id);
        clearIntent();setOpen(false);setPending(null);
        await qc.invalidateQueries();
        if(loc.pathname!==saved.url)await navigate({to:saved.url});
        if(saved.intent.kind==="invite")window.dispatchEvent(new CustomEvent("tagalong-invite",{detail:saved.intent.planId}));
        else toast.success(saved.intent.kind==="alert"?"Alert saved":saved.intent.kind==="rsvp"?"RSVP saved":"Join request completed");
      }catch(e){clearIntent();toast.error(e instanceof Error?e.message:typeof e==="object"&&e&&"message" in e?String(e.message):"Your action couldn't complete. Please try again.");}
      finally{processing.current=false;}
    })();
  },[user?.id,loc.pathname]);
  function request(action: (account: User) => void, why = "keep the good plans going", intent?:AuthIntent) {
    if (user) {
      action(user);
      return;
    }
    sessionStorage.setItem("tagalong-return", window.location.pathname + window.location.search);
    if(intent)rememberIntent(intent);
    setPending(()=>intent?null:action);
    setReason(why);
    setOpen(true);
  }
  return (
    <AuthContext.Provider value={request}>
      {children}
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92dvh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Join Juntos to {reason}</DrawerTitle>
          </DrawerHeader>
          <div className="mx-auto w-full max-w-md px-6 pb-8">
            <AuthForm
              onSuccess={async () => {
                setOpen(false);
                const { supabase } = await import("@/integrations/supabase/client");
                const { data } = await supabase.auth.getUser();
                const profile = data.user
                  ? await supabase
                      .from("profiles")
                      .select("onboarded")
                      .eq("id", data.user.id)
                      .maybeSingle()
                  : null;
                if (!profile?.data?.onboarded) {
                  navigate({ to: "/onboarding" });
                  return;
                }
                if (data.user && !readIntent()) pending?.(data.user);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </AuthContext.Provider>
  );
}
