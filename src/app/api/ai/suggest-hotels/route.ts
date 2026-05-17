import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { city, checkin, checkout, nights, guests = 1, travel_style = 'comfort', budget_per_night = 3000 } = await req.json()

  const styleNote =
    travel_style === 'budget'    ? 'Suggest budget hotels under ₹1500/night: OYO, Zostel, FabHotel, budget guesthouses.' :
    travel_style === 'luxury'    ? 'Suggest luxury/premium hotels ₹5000+/night: Taj, Leela, Marriott, ITC, Hyatt.' :
    travel_style === 'adventure' ? 'Suggest hostels, camping resorts, eco-stays, adventure camps.' :
    travel_style === 'family'    ? 'Suggest family-friendly resorts with pools, kid amenities, connecting rooms.' :
    `Suggest mid-range hotels around ₹${budget_per_night}/night: Treebo, Lemon Tree, IbisHotel, Ginger, WelcomHotel.`

  const prompt = `You are an expert India hotel recommender. Suggest 4 real hotels in ${city} for ${guests} guest(s) checking in ${checkin}, checking out ${checkout} (${nights} nights).

${styleNote}

Return ONLY valid JSON:
{
  "hotels": [
    {
      "name": "Exact hotel name",
      "area": "Neighborhood/area in ${city}",
      "rating": 4.3,
      "cost_per_night": 2500,
      "amenities": ["WiFi", "AC", "Pool", "Breakfast"],
      "highlights": "One compelling reason to pick this hotel",
      "map_url": "https://www.google.com/maps/search/?api=1&query=Hotel+Name+${city}"
    }
  ]
}

Rules:
- Use REAL hotels that actually exist in ${city}
- cost_per_night in INR per room
- rating between 3.0 and 5.0
- amenities: list actual amenities for that hotel type
- highlights: one specific compelling reason (view, location, value, etc.)
- area: exact neighborhood (e.g. "Calangute Beach, North Goa" not just "Goa")`

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })
    const data = JSON.parse(completion.choices[0].message.content || '{}')
    if (data.hotels?.length) return NextResponse.json(data)
    return NextResponse.json({ hotels: [] })
  } catch {
    return NextResponse.json({ error: 'Hotel suggestions failed' }, { status: 500 })
  }
}
