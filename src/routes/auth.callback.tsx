import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {readIntent} from "@/lib/auth-intent";
import {safeReturn} from "@/lib/auth-return";
export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirm your email — Juntos" },
      { name: "description", content: "Finish confirming your Juntos account." },
      { property: "og:title", content: "Confirm your email — Juntos" },
      { property: "og:description", content: "Finish confirming your Juntos account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Callback,
});
function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function finish() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        if (result.error && active) setError(result.error.message);
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        const profile=await supabase.from("profiles").select("onboarded").eq("id",data.session.user.id).maybeSingle();
        navigate({to:profile.data?.onboarded?readIntent()?.url??safeReturn(sessionStorage.getItem("tagalong-return")):"/onboarding",replace:true});
      }
      else
        setError(
          "Your email link has expired or was already used. Sign in, or request a new confirmation email.",
        );
    }
    finish();
    return () => {
      active = false;
    };
  }, [navigate]);
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl">Welcome to Juntos</h1>
      {error ? (
        <>
          <p role="alert" className="my-6 text-muted-foreground">
            {error}
          </p>
          <Button asChild>
            <Link to="/auth">Return to sign in</Link>
          </Button>
        </>
      ) : (
        <p className="mt-4">Confirming your email…</p>
      )}
    </main>
  );
}
