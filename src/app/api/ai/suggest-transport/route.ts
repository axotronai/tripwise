import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { from, to, date, travel_style = 'comfort', group_size = 1 } = await req.json()

  const styleNote =
    travel_style === 'budget'    ? 'Prioritise cheapest options (bus, sleeper train).' :
    travel_style === 'luxury'    ? 'Prioritise flights and premium trains (1AC, Vande Bharat).' :
    travel_style === 'adventure' ? 'Include scenic routes. Overnight trains are fine.' :
    travel_style === 'family'    ? 'Prefer comfortable, family-friendly options with reserved seats.' :
    'Include a mix of all modes at reasonable prices.'

  const prompt = `You are an expert India travel logistics planner. Suggest 3–4 real transport options from ${from} to ${to} for ${group_size} traveller(s).

Travel date: ${date || 'flexible'}
Travel style: ${styleNote}

Return ONLY valid JSON — no markdown:
{
  "options": [
    {
      "mode": "train",
      "operator": "Indian Railways",
      "name": "Rajdhani Express",
      "number": "12951",
      "departure": "16:25",
      "arrival": "08:15+1",
      "duration": "15h 50m",
      "cost_per_person": 2100,
      "class": "3AC",
      "highlights": "Comfortable overnight journey, saves a day",
      "book_at": "irctc.co.in"
    }
  ]
}

Rules:
- Use REAL trains/flights/buses that actually operate on this route
- mode: one of "train", "flight", "bus", "cab"
- cost_per_person in INR
- departure/arrival in HH:MM (24h), add +1 for next day
- Always include at least one train option if the route has rail connectivity
- For short routes (<300km) include cab option
- book_at: "irctc.co.in" for trains, "makemytrip.com" or "goibibo.com" for flights, "redbus.in" for buses
- highlights: one line on why to pick this option`

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })
    const data = JSON.parse(completion.choices[0].message.content || '{}')
    if (data.options?.length) return NextResponse.json(data)
    return NextResponse.json({ options: [] })
  } catch {
    return NextResponse.json({ error: 'Transport suggestions failed' }, { status: 500 })
  }
}
