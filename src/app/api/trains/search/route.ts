import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  const date = searchParams.get('date') // DDMMYYYY format

  const key = process.env.ERAIL_API_KEY

  if (!key) {
    return NextResponse.json({ trains: getMockTrains(from, to), mock: true })
  }

  try {
    const res = await fetch(
      `https://api.erail.in/trains/?stnFrom=${from}&stnTo=${to}&date=${date}&time=0000&ttype=AD&key=${key}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    return NextResponse.json({ trains: data, mock: false })
  } catch {
    return NextResponse.json({ trains: getMockTrains(from, to), mock: true })
  }
}

function getMockTrains(from: string | null, to: string | null) {
  void from
  void to
  return [
    { number: '12301', name: 'Rajdhani Express', departure: '16:55', arrival: '10:00', duration: '17h 05m', classes: ['1A','2A','3A'], days: 'Daily', type: 'Rajdhani' },
    { number: '12259', name: 'Duronto Express', departure: '20:30', arrival: '13:45', duration: '17h 15m', classes: ['2A','3A','SL'], days: 'Tue, Fri, Sun', type: 'Duronto' },
    { number: '12953', name: 'August Kranti Rajdhani', departure: '17:40', arrival: '10:55', duration: '17h 15m', classes: ['1A','2A','3A'], days: 'Daily', type: 'Rajdhani' },
    { number: '19019', name: 'Mumbai Bandra Express', departure: '22:30', arrival: '18:00', duration: '19h 30m', classes: ['3A','SL','2S'], days: 'Daily', type: 'Express' },
    { number: '22209', name: 'Mumbai Central Duronto', departure: '23:00', arrival: '14:30', duration: '15h 30m', classes: ['2A','3A'], days: 'Mon, Wed, Sat', type: 'Duronto' },
  ]
}
