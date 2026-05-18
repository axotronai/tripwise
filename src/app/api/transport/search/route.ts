import { NextRequest, NextResponse } from 'next/server'
import { searchFlights }                                   from '@/lib/travel-apis/amadeus'
import { searchTrains }                                    from '@/lib/travel-apis/irctc'
import { getIATACode, getIRCTCCode, getApproxDistanceKm } from '@/lib/travel-apis/city-codes'
import { makemytripFlightUrl, easemytripFlightUrl, redbusUrl, abhiBusUrl } from '@/lib/affiliates'

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams
  const from     = sp.get('from')     || ''
  const to       = sp.get('to')       || ''
  const date     = sp.get('date')     || new Date().toISOString().split('T')[0]
  const maxPrice = parseInt(sp.get('maxPrice') || '15000')
  const mode     = sp.get('mode')     || 'all'
  const adults   = parseInt(sp.get('adults')   || '1')

  const fromIATA  = getIATACode(from)
  const toIATA    = getIATACode(to)
  const fromIRCTC = getIRCTCCode(from)
  const toIRCTC   = getIRCTCCode(to)

  const hasAmadeus  = !!(process.env.AMADEUS_CLIENT_ID  && process.env.AMADEUS_CLIENT_ID  !== 'your_amadeus_client_id')
  const hasRapidAPI = !!process.env.RAPIDAPI_KEY

  // ─── Fetch live data in parallel ─────────────────────────────────────────────
  const [flightRes, trainRes] = await Promise.allSettled([
    (mode === 'all' || mode === 'flight') && fromIATA && toIATA && hasAmadeus
      ? searchFlights({ origin: fromIATA, destination: toIATA, date, adults, max: 8 })
      : Promise.resolve(null),

    (mode === 'all' || mode === 'train') && fromIRCTC && toIRCTC && hasRapidAPI
      ? searchTrains({ from: fromIRCTC, to: toIRCTC, date })
      : Promise.resolve(null),
  ])

  const liveFlights = flightRes.status === 'fulfilled' ? (flightRes.value ?? null) : null
  const liveTrains  = trainRes.status  === 'fulfilled' ? (trainRes.value  ?? null) : null

  const flights = (liveFlights ?? getMockFlights(from, to, date, adults)).filter(f => f.price <= maxPrice)
  const trains  = (liveTrains  ?? getMockTrains(from, to, date)).filter(t => t.price  <= maxPrice)
  const buses   = (mode === 'all' || mode === 'bus') ? getMockBuses(from, to, date, maxPrice) : []

  return NextResponse.json({
    from, to, date,
    flights,
    trains,
    buses,
    sources: {
      flights: liveFlights !== null ? 'amadeus'
             : hasAmadeus && fromIATA && toIATA ? 'no_results'
             : 'mock',
      trains:  liveTrains  !== null ? 'irctc'
             : hasRapidAPI && fromIRCTC && toIRCTC ? 'no_results'
             : 'mock',
      buses: 'redbus_link',
    },
  })
}

// ─── Mock fallbacks (used when API keys absent or city not in lookup) ─────────
function getMockFlights(from: string, to: string, date: string, adults: number) {
  return [
    { id: 'f1', airline: 'IndiGo',    airline_code: '6E', flight_number: '6E-2341', departure: `${date}T06:00:00`, arrival: `${date}T08:10:00`, duration: '2h 10m', price: 3800, stops: 0, book_at: makemytripFlightUrl(from, to, date, adults) },
    { id: 'f2', airline: 'Air India', airline_code: 'AI', flight_number: 'AI-852',  departure: `${date}T11:30:00`, arrival: `${date}T13:45:00`, duration: '2h 15m', price: 4200, stops: 0, book_at: easemytripFlightUrl(from, to, date, adults) },
    { id: 'f3', airline: 'SpiceJet',  airline_code: 'SG', flight_number: 'SG-191',  departure: `${date}T15:00:00`, arrival: `${date}T18:30:00`, duration: '3h 30m', price: 2950, stops: 1, book_at: makemytripFlightUrl(from, to, date, adults) },
    { id: 'f4', airline: 'Akasa Air', airline_code: 'QP', flight_number: 'QP-1119', departure: `${date}T20:00:00`, arrival: `${date}T22:10:00`, duration: '2h 10m', price: 3500, stops: 0, book_at: easemytripFlightUrl(from, to, date, adults) },
  ]
}

function getMockTrains(from: string, to: string, date: string) {
  void from; void to
  const nd = new Date(new Date(date).getTime() + 86_400_000).toISOString().split('T')[0]
  return [
    { id: '12951', train_name: 'Mumbai Rajdhani',  train_number: '12951', departure: `${date}T17:00:00`, arrival: `${nd}T08:35:00`,  duration: '15h 35m', price: 1245, class: '3A', available_seats: 24, run_days: 'Daily',             train_type: 'Rajdhani', book_at: 'https://www.irctc.co.in/nget/train-search' },
    { id: '12001', train_name: 'Shatabdi Express', train_number: '12001', departure: `${date}T06:00:00`, arrival: `${date}T13:20:00`, duration: '7h 20m',  price: 895,  class: 'CC', available_seats: 8,  run_days: 'Mon–Sat',          train_type: 'Shatabdi', book_at: 'https://www.irctc.co.in/nget/train-search' },
    { id: '12213', train_name: 'Duronto Express',  train_number: '12213', departure: `${date}T23:00:00`, arrival: `${nd}T13:00:00`,  duration: '14h 00m', price: 1680, class: '2A', available_seats: 15, run_days: 'Tue, Fri, Sun',     train_type: 'Duronto',  book_at: 'https://www.irctc.co.in/nget/train-search' },
    { id: '22119', train_name: 'Tejas Express',    train_number: '22119', departure: `${date}T06:10:00`, arrival: `${date}T13:00:00`, duration: '6h 50m',  price: 1160, class: 'CC', available_seats: 32, run_days: 'Daily except Tue', train_type: 'Tejas',    book_at: 'https://www.irctc.co.in/nget/train-search' },
  ]
}

function getMockBuses(from: string, to: string, date: string, maxPrice: number) {
  const distKm = getApproxDistanceKm(from, to)
  const hours  = Math.max(4, Math.round(distKm / 50))

  function addHrs(iso: string, h: number, extraMins = 0) {
    return new Date(new Date(iso).getTime() + h * 3_600_000 + extraMins * 60_000).toISOString()
  }

  const dep1 = `${date}T20:30:00`
  const dep2 = `${date}T21:00:00`
  const dep3 = `${date}T22:00:00`

  return [
    { id: 'b1', operator: 'VRL Travels',       departure: dep1, arrival: addHrs(dep1, hours),      duration: `${hours}h 00m`,      price: Math.round(distKm * 1.2), bus_type: 'AC Sleeper',     book_at: redbusUrl(from, to, date)   },
    { id: 'b2', operator: 'SRS Travels',        departure: dep2, arrival: addHrs(dep2, hours, 30),  duration: `${hours}h 30m`,      price: Math.round(distKm * 0.9), bus_type: 'Non-AC Sleeper', book_at: redbusUrl(from, to, date)   },
    { id: 'b3', operator: 'IntrCity SmartBus',  departure: dep3, arrival: addHrs(dep3, hours - 1),  duration: `${hours - 1}h 00m`,  price: Math.round(distKm * 1.5), bus_type: 'Luxury AC',      book_at: abhiBusUrl(from, to, date)  },
  ].filter(b => b.price <= maxPrice)
}
