import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { generateDays } from '@/lib/utils/trip'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch source trip
  const { data: trip, error: tripErr } = await admin
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (tripErr || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Create the new trip (copy, owned by current user)
  const { data: newTrip, error: createErr } = await admin
    .from('trips')
    .insert({
      user_id:       user.id,
      title:         `${trip.title} (Copy)`,
      destination:   trip.destination,
      start_city:    trip.start_city,
      start_date:    trip.start_date,
      end_date:      trip.end_date,
      total_days:    trip.total_days,
      total_budget:  trip.total_budget,
      travel_style:  trip.travel_style,
      group_size:    trip.group_size,
      children:      trip.children ?? 0,
    })
    .select()
    .single()

  if (createErr || !newTrip) return NextResponse.json({ error: 'Failed to duplicate trip' }, { status: 500 })

  // Fetch source days + activities
  const { data: sourceDays } = await admin
    .from('itinerary_days')
    .select('*, activities(*)')
    .eq('trip_id', id)
    .order('day_number')

  if (sourceDays?.length) {
    // Create days for new trip
    const newDaysData = sourceDays.map(d => ({
      trip_id:    newTrip.id,
      day_number: d.day_number,
      date:       d.date,
      city:       d.city,
      notes:      d.notes ?? null,
    }))

    const { data: newDays } = await admin.from('itinerary_days').insert(newDaysData).select()

    // Copy activities
    if (newDays?.length) {
      const activitiesToInsert = sourceDays.flatMap((srcDay, idx) => {
        const newDay = newDays[idx]
        if (!newDay || !srcDay.activities?.length) return []
        return srcDay.activities.map((act: Record<string, unknown>) => ({
          day_id:      newDay.id,
          name:        act.name,
          description: act.description ?? null,
          start_time:  act.start_time ?? null,
          end_time:    act.end_time ?? null,
          cost:        act.cost ?? 0,
          type:        act.type ?? 'sightseeing',
          location:    act.location ?? null,
          is_free:     act.is_free ?? false,
          order_index: act.order_index ?? 0,
        }))
      })

      if (activitiesToInsert.length > 0) {
        await admin.from('activities').insert(activitiesToInsert)
      }
    }
  } else {
    // No saved days — generate empty scaffold
    const days = generateDays(newTrip.start_date, newTrip.total_days, newTrip.destination)
    const daysWithTripId = days.map(d => ({ ...d, trip_id: newTrip.id }))
    await admin.from('itinerary_days').insert(daysWithTripId)
  }

  return NextResponse.json({ id: newTrip.id })
}
