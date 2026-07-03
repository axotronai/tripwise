import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { getFestivalNote } from '@/lib/ai/festivals'
import {
  styleGuide, dietGuide, buildDayDateMap,
  ANTI_HALLUCINATION_PLACES, ANTI_HALLUCINATION_HOTELS,
  ANTI_HALLUCINATION_RESTAURANTS, ANTI_HALLUCINATION_TRAINS,
  JSON_OUTPUT_RULE,
} from '@/lib/ai/prompts'
import { aiGuard } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { error } = await aiGuard(req)
  if (error) return error

  const {
    destination, days, budget, travel_style, group_size,
    children = 0, start_city, start_date, diet = 'any',
    dayHotels = {}, savedTransports = [],
  } = await req.json()

  const dailyBudget      = Math.round(budget / days)
  const activityBudgetCap = Math.round(budget * 0.15)
  const totalPeople      = group_size + children
  const groupDesc        = children > 0
    ? `${group_size} adult${group_size !== 1 ? 's' : ''} + ${children} child${children !== 1 ? 'ren' : ''}`
    : `${group_size} person${group_size !== 1 ? 's' : ''}`

  const dayDates    = start_date ? buildDayDateMap(start_date, days) : []
  const weatherNote = start_date ? getSeasonNote(destination, start_date) : ''
  const festivalNote = start_date ? getFestivalNote(destination, start_date, days) : ''

  const bookedHotelContext = Object.entries(dayHotels).length > 0
    ? `ALREADY BOOKED HOTELS (use these exact names + costs):\n` +
      Object.entries(dayHotels).map(([, h]: [string, unknown]) => {
        const hotel = h as { name: string; price_per_night: number; city: string }
        return `  - ${hotel.name}, ${hotel.city} at ₹${hotel.price_per_night}/night`
      }).join('\n')
    : ''

  const bookedTransportContext = (savedTransports as Array<{mode:string;operator:string;from_city:string;to_city:string;departure:string;arrival:string;duration:string;cost:number}>).length > 0
    ? `ALREADY BOOKED TRANSPORT (account for travel times — Day 1 may start late):\n` +
      (savedTransports as Array<{mode:string;operator:string;from_city:string;to_city:string;departure:string;arrival:string;duration:string;cost:number}>)
        .map(t => `  - ${t.mode.toUpperCase()}: ${t.operator}, ${t.from_city}→${t.to_city}, departs ${t.departure}, arrives ${t.arrival}, ${t.duration}, ₹${t.cost}`)
        .join('\n')
    : ''

  const childrenNote = children > 0
    ? `CHILDREN (${children}): NO late nights past 9pm, NO risky activities. Include parks, interactive museums, easy walks.`
    : ''

  const systemPrompt = `You are an expert India travel planner with deep local knowledge of every destination.

${ANTI_HALLUCINATION_PLACES}
${ANTI_HALLUCINATION_HOTELS}
${ANTI_HALLUCINATION_RESTAURANTS}
${ANTI_HALLUCINATION_TRAINS}

BUDGET MATH (do this before writing JSON):
Step 1: hotels = days × cost_per_night
Step 2: transport = to + from leg costs × group_size
Step 3: food = days × daily_food_per_person × group_size
Step 4: activities = remaining (cap at ₹${activityBudgetCap} total across all days)
Step 5: buffer = ₹${budget} - (hotels + transport + food + activities)
budget_breakdown MUST total exactly ₹${budget}.

STRICT RULES:
1. ${JSON_OUTPUT_RULE}
2. Exactly ${days} day objects — no more, no less.
3. 3–5 activities per day, time-sequenced. At least 1 free activity every day.
4. food_plan must name REAL restaurants or famous food streets in ${destination}.
5. Hotel: same hotel for consecutive days in same city.
6. If booked hotels/transport provided: use those exact names and account for arrival times.
7. Season-appropriate activities: ${weatherNote ? 'follow WEATHER/SEASON guidance' : 'mix indoor and outdoor'}.
8. Activity types: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness, departure.
${childrenNote ? `9. ${childrenNote}` : ''}`

  const userPrompt = `Plan a ${days}-day trip from ${start_city} to ${destination}.

GROUP: ${groupDesc} (total ${totalPeople} people)
BUDGET: ₹${budget.toLocaleString('en-IN')} total (₹${dailyBudget.toLocaleString('en-IN')}/day avg)
TRAVEL STYLE: ${travel_style} — ${styleGuide(travel_style)}
FOOD PREFERENCE: ${dietGuide(diet)}
${weatherNote   ? `\nSEASON: ${weatherNote}` : ''}
${festivalNote  ? `\nFESTIVALS: ${festivalNote}` : ''}
${bookedHotelContext     ? `\n${bookedHotelContext}` : ''}
${bookedTransportContext ? `\n${bookedTransportContext}` : ''}
${dayDates.length > 0
  ? `\nDAY DATES (check closures/festivals):\n${dayDates.map((d, i) => `  Day ${i+1}: ${d}`).join('\n')}`
  : ''}

Return JSON:

{
  "trip_summary": "2-sentence overview of why this itinerary is ideal for ${groupDesc}",
  "transport_to_destination": {
    "mode": "train",
    "detail": "Specific train name or airline + route",
    "estimated_cost": 2500,
    "duration": "8 hrs"
  },
  "return_transport": {
    "mode": "train",
    "detail": "Specific return train or flight",
    "estimated_cost": 2500,
    "duration": "8 hrs"
  },
  "budget_breakdown": {
    "transport": 4000,
    "hotels": 7000,
    "food": 4400,
    "activities": 3000,
    "buffer": 1600,
    "total": ${budget}
  },
  "days": [
    {
      "day_number": 1,
      "city": "${destination}",
      "theme": "Arrival & First Impressions",
      "daily_budget": ${dailyBudget},
      "hotel_suggestion": "Hotel name / area — brief reason",
      "hotel_cost_per_night": 1500,
      "food_plan": "Breakfast: [named place] | Lunch: [named place] | Dinner: [named place]",
      "local_tip": "One genuine insider tip specific to ${destination}",
      "activities": [
        {
          "name": "Activity name",
          "description": "What you do here — 1-2 specific sentences",
          "start_time": "09:00",
          "end_time": "11:30",
          "cost": 200,
          "type": "sightseeing",
          "location": "Exact landmark or area, ${destination}",
          "is_free": false,
          "order_index": 0
        }
      ]
    }
  ],
  "packing_essentials": ["5-7 items specific to ${destination} this season"],
  "best_local_foods": ["5 must-try dishes specific to ${destination}"],
  "money_saving_tips": ["3-4 actionable tips specific to ${destination}"]
}`

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model:           'llama-3.3-70b-versatile',
        messages:        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature:     attempt === 0 ? 0.7 : 0.4,
        max_tokens:      8000,
        response_format: { type: 'json_object' },
      })

      const content   = completion.choices[0].message.content || '{}'
      const itinerary = JSON.parse(content)

      if (!itinerary.days || !Array.isArray(itinerary.days) || itinerary.days.length === 0) {
        throw new Error('Invalid itinerary structure')
      }

      // Normalise activity start_time
      itinerary.days = itinerary.days.map((day: {
        activities?: Array<{ time?: string; start_time?: string; end_time?: string; cost?: number; is_free?: boolean; order_index?: number }>
      }) => ({
        ...day,
        activities: (day.activities ?? []).map((a, idx) => ({
          ...a,
          start_time: a.start_time ?? a.time ?? '09:00',
          end_time: a.end_time ?? '10:00',
          cost: a.is_free ? 0 : (a.cost ?? 0),
          order_index: a.order_index ?? idx,
        })),
      }))

      // Budget cost stats
      const totalActivityCost = itinerary.days.reduce((sum: number, day: { activities?: Array<{ cost?: number; is_free?: boolean }> }) => {
        return sum + (day.activities || []).reduce((s: number, a) => s + (a.is_free ? 0 : (a.cost || 0)), 0)
      }, 0)
      const totalHotelCost = itinerary.days.reduce((sum: number, day: { hotel_cost_per_night?: number }) => {
        return sum + (day.hotel_cost_per_night || 0)
      }, 0)
      const totalPlanned = totalActivityCost + totalHotelCost
      const budgetWarning = totalPlanned > budget
        ? `AI planned ₹${totalPlanned.toLocaleString('en-IN')} but your budget is ₹${budget.toLocaleString('en-IN')}. Some costs have been scaled down.`
        : null

      // Scale activity costs if over cap
      if (totalActivityCost > activityBudgetCap) {
        const scale = activityBudgetCap / totalActivityCost
        itinerary.days = itinerary.days.map((day: { activities?: Array<{ cost?: number; is_free?: boolean }> }) => ({
          ...day,
          activities: (day.activities || []).map((a) => ({
            ...a,
            cost: a.is_free ? 0 : Math.round((a.cost || 0) * scale),
          })),
        }))
      }

      // Reconcile budget_breakdown total
      if (itinerary.budget_breakdown) {
        const bb = itinerary.budget_breakdown as Record<string, number>
        const computedTotal = (bb.transport ?? 0) + (bb.hotels ?? 0) + (bb.food ?? 0) + (bb.activities ?? 0) + (bb.buffer ?? 0)
        const diff = budget - computedTotal
        const newBuffer = (bb.buffer ?? 0) + diff
        if (newBuffer >= 0) {
          bb.buffer = newBuffer
        } else {
          const categories: Array<keyof typeof bb> = ['transport', 'hotels', 'food', 'activities']
          const coreTotal = categories.reduce((s, k) => s + (bb[k] ?? 0), 0)
          if (coreTotal > 0) {
            const scale = budget / coreTotal
            for (const k of categories) bb[k] = Math.round((bb[k] ?? 0) * scale)
          }
          bb.buffer = 0
        }
        bb.total = budget
      }

      return NextResponse.json({ ...itinerary, budget_warning: budgetWarning })
    } catch (error) {
      console.error(`AI itinerary error (attempt ${attempt + 1}):`, error)
      if (attempt === maxRetries) {
        return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
      }
    }
  }
  return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
}
