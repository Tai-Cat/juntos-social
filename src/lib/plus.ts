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

/** One month, paid once, no renewal (Stripe one-off Payment Links). */
export const PLUS_ONCE_LINK = "https://buy.stripe.com/7sY14nbLNbGhbHAg9Z5J602";
export const CLUB_ONCE_LINK = "https://buy.stripe.com/3cIbJ12bddOpfXQ2j95J603";

/** Adds the signed-in person's email and id so the payment is matched to their account. */
export function withUser(link: string, user?: { id?: string; email?: string | null } | null): string {
  const url = new URL(link);
  if (user?.email) url.searchParams.set("prefilled_email", user.email);
  if (user?.id) url.searchParams.set("client_reference_id", user.id);
  return url.toString();
}

/** One-month passes end on their own: true while there is no end date or it is still ahead. */
export function membershipCurrent(appMetadata?: Record<string, unknown> | null): boolean {
  const until = appMetadata?.["membership_until"];
  return typeof until !== "string" || new Date(until).getTime() > Date.now();
}
