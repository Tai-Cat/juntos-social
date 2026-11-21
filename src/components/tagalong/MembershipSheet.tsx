import { MANAGE_SUBSCRIPTION_LINK } from "@/lib/plus";
import { Check, Minus, Crown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePlus } from "@/hooks/use-plus";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { PLUS_FEATURES } from "./Membership";
import { PlusCheckoutButton } from "./PlusCheckout";
const FREE_HAS = new Set<string>();
export function MembershipSheet() {
  const { plus, setPlus } = usePlus();
  const isAdmin = useIsAppAdmin();
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline"><Crown />{plus ? "Plus" : "Membership"}</Button></SheetTrigger>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-3xl">Membership</SheetTitle></SheetHeader>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <article className={`rounded-lg border p-4 ${!plus ? "border-tangerine bg-card" : "border-border bg-card"}`}><p className="eyebrow">{!plus ? "Current" : "Free"}</p><h3 className="mt-1 text-2xl">Free</h3><p className="text-sm">€0</p></article>
          <article className={`genre-ideas rounded-lg border p-4 ${plus ? "border-tangerine" : "border-border"}`}><p className="eyebrow">{plus ? "Current" : "Upgrade"}</p><h3 className="mt-1 text-2xl">Plus</h3><p className="text-sm font-bold">€5 / month</p></article>
        </div>
        <table className="mt-5 w-full text-sm">
          <thead><tr className="border-b border-border text-left"><th className="py-2 font-bold">Feature</th><th className="w-14 text-center">Free</th><th className="w-14 text-center">Plus</th></tr></thead>
          <tbody>
            <tr className="border-b border-border"><td className="py-2">Browse, join, chat, make friends</td><td className="text-center"><Check className="mx-auto h-4 w-4 text-grass" /></td><td className="text-center"><Check className="mx-auto h-4 w-4 text-grass" /></td></tr>
            <tr className="border-b border-border"><td className="py-2">Saved alerts</td><td className="text-center text-xs">2</td><td className="text-center text-xs">Unlimited</td></tr>
            <tr className="border-b border-border"><td className="py-2">Create groups and communities</td><td className="text-center text-xs">3</td><td className="text-center text-xs">Unlimited</td></tr>
            {PLUS_FEATURES.filter((f) => f.name !== "Unlimited saved alerts").map((f) => (
              <tr key={f.name} className="border-b border-border"><td className="py-2">{f.name}{!f.ready && <span className="ml-1 text-xs text-muted-foreground">· soon</span>}</td><td className="text-center">{FREE_HAS.has(f.name) ? <Check className="mx-auto h-4 w-4 text-grass" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}</td><td className="text-center"><Check className={`mx-auto h-4 w-4 ${f.ready ? "text-grass" : "text-muted-foreground"}`} /></td></tr>
            ))}
          </tbody>
        </table>
        {!plus && <div className="mt-5"><PlusCheckoutButton label="Get Plus" /></div>}
        <p className="mt-3 text-sm">
          <a href="/pricing" className="font-bold text-tangerine underline">Compare with Juntos Club (€10 / month)</a>
          {" · "}
          <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer" className="underline">Manage subscription</a>
        </p>
        {isAdmin && <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between"><span className="font-bold">Simulate Plus (admin only)</span><Switch aria-label="Simulate Plus" checked={plus} onCheckedChange={setPlus} /></div>
          <p className="mt-1 text-xs text-muted-foreground">Testing switch, visible to admins only.</p>
        </div>}
      </SheetContent>
    </Sheet>
  );
}
