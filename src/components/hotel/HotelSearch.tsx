'use client'

import { useState } from 'react'
import { Star, MapPin, Wifi, Coffee, Waves, Filter, ArrowUpDown, CheckCircle2, X, Hotel as HotelIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatINR } from '@/lib/utils/trip'
import { format } from 'date-fns'
import { toast } from 'sonner'

export interface SelectedHotel {
  id: string; name: string; city: string; type: string
  price_per_night: number; rating: number; amenities: string[]
}

export interface TripDay {
  id: string; day_number: number; city: string; date: string
}

interface Hotel {
  id: string; name: string; city: string; type: string
  price_per_night: number; rating: number; reviews: number
  amenities: string[]; image_gradient: string
}

type SortKey = 'price_asc' | 'price_desc' | 'rating'

const HOTEL_TYPES = [
  { value: 'all',     label: 'All' },
  { value: 'hostel',  label: 'Hostel' },
  { value: 'budget',  label: 'Budget' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'luxury',  label: 'Luxury' },
  { value: 'villa',   label: 'Villa' },
]

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi':      <Wifi className="h-3 w-3" />,
  'Pool':      <Waves className="h-3 w-3" />,
  'Breakfast': <Coffee className="h-3 w-3" />,
}

interface Props {
  defaultCity?: string
  checkin?: string
  checkout?: string
  tripDays?: TripDay[]
  dayHotels?: Record<string, SelectedHotel>   // dayId → hotel
  onSelectHotelForDays?: (hotel: SelectedHotel, dayIds: string[]) => void
  onRemoveHotelFromDay?: (dayId: string) => void
}

