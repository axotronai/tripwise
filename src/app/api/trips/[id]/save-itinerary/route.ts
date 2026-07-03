import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requireTripOwner } from '@/lib/supabase/auth-guard'
import { SaveItinerarySchema, parseBody, checkOrigin } from '@/lib/api/trip-schema'

// POST /api/trips/[id]/save-itinerary
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // ── CSRF origin check ──────────────────────────────────────────────────────
  const originCheck = checkOrigin(req)
  if (originCheck !== true) return originCheck

  const { id: trip_id } = await params

  const guard = await requireTripOwner(trip_id)
  if (guard.error) return guard.error

  const supabase = createAdminClient()

  // ── Validate body (500 KB cap + Zod schema) ────────────────────────────────
  const { data: body, error: validationError } = await parseBody(req, SaveItinerarySchema, 'save-itinerary')
  if (validationError) return validationError

  const { days } = body

  // Delete existing days + activities (cascade) — only after validating input
  await supabase.from('itinerary_days').delete().eq('trip_id', trip_id)

  // Insert new days — build notes from AI plan fields if not provided directly
  const dayRows = days.map(d => ({
    trip_id,
    day_number:   d.day_number,
    date:         d.date,
    city:         d.city,
    daily_budget: d.daily_budget ?? 0,
    notes: d.notes ?? (
      [
        d.theme             ? `Theme: ${d.theme}`                                                      : '',
        d.hotel_suggestion  ? `Hotel: ${d.hotel_suggestion} (₹${d.hotel_cost_per_night ?? 0}/night)` : '',
        d.food_plan         ? `Food: ${d.food_plan}`                                                   : '',
        d.local_tip         ? `Tip: ${d.local_tip}`                                                    : '',
      ].filter(Boolean).join('\n') || null
    ),
  }))

  const { data: insertedDays, error: daysError } = await supabase
    .from('itinerary_days')
    .insert(dayRows)
    .select()

  if (daysError) {
    console.error('[save-itinerary] days insert failed:', daysError.code, daysError.message)
    return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 })
  }

  // Insert activities for each day — match by day_number to avoid index-order issues
  const activityRows: object[] = []
  const dbDayByNumber = new Map<number, { id: string; day_number: number }>(
    (insertedDays ?? []).map(d => [d.day_number, d])
  )

  for (const day of days) {
    const dbDay = dbDayByNumber.get(day.day_number)
    if (!dbDay || !Array.isArray(day.activities)) continue
    for (const act of day.activities) {
      activityRows.push({
        day_id:      dbDay.id,
        name:        act.name,
        description: act.description ?? '',
        start_time:  act.start_time ?? '09:00',
        end_time:    act.end_time   ?? '10:00',
        cost:        act.cost,
        type:        act.type,
        location:    act.location ?? '',
        is_free:     act.is_free,
        order_index: act.order_index,
      })
    }
  }

  if (activityRows.length > 0) {
    const { error: actErr } = await supabase.from('activities').insert(activityRows)
    if (actErr) console.error('[save-itinerary] activities insert failed:', actErr.message)
  }

  return NextResponse.json({ ok: true, days_saved: insertedDays?.length ?? 0 })
}
