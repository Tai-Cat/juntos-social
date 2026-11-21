import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook: turns membership on when a Payment Link checkout completes and
 * off when the subscription ends. No Stripe API key is needed.
 *
 * Setup: Stripe Dashboard > Developers > Webhooks > endpoint
 *   https://juntos-social.lovable.app/api/public/stripe-webhook
 *   events: checkout.session.completed, customer.subscription.deleted
 * then add its signing secret to Lovable Secrets as STRIPE_WEBHOOK_SECRET.
 *
 * Which tier: the Club link costs 10 EUR, Plus 5 EUR (amount_total in cents).
 * The Stripe customer id and tier are kept in the user's app_metadata so a later
 * cancellation can be matched back to the account.
 */

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

/** Verifies the Stripe-Signature header (HMAC-SHA256 of "t.body"), allowing 5 minutes of clock skew. */
async function verify(body: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${body}`)));
  return sigs.some((s) => s.length === expected.length && s.split("").reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });
        const body = await request.text();
        if (!(await verify(body, request.headers.get("stripe-signature"), secret))) return new Response("Bad signature", { status: 400 });

        const event = JSON.parse(body) as StripeEvent;
        const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
        const o = event.data.object;

        const findUser = async (match: (u: { id: string; email?: string; app_metadata: Record<string, unknown> }) => boolean) => {
          for (let page = 1; page <= 20; page++) {
            const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
            const users = data?.users ?? [];
            const hit = users.find((u) => match(u as never));
            if (hit) return hit;
            if (users.length < 200) break;
          }
          return null;
        };
        const notifyAdmins = async (title: string) => {
          const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
          if (admins?.length) await admin.from("notifications").insert(admins.map((a) => ({ user_id: a.user_id, title, kind: "membership", link: "/profile" })));
        };

        if (event.type === "checkout.session.completed") {
          const email = ((o["customer_details"] as { email?: string } | null)?.email ?? (o["customer_email"] as string | null) ?? "").toLowerCase();
          const ref = (o["client_reference_id"] as string | null) ?? "";
          const customer = (o["customer"] as string | null) ?? null;
          const tier = Number(o["amount_total"] ?? 0) >= 1000 ? "club" : "plus";
          // One-off "1 month, no renewal" links arrive as mode "payment": the pass runs 30 days.
          const oneOff = o["mode"] === "payment";
          const until = oneOff ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
          const label = tier === "club" ? "Juntos Club" : "Juntos Plus";
          let user = /^[0-9a-f-]{36}$/.test(ref) ? (await admin.auth.admin.getUserById(ref)).data.user : null;
          if (!user && email) user = (await findUser((u) => (u.email ?? "").toLowerCase() === email)) as typeof user;
          // Paid without an account (e.g. a checkout link shared outside the app):
          // create the account for that email and send them an invite to finish signing up.
          if (!user && email) {
            const origin = new URL(request.url).origin;
            const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${origin}/auth/callback`,
              data: { name: ((o["customer_details"] as { name?: string } | null)?.name ?? "").slice(0, 80) },
            });
            if (invited?.user) user = invited.user;
            else console.error("invite after payment failed", inviteErr?.message);
            if (user) await notifyAdmins(`${label} payment from ${email}: no account existed, so one was created and an invite email was sent.`);
          }
          if (!user) {
            await notifyAdmins(`${label} payment from ${email || "unknown email"}: couldn't create an account automatically. Turn it on when they sign up.`);
            return Response.json({ received: true, matched: false });
          }
          await admin.from("user_settings").upsert({ user_id: user.id, demo_plus: true });
          await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, stripe_customer: customer ?? user.app_metadata?.["stripe_customer"] ?? null, membership: tier, membership_until: until } });
          await admin.from("notifications").insert({ user_id: user.id, title: until ? `Welcome to ${label}! Your one-month pass runs until ${until.slice(0, 10)} and won't renew.` : `Welcome to ${label}! Your membership is active and renews monthly.`, kind: "membership", link: "/profile" });
          await notifyAdmins(`New ${label} member${until ? " (1-month pass, no renewal)" : " (monthly)"}: ${email || user.email}`);
          return Response.json({ received: true, matched: true });
        }

        if (event.type === "customer.subscription.deleted") {
          const customer = o["customer"] as string | null;
          if (!customer) return Response.json({ received: true });
          const user = await findUser((u) => u.app_metadata?.["stripe_customer"] === customer);
          if (user) {
            await admin.from("user_settings").upsert({ user_id: user.id, demo_plus: false });
            await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, membership: null, membership_until: null } });
            await admin.from("notifications").insert({ user_id: user.id, title: "Your Juntos membership has ended. You can rejoin any time from Pricing.", kind: "membership", link: "/pricing" });
            await notifyAdmins(`Membership cancelled: ${user.email}`);
          }
          return Response.json({ received: true, matched: !!user });
        }

        return Response.json({ received: true, ignored: event.type });
      },
    },
  },
});
