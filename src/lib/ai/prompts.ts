// Shared prompt building blocks for all AI routes.
// Centralizes style/diet/group guidance, anti-hallucination examples, and JSON output rules
// so prompt drift doesn't accumulate between full-plan, itinerary, refine-day, etc.

export type TravelStyle = 'budget' | 'comfort' | 'luxury' | 'adventure' | 'family'
export type Diet = 'veg' | 'nonveg' | 'jain' | 'any'
export type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'corporate'
export type TransportPref = 'train' | 'flight' | 'bus' | 'road' | 'fastest' | 'cheapest'

/** Style guidance for hotels, transport, dining, pace. */
export function styleGuide(style: string): string {
  return ({
    budget:
      'hostels/dorms, street food, local buses/sleeper trains, free attractions — cut cost at every step. Prioritise value',
    comfort:
      '3-star hotels, AC trains or budget flights, local restaurants, mix of free and paid attractions',
    luxury:
      '5-star resorts, domestic flights, fine dining, private cabs, premium experiences — quality over cost',
    adventure:
      'camping, treks, home-stays, jeep safaris, adventure sports, hostels — outdoor-first itinerary',
    family:
      'family rooms, AC transport, child-friendly activities, reputed hygienic restaurants, early evenings (10pm latest)',
  } as Record<string, string>)[style] ?? 'comfortable, value-for-money options'
}

export function transportGuide(pref: string): string {
  return ({
    train:
      'PRIORITISE trains (especially sleeper/AC overnight trains — save a hotel night, iconic India experience). Use real IRCTC train names + numbers.',
    flight:
      'Prefer flights for legs > 600km. Name specific airline + flight code if known (IndiGo 6E-2055, Air India AI-639). Include airport transit time.',
    bus:
      'Prefer state-run or RedBus operators. Budget-friendly. Good for distances up to 400km overnight.',
    road:
      'Self-drive or hired cab road trip. Suggest scenic routes, highway dhabas, pit stops. Estimate drive time honestly (include traffic).',
    fastest:
      'Always pick the fastest mode — flights > Vande Bharat/Rajdhani > buses.',
    cheapest:
      'Always pick the cheapest mode — state buses > sleeper trains > budget flights.',
  } as Record<string, string>)[pref] ?? 'trains and buses where practical'
}

export function dietGuide(diet: string): string {
  return ({
    veg:
      'ONLY suggest pure vegetarian restaurants. No meat, no eggs. Many Indian cities have excellent pure-veg options (Saravana Bhavan, Haldiram, Sagar Ratna).',
    nonveg:
      'Include local non-vegetarian specialties prominently — biryani, fish curry, kebabs, butter chicken — as relevant to destination.',
    jain:
      'STRICTLY Jain food only — no root vegetables (no onion, garlic, potato, carrot, beetroot, radish). Suggest Jain-certified or Jain-friendly restaurants.',
    any:
      'Mix of vegetarian and non-vegetarian options. Highlight the best of both at each destination.',
  } as Record<string, string>)[diet] ?? 'mix of all food options'
}

export function groupGuide(type: string, size: number, children = 0): string {
  const childNote = children > 0
    ? ` IMPORTANT: ${children} children present — no late nights past 9pm, no risky activities, include parks/interactive museums/easy nature walks.`
    : ''
  return ({
    solo:
      `Solo traveller — suggest social activities, hostels with common areas, free walking tours.${childNote}`,
    couple:
      `Couple — balance romantic dinners, scenic spots, and adventure. Include at least one special experience per destination.${childNote}`,
    family:
      `Family of ${size} adults + ${children} children — safety first, child-friendly activities, family rooms, early check-in preference.${childNote}`,
    friends:
      `Friends group of ${size} — mix of activities, group-friendly restaurants, energetic pace, good for nightlife if budget allows.${childNote}`,
    corporate:
      `Corporate group of ${size} — reliable transport, good Wi-Fi hotels, team activity options, group dining.${childNote}`,
  } as Record<string, string>)[type] ?? `Group of ${size} travellers.${childNote}`
}

