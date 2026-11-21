import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/tagalong/bits";
import { GENDER_OPTIONS, errMsg } from "@/lib/tagalong";

export const INTERESTS = ["food", "coffee", "hiking", "running", "climbing", "museums", "music", "games", "dogs", "markets", "pottery", "wine", "beach", "photography", "architecture", "co-working"];

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Tagalong" }, { name: "description", content: "Tell people a little about you." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { profile, user } = useMyProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [city, setCity] = useState("Paris");
  const [gender, setGender] = useState<string>("prefer_not_to_say");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPronouns(profile.pronouns ?? "");
    setCity(profile.home_city);
    setInterests(profile.interests);
  }, [profile]);

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ name, pronouns: pronouns || null, home_city: city, interests }).eq("id", user.id);
      if (error) throw error;
      const { error: e2 } = await supabase.from("profile_private").upsert({ user_id: user.id, gender });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/verify" });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <p className="eyebrow">Step 1 of 2</p>
      <h1 className="mt-2 text-3xl">About you</h1>
      <div className="mt-8 space-y-6">
        <div className="space-y-2"><Label htmlFor="n">First name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="p">Pronouns (optional)</Label><Input id="p" placeholder="e.g. she/her, he/him, they/them" value={pronouns} onChange={(e) => setPronouns(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="c">Home city</Label><Input id="c" value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">How do you describe your gender?</legend>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Private. Never shown on your profile. Only used to check access to group-specific plans.</p>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => <Chip key={g.value} active={gender === g.value} onClick={() => setGender(g.value)}>{g.label}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <Chip key={i} active={interests.includes(i)} onClick={() => setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}>{i}</Chip>
            ))}
          </div>
        </fieldset>
        <Button size="lg" className="w-full" onClick={save} disabled={busy || !name.trim()}>Continue</Button>
      </div>
    </div>
  );
}