export default function HotelSearch({
  defaultCity = '', checkin = '', checkout = '',
  tripDays = [], dayHotels = {}, onSelectHotelForDays, onRemoveHotelFromDay,
}: Props) {
  const [city, setCity]           = useState(defaultCity)
  const [cin, setCin]             = useState(checkin)
  const [cout, setCout]           = useState(checkout)
  const [maxPrice, setMaxPrice]   = useState([6000])
  const [minRating, setMinRating] = useState([0])
  const [type, setType]           = useState('all')
  const [sort, setSort]           = useState<SortKey>('rating')
  const [hotels, setHotels]       = useState<Hotel[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)

  // Day picker state
  const [pickingHotel, setPickingHotel]   = useState<Hotel | null>(null)
  const [pickedDayIds, setPickedDayIds]   = useState<string[]>([])

  async function search() {
    if (!city) { toast.error('Enter a city'); return }
    setLoading(true)
    try {
      const p = new URLSearchParams({ city, checkin: cin, checkout: cout, maxPrice: String(maxPrice[0]), minRating: String(minRating[0]), type })
      const res = await fetch(`/api/hotels/search?${p}`)
      const data = await res.json()
      setHotels(data.hotels || [])
      setSearched(true)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const sorted = [...hotels].sort((a, b) => {
    if (sort === 'price_asc')  return a.price_per_night - b.price_per_night
    if (sort === 'price_desc') return b.price_per_night - a.price_per_night
    return b.rating - a.rating
  })

  const nights = cin && cout
    ? Math.max(1, Math.round((new Date(cout).getTime() - new Date(cin).getTime()) / 86400000))
    : 1

  // Which dayIds are booked with a given hotel
  function bookedDaysForHotel(hotelId: string) {
    return Object.entries(dayHotels)
      .filter(([, h]) => h.id === hotelId)
      .map(([dayId]) => dayId)
  }

  function openDayPicker(hotel: Hotel) {
    const alreadyBooked = bookedDaysForHotel(hotel.id)
    setPickingHotel(hotel)
    setPickedDayIds(alreadyBooked)
  }

  function toggleDay(dayId: string) {
    setPickedDayIds(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  function selectAllDays() {
    // Only select days not already taken by another hotel
    const freeDays = tripDays
      .filter(d => !dayHotels[d.id] || dayHotels[d.id].id === pickingHotel?.id)
      .map(d => d.id)
    setPickedDayIds(freeDays)
  }

  function confirmDayPicker() {
    if (!pickingHotel || !onSelectHotelForDays) return
    if (pickedDayIds.length === 0) {
      toast.error('Select at least one day')
      return
    }
    const hotel: SelectedHotel = {
      id: pickingHotel.id, name: pickingHotel.name, city: pickingHotel.city, type: pickingHotel.type,
      price_per_night: pickingHotel.price_per_night, rating: pickingHotel.rating,
      amenities: pickingHotel.amenities,
    }
    onSelectHotelForDays(hotel, pickedDayIds)
    toast.success(`${pickingHotel.name} booked for ${pickedDayIds.length} day${pickedDayIds.length > 1 ? 's' : ''}!`)
    setPickingHotel(null)
    setPickedDayIds([])
  }

  const renderCard = (hotel: Hotel, aboveBudget = false) => {
    const myBookedDays = bookedDaysForHotel(hotel.id)
    const isBooked = myBookedDays.length > 0

    return (
      <Card key={hotel.id} className={`hover:shadow-md transition-shadow overflow-hidden ${aboveBudget ? 'border-green-200' : ''}`}>
        <div className="flex">
          <div className={`w-28 sm:w-36 shrink-0 bg-gradient-to-br ${hotel.image_gradient} flex items-center justify-center text-3xl`}>
            🏨
          </div>
          <CardContent className="p-3 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{hotel.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{hotel.city}</span>
                  <Badge variant="outline" className="text-xs py-0 ml-1 capitalize">{hotel.type}</Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                {aboveBudget && <p className="text-xs font-semibold text-green-600 mb-0.5">↑ Slightly High</p>}
                <p className={`font-bold text-base ${aboveBudget ? 'text-green-600' : 'text-blue-600'}`}>{formatINR(hotel.price_per_night)}</p>
                <p className="text-xs text-gray-400">per night</p>
                {nights > 1 && <p className="text-xs text-gray-500 font-medium">{formatINR(hotel.price_per_night * nights)} total</p>}
              </div>
            </div>

            {/* Booked days indicator */}
            {isBooked && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                <span className="text-xs text-green-600 font-medium">Booked:</span>
                {myBookedDays.map(dayId => {
                  const d = tripDays.find(td => td.id === dayId)
                  return d ? (
                    <span key={dayId} className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      D{d.day_number}
                      {onRemoveHotelFromDay && (
                        <button onClick={() => onRemoveHotelFromDay(dayId)} className="ml-0.5 hover:text-red-500">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ) : null
                })}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.round(hotel.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">{hotel.rating}</span>
                <span className="text-xs text-gray-400">({hotel.reviews.toLocaleString()})</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1 flex-wrap">
                {hotel.amenities.slice(0, 4).map(a => (
                  <span key={a} className="flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {AMENITY_ICONS[a] ?? null} {a}
                  </span>
                ))}
              </div>
              {onSelectHotelForDays && (
                <Button
                  size="sm"
                  variant={isBooked ? 'default' : 'outline'}
                  className={`text-xs gap-1 h-7 shrink-0 ${isBooked ? 'bg-green-600 hover:bg-green-700 border-green-600' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                  onClick={() => openDayPicker(hotel)}
                >
                  <HotelIcon className="h-3 w-3" />
                  {isBooked ? `Edit (${myBookedDays.length}d)` : 'Select Hotel'}
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input placeholder="Goa, Manali, Jaipur…" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Check-in</Label>
              <Input type="date" value={cin} onChange={e => setCin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Check-out</Label>
              <Input type="date" value={cout} onChange={e => setCout(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Hotel Type</Label>
            <Tabs value={type} onValueChange={setType}>
              <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
                {HOTEL_TYPES.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-500"><Filter className="h-3 w-3" /> Max/night</span>
                <span className="font-medium text-blue-600">{formatINR(maxPrice[0])}</span>
              </div>
              <Slider min={500} max={15000} step={250} value={maxPrice} onValueChange={v => setMaxPrice(v as number[])} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-500"><Star className="h-3 w-3" /> Min rating</span>
                <span className="font-medium text-blue-600">{minRating[0]}★+</span>
              </div>
              <Slider min={0} max={5} step={0.5} value={minRating} onValueChange={v => setMinRating(v as number[])} />
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={search} disabled={loading}>
            {loading ? 'Searching…' : 'Search Hotels'}
          </Button>
        </CardContent>
      </Card>

      {/* Day Picker Modal */}
      {pickingHotel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPickingHotel(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Choose Days</h3>
                <p className="text-xs text-gray-500 mt-0.5">Book <span className="font-medium text-blue-600">{pickingHotel.name}</span> for:</p>
              </div>
              <button onClick={() => setPickingHotel(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tripDays.map(d => {
                const takenByOther = dayHotels[d.id] && dayHotels[d.id].id !== pickingHotel.id
                const isChecked = pickedDayIds.includes(d.id)
                return (
                  <label
                    key={d.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      takenByOther ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' :
                      isChecked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={takenByOther}
                      onChange={() => toggleDay(d.id)}
                      className="rounded accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">Day {d.day_number} — {d.city}</span>
                      <span className="text-xs text-gray-400 ml-2">{format(new Date(d.date), 'EEE, d MMM')}</span>
                    </div>
                    {takenByOther && (
                      <span className="text-xs text-gray-400 truncate max-w-[80px]">{dayHotels[d.id].name}</span>
                    )}
                    {isChecked && !takenByOther && (
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={selectAllDays}>All Free Days</Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setPickingHotel(null)}>Cancel</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1" onClick={confirmDayPicker} disabled={pickedDayIds.length === 0}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm ({pickedDayIds.length}d)
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {formatINR(pickingHotel.price_per_night)}/night × {pickedDayIds.length} day{pickedDayIds.length !== 1 ? 's' : ''} = {formatINR(pickingHotel.price_per_night * pickedDayIds.length)}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {sorted.length} hotel{sorted.length !== 1 ? 's' : ''} in <span className="font-medium text-gray-700">{city}</span>
              {nights > 1 && ` · ${nights} nights`}
            </p>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
              <select className="text-xs border rounded px-2 py-1 text-gray-600 bg-white" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🏨</p>
              <p className="text-sm">No hotels match your filters</p>
              <p className="text-xs mt-1">Try increasing max price or lowering min rating</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {(() => {
                const withinBudget = sorted.filter(h => h.price_per_night <= maxPrice[0])
                const slightlyHigh = sorted.filter(h => h.price_per_night > maxPrice[0])
                return (
                  <>
                    {withinBudget.map(h => renderCard(h, false))}
                    {slightlyHigh.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex-1 h-px bg-green-200" />
                          <span className="text-xs text-green-600 font-medium px-2">↑ Slightly above your budget</span>
                          <div className="flex-1 h-px bg-green-200" />
                        </div>
                        {slightlyHigh.map(h => renderCard(h, true))}
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
