'use client'

import { ExternalLink } from 'lucide-react'
import {
  bookingComUrl, makemytripFlightUrl, redbusUrl,
  klookUrl, policyBazaarTravelUrl, amazonUrl,
} from '@/lib/affiliates'

interface Props {
  from?: string
  to?: string
  date?: string
  adults?: number
  destination?: string
}

export default function DealsBar({ from, to, date, adults = 1, destination }: Props) {
  const today = date || new Date().toISOString().split('T')[0]

  const deals = [
    {
      emoji: '✈️', label: 'Cheapest Flights',
      sub: from && to ? `${from} → ${to}` : 'All routes',
      url: from && to ? makemytripFlightUrl(from, to, today, adults) : 'https://www.makemytrip.com/flights/',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      emoji: '🏨', label: 'Hotel Deals',
      sub: destination || (to || 'Your destination'),
      url: bookingComUrl(destination || to || 'India'),
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      emoji: '🚌', label: 'Book Bus',
      sub: from && to ? `${from} → ${to}` : 'All routes',
      url: redbusUrl(from || 'Mumbai', to || 'Pune', today),
      color: 'bg-red-50 border-red-200 text-red-700',
    },
    {
      emoji: '🎟️', label: 'Activities',
      sub: destination || 'Explore experiences',
      url: klookUrl('things to do', destination || 'India'),
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      emoji: '🛡️', label: 'Travel Insurance',
      sub: 'From ₹299 · Medical + cancellation',
      url: policyBazaarTravelUrl(destination),
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      emoji: '🧳', label: 'Travel Gear',
      sub: 'Luggage, adapters & more',
      url: amazonUrl('travel luggage backpack India'),
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
        🔥 Quick Booking Links
        <span className="font-normal text-gray-400">· opens booking site</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {deals.map(d => (
          <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
            className={`flex items-start gap-2 p-2.5 rounded-xl border ${d.color} hover:opacity-80 transition-opacity group`}>
            <span className="text-xl shrink-0">{d.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs leading-tight">{d.label}</p>
              <p className="text-xs opacity-70 truncate mt-0.5">{d.sub}</p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 mt-0.5" />
          </a>
        ))}
      </div>
    </div>
  )
}
