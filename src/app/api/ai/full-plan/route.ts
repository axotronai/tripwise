import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

// ─── Request body shape ───────────────────────────────────────────────────────

interface FullPlanRequest {
  destination: string
  extra_destinations?: string[]
  start_city: string
  start_date: string
  end_date: string
  total_days: number
  group_type: 'solo' | 'couple' | 'family' | 'friends' | 'corporate'
  group_size: number
  children?: number
  total_budget: number
  travel_style: 'budget' | 'comfort' | 'luxury' | 'adventure' | 'family'
  interests?: string[]
  diet?: 'veg' | 'nonveg' | 'jain' | 'any'
  transport_pref?: 'train' | 'flight' | 'bus' | 'road' | 'fastest' | 'cheapest'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function styleGuide(style: string): string {
  return (
    ({
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
  )
}

function transportGuide(pref: string): string {
  return (
    ({
      train:
        'PRIORITISE trains (especially sleeper/AC overnight trains — they save a hotel night and are iconic India experiences). Use IRCTC train names and numbers.',
      flight:
        'Prefer flights for legs > 600km. Name specific airline + approximate timing. Include airport transit time in day planning.',
      bus:
        'Prefer state-run and reputed private buses (RedBus operators). Budget-friendly. Good for distances up to 400km overnight.',
      road:
        'Self-drive or hired cab road trip. Suggest scenic routes, pit stops, highway dhabas. Estimate drive time.',
      fastest:
        'Always pick the fastest mode regardless of cost — flights > trains > buses.',
      cheapest:
        'Always pick the cheapest mode — state buses > sleeper trains > budget flights.',
    } as Record<string, string>)[pref] ?? 'trains and buses where practical'
  )
}

function dietGuide(diet: string): string {
  return (
    ({
      veg:
        'ONLY suggest pure vegetarian restaurants. No meat, no eggs. Many Indian cities have excellent pure-veg options.',
      nonveg:
        'Include local non-vegetarian specialties prominently — biryani, fish curry, kebabs etc. as relevant to destination.',
      jain:
        'Jain food only — no root vegetables (no onion, garlic, potato, carrot, beetroot). Suggest Jain-friendly restaurants.',
      any:
        'Mix of vegetarian and non-vegetarian options. Highlight the best of both at each destination.',
    } as Record<string, string>)[diet] ?? 'mix of all food options'
  )
}

function interestsGuide(interests: string[]): string {
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
  return interests
    .filter(k => map[k])
    .map(k => `• ${map[k]}`)
    .join('\n')
}

function groupGuide(type: string, size: number, children: number): string {
  const childNote =
    children > 0
      ? ` IMPORTANT: ${children} children present — no late nights past 9pm, no risky activities, include parks/interactive museums/easy nature walks.`
      : ''
  return (
    ({
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
  )
}

// ─── Schema example (inline in prompt) ───────────────────────────────────────

function buildSchemaExample(
  destination: string,
  startCity: string,
  extraDestinations: string[],
): string {
  const allDests = [destination, ...extraDestinations]
  const legs = allDests.map((dest, i) => {
    const from = i === 0 ? startCity : allDests[i - 1]
    return `{
      "from": "${from}",
      "to": "${dest}",
      "transport": {
        "mode": "train",
        "name": "Example Express",
        "number": "12345",
        "departure": "07:00",
        "arrival": "15:30",
        "duration": "8h 30m",
        "cost_per_person": 600,
        "class": "3AC",
        "book_at": "irctc.co.in"
      },
      "nights": 3
    }`
  })
  // Return leg (last destination back to start city)
  legs.push(`{
      "from": "${allDests[allDests.length - 1]}",
      "to": "${startCity}",
      "transport": {
        "mode": "train",
        "name": "Return Express",
        "number": "12346",
        "departure": "20:00",
        "arrival": "06:00+1",
        "duration": "10h 00m",
        "cost_per_person": 600,
        "class": "3AC",
        "book_at": "irctc.co.in"
      },
      "nights": 0
    }`)
  return `[${legs.join(',\n    ')}]`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = (await req.json()) as FullPlanRequest

  const {
    destination,
    extra_destinations = [],
    start_city,
    start_date,
    total_days,
    group_type,
    group_size,
    children = 0,
    total_budget,
    travel_style,
    interests = [],
    diet = 'any',
    transport_pref = 'train',
  } = body

  if (!destination || !start_city || !start_date || !total_days || !total_budget) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allDestinations = [destination, ...extra_destinations]
  const isMultiCity = extra_destinations.length > 0
  const dailyBudget = Math.round(total_budget / total_days)
  const totalPeople = group_size + children
  const perPersonBudget = Math.round(total_budget / group_size)

  // Build day-date mapping so AI is festival/weekday aware
  const dayDates: string[] = []
  const base = new Date(start_date)
  for (let i = 0; i < total_days; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dayDates.push(
      d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    )
  }

  const weatherNote = getSeasonNote(destination, start_date)

  const interestsBlock = interestsGuide(interests)

  const prompt = `You are an expert India travel planner with deep local knowledge of trains, hotels, restaurants, and attractions across every Indian state.

TRIP REQUEST:
- From: ${start_city}
- Destination${isMultiCity ? 's' : ''}: ${allDestinations.join(' → ')}
- Travel dates: ${start_date} (${total_days} days total)
- Group: ${groupGuide(group_type, group_size, children)}
- Group size: ${totalPeople} people (${group_size} adult${group_size !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''})
- Total budget: ₹${total_budget.toLocaleString('en-IN')} (₹${dailyBudget.toLocaleString('en-IN')}/day average, ₹${perPersonBudget.toLocaleString('en-IN')}/person)
- Travel style: ${travel_style} — ${styleGuide(travel_style)}
- Transport preference: ${transportGuide(transport_pref)}
- Food preference: ${dietGuide(diet)}
${interests.length > 0 ? `\nINTEREST-BASED PRIORITIES (incorporate heavily into activity selection):\n${interestsBlock}` : ''}
${weatherNote ? `\nSEASON/WEATHER: ${weatherNote}` : ''}

DAY DATE MAPPING (use for weekday/festival/closure awareness):
${dayDates.map((d, i) => `  Day ${i + 1}: ${d}`).join('\n')}

STRICT RULES:
1. Return ONLY valid JSON — no markdown, no extra text, no code fences.
2. Exactly ${total_days} day objects — no more, no less.
3. Every day MUST have 3–4 activities with realistic time gaps (account for travel time between locations).
4. Activity costs across ALL ${total_days} days must NOT exceed ₹${Math.round(total_budget * 0.15).toLocaleString('en-IN')} total. Include at least 1 free activity per day.
5. budget_breakdown MUST add up to exactly ₹${total_budget.toLocaleString('en-IN')}. Compute real planned costs — not guesses.
6. Hotels: suggest the SAME hotel for all consecutive nights in the same city. Use REAL hotel names (e.g., "Zostel Goa", "Hotel Sarovar Premiere Jaipur", "Taj Lake Palace Udaipur").
7. Restaurants: REAL named restaurants or famous food streets — never "local restaurant" or generic names.
8. Trains: use REAL Indian train names and numbers (e.g., "Rajdhani Express 12951"). Book at irctc.co.in.
9. Flights: name real airlines (IndiGo, Air India, SpiceJet, Vistara). Give flight codes if known.
10. Route: include BOTH outbound legs (${start_city} → every destination city) AND the final return leg (last city → ${start_city}).
11. For each destination city in hotels: include the city name as the key exactly as spelled above.
12. If Day 1 involves arrival by train/flight, only plan 2–3 activities starting AFTER arrival time.
13. Activity type must be one of: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness, departure.
14. Day themes must reflect the traveller's interests (e.g., if beach interest, Day 1 theme = "Beach Arrival & Sunset").
15. quick_tips must be destination-specific and actionable — no generic travel advice.

Return JSON exactly matching this schema:

{
  "route": ${buildSchemaExample(destination, start_city, extra_destinations)},
  "hotels": {
    "${destination}": {
      "name": "Real Hotel Name",
      "area": "Neighbourhood, City",
      "rating": 4.2,
      "cost_per_night": 3500,
      "amenities": ["Pool", "WiFi", "Restaurant"],
      "highlights": "Why this hotel for this travel style and group"
    }
  },
  "days": [
    {
      "day_number": 1,
      "city": "${destination}",
      "theme": "Arrival & First Impressions",
      "daily_budget": ${dailyBudget},
      "hotel_suggestion": "Hotel Name, Area — brief reason",
      "hotel_cost_per_night": 3500,
      "food_plan": "Breakfast: [Named place] | Lunch: [Named place] | Dinner: [Named place]",
      "local_tip": "Specific insider tip for this city — not generic",
      "activities": [
        {
          "name": "Activity name with emoji prefix",
          "description": "What you do here and why it is worth visiting — 1-2 specific sentences",
          "time": "09:00",
          "end_time": "11:30",
          "start_time": "09:00",
          "cost": 200,
          "type": "sightseeing",
          "location": "Exact landmark or street, ${destination}",
          "is_free": false,
          "order_index": 0
        }
      ]
    }
  ],
  "budget_breakdown": {
    "transport": 8000,
    "hotels": 18000,
    "food": 9000,
    "activities": 7500,
    "buffer": 7500,
    "total": ${total_budget}
  },
  "quick_tips": [
    "Tip 1 — destination-specific booking tip",
    "Tip 2 — local money saving trick",
    "Tip 3 — what to watch out for",
    "Tip 4 — best kept secret"
  ]
}

Generate the complete ${total_days}-day plan now. Remember: ONLY JSON output, all ${total_days} days, real places, real hotels, real transport.`

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: attempt === 0 ? 0.7 : 0.4,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0].message.content || '{}'
      const plan = JSON.parse(content)

      // Validate required shape
      if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
        throw new Error('Invalid plan: missing days array')
      }
      if (!plan.budget_breakdown) {
        throw new Error('Invalid plan: missing budget_breakdown')
      }

      // Normalise activity fields: ensure both time/start_time are set
      plan.days = plan.days.map(
        (day: {
          day_number: number
          activities?: Array<{
            time?: string
            start_time?: string
            end_time?: string
            cost?: number
            is_free?: boolean
            order_index?: number
          }>
        }) => ({
          ...day,
          activities: (day.activities ?? []).map((act, idx) => ({
            ...act,
            start_time: act.start_time ?? act.time ?? '09:00',
            end_time: act.end_time ?? '10:00',
            cost: act.is_free ? 0 : (act.cost ?? 0),
            order_index: act.order_index ?? idx,
          })),
        })
      )

      // Enforce budget_breakdown total
      const bb = plan.budget_breakdown as Record<string, number>
      const computedTotal = (bb.transport ?? 0) + (bb.hotels ?? 0) + (bb.food ?? 0) + (bb.activities ?? 0) + (bb.buffer ?? 0)
      if (computedTotal !== total_budget) {
        // Adjust buffer to reconcile
        const diff = total_budget - computedTotal
        bb.buffer = Math.max(0, (bb.buffer ?? 0) + diff)
        bb.total = total_budget
      } else {
        bb.total = total_budget
      }

      // Cap activity costs if they exceed 15% of budget
      const activityBudgetCap = Math.round(total_budget * 0.15)
      const totalActivityCost = plan.days.reduce(
        (sum: number, day: { activities?: Array<{ cost?: number; is_free?: boolean }> }) =>
          sum +
          (day.activities ?? []).reduce(
            (s: number, a) => s + (a.is_free ? 0 : (a.cost ?? 0)),
            0
          ),
        0
      )
      if (totalActivityCost > activityBudgetCap) {
        const scale = activityBudgetCap / totalActivityCost
        plan.days = plan.days.map(
          (day: { activities?: Array<{ cost?: number; is_free?: boolean }> }) => ({
            ...day,
            activities: (day.activities ?? []).map(a => ({
              ...a,
              cost: a.is_free ? 0 : Math.round((a.cost ?? 0) * scale),
            })),
          })
        )
        plan.budget_breakdown.activities = activityBudgetCap
        // Re-adjust buffer
        const newTotal =
          plan.budget_breakdown.transport +
          plan.budget_breakdown.hotels +
          plan.budget_breakdown.food +
          plan.budget_breakdown.activities
        plan.budget_breakdown.buffer = Math.max(0, total_budget - newTotal)
        plan.budget_breakdown.total = total_budget
      }

      return NextResponse.json(plan)
    } catch (error) {
      console.error(`Full-plan generation error (attempt ${attempt + 1}):`, error)
      if (attempt === maxRetries) {
        return NextResponse.json({ error: 'AI plan generation failed. Please try again.' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ error: 'AI plan generation failed.' }, { status: 500 })
}
