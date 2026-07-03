'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MapPin, Train, Plane, IndianRupee, Brain, Calendar,
  Search, ArrowRight, Star, TrendingUp, Shield, Zap,
  Bus, Car, Camera, Building2, Users, ArrowLeftRight,
  Sparkles, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { kiwiFlightUrl, bookingComUrl, redbusUrl } from '@/lib/affiliates'
import { toast } from 'sonner'

/* ─── Static Data ──────────────────────────────────────────────────── */

const DESTINATIONS = [
  { name: 'Goa',        type: 'Beach',      days: '4–6 days',  rating: 4.8, reviews: '12.4k', gradient: 'from-cyan-400 to-blue-500',      emoji: '🏖️' },
  { name: 'Manali',     type: 'Mountains',  days: '5–7 days',  rating: 4.7, reviews: '9.1k',  gradient: 'from-blue-400 to-indigo-600',    emoji: '🏔️' },
  { name: 'Jaipur',     type: 'Heritage',   days: '3–5 days',  rating: 4.6, reviews: '15.2k', gradient: 'from-orange-400 to-pink-500',    emoji: '🏰' },
  { name: 'Kerala',     type: 'Backwaters', days: '5–7 days',  rating: 4.9, reviews: '18.7k', gradient: 'from-green-400 to-emerald-600',  emoji: '🌿' },
  { name: 'Ladakh',     type: 'Adventure',  days: '7–10 days', rating: 4.9, reviews: '7.3k',  gradient: 'from-indigo-400 to-purple-600',  emoji: '🎒' },
  { name: 'Andaman',    type: 'Islands',    days: '5–7 days',  rating: 4.7, reviews: '6.8k',  gradient: 'from-teal-400 to-cyan-600',      emoji: '🐠' },
  { name: 'Varanasi',   type: 'Spiritual',  days: '3–4 days',  rating: 4.5, reviews: '11.2k', gradient: 'from-amber-400 to-orange-500',   emoji: '🛕' },
  { name: 'Rishikesh',  type: 'Adventure',  days: '3–5 days',  rating: 4.6, reviews: '8.9k',  gradient: 'from-green-500 to-teal-600',     emoji: '🧘' },
  { name: 'Udaipur',    type: 'Heritage',   days: '3–4 days',  rating: 4.7, reviews: '10.2k', gradient: 'from-rose-400 to-pink-600',      emoji: '🏯' },
  { name: 'Shimla',     type: 'Mountains',  days: '4–6 days',  rating: 4.6, reviews: '9.5k',  gradient: 'from-sky-400 to-blue-600',       emoji: '🏔️' },
  { name: 'Coorg',      type: 'Nature',     days: '3–4 days',  rating: 4.7, reviews: '7.8k',  gradient: 'from-lime-400 to-green-600',     emoji: '☕' },
  { name: 'Hampi',      type: 'Heritage',   days: '2–3 days',  rating: 4.5, reviews: '5.4k',  gradient: 'from-yellow-400 to-orange-500',  emoji: '🗿' },
]

const FEATURES = [
  { icon: Brain,       title: 'AI Itinerary in Seconds',    desc: 'Tell AI your destination, budget, and style. Get a complete day-by-day plan instantly.' },
  { icon: Train,       title: 'All Transport in One Search', desc: 'Compare trains, flights, and buses with price filters. No more tab-switching.' },
  { icon: IndianRupee, title: 'Budget Tracker (INR)',        desc: 'Set your budget. Track every rupee — per day, per category.' },
  { icon: MapPin,      title: 'Interactive Trip Map',        desc: 'See your full route, hotels, and activities on a live OpenStreetMap.' },
  { icon: Calendar,   title: 'Multi-Day Drag & Drop',       desc: 'Build itineraries day by day. Drag activities between days and rearrange plans.' },
  { icon: Shield,     title: 'No Sign-Up Required',         desc: 'Start planning immediately — no account needed. Sign up later to sync across devices.' },
]

