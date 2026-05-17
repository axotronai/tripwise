import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

import { getSeasonNote } from '@/lib/ai/season'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }


export async function POST(req: NextRequest) {
  const { destination, activity, start_date, budget, travel_style } = await req.json()

  const seasonNote = start_date ? getSeasonNote(destination, start_date) : ''
  const budgetHint = budget ? `Trip budget: ₹${budget} total. Keep alternative costs proportional and realistic.` : ''
  const styleHint  = travel_style ? `Travel style: ${travel_style}.` : ''

  const prompt = `You are an expert India travel planner. A traveler in ${destination} wants alternatives to "${activity.name}" (type: ${activity.type}, cost: ₹${activity.cost}${activity.location ? `, near ${activity.location}` : ''}).
${seasonNote ? `\nSeason: ${seasonNote}` : ''}
${budgetHint} ${styleHint}

Suggest 3 alternatives — one cheaper/free, one similar, one unique/offbeat. All must be feasible in the current season and appropriate for the travel style.

Return ONLY valid JSON:
{
  "alternatives": [
    {
      "name": "Alternative name",
      "description": "What it is and what you do there",
      "location": "Exact area or landmark in ${destination}",
      "cost": 100,
      "is_free": false,
      "type": "sightseeing",
      "reason": "Why this is a good swap — 1 sentence"
    }
  ]
}

Types allowed: sightseeing, food, adventure, culture, beach, shopping, rest, nature, wellness
All costs in INR. Be specific to ${destination}.`

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: attempt === 0 ? 0.8 : 0.5,
        max_tokens: 900,
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
