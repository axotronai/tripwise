import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

import { getSeasonNote } from '@/lib/ai/season'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }


export async function POST(req: NextRequest) {
  const { city, destination, travel_style, start_date, category, exclude = [] } = await req.json()

  const seasonNote = start_date ? getSeasonNote(city || destination, start_date) : ''
  const catFilter = category && category !== 'all' ? `Focus only on ${category} places.` : 'Include a good mix of types.'

  const styleNote = travel_style === 'budget'    ? 'Prefer free or low-cost attractions.'
                  : travel_style === 'luxury'    ? 'Include premium experiences and iconic landmarks.'
                  : travel_style === 'adventure' ? 'Prioritise adventure, trekking, and outdoor spots.'
                  : travel_style === 'family'    ? 'Favour family-friendly and child-safe attractions.'
                  : 'Mix popular and offbeat places.'

  const excludeNote = exclude.length > 0
    ? `\nDo NOT include any of these already-shown places: ${exclude.join(', ')}`
    : ''

  const prompt = `You are an expert India travel guide. List 8 must-visit places and attractions in ${city || destination}${destination && city !== destination ? ` (part of a trip to ${destination})` : ''} for a traveler.

${seasonNote ? `SEASON CONTEXT: ${seasonNote}` : ''}
TRAVEL STYLE: ${styleNote}
${catFilter}${excludeNote}

Return ONLY valid JSON — no markdown, no explanation:
{
  "places": [
    {
      "name": "Exact place name",
      "type": "sightseeing",
      "area": "Locality or area within ${city || destination}",
      "description": "2 sentences: what it is and why visit",
      "why_visit": "One compelling reason specifically for this traveler/season",
      "entry_fee": 0,
      "is_free": true,
      "duration_hours": 1.5,
      "best_time": "Early morning or late afternoon",
      "rating": 4.5,
      "location": "Landmark name, Area, ${city || destination}"
    }
  ]
}

Rules:
- Use only REAL, verifiable places that actually exist in ${city || destination}
- type must be one of: sightseeing, culture, nature, adventure, beach, shopping, wellness, food
- entry_fee in INR (0 if free)
- duration_hours: realistic visit time (0.5 to 5)
- rating between 3.8 and 5.0
- Mention if the place is monsoon-friendly or should be avoided in rain (in description)
- location should be specific enough to open in Google Maps`

  const baseTemp = exclude.length > 0 ? 0.85 : 0.6

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: attempt === 0 ? baseTemp : 0.5,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (data.places?.length) return NextResponse.json(data)
    } catch { /* retry */ }
  }
  return NextResponse.json({ error: 'Places search failed' }, { status: 500 })
}
