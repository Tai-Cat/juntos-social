import { Sparkles } from "lucide-react";
import { PLUS_MONTHLY_EUR } from "@/lib/catalog";
import { PlusCheckoutButton } from "./PlusCheckout";
export function PlusCard() {
  return (
    <div className="genre-ideas rounded-lg border border-border p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <h3 className="text-xl">Juntos Plus</h3>
      </div>
      <p className="mt-1 font-semibold">{PLUS_MONTHLY_EUR} EUR a month</p>
      <p className="my-3 text-sm">Find your level. Beginner company or advanced players.</p>
      <PlusCheckoutButton />
    </div>
  );
}
