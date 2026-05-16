import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { destination, days, budget, travel_style, group_size, start_city } = await req.json()

  const prompt = `You are an expert India travel planner. Create a detailed ${days}-day itinerary for a trip from ${start_city} to ${destination}.

Trip details:
- Duration: ${days} days
- Total budget: ₹${budget} for ${group_size} person(s)
- Travel style: ${travel_style}
- Daily budget: ₹${Math.round(budget / days)} per day

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "day_number": 1,
      "city": "${destination}",
      "theme": "Arrival & Exploration",
      "activities": [
        {
          "name": "Activity name",
          "description": "Brief description",
          "start_time": "09:00",
          "end_time": "11:00",
          "cost": 500,
          "type": "sightseeing",
          "location": "Place name, ${destination}",
          "is_free": false,
          "order_index": 0
        }
      ],
      "daily_budget": 3000,
      "food_suggestions": "Local dhabas for lunch, seafood dinner",
      "tips": "One useful tip for this day"
    }
  ],
  "transport_suggestion": "Best way to travel from ${start_city} to ${destination}",
  "best_time_tips": "Tips for this destination",
  "total_estimated_cost": ${budget}
}

Activity types: sightseeing, food, adventure, culture, beach, shopping, rest
Make activities realistic for ${destination}, India. Include free activities too. Keep costs in INR.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = completion.choices[0].message.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response')

    const itinerary = JSON.parse(jsonMatch[0])
    return NextResponse.json(itinerary)
  } catch (error) {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
