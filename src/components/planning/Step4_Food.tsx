'use client'

import { useState } from 'react'
import { Loader2, Star, Utensils, Plus, X, IndianRupee, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/utils/trip'
import { DayPlan, WizardPlace, WizardRestaurant } from './types'
import { toast } from 'sonner'
import { format } from 'date-fns'

const DIET_OPTIONS = [
  { value: 'any',    label: '🍽️ All' },
  { value: 'veg',    label: '🥗 Veg only' },
  { value: 'nonveg', label: '🍗 Non-veg' },
  { value: 'jain',   label: '🌱 Jain' },
]

interface Props {
  dayPlans: DayPlan[]
  placesByDay: Record<number, WizardPlace[]>
  restaurantsByDay: Record<number, WizardRestaurant[]>
  onChange: (restaurantsByDay: Record<number, WizardRestaurant[]>) => void
}

export default function Step4_Food({ dayPlans, placesByDay, restaurantsByDay, onChange }: Props) {
  const [options,   setOptions]   = useState<Record<number, WizardRestaurant[]>>({})
  const [loading,   setLoading]   = useState<Record<number, boolean>>({})
  const [expanded,  setExpanded]  = useState<number | null>(dayPlans[0]?.dayNumber ?? null)
  const [diet,      setDiet]      = useState('any')

  async function fetchRestaurants(day: DayPlan) {
    // Build location context from places on this day
    const places = placesByDay[day.dayNumber] || []
    const areaHint = places.length > 0
      ? places.slice(0, 2).map(p => p.area).join(', ')
      : day.city

    setLoading(prev => ({ ...prev, [day.dayNumber]: true }))
    try {
      const res = await fetch('/api/ai/find-restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: `${day.city} (near ${areaHint})`,
          diet,
          cuisine: 'any',
          budget_range: 'mid',
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOptions(prev => ({ ...prev, [day.dayNumber]: data.restaurants || [] }))
    } catch {
      toast.error(`Could not load restaurants for Day ${day.dayNumber}`)
    } finally {
      setLoading(prev => ({ ...prev, [day.dayNumber]: false }))
    }
  }

  function addRestaurant(dayNumber: number, r: WizardRestaurant) {
    const current = restaurantsByDay[dayNumber] || []
    if (current.some(x => x.name === r.name)) { toast('Already added'); return }
    onChange({ ...restaurantsByDay, [dayNumber]: [...current, r] })
    toast.success(`${r.name} added to Day ${dayNumber}`)
  }

  function removeRestaurant(dayNumber: number, name: string) {
    onChange({ ...restaurantsByDay, [dayNumber]: (restaurantsByDay[dayNumber] || []).filter(r => r.name !== name) })
  }

  const totalAdded = Object.values(restaurantsByDay).reduce((s, rs) => s + rs.length, 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Plan Where to Eat</h2>
        <p className="text-sm text-gray-500 mt-0.5">AI suggests restaurants near your day's places. Choose your favourites.</p>
      </div>

      {/* Diet filter */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-500 self-center">Diet:</span>
        {DIET_OPTIONS.map(d => (
          <button
            key={d.value}
            onClick={() => setDiet(d.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              diet === d.value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {totalAdded > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
          <span className="text-sm text-orange-700 font-medium">🍽️ {totalAdded} restaurant{totalAdded !== 1 ? 's' : ''} planned</span>
        </div>
      )}

      {dayPlans.map(day => {
        const isOpen    = expanded === day.dayNumber
        const opts      = options[day.dayNumber] || []
        const selected  = restaurantsByDay[day.dayNumber] || []
        const dayPlaces = placesByDay[day.dayNumber] || []
        const isLoading = loading[day.dayNumber]

        return (
          <div key={day.dayNumber} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Header */}
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : day.dayNumber)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Day {day.dayNumber}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{day.city}</span>
                  <span className="text-sm text-gray-400 ml-2">{format(new Date(day.date), 'EEE, d MMM')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dayPlaces.length > 0 && (
                  <span className="text-xs text-gray-400">{dayPlaces.length} place{dayPlaces.length !== 1 ? 's' : ''} planned</span>
                )}
                {selected.length > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {selected.length} 🍽️
                  </span>
                )}
                <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Near context */}
            {isOpen && dayPlaces.length > 0 && (
              <div className="px-5 pb-2 flex items-center gap-2 text-xs text-gray-500">
                <span>Near:</span>
                {dayPlaces.slice(0, 3).map(p => (
                  <span key={p.name} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{p.name}</span>
                ))}
              </div>
            )}

            {/* Selected restaurants */}
            {selected.length > 0 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {selected.map(r => (
                  <div key={r.name} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-full font-medium">
                    🍽️ {r.name}
                    <button onClick={() => removeRestaurant(day.dayNumber, r.name)} className="ml-1 text-orange-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t px-5 py-4 space-y-3">
                {opts.length === 0 && !isLoading ? (
                  <Button
                    onClick={() => fetchRestaurants(day)}
                    variant="outline"
                    className="w-full gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Utensils className="h-4 w-4" /> Find Restaurants for Day {day.dayNumber}
                  </Button>
                ) : isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" /> Finding restaurants near {day.city}…
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{opts.length} restaurants found</p>
                      <button
                        onClick={() => fetchRestaurants(day)}
                        className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {opts.map((r, i) => {
                        const isAdded = selected.some(x => x.name === r.name)
                        return (
                          <div key={i} className={`rounded-xl border p-3 space-y-2 transition-all ${isAdded ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900">{r.name}</h4>
                                <p className="text-xs text-gray-500">{r.area}</p>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-semibold">{r.rating}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Badge className="text-xs py-0 bg-orange-100 text-orange-700">{r.cuisine}</Badge>
                              {r.is_veg && <Badge className="text-xs py-0 bg-green-100 text-green-700">🌱 Pure Veg</Badge>}
                              {r.is_jain_friendly && <Badge className="text-xs py-0 bg-emerald-100 text-emerald-700">Jain</Badge>}
                            </div>

                            {r.must_try && (
                              <p className="text-xs text-gray-600">⭐ Must try: <span className="font-medium">{r.must_try}</span></p>
                            )}

                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                <IndianRupee className="h-3 w-3" />{formatINR(r.cost_for_two)} for 2
                              </span>
                              <button
                                onClick={() => isAdded ? removeRestaurant(day.dayNumber, r.name) : addRestaurant(day.dayNumber, r)}
                                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                  isAdded ? 'bg-orange-100 text-orange-700 hover:bg-red-100 hover:text-red-600' : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                              >
                                {isAdded ? <><X className="h-3 w-3" /> Remove</> : <><Plus className="h-3 w-3" /> Add</>}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
