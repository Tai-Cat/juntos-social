export const PLUS_PAYMENT_LINK = "https://buy.stripe.com/3cI5kDcPR9y9cLEf5V5J600";

export function plusCheckoutUrl(user?: { id?: string; email?: string | null } | null): string {
  const url = new URL(PLUS_PAYMENT_LINK);
  if (user?.email) url.searchParams.set("prefilled_email", user.email);
  if (user?.id) url.searchParams.set("client_reference_id", user.id);
  return url.toString();
}
