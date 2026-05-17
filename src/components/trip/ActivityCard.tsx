'use client'

import { useState, useEffect } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Clock, MapPin, IndianRupee, Trash2, GripVertical, Pencil, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import EditActivityModal from './EditActivityModal'

const TYPE_COLORS: Record<string, string> = {
  sightseeing: 'bg-blue-100 text-blue-700',
  food:        'bg-orange-100 text-orange-700',
  adventure:   'bg-red-100 text-red-700',
  culture:     'bg-purple-100 text-purple-700',
  beach:       'bg-cyan-100 text-cyan-700',
  shopping:    'bg-pink-100 text-pink-700',
  rest:        'bg-gray-100 text-gray-600',
  nature:      'bg-green-100 text-green-700',
  wellness:    'bg-teal-100 text-teal-700',
  departure:   'bg-gray-100 text-gray-500',
}

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  beach: '🏖️', shopping: '🛍️', rest: '😴', nature: '🌿',
  wellness: '🧘', departure: '🛫',
}

interface Alternative {
  name: string
  description: string
  location?: string
  cost: number
  is_free: boolean
  type: string
  reason: string
}

interface Props {
  activity: Activity
  index: number
  destination: string
  startDate?: string
  budget?: number
  travelStyle?: string
  onDelete: (id: string) => void
  onEdit: (activity: Activity) => void
  onReplace: (activity: Activity) => void
}

export default function ActivityCard({ activity, index, destination, startDate, budget, travelStyle, onDelete, onEdit, onReplace }: Props) {
  const [showEdit, setShowEdit]               = useState(false)
  const [showAlt, setShowAlt]                 = useState(false)
  const [alternatives, setAlternatives]       = useState<Alternative[]>([])
  const [loadingAlt, setLoadingAlt]           = useState(false)
  const [editingPrice, setEditingPrice]       = useState(false)
  const [priceInput, setPriceInput]           = useState(activity.cost)

  useEffect(() => { if (!editingPrice) setPriceInput(activity.cost) }, [activity.cost, editingPrice])

  async function suggestAlternative() {
    if (showAlt) { setShowAlt(false); return }
    setShowAlt(true)
    if (alternatives.length > 0) return
    setLoadingAlt(true)
    try {
      const res = await fetch('/api/ai/suggest-alternative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          activity: { name: activity.name, type: activity.type, cost: activity.cost, location: activity.location },
          start_date: startDate,
          budget,
          travel_style: travelStyle,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAlternatives(data.alternatives || [])
    } catch {
      setAlternatives([])
    } finally {
      setLoadingAlt(false)
    }
  }

  function mapsUrl() {
    const query = activity.location
      ? `${activity.location}, ${destination}`
      : `${activity.name}, ${destination}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  function commitPrice() {
    const cost = Math.max(0, priceInput)
    onEdit({ ...activity, cost, is_free: cost === 0 })
    setEditingPrice(false)
  }

  function pickAlternative(alt: Alternative) {
    onReplace({
      ...activity,
      name: alt.name,
      description: alt.description,
      cost: alt.cost,
      is_free: alt.is_free,
      type: alt.type as Activity['type'],
    })
    setShowAlt(false)
    setAlternatives([])
  }

  return (
    <Draggable draggableId={activity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white rounded-xl border transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-1 border-blue-300' : 'hover:shadow-sm'
          }`}
        >
          <div className="p-3 flex gap-3 group">
            <div {...provided.dragHandleProps} className="flex items-center text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="text-xl shrink-0">{TYPE_EMOJI[activity.type] || '📍'}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight">{activity.name}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowEdit(true)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-purple-400 hover:text-purple-600 hover:bg-purple-50"
                    onClick={suggestAlternative} title="Suggest alternative">
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(activity.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {activity.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.description}</p>
              )}

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {activity.start_time} – {activity.end_time}
                </div>
                <a
                  href={mapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                  title="Open in Google Maps"
                >
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[110px]">
                    {activity.location || 'View on Maps'}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
                <div className="flex items-center gap-1 text-xs">
                  {activity.is_free ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 text-xs py-0">Free</Badge>
                  ) : editingPrice ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <IndianRupee className="h-3 w-3 text-gray-500" />
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={priceInput}
                        onChange={e => setPriceInput(parseInt(e.target.value) || 0)}
                        onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') setEditingPrice(false) }}
                        onBlur={commitPrice}
                        className="w-20 border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setPriceInput(activity.cost); setEditingPrice(true) }}
                      className="flex items-center gap-0.5 text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                      title="Click to edit price"
                    >
                      <IndianRupee className="h-3 w-3" />{formatINR(activity.cost).replace('₹', '')}
                    </button>
                  )}
                </div>
                <Badge className={`text-xs py-0 ${TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-600'}`}>
                  {activity.type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Alternatives panel */}
          {showAlt && (
            <div className="border-t border-purple-100 bg-purple-50/60 px-3 py-2.5 rounded-b-xl">
              <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Alternatives
              </p>
              {loadingAlt ? (
                <div className="flex items-center gap-2 text-xs text-purple-500 py-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Finding alternatives…
                </div>
              ) : alternatives.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">No alternatives found — try again.</p>
              ) : (
                <div className="space-y-1.5">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors">
                      <button onClick={() => pickAlternative(alt)} className="w-full text-left px-3 pt-2 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-900">{alt.name}</span>
                          <span className="text-xs text-purple-600 font-medium shrink-0">
                            {alt.is_free ? 'Free' : formatINR(alt.cost)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alt.reason}</p>
                      </button>
                      <div className="px-3 pb-2 flex items-center gap-3">
                        {alt.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />{alt.location}
                          </span>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alt.location ? `${alt.location}` : `${alt.name}, ${destination}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                        >
                          Maps <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <EditActivityModal
            activity={activity}
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSave={onEdit}
          />
        </div>
      )}
    </Draggable>
  )
}
