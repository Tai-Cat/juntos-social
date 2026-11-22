import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tagalong/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help & FAQs — Juntos" },
    { name: "description", content: "Answers about creating plans, privacy, costs, cancellations and safety on Juntos." }
  ] }),
  component: HelpPage,
});

const topics = [
  { title: "Creating a plan", items: [
    ["How do I create a plan?", "Choose Post, add a title and activity, set one future date and time, choose how many people can attend, and add the public area and private meet-up details. You can add more dates only when you need them."],
    ["Can I create a private event?", "Yes. Choose Private home / private venue as the venue type, and choose the visibility that fits your invitation. Private-venue plans require host approval for every attendee."],
    ["Can I edit a plan after posting?", "Open the plan and choose Edit plan. Some details may be restricted once people have joined or the plan has started."]
  ]},
  { title: "Costs and discounts", items: [
    ["Can a plan be free?", "Yes. Choose Free at the top of the cost section. The price field and discounts are not needed for a free plan."],
    ["How do group discounts work?", "A host can add up to five group-discount tiers to a paid plan. Each tier sets a minimum number of people and either a percentage off or a fixed amount off. The displayed price updates as the group reaches a tier. A host can leave the section empty for no discount."],
    ["Does Juntos collect the payment?", "The estimated per-person price is information shown on the plan. Check the plan details or ticket link for the host's payment arrangements; do not assume an in-app payment has been collected."]
  ]},
  { title: "Visibility, invitations and address privacy", items: [
    ["Who can see my plan?", "Public plans appear in public discovery. Friends and groups plans are limited to the relevant connections or community. Anyone with the link plans are hidden from public discovery and require the link."],
    ["How do I invite friends?", "Open a plan and use Invite friends or Share plan link. The invite link can be shared directly with the people you want to bring."],
    ["Who can see the exact meet-up address?", "The neighbourhood or public area is shown on the plan. The exact address is stored separately and is not part of the public plan record. Hosts can see it; approved attendees receive it through the app's address-unlock rules, normally two hours before the start."]
  ]},
  { title: "My Activity, cancellations and messaging", items: [
    ["Where can I find my plans?", "My Activity brings together plans you're hosting, plans you're joining, saved plans, invitations, requests, notifications and conversations."],
    ["How do I cancel a plan I host?", "Open your plan and choose Cancel plan, or use the cancellation action in My Activity. The plan is marked cancelled rather than deleted, and people with active requests or approved places are notified."],
    ["How do I cancel my place?", "Open the plan or find it under Plans you're joining in My Activity and choose Cancel my place. Your request history is retained with a cancelled status."],
    ["Can I message another member?", "Yes. Open a member's profile or an existing conversation to send a direct message. Do not share private addresses in a message when the plan's address-unlock flow is available."]
  ]},
  { title: "Calendar, photos and planning together", items: [
    ["Can I add a plan to my calendar?", "Open the plan and choose Calendar. Juntos downloads a calendar file that you can import into your preferred calendar app."],
    ["Can I add photos?", "Hosts can add photos to the plan gallery. Plan photos are stored privately and access is controlled through the plan's permissions."],
    ["Can friends help choose a time and place?", "For a one-to-one idea, use Hang again / Make a little plan to send a private proposal with an activity and a time window. The recipient can accept or suggest another time. For an existing plan, invite friends and use the members-only group chat to coordinate, share photos and use the Calendar button. A shared voting board for choosing between several venues and exact time options is not available yet."]
  ]},
  { title: "Safety, reliability and verification", items: [
    ["What does the reliability score mean, and how can I keep it high?", "The score currently reflects recorded no-shows. A host can mark an approved attendee as a no-show after the plan has started; this adds a no-show to the attendee's count and reduces their reliability score by 15 points. The current system does not automatically add points back for attending, so the best way to protect your score is to attend plans you confirm or cancel early when you can no longer go. Contact Juntos support if you believe a no-show was recorded incorrectly."],
    ["What does verification mean?", "Verification is an optional profile badge. It is separate from the adult age confirmation required to host and does not replace good judgement when meeting someone."],
    ["How do I report or block someone?", "Use the Safety menu on a member or plan. Blocking and reporting help protect your experience; never feel obliged to attend a plan that makes you uncomfortable."],
    ["What should I do if something goes wrong?", "Use the Safety menu where possible and contact the Juntos team through the Contact page. For immediate danger, contact local emergency services."]
  ]}
];

function HelpPage() {
  return <AppShell title="Help & FAQs">
    <div className="max-w-3xl">
      <p className="eyebrow">Juntos support</p><h1 className="mt-2 text-4xl">Help & FAQs</h1>
      <p className="mt-3 text-sm text-muted-foreground">Practical answers about making plans, meeting safely and managing your activity. We’ll keep expanding this guide as Juntos grows.</p>
      <div className="mt-7 space-y-5">
        {topics.map(topic => <section id={topic.title === "Safety, reliability and verification" ? "reliability" : undefined} key={topic.title}>
          <h2 className="mb-2 text-xl font-semibold">{topic.title}</h2>
          <div className="space-y-2">{topic.items.map(([question, answer]) => <details key={question} className="rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </details>)}</div>
        </section>)}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Still stuck? Visit <a className="font-semibold text-tangerine underline" href="/contact">Contact</a> and tell us what happened, which page you were on and what you expected to happen. Never send passwords or private account codes.</p>
    </div>
  </AppShell>;
}
