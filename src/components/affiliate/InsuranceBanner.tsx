'use client'

import { Shield, ExternalLink, AlertTriangle } from 'lucide-react'
import { policyBazaarTravelUrl, coverfoxInsuranceUrl } from '@/lib/affiliates'

interface Props {
  destination?: string
  totalDays?: number
  groupSize?: number
  totalBudget?: number
  compact?: boolean
}

export default function InsuranceBanner({ destination, totalDays, groupSize = 1, totalBudget, compact = false }: Props) {
  const premium = Math.round((totalBudget ?? 20000) * 0.015)   // ~1.5% of trip cost
  const coverAmount = Math.max(5_00_000, (totalBudget ?? 20000) * 20) // 20x trip cost cover

  if (compact) {
    return (
      <a href={policyBazaarTravelUrl(destination)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group">
        <Shield className="h-8 w-8 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-800">Don&#39;t travel uninsured! 🛡️</p>
          <p className="text-xs text-amber-600 truncate">
            {groupSize > 1 ? `Cover ${groupSize} people` : 'Cover yourself'} for ~₹{premium.toLocaleString('en-IN')} · Medical, cancellation & more
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-amber-400 group-hover:text-amber-600 shrink-0" />
      </a>
    )
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Shield className="h-10 w-10 shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="font-bold text-lg">Protect Your Trip</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Travel insurance covers medical emergencies, trip cancellation, lost baggage and flight delays.
            {destination ? ` Essential for ${destination}.` : ''}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-xs opacity-70">Premium from</p>
              <p className="font-bold">₹{premium.toLocaleString('en-IN')}</p>
              <p className="text-xs opacity-70">{groupSize} person{groupSize > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-xs opacity-70">Medical cover</p>
              <p className="font-bold">₹{(coverAmount / 100000).toFixed(0)}L</p>
              <p className="text-xs opacity-70">cashless</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-xs opacity-70">Trip cover</p>
              <p className="font-bold">{totalDays ?? 7} days</p>
              <p className="text-xs opacity-70">full trip</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={policyBazaarTravelUrl(destination)} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-sm font-semibold bg-white text-orange-600 py-2 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4" /> Get Insured · PolicyBazaar
            </a>
            <a href={coverfoxInsuranceUrl()} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold border border-white/40 text-white py-2 px-3 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1">
              <ExternalLink className="h-4 w-4" /> Coverfox
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
