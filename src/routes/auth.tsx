import { safeReturn } from "@/lib/auth-return";
import {readIntent} from "@/lib/auth-intent";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/tagalong";
import { focusNextOnEnter } from "@/hooks/use-keyboard-inset";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Juntos" },
      { name: "description", content: "Sign in or create your Juntos account with email." },
      { property: "og:title", content: "Sign in — Juntos" },
      { property: "og:description", content: "Sign in or create your Juntos account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-6 py-8">
      <Link to="/" className="font-display text-2xl">
        Juntos
      </Link>
      <div className="mt-8">
        <AuthForm />
      </div>
    </div>
  );
}

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  // /auth?mode=signup (used by the installed app) opens on the sign-up form.
  useEffect(() => {
    if (!onSuccess && new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
  }, [onSuccess]);

  function done() {
    if (onSuccess) onSuccess();
    else navigate({ to: readIntent()?.url??safeReturn(sessionStorage.getItem("tagalong-return")) });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !onSuccess) done();
    });
  }, [navigate]);

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" },
    });
    setBusy(false);
    if (error) setFormError(errMsg(error));
    else toast.success("Confirmation email sent");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: { name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding" });
        else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        done();
      }
    } catch (err) {
      const message = errMsg(err);
      setFormError(
        message === "Invalid login credentials"
          ? "That email and password didn’t match. If you just signed up, confirm your email first."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div>
        {sent ? (
          <div className="space-y-3">
            <h1 className="text-3xl">Check your email</h1>
            <p className="text-muted-foreground">
              We sent a confirmation link to {email}. Open it to finish setting up.
            </p>
            <Button variant="outline" onClick={resend} disabled={busy}>
              Resend confirmation email
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-3xl">{mode === "signin" ? "Welcome back" : "Join Juntos"}</h1>
            <form onSubmit={submit} className="mt-6 space-y-5">
              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">First name</Label>
                  <Input
                    id="name"
                    name="given-name"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    onKeyDown={focusNextOnEnter}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete={mode === "signup" ? "email" : "username"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  onKeyDown={focusNextOnEnter}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  name="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  enterKeyHint="go"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="sticky bottom-0 -mx-1 bg-background px-1 pb-2 pt-2">
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </div>
            </form>
            <Button
              variant="link"
              className="mt-6 text-sm"
              onClick={() => {
                setFormError("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
