import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

import { getSeasonNote } from '@/lib/ai/season'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }


export async function POST(req: NextRequest) {
  const {
    destination, days, budget, travel_style, group_size,
    children = 0, start_city, start_date,
    dayHotels = {}, savedTransports = [],
  } = await req.json()

  const dailyBudget = Math.round(budget / days)
  const groupDesc   = children > 0
    ? `${group_size} adult${group_size !== 1 ? 's' : ''} and ${children} child${children !== 1 ? 'ren' : ''} (under 12)`
    : `${group_size} person${group_size !== 1 ? 's' : ''}`

  const styleGuide = ({
    budget:    'hostels, dorms, local buses, street food, free attractions — minimize spending at every step',
    comfort:   '3-star hotels, AC trains/buses, local restaurants, mix of paid and free attractions',
    luxury:    '5-star resorts, flights, fine dining, private cabs, premium exclusive experiences',
    adventure: 'camping, trekking, hostels, jeep safaris, high-adrenaline outdoor activities',
    family:    'family rooms, child-safe transport, child-friendly activities, reputed hygienic restaurants, early nights',
  } as Record<string, string>)[travel_style] ?? 'comfortable, value-for-money options'

  // Build per-day dates so AI can factor in weekdays and festivals
  const dayDates: string[] = []
  if (start_date) {
    const base = new Date(start_date)
    for (let i = 0; i < days; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      dayDates.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))
    }
  }

  const bookedHotelContext = Object.entries(dayHotels).length > 0
    ? `ALREADY BOOKED HOTELS (respect these — do not suggest different hotels for these days):\n` +
      Object.entries(dayHotels)
        .map(([, h]: [string, unknown]) => {
          const hotel = h as { name: string; price_per_night: number; city: string }
          return `  - ${hotel.name}, ${hotel.city} at ₹${hotel.price_per_night}/night`
        })
        .join('\n')
    : ''

  const bookedTransportContext = (savedTransports as Array<{mode:string;operator:string;from_city:string;to_city:string;departure:string;arrival:string;duration:string;cost:number}>).length > 0
    ? `ALREADY BOOKED TRANSPORT (account for travel times — Day 1 may start late if arriving by train/flight):\n` +
      (savedTransports as Array<{mode:string;operator:string;from_city:string;to_city:string;departure:string;arrival:string;duration:string;cost:number}>)
        .map(t => `  - ${t.mode.toUpperCase()}: ${t.operator}, ${t.from_city}→${t.to_city}, departs ${t.departure}, arrives ${t.arrival}, duration ${t.duration}, cost ₹${t.cost}`)
        .join('\n')
    : ''

  const weatherNote = start_date ? getSeasonNote(destination, start_date) : ''

  const childrenNote = children > 0
    ? `CHILDREN PRESENT: Plan ONLY child-friendly activities. No late-night plans past 9PM. No risky activities (cliff jumps, extreme treks). Include parks, interactive museums, easy nature walks, family restaurants with kids menus.`
    : ''

  const dateMap = dayDates.length > 0
    ? `DAY DATE MAPPING (use for weekday/festival awareness — markets may be closed on certain days, note if any day falls on a public holiday or weekend):\n` +
      dayDates.map((d, i) => `  Day ${i + 1}: ${d}`).join('\n')
    : ''

  const extraContext = [
    weatherNote    ? `WEATHER/SEASON: ${weatherNote}` : '',
    childrenNote,
    dateMap,
    bookedHotelContext,
    bookedTransportContext,
  ].filter(Boolean).join('\n\n')

  // Activity budget cap
  const activityBudgetCap = Math.round(budget * 0.15)

  const prompt = `You are an expert India travel planner with deep local knowledge. Plan a ${days}-day trip from ${start_city} to ${destination}.

TRIP DETAILS:
- Group: ${groupDesc}
- Total budget: ₹${budget} (daily average ₹${dailyBudget})
- Travel style: ${travel_style} — ${styleGuide}

${extraContext}

Return ONLY valid JSON matching this exact schema (no markdown, no extra text):

{
  "trip_summary": "2-sentence overview of what makes this specific trip special for ${groupDesc}",
  "transport_to_destination": {
    "mode": "train",
    "detail": "Specific train name/number or airline and flight route",
    "estimated_cost": 2500,
    "duration": "8 hrs"
  },
  "return_transport": {
    "mode": "train",
    "detail": "Specific return train name/number or flight",
    "estimated_cost": 2500,
    "duration": "8 hrs"
  },
  "budget_breakdown": {
    "transport": 4000,
    "hotels": 7000,
    "food": 4400,
    "activities": 3000,
    "buffer": 1600
  },
  "days": [
    {
      "day_number": 1,
      "city": "${destination}",
      "theme": "Arrival & First Impressions",
      "daily_budget": ${dailyBudget},
      "hotel_suggestion": "Hotel name / area — brief reason why this hotel for THIS travel style",
      "hotel_cost_per_night": 1500,
      "food_plan": "Breakfast: [specific named place] | Lunch: [specific named place] | Dinner: [specific named place]",
      "local_tip": "One genuine insider tip — opening hours hack, hidden spot, scam warning, or best-time-to-visit secret",
      "activities": [
        {
          "name": "Activity name",
          "description": "Exactly what you do here and why it is worth it — 1-2 specific sentences",
          "start_time": "09:00",
          "end_time": "11:30",
          "cost": 200,
          "type": "sightseeing",
          "location": "Exact landmark or area name, ${destination}",
          "is_free": false,
          "order_index": 0
        }
      ]
    }
  ],
  "packing_essentials": ["5–7 specific items essential for ${destination} in this season"],
  "best_local_foods": ["5 must-try dishes or food experiences specific to ${destination}"],
  "money_saving_tips": ["3–4 actionable money-saving tips specific to ${destination}"]
}

STRICT RULES:
- Exactly ${days} day objects — no more, no less
- 4–6 activities per day, time-sequenced with realistic travel time between locations
- BUDGET: total activity costs across ALL ${days} days must NOT exceed ₹${activityBudgetCap}. At least 1–2 free activities (is_free: true, cost: 0) every day
- budget_breakdown must add up to exactly ₹${budget}. Compute actual planned hotel/transport costs, not guesses
- Activity types allowed: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness, departure
- order_index starts at 0 for each day
- food_plan must name REAL, specific restaurants or well-known food streets in ${destination} — no generic "local restaurant"
- local_tip must be genuinely useful — not generic advice, must be specific to ${destination}
- If booked hotels exist, use those exact hotel names and costs for those days
- If transport is already booked and arrives in afternoon, Day 1 must only have 2–3 activities starting after arrival time
- Hotel: suggest the SAME hotel for consecutive days in the same city — travellers don't switch hotels daily
- If DAY DATE MAPPING is provided, note weekday closures (many museums closed Monday, markets open weekends)
- Season-appropriate activities: ${weatherNote ? 'strictly follow the WEATHER/SEASON guidance above' : 'mix of indoor and outdoor'}`

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model:           'llama-3.3-70b-versatile',
        messages:        [{ role: 'user', content: prompt }],
        temperature:     attempt === 0 ? 0.7 : 0.4,
        max_tokens:      8000,
        response_format: { type: 'json_object' },
      })

      const content   = completion.choices[0].message.content || '{}'
      const itinerary = JSON.parse(content)

      if (!itinerary.days || !Array.isArray(itinerary.days) || itinerary.days.length === 0) {
        throw new Error('Invalid itinerary structure')
      }

      // Budget validation
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

      // Attach return transport if AI provided it
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
