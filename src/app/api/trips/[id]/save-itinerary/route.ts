import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requireTripOwner } from '@/lib/supabase/auth-guard'

// POST /api/trips/[id]/save-itinerary
// Body: { days: [{ day_number, date, city, theme, daily_budget, hotel_suggestion, hotel_cost_per_night, food_plan, local_tip, activities: [...] }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: trip_id } = await params

  const guard = await requireTripOwner(trip_id)
  if (guard.error) return guard.error

  const supabase = createAdminClient()

  const { days, ai_meta } = await req.json()
  if (!Array.isArray(days) || days.length === 0)
    return NextResponse.json({ error: 'days array required' }, { status: 400 })

  // Delete existing days + activities (cascade) — only after validating input
  await supabase.from('itinerary_days').delete().eq('trip_id', trip_id)

  // Insert new days
  const dayRows = days.map((d: {
    day_number: number; date: string; city: string; daily_budget?: number;
    theme?: string; hotel_suggestion?: string; hotel_cost_per_night?: number;
    food_plan?: string; local_tip?: string;
  }) => ({
    trip_id,
    day_number: d.day_number,
    date: d.date,
    city: d.city,
    daily_budget: d.daily_budget ?? 0,
    notes: [
      d.theme             ? `Theme: ${d.theme}`                                                   : '',
      d.hotel_suggestion  ? `Hotel: ${d.hotel_suggestion} (₹${d.hotel_cost_per_night}/night)`    : '',
      d.food_plan         ? `Food: ${d.food_plan}`                                                : '',
      d.local_tip         ? `Tip: ${d.local_tip}`                                                 : '',
    ].filter(Boolean).join('\n'),
  }))

  const { data: insertedDays, error: daysError } = await supabase
    .from('itinerary_days')
    .insert(dayRows)
    .select()

  if (daysError) return NextResponse.json({ error: daysError.message }, { status: 500 })

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
        start_time:  act.start_time ?? act.time ?? '09:00',
        end_time:    act.end_time ?? '10:00',
        cost:        act.cost ?? 0,
        type:        act.type ?? 'sightseeing',
        location:    act.location ?? '',
        is_free:     act.is_free ?? false,
        order_index: act.order_index ?? 0,
      })
    }
  }

  if (activityRows.length > 0) {
    const { error: actErr } = await supabase.from('activities').insert(activityRows)
    if (actErr) console.error('[save-itinerary] activities insert failed:', actErr.message)
  }

  // ai_meta.budget_breakdown reserved for future use
  void ai_meta

  return NextResponse.json({ ok: true, days_saved: insertedDays?.length ?? 0 })
}
