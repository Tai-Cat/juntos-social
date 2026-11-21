import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/tagalong";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Tagalong" },
      { name: "description", content: "Sign in or create your Tagalong account with email." },
      { property: "og:title", content: "Sign in — Tagalong" },
      { property: "og:description", content: "Sign in or create your Tagalong account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/onboarding", data: { name } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding" });
        else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/feed" });
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6">
      <header className="py-6"><Link to="/" className="font-display text-2xl">Tagalong</Link></header>
      <div className="flex-1 pt-10">
        {sent ? (
          <div className="space-y-3">
            <h1 className="text-3xl">Check your email</h1>
            <p className="text-muted-foreground">We sent a confirmation link to {email}. Open it to finish setting up.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl">{mode === "signin" ? "Welcome back" : "Join Tagalong"}</h1>
            <form onSubmit={submit} className="mt-8 space-y-5">
              {mode === "signup" && (
                <div className="space-y-2"><Label htmlFor="name">First name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              )}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>
            </form>
            <button className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
