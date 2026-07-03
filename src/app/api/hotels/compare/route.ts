/**
 * GET /api/hotels/compare
 *
 * Returns hotels with prices from multiple OTAs for comparison.
 *
 * Data sources (in priority order):
 *  1. Hotellook by TravelPayouts — real prices from 15+ OTAs
 *     Requires: TRAVELPAYOUTS_TOKEN env var
 *     Get token: https://www.travelpayouts.com/programs/HotelLook/tools/api
 *
 *  2. Mock data — curated hotels with affiliate deep links (works without any API key)
 *
 * Query params:
 *  city       — destination city name (required)
 *  checkin    — YYYY-MM-DD (required)
 *  checkout   — YYYY-MM-DD (required)
 *  adults     — number of guests (default 2)
 *  rooms      — number of rooms (default 1)
 *  type       — all | budget | comfort | luxury (default all)
 *  max_price  — max price per night in INR (default 15000)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  bookingComUrl, agodaUrl, hotelsComUrl, makemytripHotelUrl, oyoUrl,
} from '@/lib/affiliates'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HotelSource {
  id:       string        // 'booking' | 'agoda' | 'hotels_com' | 'makemytrip' | 'oyo'
  name:     string        // display name
  price:    number | null // null = "click to check"
  currency: 'INR'
  book_url: string
  logo:     string        // emoji placeholder until we add real logos
}

export interface ComparedHotel {
  id:             string
  name:           string
  stars:          number          // 1-5
  type:           'hostel' | 'budget' | 'comfort' | 'luxury' | 'villa' | 'resort'
  city:           string
  area:           string          // neighbourhood
  rating:         number          // 1-5
  reviews:        number
  amenities:      string[]
  image_gradient: string          // Tailwind gradient for placeholder
  sources:        HotelSource[]
  cheapest_price: number | null
  cheapest_source: string | null  // source id with lowest price
  data_source:    'hotellook' | 'mock'
}

// ─── Hotellook integration ────────────────────────────────────────────────────

const HOTELLOOK_TOKEN = process.env.TRAVELPAYOUTS_TOKEN
const HOTELLOOK_BASE  = 'https://engine.hotellook.com/api/v2'

const OTA_META: Record<string, { name: string; logo: string }> = {
  booking:     { name: 'Booking.com',  logo: '🔵' },
  agoda:       { name: 'Agoda',        logo: '🟠' },
  expedia:     { name: 'Expedia',      logo: '🟡' },
  hotels_com:  { name: 'Hotels.com',   logo: '🔴' },
  ostrovok:    { name: 'Ostrovok',     logo: '🟣' },
  hotel_bb:    { name: 'HotelBB',      logo: '⚪' },
}

interface HotellookHotel {
  id:       number
  name:     string
  stars:    number
  location: { name: string }
  priceFrom?: number
  prices?: Record<string, { price: number }>
}

async function fetchFromHotellook(
  city: string, checkin: string, checkout: string, adults: number
): Promise<ComparedHotel[] | null> {
  if (!HOTELLOOK_TOKEN) return null
  try {
    const p = new URLSearchParams({
      location:    city,
      checkIn:     checkin,
      checkOut:    checkout,
      adultsCount: String(adults),
      currency:    'INR',
      limit:       '20',
      token:       HOTELLOOK_TOKEN,
    })
    const res  = await fetch(`${HOTELLOOK_BASE}/cache.json?${p}`, { next: { revalidate: 900 } }) // 15-min cache
    if (!res.ok) return null
    const raw = await res.json() as Record<string, HotellookHotel>

    return Object.entries(raw).map(([hotelId, h]) => {
      const priceEntries = Object.entries(h.prices ?? {})
      const sources: HotelSource[] = priceEntries.map(([key, val]) => {
        const meta = OTA_META[key] ?? { name: key, logo: '🌐' }
        return {
          id:       key,
          name:     meta.name,
          price:    val.price,
          currency: 'INR' as const,
          book_url: bookingComUrl(city, checkin, checkout, adults), // best fallback
          logo:     meta.logo,
        }
      }).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))

      const cheapest = sources.find(s => s.price != null)

      return {
        id:              hotelId,
        name:            h.name,
        stars:           h.stars ?? 3,
        type:            starsToType(h.stars),
        city,
        area:            h.location?.name ?? city,
        rating:          4.0,
        reviews:         0,
        amenities:       [],
        image_gradient:  typeGradient(starsToType(h.stars)),
        sources,
        cheapest_price:  cheapest?.price ?? null,
        cheapest_source: cheapest?.id    ?? null,
        data_source:     'hotellook' as const,
      }
    })
  } catch (e) {
    console.error('[hotels/compare] Hotellook error:', e)
    return null
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function starsToType(stars: number): ComparedHotel['type'] {
  if (stars <= 1) return 'hostel'
  if (stars === 2) return 'budget'
  if (stars === 3) return 'comfort'
  if (stars >= 5) return 'luxury'
  return 'comfort'
}

function typeGradient(type: ComparedHotel['type']): string {
  const map: Record<string, string> = {
    hostel:  'from-yellow-400 to-orange-500',
    budget:  'from-green-400 to-teal-500',
    comfort: 'from-blue-400 to-indigo-500',
    luxury:  'from-purple-500 to-pink-600',
    villa:   'from-cyan-400 to-blue-500',
    resort:  'from-rose-400 to-pink-500',
  }
  return map[type] ?? 'from-gray-400 to-gray-500'
}

function buildMockHotels(
  city: string, checkin: string, checkout: string, adults: number, rooms: number
): ComparedHotel[] {
  const enc = (s: string) => encodeURIComponent(s)
  const bUrl = (name: string) => `https://www.booking.com/searchresults.html?ss=${enc(name + ' ' + city)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&currency=INR`
  const aUrl  = agodaUrl(city, checkin, checkout, adults)
  const hcUrl = hotelsComUrl(city, checkin, checkout, adults, rooms)
  const mmtUrl = makemytripHotelUrl(city, checkin, checkout, adults)
  const oyUrl  = oyoUrl(city, checkin, checkout)

  const hotels: Omit<ComparedHotel, 'sources' | 'cheapest_price' | 'cheapest_source' | 'data_source'>[] = [
    {
      id: 'm1', name: `Taj ${city}`, stars: 5, type: 'luxury', city, area: `City Centre, ${city}`,
      rating: 4.9, reviews: 3241, amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant', 'Gym'],
      image_gradient: 'from-purple-500 to-pink-600',
    },
    {
      id: 'm2', name: `The Leela ${city}`, stars: 5, type: 'luxury', city, area: `Premium Zone, ${city}`,
      rating: 4.8, reviews: 2108, amenities: ['Pool', 'Spa', 'WiFi', 'Bar', 'Concierge'],
      image_gradient: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'm3', name: `Marriott ${city}`, stars: 4, type: 'luxury', city, area: `Business District, ${city}`,
      rating: 4.6, reviews: 1876, amenities: ['Pool', 'WiFi', 'Restaurant', 'Gym', 'Business Centre'],
      image_gradient: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'm4', name: `Radisson Blu ${city}`, stars: 4, type: 'comfort', city, area: `Main Road, ${city}`,
      rating: 4.4, reviews: 1203, amenities: ['Pool', 'WiFi', 'Restaurant', 'Gym'],
      image_gradient: 'from-sky-400 to-blue-500',
    },
    {
      id: 'm5', name: `ibis ${city}`, stars: 3, type: 'comfort', city, area: `Near Airport, ${city}`,
      rating: 4.2, reviews: 2341, amenities: ['WiFi', 'Restaurant', 'AC'],
      image_gradient: 'from-teal-400 to-cyan-500',
    },
    {
      id: 'm6', name: `Treebo Trend ${city}`, stars: 3, type: 'comfort', city, area: `Market Area, ${city}`,
      rating: 4.1, reviews: 876, amenities: ['WiFi', 'AC', 'Breakfast'],
      image_gradient: 'from-green-400 to-teal-500',
    },
    {
      id: 'm7', name: `FabHotel Prime ${city}`, stars: 2, type: 'budget', city, area: `Town Area, ${city}`,
      rating: 3.9, reviews: 654, amenities: ['WiFi', 'AC', 'Parking'],
      image_gradient: 'from-lime-400 to-green-500',
    },
    {
      id: 'm8', name: `OYO Rooms ${city}`, stars: 2, type: 'budget', city, area: `Various Locations, ${city}`,
      rating: 3.7, reviews: 4521, amenities: ['WiFi', 'AC'],
      image_gradient: 'from-red-400 to-rose-500',
    },
    {
      id: 'm9', name: `Zostel ${city}`, stars: 1, type: 'hostel', city, area: `Backpacker Zone, ${city}`,
      rating: 4.3, reviews: 1876, amenities: ['WiFi', 'Lounge', 'Kitchen', 'Lockers'],
      image_gradient: 'from-yellow-400 to-orange-500',
    },
    {
      id: 'm10', name: `Backpacker Panda ${city}`, stars: 1, type: 'hostel', city, area: `Old Town, ${city}`,
      rating: 4.1, reviews: 987, amenities: ['WiFi', 'Lounge', 'Common Room'],
      image_gradient: 'from-amber-400 to-yellow-500',
    },
  ]

  // Each hotel type gets realistic price ranges + all relevant sources
  const priceSeed = (city.charCodeAt(0) + city.charCodeAt(1)) % 20 // consistent per city

  return hotels.map(h => {
    const basePrices: Record<string, Record<ComparedHotel['type'], number>> = {
      booking:    { luxury: 14000, comfort: 4200, budget: 1600, hostel: 650, villa: 8000, resort: 10000 },
      agoda:      { luxury: 13200, comfort: 3900, budget: 1450, hostel: 600, villa: 7500, resort: 9500  },
      hotels_com: { luxury: 14800, comfort: 4500, budget: 1750, hostel: 700, villa: 8500, resort: 10500 },
      mmt:        { luxury: 13800, comfort: 4100, budget: 1550, hostel: 0,   villa: 7800, resort: 9800  },
      oyo:        { luxury: 0,     comfort: 0,    budget: 950,  hostel: 350, villa: 0,    resort: 0     },
    }

    // Add small city-based variation so prices differ per city
    const vary = (base: number) => base > 0 ? base + (priceSeed * 50) - 500 : 0

    const allSources: HotelSource[] = [
      { id: 'booking',    name: 'Booking.com',  logo: '🔵', price: vary(basePrices.booking[h.type]),    currency: 'INR' as const, book_url: bUrl(h.name) },
      { id: 'agoda',      name: 'Agoda',        logo: '🟠', price: vary(basePrices.agoda[h.type]),      currency: 'INR' as const, book_url: aUrl         },
      { id: 'hotels_com', name: 'Hotels.com',   logo: '🔴', price: vary(basePrices.hotels_com[h.type]), currency: 'INR' as const, book_url: hcUrl        },
      { id: 'mmt',        name: 'MakeMyTrip',   logo: '🟢', price: vary(basePrices.mmt[h.type]),        currency: 'INR' as const, book_url: mmtUrl       },
      { id: 'oyo',        name: 'OYO',          logo: '⭕', price: vary(basePrices.oyo[h.type]),         currency: 'INR' as const, book_url: oyUrl        },
    ]
      .filter(s => s.price > 0)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))

    const cheapest = allSources[0]

    return {
      ...h,
      sources:         allSources,
      cheapest_price:  cheapest?.price  ?? null,
      cheapest_source: cheapest?.id     ?? null,
      data_source:     'mock' as const,
    }
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams
  const city     = sp.get('city')?.trim()      || ''
  const checkin  = sp.get('checkin')            || ''
  const checkout = sp.get('checkout')           || ''
  const adults   = Math.max(1, parseInt(sp.get('adults') || '2'))
  const rooms    = Math.max(1, parseInt(sp.get('rooms')  || '1'))
  const type     = sp.get('type')               || 'all'
  const maxPrice = parseInt(sp.get('max_price') || '50000')

  if (!city || !checkin || !checkout) {
    return NextResponse.json({ error: 'city, checkin and checkout are required' }, { status: 400 })
  }

  // Try Hotellook first, fall back to mock
  let hotels = await fetchFromHotellook(city, checkin, checkout, adults)
  const source = hotels ? 'hotellook' : 'mock'
  if (!hotels) hotels = buildMockHotels(city, checkin, checkout, adults, rooms)

  // Filter by type and max price
  const filtered = hotels
    .filter(h => type === 'all' || h.type === type)
    .filter(h => !h.cheapest_price || h.cheapest_price <= maxPrice * 1.3)
    .sort((a, b) => (a.cheapest_price ?? Infinity) - (b.cheapest_price ?? Infinity))

  const nights = Math.max(1, Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  ))

  return NextResponse.json({ city, checkin, checkout, nights, adults, rooms, source, hotels: filtered })
}
