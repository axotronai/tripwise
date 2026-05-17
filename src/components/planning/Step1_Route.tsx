'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, ArrowDown, Train, Plane, Bus, Car, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatINR } from '@/lib/utils/trip'
import { TripLeg, WizardTransport } from './types'
import { toast } from 'sonner'

const MODE_ICON: Record<string, React.ReactNode> = {
  train:  <Train  className="h-4 w-4" />,
  flight: <Plane  className="h-4 w-4" />,
  bus:    <Bus    className="h-4 w-4" />,
  cab:    <Car    className="h-4 w-4" />,
}
const MODE_COLOR: Record<string, string> = {
  train:  'text-blue-600 bg-blue-50 border-blue-200',
  flight: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  bus:    'text-green-600 bg-green-50 border-green-200',
  cab:    'text-orange-600 bg-orange-50 border-orange-200',
}
const MODE_LABEL: Record<string, string> = { train: 'Train', flight: 'Flight', bus: 'Bus', cab: 'Cab' }

interface TransportOptionsProps {
  leg: TripLeg
  options: WizardTransport[]
  selected: WizardTransport | null
  onSelect: (t: WizardTransport) => void
  onRefresh: () => void
  loading: boolean
  groupSize: number
}

function TransportOptions({ leg, options, selected, onSelect, onRefresh, loading, groupSize }: TransportOptionsProps) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {leg.from} → {leg.to}
        </p>
        <button onClick={onRefresh} disabled={loading} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding best routes…
        </div>
      ) : options.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No options found — try refreshing</p>
      ) : (
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isSelected = selected?.name === opt.name && selected?.departure === opt.departure
            const totalCost  = opt.cost_per_person * groupSize
            return (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${MODE_COLOR[opt.mode]}`}>
                      {MODE_ICON[opt.mode]} {MODE_LABEL[opt.mode]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{opt.name}</span>
                    {opt.number && <span className="text-xs text-gray-400">#{opt.number}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">{formatINR(totalCost)}</div>
                    {groupSize > 1 && <div className="text-xs text-gray-400">{formatINR(opt.cost_per_person)}/person</div>}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                  <span className="font-medium">{opt.departure}</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-medium">{opt.arrival}</span>
                  <span className="text-gray-400">({opt.duration})</span>
                  {opt.class && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{opt.class}</span>}
                </div>

                {opt.highlights && (
                  <p className="text-xs text-gray-500 mt-1">✨ {opt.highlights}</p>
                )}

                {isSelected && opt.book_at && (
                  <a
                    href={`https://${opt.book_at}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Book on {opt.book_at} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface Props {
  startCity: string
  legs: TripLeg[]
  startDate: string
  travelStyle: string
  groupSize: number
  onChange: (legs: TripLeg[]) => void
}

export default function Step1_Route({ startCity, legs, startDate, travelStyle, groupSize, onChange }: Props) {
  const [transportOptions, setTransportOptions] = useState<Record<string, WizardTransport[]>>({})
  const [openLeg, setOpenLeg] = useState<string | null>(null)

  function addLeg() {
    const lastCity = legs.length > 0 ? legs[legs.length - 1].to : startCity
    const newLeg: TripLeg = {
      id: `leg-${Date.now()}`,
      from: lastCity,
      to: '',
      nights: 2,
      transport: null,
      loadingTransport: false,
    }
    onChange([...legs, newLeg])
    setOpenLeg(newLeg.id)
  }

  function removeLeg(id: string) {
    const updated = legs.filter(l => l.id !== id)
    // Fix chain: each leg.from = previous leg.to (or startCity)
    updated.forEach((leg, i) => {
      leg.from = i === 0 ? startCity : updated[i - 1].to
    })
    onChange(updated)
  }

  function updateLeg(id: string, patch: Partial<TripLeg>) {
    onChange(legs.map(l => l.id === id ? { ...l, ...patch } : l))
    // If city changed, re-chain subsequent legs
    if (patch.to !== undefined) {
      const idx = legs.findIndex(l => l.id === id)
      const updated = [...legs]
      updated[idx] = { ...updated[idx], ...patch }
      for (let i = idx + 1; i < updated.length; i++) {
        updated[i] = { ...updated[i], from: updated[i - 1].to }
      }
      onChange(updated)
    }
  }

  function computeLegDate(legIndex: number): string {
    const d = new Date(startDate)
    let offset = 0
    for (let i = 0; i < legIndex; i++) offset += legs[i].nights
    d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  }

  async function fetchTransport(leg: TripLeg, legIndex: number) {
    if (!leg.to) { toast.error('Enter destination city first'); return }
    updateLeg(leg.id, { loadingTransport: true })
    setOpenLeg(leg.id)
    try {
      const res = await fetch('/api/ai/suggest-transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: leg.from, to: leg.to,
          date: computeLegDate(legIndex),
          travel_style: travelStyle,
          group_size: groupSize,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransportOptions(prev => ({ ...prev, [leg.id]: data.options || [] }))
    } catch {
      toast.error(`Could not fetch transport for ${leg.from} → ${leg.to}`)
    } finally {
      updateLeg(leg.id, { loadingTransport: false })
    }
  }

  // Total nights and transport cost
  const totalNights = legs.reduce((s, l) => s + l.nights, 0)
  const transportCost = legs.reduce((s, l) => s + (l.transport ? l.transport.cost_per_person * groupSize : 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Plan Your Route</h2>
        <p className="text-sm text-gray-500 mt-0.5">Add destinations and choose how to get between them</p>
      </div>

      {/* Route visual */}
      <div className="space-y-1">
        {/* Start */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">🏠</div>
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <p className="text-xs text-blue-500 font-medium">Starting point</p>
            <p className="font-semibold text-gray-900">{startCity}</p>
          </div>
        </div>

        {/* Legs */}
        {legs.map((leg, idx) => (
          <div key={leg.id} className="space-y-1">
            {/* Transport connector */}
            <div className="flex items-center gap-3 pl-3.5">
              <div className="w-1 h-4 bg-gray-200 rounded-full mx-auto" style={{ marginLeft: '13px' }} />
              <button
                onClick={() => fetchTransport(leg, idx)}
                disabled={leg.loadingTransport || !leg.to}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  leg.transport
                    ? MODE_COLOR[leg.transport.mode]
                    : 'border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                } disabled:opacity-50`}
              >
                {leg.loadingTransport
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Finding…</>
                  : leg.transport
                    ? <>{MODE_ICON[leg.transport.mode]} {leg.transport.name} · {leg.transport.duration}</>
                    : <><Plus className="h-3 w-3" /> Choose Transport</>
                }
              </button>
            </div>

            {/* Transport options dropdown */}
            {openLeg === leg.id && (
              <div className="ml-12 bg-white rounded-xl border shadow-sm p-3">
                <TransportOptions
                  leg={leg}
                  options={transportOptions[leg.id] || []}
                  selected={leg.transport}
                  loading={leg.loadingTransport}
                  groupSize={groupSize}
                  onSelect={t => updateLeg(leg.id, { transport: t })}
                  onRefresh={() => fetchTransport(leg, idx)}
                />
                {leg.transport && (
                  <button
                    onClick={() => setOpenLeg(null)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✓ Done — collapse
                  </button>
                )}
              </div>
            )}

            {/* Destination city card */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1 text-gray-600">
                {idx + 1}
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Destination city (e.g. Goa)"
                    value={leg.to}
                    onChange={e => updateLeg(leg.id, { to: e.target.value })}
                    className="flex-1 h-9 text-sm font-medium"
                  />
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Nights selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 shrink-0">Nights in {leg.to || 'city'}:</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5,6,7].map(n => (
                      <button
                        key={n}
                        onClick={() => updateLeg(leg.id, { nights: n })}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                          leg.nights === n
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => updateLeg(leg.id, { nights: Math.min(leg.nights + 1, 14) })}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        leg.nights > 7 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {leg.nights > 7 ? leg.nights : '8+'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Return */}
        {legs.length > 0 && (
          <div className="flex items-center gap-3 pl-3.5">
            <div className="w-1 h-4 bg-gray-200 rounded-full" style={{ marginLeft: '13px' }} />
          </div>
        )}
        {legs.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 text-xs font-bold flex items-center justify-center shrink-0">🏁</div>
            <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-2.5">
              <p className="text-xs text-gray-400">Return / End of trip</p>
            </div>
          </div>
        )}
      </div>

      {/* Add city button */}
      <button
        onClick={addLeg}
        className="w-full py-3 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add Destination
      </button>

      {/* Summary */}
      {legs.length > 0 && (
        <div className="bg-gray-50 rounded-xl border p-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-lg font-bold text-gray-900">{legs.length}</p>
            <p className="text-xs text-gray-500">Destinations</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{totalNights}</p>
            <p className="text-xs text-gray-500">Total nights</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-700">{transportCost > 0 ? formatINR(transportCost) : '—'}</p>
            <p className="text-xs text-gray-500">Transport cost</p>
          </div>
        </div>
      )}

      {legs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ArrowDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Add your first destination above</p>
        </div>
      )}
    </div>
  )
}
