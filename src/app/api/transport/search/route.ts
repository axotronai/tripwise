import { NextRequest, NextResponse } from 'next/server'

// Returns mock transport data — replace with Amadeus/RapidAPI in production
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const date = searchParams.get('date') || ''
  const maxPrice = parseInt(searchParams.get('maxPrice') || '10000')
  const mode = searchParams.get('mode') || 'all'

  // Mock data representing real route options
  const allOptions = {
    trains: [
      { id: 't1', train_name: 'Rajdhani Express', train_number: '12951', departure: `${date}T06:00`, arrival: `${date}T22:00`, duration: '16h', price: 1245, class: '3AC', available_seats: 24 },
      { id: 't2', train_name: 'Shatabdi Express', train_number: '12001', departure: `${date}T07:30`, arrival: `${date}T19:00`, duration: '11h 30m', price: 895, class: 'CC', available_seats: 8 },
      { id: 't3', train_name: 'Duronto Express', train_number: '12213', departure: `${date}T23:00`, arrival: `${date}T13:00`, duration: '14h', price: 1680, class: '2AC', available_seats: 15 },
    ].filter(t => t.price <= maxPrice),

    flights: [
      { id: 'f1', airline: 'IndiGo', flight_number: '6E-234', departure: `${date}T06:00`, arrival: `${date}T08:10`, duration: '2h 10m', price: 3800, stops: 0 },
      { id: 'f2', airline: 'Air India', flight_number: 'AI-852', departure: `${date}T11:30`, arrival: `${date}T13:45`, duration: '2h 15m', price: 4200, stops: 0 },
      { id: 'f3', airline: 'SpiceJet', flight_number: 'SG-191', departure: `${date}T15:00`, arrival: `${date}T18:30`, duration: '3h 30m', price: 2950, stops: 1 },
      { id: 'f4', airline: 'Vistara', flight_number: 'UK-945', departure: `${date}T20:00`, arrival: `${date}T22:10`, duration: '2h 10m', price: 5100, stops: 0 },
    ].filter(f => f.price <= maxPrice),

    buses: [
      { id: 'b1', operator: 'VRL Travels', departure: `${date}T20:00`, arrival: `${date}T08:00`, duration: '12h', price: 750, bus_type: 'Sleeper' },
      { id: 'b2', operator: 'Orange Travels', departure: `${date}T21:00`, arrival: `${date}T09:30`, duration: '12h 30m', price: 1100, bus_type: 'AC Sleeper' },
      { id: 'b3', operator: 'SRS Travels', departure: `${date}T22:30`, arrival: `${date}T11:00`, duration: '12h 30m', price: 620, bus_type: 'Non-AC' },
    ].filter(b => b.price <= maxPrice),
  }

  const result = mode === 'all' ? allOptions : { [mode + 's']: allOptions[`${mode}s` as keyof typeof allOptions] || [] }
  return NextResponse.json({ from, to, date, ...result })
}
