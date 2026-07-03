import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { ANTI_HALLUCINATION_PLACES, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { error } = await aiGuard(req)
  if (error) return error

  const { destination, activity, start_date, budget, travel_style } = await req.json()

  const seasonNote = start_date ? getSeasonNote(destination, start_date) : ''
  const budgetHint = budget ? `Trip budget: ₹${budget}. Alternative costs proportional.` : ''
  const styleHint  = travel_style ? `Travel style: ${travel_style}.` : ''

  const systemPrompt = `You are an expert India travel planner. You suggest 3 SWAP-IN alternatives for a single activity.

${ANTI_HALLUCINATION_PLACES}

CRITICAL RULES:
- Exactly 3 alternatives, ONE PER CATEGORY:
  1. category="cheaper" — clearly cheaper or free version of similar experience
  2. category="similar" — comparable experience at similar price point
  3. category="offbeat" — unique/hidden gem most tourists miss
- Location proximity: each alternative must be WITHIN 5KM of the original activity location, OR reachable in ≤30 min transit (call this out in "reason")
- Season-appropriate (skip waterfalls in dry season, skip beaches in monsoon for Goa)
- Style-appropriate to ${travel_style || 'comfort'}

${JSON_OUTPUT_RULE}`

  const userPrompt = `Swap alternatives for: "${activity.name}"
- Type: ${activity.type}
- Cost: ₹${activity.cost}
${activity.location ? `- Location: ${activity.location}` : ''}
- Destination: ${destination}

${seasonNote ? `Season: ${seasonNote}` : ''}
${budgetHint} ${styleHint}

Return JSON:
{
  "alternatives": [
    {
      "category": "cheaper",
      "name": "Specific named place",
      "description": "What it is, what you do — 1-2 sentences",
      "location": "Exact area/landmark in ${destination}",
      "cost": 100,
      "is_free": false,
      "type": "sightseeing",
      "reason": "Why this swap works (mention proximity to original)"
    },
    { "category": "similar", "...": "..." },
    { "category": "offbeat", "...": "..." }
  ]
}
Types allowed: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness.`

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant', // 3-item suggestion, fast UX
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? 0.8 : 0.5,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (!data.alternatives?.length) throw new Error('empty')
      return NextResponse.json(data)
    } catch {
      if (attempt === 1) return NextResponse.json({ error: 'Suggest failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Suggest failed' }, { status: 500 })
}
