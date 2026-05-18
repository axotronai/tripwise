'use client'

import { useState } from 'react'
import { Train, Plane, Bus, Filter, ArrowRight, Clock, ArrowUpDown, ExternalLink, CheckCircle, Plus } from 'lucide-react'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge }     from '@/components/ui/badge'
import { Slider }    from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlightOption, TrainOption, BusOption } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { toast }     from 'sonner'

type SortKey = 'price' | 'duration' | 'departure'

export interface AddedTransport {
  mode: 'train' | 'flight' | 'bus'
  operator: string
  from_city: string
  to_city: string
  departure: string
  arrival: string
  duration: string
  cost: number
}

function parseDurationMins(d: string) {
  const h = parseInt(d.match(/(\d+)h/)?.[1] || '0')
  const m = parseInt(d.match(/(\d+)m/)?.[1] || '0')
  return h * 60 + m
}

interface Props {
  defaultFrom?: string
  defaultTo?: string
  onAddToTrip?: (t: AddedTransport) => void
  addedTransportIds?: Set<string>
}

// Extended local types with extra real-API fields
interface ExtTrainOption  extends TrainOption  { run_days?: string; train_type?: string; book_at?: string }
interface ExtFlightOption extends FlightOption { airline_code?: string; book_at?: string }
interface ExtBusOption    extends BusOption    { book_at?: string }

type Sources = { flights?: string; trains?: string; buses?: string }

