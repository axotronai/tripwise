'use client'

import { useState } from 'react'
import { Train, Plane, Bus, Filter, ArrowRight, Clock, ArrowUpDown, ExternalLink, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlightOption, TrainOption, BusOption } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { toast } from 'sonner'

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

function fmt(dt: string) {
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function TransportSearch({ defaultFrom = '', defaultTo = '', onAddToTrip, addedTransportIds }: Props) {
  const [from, setFrom]         = useState(defaultFrom)
  const [to, setTo]             = useState(defaultTo)
  const [date, setDate]         = useState('')
  const [maxPrice, setMaxPrice] = useState([8000])
  const [sort, setSort]         = useState<SortKey>('price')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<{ trains: TrainOption[]; flights: FlightOption[]; buses: BusOption[] } | null>(null)
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

  function sortedTrains(trains: TrainOption[]) {
    return [...trains].sort((a, b) =>
      sort === 'price' ? a.price - b.price :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    )
  }
  function sortedFlights(flights: FlightOption[]) {
    return [...flights].sort((a, b) =>
      sort === 'price' ? a.price - b.price :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    )
  }
  function sortedBuses(buses: BusOption[]) {
    return [...buses].sort((a, b) =>
      sort === 'price' ? a.price - b.price :
      sort === 'duration' ? parseDurationMins(a.duration) - parseDurationMins(b.duration) :
      a.departure.localeCompare(b.departure)
    )
  }

  async function addToTrip(t: AddedTransport, id: string) {
    if (!onAddToTrip) return
    setAddingId(id)
    try {
      await onAddToTrip(t)
    } finally {
      setAddingId(null)
    }
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
            {loading ? 'Searching all options…' : 'Compare All Options'}
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

          {/* Trains */}
          <TabsContent value="trains" className="space-y-2 mt-3">
            <SortBar />
            {sortedTrains(results.trains).length === 0
              ? <Empty icon="🚆" label="No trains under this price" />
              : sortedTrains(results.trains).map(t => (
                <Card key={t.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{t.train_name}</p>
                        <p className="text-xs text-gray-400">#{t.train_number} · {t.class}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{fmt(t.departure)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-medium">{fmt(t.arrival)}</span>
                          <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" />{t.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-blue-600 text-lg">{formatINR(t.price)}</p>
                        <Badge variant={t.available_seats < 10 ? 'destructive' : 'outline'} className="text-xs py-0">
                          {t.available_seats < 10 ? `⚠️ ${t.available_seats} left` : <><CheckCircle className="h-3 w-3 inline mr-1" />{t.available_seats} avail</>}
                        </Badge>
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(t.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(t.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === t.id || addedTransportIds?.has(t.id)}
                              onClick={() => addToTrip({ mode: 'train', operator: t.train_name, from_city: from, to_city: to, departure: t.departure, arrival: t.arrival, duration: t.duration, cost: t.price }, t.id)}>
                              {addedTransportIds?.has(t.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add to Trip</>}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1"><ExternalLink className="h-3 w-3" />IRCTC</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* Flights */}
          <TabsContent value="flights" className="space-y-2 mt-3">
            <SortBar />
            {sortedFlights(results.flights).length === 0
              ? <Empty icon="✈️" label="No flights under this price" />
              : sortedFlights(results.flights).map(f => (
                <Card key={f.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{f.airline}</p>
                        <p className="text-xs text-gray-400">{f.flight_number} · {f.stops === 0 ? <span className="text-green-600">Non-stop</span> : `${f.stops} stop`}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <span className="font-medium">{fmt(f.departure)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="font-medium">{fmt(f.arrival)}</span>
                          <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" />{f.duration}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-blue-600 text-lg">{formatINR(f.price)}</p>
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(f.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(f.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === f.id || addedTransportIds?.has(f.id)}
                              onClick={() => addToTrip({ mode: 'flight', operator: f.airline, from_city: from, to_city: to, departure: f.departure, arrival: f.arrival, duration: f.duration, cost: f.price }, f.id)}>
                              {addedTransportIds?.has(f.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add to Trip</>}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1"><ExternalLink className="h-3 w-3" />Book</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* Buses */}
          <TabsContent value="buses" className="space-y-2 mt-3">
            <SortBar />
            {sortedBuses(results.buses).length === 0
              ? <Empty icon="🚌" label="No buses under this price" />
              : sortedBuses(results.buses).map(b => (
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
                        <div className="flex gap-1 justify-end">
                          {onAddToTrip && (
                            <Button size="sm"
                              variant={addedTransportIds?.has(b.id) ? 'default' : 'outline'}
                              className={`text-xs h-7 gap-1 ${addedTransportIds?.has(b.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-400 text-green-700 hover:bg-green-50'}`}
                              disabled={addingId === b.id || addedTransportIds?.has(b.id)}
                              onClick={() => addToTrip({ mode: 'bus', operator: b.operator, from_city: from, to_city: to, departure: b.departure, arrival: b.arrival, duration: b.duration, cost: b.price }, b.id)}>
                              {addedTransportIds?.has(b.id) ? <><CheckCircle className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add to Trip</>}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1"><ExternalLink className="h-3 w-3" />Book</Button>
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

function Empty({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm">{label}</p>
    </div>
  )
}
