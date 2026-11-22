/** Quick-start templates for Post a plan: typing "dog", "cafe", "run"… suggests these first. */
export type PlanTemplate = {
  title: string;
  activity: string;
  capacity: number;
  duration: number;
  kind: "chill" | "partner_venue";
  description: string;
  keywords?: string;
};

export const PLAN_TEMPLATES: PlanTemplate[] = [
  { title: "Dog walk", activity: "dog walks", capacity: 5, duration: 60, kind: "chill", description: "A relaxed loop with our dogs. Friendly pups and owners welcome.", keywords: "dog puppy park walk" },
  { title: "Coffee and a chat", activity: "coffee", capacity: 4, duration: 60, kind: "chill", description: "Grab a coffee and get to know a few new people.", keywords: "cafe café coffee chat" },
  { title: "Co-working session", activity: "co-working", capacity: 6, duration: 180, kind: "chill", description: "Bring your laptop, focus together, coffee break on the hour.", keywords: "work study laptop cafe" },
  { title: "Study session", activity: "studying", capacity: 6, duration: 120, kind: "chill", description: "Quiet focus with short breaks. Any subject.", keywords: "study exam revision library" },
  { title: "Morning run", activity: "running", capacity: 8, duration: 60, kind: "chill", description: "Easy, chatty pace. No one gets left behind.", keywords: "run jog 5k" },
  { title: "Forest hike", activity: "hiking", capacity: 8, duration: 180, kind: "chill", description: "A half-day walk on marked trails with a picnic stop.", keywords: "hike walk forest trail nature" },
  { title: "Bouldering session", activity: "climbing and bouldering", capacity: 6, duration: 120, kind: "partner_venue", description: "All levels welcome. We'll swap tips and spot each other.", keywords: "climb boulder wall" },
  { title: "Tennis doubles", activity: "tennis", capacity: 4, duration: 90, kind: "chill", description: "Friendly doubles. Court booked, just bring a racket.", keywords: "tennis padel court" },
  { title: "Yoga in the park", activity: "yoga", capacity: 10, duration: 60, kind: "chill", description: "Gentle flow outdoors, all levels.", keywords: "yoga stretch pilates" },
  { title: "Brunch", activity: "brunch", capacity: 6, duration: 120, kind: "partner_venue", description: "Long weekend brunch and good conversation.", keywords: "brunch breakfast eat" },
  { title: "Dinner out", activity: "eating out", capacity: 6, duration: 150, kind: "partner_venue", description: "Trying a new spot together. We split the bill.", keywords: "dinner restaurant food eat" },
  { title: "Wine tasting", activity: "wine tasting", capacity: 8, duration: 120, kind: "partner_venue", description: "A guided tasting, no expertise needed.", keywords: "wine drinks bar" },
  { title: "Board game night", activity: "board games", capacity: 6, duration: 180, kind: "chill", description: "Classics and new favourites. Snacks shared.", keywords: "games board cards" },
  { title: "Book club", activity: "book club", capacity: 8, duration: 90, kind: "chill", description: "We'll chat about this month's pick. Come even if you didn't finish.", keywords: "book read club" },
  { title: "Museum visit", activity: "museums", capacity: 6, duration: 120, kind: "chill", description: "Wander the collection together and grab a coffee after.", keywords: "museum art gallery exhibition" },
  { title: "Architecture walk", activity: "architecture", capacity: 8, duration: 90, kind: "chill", description: "A walk past the area's best buildings with stories along the way.", keywords: "architecture buildings tour city" },
  { title: "Photo walk", activity: "photography", capacity: 8, duration: 120, kind: "chill", description: "Explore and shoot. Phones and cameras both welcome.", keywords: "photo camera" },
  { title: "Bird watching", activity: "bird watching", capacity: 6, duration: 120, kind: "chill", description: "An early, quiet walk to spot local birds.", keywords: "birds nature" },
  { title: "Picnic", activity: "picnics", capacity: 10, duration: 150, kind: "chill", description: "Everyone brings something to share.", keywords: "picnic park lunch" },
  { title: "Market wander", activity: "markets", capacity: 6, duration: 90, kind: "chill", description: "Browse the stalls and taste a few things.", keywords: "market shopping food" },
  { title: "Laundry run + coffee", activity: "laundry runs", capacity: 4, duration: 60, kind: "chill", description: "Turn a chore into a coffee break.", keywords: "laundry errands" },
  { title: "Pottery class", activity: "pottery", capacity: 8, duration: 120, kind: "partner_venue", description: "Hands-on class, beginners welcome.", keywords: "pottery ceramics clay craft" },
  { title: "Cooking together", activity: "cooking together", capacity: 6, duration: 150, kind: "chill", description: "We cook one menu together, then eat it.", keywords: "cook kitchen food" },
  { title: "Language exchange", activity: "language exchange", capacity: 8, duration: 90, kind: "chill", description: "Half in one language, half in the other.", keywords: "language french english exchange" },
  { title: "Bike ride", activity: "cycling", capacity: 8, duration: 120, kind: "chill", description: "A steady ride with a café stop.", keywords: "bike cycle ride" },
  { title: "Swim", activity: "swimming", capacity: 6, duration: 60, kind: "chill", description: "Laps or a dip, your pace.", keywords: "swim pool lake" },
  { title: "Football kickabout", activity: "football", capacity: 12, duration: 90, kind: "chill", description: "Casual 5-a-side, all levels.", keywords: "football soccer five" },
  { title: "Live music", activity: "live music", capacity: 6, duration: 150, kind: "partner_venue", description: "Catching a gig together.", keywords: "music concert gig jam" },
  { title: "Cinema night", activity: "cinema", capacity: 6, duration: 150, kind: "partner_venue", description: "A film and a drink after to talk about it.", keywords: "film movie cinema" },
];