function fmt(dt: string) {
  // Handles both ISO datetime and plain HH:MM strings
  const d = new Date(dt)
  if (isNaN(d.getTime())) return dt.substring(0, 5)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function SourceBadge({ source }: { source?: string }) {
  if (!source || source === 'mock')       return <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">⚠️ Sample</span>
  if (source === 'amadeus')               return <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">🟢 Live · Amadeus</span>
  if (source === 'irctc')                 return <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">🟢 Live · IRCTC</span>
  if (source === 'redbus_link')           return <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">🔗 Book via RedBus</span>
  if (source === 'no_results')            return <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">— No direct route</span>
  return null
}

export default function TransportSearch({ defaultFrom = '', defaultTo = '', onAddToTrip, addedTransportIds }: Props) {
  const [from, setFrom]         = useState(defaultFrom)
  const [to, setTo]             = useState(defaultTo)
  const [date, setDate]         = useState('')
  const [maxPrice, setMaxPrice] = useState([8000])
  const [sort, setSort]         = useState<SortKey>('price')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<{ trains: ExtTrainOption[]; flights: ExtFlightOption[]; buses: ExtBusOption[]; sources?: Sources } | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  async function search() {
    if (!from || !to || !date) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/transport/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&maxPrice=${maxPrice[0]}`)
      if (!res.ok) throw new Error('Search failed')
      setResults(await res.json())
    } catch { toast.error('Search failed — please try again') }
    finally { setLoading(false) }
  }

  const sorted = {
    trains:  (arr: ExtTrainOption[]) => [...arr].sort((a, b) =>
      sort === 'price'    ? a.price    - b.price    :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    ),
    flights: (arr: ExtFlightOption[]) => [...arr].sort((a, b) =>
      sort === 'price'    ? a.price    - b.price    :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    ),
    buses:   (arr: ExtBusOption[]) => [...arr].sort((a, b) =>
      sort === 'price'    ? a.price    - b.price    :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    ),
  }

  async function addToTrip(t: AddedTransport, id: string) {
    if (!onAddToTrip) return
    setAddingId(id)
    try { await onAddToTrip(t) } finally { setAddingId(null) }
  }

  const SortBar = () => (
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
      <ArrowUpDown className="h-3.5 w-3.5" />
      <span>Sort:</span>
      {(['price','duration','departure'] as SortKey[]).map(k => (
        <button key={k} onClick={() => setSort(k)}
          className={`px-2 py-0.5 rounded-full capitalize transition-colors ${sort===k ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}>
          {k}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input placeholder="Delhi, Mumbai…" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input placeholder="Goa, Manali…" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-gray-500"><Filter className="h-3 w-3" /> Max Price</span>
              <span className="font-medium text-blue-600">{formatINR(maxPrice[0])}</span>
            </div>
            <Slider min={500} max={15000} step={250} value={maxPrice} onValueChange={v => setMaxPrice(v as number[])} />
            <div className="flex justify-between text-xs text-gray-400"><span>₹500</span><span>₹15,000</span></div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={search} disabled={loading}>
            {loading ? 'Searching live data…' : 'Compare All Options'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Tabs defaultValue="trains">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="trains"  className="gap-1.5 text-xs"><Train  className="h-3.5 w-3.5" /> Trains ({results.trains.length})</TabsTrigger>
            <TabsTrigger value="flights" className="gap-1.5 text-xs"><Plane  className="h-3.5 w-3.5" /> Flights ({results.flights.length})</TabsTrigger>
            <TabsTrigger value="buses"   className="gap-1.5 text-xs"><Bus    className="h-3.5 w-3.5" /> Buses ({results.buses.length})</TabsTrigger>
          </TabsList>

          {/* ── Trains ─────────────────────────────────────────────────────── */}
          <TabsContent value="trains" className="space-y-2 mt-3">
            <div className="flex items-center justify-between mb-1">
              <SortBar />
              <SourceBadge source={results.sources?.trains} />
            </div>
            {sorted.trains(results.trains).length === 0
              ? <Empty icon="🚆" label="No trains found for this route" sub="Try road transport or check IRCTC directly" />
              : sorted.trains(results.trains).map(t => (
                <Card key={t.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">{t.train_name}</p>
                          {(t as ExtTrainOption).train_type && (
                            <Badge variant="outline" className="text-xs py-0 shrink-0">{(t as ExtTrainOption).train_type}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">#{t.train_number} · {t.class}
                          {(t as ExtTrainOption).run_days && <span className="ml-1 text-gray-400">· {(t as ExtTrainOption).run_days}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{fmt(t.departure)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-medium">{fmt(t.arrival)}</span>
                          <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" />{t.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-blue-600 text-lg">{formatINR(t.price)}</p>
                        <p className="text-xs text-gray-400">est./person</p>
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(t.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(t.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === t.id || addedTransportIds?.has(t.id)}
                              onClick={() => addToTrip({ mode: 'train', operator: t.train_name, from_city: from, to_city: to, departure: t.departure, arrival: t.arrival, duration: t.duration, cost: t.price }, t.id)}>
                              {addedTransportIds?.has(t.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add</>}
                            </Button>
                          )}
                          <a href={(t as ExtTrainOption).book_at || 'https://www.irctc.co.in/nget/train-search'} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs h-7 px-2 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                            <ExternalLink className="h-3 w-3" />IRCTC
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* ── Flights ────────────────────────────────────────────────────── */}
          <TabsContent value="flights" className="space-y-2 mt-3">
            <div className="flex items-center justify-between mb-1">
              <SortBar />
              <SourceBadge source={results.sources?.flights} />
            </div>
            {sorted.flights(results.flights).length === 0
              ? <Empty icon="✈️" label="No flights found for this route" sub="This city may not have an airport — try trains or road" />
              : sorted.flights(results.flights).map(f => (
                <Card key={f.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{f.airline}</p>
                        <p className="text-xs text-gray-400">{f.flight_number} · {f.stops === 0 ? <span className="text-green-600">Non-stop ✓</span> : `${f.stops} stop`}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{fmt(f.departure)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-medium">{fmt(f.arrival)}</span>
                          <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" />{f.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-blue-600 text-lg">{formatINR(f.price)}</p>
                        <p className="text-xs text-gray-400">per person</p>
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(f.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(f.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === f.id || addedTransportIds?.has(f.id)}
                              onClick={() => addToTrip({ mode: 'flight', operator: f.airline, from_city: from, to_city: to, departure: f.departure, arrival: f.arrival, duration: f.duration, cost: f.price }, f.id)}>
                              {addedTransportIds?.has(f.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add</>}
                            </Button>
                          )}
                          <a href={(f as ExtFlightOption).book_at || 'https://www.makemytrip.com/flights/'} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs h-7 px-2 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                            <ExternalLink className="h-3 w-3" />Book
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* ── Buses ──────────────────────────────────────────────────────── */}
          <TabsContent value="buses" className="space-y-2 mt-3">
            <div className="flex items-center justify-between mb-1">
              <SortBar />
              <SourceBadge source={results.sources?.buses} />
            </div>
            {sorted.buses(results.buses).length === 0
              ? <Empty icon="🚌" label="No buses within this budget" sub="Try increasing max price" />
              : sorted.buses(results.buses).map(b => (
                <Card key={b.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{b.operator}</p>
                        <p className="text-xs text-gray-400">{b.bus_type}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{fmt(b.departure)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-medium">{fmt(b.arrival)}</span>
                          <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" />{b.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-blue-600 text-lg">{formatINR(b.price)}</p>
                        <p className="text-xs text-gray-400">est.</p>
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(b.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(b.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === b.id || addedTransportIds?.has(b.id)}
                              onClick={() => addToTrip({ mode: 'bus', operator: b.operator, from_city: from, to_city: to, departure: b.departure, arrival: b.arrival, duration: b.duration, cost: b.price }, b.id)}>
                              {addedTransportIds?.has(b.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add</>}
                            </Button>
                          )}
                          <a href={(b as ExtBusOption).book_at || 'https://www.redbus.in'} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs h-7 px-2 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                            <ExternalLink className="h-3 w-3" />RedBus
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function Empty({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  )
}
