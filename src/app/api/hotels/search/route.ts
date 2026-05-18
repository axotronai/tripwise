import { NextRequest, NextResponse } from 'next/server'
import { searchHotels }            from '@/lib/travel-apis/amadeus'
import { getIATACode }             from '@/lib/travel-apis/city-codes'
import { bookingComHotelUrl, agodaUrl } from '@/lib/affiliates'

/**
 * GET /api/hotels/search?city=Goa&checkin=2024-01-15&checkout=2024-01-18&maxPrice=5000&minRating=3&type=all
 *
 * Uses Amadeus Hotel Search API when AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET are set.
 * Falls back to mock hotels otherwise.
 */
export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams
  const city      = sp.get('city')      || ''
  const checkin   = sp.get('checkin')   || new Date().toISOString().split('T')[0]
  const checkout  = sp.get('checkout')  || checkin
  const maxPrice  = parseInt(sp.get('maxPrice')  || '5000')
  const minRating = parseFloat(sp.get('minRating') || '0')
  const type      = sp.get('type')      || 'all'
  const adults    = parseInt(sp.get('adults')    || '2')

  const cityCode   = getIATACode(city)
  const hasAmadeus = !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_ID !== 'your_amadeus_client_id')

  let hotels: ReturnType<typeof getMockHotels>         = []
  let source = 'mock'

  if (cityCode && hasAmadeus) {
    try {
      const live = await searchHotels({ cityCode, cityName: city, checkIn: checkin, checkOut: checkout, adults })
      if (live.length > 0) {
        hotels = live
        source = 'amadeus'
      }
    } catch (err) {
      console.error('Amadeus hotel search failed:', err)
    }
  }

  if (hotels.length === 0) {
    hotels = getMockHotels(city, checkin, checkout, adults)
    source = source === 'mock' ? 'mock' : 'fallback'
  }

  const filtered = hotels
    .filter(h => h.price_per_night <= maxPrice * 1.4)
    .filter(h => h.rating          >= minRating)
    .filter(h => type === 'all'    || h.type === type)

  return NextResponse.json({ city, checkin, checkout, source, hotels: filtered })
}

function getMockHotels(city: string, checkin?: string, checkout?: string, guests = 2) {
  const enc = (s: string) => encodeURIComponent(s)
  return [
    { id: 'h1', name: 'The Grand Leela',    city, type: 'luxury',   price_per_night: 8500,  rating: 4.9, reviews: 2341, amenities: ['Pool','Spa','WiFi','Restaurant'], image_gradient: 'from-purple-500 to-pink-600',   map_url: `https://www.google.com/maps/search/?api=1&query=${enc('The Grand Leela ' + city)}`,  book_at: bookingComHotelUrl('The Grand Leela', city, checkin, checkout)    },
    { id: 'h2', name: 'OYO Premium Rooms',  city, type: 'budget',   price_per_night: 950,   rating: 3.8, reviews: 876,  amenities: ['WiFi','AC'],                      image_gradient: 'from-green-400 to-teal-500',    map_url: `https://www.google.com/maps/search/?api=1&query=${enc('OYO Rooms ' + city)}`,        book_at: `https://www.oyorooms.com/search/?location=${enc(city)}`          },
    { id: 'h3', name: 'Zostel',             city, type: 'hostel',   price_per_night: 450,   rating: 4.2, reviews: 1203, amenities: ['WiFi','Lounge','Kitchen'],         image_gradient: 'from-yellow-400 to-orange-500', map_url: `https://www.google.com/maps/search/?api=1&query=${enc('Zostel ' + city)}`,            book_at: `https://www.zostel.com/zostel/${city.toLowerCase().replace(/\s+/g, '-')}/` },
    { id: 'h4', name: 'Treebo Trend Vista', city, type: 'comfort',  price_per_night: 2200,  rating: 4.4, reviews: 654,  amenities: ['WiFi','AC','Breakfast'],           image_gradient: 'from-blue-400 to-indigo-500',   map_url: `https://www.google.com/maps/search/?api=1&query=${enc('Treebo ' + city)}`,            book_at: bookingComHotelUrl('Treebo Trend Vista', city, checkin, checkout) },
    { id: 'h5', name: 'Beach Villa',        city, type: 'villa',    price_per_night: 4800,  rating: 4.7, reviews: 312,  amenities: ['Pool','Kitchen','Beach Access'],   image_gradient: 'from-cyan-400 to-blue-500',     map_url: `https://www.google.com/maps/search/?api=1&query=${enc('Villa ' + city)}`,             book_at: agodaUrl(city, checkin, checkout, guests)                         },
    { id: 'h6', name: 'FabHotel Prime',     city, type: 'comfort',  price_per_night: 1600,  rating: 4.1, reviews: 489,  amenities: ['WiFi','AC','Parking'],             image_gradient: 'from-indigo-400 to-violet-500', map_url: `https://www.google.com/maps/search/?api=1&query=${enc('FabHotel ' + city)}`,           book_at: bookingComHotelUrl('FabHotel Prime', city, checkin, checkout)     },
  ]
}
