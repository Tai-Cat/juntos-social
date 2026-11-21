export const PLUS_PAYMENT_LINK = "https://buy.stripe.com/3cI5kDcPR9y9cLEf5V5J600";

export function plusCheckoutUrl(user?: { id?: string; email?: string | null } | null): string {
  const url = new URL(PLUS_PAYMENT_LINK);
  if (user?.email) url.searchParams.set("prefilled_email", user.email);
  if (user?.id) url.searchParams.set("client_reference_id", user.id);
  return url.toString();
}

/** Juntos Club, the €10/month tier above Plus. */
export const CLUB_PAYMENT_LINK = "https://buy.stripe.com/bJe6oH179h0BaDwg9Z5J601";

export function clubCheckoutUrl(user?: { id?: string; email?: string | null } | null): string {
  const url = new URL(CLUB_PAYMENT_LINK);
  if (user?.email) url.searchParams.set("prefilled_email", user.email);
  if (user?.id) url.searchParams.set("client_reference_id", user.id);
  return url.toString();
}

/** What Club adds on top of Plus. */
export const CLUB_PERKS = [
  "Featured plans: yours show first in Explore",
  "Bring up to 2 guests to any plan",
  "Unlimited groups and communities",
  "Early access to Travel matches",
  "Club badge on your profile",
] as const;

/** Stripe customer portal: members sign in with their email to change or cancel. */
export const MANAGE_SUBSCRIPTION_LINK = "https://billing.stripe.com/p/login/3cI5kDcPR9y9cLEf5V5J600";
