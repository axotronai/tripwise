import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { ANTI_HALLUCINATION_HOTELS, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

function buildMapUrl(name: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`
}

export async function POST(req: NextRequest) {
  const { error } = await aiGuard(req)
  if (error) return error

  const { city, checkin, checkout, nights, guests = 1, travel_style = 'comfort', budget_per_night = 3000 } = await req.json()

  const maxBudget = Math.round(budget_per_night * 2)  // hard cap at 2x budget
  const minBudget = Math.round(budget_per_night * 0.5) // soft floor at 50%

  const styleNote =
    travel_style === 'budget'    ? `Suggest budget hotels UNDER ₹${Math.min(1500, budget_per_night)}/ night: Zostel, OYO Townhouse, FabHotel, Treebo, GoStops, budget guesthouses.` :
    travel_style === 'luxury'    ? `Suggest luxury/premium hotels ₹${Math.max(5000, budget_per_night)}+/night: Taj, Leela, Marriott, ITC, Hyatt, Aman, Oberoi.` :
    travel_style === 'adventure' ? `Suggest hostels, camping resorts, eco-stays, adventure camps, home-stays — adventurous accommodation.` :
    travel_style === 'family'    ? `Suggest family-friendly resorts with pools, kid amenities, connecting rooms. Well-reviewed hygiene.` :
    `Suggest mid-range hotels around ₹${budget_per_night}/night: Treebo, Lemon Tree, Ibis, Ginger, WelcomHotel, FabHotel Premium.`

  const systemPrompt = `You are an expert India hotel recommender.

${ANTI_HALLUCINATION_HOTELS}

BUDGET RULE (CRITICAL):
- cost_per_night must be between ₹${minBudget} and ₹${maxBudget}
- Never suggest a hotel whose typical rate is wildly outside this range
- Include a mix of price points within the range (don't make all 4 the same price)

RULES:
- 4 hotels, all REAL and verifiable in ${city}
- area: exact neighborhood (e.g. "Calangute Beach, North Goa" not just "Goa")
- rating: 3.0–5.0 (honest)
- amenities: list actual amenities (don't guess — base on hotel tier)
- highlights: 1 specific compelling reason (location, pool, view, breakfast, value — be concrete)
- Do NOT include map_url in your JSON — it is added server-side

${JSON_OUTPUT_RULE}`

  const userPrompt = `Suggest 4 real hotels in ${city} for ${guests} guest(s).
Check-in: ${checkin}, Check-out: ${checkout} (${nights} nights).

${styleNote}
Budget target: ~₹${budget_per_night}/night per room. Stay within ₹${minBudget}–₹${maxBudget}.

Return JSON:
{
  "hotels": [
    {
      "name": "Exact hotel name",
      "area": "Neighborhood/area in ${city}",
      "rating": 4.3,
      "cost_per_night": 2500,
      "amenities": ["WiFi", "AC", "Pool", "Breakfast"],
      "highlights": "One specific compelling reason to pick this hotel"
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
        temperature: attempt === 0 ? 0.5 : 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (data.hotels?.length) {
        // Add map_url server-side (never let model generate URLs — it returns placeholders)
        data.hotels = data.hotels.map((h: { name: string; cost_per_night?: number }) => ({
          ...h,
          cost_per_night: Math.max(minBudget, Math.min(maxBudget, h.cost_per_night ?? budget_per_night)),
          map_url: buildMapUrl(h.name, city),
        }))
        return NextResponse.json(data)
      }
    } catch { /* retry */ }
  }
  return NextResponse.json({ error: 'Hotel suggestions failed' }, { status: 500 })
}
