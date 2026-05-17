'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Train, Clock, Calendar, ExternalLink, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'BCT',  name: 'Mumbai Central' },
  { code: 'CSTM', name: 'Mumbai CST' },
  { code: 'MAS',  name: 'Chennai Central' },
  { code: 'HWH',  name: 'Howrah' },
  { code: 'SBC',  name: 'Bangalore City' },
  { code: 'HYB',  name: 'Hyderabad' },
  { code: 'ADI',  name: 'Ahmedabad' },
  { code: 'PNBE', name: 'Patna' },
  { code: 'LKO',  name: 'Lucknow' },
  { code: 'JAT',  name: 'Jammu Tawi' },
  { code: 'JP',   name: 'Jaipur' },
  { code: 'UDZ',  name: 'Udaipur' },
  { code: 'IDH',  name: 'Indore' },
  { code: 'BPL',  name: 'Bhopal' },
  { code: 'NGP',  name: 'Nagpur' },
  { code: 'VNS',  name: 'Varanasi' },
  { code: 'PRYJ', name: 'Prayagraj' },
  { code: 'GHY',  name: 'Guwahati' },
  { code: 'BBS',  name: 'Bhubaneswar' },
  { code: 'SC',   name: 'Secunderabad' },
  { code: 'COA',  name: 'Coimbatore' },
  { code: 'MDU',  name: 'Madurai' },
  { code: 'TVC',  name: 'Thiruvananthapuram' },
  { code: 'ERS',  name: 'Ernakulam' },
  { code: 'MAO',  name: 'Madgaon (Goa)' },
  { code: 'DBG',  name: 'Darbhanga' },
  { code: 'SLN',  name: 'Sultanpur' },
  { code: 'DLI',  name: 'Delhi' },
  { code: 'CNB',  name: 'Kanpur' },
]

const CLASS_PRICES: Record<string, string> = {
  '1A': '₹2,500+',
  '2A': '₹1,500+',
  '3A': '₹800+',
  'SL': '₹300+',
  '2S': '₹150+',
  'CC': '₹600+',
  'EC': '₹1,200+',
}

const TYPE_COLORS: Record<string, string> = {
  Rajdhani: 'bg-blue-100 text-blue-700',
  Shatabdi: 'bg-purple-100 text-purple-700',
  Duronto:  'bg-green-100 text-green-700',
  Express:  'bg-gray-100 text-gray-600',
  Mail:     'bg-amber-100 text-amber-700',
}

interface Train {
  number: string
  name: string
  departure: string
  arrival: string
  duration: string
  classes: string[]
  days: string
  type: string
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-28" />
      </div>
      <div className="mt-4 flex gap-8">
        <div className="h-8 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded w-8" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
      <div className="mt-4 flex gap-2">
        {[1,2,3].map(i => <div key={i} className="h-6 bg-gray-200 rounded w-12" />)}
      </div>
    </div>
  )
}

function TrainCard({ train }: { train: Train }) {
  const typeColor = TYPE_COLORS[train.type] ?? TYPE_COLORS.Express
  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-mono">{train.number}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{train.type}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">{train.name}</h3>
        </div>
        <Button
          onClick={() => window.open('https://www.irctc.co.in/nget/train-search', '_blank', 'noopener')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shrink-0"
          size="sm"
        >
          Book on IRCTC <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{train.departure}</div>
          <div className="text-xs text-gray-400 mt-0.5">Departure</div>
        </div>
        <div className="flex flex-col items-center flex-1 min-w-[80px]">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {train.duration}
          </div>
          <div className="w-full flex items-center gap-1 mt-1">
            <div className="h-0.5 flex-1 bg-gray-200 rounded" />
            <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div className="h-0.5 flex-1 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{train.arrival}</div>
          <div className="text-xs text-gray-400 mt-0.5">Arrival</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
          <Calendar className="h-3.5 w-3.5" />
          {train.days}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {train.classes.map(cls => (
            <span key={cls} className="inline-flex flex-col items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <span className="text-xs font-semibold text-gray-700">{cls}</span>
              <span className="text-[10px] text-gray-400">{CLASS_PRICES[cls] ?? '—'}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrainsContent() {
  const searchParams = useSearchParams()

  const today = new Date().toISOString().split('T')[0]

  const [from, setFrom]       = useState(searchParams.get('from') ?? '')
  const [to, setTo]           = useState(searchParams.get('to') ?? '')
  const [date, setDate]       = useState(searchParams.get('date') ?? today)
  const [trains, setTrains]   = useState<Train[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [isMock, setIsMock]   = useState(false)
  const [fetchErr, setFetchErr] = useState(false)

  const fromParam = searchParams.get('from')
  const toParam   = searchParams.get('to')
  const dateParam = searchParams.get('date')

  useEffect(() => {
    if (fromParam || toParam) {
      handleSearch(fromParam ?? '', toParam ?? '', dateParam ?? today)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(f = from, t = to, d = date) {
    if (!f || !t) return
    setLoading(true)
    setSearched(false)
    setFetchErr(false)

    const ddmmyyyy = d.split('-').reverse().join('')

    try {
      const res = await fetch(`/api/trains/search?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}&date=${ddmmyyyy}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setTrains(data.trains ?? [])
      setIsMock(data.mock ?? false)
    } catch {
      setTrains([])
      setFetchErr(true)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-1">
            <Train className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-500">Train Search</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Indian Railways</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">From Station</Label>
              <Input
                className="h-12 border-gray-200 focus-visible:ring-blue-500"
                placeholder="e.g. NDLS or New Delhi"
                value={from}
                onChange={e => setFrom(e.target.value)}
                list="train-from"
              />
              <datalist id="train-from">
                {STATIONS.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">To Station</Label>
              <Input
                className="h-12 border-gray-200 focus-visible:ring-blue-500"
                placeholder="e.g. MAO or Madgaon"
                value={to}
                onChange={e => setTo(e.target.value)}
                list="train-to"
              />
              <datalist id="train-to">
                {STATIONS.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Date of Journey</Label>
              <Input
                type="date"
                className="h-12 border-gray-200 focus-visible:ring-blue-500"
                min={today}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={() => handleSearch()}
            disabled={!from || !to || loading}
            className="mt-4 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base gap-2 shadow-md shadow-blue-200 disabled:opacity-50"
          >
            <Train className="h-4 w-4" />
            Search Trains
          </Button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Train data powered by eRail.in · Booking on IRCTC (official)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {fetchErr && searched && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not fetch train data. Please try again or search directly on IRCTC.
          </div>
        )}

        {isMock && searched && !fetchErr && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Showing sample trains — live data coming soon. Book on IRCTC for real availability.
          </div>
        )}

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && searched && trains.length === 0 && (
          <div className="text-center py-16">
            <Train className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">No direct trains found</p>
            <p className="text-sm text-gray-400 mb-6">Try searching on IRCTC directly for all available options</p>
            <Button
              onClick={() => window.open('https://www.irctc.co.in/nget/train-search', '_blank', 'noopener')}
              variant="outline"
              className="gap-2"
            >
              Search on IRCTC <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!loading && trains.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{trains.length} train{trains.length !== 1 ? 's' : ''} found</p>
              <Badge variant="outline" className="text-xs">
                {isMock ? 'Sample data' : 'Live data'}
              </Badge>
            </div>
            {trains.map(train => (
              <TrainCard key={train.number} train={train} />
            ))}
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-16 text-gray-400">
            <Train className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Enter stations above and search to see available trains</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrainsPage() {
  return (
    <Suspense>
      <TrainsContent />
    </Suspense>
  )
}
