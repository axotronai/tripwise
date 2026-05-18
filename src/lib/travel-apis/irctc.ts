/**
 * IRCTC train search via RapidAPI
 *
 * Sign up free at: https://rapidapi.com/IRCTCAPI/api/irctc1
 * Set env var:  RAPIDAPI_KEY
 * Free plan:    500 requests / month
 */

// ─── Approximate fare per km per class ───────────────────────────────────────
const FARE_PER_KM: Record<string, number> = {
  '1A':  4.5,   // First AC
  '2A':  2.8,   // Second AC
  '3A':  2.0,   // Third AC / Anubhuti
  'EC':  2.2,   // Executive Chair Car
  'CC':  1.2,   // AC Chair Car
  'SL':  0.5,   // Sleeper
  '2S':  0.4,   // Second Sitting
  'GN':  0.35,  // General
}

function estimateFare(durationHours: number, cls: string): number {
  const approxKm = durationHours * 65          // average ~65 km/h for express trains
  const rate     = FARE_PER_KM[cls] ?? 1.0
  const base     = Math.round(approxKm * rate / 5) * 5
  return Math.max(50, base)
}

/** Parse "HH:MM" or "HH:MM:SS" → minutes since midnight */
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function parseDurationHHMM(s: string): { hours: number; display: string } {
  const parts = s.split(':')
  const h     = parseInt(parts[0], 10) || 0
  const m     = parseInt(parts[1], 10) || 0
  return { hours: h + m / 60, display: `${h}h ${String(m).padStart(2, '0')}m` }
}

/** Produce an ISO datetime string for a train time on a given date, handling next-day arrivals */
function toISO(date: string, timeHHMM: string, depMins: number, arrMins: number): string {
  const d = new Date(date)
  if (arrMins < depMins) d.setDate(d.getDate() + 1) // overnight train
  const [h, m] = timeHHMM.split(':')
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
  return d.toISOString()
}

export interface TrainResult {
  id:              string
  train_name:      string
  train_number:    string
  departure:       string   // ISO datetime (for fmt() in UI)
  arrival:         string   // ISO datetime
  duration:        string   // "17h 05m"
  price:           number   // INR (estimated)
  class:           string
  available_seats: number
  run_days:        string
  train_type:      string
  book_at:         string
}

export async function searchTrains(params: {
  from: string    // IRCTC station code e.g. "NDLS"
  to:   string    // e.g. "BCT"
  date: string    // YYYY-MM-DD
}): Promise<TrainResult[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  const dateFormatted = params.date.replace(/-/g, '')   // YYYYMMDD

  const res = await fetch(
    `https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations?fromStationCode=${params.from}&toStationCode=${params.to}&dateOfJourney=${dateFormatted}`,
    {
      headers: {
        'X-RapidAPI-Key':  key,
        'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
      },
      next: { revalidate: 3_600 },
    }
  )

  if (!res.ok) return []

  const data = await res.json()
  if (!data.data?.length) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data as any[]).slice(0, 12).map((t): TrainResult => {
    const dep  = (t.from_std ?? t.from_sta ?? '00:00').substring(0, 5)
    const arr  = (t.to_std   ?? t.to_sta   ?? '00:00').substring(0, 5)
    const durStr = t.duration ?? '10:00'
    const { hours, display } = parseDurationHHMM(durStr)

    const classes: string[] = t.class_type ?? ['SL']
    const primaryClass      = classes.includes('3A') ? '3A'
                            : classes.includes('SL') ? 'SL'
                            : classes.includes('2A') ? '2A'
                            : classes[0] ?? 'SL'

    const runDays = Array.isArray(t.run_days)
      ? (t.run_days as string[]).join(', ')
      : (t.run_days ?? 'Daily')

    return {
      id:              t.train_number,
      train_name:      t.train_name,
      train_number:    t.train_number,
      departure:       toISO(params.date, dep, toMins(dep), toMins(arr)),
      arrival:         toISO(params.date, arr, toMins(dep), toMins(arr)),
      duration:        display,
      price:           estimateFare(hours, primaryClass),
      class:           primaryClass,
      available_seats: 0,     // real availability needs a separate IRCTC call
      run_days:        runDays,
      train_type:      t.train_type ?? 'Express',
      book_at:         'https://www.irctc.co.in/nget/train-search',
    }
  })
}
