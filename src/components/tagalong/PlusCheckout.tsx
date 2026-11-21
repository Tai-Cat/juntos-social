import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLUS_PAYMENT_LINK } from "@/lib/plus";
import { PayLink } from "./PayLink";

export function PlusCheckoutButton({ label = "Get Plus" }: { label?: string }) {
  return (
    <div>
      <Button asChild className="w-full">
        <PayLink href={PLUS_PAYMENT_LINK}>
          <Crown />
          {label} · €5 / month
        </PayLink>
      </Button>
      <p className="mt-1 text-xs text-muted-foreground">Renews monthly; cancel anytime. Benefits switch on as soon as the payment goes through.</p>
    </div>
  );
}
