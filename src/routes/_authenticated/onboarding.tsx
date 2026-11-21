import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/tagalong/bits";
import { CityInput } from "@/components/tagalong/CityInput";
import { InterestPicker } from "@/components/tagalong/InterestPicker";
import { GENDER_OPTIONS, errMsg } from "@/lib/tagalong";
import { ACTIVITIES, activityLabel, cityName } from "@/lib/catalog";
import { adultAge } from "@/lib/age";
import {readIntent} from "@/lib/auth-intent";
import { InterestSearch } from "@/components/tagalong/InterestSearch";
import { addInterest } from "@/lib/interests";
export const INTERESTS = ACTIVITIES;
export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Make yourself at home — Juntos" },
      {
        name: "description",
        content: "Choose your interests and your home city.",
      },
      { property: "og:title", content: "Make yourself at home — Juntos" },
      {
        property: "og:description",
        content: "Choose your interests and your home city.",
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
  const [dob,setDob]=useState("");const [adultOk,setAdultOk]=useState(false);const [accountType,setAccountType]=useState<"personal"|"business"|"institution">("personal");
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
          setDob(data.date_of_birth??"");if(data.date_of_birth)setAdultOk(true);
        }
        setPrivateReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function save() {
    if (!user) return;
    const age=adultAge(dob);if(age===null || age<18 || age>120){setError("Juntos is for adults aged 18 and over.");return;}if(!adultOk){setError("Please confirm you are 18 or over.");return;}
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
          interests: [...new Set([...interests, ...learning])],
          learning_interests: [],
          onboarded: true,
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
      await supabase.from("user_settings").upsert({ user_id: user.id, account_type: accountType });
      const intent = readIntent();
      if (accountType !== "personal") navigate({ to: "/organisations/new", search: { kind: accountType === "business" ? "business" : "institution" } });
      else if (intent?.url) navigate({ to: intent.url as "/feed" });
      else navigate({ to: profile?.onboarded ? "/profile" : "/feed" });
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
        Juntos<span className="text-tangerine">.</span>
      </p>
      <p className="eyebrow mt-8">{profile?.onboarded ? "Your profile" : "One quick step"}</p>
      <h1 className="mt-2 text-4xl">Your kind of people</h1>
      <div className="mt-8 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n">First name</Label>
            <Input id="n" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" value={name} onChange={(e) => setName(e.target.value)} />
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
        <div className="space-y-3">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" value={dob} onChange={e=>setDob(e.target.value)} required />
          <p className="flex gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5"/>Private. Juntos is 18+. Only age brackets are shown.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adultOk} onChange={e=>setAdultOk(e.target.checked)} className="h-4 w-4 accent-primary"/>I confirm I am 18 or over</label>
          <div className="space-y-2 pt-2"><Label>Account type</Label><div className="grid grid-cols-3 gap-2">{([["personal","Personal"],["business","Business"],["institution","Institution"]] as const).map(([v,l])=><Button key={v} type="button" size="sm" variant={accountType===v?"default":"outline"} onClick={()=>setAccountType(v)}>{l}</Button>)}</div><p className="text-xs text-muted-foreground">Business: venues, studios, shops, restaurants. Institution: schools, universities, companies, clubs. You'll set up the organisation profile next.</p></div>
        </div>
        {/* Own fieldset with the legend first: browsers always draw a legend at the top of its fieldset. */}
        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-bold">How do you describe your gender?</legend>
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
          <h2 className="text-2xl">I'm interested in</h2>
          <p className="my-2 text-xs text-muted-foreground">
            Pick as many as you like. {interests.length > 0 && `${interests.length} selected. `}You can add skill levels later from your profile.
          </p>
          <InterestPicker selected={interests} onChange={setInterests} city={city} />
          <div className="mt-4">
            <InterestSearch exclude={interests} onAdd={(v) => setInterests(addInterest(interests, v))} />
          </div>
          {interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.map((i) => (
                <Chip key={i} active onClick={() => setInterests(interests.filter((x) => x !== i))}>
                  <span className={i === "ai" ? "" : "capitalize"}>{activityLabel(i)}</span> <X className="h-3 w-3" aria-label={`Remove ${i}`} />
                </Chip>
              ))}
            </div>
          )}
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
