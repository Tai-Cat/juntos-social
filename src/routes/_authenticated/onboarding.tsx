import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/tagalong/bits";
import { CityInput } from "@/components/tagalong/CityInput";
import { InterestPicker } from "@/components/tagalong/InterestPicker";
import { GENDER_OPTIONS, errMsg } from "@/lib/tagalong";
import { ACTIVITIES, cityName } from "@/lib/catalog";
import { adultAge } from "@/lib/age";
import {readIntent} from "@/lib/auth-intent";
export const INTERESTS = ACTIVITIES;
export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Make yourself at home — Tagalong" },
      {
        name: "description",
        content: "Choose your interests, your city and what you want to learn.",
      },
      { property: "og:title", content: "Make yourself at home — Tagalong" },
      {
        property: "og:description",
        content: "Choose your interests, your city and what you want to learn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});
function Onboarding() {
  const { profile, user, loading } = useMyProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [privateReady, setPrivateReady] = useState(false);
  const [dob,setDob]=useState("");
  const [name, setName] = useState(""),
    [pronouns, setPronouns] = useState(""),
    [city, setCity] = useState("Paris, France"),
    [gender, setGender] = useState("prefer_not_to_say"),
    [other, setOther] = useState(""),
    [interests, setInterests] = useState<string[]>([]),
    [learning, setLearning] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPronouns(profile.pronouns ?? "");
    setCity(profile.home_city);
    setInterests(profile.interests);
    setLearning(profile.learning_interests);
  }, [profile]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setPrivateReady(false);
    supabase
      .from("profile_private")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errMsg(error));
        if (data) {
          setGender(data.gender_other ? "other" : data.gender);
          setOther(data.gender_other ?? "");
          setDob(data.date_of_birth??"");
        }
        setPrivateReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function save() {
    if (!user) return;
    const age=adultAge(dob);if(age===null || age<18 || age>120){setError("Tagalong is for adults aged 18 and over.");return;}
    setBusy(true);
    setError("");
    try {
      const { error: e } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: name.trim(),
          pronouns: pronouns.trim() || null,
          home_city: cityName(city),
          interests,
          learning_interests: learning,
        })
        .select("id")
        .single();
      if (e) throw e;
      const { error: e2 } = await supabase.rpc("save_private_profile",{
          _gender: gender === "other" ? "prefer_not_to_say" : gender,
          _other: gender === "other" ? other.trim() : "",
          _dob:dob,
        });
      if (e2) throw e2;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({queryKey:["private-age"]});
      navigate({ to: readIntent()?"/verify":profile?.onboarded ? "/profile" : "/verify" });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading || !privateReady)
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl">Your kind of people</h1>
        <p className="mt-4 text-muted-foreground">Loading your profile…</p>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <p className="font-display text-2xl">
        Tagalong<span className="text-tangerine">.</span>
      </p>
      <p className="eyebrow mt-8">{profile?.onboarded ? "Your profile" : "Step 1 of 2"}</p>
      <h1 className="mt-2 text-4xl">Your kind of people</h1>
      <div className="mt-8 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n">First name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">Pronouns (optional)</Label>
            <Input
              id="p"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="e.g. they/them"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c">Home city</Label>
          <CityInput id="c" value={city} onChange={setCity} />
        </div>
        <fieldset className="space-y-3">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" value={dob} onChange={e=>setDob(e.target.value)} required />
          <p className="flex gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5"/>Private. Tagalong is 18+. Only age brackets are shown.</p>
          <legend className="text-sm font-bold">How do you describe your gender?</legend>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Private. Only used for group-specific plans.
          </p>
          <div className="flex flex-wrap gap-2">
            {[...GENDER_OPTIONS, { value: "other", label: "Other" }].map((g) => (
              <Chip key={g.value} active={gender === g.value} onClick={() => setGender(g.value)}>
                {g.label}
              </Chip>
            ))}
          </div>
          {gender === "other" && (
            <div className="space-y-2">
              <Label htmlFor="gender-other">Your gender</Label>
              <Input id="gender-other" value={other} onChange={(e) => setOther(e.target.value)} />
            </div>
          )}
        </fieldset>
        <section>
          <h2 className="text-2xl">What are you into?</h2>
          <p className="my-2 text-xs text-muted-foreground">
            {interests.length} interests selected
          </p>
          <InterestPicker selected={interests} onChange={setInterests} city={city} />
        </section>
        <section>
          <h2 className="text-2xl">I want to learn</h2>
          <p className="my-2 text-xs text-muted-foreground">
            {learning.length} new adventures selected
          </p>
          <InterestPicker selected={learning} onChange={setLearning} city={city} />
        </section>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          size="lg"
          variant="accent"
          className="w-full"
          onClick={save}
          disabled={
            busy || loading || !name.trim() || !city.trim() || !dob || (gender === "other" && !other.trim())
          }
        >
          {busy ? "Saving…" : profile?.onboarded ? "Save profile" : "Continue"}
        </Button>
      </div>
    </main>
  );
}
