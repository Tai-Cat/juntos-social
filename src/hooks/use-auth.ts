import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, ready };
}

export function useMyProfile() {
  const { user, ready } = useSession();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Sign in to load your profile");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
  return {
    user,
    ready,
    profile: q.data ?? null,
    loading: !ready || (!!user && (q.isLoading || q.isFetching)),
  };
}

export function useBlocks() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["blocks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("blocked_id");
      return new Set((data ?? []).map((b) => b.blocked_id));
    },
  });
}