const COMPARISONS = [
  ['Itinerary Builder',    '✅', '❌', '✅'],
  ['Train Search',         '✅', '✅', '❌'],
  ['Flight Search',        '✅', '❌', '❌'],
  ['Hotel Search',         '✅', '❌', '❌'],
  ['INR Budget Tracker',   '✅', '❌', '⚠️ USD only'],
  ['AI Itinerary',         '✅', '❌', '✅'],
  ['Interactive Map',      '✅', '❌', '✅'],
  ['Weather Forecast',     '✅', '❌', '❌'],
  ['Price Filters & Sort', '✅', '⚠️', '❌'],
  ['Free Forever',         '✅', '✅', '⚠️'],
]

const POPULAR = ['Delhi → Goa', 'Mumbai → Manali', 'Bangalore → Kerala', 'Delhi → Shimla']

/* ─── Tab definitions ──────────────────────────────────────────────── */

type TabId = 'plan' | 'flights' | 'hotels' | 'trains' | 'buses' | 'tours' | 'cabs'

const TABS: { id: TabId; label: string; icon: React.ElementType; primary?: boolean }[] = [
  { id: 'plan',    label: 'Plan My Trip',   icon: Sparkles,  primary: true },
  { id: 'flights', label: 'Flights',        icon: Plane },
  { id: 'hotels',  label: 'Hotels',         icon: Building2 },
  { id: 'trains',  label: 'Trains',         icon: Train },
  { id: 'buses',   label: 'Bus',            icon: Bus },
  { id: 'tours',   label: 'Tours & Places', icon: Camera },
  { id: 'cabs',    label: 'Cabs',           icon: Car },
]

const INDIAN_CITIES  = ['Delhi','Mumbai','Bangalore','Chennai','Hyderabad','Kolkata','Pune','Ahmedabad','Surat','Jaipur']
const DESTINATIONS_LIST = ['Goa','Manali','Jaipur','Kerala','Ladakh','Andaman','Varanasi','Rishikesh','Shimla','Ooty','Coorg','Munnar']

/* ─── Main Component ───────────────────────────────────────────────── */

