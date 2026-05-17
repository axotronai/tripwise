'use client'

import { useState } from 'react'
import { Loader2, MapPin, Star, ExternalLink, Plus, Compass, Clock, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryDay, Activity } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'all',         label: '🗺️ All' },
  { value: 'sightseeing', label: '🏛️ Sightseeing' },
  { value: 'nature',      label: '🌿 Nature' },
  { value: 'culture',     label: '🎭 Culture' },
  { value: 'adventure',   label: '🧗 Adventure' },
  { value: 'beach',       label: '🏖️ Beach' },
  { value: 'shopping',    label: '🛍️ Shopping' },
  { value: 'wellness',    label: '🧘 Wellness' },
]

const TYPE_COLORS: Record<string, string> = {
  sightseeing: 'bg-blue-100 text-blue-700',
  culture:     'bg-purple-100 text-purple-700',
  nature:      'bg-green-100 text-green-700',
  adventure:   'bg-red-100 text-red-700',
  beach:       'bg-cyan-100 text-cyan-700',
  shopping:    'bg-pink-100 text-pink-700',
  wellness:    'bg-teal-100 text-teal-700',
  food:        'bg-orange-100 text-orange-700',
}

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', culture: '🎭', nature: '🌿', adventure: '🧗',
  beach: '🏖️', shopping: '🛍️', wellness: '🧘', food: '🍽️',
}

interface Place {
  name: string
  type: string
  area: string
  description: string
  why_visit: string
  entry_fee: number
  is_free: boolean
  duration_hours: number
  best_time: string
  rating: number
  location: string
}

interface Props {
  destination: string
  days: ItineraryDay[]
  travelStyle?: string
  startDate?: string
  onAddToDay: (dayId: string, activity: Omit<Activity, 'id'>) => void
}

export default function PlacesExplorer({ destination, days, travelStyle, startDate, onAddToDay }: Props) {
  // Unique cities from days + destination itself
  const cities = [...new Set([destination, ...days.map(d => d.city).filter(Boolean)])]

  const [city,        setCity]        = useState(cities[0] || destination)
  const [category,    setCategory]    = useState('all')
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [places,      setPlaces]      = useState<Place[]>([])
  const [searched,    setSearched]    = useState(false)
  const [addingTo,    setAddingTo]    = useState<string | null>(null)

  async function fetchPlaces(append = false) {
    const isMore = append && places.length > 0
    if (isMore) setLoadingMore(true)
    else { setLoading(true); setSearched(true); setPlaces([]) }

    const exclude = append ? places.map(p => p.name) : []
    try {
      const res = await fetch('/api/ai/find-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, destination, travel_style: travelStyle, start_date: startDate, category, exclude }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newPlaces: Place[] = (data.places || []).filter(
        (p: Place) => !places.some(existing => existing.name === p.name)
      )
      setPlaces(prev => isMore ? [...prev, ...newPlaces] : newPlaces)
    } catch {
      toast.error('Could not find places — try again')
      if (!isMore) setPlaces([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function search() { fetchPlaces(false) }
  function loadMore() { fetchPlaces(true) }

  function mapsUrl(p: Place) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location || `${p.name}, ${city}`)}`
  }

  function addToDay(p: Place, dayId: string) {
    const day = days.find(d => d.id === dayId)
    if (!day) return

    // Pick a sensible time slot based on best_time
    const isEvening = p.best_time?.toLowerCase().includes('evening') || p.best_time?.toLowerCase().includes('sunset')
    const isMorning  = p.best_time?.toLowerCase().includes('morning')
    const start = isEvening ? '17:00' : isMorning ? '08:00' : '10:00'
    const durationMins = Math.round((p.duration_hours || 1.5) * 60)
    const endH = parseInt(start.split(':')[0]) + Math.floor(durationMins / 60)
    const endM = parseInt(start.split(':')[1]) + (durationMins % 60)
    const end  = `${String(endH + Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`

    onAddToDay(dayId, {
      day_id:      dayId,
      name:        p.name,
      description: p.description,
      start_time:  start,
      end_time:    end,
      cost:        p.entry_fee,
      type:        (p.type as Activity['type']) || 'sightseeing',
      location:    p.location,
      is_free:     p.is_free,
      order_index: day.activities.length,
    })
    toast.success(`${p.name} added to Day ${day.day_number}`)
    setAddingTo(null)
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-500" />
          Explore Places
        </h3>

        {/* City selector */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</p>
          <div className="flex flex-wrap gap-2">
            {cities.map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); setPlaces([]); setSearched(false) }}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  city === c
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPlaces([]); setSearched(false) }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={search} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
          {loading ? 'Finding places…' : 'Find Places'}
        </Button>
        <p className="text-xs text-gray-400 text-center pt-1">
          AI suggestions — verify details on Google Maps before visiting.
        </p>
      </div>

      {/* Results */}
      {searched && !loading && (
        places.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Compass className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No places found — try a different city or category</p>
          </div>
        ) : (
          <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {places.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 space-y-2">
                  {/* Name + type */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl shrink-0 mt-0.5">{TYPE_EMOJI[p.type] || '📍'}</span>
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</h4>
                    </div>
                    <Badge className={`text-xs py-0 shrink-0 ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'}`}>
                      {p.type}
                    </Badge>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {p.rating?.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.duration_hours}h
                    </span>
                    {p.is_free ? (
                      <span className="text-green-600 font-medium">Free entry</span>
                    ) : (
                      <span className="flex items-center gap-0.5 font-medium text-gray-700">
                        <IndianRupee className="h-3 w-3" />{p.entry_fee}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.area}, {city}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-2">{p.description}</p>

                  {/* Why visit */}
                  <div className="flex items-start gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-blue-400 text-sm shrink-0">✨</span>
                    <span className="text-xs text-blue-700">{p.why_visit}</span>
                  </div>

                  {/* Best time */}
                  {p.best_time && (
                    <p className="text-xs text-gray-400">🕐 Best time: {p.best_time}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t px-4 py-2.5 flex items-center gap-2 bg-gray-50 rounded-b-2xl">
                  <a
                    href={mapsUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    <MapPin className="h-3 w-3" /> View on Maps <ExternalLink className="h-2.5 w-2.5" />
                  </a>

                  <div className="ml-auto relative">
                    {addingTo === p.name && (
                      <div className="flex flex-col bg-white border rounded-xl shadow-lg p-2 absolute bottom-8 right-0 z-10 w-48">
                        <p className="text-xs font-semibold text-gray-700 px-1 pb-1">Add to which day?</p>
                        {days.map(d => (
                          <button
                            key={d.id}
                            onClick={() => addToDay(p, d.id)}
                            className="text-left text-xs px-2 py-1.5 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium transition-colors"
                          >
                            Day {d.day_number} — {d.city}
                          </button>
                        ))}
                        <button onClick={() => setAddingTo(null)} className="text-xs text-gray-400 mt-1 px-2 text-center hover:text-gray-600">Cancel</button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                      onClick={() => setAddingTo(addingTo === p.name ? null : p.name)}
                    >
                      <Plus className="h-3 w-3" /> Add to Trip
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More */}
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loadingMore ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Loading more places…</>
            ) : (
              <><Plus className="h-4 w-4" /> View More Places</>
            )}
          </button>
          </div>
        )
      )}
    </div>
  )
}
