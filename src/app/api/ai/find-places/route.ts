import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { getFestivalNote } from '@/lib/ai/festivals'
import { ANTI_HALLUCINATION_PLACES, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { error } = await aiGuard(req)
  if (error) return error

  const { city, destination, travel_style, start_date, category, exclude = [] } = await req.json()

  const target = city || destination
  const seasonNote   = start_date ? getSeasonNote(target, start_date) : ''
  const festivalNote = start_date ? getFestivalNote(target, start_date) : ''
  const catFilter = category && category !== 'all' ? `Focus only on ${category} places.` : 'Include a varied mix of types.'

  const styleNote = travel_style === 'budget'    ? 'Prefer free or low-cost attractions.'
                  : travel_style === 'luxury'    ? 'Include premium experiences and iconic landmarks.'
                  : travel_style === 'adventure' ? 'Prioritise adventure, trekking, and outdoor spots.'
                  : travel_style === 'family'    ? 'Favour family-friendly and child-safe attractions.'
                  : 'Mix popular and offbeat places.'

  const excludeNote = exclude.length > 0
    ? `Do NOT include any of these already-shown places (or close variants): ${exclude.join(', ')}`
    : ''

  const systemPrompt = `You are an expert India travel guide with deep local knowledge of every state.

${ANTI_HALLUCINATION_PLACES}

RULES:
- Return EXACTLY 8 places (no more, no less)
- Each place must be REAL and verifiable on Google Maps / Wikipedia by its exact name
- "type" must be one of: sightseeing, culture, nature, adventure, beach, shopping, wellness, food
- entry_fee in INR (0 if free)
- duration_hours: realistic visit time (0.5 to 5)
- rating: 3.8-5.0 (be honest, don't always say 4.8)
- best_time: specific window (e.g. "6am-9am to avoid crowds" not "morning")
- location: specific enough to drop a Google Maps pin (e.g. "Hampi Bazaar, near Virupaksha Temple")
- description: 2 SHORT sentences — what it is + why visit. Mention monsoon impact if relevant.
- why_visit: 1 line specific to this traveller's style/season

${JSON_OUTPUT_RULE}`

  const userPrompt = `List 8 must-visit places in ${target}${destination && city && city !== destination ? ` (part of a trip to ${destination})` : ''}.

${seasonNote ? `SEASON: ${seasonNote}` : ''}
${festivalNote ? `EVENTS: ${festivalNote}` : ''}
TRAVEL STYLE: ${styleNote}
${catFilter}
${excludeNote}

Return JSON:
{
  "places": [
    {
      "name": "Exact place name",
      "type": "sightseeing",
      "area": "Locality or area within ${target}",
      "description": "2 sentences: what it is and why visit",
      "why_visit": "One compelling reason specific to this traveller/season",
      "entry_fee": 0,
      "is_free": true,
      "duration_hours": 1.5,
      "best_time": "Early morning or late afternoon",
      "rating": 4.5,
      "location": "Landmark name, Area, ${target}",
      "is_must_visit": true
    }
  ]
}

MUST VISIT RULE: Exactly 5 of the 8 places must have is_must_visit: true — the iconic, unmissable ones no visitor should skip. The remaining 3 are good but optional. Set is_must_visit: false on those.`

  const baseTemp = exclude.length > 0 ? 0.85 : 0.6

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? baseTemp : 0.5,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (data.places?.length) {
        // Server-side dedup against exclude list (loose match)
        if (exclude.length > 0) {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
          const excludeNorm = (exclude as string[]).map(norm)
          data.places = data.places.filter(
            (p: { name: string }) => !excludeNorm.some(e => norm(p.name).includes(e) || e.includes(norm(p.name)))
          )
        }
        if (data.places.length) return NextResponse.json(data)
      }
    } catch { /* retry */ }
  }
  return NextResponse.json({ error: 'Places search failed' }, { status: 500 })
}
