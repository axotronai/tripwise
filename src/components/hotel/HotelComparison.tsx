'use client'

import { useState } from 'react'
import {
  Star, MapPin, Wifi, Waves, Coffee, UtensilsCrossed,
  Dumbbell, Car, Sparkles, ArrowUpDown, SlidersHorizontal,
  ExternalLink, TrendingDown, Users, Building2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatINR } from '@/lib/utils/trip'
import type { ComparedHotel, HotelSource } from '@/app/api/hotels/compare/route'

// ─── Amenity icons ────────────────────────────────────────────────────────────
const AMENITY_ICON: Record<string, React.ReactNode> = {
  'WiFi':            <Wifi className="h-3 w-3" />,
  'Pool':            <Waves className="h-3 w-3" />,
  'Breakfast':       <Coffee className="h-3 w-3" />,
  'Restaurant':      <UtensilsCrossed className="h-3 w-3" />,
  'Gym':             <Dumbbell className="h-3 w-3" />,
  'Parking':         <Car className="h-3 w-3" />,
  'Spa':             <Sparkles className="h-3 w-3" />,
}

const HOTEL_TYPES = [
  { value: 'all',     label: 'All' },
  { value: 'hostel',  label: 'Hostel' },
  { value: 'budget',  label: 'Budget' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'luxury',  label: 'Luxury' },
]

type SortKey = 'cheapest' | 'rating' | 'stars'

