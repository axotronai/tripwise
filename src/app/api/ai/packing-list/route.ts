import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { destination, days, tripType, season, travelers } = await req.json()

  const prompt = `Generate a smart, practical packing list for a trip to ${destination}, India.
Trip details: ${days} days, ${tripType} trip, ${season} season, traveling as ${travelers}.

Return ONLY valid JSON:
{
  "categories": [
    {
      "name": "Clothing",
      "icon": "👕",
      "items": ["Item 1", "Item 2"]
    },
    {
      "name": "Documents & Money",
      "icon": "📄",
      "items": ["Aadhaar Card", "PAN Card"]
    },
    {
      "name": "Toiletries",
      "icon": "🪥",
      "items": ["Toothbrush", "Toothpaste"]
    },
    {
      "name": "Electronics",
      "icon": "🔌",
      "items": ["Phone charger", "Power bank"]
    },
    {
      "name": "Medicines & First Aid",
      "icon": "💊",
      "items": ["Paracetamol", "ORS packets"]
    },
    {
      "name": "Destination-Specific",
      "icon": "📍",
      "items": ["Item specific to ${destination}"]
    }
  ],
  "tips": ["Tip 1 specific to this destination", "Tip 2"]
}`

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: attempt === 0 ? 0.7 : 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (!data.categories?.length) throw new Error('empty response')
      return NextResponse.json(data)
    } catch {
      if (attempt === 2) {
        return NextResponse.json({ error: 'Failed to generate packing list' }, { status: 500 })
      }
    }
  }
  return NextResponse.json({ error: 'Failed to generate packing list' }, { status: 500 })
}
