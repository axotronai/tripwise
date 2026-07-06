'use client'

import dynamic from 'next/dynamic'
import { Building2, TrendingDown, Star, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Lazy-load the heavy comparison component
const HotelComparison = dynamic(() => import('@/components/hotel/HotelComparison'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center text-gray-400">
        <Building2 className="h-10 w-10 mx-auto mb-3 animate-pulse" />
        <p className="text-sm">Loading hotel comparison…</p>
      </div>
    </div>
  ),
})

const POPULAR = ['Goa', 'Manali', 'Jaipur', 'Shimla', 'Udaipur', 'Coorg', 'Ooty', 'Rishikesh']

const WHY_US = [
  {
    icon: <TrendingDown className="h-6 w-6 text-green-600" />,
    title: 'Always the lowest price',
    desc:  'We compare Booking.com, Agoda, Hotels.com and more in one click so you never overpay.',
  },
  {
    icon: <Star className="h-6 w-6 text-amber-500" />,
    title: 'Real ratings, real reviews',
    desc:  'Star ratings and guest scores from verified travellers across all platforms.',
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    title: 'No hidden fees',
    desc:  'The price you see is what you pay. We show totals including taxes upfront.',
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    title: 'Instant results',
    desc:  'Compare 5 booking sites simultaneously — no switching tabs, no wasted time.',
  },
]

function HotelsInner() {
  const sp         = useSearchParams()
  const city       = sp.get('city')     ?? ''
  const checkin    = sp.get('checkin')  ?? ''
  const checkout   = sp.get('checkout') ?? ''
  const adults     = parseInt(sp.get('adults') ?? '2')
  const autosearch = sp.get('autosearch') === '1'

  return (
    <section id="search" className="max-w-4xl mx-auto px-4 py-10">
      <Suspense>
        <HotelComparison
          defaultCity={city}
          defaultCheckin={checkin}
          defaultCheckout={checkout}
          defaultAdults={adults}
          autoSearch={autosearch}
        />
      </Suspense>
    </section>
  )
}

export default function HotelsClient() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <TrendingDown className="h-4 w-4" /> Compare prices · Save up to 30%
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            Find the cheapest hotel<br className="hidden sm:block" /> in seconds
          </h1>
          <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
            We compare Booking.com, Agoda, Hotels.com, MakeMyTrip and more — all at once.
            No tab-switching, no guesswork.
          </p>

          {/* Popular destinations */}
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR.map(dest => (
              <a
                key={dest}
                href={`#search`}
                onClick={e => {
                  e.preventDefault()
                  document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })
                  // Fill in the city — using a custom event the component listens to
                  window.dispatchEvent(new CustomEvent('hotel-city', { detail: dest }))
                }}
                className="px-3 py-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-sm transition-colors cursor-pointer"
              >
                {dest}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison widget ────────────────────────────────────────────────── */}
      <Suspense>
        <HotelsInner />
      </Suspense>

      {/* ── Why use TripWise ─────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why compare here?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {WHY_US.map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Planning a full trip?</h2>
          <p className="text-blue-100 mb-7 text-lg">
            Build your day-by-day itinerary, compare hotels & trains, and track your budget — all in one place.
          </p>
          <Link href="/trips/new">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-12 text-base">
              Plan My Trip Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
