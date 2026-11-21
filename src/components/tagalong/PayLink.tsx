import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useSession } from "@/hooks/use-auth";
import { useAuthAction } from "./AuthSheet";
import { withUser } from "@/lib/plus";

/**
 * Link to a Stripe Payment Link that only works for signed-in people.
 * Signed out: a tap opens sign-up/sign-in first, then continues to checkout with the
 * account's email and id attached, so every payment is tied to a Juntos account.
 * (The href still names the checkout so the page shows where the button leads.)
 */
export function PayLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const { user } = useSession();
  const auth = useAuthAction();
  if (user) {
    return (
      <a href={withUser(href, user)} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        auth((account: User) => {
          window.location.href = withUser(href, account);
        }, "become a member");
      }}
    >
      {children}
    </a>
  );
}