export function interestsGuide(interests: string[]): string {
  if (!interests || interests.length === 0) return ''
  const map: Record<string, string> = {
    beaches:      'Prioritise beach activities, sunrise/sunset spots, water-facing hotels',
    history:      'Include forts, temples, museums, archaeological sites, heritage walks',
    nature:       'Wildlife sanctuaries, national parks, forest treks, botanical gardens, viewpoints',
    food:         'Food walks, local markets, iconic street food, cooking classes, famous restaurants',
    shopping:     'Local markets, emporiums, artisan bazaars, handicraft stores',
    adventure:    'Treks, rappelling, white-water rafting, paragliding, rock climbing, camping',
    culture:      'Classical performances, art galleries, festivals, traditional crafts, local fairs',
    scenic:       'Sunrise/sunset points, viewpoints, photography spots, valley overlooks',
    nightlife:    'Live music venues, rooftop bars, night markets, late-night food streets',
    wellness:     'Yoga retreats, Ayurveda spas, meditation centres, hot springs',
    water_sports: 'Surfing, snorkelling, scuba, kayaking, jet skiing, parasailing',
    cycling:      'Cycling routes, mountain bike trails, guided hike circuits',
  }
  return interests.filter(k => map[k]).map(k => `• ${map[k]}`).join('\n')
}

/** Anti-hallucination block — Llama follows GOOD/BAD few-shot strongly. */
export const ANTI_HALLUCINATION_PLACES = `
NAME AUTHENTICITY (CRITICAL — Llama is graded on this):
GOOD examples: "Dudhsagar Falls", "Aguada Fort", "Anjuna Flea Market", "Hampi Bazaar", "Meenakshi Temple Madurai"
BAD examples: "Beautiful Waterfall", "Historic Fort", "Local Market", "Famous Temple", "Scenic Viewpoint"
If you are not 80%+ certain a place exists by that exact name on Google Maps/Wikipedia, OMIT it. Better to return 6 verified places than 8 with 2 hallucinations.`

export const ANTI_HALLUCINATION_HOTELS = `
HOTEL NAMES (CRITICAL):
GOOD: "Taj Lake Palace Udaipur", "Zostel Goa Anjuna", "Hotel Sarovar Premiere", "OYO Townhouse 245", "Lemon Tree Premier"
BAD: "Sunshine Inn", "Cozy Stay", "Beach View Hotel", "Royal Palace Stay"
If you don't know an exact verifiable hotel, prefer naming a real CHAIN with location (e.g. "Treebo Trend [Area]", "Lemon Tree [Area]"). Never invent boutique names.`

export const ANTI_HALLUCINATION_RESTAURANTS = `
RESTAURANT NAMES (CRITICAL):
GOOD: "Britannia & Co (Mumbai) — Berry Pulao", "Karim's Old Delhi — Mutton Burra", "Mavalli Tiffin Room (Bangalore) — Rava Idli", "Peshawri at ITC — Sikandari Raan"
BAD: "Local Restaurant", "Good Food Place", "Tasty Curry House"
must_try must name a SPECIFIC menu item with a descriptor — not just a dish category.`

export const ANTI_HALLUCINATION_TRAINS = `
TRAIN ACCURACY (CRITICAL — IRCTC):
KNOWN ANCHORS: Rajdhani Mumbai-Delhi 12951/52, Vande Bharat Delhi-Bhopal 20171/72, Tejas Mumbai-Goa 22119/20, Shatabdi Delhi-Dehradun 12017/18, Konkan Railway routes Mumbai-Goa.
RULE: If you don't know the EXACT 5-digit train number for the route, OMIT the "number" field rather than invent one. A train name without a number is fine.
Note running days if not daily (e.g. "Runs Tue/Thu/Sat only" for some Duronto/Garib Rath).`

/** Standard JSON output instruction used by every JSON-returning route. */
export const JSON_OUTPUT_RULE = `Return ONLY valid JSON. No markdown fences, no preamble, no trailing commentary. The first character of your response must be { and the last must be }.`

/** Build a date list for festival/weekday awareness — used by full-plan + itinerary. */
export function buildDayDateMap(startDate: string, totalDays: number): string[] {
  const out: string[] = []
  const base = new Date(startDate)
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))
  }
  return out
}
