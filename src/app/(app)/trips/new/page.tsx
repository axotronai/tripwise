'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Calendar, IndianRupee, Users, ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2, Plane, Hotel, UtensilsCrossed, Backpack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { TravelStyle } from '@/types'
import { formatINR, getTripDuration } from '@/lib/utils/trip'
import { INDIAN_CITIES } from '@/lib/data/indianCities'

const TRAVEL_STYLES: { value: TravelStyle; label: string; emoji: string; desc: string; budgetHint: string }[] = [
  { value: 'budget', label: 'Budget', emoji: '🎒', desc: 'Hostels, street food, local buses', budgetHint: '₹3K–8K/day' },
  { value: 'comfort', label: 'Comfort', emoji: '🏨', desc: '3-star hotels, mix of transport', budgetHint: '₹8K–20K/day' },
  { value: 'luxury', label: 'Luxury', emoji: '✨', desc: '5-star, flights, fine dining', budgetHint: '₹20K+/day' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗', desc: 'Camping, treks, outdoor activities', budgetHint: '₹5K–15K/day' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧', desc: 'Family-friendly, comfort + safety', budgetHint: '₹10K–25K/day' },
]

const POPULAR_DESTINATIONS = [
  'Goa', 'Manali', 'Jaipur', 'Kerala', 'Ladakh', 'Andaman',
  'Varanasi', 'Rishikesh', 'Coorg', 'Shimla', 'Udaipur', 'Mumbai',
]

const CITIES = INDIAN_CITIES

// AI loading steps shown during generation
const AI_STEPS = [
  { icon: MapPin,          label: 'Building your itinerary',      sub: 'Planning day-by-day activities…' },
  { icon: Hotel,           label: 'Finding best stays',            sub: 'Matching hotels to your budget…' },
  { icon: Plane,           label: 'Checking transport options',    sub: 'Trains, flights, buses from ' },
  { icon: UtensilsCrossed, label: 'Adding local food guide',       sub: 'Real restaurants and must-try dishes…' },
  { icon: Backpack,        label: 'Finalising your plan',          sub: 'Packing tips and money-saving tricks…' },
]

const steps = ['Destination', 'Dates & Group', 'Budget & Style']

function SuggestInput({ value, onChange, suggestions, placeholder }: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [open, setOpen]       = useState(false)
  const [cursor, setCursor]   = useState(-1)
  const ref                   = useRef<HTMLDivElement>(null)
  const listRef               = useRef<HTMLUListElement>(null)

  const isExactMatch = suggestions.some(s => s.toLowerCase() === value.toLowerCase())
  const filtered = value.length > 0 && !isExactMatch
    ? suggestions
        .filter(s => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setCursor(-1) }, [value])

  function handleKey(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault()
      onChange(filtered[cursor]); setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setCursor(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          className={value ? 'pr-8' : ''}
        />
        {value && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(''); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      {open && value.length > 0 && (
        <ul ref={listRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === cursor ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {s}
            </li>
          )) : (
            <li className="px-4 py-3 text-sm text-gray-400 text-center">No cities found for "{value}"</li>
          )}
        </ul>
      )}
    </div>
  )
}

function NewTripForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [aiStep, setAiStep] = useState(-1)   // -1 = not started, 0-4 = steps, 5 = done
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    destination: searchParams.get('destination') || '',
    start_city: '',
    start_date: '',
    end_date: '',
    group_size: 1,
    children: 0,
    total_budget: 20000,
    travel_style: 'comfort' as TravelStyle,
  })

  const duration = form.start_date && form.end_date ? getTripDuration(form.start_date, form.end_date) : 0

  // Tick through AI steps for animation
  useEffect(() => {
    if (!generating) return
    let current = 0
    setAiStep(0)
    const interval = setInterval(() => {
      current++
      if (current >= AI_STEPS.length) { clearInterval(interval); return }
      setAiStep(current)
    }, 1400)
    return () => clearInterval(interval)
  }, [generating])

  async function handleSubmit() {
    if (!form.destination || !form.start_date || !form.end_date || !form.start_city) {
      toast.error('Please fill all fields'); return
    }
    if (duration < 1) { toast.error('End date must be after start date'); return }

    setGenerating(true)

    try {
      // 1. Create the trip
      const tripRes = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total_days: duration }),
      })
      const tripData = await tripRes.json()
      if (!tripRes.ok) throw new Error(tripData.error || 'Failed to create trip')
      const tripId = tripData.id

      // 2. Generate AI itinerary
      const aiRes = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: form.destination,
          days: duration,
          budget: form.total_budget,
          travel_style: form.travel_style,
          group_size: form.group_size,
          children: form.children,
          start_city: form.start_city,
        }),
      })
      const aiData = await aiRes.json()

      if (aiRes.ok && aiData.days?.length) {
        // 3. Attach dates to AI days
        const startDate = new Date(form.start_date)
        const daysWithDates = aiData.days.map((d: { day_number: number; [key: string]: unknown }, i: number) => {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          return { ...d, date: date.toISOString().split('T')[0] }
        })

        // 4. Save itinerary to DB
        await fetch(`/api/trips/${tripId}/save-itinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            days: daysWithDates,
            ai_meta: { budget_breakdown: aiData.budget_breakdown },
          }),
        })
      }

      setAiStep(5) // done
      await new Promise(r => setTimeout(r, 600)) // brief pause to show "done"
      router.push(`/trips/${tripId}?generated=1`)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
      setAiStep(-1)
    }
  }

  // AI loading screen
  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize: '28px 28px' }} />

        <div className="relative w-full max-w-md text-center">
          {/* Pulsing orb */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" />
            <div className="absolute inset-2 bg-blue-400 rounded-full opacity-30 animate-ping" style={{ animationDelay: '0.3s' }} />
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-1">
            Planning your {form.destination} trip
          </h2>
          <p className="text-blue-200 text-sm mb-8">{duration} days · {formatINR(form.total_budget)} · {form.travel_style}</p>

          {/* Step list */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4 text-left">
            {AI_STEPS.map((s, i) => {
              const Icon = s.icon
              const done    = aiStep > i
              const current = aiStep === i
              return (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
                  done ? 'opacity-100' : current ? 'opacity-100' : 'opacity-30'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done    ? 'bg-green-400' :
                    current ? 'bg-blue-400 animate-pulse' :
                              'bg-white/20'
                  }`}>
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-white" />
                      : <Icon className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${done || current ? 'text-white' : 'text-white/50'}`}>{s.label}</p>
                    {current && (
                      <p className="text-xs text-blue-200 mt-0.5">
                        {s.sub}{i === 2 ? form.start_city : ''}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-blue-300 text-xs mt-6">Powered by Llama 3.3 · Usually takes 20-30 seconds</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered trip planning
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Plan your trip</h1>
          <p className="text-gray-500 mt-1">Fill 3 quick steps — AI builds your full itinerary</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    i < step  ? 'bg-green-500 text-white' :
                    i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-sm hidden sm:block font-medium ${
                    i <= step ? 'text-gray-900' : 'text-gray-400'
                  }`}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-8">

            {/* Step 1: Destination */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-3">
                    <MapPin className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Where are you going?</h2>
                  <p className="text-gray-500 text-sm mt-1">Pick your destination in India</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">From (Starting City)</Label>
                    <SuggestInput
                      placeholder="e.g. Delhi, Mumbai"
                      value={form.start_city}
                      onChange={v => setForm({ ...form, start_city: v })}
                      suggestions={CITIES}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Destination</Label>
                    <SuggestInput
                      placeholder="e.g. Goa, Manali, Kota"
                      value={form.destination}
                      onChange={v => setForm({ ...form, destination: v })}
                      suggestions={CITIES}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Destinations</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DESTINATIONS.map(d => (
                      <Badge key={d}
                        variant={form.destination === d ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all text-sm py-1 px-3 ${form.destination === d ? 'bg-blue-600' : 'hover:bg-blue-50 hover:border-blue-300'}`}
                        onClick={() => setForm({ ...form, destination: d })}>
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dates & Group */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-3">
                    <Calendar className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">When & with whom?</h2>
                  <p className="text-gray-500 text-sm mt-1">Set your dates and group size</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input type="date" value={form.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input type="date" value={form.end_date}
                      min={form.start_date || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>

                {duration > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 text-center">
                    <span className="text-2xl font-bold text-blue-700">{duration}</span>
                    <span className="text-blue-600 font-medium"> day{duration > 1 ? 's' : ''} </span>
                    <span className="text-blue-400 text-sm">to {form.destination}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Adults</Label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setForm({ ...form, group_size: Math.max(1, form.group_size - 1) })}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-blue-400 transition-colors">−</button>
                      <div className="flex items-center gap-2 text-xl font-bold w-16 justify-center">
                        <Users className="h-5 w-5 text-blue-500" />{form.group_size}
                      </div>
                      <button onClick={() => setForm({ ...form, group_size: Math.min(20, form.group_size + 1) })}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-blue-400 transition-colors">+</button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {form.group_size === 1 ? 'Solo traveller' : form.group_size === 2 ? 'Couple' : `${form.group_size} adults`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Children 👶</Label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setForm({ ...form, children: Math.max(0, form.children - 1) })}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-orange-400 transition-colors">−</button>
                      <span className="text-xl font-bold w-8 text-center">{form.children}</span>
                      <button onClick={() => setForm({ ...form, children: Math.min(10, form.children + 1) })}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-orange-400 transition-colors">+</button>
                    </div>
                    <p className="text-xs text-gray-400">under 12 years</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget & Style */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex bg-blue-100 p-3 rounded-2xl mb-3">
                    <IndianRupee className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Budget & Travel Style</h2>
                  <p className="text-gray-500 text-sm mt-1">AI plans everything within your budget</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Total Budget — {form.group_size} adult{form.group_size > 1 ? 's' : ''}
                    {form.children > 0 ? ` · ${form.children} child${form.children > 1 ? 'ren' : ''}` : ''}, {duration} days
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                    <Input type="number" className="pl-8 h-12 text-lg font-semibold"
                      value={form.total_budget}
                      onChange={e => setForm({ ...form, total_budget: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatINR(Math.round(form.total_budget / form.group_size))} per person</span>
                    <span>{formatINR(Math.round(form.total_budget / Math.max(duration, 1)))} per day</span>
                  </div>
                  {/* Budget quick-set buttons */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {[10000, 20000, 35000, 50000, 100000].map(amt => (
                      <button key={amt} onClick={() => setForm({ ...form, total_budget: amt })}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${form.total_budget === amt ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Travel Style</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {TRAVEL_STYLES.map(style => (
                      <div key={style.value} onClick={() => setForm({ ...form, travel_style: style.value })}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          form.travel_style === style.value
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className="text-2xl">{style.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">{style.label}</div>
                          <div className="text-xs text-gray-500 truncate">{style.desc}</div>
                        </div>
                        <span className="text-xs text-blue-600 font-medium shrink-0">{style.budgetHint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
                  disabled={
                    (step === 0 && (!form.destination || !form.start_city)) ||
                    (step === 1 && (!form.start_date || !form.end_date || duration < 1))
                  }>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-blue-200">
                  <Sparkles className="h-5 w-5" /> Generate My Trip with AI
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Free forever · No credit card · Powered by Llama 3.3
        </p>
      </div>
    </div>
  )
}

export default function NewTripPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewTripForm />
    </Suspense>
  )
}
