import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { getFestivalNote } from '@/lib/ai/festivals'
import {
  styleGuide, transportGuide, dietGuide, groupGuide, interestsGuide,
  buildDayDateMap,
  ANTI_HALLUCINATION_PLACES, ANTI_HALLUCINATION_HOTELS,
  ANTI_HALLUCINATION_RESTAURANTS, ANTI_HALLUCINATION_TRAINS,
  JSON_OUTPUT_RULE,
} from '@/lib/ai/prompts'

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
  nights_per_destination?: Record<string, number>  // user-specified nights per city
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
    nights_per_destination,
  } = body

  if (!destination || !start_city || !start_date || !total_days || !total_budget) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allDestinations = [destination, ...extra_destinations]
  const isMultiCity = extra_destinations.length > 0
  const dailyBudget = Math.round(total_budget / total_days)
  const totalPeople = group_size + children
  // Use totalPeople (adults + children) for per-person budget — children consume budget too
  const perPersonBudget = Math.round(total_budget / (totalPeople || 1))
  const activityBudgetCap = Math.round(total_budget * 0.15)

  const dayDates = buildDayDateMap(start_date, total_days)
  const weatherNote = getSeasonNote(destination, start_date)
  const festivalNote = getFestivalNote(destination, start_date, total_days)
  const interestsBlock = interestsGuide(interests)

  // ─── SYSTEM PROMPT (persona + rules) ─────────────────────────────────────
  const systemPrompt = `You are an expert India trip planner with deep local knowledge of trains, hotels, restaurants, and attractions across every Indian state and union territory.

${ANTI_HALLUCINATION_PLACES}
${ANTI_HALLUCINATION_HOTELS}
${ANTI_HALLUCINATION_RESTAURANTS}
${ANTI_HALLUCINATION_TRAINS}

BUDGET MATH (do this before writing JSON):
Step 1: Estimate hotel cost = nights × cost_per_night per city
Step 2: Estimate transport = sum of all leg costs × group_size
Step 3: Estimate food = days × daily_food_per_person × group_size
Step 4: activities = remaining after steps 1-3 (must be ≤ ₹${activityBudgetCap})
Step 5: buffer = total_budget - (hotels + transport + food + activities)
ONLY then write budget_breakdown. Total MUST equal ₹${total_budget}.

STRICT RULES:
1. ${JSON_OUTPUT_RULE}
2. Exactly ${total_days} day objects — no more, no less.
3. Every day MUST have 3–5 activities with realistic time gaps.
4. Total activity costs across ALL days ≤ ₹${activityBudgetCap}. Include ≥1 free activity per day.
5. budget_breakdown.total MUST equal exactly ₹${total_budget}.
6. Hotels: same hotel for ALL consecutive nights in same city. REAL hotel names only.
7. Restaurants in food_plan: REAL named restaurants or famous food streets — never "local restaurant".
8. Trains: REAL IRCTC train names. Omit number if not certain.
9. Flights: real airlines (IndiGo, Air India, SpiceJet). Include flight code if known.
10. Route: include BOTH outbound legs AND final return leg (last city → ${start_city}).
11. If Day 1 involves arriving by train/flight: only 2–3 activities starting AFTER arrival time.
12. Activity type must be one of: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness, departure.
13. Day themes must reflect the traveller's interests.
14. quick_tips: destination-specific and actionable — no generic advice.
15. Children rule: if children > 0 — no late nights past 9pm, no risky activities.`

  // ─── USER PROMPT (trip-specific data) ─────────────────────────────────────
  const userPrompt = `Plan a complete ${total_days}-day trip.

TRIP REQUEST:
- From: ${start_city}
- Destination${isMultiCity ? 's' : ''}: ${allDestinations.join(' → ')}
- Travel dates: ${start_date} (${total_days} days)
- Group: ${groupGuide(group_type, group_size, children)}
- Group size: ${totalPeople} people (${group_size} adult${group_size !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''})
- Total budget: ₹${total_budget.toLocaleString('en-IN')} (₹${dailyBudget.toLocaleString('en-IN')}/day avg, ₹${perPersonBudget.toLocaleString('en-IN')}/person)
- Travel style: ${travel_style} — ${styleGuide(travel_style)}
- Transport preference: ${transportGuide(transport_pref)}
- Food: ${dietGuide(diet)}
${interests.length > 0 ? `\nINTEREST PRIORITIES:\n${interestsBlock}` : ''}
${weatherNote ? `\nSEASON/WEATHER: ${weatherNote}` : ''}
${festivalNote ? `\nFESTIVAL/EVENT CONTEXT: ${festivalNote}` : ''}
${nights_per_destination && Object.keys(nights_per_destination).length > 0
  ? `\nPER-CITY NIGHTS (USER-SPECIFIED — follow exactly):\n${Object.entries(nights_per_destination).map(([c, n]) => `  ${c}: ${n} night${n !== 1 ? 's' : ''}`).join('\n')}`
  : ''}

DAY DATES (use for closure/festival awareness):
${dayDates.map((d, i) => `  Day ${i + 1}: ${d}`).join('\n')}

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
      "local_tip": "Specific insider tip for this city",
      "activities": [
        {
          "name": "Activity name with emoji prefix",
          "description": "What you do here and why — 1-2 specific sentences",
          "start_time": "09:00",
          "end_time": "11:30",
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

Generate the complete ${total_days}-day plan now.`

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? 0.7 : 0.4,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0].message.content || '{}'
      const plan = JSON.parse(content)

      if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
        throw new Error('Invalid plan: missing days array')
      }
      if (!plan.budget_breakdown) {
        throw new Error('Invalid plan: missing budget_breakdown')
      }

      // Normalise activity fields: ensure start_time is always set
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

      // Enforce budget_breakdown total — proportionally scale if AI over-allocated
      const bb = plan.budget_breakdown as Record<string, number>
      const computedTotal = (bb.transport ?? 0) + (bb.hotels ?? 0) + (bb.food ?? 0) + (bb.activities ?? 0) + (bb.buffer ?? 0)
      if (computedTotal !== total_budget) {
        const diff = total_budget - computedTotal
        const newBuffer = (bb.buffer ?? 0) + diff
        if (newBuffer >= 0) {
          bb.buffer = newBuffer
        } else {
          const categories: Array<keyof typeof bb> = ['transport', 'hotels', 'food', 'activities']
          const coreTotal = categories.reduce((s, k) => s + (bb[k] ?? 0), 0)
          if (coreTotal > 0) {
            const scale = total_budget / coreTotal
            for (const k of categories) bb[k] = Math.round((bb[k] ?? 0) * scale)
          }
          bb.buffer = 0
        }
        bb.total = total_budget
      } else {
        bb.total = total_budget
      }

      // Cap activity costs if they exceed 15% of budget
      const totalActivityCost = plan.days.reduce(
        (sum: number, day: { activities?: Array<{ cost?: number; is_free?: boolean }> }) =>
          sum + (day.activities ?? []).reduce(
            (s: number, a) => s + (a.is_free ? 0 : (a.cost ?? 0)), 0
          ), 0
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

      // Detect Groq rate-limit errors and surface a clear message
      const errMsg = (error as { error?: { message?: string }; message?: string })?.error?.message
        ?? (error as { message?: string })?.message ?? ''
      if (errMsg.includes('rate_limit_exceeded') || errMsg.includes('Rate limit')) {
        const retryMatch = errMsg.match(/try again in ([^.]+)/)
        const retryIn = retryMatch ? ` (retry in ${retryMatch[1]})` : ''
        return NextResponse.json(
          { error: `AI daily limit reached${retryIn}. Please wait a few minutes and try again. If this keeps happening, upgrade your Groq API plan at console.groq.com.` },
          { status: 429 }
        )
      }

      if (attempt === maxRetries) {
        return NextResponse.json({ error: 'AI plan generation failed. Please try again.' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ error: 'AI plan generation failed.' }, { status: 500 })
}
