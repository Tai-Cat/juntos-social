import { aiImage, placeholderImage } from "./placeholder";

/** Common alternate spellings map to one canonical activity across filters, interests and older plans. */
const ACTIVITY_ALIASES: Record<string, string> = {
  "bird watching": "birdwatching",
  "book clubs": "book club",
  "book discussion": "book club",
  "ceramics": "pottery",
  "chess in the park": "chess",
  "languages and language exchange": "language exchange",
  "open mic nights": "open mic",
  "park picnics": "picnics",
  "pub quizzes": "pub quiz",
  "trivia and pub quiz": "pub quiz",
};

export function normalizeActivity(value: string): string {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, " ");
  return ACTIVITY_ALIASES[normalized] ?? normalized;
}

export const GENRES = [
  {
    id: "active",
    label: "Active and Sports",
    photo: "tennis",
    items:
      "tennis|padel|swimming|golf|running|climbing and bouldering|yoga|pilates|cycling|football|basketball|volleyball|hiking|surfing|skiing|martial arts|boxing|dance classes|rowing|ice skating|pickleball|table tennis|gym",
  },
  {
    id: "food",
    label: "Food and Drink",
    photo: "food",
    items:
      "coffee|matcha|tea|wine tasting|champagne evenings|gin evenings|cocktails|craft beer|whisky|cooking together|baking classes|cooking classes|dinner parties|eating out|brunch|street food crawls|supper clubs|ramen|pizza making|chocolate tasting|cheese and charcuterie",
  },
  {
    id: "arts",
    label: "Arts and Culture",
    photo: "pottery",
    items:
      "photography|museums|galleries|pottery|painting|drawing|life drawing|poetry evenings|open mic|live music|jazz|vinyl listening|theatre|cinema and film clubs|book club|comedy|architecture walks|fashion and thrifting|knitting and crafts|calligraphy|creative writing",
  },
  {
    id: "tech",
    label: "Tech and Business",
    photo: "tech",
    items:
      "AI|coding|hackathons|hacking and security|startups|founders|product|investing|crypto|finance|marketing|design|side projects|public speaking|networking",
  },
  {
    id: "ideas",
    label: "Ideas and Learning",
    photo: "learning",
    items:
      "philosophy|history|politics and debate|psychology|science|language exchange|economics|sustainability|spirituality",
  },
  {
    id: "outdoors",
    label: "Outdoors and Chill",
    photo: "park",
    items:
      "dog walks|picnics|markets|laundry runs|co-working|library sessions|gardening|birdwatching|sunrise swims|stargazing",
  },
  {
    id: "social",
    label: "Social and Games",
    photo: "games",
    items:
      "board games|pub quiz|karaoke|poker night|chess|video games|escape rooms|bowling",
  },
  {
    id: "wellness",
    label: "Wellness",
    photo: "wellness",
    items: "meditation|sauna and cold plunge|breathwork|wellness walks",
  },
] as const;
export const EXTRA_ACTIVITIES = ["sourdough baking", "rock pools", "board game cafes", "run clubs", "thrifting", "urban sketching", "silent disco", "wild swimming", "foraging", "film photography", "printmaking", "linocut", "embroidery", "flower arranging", "candle making", "fermentation", "pasta making", "dumpling making", "coffee cupping", "kombucha brewing", "roller skating", "pétanque", "disc golf", "orienteering", "geocaching", "trail running", "bicycle repair", "repair cafes", "community gardening", "beach cleanups", "improv", "storytelling", "swing dancing", "salsa", "astronomy", "puzzle swaps", "zine making"];
export const ACTIVITIES = [...new Set([...GENRES.flatMap((g) => g.items.split("|")), ...EXTRA_ACTIVITIES].map(normalizeActivity))].sort((a,b) => a.localeCompare(b));
export const LEVELS = ["any", "beginner", "intermediate", "advanced"] as const;
export const PLUS_MONTHLY_EUR = 5;
export function canUseLevel(plus: boolean, level: string) {
  return level === "" || level === "any" || plus;
}
export const CITY_SUGGESTIONS: Record<string, string[]> = {
  Paris: ["wine caves", "jazz clubs in the Latin Quarter", "flea markets", "Seine picnics"],
  London: ["pub quizzes", "supper clubs", "Sunday roasts"],
  "New York": ["rooftop sessions", "Central Park runs", "comedy cellars"],
};
export function genreOf(activity: string) {
  const key = normalizeActivity(activity);
  return (
    GENRES.find((g) => g.items.toLowerCase().split("|").includes(key))?.id ??
    (/wine|ramen|dinner|food|drink|coffee|brunch|roast|supper/.test(key)
      ? "food"
      : /climb|sport|run|tennis|swim/.test(key)
        ? "active"
        : /pottery|culture|jazz|museum|music|comedy/.test(key)
          ? "arts"
          : "outdoors")
  );
}
export function imageFor(activity: string, genre: string = genreOf(activity)) {
  return activity.trim() ? aiImage("interest", activity) : placeholderImage(GENRES.some((g) => g.id === genre) ? genre : genreOf(activity), activity);
}
export const CITIES = [
  "Paris, France",
  "Lyon, France",
  "Marseille, France",
  "London, United Kingdom",
  "Manchester, United Kingdom",
  "Edinburgh, United Kingdom",
  "New York, United States",
  "Los Angeles, United States",
  "San Francisco, United States",
  "Chicago, United States",
  "Miami, United States",
  "Toronto, Canada",
  "Vancouver, Canada",
  "Montreal, Canada",
  "Lisbon, Portugal",
  "Porto, Portugal",
  "Rome, Italy",
  "Milan, Italy",
  "Florence, Italy",
  "Barcelona, Spain",
  "Madrid, Spain",
  "Berlin, Germany",
  "Munich, Germany",
  "Amsterdam, Netherlands",
  "Brussels, Belgium",
  "Copenhagen, Denmark",
  "Stockholm, Sweden",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Vienna, Austria",
  "Prague, Czechia",
  "Warsaw, Poland",
  "Budapest, Hungary",
  "Athens, Greece",
  "Istanbul, Türkiye",
  "Zurich, Switzerland",
  "Dublin, Ireland",
  "Reykjavik, Iceland",
  "Tokyo, Japan",
  "Kyoto, Japan",
  "Seoul, South Korea",
  "Beijing, China",
  "Shanghai, China",
  "Hong Kong, China",
  "Singapore, Singapore",
  "Bangkok, Thailand",
  "Hanoi, Vietnam",
  "Mumbai, India",
  "Delhi, India",
  "Dubai, United Arab Emirates",
  "Tel Aviv, Israel",
  "Cape Town, South Africa",
  "Nairobi, Kenya",
  "Marrakesh, Morocco",
  "Cairo, Egypt",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Auckland, New Zealand",
  "Mexico City, Mexico",
  "São Paulo, Brazil",
  "Rio de Janeiro, Brazil",
  "Buenos Aires, Argentina",
  "Lima, Peru",
  "Bogotá, Colombia",
  "Fontainebleau, France",
  "Avon, France",
  "Melun, France",
  "Versailles, France",
  "Bordeaux, France",
  "Toulouse, France",
  "Lille, France",
  "Nantes, France",
  "Nice, France",
  "Braga, Portugal",
  "Seville, Spain",
  "Valencia, Spain",
  "Geneva, Switzerland",
  "Abu Dhabi, United Arab Emirates",
];
export const cityName = (value: string) => value.split(",")[0]?.trim() || value;
export function cityImage(city: string) {
  return city.trim() ? aiImage("city", city) : placeholderImage("place");
}
export function countryFlag(country: string) {
  const code: Record<string, string> = {
    France: "FR",
    Portugal: "PT",
    Italy: "IT",
    Spain: "ES",
    "United Kingdom": "GB",
    "United States": "US",
    Germany: "DE",
    Japan: "JP",
    Canada: "CA",
    Australia: "AU",
  };
  return (code[country] ?? "")
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
export const genreClass = (genre: string) => `genre-${genre}`;
export const activityLabel = (activity: string) => {
  const canonical = normalizeActivity(activity);
  return canonical === "ai" ? "AI" : canonical;
};
