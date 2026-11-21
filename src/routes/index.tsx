import { createFileRoute, Link } from "@tanstack/react-router";
import { Feed } from "./feed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juntos — turn your plans into plus-ones" },
      {
        name: "description",
        content:
          "Making friends as an adult is hard: finding a place, matching schedules and the cost get in the way. On Juntos the plan, the time and a group discount are already set; you just tap Join.",
      },
      { property: "og:title", content: "Juntos — turn your plans into plus-ones" },
      {
        property: "og:description",
        content: "Making friends as an adult is hard: finding a place, matching schedules and the cost get in the way. On Juntos the plan, the time and a group discount are already set; you just tap Join.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

