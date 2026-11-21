import { createFileRoute, Link } from "@tanstack/react-router";
import { Feed } from "./feed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tagalong — turn your plans into plus-ones" },
      {
        name: "description",
        content:
          "Meet people in real life by joining plans they're already doing, at home or while travelling.",
      },
      { property: "og:title", content: "Tagalong — turn your plans into plus-ones" },
      {
        property: "og:description",
        content: "Turn your plans into plus-ones, and venues' empty slots into full tables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

