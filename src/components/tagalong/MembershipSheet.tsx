import { BillingActions } from "./BillingActions";
import { BenefitsCompare } from "./BenefitsCompare";
import { MANAGE_SUBSCRIPTION_LINK } from "@/lib/plus";
import { Crown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePlus } from "@/hooks/use-plus";
import { useIsAppAdmin } from "@/hooks/use-app-config";
import { PlusCheckoutButton } from "./PlusCheckout";
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
        <div className="mt-5"><BenefitsCompare tiers={["free", "plus"]} /></div>
        {!plus && <div className="mt-5"><PlusCheckoutButton label="Get Plus" /></div>}
        <p className="mt-3 text-sm">
          <a href="/pricing" className="font-bold text-tangerine underline">Compare with Juntos Club (€10 / month)</a>
          {" · "}
          <a href={MANAGE_SUBSCRIPTION_LINK} target="_blank" rel="noopener noreferrer" className="underline">Manage subscription</a>
        </p>
        <BillingActions />
        {isAdmin && <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between"><span className="font-bold">Simulate Plus (admin only)</span><Switch aria-label="Simulate Plus" checked={plus} onCheckedChange={setPlus} /></div>
          <p className="mt-1 text-xs text-muted-foreground">Testing switch, visible to admins only.</p>
        </div>}
      </SheetContent>
    </Sheet>
  );
}
