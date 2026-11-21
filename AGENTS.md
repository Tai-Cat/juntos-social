<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Exact venue addresses live in `plan_addresses` (host-only RLS); joiners read them only via the `get_plan_address` RPC, which enforces the 2-hours-before unlock. Why: the address must never leak through the public `plans` table.
- Self-described gender lives in `profile_private` (owner-only RLS), never in `profiles`. Why: profiles are readable by all signed-in users.
- Join eligibility, auto-approval and going counts are enforced by DB triggers on `join_requests`, not client code. Why: the client can't be trusted for audience restrictions.
- The "whats-on" Tavily search is a TanStack server function (`src/lib/whats-on.functions.ts`), not a Supabase edge function. Why: this stack uses createServerFn for app-internal server logic.
- Discount tiers live in `src/lib/discount.ts` with tests. Why: one source for card copy and pricing.
- Activity catalogue and image lookup are shared client-safe modules; reuse them in onboarding, filters, posting and profiles so categories stay consistent.
- Demo Plus is persisted in owner-only settings; a database trigger verifies it when a poster sets a required level so client controls cannot bypass the gate.
- Saved alert matching and notification creation run in database triggers, using the saved timezone so plans posted outside the app also generate alerts.
- Direct messages use participant-only RLS and bidirectional block checks, with lifecycle-scoped Realtime subscriptions so blocked users cannot read or send messages.
- Email confirmation returns to a public callback before entering onboarding; authenticated pages must not be used as confirmation callbacks because sessions hydrate after the redirect.
- Public browsing routes live outside the authentication layout; safe host summaries use a narrow RPC rather than exposing profiles to visitors. Why: browsing must not expose private profile fields.
- Custom activities are normalized and registered by a plan-write trigger. Why: all posting paths share one de-duplicated catalogue.
- Friend responses, invite RSVPs, proposal acceptance and profile sharing use participant-scoped RPCs and block checks. Why: clients cannot authorize social access.
- Private plans are excluded by RLS and alert/friend/share queries; proposals record explicit participants. Why: privacy must hold outside the app UI.
- Free alert limits and advanced host gates are enforced by database triggers with per-owner locking. Why: concurrent requests cannot bypass membership limits.
- Maps consume only approximate area coordinates and dynamically import Leaflet after hydration. Why: exact addresses stay private and SSR remains browser-safe.
- Fictional social examples live separately from real friendships and invites. Why: example actions must never impersonate real users.
- Persistent account-action intents are schema-validated and replayed only after onboarding and required age checks; database rules still authorize each write. Why: confirmation and verification must not lose a visitor's action.
- Organisation roles and hashed passphrases are separate protected data, and restricted plans use narrow teaser RPCs. Why: membership must not expose full details or allow client-assigned admin privileges.
- Calendar recurrence and ICS use a shared calendar module; suggested/saved events never mark someone busy. Why: all views and free-time calculations must agree.
- Uploaded plan galleries use private storage references and signed URLs authorized against the caller's RLS-visible plan. Why: restricted event media must not make its storage bucket public.
