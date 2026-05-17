'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowLeft, ArrowRight, Loader2, MapPin, Train, Hotel, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Trip, ItineraryDay, Activity } from '@/types'
import { TripLeg, WizardHotel, WizardPlace, WizardRestaurant, DayPlan, WizardState } from './types'
import Step1_Route from './Step1_Route'
import Step2_Hotels from './Step2_Hotels'
import Step3_Places from './Step3_Places'
import Step4_Food from './Step4_Food'
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'

const STEPS = [
  { num: 1, label: 'Route',   icon: Train,    desc: 'Destinations & transport' },
  { num: 2, label: 'Hotels',  icon: Hotel,    desc: 'Where you\'ll stay' },
  { num: 3, label: 'Places',  icon: MapPin,   desc: 'What to see each day' },
  { num: 4, label: 'Food',    icon: Utensils, desc: 'Where to eat' },
]

interface Props {
  trip: Trip
  existingDays: ItineraryDay[]
  onComplete: (days: ItineraryDay[]) => void
  onClose: () => void
}

/** Compute DayPlan[] from legs and start date */
function computeDayPlans(legs: TripLeg[], startDate: string): DayPlan[] {
  const plans: DayPlan[] = []
  let dayNum = 1
  let offset = 0

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    if (!leg.to) { offset += leg.nights; continue }

    for (let n = 0; n < leg.nights; n++) {
      const d = addDays(new Date(startDate), offset + n)
      plans.push({
        dayNumber:       dayNum,
        date:            format(d, 'yyyy-MM-dd'),
        city:            leg.to,
        isArrivalDay:    n === 0,
        isDepartureDay:  n === leg.nights - 1 && i < legs.length - 1,
        legId:           leg.id,
      })
      dayNum++
    }
    offset += leg.nights
  }

  return plans
}

