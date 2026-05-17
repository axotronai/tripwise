import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { generateDays } from '@/lib/utils/trip'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trips')
    .select('*, itinerary_days(id, activities(id))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reshape so that `days` is an array of { activities: [...] } for progress calc in dashboard
  const trips = (data || []).map(t => {
    const { itinerary_days, ...rest } = t as Record<string, unknown> & { itinerary_days?: { id: string; activities: { id: string }[] }[] }
    return { ...rest, days: itinerary_days ?? [] }
  })

  return NextResponse.json(trips)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { destination, start_city, start_date, end_date, total_days, total_budget, travel_style, group_size, children } = body

  const admin = createAdminClient()

  // Resolve user ID — create anonymous Supabase user for guests so FK constraint is satisfied
  let userId = user?.id
  let guestUserId: string | undefined
  if (!userId) {
    const guestEmail = `guest-${crypto.randomUUID()}@tripwise.guest`
    const { data: anonData, error: anonErr } = await admin.auth.admin.createUser({
      email: guestEmail,
      email_confirm: true,
      app_metadata: { is_guest: true },
    })
    if (anonErr || !anonData.user) {
      return NextResponse.json({ error: 'Could not create guest session' }, { status: 500 })
    }
    userId = anonData.user.id
    guestUserId = userId
  }

  const tripData = {
    user_id: userId,
    title: `${destination} Trip`,
    destination,
    start_city,
    start_date,
    end_date,
    total_days,
    total_budget,
    travel_style,
    group_size,
    children: children ?? 0,
  }

  let { data: trip, error: tripError } = await admin.from('trips').insert(tripData).select().single()
  if (tripError && tripError.message.includes('children')) {
    // children column not yet added — run schema-update.sql in Supabase to fix
    const { children: _c, ...tripDataWithoutChildren } = tripData
    const res2 = await admin.from('trips').insert(tripDataWithoutChildren).select().single()
    trip = res2.data
    tripError = res2.error
  }
  if (tripError) {
    console.error('Trip insert error:', tripError.message)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }

  // Create empty itinerary days
  const days = generateDays(start_date, end_date, destination).map((d) => ({ ...d, trip_id: trip.id }))
  await admin.from('itinerary_days').insert(days)

  // Return guest user ID so client can detect guest mode
  return NextResponse.json({ ...trip, guest_user_id: guestUserId })
}
