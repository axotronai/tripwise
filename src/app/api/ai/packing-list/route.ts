import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { getFestivalNote } from '@/lib/ai/festivals'
import { JSON_OUTPUT_RULE } from '@/lib/ai/prompts'
import { aiGuard, logTokenUsage } from '@/lib/ai/guard'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { userId, error } = await aiGuard(req)
  if (error) return error

  const { destination, days, tripType, season, travelers, start_date } = await req.json()

  const seasonContext = start_date ? getSeasonNote(destination, start_date) : season || ''
  const festivalContext = start_date ? getFestivalNote(destination, start_date, days) : ''

  const systemPrompt = `You are an expert India packer. You build smart, season-specific packing lists based on REAL conditions in each destination.

CONSTRAINTS:
- 6-10 items per category, no fluff (skip generic "clothes" — say "3 quick-dry t-shirts")
- Items must be season + destination specific
  GOOD: "Quick-dry trekking pants for monsoon Munnar", "Woolen socks for -10°C Ladakh nights"
  BAD: "Pants", "Socks", "Jacket"
- Documents category: ALWAYS include Aadhaar Card + photo ID. Mention IRCTC e-ticket only if relevant.
- Medicines: include altitude meds (Diamox) for Ladakh/Spiti, ORS for hot regions, mosquito repellent for Northeast/Andaman.
- Destination-Specific category: things uniquely needed (e.g. modest temple cover-up for Varanasi, swim gear for Goa, ILP permit reminder for Nagaland/Arunachal).
- Tips: 4-5 practical insider tips that depend on the actual season above — not generic advice.

${JSON_OUTPUT_RULE}`

  const userPrompt = `Build a packing list for:
- Destination: ${destination}
- Duration: ${days} days
- Trip type: ${tripType}
- Travellers: ${travelers}
${seasonContext ? `- SEASON CONTEXT: ${seasonContext}` : ''}
${festivalContext ? `- FESTIVAL/EVENT CONTEXT: ${festivalContext}` : ''}

Return this JSON schema (use the exact category names + emojis):
{
  "categories": [
    { "name": "Clothing", "icon": "👕", "items": ["...", "..."] },
    { "name": "Documents & Money", "icon": "📄", "items": ["Aadhaar Card", "..."] },
    { "name": "Toiletries", "icon": "🪥", "items": ["..."] },
    { "name": "Electronics", "icon": "🔌", "items": ["..."] },
    { "name": "Medicines & First Aid", "icon": "💊", "items": ["..."] },
    { "name": "Destination-Specific", "icon": "📍", "items": ["..."] }
  ],
  "tips": ["Tip 1 — must be specific to ${destination} in this season", "Tip 2", "Tip 3", "Tip 4"]
}`

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant', // lists don't need 70b — 8b is fast & cheap
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: attempt === 0 ? 0.6 : 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      logTokenUsage(userId, 'packing-list', completion.usage)
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