export default function HomePageClient() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('plan')

  /* Plan My Trip */
  const [planFrom, setPlanFrom]   = useState('')
  const [planTo, setPlanTo]       = useState('')
  const [planDays, setPlanDays]   = useState('')

  /* Flights */
  const [flFrom, setFlFrom]       = useState('')
  const [flTo, setFlTo]           = useState('')
  const [flDate, setFlDate]       = useState('')
  const [flTravellers, setFlTravellers] = useState('1')
  const [flType, setFlType]       = useState<'one-way' | 'round'>('one-way')

  /* Hotels */
  const [htCity, setHtCity]       = useState('')
  const [htCheckin, setHtCheckin] = useState('')
  const [htCheckout, setHtCheckout] = useState('')
  const [htGuests, setHtGuests]   = useState('2')

  /* Trains */
  const [trFrom, setTrFrom]       = useState('')
  const [trTo, setTrTo]           = useState('')
  const [trDate, setTrDate]       = useState('')

  /* Buses */
  const [buFrom, setBuFrom]       = useState('')
  const [buTo, setBuTo]           = useState('')
  const [buDate, setBuDate]       = useState('')

  /* Tours */
  const [toCity, setToCity]       = useState('')

  /* Cabs */
  const [cbFrom, setCbFrom]       = useState('')
  const [cbTo, setCbTo]           = useState('')
  const [cbDate, setCbDate]       = useState('')

  function goSearch() {
    const p = new URLSearchParams()

    if (tab === 'plan') {
      if (!planTo) return   // destination is required
      if (planFrom) p.set('from', planFrom)
      p.set('destination', planTo)
      if (planDays) p.set('days', planDays)
      router.push(`/trips/new?${p.toString()}`)

    } else if (tab === 'flights') {
      const from = flFrom || 'Delhi'
      const to   = flTo   || 'Goa'
      const date = flDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
      window.open(kiwiFlightUrl(from, to, date, parseInt(flTravellers) || 1, flType), '_blank', 'noopener,noreferrer')

    } else if (tab === 'hotels') {
      const city     = htCity     || 'Goa'
      const checkin  = htCheckin  || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
      const checkout = htCheckout || new Date(Date.now() + 9*24*60*60*1000).toISOString().split('T')[0]
      window.open(bookingComUrl(city + ' India', checkin, checkout, parseInt(htGuests) || 2), '_blank', 'noopener,noreferrer')

    } else if (tab === 'trains') {
      const params = new URLSearchParams()
      if (trFrom) params.set('from', trFrom)
      if (trTo)   params.set('to', trTo)
      if (trDate) params.set('date', trDate)
      router.push(`/trains?${params.toString()}`)

    } else if (tab === 'buses') {
      const from = buFrom || 'Delhi'
      const to   = buTo   || 'Goa'
      const date = buDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
      window.open(redbusUrl(from, to, date), '_blank', 'noopener,noreferrer')

    } else if (tab === 'tours') {
      const city = toCity || 'goa'
      const thrillUrl = `https://www.thrillophilia.com/places/${city.toLowerCase().replace(/\s+/g, '-')}?utm_source=tripwise&utm_medium=affiliate&utm_campaign=tours`
      window.open(thrillUrl, '_blank', 'noopener,noreferrer')

    } else if (tab === 'cabs') {
      const from = cbFrom || 'Delhi'
      const to   = cbTo   || 'Agra'
      const savaariUrl = `https://www.savaari.com/car-rental/${from.toLowerCase().replace(/\s+/g, '-')}-to-${to.toLowerCase().replace(/\s+/g, '-')}?utm_source=tripwise&utm_medium=affiliate&utm_campaign=tripwise`
      window.open(savaariUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero with search card ──────────────────────────────────── */}
      <section
        className="relative min-h-[520px] flex flex-col items-center justify-center pb-16 pt-10 px-4"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 70%, #065f46 100%)',
        }}
      >
        {/* dot grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        {/* headline */}
        <div className="relative text-center mb-8">
          <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-2">India&apos;s Free All-in-One Travel Planner</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Where do you want to go?
          </h1>
        </div>

        {/* ── Search Card ────────────────────────────────────────── */}
        <div className="relative w-full max-w-4xl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Tab Row */}
            <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex flex-col items-center gap-1 px-5 py-3.5 text-xs font-semibold whitespace-nowrap transition-all shrink-0 border-b-2 ${
                      active
                        ? t.primary
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{t.label}</span>
                    {t.primary && !active && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Panel body */}
            <div className="p-5">

              {/* ── PLAN MY TRIP ──────────────────────────────── */}
              {tab === 'plan' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">AI builds your full itinerary — trains, hotels, budget, map</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">From (Starting City)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200 focus-visible:ring-blue-500"
                          placeholder="e.g. Delhi, Mumbai" value={planFrom} onChange={e => setPlanFrom(e.target.value)} list="plan-from" />
                        <datalist id="plan-from">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Destination</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200 focus-visible:ring-blue-500"
                          placeholder="e.g. Goa, Manali, Kerala" value={planTo} onChange={e => setPlanTo(e.target.value)} list="plan-to" />
                        <datalist id="plan-to">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">No. of Days</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input type="number" className="pl-9 h-12 border-gray-200 focus-visible:ring-blue-500"
                          placeholder="e.g. 5" min={1} max={30} value={planDays} onChange={e => setPlanDays(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={goSearch} disabled={!planTo}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-base gap-2 shadow-md shadow-blue-200">
                    <Sparkles className="h-4 w-4" /> {planTo ? `Plan My ${planTo} Trip with AI` : 'Enter a destination to start'}
                  </Button>
                </div>
              )}

              {/* ── FLIGHTS ───────────────────────────────────── */}
              {tab === 'flights' && (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    {(['one-way', 'round'] as const).map(t => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="fltype" value={t} checked={flType === t} onChange={() => setFlType(t)} className="accent-blue-600" />
                        <span className={`font-medium ${flType === t ? 'text-blue-600' : 'text-gray-500'}`}>
                          {t === 'one-way' ? 'One Way' : 'Round Trip'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-xs text-gray-500">From</Label>
                      <div className="relative flex items-center gap-1">
                        <div className="relative flex-1">
                          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <Input className="pl-9 h-12 border-gray-200" placeholder="City or Airport"
                            value={flFrom} onChange={e => setFlFrom(e.target.value)} list="fl-from" />
                          <datalist id="fl-from">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <button onClick={() => { const tmp = flFrom; setFlFrom(flTo); setFlTo(tmp) }}
                          className="shrink-0 p-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-400 transition-colors" title="Swap">
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">To</Label>
                      <div className="relative">
                        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="City or Airport"
                          value={flTo} onChange={e => setFlTo(e.target.value)} list="fl-to" />
                        <datalist id="fl-to">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Departure</Label>
                      <Input type="date" className="h-12 border-gray-200" value={flDate} onChange={e => setFlDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Travellers</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input type="number" className="pl-9 h-12 border-gray-200" placeholder="1" min={1} max={9}
                          value={flTravellers} onChange={e => setFlTravellers(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={goSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                    ✈️ Search on Kiwi — Best Prices
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-1">
                    We may earn a small commission when you book — at no extra cost to you
                  </p>
                </div>
              )}

              {/* ── HOTELS ────────────────────────────────────── */}
              {tab === 'hotels' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">City / Area / Hotel Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Goa, Manali, Jaipur"
                          value={htCity} onChange={e => setHtCity(e.target.value)} list="ht-city" />
                        <datalist id="ht-city">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Check-in</Label>
                      <Input type="date" className="h-12 border-gray-200" value={htCheckin} onChange={e => setHtCheckin(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Check-out</Label>
                      <Input type="date" className="h-12 border-gray-200" value={htCheckout} onChange={e => setHtCheckout(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Guests:</span>
                      <input type="number" className="w-16 h-8 border border-gray-200 rounded px-2 text-sm" min={1} max={10}
                        value={htGuests} onChange={e => setHtGuests(e.target.value)} />
                    </div>
                    <Button onClick={goSearch} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                      🏨 Search on Booking.com
                    </Button>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-1">
                    We may earn a small commission when you book — at no extra cost to you
                  </p>
                </div>
              )}

              {/* ── TRAINS ────────────────────────────────────── */}
              {tab === 'trains' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">From Station / City</Label>
                      <div className="relative">
                        <Train className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Delhi, NDLS"
                          value={trFrom} onChange={e => setTrFrom(e.target.value)} list="tr-from" />
                        <datalist id="tr-from">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">To Station / City</Label>
                      <div className="relative">
                        <Train className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Goa, MAO"
                          value={trTo} onChange={e => setTrTo(e.target.value)} list="tr-to" />
                        <datalist id="tr-to">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Journey Date</Label>
                      <Input type="date" className="h-12 border-gray-200" value={trDate} onChange={e => setTrDate(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={goSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                    🚂 Search Trains →
                  </Button>
                  <p className="text-xs text-gray-400 text-center">Powered by eRail.in · Book directly on IRCTC after comparing</p>
                </div>
              )}

              {/* ── BUSES ─────────────────────────────────────── */}
              {tab === 'buses' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">From City</Label>
                      <div className="relative">
                        <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Bangalore"
                          value={buFrom} onChange={e => setBuFrom(e.target.value)} list="bu-from" />
                        <datalist id="bu-from">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">To City</Label>
                      <div className="relative">
                        <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Goa"
                          value={buTo} onChange={e => setBuTo(e.target.value)} list="bu-to" />
                        <datalist id="bu-to">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Journey Date</Label>
                      <Input type="date" className="h-12 border-gray-200" value={buDate} onChange={e => setBuDate(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={goSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                    🚌 Search on redBus
                  </Button>
                  <p className="text-xs text-gray-400 text-center">Compare RedBus, AbhiBus & state transport operators</p>
                </div>
              )}

              {/* ── TOURS & PLACES ────────────────────────────── */}
              {tab === 'tours' && (
                <div className="space-y-4">
                  <div className="space-y-1 max-w-md">
                    <Label className="text-xs text-gray-500">Where do you want to explore?</Label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input className="pl-9 h-12 border-gray-200" placeholder="City, region or attraction"
                        value={toCity} onChange={e => setToCity(e.target.value)} list="to-city" />
                      <datalist id="to-city">{DESTINATIONS_LIST.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DESTINATIONS.map(d => (
                      <button key={d.name} onClick={() => setToCity(d.name)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${toCity === d.name ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                        {d.emoji} {d.name}
                      </button>
                    ))}
                  </div>
                  <Button onClick={goSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                    🗺️ Explore on Thrillophilia
                  </Button>
                </div>
              )}

              {/* ── CABS ──────────────────────────────────────── */}
              {tab === 'cabs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Pickup Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Delhi Airport"
                          value={cbFrom} onChange={e => setCbFrom(e.target.value)} list="cb-from" />
                        <datalist id="cb-from">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Drop Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                        <Input className="pl-9 h-12 border-gray-200" placeholder="e.g. Agra"
                          value={cbTo} onChange={e => setCbTo(e.target.value)} list="cb-to" />
                        <datalist id="cb-to">{[...INDIAN_CITIES,...DESTINATIONS_LIST].map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Pickup Date</Label>
                      <Input type="date" className="h-12 border-gray-200" value={cbDate} onChange={e => setCbDate(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={goSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2">
                    🚗 Book on Savaari
                  </Button>
                  <p className="text-xs text-gray-400 text-center">Add to your trip plan · Compare outstation fares</p>
                </div>
              )}

            </div>
          </div>

          {/* Popular searches */}
          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
            <span className="text-white/50 text-xs">Popular:</span>
            {POPULAR.map(r => (
              <button key={r}
                onClick={() => { const [f,t] = r.split(' → '); setPlanFrom(f); setPlanTo(t); setTab('plan') }}
                className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                {r}
              </button>
            ))}
            <Link href="/packing-list"
              className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
              🎒 Packing List
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Stats ────────────────────────────────────────────── */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '₹0',     label: 'Monthly cost' },
            { value: '7 apps', label: 'Replaced by one' },
            { value: '16 hrs', label: 'Saved per trip' },
            { value: '100%',   label: 'Free forever' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-blue-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Destinations ───────────────────────────────────────────── */}
      <section className="py-14 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top Destinations</h2>
            <p className="text-gray-500 mt-1 text-sm">Click any card to start planning — AI itinerary in seconds</p>
          </div>
          <Link href="/destinations" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Infinite marquee strip with fade masks */}
        <div className="relative">
          {/* Left fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-28 bg-gradient-to-r from-white to-transparent z-10" />
          {/* Right fade */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-28 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="flex gap-5 animate-marquee w-max py-3">
            {[...DESTINATIONS, ...DESTINATIONS].map((dest, i) => (
              <Link
                key={i}
                href={`/destinations/${dest.name.toLowerCase()}`}
                className="shrink-0"
                aria-label={`Plan a trip to ${dest.name}`}
              >
                <div className={`relative w-52 h-52 rounded-2xl overflow-hidden bg-gradient-to-br ${dest.gradient} group cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                  {/* big emoji centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{dest.emoji}</span>
                  </div>
                  {/* type badge top-right */}
                  <div className="absolute top-3 right-3 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {dest.type}
                  </div>
                  {/* bottom gradient overlay with name + rating */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                    <p className="text-white font-bold text-base leading-tight">{dest.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-white/90 text-xs font-medium">{dest.rating}</span>
                        <span className="text-white/60 text-xs">({dest.reviews})</span>
                      </div>
                      <span className="text-white/70 text-xs">{dest.days}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offers / Quick Links ───────────────────────────────────── */}
      <section className="bg-gray-50 border-y py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Plan by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, label: 'AI Trip Planner',    sub: 'Full itinerary in 10s',      href: '/trips/new',         color: 'from-blue-500 to-indigo-600' },
              { icon: Train,    label: 'Train Tickets',       sub: 'Compare & book IRCTC',       href: '/trips/new?tab=transport', color: 'from-orange-400 to-red-500' },
              { icon: Plane,    label: 'Flight Booking',      sub: 'Lowest fares, all airlines', href: '/trips/new?tab=transport', color: 'from-sky-400 to-blue-500' },
              { icon: Building2,label: 'Hotel Deals',         sub: 'Best rates, all types',      href: '/trips/new?tab=hotels',    color: 'from-violet-500 to-purple-600' },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <Card className="hover:shadow-md transition-shadow overflow-hidden group cursor-pointer border-0">
                  <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 bg-gradient-to-br ${item.color} rounded-xl shadow-sm`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.sub}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Plan in 3 Steps</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step:'1', icon:MapPin,     title:'Enter Destination & Budget', desc:"Tell us where you're going, dates, and total INR budget." },
            { step:'2', icon:Brain,      title:'AI Builds Your Itinerary',   desc:'AI creates a full day-by-day plan with activities, timings, and costs.' },
            { step:'3', icon:TrendingUp, title:'Tweak & Track Live',         desc:'Drag-drop activities, search transport, book hotels, and track budget.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-600 rounded-full text-blue-600 text-xs font-bold flex items-center justify-center">{step}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="text-gray-500 mt-2 text-sm">Built specifically for Indian travelers. Free forever.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <Card key={f.title} className="group border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-default">
                <CardContent className="p-5 flex gap-4">
                  <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-xl h-fit shrink-0 transition-colors duration-200">
                    <f.icon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm mb-1 transition-colors duration-200">{f.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ───────────────────────────────────────── */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">How We Compare</h2>
          <div className="overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full min-w-[560px] text-sm bg-white overflow-hidden">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="p-4 font-semibold">TripWise</th>
                  <th className="p-4 font-semibold text-blue-200">IRCTC</th>
                  <th className="p-4 font-semibold text-blue-200">Wanderlog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISONS.map(([feature, ...cols]) => (
                  <tr key={feature} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-700">{feature}</td>
                    {cols.map((v,i) => (
                      <td key={i} className={`p-4 text-center ${i===0?'font-semibold text-blue-600':'text-gray-500'}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Social Proof ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Loved by Indian Travelers</h2>
            <p className="text-gray-500 mt-2 text-sm">Real stories from trips planned on TripWise</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              { name: 'Priya S.', city: 'Mumbai', dest: 'Goa', quote: 'AI planned our entire 5-day Goa trip in 30 seconds. Saved us hours of WhatsApp research!', rating: 5, avatar: '🧕' },
              { name: 'Rahul K.', city: 'Delhi', dest: 'Manali', quote: 'Budget tracker is a lifesaver. Knew exactly how much we were spending every day in ₹.', rating: 5, avatar: '👨‍💼' },
              { name: 'Ananya R.', city: 'Bangalore', dest: 'Kerala', quote: 'Compared trains and buses side by side. Booked the best route in minutes. Totally free!', rating: 5, avatar: '👩‍💻' },
              { name: 'Vikram P.', city: 'Pune', dest: 'Ladakh', quote: 'The packing list feature + weather forecast combo is genius for high-altitude trips.', rating: 5, avatar: '🧔' },
              { name: 'Sneha M.', city: 'Hyderabad', dest: 'Jaipur', quote: 'Planned a family trip for 8 people. The group size + children budget split was perfect.', rating: 5, avatar: '👩' },
              { name: 'Arjun T.', city: 'Chennai', dest: 'Andaman', quote: 'No sign-up needed to start — I had a full 7-day itinerary before creating an account.', rating: 5, avatar: '👦' },
            ].map(r => (
              <div key={r.name} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{r.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{r.avatar}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.city} → {r.dest}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter signup */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <Mail className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">Get Travel Deals in Your Inbox</h3>
            <p className="text-sm text-gray-500 mb-5">Weekly deals on trains, flights & hotels — curated for Indian destinations. No spam, unsubscribe anytime.</p>
            <form
              onSubmit={async e => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement
                const email = input?.value?.trim()
                if (!email) return
                try {
                  const res = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  })
                  if (!res.ok) throw new Error()
                  input.value = ''
                  toast.success('Thanks! Watch your inbox for deals 🎉')
                } catch {
                  toast.error('Could not subscribe — please try again')
                }
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto"
            >
              <Input name="email" type="email" placeholder="your@email.com" required className="flex-1 h-11 border-blue-200 focus-visible:ring-blue-400" />
              <Button type="submit" className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shrink-0">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-3">Join 12,000+ travelers · No spam ever</p>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Zap className="h-10 w-10 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to plan smarter?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of Indian travelers who stopped the tab-switching chaos.</p>
          <Link href="/trips/new">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-12 h-12 text-base">
              Start Planning Free
            </Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
