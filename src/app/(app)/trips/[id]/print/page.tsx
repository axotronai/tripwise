'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { formatINR } from '@/lib/utils/trip'
import { ItineraryDay, Trip } from '@/types'

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', culture: '🎭', nature: '🌿', adventure: '🧗',
  beach: '🏖️', shopping: '🛍️', wellness: '🧘', food: '🍽️',
  transport: '🚗', accommodation: '🏨',
}

const STYLE_LABEL: Record<string, string> = {
  budget: '🎒 Budget', comfort: '🏨 Comfort', luxury: '✨ Luxury',
  adventure: '🧗 Adventure', family: '👨‍👩‍👧 Family',
}

function fmtTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hh = parseInt(h)
  const ampm = hh >= 12 ? 'PM' : 'AM'
  return `${hh % 12 || 12}:${m} ${ampm}`
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip]   = useState<Trip | null>(null)
  const [days, setDays]   = useState<ItineraryDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trips/${id}`)
      .then(r => r.json())
      .then(d => {
        setTrip(d.trip)
        setDays(d.days || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = useCallback(() => window.print(), [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Preparing your itinerary…</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Trip not found</div>
  }

  const totalActivities = days.reduce((n, d) => n + d.activities.length, 0)
  const totalCost = days.reduce((n, d) => n + d.activities.reduce((s, a) => s + (a.cost || 0), 0), 0)
  const plannedDays = days.filter(d => d.activities.length > 0).length

  return (
    <>
      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        @page {
          margin: 1.5cm;
          size: A4;
        }
      `}</style>

      {/* Print toolbar — hidden on actual print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">📄 Print Itinerary</span>
          <span className="text-sm text-gray-500">— {trip.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            ✕ Close
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg flex items-center gap-2"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-[800px] mx-auto px-8 py-10 font-[system-ui,sans-serif] text-gray-900">

        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{trip.title}</h1>
              <p className="text-lg text-gray-600">
                {trip.start_city} → {trip.destination}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-2xl font-bold text-blue-700">{trip.total_days} Days</div>
              <div className="text-sm text-gray-500">
                {format(new Date(trip.start_date), 'd MMM')} – {format(new Date(trip.end_date), 'd MMM yyyy')}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm">
            <div>
              <span className="text-gray-500">Travel style</span>
              <div className="font-semibold">{STYLE_LABEL[trip.travel_style] || trip.travel_style}</div>
            </div>
            <div>
              <span className="text-gray-500">Travellers</span>
              <div className="font-semibold">👥 {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}</div>
            </div>
            <div>
              <span className="text-gray-500">Total budget</span>
              <div className="font-semibold text-green-700">{formatINR(trip.total_budget)}</div>
            </div>
            <div>
              <span className="text-gray-500">Activities planned</span>
              <div className="font-semibold">{totalActivities} across {plannedDays} days</div>
            </div>
            {totalCost > 0 && (
              <div>
                <span className="text-gray-500">Activity costs</span>
                <div className="font-semibold text-orange-600">{formatINR(totalCost)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Day-by-day itinerary */}
        {days.map((day, idx) => (
          <div key={day.id} className={idx > 0 && idx % 3 === 0 ? 'page-break' : ''}>
            <div className="mb-6">
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  Day {day.day_number}
                </div>
                <div>
                  <span className="font-bold text-gray-900">{day.city}</span>
                  {day.date && (
                    <span className="text-gray-500 text-sm ml-2">
                      {format(new Date(day.date), 'EEEE, d MMMM yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {day.activities.length === 0 ? (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 py-2 text-gray-400 text-sm italic">
                  No activities planned yet
                </div>
              ) : (
                <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-3">
                  {day.activities
                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                    .map((act, i) => (
                      <div key={act.id || i} className="flex items-start gap-3">
                        {/* Time */}
                        <div className="shrink-0 w-20 text-xs text-gray-500 pt-0.5">
                          {act.start_time ? (
                            <>
                              {fmtTime(act.start_time)}
                              {act.end_time && <><br/>{fmtTime(act.end_time)}</>}
                            </>
                          ) : '—'}
                        </div>

                        {/* Activity */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">{TYPE_EMOJI[act.type] || '📍'}</span>
                            <span className="font-semibold text-gray-900">{act.name}</span>
                            {act.is_free ? (
                              <span className="text-xs text-green-700 font-medium">Free</span>
                            ) : act.cost && act.cost > 0 ? (
                              <span className="text-xs text-gray-600">{formatINR(act.cost)}</span>
                            ) : null}
                          </div>
                          {act.description && (
                            <p className="text-sm text-gray-600 mt-0.5 leading-snug">{act.description}</p>
                          )}
                          {act.location && (
                            <p className="text-xs text-gray-400 mt-0.5">📍 {act.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Day notes */}
              {day.notes && (
                <div className="ml-4 mt-2 pl-4 border-l-2 border-amber-200 text-xs text-amber-800 bg-amber-50 py-2 pr-3 rounded-r">
                  💡 {day.notes.replace(/\n/g, ' · ')}
                </div>
              )}
            </div>

            {idx < days.length - 1 && (
              <div className="border-t border-dashed border-gray-200 my-6" />
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-300 flex items-center justify-between text-xs text-gray-400">
          <span>Generated by TripWise · tripwise.in</span>
          <span>Printed {format(new Date(), 'd MMM yyyy')}</span>
        </div>
      </div>
    </>
  )
}
