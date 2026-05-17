import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { destination, diet, cuisine, budget_range } = await req.json()

  const dietLabel = diet === 'veg' ? 'vegetarian ONLY (no meat, no eggs)' :
                    diet === 'jain' ? 'Jain vegetarian (no root vegetables, strictly pure veg)' :
                    diet === 'nonveg' ? 'non-vegetarian (include meat, seafood options)' :
                    'both vegetarian and non-vegetarian'

  const budgetLabel = budget_range === 'budget' ? 'budget eateries under ₹300 for two' :
                      budget_range === 'fine'   ? 'fine dining ₹800+ for two' :
                                                  'mid-range ₹300–800 for two'

  const cuisineFilter = cuisine && cuisine !== 'any' ? `Focus on ${cuisine} cuisine.` : 'Mix different cuisine types.'

  const prompt = `You are an expert India food and restaurant guide. Suggest 6 real, well-known restaurants in ${destination} for travelers who want ${dietLabel}, ${budgetLabel}. ${cuisineFilter}

Return ONLY valid JSON:
{
  "restaurants": [
    {
      "name": "Exact restaurant name",
      "area": "Neighborhood or area in ${destination}",
      "cuisine": "Cuisine type (e.g. Goan, North Indian, Chinese)",
      "is_veg": true,
      "is_jain_friendly": false,
      "cost_for_two": 600,
      "must_try": "Signature dish name",
      "description": "One sentence about why it is worth visiting",
      "open_hours": "9:00 AM – 11:00 PM",
      "rating": 4.3
    }
  ]
}

Rules:
- Use only real, verifiable restaurants that actually exist in ${destination}
- Include the exact neighborhood/area so users can find it easily
- cost_for_two in INR
- rating between 3.5 and 5.0
- is_veg: true only if the restaurant is 100% vegetarian
- is_jain_friendly: true only if it serves Jain food`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })
    const data = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Restaurant search failed' }, { status: 500 })
  }
}
