import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirm your email — Tagalong" },
      { name: "description", content: "Finish confirming your Tagalong account." },
      { property: "og:title", content: "Confirm your email — Tagalong" },
      { property: "og:description", content: "Finish confirming your Tagalong account." },
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
      if (data.session) navigate({ to: "/onboarding", replace: true });
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
      <h1 className="text-3xl">Welcome to Tagalong</h1>
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
