// EMAIL ALERTS (off): join-request emails to owners/admins are intentionally not sent because the
// project has no verified email sender domain yet. To switch on later: set up an email domain,
// scaffold app-email templates, add a "join-request" template (requester name, answer, Approve link to
// /organisation-admin/<orgId>) and call sendTemplateEmail for each admin inside notifyOrgAdmins below.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VAPID_PUBLIC_KEY = "BJgrBgVlUHbpuO77wagcQL3u2-9XzpBmKomsneyIOvkeKk4bqeBiXp8n2CHi5KmD4cdsgxHuO7rBxkjPDuuPefI";

/**
 * After someone asks to join (or auto-joins) an organisation, push a phone notification
 * to its owners and admins. Only the requester's own, real request can trigger it.
 */
export const notifyOrgAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orgId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: req } = await context.supabase.from("organisation_requests").select("status,answer").eq("organisation_id", data.orgId).eq("user_id", context.userId).maybeSingle();
    if (!req) return { sent: 0 };
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    if (!privateKey) return { sent: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: org } = await supabaseAdmin.from("organisations").select("id,name,parent_id").eq("id", data.orgId).single();
    if (!org) return { sent: 0 };
    const { data: me } = await supabaseAdmin.from("profiles").select("name").eq("id", context.userId).single();
    const orgIds = [org.id, org.parent_id].filter((x): x is string => !!x);
    const { data: admins } = await supabaseAdmin.from("organisation_members").select("user_id").in("organisation_id", orgIds).in("role", ["owner", "admin"]);
    const ids = [...new Set((admins ?? []).map((a) => a.user_id))].filter((id) => id !== context.userId);
    if (!ids.length) return { sent: 0 };
    const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("*").in("user_id", ids);
    const { buildPushPayload } = await import("@block65/webcrypto-web-push");
    const who = (me?.name ?? "Someone").split(" ")[0];
    const body = req.status === "pending" ? `${who} asked to join ${org.name}. ${req.answer.slice(0, 120)}` : `${who} joined ${org.name} (auto-approved).`;
    let sent = 0;
    for (const s of subs ?? []) {
      try {
        const payload = await buildPushPayload({ data: JSON.stringify({ title: "Juntos: join request", body, url: `/organisation-admin/${org.id}` }), options: { ttl: 86400 } }, { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } }, { subject: "mailto:hello@juntos-social.lovable.app", publicKey: VAPID_PUBLIC_KEY, privateKey });
        const res = await fetch(s.endpoint, payload);
        if (res.status === 404 || res.status === 410) await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        else if (res.ok) sent++;
      } catch (e) { console.error("push failed", e); }
    }
    return { sent };
  });