/** Templates whose title, activity or keywords match what's being typed, best matches first. */
export function matchTemplates(q: string, limit = 5): PlanTemplate[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const score = (t: PlanTemplate) => {
    const hay = `${t.title} ${t.activity} ${t.keywords ?? ""}`.toLowerCase();
    if (t.title.toLowerCase().startsWith(s)) return 0;
    if (hay.split(/\s+/).some((w) => w.startsWith(s))) return 1;
    return hay.includes(s) ? 2 : 9;
  };
  return PLAN_TEMPLATES.map((t) => [score(t), t] as const).filter(([n]) => n < 9).sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, t]) => t);
}

/** Activities whose names start with (or contain) the typed text, starting-with first. */
export function matchActivities(all: string[], q: string, limit = 8): string[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const starts = all.filter((a) => a.toLowerCase().startsWith(s) || a.toLowerCase().split(/\s+/).some((w) => w.startsWith(s)));
  const contains = all.filter((a) => !starts.includes(a) && a.toLowerCase().includes(s));
  return [...starts, ...contains].slice(0, limit);
}

const BRING: [RegExp, string[]][] = [
  [/dog/, ["Leash", "Poop bags", "Water bowl", "Treats"]],
  [/bird/, ["Binoculars", "Bird guide or app", "Warm layer", "Quiet shoes"]],
  [/hik|trail|forest|walk/, ["Walking shoes", "Water", "Snack", "Rain jacket"]],
  [/run|jog/, ["Running shoes", "Water", "Light layer"]],
  [/cycl|bike/, ["Bike", "Helmet", "Lights", "Repair kit"]],
  [/swim/, ["Swimsuit", "Towel", "Goggles", "Flip-flops"]],
  [/climb|boulder/, ["Climbing shoes (or rent there)", "Chalk", "Comfy clothes"]],
  [/tennis|padel|pickleball|squash|badminton/, ["Racket", "Balls", "Sports shoes", "Water"]],
  [/yoga|pilates|stretch/, ["Mat", "Water", "Comfy clothes"]],
  [/football|basketball|volleyball|rugby/, ["Sports shoes", "Water", "Dark and light top"]],
  [/ski|snowboard/, ["Ski pass", "Helmet", "Goggles", "Gloves"]],
  [/surf/, ["Wetsuit", "Board (or rent)", "Towel", "Sun cream"]],
  [/co-?work|study|laptop/, ["Laptop", "Charger", "Headphones"]],
  [/book|read/, ["This month's book", "Notes or favourite quote"]],
  [/photo/, ["Camera or phone", "Spare battery", "Comfy shoes"]],
  [/picnic/, ["A dish to share", "Blanket", "Drinks"]],
  [/cook|bak/, ["Apron", "Container for leftovers"]],
  [/board game|game/, ["A favourite game", "Snacks to share"]],
  [/paint|draw|sketch|art/, ["Sketchbook", "Pencils or paints"]],
  [/language/, ["Notebook", "Phrases you'd like to practise"]],
  [/market/, ["Tote bag", "Cash for stalls"]],
  [/laundry/, ["Laundry and detergent", "Coins or card"]],
  [/wine|tasting|beer|whisky|cocktail/, ["ID", "Cash or card for your share"]],
  [/museum|gallery|exhibition|architecture/, ["Comfy shoes", "Ticket or museum pass"]],
  [/music|jam|guitar/, ["Your instrument", "Tuner", "Song ideas"]],
];
/** Suggested things to bring for an activity; empty when nothing obvious applies. */
export function bringSuggestions(activity: string, title = ""): string[] {
  const text = `${activity} ${title}`.toLowerCase();
  const out: string[] = [];
  for (const [re, items] of BRING) if (re.test(text)) for (const i of items) if (!out.includes(i)) out.push(i);
  return out.slice(0, 6);
}
