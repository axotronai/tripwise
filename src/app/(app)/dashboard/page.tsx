'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, MapPin, Calendar, Users, IndianRupee, Trash2, Sparkles, TrendingUp, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trip } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { toast } from 'sonner'

const STYLE_EMOJI: Record<string, string> = {
  budget: '🎒', comfort: '🏨', luxury: '✨', adventure: '🧗', family: '👨‍👩‍👧',
}
const DEST_GRADIENT: Record<string, string> = {
  'Goa': 'from-cyan-400 to-blue-500', 'Manali': 'from-blue-400 to-indigo-600',
  'Jaipur': 'from-orange-400 to-pink-500', 'Kerala': 'from-green-400 to-emerald-600',
  'Ladakh': 'from-indigo-400 to-purple-600', 'Andaman': 'from-teal-400 to-cyan-600',
}
const DEFAULT_GRADIENT = 'from-blue-400 to-indigo-600'

function tripStatus(trip: Trip) {
  const start = new Date(trip.start_date)
  const end   = new Date(trip.end_date)
  if (isToday(start) || (isPast(start) && isFuture(end))) return { label: 'Ongoing', color: 'bg-green-100 text-green-700 border-green-200' }
  if (isPast(end))   return { label: 'Past',    color: 'bg-gray-100 text-gray-500 border-gray-200' }
  return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200' }
}

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips]       = useState<Trip[]>([])
  const [loading, setLoading]   = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => {
        if (r.status === 401) { router.push('/login?next=/dashboard'); return null }
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(d => { if (d && Array.isArray(d)) setTrips(d) })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [router])

  async function deleteTrip(id: string) {
    await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    setTrips(prev => prev.filter(t => t.id !== id))
    toast.success('Trip deleted')
  }

  async function duplicateTrip(id: string) {
    setDuplicating(id)
    try {
      const res = await fetch(`/api/trips/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { id: newId } = await res.json()
      toast.success('Trip duplicated!')
      router.push(`/trips/${newId}`)
    } catch {
      toast.error('Could not duplicate trip — try again')
    } finally {
      setDuplicating(null)
    }
  }

  const upcoming = trips.filter(t => isFuture(new Date(t.start_date)))
  const ongoing  = trips.filter(t => {
    const s = new Date(t.start_date), e = new Date(t.end_date)
    return (isToday(s) || isPast(s)) && isFuture(e)
  })
  const past = trips.filter(t => isPast(new Date(t.end_date)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{trips.length} trip{trips.length !== 1 ? 's' : ''} · {upcoming.length} upcoming</p>
        </div>
        <Link href="/trips/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {trips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total trips',    value: trips.length,                            icon: MapPin },
            { label: 'Upcoming',       value: upcoming.length,                         icon: Calendar },
            { label: 'Total budget',   value: formatINR(trips.reduce((s,t) => s+t.total_budget, 0)), icon: IndianRupee },
            { label: 'Days planned',   value: trips.reduce((s,t) => s+t.total_days, 0) + 'd', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg"><Icon className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {fetchError && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Could not load your trips</p>
          <p className="text-red-500 text-sm mb-4">Check your connection and try again</p>
          <button onClick={() => { setFetchError(false); setLoading(true); fetch('/api/trips').then(r => r.json()).then(d => { if (Array.isArray(d)) setTrips(d) }).catch(() => setFetchError(true)).finally(() => setLoading(false)) }}
            className="text-sm text-red-700 underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && trips.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Start by entering your destination and let AI build your perfect India itinerary — free.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/trips/new">
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" /> Plan First Trip
              </Button>
            </Link>
            <Link href="/trips/new?destination=Goa">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Try Goa Trip
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Trip grid */}
      {!loading && trips.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map(trip => {
            const status   = tripStatus(trip)
            const gradient = DEST_GRADIENT[trip.destination] || DEFAULT_GRADIENT
            return (
              <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group border-0 shadow-sm">
                {/* Gradient banner */}
                <div className={`h-20 bg-gradient-to-r ${gradient} flex items-end p-3 relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative flex items-center justify-between w-full">
                    <h3 className="font-bold text-white text-lg leading-tight">{trip.destination}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl">{STYLE_EMOJI[trip.travel_style] || '🏨'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{trip.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{trip.start_city} → {trip.destination}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{format(new Date(trip.start_date), 'd MMM')} – {format(new Date(trip.end_date), 'd MMM')}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" />{trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}</span>
                    <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5 text-gray-400" />{formatINR(trip.total_budget)}</span>
                    <span className="flex items-center gap-1 text-blue-600 font-medium"><Badge variant="outline" className="text-xs py-0">{trip.total_days}d trip</Badge></span>
                  </div>

                  {/* Planning progress — based on days that have at least 1 activity */}
                  {(() => {
                    const filledDays  = (trip.days || []).filter(d => d.activities && d.activities.length > 0).length
                    const pct         = trip.total_days > 0 ? Math.round((filledDays / trip.total_days) * 100) : 0
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Planning progress</span>
                          <span>{filledDays}/{trip.total_days} days</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )
                  })()}

                  <div className="flex gap-2 pt-1">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                        Open Trip
                      </Button>
                    </Link>
                    <Button
                      variant="ghost" size="sm"
                      className="px-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Duplicate trip"
                      disabled={duplicating === trip.id}
                      onClick={() => duplicateTrip(trip.id)}
                    >
                      {duplicating === trip.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteTrip(trip.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
