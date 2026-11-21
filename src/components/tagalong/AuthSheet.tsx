import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AuthForm } from "@/routes/auth";
import { useSession } from "@/hooks/use-auth";
const AuthContext = createContext<(action: (account: User) => void, reason?: string) => void>(
  () => {},
);
export const useAuthAction = () => useContext(AuthContext);
export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("keep the good plans going");
  const [pending, setPending] = useState<((account: User) => void) | null>(null);
  const navigate = useNavigate();
  function request(action: (account: User) => void, why = "keep the good plans going") {
    if (user) {
      action(user);
      return;
    }
    sessionStorage.setItem("tagalong-return", window.location.pathname + window.location.search);
    setPending(() => action);
    setReason(why);
    setOpen(true);
  }
  return (
    <AuthContext.Provider value={request}>
      {children}
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92dvh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Join Tagalong to {reason}</DrawerTitle>
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
                if (data.user) pending?.(data.user);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </AuthContext.Provider>
  );
}
