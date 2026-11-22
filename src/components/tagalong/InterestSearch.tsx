import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActivities } from "@/hooks/use-activities";
import { activityLabel } from "@/lib/catalog";
import { normalizeInterest } from "@/lib/interests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function useCommunityInterests() {
  return useQuery({ queryKey: ["community-interests"], staleTime: 5 * 60 * 1000, queryFn: async () => {
    const { data, error } = await supabase.rpc("community_interests");
    if (error) throw error;
    return data.map((d) => normalizeInterest(d.interest));
  } }).data ?? [];
}

/** Predictive search over shared interests, with a free-text option for anything new. */
export function InterestSearch({ exclude, onAdd, label = "Add your own interest", disabled = false }: { exclude: string[]; onAdd: (i: string) => void; label?: string; disabled?: boolean }) {
  const [text, setText] = useState("");
  const activities = useActivities(), community = useCommunityInterests();
  const all = useMemo(() => [...new Set([...activities, ...community])], [activities, community]);
  const q = normalizeInterest(text);
  const excluded = exclude.map(normalizeInterest);
  const compactQuery = q.replace(/\s+/g, "");
  const matches = q ? all.filter((a) => (a.includes(q) || a.replace(/\s+/g, "").includes(compactQuery)) && !excluded.includes(normalizeInterest(a))).sort((a, b) => Number(!a.startsWith(q)) - Number(!b.startsWith(q))).slice(0, 6) : [];
  const add = (v: string) => { const n = normalizeInterest(v); if (!n) return; onAdd(n); setText(""); };
  return (
    <div className="relative">
      <Input aria-label={label} placeholder="e.g. bonsai, 1980s synth records" value={text} maxLength={60} disabled={disabled} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(matches[0] === q ? q : text); } }} />
      {q && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {matches.map((m) => <li key={m}><Button type="button" variant="ghost" className="w-full justify-start rounded-none" onClick={() => add(m)}>{activityLabel(m)}</Button></li>)}
          {!all.map(normalizeInterest).includes(q) && !excluded.includes(q) && <li><Button type="button" variant="ghost" className="w-full justify-start rounded-none text-tangerine" onClick={() => add(q)}><Plus />Add “{q}”</Button></li>}
        </ul>
      )}
    </div>
  );
}
