import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/tagalong/AppShell";
import { TextPage } from "@/components/tagalong/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Juntos" },
      { name: "description", content: "What Juntos stores, why, who receives it, and how to delete your account. We never sell your data." },
      { property: "og:title", content: "Privacy — Juntos" },
      { property: "og:description", content: "What Juntos stores, why, who receives it, and how to delete your account. We never sell your data." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://juntos-social.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://juntos-social.lovable.app/privacy" }],
  }),
  component: () => (
    <AppShell>
      <TextPage eyebrow="Privacy" title="Your data on Juntos">
        <h2>What we store</h2>
        <ul>
          <li>Your account: email address and password (stored securely, never readable by us).</li>
          <li>Your profile: name, home city, interests and levels, photos you upload, and privacy settings.</li>
          <li>Private details: date of birth and self-described gender, visible only to you and used for age brackets and plan audience rules.</li>
          <li>Activity: plans you post or join, friends, groups, messages, alerts and notifications.</li>
          <li>Messages you send through the contact form.</li>
          <li>Membership: your plan (Plus or Club) and the Stripe customer reference that links your payment to your account. We never see or store card details.</li>
          <li>If you turn on phone notifications: the push address your browser gives us, so we can send them.</li>
        </ul>
        <h2>Why</h2>
        <p>Only to run Juntos: show you plans, let hosts and guests meet, keep the community safe, and handle Plus membership.</p>
        <h2>Who receives it</h2>
        <ul>
          <li>Lovable hosts the app and Supabase stores the data.</li>
          <li>Stripe handles Plus and Club payments; it receives your email and payment details directly.</li>
          <li>Photos for plans may come from Unsplash; your data is not sent there.</li>
        </ul>
        <h2>Visitor statistics</h2>
        <p>The site counts visits with Lovable's analytics, which uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify you. It records pages visited, where visitors came from, country, browser, operating system, device type, time on page, page speed, errors and clicks. Detailed data is kept for 90 days and daily summaries for a year. Lovable collects this data for us. <a className="underline" href="https://lovable.dev/privacy" target="_blank" rel="noopener noreferrer">Lovable's privacy policy</a> explains how it handles it.</p>
        <h2>On your device</h2>
        <p>Juntos saves a few settings in your browser's local storage so the app works as you expect, for example that you have seen the welcome screen, dismissed the install pop-up, or were in the middle of joining a plan. These are not used for tracking or advertising, and you can clear them in your browser settings.</p>
        <h2>We never sell your data</h2>
        <p>Your data is not sold or shared for advertising.</p>
        <h2>Deleting your account</h2>
        <p>Send a deletion request through the <Link to="/contact" className="font-bold text-tangerine underline">contact form</Link> using your account email. We delete your account and personal data, except what the law requires us to keep (such as payment records).</p>
      </TextPage>
    </AppShell>
  ),
});
