import { PHOTOS } from "./media";
export const GENRES = [
  {
    id: "active",
    label: "Active and sports",
    photo: "tennis",
    items:
      "tennis|padel|swimming|golf|running|climbing and bouldering|yoga|pilates|cycling|football|basketball|volleyball|hiking|surfing|skiing|martial arts|boxing|dance classes|rowing|ice skating|pickleball|table tennis|gym",
  },
  {
    id: "food",
    label: "Food and drink",
    photo: "food",
    items:
      "coffee|matcha|tea|wine tasting|champagne evenings|gin evenings|cocktails|craft beer|whisky|cooking together|baking classes|cooking classes|dinner parties|eating out|brunch|street food crawls|supper clubs|ramen|pizza making|chocolate tasting|cheese and charcuterie",
  },
  {
    id: "arts",
    label: "Arts and culture",
    photo: "pottery",
    items:
      "photography|museums|galleries|pottery|painting|drawing|life drawing|poetry evenings|open mic|live music|jazz|vinyl listening|theatre|cinema and film clubs|book clubs|comedy|architecture walks|fashion and thrifting|knitting and crafts|calligraphy|creative writing",
  },
  {
    id: "tech",
    label: "Tech and business",
    photo: "tech",
    items:
      "AI|coding|hackathons|hacking and security|startups|founders|product|investing|crypto|finance|marketing|design|side projects|public speaking|networking",
  },
  {
    id: "ideas",
    label: "Ideas and learning",
    photo: "learning",
    items:
      "philosophy|history|politics and debate|psychology|science|languages and language exchange|book discussion|economics|sustainability|spirituality",
  },
  {
    id: "outdoors",
    label: "Outdoors and chill",
    photo: "park",
    items:
      "dog walks|park picnics|markets|laundry runs|co-working|library sessions|gardening|birdwatching|sunrise swims|stargazing",
  },
  {
    id: "social",
    label: "Social and games",
    photo: "games",
    items:
      "board games|trivia and pub quiz|karaoke|poker night|chess|video games|escape rooms|bowling",
  },
  {
    id: "wellness",
    label: "Wellness",
    photo: "wellness",
    items: "meditation|sauna and cold plunge|breathwork|wellness walks",
  },
] as const;
export const EXTRA_ACTIVITIES = ["sourdough baking", "ceramics", "rock pools", "bird watching", "board game cafes", "chess in the park", "language exchange", "run clubs", "thrifting", "urban sketching", "open mic nights", "pub quiz", "book club", "silent disco", "wild swimming", "foraging", "film photography", "printmaking", "linocut", "embroidery", "flower arranging", "candle making", "fermentation", "pasta making", "dumpling making", "coffee cupping", "kombucha brewing", "roller skating", "pétanque", "disc golf", "orienteering", "geocaching", "trail running", "bicycle repair", "repair cafes", "community gardening", "beach cleanups", "improv", "storytelling", "swing dancing", "salsa", "astronomy", "puzzle swaps", "zine making"];
export const ACTIVITIES = [...new Set([...GENRES.flatMap((g) => g.items.split("|")), ...EXTRA_ACTIVITIES])].sort((a,b) => a.localeCompare(b));
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
  const key = activity.toLowerCase();
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
  const a = activity.toLowerCase();
  const specific: Record<string, string> = {
    ramen: "ramen",
    tennis: "tennis",
    padel: "tennis",
    running: "running",
    "climbing and bouldering": "climbing",
    climbing: "climbing",
    yoga: "yoga",
    pilates: "yoga",
    swimming: "swimming",
    hiking: "hiking",
    coffee: "coffee",
    matcha: "coffee",
    tea: "coffee",
    "laundry runs": "coffee",
    "co-working": "tech",
    pottery: "pottery",
    museums: "art",
    galleries: "art",
    "dog walks": "dogs",
    photography: "art",
    "book clubs": "books",
    "library sessions": "books",
  };
  const photo =
    specific[a] ??
    (/wine|champagne|gin|cocktail|beer|whisky/.test(a)
      ? "wine"
      : /cook|baking|pizza/.test(a)
        ? "cooking"
        : /jazz|music|karaoke|vinyl/.test(a)
          ? "music"
          : (GENRES.find((g) => g.id === genre)?.photo ?? "park"));
  return PHOTOS[photo] ?? PHOTOS["park"] ?? "";
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
];
export const cityName = (value: string) => value.split(",")[0]?.trim() || value;
export function cityImage(city: string) {
  return PHOTOS[city.toLowerCase().replaceAll(" ", "-")] ?? PHOTOS["paris"] ?? "";
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
