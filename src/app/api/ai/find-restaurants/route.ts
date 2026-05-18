import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getSeasonNote } from '@/lib/ai/season'
import { getFestivalNote } from '@/lib/ai/festivals'
import { ANTI_HALLUCINATION_RESTAURANTS, JSON_OUTPUT_RULE } from '@/lib/ai/prompts'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }

export async function POST(req: NextRequest) {
  const { destination, diet, cuisine, budget_range, start_date } = await req.json()

  const dietLabel = diet === 'veg'    ? 'vegetarian ONLY (no meat, no eggs). Return ONLY 100% veg restaurants.' :
                    diet === 'jain'   ? 'Jain vegetarian (STRICTLY no root vegetables: no onion, garlic, potato, carrot, beetroot).' :
                    diet === 'nonveg' ? 'non-vegetarian (prominently include meat, seafood options specific to this region).' :
                    'both vegetarian and non-vegetarian — best of each'

  const budgetLabel = budget_range === 'budget' ? 'budget eateries under ₹300 for two' :
                      budget_range === 'fine'   ? 'fine dining ₹800+ for two' :
                                                  'mid-range ₹300–800 for two'

  const cuisineFilter = cuisine && cuisine !== 'any'
    ? `Focus on ${cuisine} cuisine.`
    : 'Mix regional/local cuisine AND any other prominent cuisines in the city.'

  const seasonNote   = start_date ? getSeasonNote(destination, start_date) : ''
  const festivalNote = start_date ? getFestivalNote(destination, start_date) : ''

  const systemPrompt = `You are an expert India food critic and restaurant guide.

${ANTI_HALLUCINATION_RESTAURANTS}

DIET ENFORCEMENT:
- If diet=veg: EVERY restaurant must be 100% vegetarian. Zero exceptions.
- If diet=jain: EVERY restaurant must serve Jain food. Set is_jain_friendly=true on all.
- If diet=nonveg: include at least 3 clearly non-vegetarian options with regional meat/seafood dishes.

RULES:
- 6 real, named restaurants that verifiably exist in ${destination}
- area: exact neighborhood (e.g. "Bandra West" not just "Mumbai")
- cost_for_two in INR (be realistic for the city — Mumbai/Goa higher, tier-2 cities lower)
- rating: 3.5-5.0 (honest — not every place is 4.8)
- open_hours: actual operating hours if you know them
- must_try: EXACT dish name with descriptor (e.g. "Dum Mutton Biryani — slow-cooked in clay pot, 2hr wait on Sundays" not just "biryani")

${JSON_OUTPUT_RULE}`

  const userPrompt = `Suggest 6 restaurants in ${destination} for: ${dietLabel}, ${budgetLabel}. ${cuisineFilter}

${seasonNote ? `SEASON NOTE: ${seasonNote}` : ''}
${festivalNote ? `FESTIVAL/EVENT CONTEXT: ${festivalNote}` : ''}

Return JSON:
{
  "restaurants": [
    {
      "name": "Exact restaurant name",
      "area": "Exact neighborhood in ${destination}",
      "cuisine": "Specific cuisine type (e.g. Konkan Seafood, Rajasthani Thali, Hyderabadi)",
      "is_veg": true,
      "is_jain_friendly": false,
      "cost_for_two": 600,
      "must_try": "Specific dish name with a reason why it's special",
      "description": "One sentence about this restaurant's specific appeal",
      "open_hours": "11:00 AM – 11:00 PM",
      "rating": 4.3
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
        temperature: attempt === 0 ? 0.6 : 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
      const data = JSON.parse(completion.choices[0].message.content || '{}')
      if (data.restaurants?.length) {
        // Server-side diet enforcement: filter violators rather than silently pass them
        if (diet === 'veg') {
          data.restaurants = data.restaurants.filter((r: { is_veg?: boolean }) => r.is_veg === true)
        }
        if (data.restaurants.length) return NextResponse.json(data)
      }
    } catch { /* retry */ }
  }
  return NextResponse.json({ error: 'Restaurant search failed' }, { status: 500 })
}
