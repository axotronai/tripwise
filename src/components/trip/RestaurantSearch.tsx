'use client'

import { useState } from 'react'
import { Loader2, MapPin, Star, ExternalLink, Plus, UtensilsCrossed, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryDay } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { toast } from 'sonner'

const CUISINES = [
  { value: 'any',          label: 'Any Cuisine' },
  { value: 'North Indian', label: 'North Indian' },
  { value: 'South Indian', label: 'South Indian' },
  { value: 'Goan',         label: 'Goan' },
  { value: 'Chinese',      label: 'Chinese' },
  { value: 'Street Food',  label: 'Street Food' },
  { value: 'Seafood',      label: 'Seafood' },
  { value: 'Mughlai',      label: 'Mughlai' },
  { value: 'Continental',  label: 'Continental' },
  { value: 'Italian',      label: 'Italian' },
  { value: 'Bengali',      label: 'Bengali' },
  { value: 'Rajasthani',   label: 'Rajasthani' },
]

interface Restaurant {
  name: string
  area: string
  cuisine: string
  is_veg: boolean
  is_jain_friendly: boolean
  cost_for_two: number
  must_try: string
  description: string
  open_hours: string
  rating: number
}

interface Props {
  destination: string
  days: ItineraryDay[]
  onAddToDay: (dayId: string, activity: Omit<import('@/types').Activity, 'id'>) => void
}

export default function RestaurantSearch({ destination, days, onAddToDay }: Props) {
  const [diet,        setDiet]        = useState<'both' | 'veg' | 'nonveg' | 'jain'>('both')
  const [cuisine,     setCuisine]     = useState('any')
  const [budgetRange, setBudgetRange] = useState<'budget' | 'mid' | 'fine'>('mid')
  const [loading,     setLoading]     = useState(false)
  const [results,     setResults]     = useState<Restaurant[]>([])
  const [searched,    setSearched]    = useState(false)
  const [addingTo,    setAddingTo]    = useState<string | null>(null)  // restaurant name being added

  async function search() {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch('/api/ai/find-restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, diet, cuisine, budget_range: budgetRange }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data.restaurants || [])
    } catch {
      toast.error('Could not find restaurants — try again')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function mapsUrl(r: Restaurant) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name}, ${r.area}, ${destination}`)}`
  }

  const MEAL_SLOTS = [
    { label: 'Breakfast', start: '08:00', end: '09:30' },
    { label: 'Lunch',     start: '13:00', end: '14:30' },
    { label: 'Dinner',    start: '19:30', end: '21:00' },
  ]

  function addToDay(r: Restaurant, dayId: string, meal: typeof MEAL_SLOTS[0]) {
    const day = days.find(d => d.id === dayId)
    if (!day) return
    onAddToDay(dayId, {
      day_id: dayId,
      name: `${meal.label} at ${r.name}`,
      description: `${r.description} Must-try: ${r.must_try}`,
      start_time: meal.start,
      end_time: meal.end,
      cost: Math.round(r.cost_for_two / 2),
      type: 'food',
      location: `${r.name}, ${r.area}, ${destination}`,
      is_free: false,
      order_index: day.activities.length,
    })
    toast.success(`${r.name} added to Day ${day.day_number} (${meal.label})`)
    setAddingTo(null)
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
          Find Restaurants in {destination}
        </h3>

        {/* Diet preference */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diet Preference</p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'both',   label: '🍽️ All',        desc: 'Veg & Non-veg' },
              { value: 'veg',    label: '🥦 Pure Veg',   desc: '100% vegetarian' },
              { value: 'jain',   label: '🙏 Jain',       desc: 'Jain friendly' },
              { value: 'nonveg', label: '🍗 Non-Veg',    desc: 'Meat & seafood' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setDiet(opt.value)}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  diet === opt.value
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
                <span className="block text-xs font-normal text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cuisine Type</p>
          <div className="flex flex-wrap gap-1.5">
            {CUISINES.map(c => (
              <button
                key={c.value}
                onClick={() => setCuisine(c.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  cuisine === c.value
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget (for two)</p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'budget', label: '💰 Budget',      desc: 'Under ₹300' },
              { value: 'mid',    label: '🪙 Mid-range',   desc: '₹300 – ₹800' },
              { value: 'fine',   label: '✨ Fine Dining', desc: '₹800+' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setBudgetRange(opt.value)}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  budgetRange === opt.value
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
                <span className="block text-xs font-normal text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={search} disabled={loading} className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white h-10">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UtensilsCrossed className="h-4 w-4" />}
          {loading ? 'Finding restaurants…' : 'Find Restaurants'}
        </Button>
        <p className="text-xs text-gray-400 text-center pt-1">
          AI suggestions — verify hours and availability on Google Maps before visiting.
        </p>
      </div>

      {/* Results */}
      {searched && !loading && (
        results.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No restaurants found — try different filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 space-y-2">
                  {/* Name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{r.name}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.is_veg && (
                        <span title="Pure Vegetarian" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                          <Leaf className="h-3 w-3" /> Veg
                        </span>
                      )}
                      {r.is_jain_friendly && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">Jain</span>
                      )}
                      {!r.is_veg && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">Non-Veg</span>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {r.rating.toFixed(1)}
                    </span>
                    <Badge variant="outline" className="text-xs py-0">{r.cuisine}</Badge>
                    <span className="font-medium text-gray-700">{formatINR(r.cost_for_two)} for two</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.area}, {destination}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-2">{r.description}</p>

                  {/* Must try */}
                  <div className="flex items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-orange-400 text-sm">⭐</span>
                    <span className="text-xs text-orange-700 font-medium">Must-try:</span>
                    <span className="text-xs text-orange-600">{r.must_try}</span>
                  </div>

                  {/* Hours */}
                  {r.open_hours && (
                    <p className="text-xs text-gray-400">🕐 {r.open_hours}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t px-4 py-2.5 flex items-center gap-2 bg-gray-50">
                  <a
                    href={mapsUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    <MapPin className="h-3 w-3" /> View on Maps <ExternalLink className="h-2.5 w-2.5" />
                  </a>

                  <div className="ml-auto relative">
                    {addingTo === r.name ? (
                      <div className="flex flex-col bg-white border rounded-xl shadow-lg p-2 absolute bottom-8 right-0 z-10 w-52">
                        <p className="text-xs font-semibold text-gray-700 px-1 pb-1">Add to day & meal:</p>
                        {days.map(d => (
                          <div key={d.id}>
                            <p className="text-xs text-gray-400 px-2 pt-1">Day {d.day_number} — {d.city}</p>
                            <div className="flex gap-1 px-1 pb-1">
                              {MEAL_SLOTS.map(meal => (
                                <button
                                  key={meal.label}
                                  onClick={() => addToDay(r, d.id, meal)}
                                  className="flex-1 text-center text-xs px-1 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium transition-colors"
                                >
                                  {meal.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setAddingTo(null)} className="text-xs text-gray-400 mt-1 px-2 hover:text-gray-600 text-center">Cancel</button>
                      </div>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                      onClick={() => setAddingTo(addingTo === r.name ? null : r.name)}
                    >
                      <Plus className="h-3 w-3" /> Add to Trip
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
