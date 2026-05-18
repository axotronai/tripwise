import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requireTripOwner } from '@/lib/supabase/auth-guard'

type Params = { params: Promise<{ id: string }> }

// GET /api/trips/[id]/transports → array of saved transports
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('transports')
    .select('*')
    .eq('trip_id', id)
    .order('departure')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transports: data ?? [] })
}

// POST /api/trips/[id]/transports → save a transport leg
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const admin = createAdminClient()
  const body = await req.json()
  const { mode, operator, from_city, to_city, departure, arrival, duration, cost } = body

  if (!mode || !from_city || !to_city || !departure || !arrival || !duration) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('transports')
    .insert({ trip_id: id, mode, operator, from_city, to_city, departure, arrival, duration, cost: cost || 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transport: data })
}

// DELETE /api/trips/[id]/transports?transportId=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params

  const guard = await requireTripOwner(id)
  if (guard.error) return guard.error

  const transportId = new URL(req.url).searchParams.get('transportId')
  if (!transportId) return NextResponse.json({ error: 'transportId required' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('transports').delete().eq('id', transportId).eq('trip_id', id)
  return NextResponse.json({ success: true })
}
