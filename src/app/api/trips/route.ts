import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { generateDays } from '@/lib/utils/trip'

// ─── Simple in-memory rate limiter for guest trip creation ───────────────────
// Resets between serverless cold-starts — that's fine; the goal is preventing
// rapid automated abuse within a single session, not cross-restart tracking.
const GUEST_RATE: Map<string, { count: number; resetAt: number }> = new Map()
const GUEST_MAX  = 3    // max guest trips per IP per window
const WINDOW_MS  = 60 * 60 * 1000  // 1 hour

function checkGuestRateLimit(ip: string): boolean {
  const now  = Date.now()
  const entry = GUEST_RATE.get(ip)
  if (!entry || now > entry.resetAt) {
    GUEST_RATE.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= GUEST_MAX) return false
  entry.count++
  return true
}

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
  const { destination, start_city, start_date, end_date, total_days, total_budget, travel_style, group_size, children, diet } = body

  const admin = createAdminClient()

  // Resolve user ID — create anonymous Supabase user for guests so FK constraint is satisfied
  let userId = user?.id
  let guestUserId: string | undefined
  if (!userId) {
    // Rate-limit guest trip creation by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkGuestRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many guest trips created. Please sign in or try again later.' },
        { status: 429 }
      )
    }

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
    user_id:      userId,
    title:        `${destination} Trip`,
    destination,
    start_city,
    start_date,
    end_date,
    total_days,
    total_budget,
    travel_style,
    group_size,
    children:     children ?? 0,
    diet:         diet ?? 'any',
  }

  let { data: trip, error: tripError } = await admin.from('trips').insert(tripData).select().single()
  if (tripError && (tripError.message.includes('children') || tripError.message.includes('diet') || tripError.message.includes('ai_insights'))) {
    // Graceful fallback: strip columns that haven't been added to the DB schema yet
    const { children: _c, diet: _d, ai_insights: _ai, ...tripDataCore } = tripData as typeof tripData & { ai_insights?: string }
    const res2 = await admin.from('trips').insert(tripDataCore).select().single()
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
