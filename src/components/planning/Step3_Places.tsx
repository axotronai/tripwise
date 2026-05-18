'use client'

import { useState } from 'react'
import { Loader2, Star, Clock, MapPin, Plus, X, IndianRupee, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/utils/trip'
import { DayPlan, WizardPlace } from './types'
import { toast } from 'sonner'
import { format } from 'date-fns'

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', culture: '🎭', nature: '🌿', adventure: '🧗',
  beach: '🏖️', shopping: '🛍️', wellness: '🧘', food: '🍽️',
}
const TYPE_COLOR: Record<string, string> = {
  sightseeing: 'bg-blue-100 text-blue-700',
  culture:     'bg-purple-100 text-purple-700',
  nature:      'bg-green-100 text-green-700',
  adventure:   'bg-red-100 text-red-700',
  beach:       'bg-cyan-100 text-cyan-700',
  shopping:    'bg-pink-100 text-pink-700',
  wellness:    'bg-teal-100 text-teal-700',
}

interface Props {
  dayPlans: DayPlan[]
  travelStyle?: string
  placesByDay: Record<number, WizardPlace[]>
  onChange: (placesByDay: Record<number, WizardPlace[]>) => void
}

function PlaceCard({
  place,
  isAdded,
  onAdd,
  onRemove,
  city,
}: {
  place: WizardPlace
  isAdded: boolean
  onAdd: () => void
  onRemove: () => void
  city: string
}) {
  const isMustVisit = place.is_must_visit === true

  return (
    <div
      className={`relative rounded-xl border-2 p-3 space-y-2 transition-all ${
        isMustVisit
          ? isAdded
            ? 'border-green-400 bg-green-50/60 shadow-sm'
            : 'border-green-400 bg-white hover:bg-green-50/30 shadow-sm'
          : isAdded
          ? 'border-blue-300 bg-blue-50/60'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Must Visit badge — top left corner */}
      {isMustVisit && (
        <span className="absolute -top-2.5 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm flex items-center gap-1">
          ⭐ Must Visit
        </span>
      )}

      <div className={`flex items-start justify-between gap-2 ${isMustVisit ? 'mt-1' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg shrink-0">{TYPE_EMOJI[place.type] || '📍'}</span>
          <span className="font-semibold text-sm text-gray-900 leading-tight">{place.name}</span>
        </div>
        <Badge className={`text-xs py-0 shrink-0 ${TYPE_COLOR[place.type] || 'bg-gray-100 text-gray-600'}`}>
          {place.type}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
        <span className="flex items-center gap-0.5">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {place.rating?.toFixed(1)}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" /> {place.duration_hours}h
        </span>
        {place.is_free ? (
          <span className="text-green-600 font-medium">Free entry</span>
        ) : (
          <span className="flex items-center gap-0.5">
            <IndianRupee className="h-3 w-3" />{place.entry_fee}
          </span>
        )}
        <span className="flex items-center gap-0.5 truncate">
          <MapPin className="h-3 w-3 shrink-0" />{place.area}
        </span>
      </div>

      <p className="text-xs text-gray-600 line-clamp-2">{place.description}</p>

      {isMustVisit && place.why_visit && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1">
          💡 {place.why_visit}
        </p>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.location || place.name + ', ' + city)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
          onClick={e => e.stopPropagation()}
        >
          <MapPin className="h-3 w-3" /> View map
        </a>
        <button
          onClick={() => isAdded ? onRemove() : onAdd()}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            isAdded
              ? 'bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-600'
              : isMustVisit
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAdded ? <><X className="h-3 w-3" /> Remove</> : <><Plus className="h-3 w-3" /> Add</>}
        </button>
      </div>
    </div>
  )
}

export default function Step3_Places({ dayPlans, travelStyle, placesByDay, onChange }: Props) {
  const [placeOptions, setPlaceOptions] = useState<Record<number, WizardPlace[]>>({})
  const [loading, setLoading]           = useState<Record<number, boolean>>({})
  const [expanded, setExpanded]         = useState<number | null>(dayPlans[0]?.dayNumber ?? null)

  // Group days by city — load once per city, share across days
  const cityCache: Record<string, WizardPlace[]> = {}

  async function loadPlacesForDay(day: DayPlan) {
    if (placeOptions[day.dayNumber]) return
    if (cityCache[day.city]) {
      setPlaceOptions(prev => ({ ...prev, [day.dayNumber]: cityCache[day.city] }))
      return
    }

    setLoading(prev => ({ ...prev, [day.dayNumber]: true }))
    try {
      const res = await fetch('/api/ai/find-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: day.city, destination: day.city,
          travel_style: travelStyle, start_date: day.date,
          category: 'all', exclude: [],
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Sort: must-visit first, then rest sorted by rating
      const places: WizardPlace[] = (data.places || []).sort((a: WizardPlace, b: WizardPlace) => {
        if (a.is_must_visit && !b.is_must_visit) return -1
        if (!a.is_must_visit && b.is_must_visit) return 1
        return (b.rating ?? 0) - (a.rating ?? 0)
      })
      cityCache[day.city] = places
      setPlaceOptions(prev => ({ ...prev, [day.dayNumber]: places }))
    } catch {
      toast.error(`Could not load places for ${day.city}`)
    } finally {
      setLoading(prev => ({ ...prev, [day.dayNumber]: false }))
    }
  }

  async function loadMoreForDay(day: DayPlan) {
    const existing = placeOptions[day.dayNumber] || []
    setLoading(prev => ({ ...prev, [day.dayNumber]: true }))
    try {
      const res = await fetch('/api/ai/find-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: day.city, destination: day.city,
          travel_style: travelStyle, start_date: day.date,
          category: 'all', exclude: existing.map(p => p.name),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newPlaces: WizardPlace[] = (data.places || []).filter(
        (p: WizardPlace) => !existing.some(e => e.name === p.name)
      ).sort((a: WizardPlace, b: WizardPlace) => {
        if (a.is_must_visit && !b.is_must_visit) return -1
        if (!a.is_must_visit && b.is_must_visit) return 1
        return (b.rating ?? 0) - (a.rating ?? 0)
      })
      setPlaceOptions(prev => ({ ...prev, [day.dayNumber]: [...existing, ...newPlaces] }))
    } catch {
      toast.error('Could not load more places')
    } finally {
      setLoading(prev => ({ ...prev, [day.dayNumber]: false }))
    }
  }

  function addPlace(dayNumber: number, place: WizardPlace) {
    const current = placesByDay[dayNumber] || []
    if (current.some(p => p.name === place.name)) { toast('Already added'); return }
    onChange({ ...placesByDay, [dayNumber]: [...current, place] })
    toast.success(`${place.name} added to Day ${dayNumber}`)
  }

  function removePlace(dayNumber: number, placeName: string) {
    onChange({ ...placesByDay, [dayNumber]: (placesByDay[dayNumber] || []).filter(p => p.name !== placeName) })
  }

  const totalPlaces = Object.values(placesByDay).reduce((s, ps) => s + ps.length, 0)
  const mustVisitAdded = Object.values(placesByDay)
    .flat()
    .filter(p => p.is_must_visit).length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Plan Places to Visit</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          ⭐ <span className="text-green-700 font-medium">Green cards = Must Visit</span> — don't leave without seeing these!
        </p>
      </div>

      {totalPlaces > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-green-700 font-medium">
            ✅ {totalPlaces} place{totalPlaces !== 1 ? 's' : ''} added
            {mustVisitAdded > 0 && (
              <span className="ml-1.5 text-green-600">({mustVisitAdded} must-visit ⭐)</span>
            )}
          </span>
        </div>
      )}

      {dayPlans.map(day => {
        const isOpen    = expanded === day.dayNumber
        const options   = placeOptions[day.dayNumber] || []
        const selected  = placesByDay[day.dayNumber] || []
        const isLoading = loading[day.dayNumber]
        const mustVisitCount = options.filter(p => p.is_must_visit).length

        return (
          <div key={day.dayNumber} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Day header */}
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => {
                if (!isOpen) loadPlacesForDay(day)
                setExpanded(isOpen ? null : day.dayNumber)
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Day {day.dayNumber}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{day.city}</span>
                  <span className="text-sm text-gray-400 ml-2">{format(new Date(day.date), 'EEE, d MMM')}</span>
                  {day.isArrivalDay   && <span className="ml-2 text-xs text-blue-500 font-medium">✈ Arrival</span>}
                  {day.isDepartureDay && <span className="ml-2 text-xs text-orange-500 font-medium">→ Departure</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mustVisitCount > 0 && !isOpen && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    ⭐ {mustVisitCount} must-see
                  </span>
                )}
                {selected.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {selected.length} added
                  </span>
                )}
                <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Selected places chips */}
            {selected.length > 0 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-gray-50">
                {selected.map(p => (
                  <div
                    key={p.name}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${
                      p.is_must_visit
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                  >
                    {p.is_must_visit ? '⭐' : TYPE_EMOJI[p.type] || '📍'} {p.name}
                    <button onClick={() => removePlace(day.dayNumber, p.name)} className="ml-1 opacity-60 hover:opacity-100 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expanded: place options */}
            {isOpen && (
              <div className="border-t px-5 py-4 space-y-3">
                {isLoading && options.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" /> Finding top places in {day.city}…
                  </div>
                ) : options.length === 0 ? (
                  <Button
                    onClick={() => loadPlacesForDay(day)}
                    variant="outline"
                    className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    ⭐ Find Top Places in {day.city}
                  </Button>
                ) : (
                  <>
                    {/* Must-visit section */}
                    {options.some(p => p.is_must_visit) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">⭐ Must Visit</span>
                          <div className="flex-1 h-px bg-green-200" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {options.filter(p => p.is_must_visit).map((place, i) => (
                            <PlaceCard
                              key={`mv-${i}`}
                              place={place}
                              isAdded={selected.some(p => p.name === place.name)}
                              onAdd={() => addPlace(day.dayNumber, place)}
                              onRemove={() => removePlace(day.dayNumber, place.name)}
                              city={day.city}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other places section */}
                    {options.some(p => !p.is_must_visit) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Also Worth Visiting</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {options.filter(p => !p.is_must_visit).map((place, i) => (
                            <PlaceCard
                              key={`av-${i}`}
                              place={place}
                              isAdded={selected.some(p => p.name === place.name)}
                              onAdd={() => addPlace(day.dayNumber, place)}
                              onRemove={() => removePlace(day.dayNumber, place.name)}
                              city={day.city}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => loadMoreForDay(day)}
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading more…</>
                        : <><RefreshCw className="h-3.5 w-3.5" /> Load More Places</>
                      }
                    </button>
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
