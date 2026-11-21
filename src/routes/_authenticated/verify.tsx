import { safeReturn } from "@/lib/auth-return";
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Camera, IdCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { errMsg } from "@/lib/tagalong";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({
    meta: [
      { title: "Verify it's you — Tagalong" },
      { name: "description", content: "Demo identity verification." },
      { property: "og:title", content: "Verify it's you — Tagalong" },
      { property: "og:description", content: "Demo identity verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");

  async function finish(verified: boolean) {
    if (!user) return false;
    const { data, error } = await supabase
      .from("profiles")
      .update({ verified, onboarded: true })
      .eq("id", user.id)
      .select("*")
      .single();
    if (error) {
      toast.error(errMsg(error));
      return false;
    }
    qc.setQueryData(["profile", user.id], data);
    await qc.invalidateQueries({ queryKey: ["profile"], refetchType: "all" });
    return true;
  }

  async function check() {
    setState("checking");
    // Demo verification: nothing is uploaded or analysed. Marks verified after 3 seconds.
    await new Promise((r) => setTimeout(r, 3000));
    const saved = await finish(true);
    setState(saved ? "done" : "idle");
  }

  const step = !idFile ? 1 : 2;

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="mt-2 text-3xl">Verify it's you</h1>
      <p className="mt-3 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Demo verification. Photos stay on your device and are not checked. You'll be marked verified
        after 3 seconds.
      </p>

      {state === "done" ? (
        <div className="mt-10 space-y-4 text-center">
          <BadgeCheck className="mx-auto h-12 w-12 text-tangerine" strokeWidth={1.25} />
          <h2 className="text-2xl">You're verified</h2>
          <Button size="lg" className="w-full" onClick={() => navigate({ to: safeReturn(sessionStorage.getItem("tagalong-return")) })}>
            Find a plan
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <label
            className={`flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-5 ${step === 1 ? "border-foreground" : "border-border"}`}
          >
            <IdCard className="h-6 w-6" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-medium">1. Upload a photo of your ID</p>
              <p className="text-xs text-muted-foreground">
                {idFile ? idFile.name : "Passport, ID card or driving licence"}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label
            className={`flex items-center gap-4 rounded-lg border bg-card p-5 ${step === 2 ? "cursor-pointer border-foreground" : "pointer-events-none border-border opacity-50"}`}
          >
            <Camera className="h-6 w-6" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-medium">2. Take a selfie</p>
              <p className="text-xs text-muted-foreground">
                {selfie ? selfie.name : "Good light, face the camera"}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            size="lg"
            variant="accent"
            className="w-full"
            disabled={!idFile || !selfie || state === "checking"}
            onClick={check}
          >
            {state === "checking" ? (
              <>
                <Loader2 className="animate-spin" />
                Checking…
              </>
            ) : (
              "Verify"
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              if (await finish(false)) navigate({ to: safeReturn(sessionStorage.getItem("tagalong-return")) });
            }}
          >
            Skip for now
          </Button>
        </div>
      )}
    </div>
  );
}
