import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { plusCheckoutUrl } from "@/lib/plus";

export function PlusCheckoutButton({ label = "Get Plus" }: { label?: string }) {
  const { user } = useSession();
  return (
    <div>
      <Button asChild className="w-full">
        <a href={plusCheckoutUrl(user)} target="_blank" rel="noopener noreferrer">
          <Crown />
          {label} · €5 / month
        </a>
      </Button>
      <p className="mt-1 text-xs text-muted-foreground">Renews monthly; cancel anytime. Benefits switch on as soon as the payment goes through.</p>
    </div>
  );
}
