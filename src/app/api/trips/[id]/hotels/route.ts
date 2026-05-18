import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requireTripOwner } from '@/lib/supabase/auth-guard'

type Params = { params: Promise<{ id: string }> }

// GET /api/trips/[id]/hotels → Record<string, SelectedHotel> (dayId → hotel)
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('hotels')
    .select('*')
    .eq('trip_id', id)
    .not('day_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const dayHotels: Record<string, {
    id: string; name: string; city: string; type: string;
    price_per_night: number; rating: number; amenities: string[]
  }> = {}
  for (const row of data ?? []) {
    if (!row.day_id) continue
    dayHotels[row.day_id] = {
      id:              row.external_id || row.id,
      name:            row.name,
      city:            row.city,
      type:            row.hotel_type || 'comfort',
      price_per_night: row.cost_per_night,
      rating:          row.rating || 0,
      amenities:       row.amenities ? row.amenities.split(',') : [],
    }
  }
  return NextResponse.json({ dayHotels })
}

// POST /api/trips/[id]/hotels → save hotel for given dayIds
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()
  const { hotel, dayIds } = await req.json()
  if (!hotel || !Array.isArray(dayIds) || dayIds.length === 0) {
    return NextResponse.json({ error: 'hotel and dayIds required' }, { status: 400 })
  }

  // Remove existing assignments for these days in this trip
  await admin.from('hotels').delete().eq('trip_id', id).in('day_id', dayIds)

  // Insert one row per day
  const rows = dayIds.map((dayId: string) => ({
    trip_id:        id,
    day_id:         dayId,
    external_id:    hotel.id,
    name:           hotel.name,
    city:           hotel.city,
    hotel_type:     hotel.type,
    cost_per_night: hotel.price_per_night,
    total_cost:     hotel.price_per_night,
    rating:         hotel.rating,
    amenities:      (hotel.amenities || []).join(','),
    checkin:        new Date().toISOString().split('T')[0],
    checkout:       new Date().toISOString().split('T')[0],
  }))

  const { error } = await admin.from('hotels').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/trips/[id]/hotels?dayId=xxx → remove hotel from a day
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const dayId = new URL(req.url).searchParams.get('dayId')
  if (!dayId) return NextResponse.json({ error: 'dayId required' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('hotels').delete().eq('trip_id', id).eq('day_id', dayId)
  return NextResponse.json({ success: true })
}
