'use client'

import { useState } from 'react'
import { Loader2, Star, MapPin, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/trip'
import { WizardHotel, TripLeg, DayPlan } from './types'
import { toast } from 'sonner'

interface Props {
  legs: TripLeg[]
  dayPlans: DayPlan[]
  travelStyle: string
  groupSize: number
  budget: number
  hotelByCity: Record<string, WizardHotel | null>
  onChange: (hotelByCity: Record<string, WizardHotel | null>) => void
}

interface CityBlock {
  city: string
  nights: number
  checkin: string
  checkout: string
}

function getCityBlocks(legs: TripLeg[], startDate: string): CityBlock[] {
  const blocks: CityBlock[] = []
  let offset = 0
  for (const leg of legs) {
    if (!leg.to) { offset += leg.nights; continue }
    const ci = new Date(startDate)
    ci.setDate(ci.getDate() + offset)
    const co = new Date(startDate)
    co.setDate(co.getDate() + offset + leg.nights)
    blocks.push({
      city:     leg.to,
      nights:   leg.nights,
      checkin:  ci.toISOString().split('T')[0],
      checkout: co.toISOString().split('T')[0],
    })
    offset += leg.nights
  }
  return blocks
}

function HotelCard({ hotel, selected, onSelect }: { hotel: WizardHotel; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all space-y-2 ${
        selected
          ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-400'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {selected && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
            <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{hotel.name}</h4>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" /> {hotel.area}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-gray-900 text-sm">{formatINR(hotel.cost_per_night)}<span className="text-xs font-normal text-gray-400">/night</span></div>
          <div className="flex items-center gap-0.5 justify-end mt-0.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-gray-600">{hotel.rating}</span>
          </div>
        </div>
      </div>

      {hotel.highlights && (
        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2.5 py-1.5">✨ {hotel.highlights}</p>
      )}

      {hotel.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 4).map((a, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
      )}

      {hotel.map_url && (
        <a
          href={hotel.map_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
        >
          View on Maps <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </button>
  )
}

export default function Step2_Hotels({ legs, dayPlans, travelStyle, groupSize, budget, hotelByCity, onChange }: Props) {
  const [hotelOptions, setHotelOptions] = useState<Record<string, WizardHotel[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Derive start date from dayPlans
  const startDate = dayPlans[0]?.date || new Date().toISOString().split('T')[0]
  const cityBlocks = getCityBlocks(legs, startDate)

  const budgetPerNight = Math.round((budget * 0.3) / Math.max(legs.reduce((s, l) => s + l.nights, 0), 1))

  async function fetchHotels(city: string, nights: number, checkin: string) {
    setLoading(prev => ({ ...prev, [city]: true }))
    const checkout = (() => { const d = new Date(checkin); d.setDate(d.getDate() + nights); return d.toISOString().split('T')[0] })()
    try {
      const res = await fetch('/api/ai/suggest-hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city, checkin, checkout, nights,
          guests: groupSize,
          travel_style: travelStyle,
          budget_per_night: budgetPerNight,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setHotelOptions(prev => ({ ...prev, [city]: data.hotels || [] }))
    } catch {
      toast.error(`Could not load hotels for ${city}`)
    } finally {
      setLoading(prev => ({ ...prev, [city]: false }))
    }
  }

  const totalHotelCost = cityBlocks.reduce((sum, block) => {
    const h = hotelByCity[block.city]
    return sum + (h ? h.cost_per_night * block.nights * groupSize : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Choose Your Hotels</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select a hotel for each destination. You can pick different hotels per city.</p>
      </div>

      {cityBlocks.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No destinations added yet — go back and add cities first
        </div>
      )}

      {cityBlocks.map((block) => {
        const options  = hotelOptions[block.city] || []
        const selected = hotelByCity[block.city]
        const isLoading = loading[block.city]

        return (
          <div key={block.city} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{block.city}</h3>
                  <p className="text-blue-200 text-sm">{block.nights} night{block.nights !== 1 ? 's' : ''} · {block.checkin} to {block.checkout}</p>
                </div>
                {selected && (
                  <div className="text-right">
                    <div className="text-xs text-blue-200">Selected</div>
                    <div className="font-semibold text-sm">{selected.name}</div>
                    <div className="text-blue-200 text-xs">{formatINR(selected.cost_per_night * block.nights)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {options.length === 0 && !isLoading ? (
                <Button
                  onClick={() => fetchHotels(block.city, block.nights, block.checkin)}
                  variant="outline"
                  className="w-full gap-2 h-10 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  🏨 Find Hotels in {block.city}
                </Button>
              ) : isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching hotels…
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{options.length} hotels found</p>
                    <button
                      onClick={() => fetchHotels(block.city, block.nights, block.checkin)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {options.map((hotel, i) => (
                      <HotelCard
                        key={i}
                        hotel={hotel}
                        selected={selected?.name === hotel.name}
                        onSelect={() => {
                          const newMap = { ...hotelByCity, [block.city]: hotel }
                          onChange(newMap)
                          toast.success(`${hotel.name} selected for ${block.city}`)
                        }}
                      />
                    ))}
                  </div>
                  {selected && (
                    <button
                      onClick={() => onChange({ ...hotelByCity, [block.city]: null })}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕ Clear selection
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}

      {totalHotelCost > 0 && (
        <div className="bg-gray-50 rounded-xl border p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total hotel cost (all cities)</span>
          <span className="font-bold text-gray-900">{formatINR(totalHotelCost)}</span>
        </div>
      )}
    </div>
  )
}
