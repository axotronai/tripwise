'use client'

import { useEffect, useState } from 'react'
import { Map, Users, Calendar, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  total_days: number
  group_size: number
  user_id: string
  travel_style: string
}

export default function AdminTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setTrips(d) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Map className="h-6 w-6 text-blue-600" /> Trips
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{loading ? 'Loading…' : `${trips.length} trips in database`}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">Could not load trips</p>
          <p className="text-red-500 text-sm mt-1">Check your Supabase configuration in .env.local</p>
        </div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Map className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-1">No trips yet</p>
          <p className="text-sm text-gray-400">Once users create trips they will appear here.</p>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Style</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell"><Users className="h-3.5 w-3.5 inline" /></th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 truncate max-w-[180px]">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.destination} · {t.total_days}d</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {format(new Date(t.start_date), 'd MMM')} – {format(new Date(t.end_date), 'd MMM yy')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell capitalize">{t.travel_style}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{t.group_size}</td>
                  <td className="px-4 py-3">
                    <Link href={`/trips/${t.id}`} target="_blank"
                      className="p-1.5 text-blue-500 hover:text-blue-700 inline-block">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
