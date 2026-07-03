import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { generateDays } from '@/lib/utils/trip'
import { CreateTripSchema, parseBody, checkOrigin } from '@/lib/api/trip-schema'

// ─── Rate limiter — both guest and authenticated users ────────────────────────
// Booking sites enforce per-user creation limits to prevent resource abuse.
const TRIP_RATE: Map<string, { count: number; resetAt: number }> = new Map()
const GUEST_MAX = 3   // 3 trips/hour for guests (by IP)
const AUTH_MAX  = 20  // 20 trips/hour for authenticated users
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkTripRate(key: string, max: number): { allowed: boolean; retryAfterSec: number } {
  const now   = Date.now()
  const entry = TRIP_RATE.get(key)
  if (!entry || now > entry.resetAt) {
    TRIP_RATE.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true, retryAfterSec: 0 }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()        ||
    'unknown'
  )
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

  // Sanitize: never return raw DB error messages to the client
  if (error) {
    console.error('[trips/GET] DB error:', error.code, error.message)
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 })
  }

  // Reshape so that `days` is an array of { activities: [...] } for progress calc in dashboard
  const trips = (data || []).map(t => {
    const { itinerary_days, ...rest } = t as Record<string, unknown> & { itinerary_days?: { id: string; activities: { id: string }[] }[] }
    return { ...rest, days: itinerary_days ?? [] }
  })

  return NextResponse.json(trips)
}

export async function POST(req: NextRequest) {
  // ── CSRF origin check (booking-site standard) ──────────────────────────────
  const originCheck = checkOrigin(req)
  if (originCheck !== true) return originCheck

  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Validate input with Zod (replaces raw body destructuring) ─────────────
  const { data: body, error: validationError } = await parseBody(req, CreateTripSchema)
  if (validationError) return validationError

  const admin = createAdminClient()

  // ── Rate limiting — both guests and auth users ─────────────────────────────
  let userId = user?.id
  let guestUserId: string | undefined

  if (!userId) {
    const ip = getIp(req)
    const { allowed, retryAfterSec } = checkTripRate(`guest:${ip}`, GUEST_MAX)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many trips created. Please sign in or try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }

    // Create anonymous Supabase user for guests so FK constraint is satisfied
    const guestEmail = `guest-${crypto.randomUUID()}@tripwise.guest`
    const { data: anonData, error: anonErr } = await admin.auth.admin.createUser({
      email: guestEmail,
      email_confirm: true,
      app_metadata: { is_guest: true },
    })
    if (anonErr || !anonData.user) {
      console.error('[trips/POST] Guest user creation failed:', anonErr?.message)
      return NextResponse.json({ error: 'Could not create guest session' }, { status: 500 })
    }
    userId = anonData.user.id
    guestUserId = userId

  } else {
    // Auth user rate limit (prevents abuse even for legitimate accounts)
    const { allowed, retryAfterSec } = checkTripRate(`auth:${userId}`, AUTH_MAX)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many trips created this hour. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }
  }

  // ── Build validated trip data ──────────────────────────────────────────────
  const { destination, start_city, start_date, end_date, total_days, total_budget, travel_style, group_size, children, diet } = body

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
    children,
    diet,
  }

  let { data: trip, error: tripError } = await admin.from('trips').insert(tripData).select().single()

  // Graceful fallback: strip columns that haven't been added to the DB schema yet
  if (tripError && (tripError.message.includes('children') || tripError.message.includes('diet') || tripError.message.includes('ai_insights'))) {
    const { children: _c, diet: _d, ai_insights: _ai, ...tripDataCore } = tripData as typeof tripData & { ai_insights?: string }
    const res2 = await admin.from('trips').insert(tripDataCore).select().single()
    trip = res2.data
    tripError = res2.error
  }

  if (tripError) {
    console.error('[trips/POST] Insert error:', tripError.code, tripError.message)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }

  // Create empty itinerary days
  const days = generateDays(start_date, end_date, destination).map(d => ({ ...d, trip_id: trip.id }))
  await admin.from('itinerary_days').insert(days)

  return NextResponse.json({ ...trip, guest_user_id: guestUserId })
}
