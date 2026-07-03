import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { ANTI_HALLUCINATION_TRAINS, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard, logTokenUsage } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { userId, error } = await aiGuard(req)
  if (error) return error

  const { from, to, date, travel_style = 'comfort', group_size = 1 } = await req.json()

  const styleNote =
    travel_style === 'budget'    ? 'Prioritise cheapest options (state bus, sleeper train).' :
    travel_style === 'luxury'    ? 'Prioritise flights and premium trains (1AC, Vande Bharat, Rajdhani).' :
    travel_style === 'adventure' ? 'Include scenic routes. Overnight trains or scenic road trips preferred.' :
    travel_style === 'family'    ? 'Prefer comfortable, family-friendly options with reserved seats. Avoid long standby.' :
    'Include a mix of modes. Balance time vs cost.'

  // Approximate distance hint to guide mode selection
  const knownRoutes: Record<string, { km: number; topMode: string }> = {
    'mumbai-goa': { km: 590, topMode: 'train' },
    'delhi-manali': { km: 570, topMode: 'bus/cab' },
    'delhi-jaipur': { km: 280, topMode: 'train' },
    'mumbai-pune': { km: 150, topMode: 'train/cab' },
    'bangalore-goa': { km: 590, topMode: 'train' },
    'delhi-agra': { km: 230, topMode: 'train' },
    'kolkata-darjeeling': { km: 620, topMode: 'train+cab' },
    'bangalore-hampi': { km: 350, topMode: 'train/bus' },
    'delhi-varanasi': { km: 815, topMode: 'train/flight' },
    'mumbai-ahmedabad': { km: 525, topMode: 'train' },
  }

  const routeKey = `${from.toLowerCase()}-${to.toLowerCase()}`
  const routeHint = knownRoutes[routeKey]
    ? `Approx distance: ${knownRoutes[routeKey].km}km. Top recommended mode: ${knownRoutes[routeKey].topMode}.`
    : ''

  const systemPrompt = `You are an expert India travel logistics planner with deep IRCTC/flight knowledge.

${ANTI_HALLUCINATION_TRAINS}

RULES:
- 3–4 real transport options (use all applicable modes for the route)
- mode: exactly one of "train", "flight", "bus", "cab"
- cost_per_person in INR (realistic 2026 prices)
- departure/arrival in HH:MM 24h format; add "+1" for next day (e.g. "06:00+1")
- duration: honest estimate including boarding time for flights
- For short routes (<300km): always include a cab option
- For long routes (>500km): always include at least 1 train option if rail exists
- book_at: "irctc.co.in" for trains, "makemytrip.com" for flights, "redbus.in" for buses
- highlights: 1 compelling reason to pick this option (e.g. "Scenic coastal route via Konkan", "Overnight saves hotel cost")
- running_days: include ONLY if the train doesn't run daily (e.g. "Mon/Wed/Fri only")

${JSON_OUTPUT_RULE}`

  const userPrompt = `Suggest transport options from ${from} to ${to} for ${group_size} traveller(s).
Travel date: ${date || 'flexible'}
Travel style: ${styleNote}
${routeHint}

Return JSON:
{
  "options": [
    {
      "mode": "train",
      "operator": "Indian Railways",
      "name": "Train name",
      "number": "12951",
      "departure": "16:25",
      "arrival": "08:15+1",
      "duration": "15h 50m",
      "cost_per_person": 2100,
      "class": "3AC",
      "highlights": "Why pick this option",
      "book_at": "irctc.co.in",
      "running_days": "Daily"
    }
  ]
}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? 0.4 : 0.3,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
      })
      logTokenUsage(userId, 'suggest-transport', completion.usage)
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (data.options?.length) return NextResponse.json(data)
    } catch { /* retry */ }
  }
  return NextResponse.json({ error: 'Transport suggestions failed' }, { status: 500 })
}
