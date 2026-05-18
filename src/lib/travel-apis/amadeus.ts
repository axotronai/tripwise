/**
 * Amadeus API client — flights & hotels
 *
 * Sign up free at: https://developers.amadeus.com
 * Set env vars:  AMADEUS_CLIENT_ID  and  AMADEUS_CLIENT_SECRET
 * Free tier:     2 000 API calls / month (test environment)
 */
import { AIRLINE_NAMES, HOTEL_GRADIENTS } from './city-codes'

/**
 * Token cache strategy:
 *   In serverless (Vercel/Edge), module-level variables are reset between
 *   cold starts. We use Next.js fetch() caching with `revalidate` to let
 *   the Next.js Data Cache store the token for (expires_in - 60) seconds.
 *   On the same server instance the module-level _token acts as a hot cache.
 */
let _token: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  // Hot path: module-level cache still valid
  if (_token && Date.now() < _token.expiresAt) return _token.value

  // Use Next.js fetch cache so multiple concurrent requests share one token
  // and cold-start instances can reuse a recently fetched one.
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=client_credentials&client_id=${process.env.AMADEUS_CLIENT_ID}&client_secret=${process.env.AMADEUS_CLIENT_SECRET}`,
    // Cache for 25 minutes (tokens last ~30 min; we back off 5 min for safety)
    next:    { revalidate: 1500 },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Amadeus auth failed: ${err}`)
  }

  const d = await res.json()
  // Also keep the module-level cache for ultra-fast in-process reuse
  _token = { value: d.access_token, expiresAt: Date.now() + (d.expires_in - 60) * 1_000 }
  return _token.value
}

// ─── ISO 8601 duration → "2h 10m" ────────────────────────────────────────────
export function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return iso
  const h = m[1] ? `${m[1]}h ` : ''
  const min = m[2] ? `${m[2]}m` : ''
  return (h + min).trim() || iso
}

// ─── Flight search ────────────────────────────────────────────────────────────
export interface FlightResult {
  id: string
  airline: string
  airline_code: string
  flight_number: string
  departure: string   // ISO datetime
  arrival: string     // ISO datetime
  duration: string    // "2h 10m"
  price: number       // INR
  stops: number
  book_at: string
}

export async function searchFlights(params: {
  origin: string
  destination: string
  date: string        // YYYY-MM-DD
  adults: number
  max?: number
}): Promise<FlightResult[]> {
  const token = await getToken()

  const url = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers')
  url.searchParams.set('originLocationCode',      params.origin)
  url.searchParams.set('destinationLocationCode', params.destination)
  url.searchParams.set('departureDate',            params.date)
  url.searchParams.set('adults',                   String(params.adults))
  url.searchParams.set('max',                      String(params.max ?? 10))
  url.searchParams.set('currencyCode',             'INR')
  url.searchParams.set('nonStop',                  'false')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return []

  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data ?? []).map((offer: any): FlightResult => {
    const segs     = offer.itineraries[0].segments
    const firstSeg = segs[0]
    const lastSeg  = segs[segs.length - 1]
    const code     = offer.validatingAirlineCodes?.[0] ?? firstSeg.carrierCode

    return {
      id:            offer.id,
      airline:       AIRLINE_NAMES[code] ?? code,
      airline_code:  code,
      flight_number: `${firstSeg.carrierCode}-${firstSeg.number}`,
      departure:     firstSeg.departure.at,
      arrival:       lastSeg.arrival.at,
      duration:      parseDuration(offer.itineraries[0].duration),
      price:         Math.round(parseFloat(offer.price.total)),
      stops:         segs.length - 1,
      book_at:       `https://www.makemytrip.com/flights/domestic-results#${firstSeg.departure.iataCode}-${lastSeg.arrival.iataCode}-${params.date.replace(/-/g, '')}-1-0-0-E-0-1`,
    }
  })
}

// ─── Hotel search ─────────────────────────────────────────────────────────────
export interface HotelResult {
  id: string
  name: string
  area: string
  city: string
  type: 'luxury' | 'comfort' | 'budget'
  rating: number
  reviews: number
  price_per_night: number
  amenities: string[]
  image_gradient: string
  map_url: string
  book_at: string
}

function classifyHotel(price: number): 'luxury' | 'comfort' | 'budget' {
  if (price >= 5000) return 'luxury'
  if (price >= 1500) return 'comfort'
  return 'budget'
}

export async function searchHotels(params: {
  cityCode: string
  cityName: string
  checkIn: string    // YYYY-MM-DD
  checkOut: string
  adults: number
}): Promise<HotelResult[]> {
  const token = await getToken()

  // Step 1 — Get hotel IDs for city
  const listUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
  listUrl.searchParams.set('cityCode',    params.cityCode)
  listUrl.searchParams.set('radius',      '15')
  listUrl.searchParams.set('radiusUnit',  'KM')
  listUrl.searchParams.set('hotelSource', 'ALL')

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3_600 },
  })
  if (!listRes.ok) return []

  const listData = await listRes.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotelList: any[] = listData.data ?? []
  if (!hotelList.length) return []

  // Step 2 — Get prices for first 10 hotels
  const hotelIds = hotelList.slice(0, 10).map((h: { hotelId: string }) => h.hotelId).join(',')

  const offUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers')
  offUrl.searchParams.set('hotelIds',    hotelIds)
  offUrl.searchParams.set('checkInDate', params.checkIn)
  offUrl.searchParams.set('checkOutDate',params.checkOut)
  offUrl.searchParams.set('adults',      String(params.adults))
  offUrl.searchParams.set('roomQuantity','1')
  offUrl.searchParams.set('currency',    'INR')

  const offRes = await fetch(offUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })

  if (!offRes.ok) {
    // Return hotel names without real pricing
    return hotelList.slice(0, 6).map((h): HotelResult => ({
      id:             h.hotelId,
      name:           h.name,
      area:           h.address?.cityName ?? params.cityName,
      city:           params.cityName,
      type:           'comfort',
      rating:         4.0,
      reviews:        0,
      price_per_night: 3000,
      amenities:      ['WiFi', 'AC', 'Restaurant'],
      image_gradient: HOTEL_GRADIENTS.comfort,
      map_url:        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + params.cityName)}`,
      book_at:        `https://www.booking.com/search.html?ss=${encodeURIComponent(h.name + ' ' + params.cityName)}`,
    }))
  }

  const offData = await offRes.json()
  const nights  = Math.max(1, Math.round(
    (new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86_400_000
  ))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (offData.data ?? []).map((item: any): HotelResult => {
    const hotel       = item.hotel
    const offer       = item.offers?.[0]
    const totalPrice  = offer?.price?.total ? parseFloat(offer.price.total) : 3000
    const priceNight  = Math.round(totalPrice / nights)
    const type        = classifyHotel(priceNight)

    return {
      id:             hotel.hotelId,
      name:           hotel.name,
      area:           hotel.address?.lines?.[0] ?? params.cityName,
      city:           params.cityName,
      type,
      // Amadeus `hotel.rating` is already on a 1–5 scale (some sources return
      // 1–10; guard against both by clamping to [0, 5]).
      rating:         hotel.rating ? Math.min(5, parseFloat(hotel.rating)) : 4.0,
      reviews:        0,
      price_per_night: priceNight,
      amenities:      (hotel.amenities ?? ['WiFi', 'AC']).slice(0, 5),
      image_gradient: HOTEL_GRADIENTS[type] ?? HOTEL_GRADIENTS.default,
      map_url:        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + params.cityName)}`,
      book_at:        `https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name + ' ' + params.cityName)}`,
    }
  })
}
