'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Calendar, Users, IndianRupee, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trip } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STYLE_EMOJI: Record<string, string> = {
  budget: '🎒', comfort: '🏨', luxury: '✨', adventure: '🧗', family: '👨‍👩‍👧',
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTrips(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function deleteTrip(id: string) {
    await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    setTrips(trips.filter(t => t.id !== id))
    toast.success('Trip deleted')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
        </div>
        <Link href="/trips/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h3>
          <p className="text-gray-500 mb-6">Plan your first India trip — it's free!</p>
          <Link href="/trips/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="h-4 w-4" /> Plan My First Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-all group border-0 shadow-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.start_city} → {trip.destination}
                    </div>
                  </div>
                  <span className="text-2xl">{STYLE_EMOJI[trip.travel_style] || '🏨'}</span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {format(new Date(trip.start_date), 'd MMM')} – {format(new Date(trip.end_date), 'd MMM yyyy')}
                    <Badge variant="outline" className="text-xs ml-auto">{trip.total_days}d</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                    {formatINR(trip.total_budget)} total budget
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/trips/${trip.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                      Open Trip
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                    onClick={() => deleteTrip(trip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
