'use client'

import { useState } from 'react'
import { ExternalLink, ChevronLeft, ChevronRight, CreditCard, Gift, Plane, Shield } from 'lucide-react'
import { TRAVEL_CREDIT_CARDS, bankBazaarCCUrl, creditMantriCCUrl } from '@/lib/affiliates'

interface Props {
  compact?: boolean       // compact = 1 featured card strip
}

export default function CreditCardWidget({ compact = false }: Props) {
  const [idx, setIdx] = useState(0)
  const card = TRAVEL_CREDIT_CARDS[idx]

  if (compact) {
    // ── Compact strip (1 card, slides) ──────────────────────────────────────
    return (
      <div className={`rounded-2xl overflow-hidden bg-gradient-to-r ${card.color} text-white p-4 shadow-lg`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold opacity-80">Travel Credit Card Pick</span>
              {card.badge && <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{card.badge}</span>}
            </div>
            <p className="font-bold text-lg leading-tight">{card.bank} {card.name}</p>
            <p className="text-sm opacity-90 mt-0.5">{card.tagline}</p>
            <div className="flex gap-3 mt-2 text-xs opacity-80">
              <span className="flex items-center gap-1"><Gift className="h-3 w-3" />{card.welcome_bonus}</span>
              <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{card.benefits[0]}</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2 items-end">
            <a href={card.cta_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow">
              Apply Now <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-xs opacity-70">{card.annual_fee}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20">
          <button onClick={() => setIdx((idx - 1 + TRAVEL_CREDIT_CARDS.length) % TRAVEL_CREDIT_CARDS.length)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {TRAVEL_CREDIT_CARDS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
          </div>
          <button onClick={() => setIdx((idx + 1) % TRAVEL_CREDIT_CARDS.length)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Full widget ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" /> Best Travel Credit Cards
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Earn miles, lounge access & cashback on your trip spend</p>
        </div>
        <a href={bankBazaarCCUrl()} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline flex items-center gap-1">
          Compare all <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-3">
        {TRAVEL_CREDIT_CARDS.slice(0, 4).map(c => (
          <div key={c.id} className={`rounded-2xl bg-gradient-to-r ${c.color} text-white p-4 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-base">{c.bank} {c.name}</p>
                  {c.badge && <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 shrink-0">{c.badge}</span>}
                </div>
                <p className="text-sm opacity-90">{c.tagline}</p>
                <div className="mt-2 space-y-1">
                  {c.benefits.slice(0, 2).map(b => (
                    <p key={b} className="text-xs opacity-80 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                      {b}
                    </p>
                  ))}
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <Gift className="h-3 w-3" /> {c.welcome_bonus}
                  </p>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <Plane className="h-3 w-3" /> {c.travel_perk}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-1.5 items-end">
                <a href={c.cta_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow whitespace-nowrap">
                  Apply Free <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-xs opacity-70">{c.annual_fee}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <a href={bankBazaarCCUrl()} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
          Compare All Cards on BankBazaar →
        </a>
        <a href={creditMantriCCUrl()} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium">
          Check Eligibility →
        </a>
      </div>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <Shield className="h-3 w-3" /> Secure apply via BankBazaar · Affiliate disclosure
      </p>
    </div>
  )
}
