import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { styleGuide, dietGuide, ANTI_HALLUCINATION_PLACES, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { error } = await aiGuard(req)
  if (error) return error

  const { destination, city, day_number, current_activities, start_date, budget, travel_style, diet = 'any', total_days = 1 } = await req.json()

  const existingNames = (current_activities || []).map((a: { name: string }) => a.name)
  const existing = existingNames.join(', ')
  const locationLabel = city && city !== destination ? `${city} (part of ${destination} trip)` : destination
  const seasonNote   = start_date ? getSeasonNote(destination, start_date) : ''

  // Existing time slots so refinements don't collide
  const usedSlots = (current_activities || [])
    .map((a: { start_time?: string; end_time?: string }) => a.start_time && a.end_time ? `${a.start_time}-${a.end_time}` : null)
    .filter(Boolean)
    .join(', ')

  // FIX: previously divided by Math.max(1,1) → always 1. Now use total_days correctly.
  const perDayActivityCap = budget
    ? Math.round((budget * 0.15) / Math.max(1, total_days))
    : null

  const systemPrompt = `You are an expert India travel planner. You suggest fresh, time-coherent activities for a single day.

${ANTI_HALLUCINATION_PLACES}

RULES:
- 5 activities, time-sequenced morning → evening
- Real, named places in the given location (no "Local Market" or "Beautiful Beach")
- AVOID the existing activities (do not duplicate, do not name very similar items)
- If existing time slots are given, propose activities that fit in the GAPS, not overlapping slots
- Mix of free + paid (mark is_free + cost in INR)
- Style-appropriate: ${travel_style || 'comfort'} → ${styleGuide(travel_style || 'comfort')}
- Food preference: ${dietGuide(diet)}

${JSON_OUTPUT_RULE}`

  const userPrompt = `Suggest 5 activities for Day ${day_number} in ${locationLabel}.

${seasonNote ? `SEASON: ${seasonNote}` : ''}
EXISTING ACTIVITIES (do NOT repeat): ${existing || 'none yet'}
${usedSlots ? `EXISTING TIME SLOTS (avoid overlap): ${usedSlots}` : ''}
${perDayActivityCap ? `Try to keep total cost for the 5 suggestions under ₹${perDayActivityCap}.` : ''}

Return JSON:
{
  "activities": [
    {
      "name": "Activity name",
      "description": "What you do here & why — 1-2 specific sentences",
      "start_time": "09:00",
      "end_time": "11:00",
      "cost": 200,
      "type": "sightseeing",
      "location": "Exact landmark/area in ${locationLabel}",
      "is_free": false,
      "order_index": 0
    }
  ]
}
Types allowed: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness.`

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant', // single-day suggestion — fast UX matters more than depth
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? 0.8 : 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (!data.activities?.length) throw new Error('empty')

      // Server-side dedup: filter out any activity whose name closely matches existing
      const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
      const existingNorm = existingNames.map(normalized)
      data.activities = data.activities.filter(
        (a: { name: string }) => !existingNorm.includes(normalized(a.name))
      )
      if (!data.activities.length) throw new Error('all duplicates')

      return NextResponse.json(data)
    } catch {
      if (attempt === 1) return NextResponse.json({ error: 'Refine failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Refine failed' }, { status: 500 })
}