// ─── OTA logo colours (bg) ────────────────────────────────────────────────────
const OTA_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  booking:    { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200'  },
  agoda:      { bg: 'bg-orange-50', text: 'text-orange-700',border: 'border-orange-200'},
  hotels_com: { bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-200'   },
  mmt:        { bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200' },
  oyo:        { bg: 'bg-rose-50',   text: 'text-rose-700',  border: 'border-rose-200'  },
}

// ─── Single source price row ──────────────────────────────────────────────────
function SourceRow({ source, isCheapest, nights }: {
  source: HotelSource; isCheapest: boolean; nights: number
}) {
  const style = OTA_STYLE[source.id] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }

  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${style.border} ${style.bg} ${isCheapest ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{source.logo}</span>
        <span className={`text-sm font-medium truncate ${style.text}`}>{source.name}</span>
        {isCheapest && (
          <Badge className="text-[10px] py-0 px-1.5 bg-green-500 text-white border-0 shrink-0">
            Cheapest
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {source.price ? (
          <div className="text-right">
            <p className={`font-bold text-sm ${isCheapest ? 'text-green-700' : style.text}`}>
              {formatINR(source.price)}
            </p>
            {nights > 1 && (
              <p className="text-[10px] text-gray-400">{formatINR(source.price * nights)} total</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Check price</p>
        )}
        <a
          href={source.book_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            isCheapest
              ? 'bg-green-600 text-white hover:bg-green-700'
              : `border ${style.border} ${style.text} hover:brightness-95 ${style.bg}`
          }`}
        >
          Book <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

// ─── Hotel comparison card ────────────────────────────────────────────────────
function HotelCard({ hotel, nights }: { hotel: ComparedHotel; nights: number }) {
  const [expanded, setExpanded] = useState(false)

  const savings = hotel.sources.length >= 2
    ? (hotel.sources[hotel.sources.length - 1].price ?? 0) - (hotel.cheapest_price ?? 0)
    : 0

  const visibleSources = expanded ? hotel.sources : hotel.sources.slice(0, 3)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="flex">
        {/* Hotel image placeholder */}
        <div className={`hidden sm:flex w-32 shrink-0 bg-gradient-to-br ${hotel.image_gradient} items-center justify-center text-4xl`}>
          🏨
        </div>

        <CardContent className="p-4 flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-base">{hotel.name}</h3>
                <div className="flex">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Badge variant="outline" className="text-xs py-0 capitalize">{hotel.type}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{hotel.area}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.round(hotel.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">{hotel.rating.toFixed(1)}</span>
                {hotel.reviews > 0 && <span className="text-xs text-gray-400">({hotel.reviews.toLocaleString()} reviews)</span>}
              </div>
            </div>

            {/* Price summary */}
            {hotel.cheapest_price && (
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">from</p>
                <p className="text-xl font-bold text-green-700">{formatINR(hotel.cheapest_price)}</p>
                <p className="text-xs text-gray-400">/night</p>
                {savings > 200 && (
                  <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-0.5 justify-end">
                    <TrendingDown className="h-3 w-3" /> Save {formatINR(savings)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1 mb-3">
            {hotel.amenities.slice(0, 5).map(a => (
              <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {AMENITY_ICON[a] ?? null} {a}
              </span>
            ))}
          </div>

          {/* Price comparison table */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Compare prices · per night
            </p>
            {visibleSources.map(s => (
              <SourceRow
                key={s.id}
                source={s}
                isCheapest={s.id === hotel.cheapest_source}
                nights={nights}
              />
            ))}

            {/* Show more / less */}
            {hotel.sources.length > 3 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 w-full justify-center py-1"
              >
                {expanded
                  ? <><ChevronUp className="h-3 w-3" /> Show less</>
                  : <><ChevronDown className="h-3 w-3" /> +{hotel.sources.length - 3} more sources</>
                }
              </button>
            )}
          </div>

          {/* Savings line */}
          {savings > 200 && (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 mt-2 text-center font-medium">
              💰 Save {formatINR(savings)}/night by booking on {hotel.sources[0]?.name} instead of {hotel.sources[hotel.sources.length - 1]?.name}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  defaultCity?:    string
  defaultCheckin?: string
  defaultCheckout?: string
  defaultAdults?:  number
}

export default function HotelComparison({
  defaultCity    = '',
  defaultCheckin = '',
  defaultCheckout = '',
  defaultAdults  = 2,
}: Props) {
  const [city,     setCity]     = useState(defaultCity)
  const [checkin,  setCheckin]  = useState(defaultCheckin)
  const [checkout, setCheckout] = useState(defaultCheckout)
  const [adults,   setAdults]   = useState(defaultAdults)
  const [type,     setType]     = useState('all')
  const [maxPrice, setMaxPrice] = useState(20000)
  const [sort,     setSort]     = useState<SortKey>('cheapest')
  const [hotels,   setHotels]   = useState<ComparedHotel[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [meta,     setMeta]     = useState<{ nights: number; source: string; city: string }>({ nights: 1, source: '', city: '' })

  async function search() {
    if (!city || !checkin || !checkout) return
    setLoading(true)
    try {
      const p = new URLSearchParams({ city, checkin, checkout, adults: String(adults), type, max_price: String(maxPrice) })
      const res  = await fetch(`/api/hotels/compare?${p}`)
      const data = await res.json()
      setHotels(data.hotels ?? [])
      setMeta({ nights: data.nights ?? 1, source: data.source ?? '', city: data.city ?? city })
      setSearched(true)
    } catch {
      /* silent fail */
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...hotels].sort((a, b) => {
    if (sort === 'cheapest') return (a.cheapest_price ?? Infinity) - (b.cheapest_price ?? Infinity)
    if (sort === 'rating')   return b.rating - a.rating
    return b.stars - a.stars
  })

  const filtered = sorted.filter(h => h.cheapest_price == null || h.cheapest_price <= maxPrice)

  return (
    <div className="space-y-5">

      {/* ── Search Form ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Destination</Label>
              <Input
                placeholder="Goa, Manali, Jaipur…"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Check-in</Label>
              <Input type="date" value={checkin}  onChange={e => setCheckin(e.target.value)}  min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Check-out</Label>
              <Input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} min={checkin || new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Guests</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400 shrink-0" />
                <Input type="number" min={1} max={10} value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Type filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Hotel type</Label>
            <Tabs value={type} onValueChange={setType}>
              <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
                {HOTEL_TYPES.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Max price */}
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
            <Label className="text-xs text-gray-500 shrink-0">Max price/night:</Label>
            <input
              type="range" min={500} max={50000} step={500}
              value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-sm font-semibold text-blue-700 shrink-0 w-24 text-right">{formatINR(maxPrice)}</span>
          </div>

          <Button
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-semibold gap-2"
            onClick={search}
            disabled={loading || !city || !checkin || !checkout}
          >
            {loading ? (
              <><span className="animate-spin">⏳</span> Comparing prices…</>
            ) : (
              <><Building2 className="h-4 w-4" /> Compare Hotel Prices</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {searched && (
        <div className="space-y-4">
          {/* Results header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800">
                {filtered.length} hotel{filtered.length !== 1 ? 's' : ''} in <span className="text-blue-600">{meta.city}</span>
              </p>
              <p className="text-xs text-gray-500">
                {meta.nights} night{meta.nights !== 1 ? 's' : ''} · {adults} guest{adults !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Data source badge */}
              {meta.source === 'hotellook' && (
                <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 font-medium">
                  🟢 Live prices · 15+ sites
                </span>
              )}
              {meta.source === 'mock' && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 font-medium">
                  ⚡ Sample · Click to see live prices
                </span>
              )}

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:ring-1 focus:ring-blue-400"
                >
                  <option value="cheapest">Cheapest first</option>
                  <option value="rating">Top rated</option>
                  <option value="stars">Stars: High to low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hotel cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-5xl mb-3">🏨</p>
              <p className="text-sm font-medium">No hotels match your filters</p>
              <p className="text-xs mt-1">Try increasing your max price or changing the hotel type</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map(h => (
                <HotelCard key={h.id} hotel={h} nights={meta.nights} />
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-center text-gray-400 pt-2">
            Prices shown are per night. TripWise earns a small commission when you book — it helps keep the app free. ❤️
          </p>
        </div>
      )}
    </div>
  )
}
