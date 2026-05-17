import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

import { getSeasonNote } from '@/lib/ai/season'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }) }


function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()
  const { trip, days, dayHotels, savedTransports } = context || {}

  const bookedHotels = Object.entries(dayHotels || {})
    .map(([dayId, hotel]: [string, unknown]) => {
      const h = hotel as { name: string; price_per_night: number }
      const day = (days || []).find((d: { id: string; day_number: number }) => d.id === dayId)
      return day ? `  Day ${day.day_number}: ${h.name} (₹${h.price_per_night}/night)` : null
    })
    .filter(Boolean)
    .join('\n')

  const bookedTransport = (savedTransports || [])
    .map((t: { mode: string; operator: string; from_city: string; to_city: string; duration: string; cost: number }) =>
      `  ${t.mode}: ${t.operator} — ${t.from_city} → ${t.to_city} (${t.duration}, ₹${t.cost})`
    )
    .join('\n')

  // Send ALL days as compact summary, not just first 5
  const allDaySummaries = (days || [])
    .map((d: { day_number: number; city: string; date?: string; activities?: Array<{ name: string; cost: number; is_free: boolean }> }) => {
      const acts = (d.activities || []).map((a) => a.name).join(', ')
      const dayCost = (d.activities || []).reduce((s: number, a) => s + (a.is_free ? 0 : a.cost), 0)
      const dateStr = d.date ? ` (${fmtDate(d.date)})` : ''
      return acts
        ? `  Day ${d.day_number}${dateStr} — ${d.city}: ${acts}${dayCost > 0 ? ` [₹${dayCost}]` : ''}`
        : null
    })
    .filter(Boolean)
    .join('\n')

  const totalActivityCost = (days || []).reduce(
    (s: number, d: { activities?: Array<{ cost: number; is_free: boolean }> }) =>
      s + (d.activities || []).reduce((ds: number, a) => ds + (a.is_free ? 0 : a.cost), 0),
    0
  )

  const seasonNote = (trip?.start_date && trip?.destination)
    ? getSeasonNote(trip.destination, trip.start_date)
    : ''

  const systemPrompt = `You are TripWise AI — a friendly, expert India travel assistant helping plan this specific trip:

TRIP: ${trip?.title || 'India trip'}
DESTINATION: ${trip?.destination}
FROM: ${trip?.start_city}
DATES: ${trip?.start_date ? fmtDate(trip.start_date) : '?'} to ${trip?.end_date ? fmtDate(trip.end_date) : '?'} (${trip?.total_days} days)
BUDGET: ₹${trip?.total_budget?.toLocaleString('en-IN') ?? '?'} for ${trip?.group_size} adult${trip?.group_size !== 1 ? 's' : ''}${trip?.children ? ` + ${trip.children} child${trip.children !== 1 ? 'ren' : ''}` : ''}
TRAVEL STYLE: ${trip?.travel_style}
${seasonNote ? `WEATHER/SEASON: ${seasonNote}` : ''}
ACTIVITIES PLANNED (₹${totalActivityCost.toLocaleString('en-IN')} in activity costs):
${allDaySummaries || '  No activities planned yet'}
${bookedHotels ? `BOOKED HOTELS:\n${bookedHotels}` : ''}
${bookedTransport ? `BOOKED TRANSPORT:\n${bookedTransport}` : ''}

RULES:
- Be helpful, warm, conversational and specific to India travel
- Always reference their actual trip details (destination, budget, dates, specific activities)
- Use ₹ for all costs
- Keep answers concise — 2–4 sentences unless listing items
- For lists, use plain bullet points with • (not markdown asterisks)
- If asked about weather: give the WEATHER/SEASON note above with specific practical advice
- If asked about packing: tailor recommendations for the season above
- If asked about a specific activity in their plan: reference it by name and day number
- If over-budget concerns: give realistic money-saving tips for ${trip?.destination}
- Do NOT use **bold** or *italic* markdown — it will not render`

  // Strip the greeting from messages before sending to API (it's display-only)
  const apiMessages = messages.filter((m: { role: string; content: string }) =>
    !(m.role === 'assistant' && m.content.startsWith("Hi! I'm your TripWise AI"))
  )

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...apiMessages.slice(-14),
      ],
      temperature: 0.7,
      max_tokens: 700,
    })
    const reply = completion.choices[0].message.content || 'Sorry, I could not generate a response.'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
