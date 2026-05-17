import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

import { getSeasonNote } from '@/lib/ai/season'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }


const STYLE_GUIDE: Record<string, string> = {
  budget:    'hostels, free attractions, local street food — minimize costs',
  comfort:   'mix of paid and free, local restaurants, 3-star comfort',
  luxury:    'premium experiences, fine dining, exclusive access',
  adventure: 'outdoor, physical, adrenaline-focused activities',
  family:    'child-safe, no late nights, family-friendly restaurants, easy walks',
}

export async function POST(req: NextRequest) {
  const { destination, city, day_number, current_activities, start_date, budget, travel_style } = await req.json()

  const existing = (current_activities || []).map((a: { name: string }) => a.name).join(', ')
  const locationLabel = city && city !== destination ? `${city} (part of ${destination} trip)` : destination
  const seasonNote  = start_date ? getSeasonNote(destination, start_date) : ''
  const styleGuide  = STYLE_GUIDE[travel_style ?? 'comfort'] ?? 'comfortable, value-for-money'
  const budgetNote  = budget
    ? `Activity budget: keep total activity costs for this day under ₹${Math.round(budget * 0.15 / Math.max(1, 1))} approx.`
    : ''

  const prompt = `You are an expert India travel planner. Suggest 5 fresh activities for Day ${day_number} of a trip, currently in ${locationLabel}.

Travel style: ${travel_style || 'comfort'} — ${styleGuide}
${seasonNote ? `Season: ${seasonNote}` : ''}
${budgetNote}
Current activities to AVOID repeating: ${existing || 'none'}

Activities must be:
- Real, named places in ${locationLabel}
- Appropriate for the current season
- Time-sequenced across a full day (morning → evening)
- Mix of free and paid

Return ONLY valid JSON:
{
  "activities": [
    {
      "name": "Activity name",
      "description": "What you do and why it is worth it — be specific",
      "start_time": "09:00",
      "end_time": "11:00",
      "cost": 200,
      "type": "sightseeing",
      "location": "Exact place name, ${locationLabel}",
      "is_free": false,
      "order_index": 0
    }
  ]
}

Types allowed: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness
All costs in INR.`

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: attempt === 0 ? 0.8 : 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (!data.activities?.length) throw new Error('empty')
      return NextResponse.json(data)
    } catch {
      if (attempt === 1) return NextResponse.json({ error: 'Refine failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Refine failed' }, { status: 500 })
}
