import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDays } from '@/lib/utils/trip'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Allow unauthenticated for demo — store in session
  const body = await req.json()
  const { destination, start_city, start_date, end_date, total_days, total_budget, travel_style, group_size } = body

  const tripData = {
    user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
    title: `${destination} Trip`,
    destination,
    start_city,
    start_date,
    end_date,
    total_days,
    total_budget,
    travel_style,
    group_size,
  }

  const { data: trip, error: tripError } = await supabase.from('trips').insert(tripData).select().single()
  if (tripError) {
    // Fallback: return mock trip for demo without auth
    const mockTrip = { id: `demo-${Date.now()}`, ...tripData, created_at: new Date().toISOString() }
    return NextResponse.json(mockTrip)
  }

  // Create empty itinerary days
  const days = generateDays(start_date, end_date, destination).map((d) => ({ ...d, trip_id: trip.id }))
  await supabase.from('itinerary_days').insert(days)

  return NextResponse.json(trip)
}