/** Build ItineraryDay[] from wizard selections */
function buildItineraryDays(
  tripId: string,
  dayPlans: DayPlan[],
  legs: TripLeg[],
  hotelByCity: Record<string, WizardHotel | null>,
  placesByDay: Record<number, WizardPlace[]>,
  restaurantsByDay: Record<number, WizardRestaurant[]>,
): ItineraryDay[] {
  return dayPlans.map((dp, idx) => {
    const activities: Activity[] = []
    let orderIdx = 0

    // Arrival transport activity (first day of each leg)
    if (dp.isArrivalDay) {
      const leg = legs.find(l => l.id === dp.legId)
      if (leg?.transport) {
        activities.push({
          id:          `act-transport-${idx}`,
          day_id:      `day-${idx}`,
          name:        `${leg.transport.mode === 'flight' ? '✈️ Flight' : leg.transport.mode === 'train' ? '🚂 Train' : leg.transport.mode === 'bus' ? '🚌 Bus' : '🚗 Cab'}: ${leg.transport.name}`,
          description: `${leg.from} → ${leg.to} · ${leg.transport.duration} · ${leg.transport.class || ''}`.trim(),
          start_time:  leg.transport.departure || '06:00',
          end_time:    leg.transport.arrival?.replace('+1', '') || '12:00',
          cost:        leg.transport.cost_per_person || 0,
          type:        'departure',
          location:    `${leg.from} → ${leg.to}`,
          is_free:     false,
          order_index: orderIdx++,
        })
      }
    }

    // Hotel check-in note (first day in city)
    const hotel = hotelByCity[dp.city]
    if (dp.isArrivalDay && hotel) {
      activities.push({
        id:          `act-hotel-${idx}`,
        day_id:      `day-${idx}`,
        name:        `🏨 Check-in: ${hotel.name}`,
        description: `${hotel.area} · ${hotel.rating}⭐ · ${hotel.amenities?.slice(0, 3).join(', ')}`,
        start_time:  '14:00',
        end_time:    '15:00',
        cost:        hotel.cost_per_night,
        type:        'rest',
        location:    `${hotel.name}, ${dp.city}`,
        is_free:     false,
        order_index: orderIdx++,
      })
    }

    // Places for this day
    const places = placesByDay[dp.dayNumber] || []
    places.forEach(place => {
      const isMorning = place.best_time?.toLowerCase().includes('morning')
      const isEvening = place.best_time?.toLowerCase().includes('evening') || place.best_time?.toLowerCase().includes('sunset')
      const startH    = isEvening ? 17 : isMorning ? 8 : 10
      const durationM = Math.round((place.duration_hours || 1.5) * 60)
      const endH      = startH + Math.floor(durationM / 60)
      const endM      = durationM % 60

      activities.push({
        id:          `act-place-${idx}-${orderIdx}`,
        day_id:      `day-${idx}`,
        name:        place.name,
        description: place.description,
        start_time:  `${String(startH).padStart(2, '0')}:00`,
        end_time:    `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        cost:        place.entry_fee || 0,
        type:        (place.type as Activity['type']) || 'sightseeing',
        location:    place.location,
        is_free:     place.is_free,
        order_index: orderIdx++,
      })
    })

    // Restaurants for this day
    const restaurants = restaurantsByDay[dp.dayNumber] || []
    restaurants.forEach((r, ri) => {
      const mealTime = ri === 0 ? '13:00' : '20:00'
      const mealEnd  = ri === 0 ? '14:00' : '21:30'
      activities.push({
        id:          `act-rest-${idx}-${ri}`,
        day_id:      `day-${idx}`,
        name:        `🍽️ ${r.name}`,
        description: `${r.cuisine} · Must try: ${r.must_try} · ₹${r.cost_for_two} for 2`,
        start_time:  mealTime,
        end_time:    mealEnd,
        cost:        Math.round(r.cost_for_two / 2),
        type:        'food',
        location:    `${r.name}, ${r.area}, ${dp.city}`,
        is_free:     false,
        order_index: orderIdx++,
      })
    })

    return {
      id:           `day-wizard-${idx}`,
      trip_id:      tripId,
      day_number:   dp.dayNumber,
      date:         dp.date,
      city:         dp.city,
      activities,
      daily_budget: 0,
      notes:        hotel ? `Hotel: ${hotel.name}` : undefined,
    }
  })
}

export default function PlanWizard({ trip, existingDays, onComplete, onClose }: Props) {
  const router = useRouter()
  const [step, setStep]     = useState<1|2|3|4>(1)
  const [saving, setSaving] = useState(false)

  const [state, setState] = useState<WizardState>({
    legs:              [],
    hotelByCity:       {},
    placesByDay:       {},
    restaurantsByDay:  {},
  })

  const dayPlans = useMemo(
    () => computeDayPlans(state.legs, trip.start_date),
    [state.legs, trip.start_date]
  )

  function canProceed() {
    if (step === 1) return state.legs.length > 0 && state.legs.every(l => l.to.trim())
    if (step === 2) return true  // hotels optional
    if (step === 3) return true  // places optional
    return true
  }

  async function finish() {
    setSaving(true)
    try {
      const days = buildItineraryDays(
        trip.id,
        dayPlans,
        state.legs,
        state.hotelByCity,
        state.placesByDay,
        state.restaurantsByDay,
      )

      // Save to Supabase via save-itinerary API
      const res = await fetch(`/api/trips/${trip.id}/save-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) throw new Error()

      toast.success('🎉 Trip plan saved! Taking you to your itinerary…')
      onComplete(days)
    } catch {
      toast.error('Could not save — check your connection and try again')
    } finally {
      setSaving(false)
    }
  }

  const completedSteps = useMemo(() => {
    const done = new Set<number>()
    if (state.legs.length > 0 && state.legs.every(l => l.to)) done.add(1)
    if (Object.values(state.hotelByCity).some(h => h !== null)) done.add(2)
    if (Object.values(state.placesByDay).some(ps => ps.length > 0)) done.add(3)
    if (Object.values(state.restaurantsByDay).some(rs => rs.length > 0)) done.add(4)
    return done
  }, [state])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Plan Your Trip</h1>
            <p className="text-xs text-gray-400">{trip.title}</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="hidden sm:flex items-center gap-1">
          {STEPS.map(s => {
            const Icon = s.icon
            const isDone    = completedSteps.has(s.num)
            const isCurrent = step === s.num
            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num < step || isDone || s.num === step + 1) setStep(s.num as 1|2|3|4)
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isDone
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Mobile step indicator */}
        <div className="sm:hidden flex items-center gap-1">
          {STEPS.map(s => (
            <div
              key={s.num}
              className={`w-2 h-2 rounded-full transition-all ${
                step === s.num ? 'bg-blue-600 w-6' : completedSteps.has(s.num) ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          {step === 1 && (
            <Step1_Route
              startCity={trip.start_city}
              legs={state.legs}
              startDate={trip.start_date}
              travelStyle={trip.travel_style}
              groupSize={trip.group_size}
              onChange={legs => setState(s => ({ ...s, legs }))}
            />
          )}
          {step === 2 && (
            <Step2_Hotels
              legs={state.legs}
              dayPlans={dayPlans}
              travelStyle={trip.travel_style}
              groupSize={trip.group_size}
              budget={trip.total_budget}
              hotelByCity={state.hotelByCity}
              onChange={hotelByCity => setState(s => ({ ...s, hotelByCity }))}
            />
          )}
          {step === 3 && (
            <Step3_Places
              dayPlans={dayPlans}
              travelStyle={trip.travel_style}
              placesByDay={state.placesByDay}
              onChange={placesByDay => setState(s => ({ ...s, placesByDay }))}
            />
          )}
          {step === 4 && (
            <Step4_Food
              dayPlans={dayPlans}
              placesByDay={state.placesByDay}
              restaurantsByDay={state.restaurantsByDay}
              onChange={restaurantsByDay => setState(s => ({ ...s, restaurantsByDay }))}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t bg-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="text-xs text-gray-400">
          Step {step} of 4 — {STEPS[step - 1].desc}
        </div>

        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep((step - 1) as 1|2|3|4)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}

          {step < 4 ? (
            <Button
              onClick={() => {
                if (!canProceed()) {
                  toast.error('Add at least one destination to continue')
                  return
                }
                setStep((step + 1) as 1|2|3|4)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              Next: {STEPS[step].label} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><CheckCircle2 className="h-4 w-4" /> Finish &amp; View Itinerary</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
