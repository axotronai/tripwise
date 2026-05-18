import { NextRequest, NextResponse } from 'next/server'
import { searchTrains }   from '@/lib/travel-apis/irctc'
import { getIRCTCCode }   from '@/lib/travel-apis/city-codes'

/**
 * GET /api/trains/search?from=Delhi&to=Mumbai&date=2024-01-15
 *
 * Uses RapidAPI IRCTC when RAPIDAPI_KEY is set, otherwise returns mock data.
 * Accepts city names OR raw station codes (NDLS, BCT, etc.)
 */
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const from = sp.get('from') || ''
  const to   = sp.get('to')   || ''
  const date = sp.get('date') || new Date().toISOString().split('T')[0]

  // Resolve city names → IRCTC codes (or pass through if already a code)
  const fromCode = getIRCTCCode(from) ?? from.toUpperCase()
  const toCode   = getIRCTCCode(to)   ?? to.toUpperCase()

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ trains: getMockTrains(date), mock: true, source: 'mock' })
  }

  try {
    const trains = await searchTrains({ from: fromCode, to: toCode, date })
    if (trains.length === 0) {
      return NextResponse.json({ trains: getMockTrains(date), mock: true, source: 'no_results' })
    }
    return NextResponse.json({ trains, mock: false, source: 'irctc' })
  } catch (err) {
    console.error('Train search error:', err)
    return NextResponse.json({ trains: getMockTrains(date), mock: true, source: 'error' })
  }
}

function getMockTrains(date: string) {
  const nd = new Date(new Date(date).getTime() + 86_400_000).toISOString().split('T')[0]
  return [
    { number: '12301', name: 'Howrah Rajdhani',        departure: `${date}T16:55:00`, arrival: `${nd}T09:55:00`, duration: '17h 00m', classes: ['1A','2A','3A'], days: 'Daily',             type: 'Rajdhani' },
    { number: '12259', name: 'Duronto Express',         departure: `${date}T20:30:00`, arrival: `${nd}T13:45:00`, duration: '17h 15m', classes: ['2A','3A','SL'], days: 'Tue, Fri, Sun',     type: 'Duronto'  },
    { number: '12953', name: 'August Kranti Rajdhani',  departure: `${date}T17:40:00`, arrival: `${nd}T10:55:00`, duration: '17h 15m', classes: ['1A','2A','3A'], days: 'Daily',             type: 'Rajdhani' },
    { number: '19019', name: 'Mumbai Bandra Express',   departure: `${date}T22:30:00`, arrival: `${nd}T18:00:00`, duration: '19h 30m', classes: ['3A','SL','2S'], days: 'Daily',             type: 'Express'  },
    { number: '22209', name: 'Mumbai Central Duronto',  departure: `${date}T23:00:00`, arrival: `${nd}T14:30:00`, duration: '15h 30m', classes: ['2A','3A'],      days: 'Mon, Wed, Sat',     type: 'Duronto'  },
  ]
}
