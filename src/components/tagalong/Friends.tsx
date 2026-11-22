import { FriendReminder } from "./FriendReminder";
import { SocialExamples } from "./SocialExamples";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserPlus, Search, Share2, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VerifiedBadge } from "./bits";
import { SafetyMenu } from "./SafetyMenu";
import { toast } from "sonner";
import { firstName } from "@/lib/tagalong";
export function useFriends() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["friends", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          "*,from:profiles!friendships_requester_fkey(id,name,verified),to:profiles!friendships_recipient_fkey(id,name,verified)",
        );
      if (error) throw error;
      return data.map((f) => ({ ...f, person: f.requester === user?.id ? f.to : f.from }));
    },
  });
}
export function FindPeople({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useSession(),
    qc = useQueryClient();
  const [search, setSearch] = useState(""),
    [code, setCode] = useState("");
  const [mode, setMode] = useState<"find" | "link" | "code">("find");
  const [requested, setRequested] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const people = useQuery({
    queryKey: ["people-search", debouncedSearch.toLowerCase()],
    enabled: open && !!user && debouncedSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("find_people", { _search: debouncedSearch });
      if (error) throw error;
      return data;
    },
  });
  const own = useQuery({
    queryKey: ["friend-code", user?.id],
    enabled: open && !!user,
    queryFn: async () => {
      if (!user) return null;
      let { data } = await supabase
        .from("friend_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) {
        const r = await supabase
          .from("friend_codes")
          .insert({ user_id: user.id })
          .select("code")
          .single();
        if (r.error) throw r.error;
        data = r.data;
      }
      return data?.code ?? null;
    },
  });
  async function add(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("friendships")
      .insert({ requester: user.id, recipient: id });
    if (error)
      toast.error(
        error.message.includes("duplicate")
          ? "You're already connected or have a request pending"
          : error.message,
      );
    else {
      setRequested((current) => current.includes(id) ? current : [...current, id]);
      toast.success("Friend request sent");
      qc.invalidateQueries({ queryKey: ["friends"] });
    }
  }
  async function redeem() {
    try {
      const value = code.includes("code=")
        ? (new URL(code).searchParams.get("code") ?? code)
        : code;
      const { error } = await supabase.rpc("redeem_friend_code", { _code: value.trim() });
      if (error) throw error;
      toast.success("Friend request sent");
      qc.invalidateQueries({ queryKey: ["friends"] });
      onOpenChange(false);
    } catch {
      toast.error("That code wasn't found. Check the code and try again.");
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex h-[min(84dvh,700px)] max-h-[calc(100dvh-12px)] min-h-[360px] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-t-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-6 sm:px-6">
          <SheetHeader className="mb-3 shrink-0 pr-8 text-left">
            <SheetTitle className="font-display text-2xl">Find your people</SheetTitle>
          </SheetHeader>
          <div className="mb-3 flex shrink-0 flex-wrap gap-2">
            <Button
              variant={mode === "find" ? "secondary" : "outline"}
              onClick={() => setMode("find")}
            >
              <Search />
              Find people
            </Button>
            <Button
              variant={mode === "link" ? "secondary" : "outline"}
              onClick={() => setMode("link")}
            >
              <Share2 />
              Invite link
            </Button>
            <Button
              variant={mode === "code" ? "secondary" : "outline"}
              onClick={() => setMode("code")}
            >
              <ScanLine />
              Enter a code
            </Button>
          </div>
          {mode === "find" ? (
            <>
              <div className="sticky top-0 z-10 shrink-0 bg-background pb-3">
                <Input autoComplete="off" aria-label="Search people" placeholder="Start typing a name or interest" value={search} onChange={(e) => setSearch(e.target.value)} />
                <p className="mt-2 text-xs text-muted-foreground">Type two or more letters. Matches appear automatically below.</p>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto overscroll-contain pb-4 pr-1" aria-live="polite">
                {search.trim().length < 2 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Start with a name or interest to find people on Juntos.</p>}
                {debouncedSearch.length >= 2 && people.isFetching && <p className="p-4 text-sm text-muted-foreground">Searching for people…</p>}
                {people.isError && <p role="alert" className="rounded-xl border border-border p-4 text-sm">Search couldn't load. Please try again.</p>}
                {debouncedSearch.length >= 2 && !people.isFetching && !people.isError && people.data?.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No members found. Try another spelling or a shorter name.</p>}
                {people.data?.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 border-b border-border py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sunflower font-bold">
                      {firstName(p.name).charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{firstName(p.name)}</p>
                      <VerifiedBadge verified={p.verified} />
                      <p className="truncate text-xs text-muted-foreground">
                        {p.interests.join(" · ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={requested.includes(p.id) ? "secondary" : "outline"}
                      className="h-11 min-w-[88px] shrink-0"
                      aria-label={requested.includes(p.id) ? "Request sent to " + firstName(p.name) : "Add " + firstName(p.name) + " as a friend"}
                      disabled={requested.includes(p.id)}
                      onClick={() => add(p.id)}
                    >
                      <UserPlus className="h-4 w-4" />{requested.includes(p.id) ? "Sent" : "Add"}
                    </Button>
                    <SafetyMenu userId={p.id} label={firstName(p.name)} />
                  </div>
                ))}
              </div>
            </>
          ) : mode === "link" ? (
            <div className="space-y-4">
              <p className="text-sm">A little invitation to your next connection.</p>
              <Input readOnly aria-label="Your invite code" value={own.data ?? ""} />
              <Button
                className="w-full"
                onClick={async () => {
                  if (!own.data) return;
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/friends/invite?code=${own.data}`,
                  );
                  toast.success("Invite link copied");
                }}
              >
                <Share2 />
                Copy invite link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                aria-label="Friend invite code"
                placeholder="Paste a code or invite link"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button className="w-full" disabled={!code.trim()} onClick={redeem}>
                Send friend request
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
export function FriendsPanel() {
  const { user } = useSession(),
    q = useFriends(),
    qc = useQueryClient();
  const [find, setFind] = useState(false);
  const going = useQuery({
    queryKey: ["friends-going"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("friends_going", {});
      if (error) throw error;
      return data;
    },
  });
  async function respond(id: string, accept: boolean) {
    const { error } = await supabase.rpc("respond_friend", { _id: id, _accept: accept });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["friends"] });
  }
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Friends</h2>
        <Button variant="outline" onClick={() => setFind(true)}>
          <UserPlus />
          Find people
        </Button>
      </div>
      <FindPeople open={find} onOpenChange={setFind} />
      <h3 className="mb-2 mt-6 text-xl">Requests</h3>
      {q.data
        ?.filter((f) => f.status === "pending")
        .map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-2 border-b border-border py-3"
          >
            <span>{firstName(f.person?.name)}</span>
            {f.recipient === user?.id ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => respond(f.id, false)}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => respond(f.id, true)}>
                  Accept
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Request sent</span>
            )}
          </div>
        ))}
      <h3 className="mb-2 mt-6 text-xl">Your friends</h3>
      {q.data
        ?.filter((f) => f.status === "accepted")
        .map((f) => (
          <div className="flex items-center gap-3 border-b border-border py-3" key={f.id}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sunflower font-bold">
              {firstName(f.person?.name).charAt(0)}
            </span>
            <span className="flex-1">{firstName(f.person?.name)}</span>
            <VerifiedBadge verified={!!f.person?.verified} />
            {f.person && <FriendReminder friendId={f.person.id} name={firstName(f.person.name)} />}
            {f.person && (
              <Button asChild size="sm" variant="outline">
                <Link to="/chat/$userId" params={{ userId: f.person.id }}>
                  Say hi
                </Link>
              </Button>
            )}
          </div>
        ))}
      <SocialExamples kind="friend"/><SocialExamples kind="request"/>
      <h3 className="mb-2 mt-6 text-xl">What my friends are doing</h3>
      {going.data?.map((g) => (
        <Link
          key={`${g.plan_id}-${g.person_id}`}
          to="/plans/$planId"
          params={{ planId: g.plan_id }}
          className="block border-b border-border py-3 text-sm"
        >
          {g.name} is going · View plan →
        </Link>
      ))}
      {!going.data?.length && (
        <p className="text-sm text-muted-foreground">Your friends' next plans will appear here.</p>
      )}
    </section>
  );
}
