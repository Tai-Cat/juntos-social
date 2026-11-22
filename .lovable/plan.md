# Juntos: plan creation, My Activity, admin and coordination

Status of the earlier launch polish: home headline, Pricing, Legal, Terms, Privacy, Contact pages, the footer, Sold-out-only counts and hidden demo switches are built. Still to do: hide the "Edit with Lovable" badge (needs your approval) and run a browser check.

## What I found

- **Price and capacity reset to 0 when cleared.** The new-plan form (`post.tsx`) and Edit plan save these as numbers on every keystroke (`Number(e.target.value)`), so an empty box turns into 0 straight away.
- **The discount is the same for every plan.** It's built into `src/lib/discount.ts` (4+ people = 15% off, 6+ = 25%). Every card, plan page and price shows it, and the price hint repeats it.
- **The public-place checkbox blocks posting.** If it's unticked, the form refuses to submit. The database also only accepts public-place plans, so a "private home" choice needs a database change.
- **"Pick times in the future for every date".** One check covers the main date and every extra date. A main date in the past, or half filled in, shows this misleading "every date" message. Extra dates only exist after tapping "Add another date", and empty ones are ignored. So one valid future date already works; the message is the problem.
- **Plans can't be cancelled.** Plans have no status, so cancelling needs a database change. Join requests can only be pending, approved or declined; a "cancelled" status has to be added.
- **Some building blocks already exist:** a group chat per plan (shown on the plan page), private invites and invite links, friend proposals, photo galleries, calendar ICS files, and a people search in the Friends panel.

## Phase 1: changes that need no database work (first batch)

1. **Number fields:** price and capacity are kept as text while typing and checked only on Post or Save. If untouched, they keep 6 and 0. Clear messages appear next to the field. This applies to both Post and Edit plan.
2. **Free or Has a cost:** a two-choice switch comes first. Choosing Free hides the price and saves 0. Choosing Has a cost shows the price per person. The fixed "4+ / 6+" hint is removed from the form. Card and page discount displays stay as they are until Phase 2, so existing plans don't change.
3. **Address wording:** the label becomes "Meet-up address and directions", with the lock note kept. Storage, the 2-hour unlock and the public area-only display don't change.
4. **Venue type:** the blocking checkbox is removed. An optional "Venue type" picker moves near the top: Public space or Partner venue. "Private home" is held back until you decide on it (see Decisions).
5. **Dates:** separate checks for the main date ("Pick a time in the future") and for each extra date, naming which extra date is wrong. Empty extra rows get removed. A test confirms one future date posts with no extra steps.
6. **"You're hosting" badge** on the cards in Explore, the map mini-card and the plan page, only when the host is the signed-in user. Example plans never get it.
7. **Find friends layout:** the search results move into a scrollable area above the message box. That area is sized to the visible screen, so the phone keyboard can't push the results under the box.
8. **Grouped interests:** on Profile and in My Activity, interests are grouped by category using the shared activity catalogue. Groups are collapsed by default and show a count; tap a group to see its interests and levels.
9. **Help and FAQ:** a new /help page with collapsible questions on creating plans, free vs paid, discounts, visibility and invites, address privacy, cancellations, messaging, calendar, safety and reporting, and reliability and verification. The answers live in one file in the code for now, and the footer links to the page. Admins editing the FAQ themselves is left for later (see Decisions).
10. **Reliability fixes in the touched forms:** the Post and Save buttons are disabled while sending, so double taps can't create duplicates. A loading state and a Retry button are added. Every outcome shows a clear success or error toast. If the address fails to save after the plan is created, the plan is cleaned up or the error says what happened.

## Phase 2: changes that need the database

11. **Host-set discounts.** Each plan gets a list of discount tiers set by its host, stored on the plan.
   - Each tier has a minimum number of people and either a percentage off (1–50%) or a fixed amount off, never more than the price.
   - The database checks the tiers when a plan is saved.
   - Existing plans are copied over with the current 15% / 25% tiers, so their prices stay exactly the same. New plans start with no tiers.
   - `discount.ts` becomes pure helpers that take a plan's tiers, and cards, the plan page and prices all use it. Post and Edit get an optional Discount section with a live preview.
12. **Cancelling plans.**
   - Plans get a status (active or cancelled) plus a cancelled time.
   - A cancel action checks that the person is the host, sets the status, closes joining, and notifies everyone going or pending. Nothing is deleted.
   - Cancelled plans disappear from Explore and alerts but stay visible, marked Cancelled, to the host and attendees.
   - Join requests get a "cancelled" status. A cancel action lets the person who joined withdraw, and the going count updates automatically in the database.
   - Leaving the waiting list removes the saved row.
13. **Venue type field:** stores public space or partner venue, plus private home if you approve it. The old public-place rule stays in place until that decision.
14. **My Activity** replaces the Inbox tab. It has sections for Upcoming and Past (hosting and going), Saved and waiting list, Invitations, Join requests (sent, and received for the plans you host), and Messages. Hosted plans get Edit and Cancel; joined plans get Cancel my spot. The Inbox address keeps working.
15. **Admin overview of all plans** at /admin/plans, visible only to app admins.
   - A protected database function returns every plan with privacy-safe details: title, city, area, date, host first name, visibility, status, going/capacity and example flag. Exact addresses and private participant lists are never included.
   - Filters by city or country, status and date. Actions: open the plan, and cancel it (using the admin version of cancel).
   - Non-admins are refused by the database itself, not just by hiding the page.

## Phase 3: plan together (separate feature)

Already there and reused: invites and invite links, the private chat for each plan, private photo galleries, and calendar ICS files.

What's new:
- **Plan together draft:** a host creates a plan with candidate places (area and venue name only) and candidate times, then invites friends with the existing invites.
- **Voting:** invitees vote on options. Only invitees can see the draft, enforced in the database, and the usual block checks apply.
- **Finalise:** the host picks the winning place and time. That turns the draft into a normal private plan and adds the voters as invited people. The plan's chat and photos then work as they do today.
- **Add to calendar:** a button on every plan page, using the existing calendar module. This small piece can ship in Phase 1.

## Tests to add or update
- Discount helpers: host-set tiers, a percentage cap, a fixed amount never taking the price below zero, no tiers meaning no discount, and old plans keeping 15% / 25%.
- Form checks: clearing and retyping a number, Free saving 0, one future date passing, a past main date showing the right message, and an empty extra date being ignored.
- "You're hosting" logic, interest grouping by category, and the order of the FAQ topics.
- Database: only the host can cancel, cancelling notifies people, and non-admins are refused by the admin plans function.

## Decisions needed
- **Private home as a venue type:** this would remove the current public-place-only safety rule. Keep it at Public space and Partner venue for now?
- **FAQ storage:** a file in the code is simple. An admin editing screen needs a new database table and a small editor.
- **Plan together:** Phase 3 is a bigger feature. It's worth confirming it comes after Phases 1 and 2.

## Technical notes
- New database fields are added without removing anything, and old pricing is copied over so nothing changes. Discount, status and permission rules are enforced in the database, not just in the app.
- Existing protections stay as they are: addresses only through the timed unlock, private plans hidden from people who shouldn't see them, block checks, and the audience and host-tool rules.
