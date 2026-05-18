import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requireTripOwner } from '@/lib/supabase/auth-guard'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()

  const { data: trip, error } = await admin.from('trips').select('*').eq('id', id).single()
  if (error || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const { data: days } = await admin
    .from('itinerary_days')
    .select('*, activities(*)')
    .eq('trip_id', id)
    .order('day_number')

  const daysWithSorted = (days || []).map(day => ({
    ...day,
    activities: (day.activities || []).sort(
      (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
    ),
  }))

  return NextResponse.json({ trip, days: daysWithSorted })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()

  const body = await req.json()
  const allowed = ['total_budget', 'travel_style', 'group_size', 'children', 'title', 'ai_insights']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const { data, error } = await admin
    .from('trips')
    .update(update)
    .eq('id', id)
    .eq('user_id', guard.userId) // belt-and-suspenders: re-assert ownership at DB level
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()
  const { error } = await admin
    .from('trips')
    .delete()
    .eq('id', id)
    .eq('user_id', guard.userId) // belt-and-suspenders: re-assert ownership at DB level

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
