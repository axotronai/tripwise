'use client'

import { useState } from 'react'
import { Train, Plane, Bus, Filter, ArrowRight, Clock, IndianRupee } from 'lucide-react'
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

interface Props {
  defaultFrom?: string
  defaultTo?: string
}

export default function TransportSearch({ defaultFrom = '', defaultTo = '' }: Props) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [date, setDate] = useState('')
  const [maxPrice, setMaxPrice] = useState([8000])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ trains: TrainOption[]; flights: FlightOption[]; buses: BusOption[] } | null>(null)

  async function search() {
    if (!from || !to || !date) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/transport/search?from=${from}&to=${to}&date=${date}&maxPrice=${maxPrice[0]}`)
      const data = await res.json()
      setResults(data)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input placeholder="Delhi, Mumbai..." value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input placeholder="Goa, Manali..." value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-gray-500"><Filter className="h-3 w-3" /> Max Price</span>
              <span className="font-medium text-blue-600">{formatINR(maxPrice[0])}</span>
            </div>
            <Slider min={500} max={15000} step={250} value={maxPrice} onValueChange={(v) => setMaxPrice(v as number[])} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>₹500</span><span>₹15,000</span>
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={search} disabled={loading}>
            {loading ? 'Searching...' : 'Search All Options'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Tabs defaultValue="trains">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="trains" className="gap-1.5 text-xs">
              <Train className="h-3.5 w-3.5" /> Trains ({results.trains.length})
            </TabsTrigger>
            <TabsTrigger value="flights" className="gap-1.5 text-xs">
              <Plane className="h-3.5 w-3.5" /> Flights ({results.flights.length})
            </TabsTrigger>
            <TabsTrigger value="buses" className="gap-1.5 text-xs">
              <Bus className="h-3.5 w-3.5" /> Buses ({results.buses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trains" className="space-y-2 mt-3">
            {results.trains.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No trains found under {formatINR(maxPrice[0])}</p>}
            {results.trains.map((t) => (
              <Card key={t.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{t.train_name}</p>
                      <p className="text-xs text-gray-500">#{t.train_number} · {t.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatINR(t.price)}</p>
                      <Badge variant={t.available_seats < 10 ? 'destructive' : 'outline'} className="text-xs py-0">
                        {t.available_seats} seats
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <span>{new Date(t.departure).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{new Date(t.arrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{t.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="flights" className="space-y-2 mt-3">
            {results.flights.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No flights found under {formatINR(maxPrice[0])}</p>}
            {results.flights.map((f) => (
              <Card key={f.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{f.airline}</p>
                      <p className="text-xs text-gray-500">{f.flight_number} · {f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}</p>
                    </div>
                    <p className="font-bold text-blue-600">{formatINR(f.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <span>{new Date(f.departure).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{new Date(f.arrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{f.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="buses" className="space-y-2 mt-3">
            {results.buses.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No buses found under {formatINR(maxPrice[0])}</p>}
            {results.buses.map((b) => (
              <Card key={b.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{b.operator}</p>
                      <p className="text-xs text-gray-500">{b.bus_type}</p>
                    </div>
                    <p className="font-bold text-blue-600">{formatINR(b.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <span>{new Date(b.departure).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{new Date(b.arrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{b.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
