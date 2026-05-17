'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MapPin, Calendar, IndianRupee, Users, ArrowRight, ArrowLeft,
  Sparkles, Loader2, CheckCircle2, Plus, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { TravelStyle } from '@/types'
import { formatINR, getTripDuration } from '@/lib/utils/trip'
import { INDIAN_CITIES } from '@/lib/data/indianCities'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TripForm {
  destination: string
  isMultiCity: boolean
  extraDestinations: string[]
  start_city: string
  start_date: string
  end_date: string
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'corporate'
  group_size: number
  children: number
  total_budget: number
  useCustomBudget: boolean
  travel_style: TravelStyle
  interests: string[]
  diet: 'veg' | 'nonveg' | 'jain' | 'any'
  transport_pref: 'train' | 'flight' | 'bus' | 'road' | 'fastest' | 'cheapest'
}

// ─── Static data ──────────────────────────────────────────────────────────────

const POPULAR_DESTINATIONS = [
  'Goa', 'Manali', 'Jaipur', 'Kerala', 'Ladakh', 'Andaman',
  'Varanasi', 'Rishikesh', 'Coorg', 'Shimla', 'Udaipur',
  'Darjeeling', 'Hampi', 'Munnar', 'Ooty',
]

const GROUP_TYPES: { value: TripForm['groupType']; label: string; emoji: string; desc: string }[] = [
  { value: 'solo',      label: 'Solo',             emoji: '🧳', desc: 'Just me, myself & I' },
  { value: 'couple',    label: 'Couple',            emoji: '💑', desc: 'Romantic getaway' },
  { value: 'family',    label: 'Family with Kids',  emoji: '👨‍👩‍👧', desc: 'Kid-friendly adventures' },
  { value: 'friends',   label: 'Friends Group',     emoji: '👫', desc: 'Squad goals' },
  { value: 'corporate', label: 'Corporate',         emoji: '💼', desc: 'Team outing / offsite' },
]

const TRAVEL_STYLES: { value: TravelStyle; label: string; emoji: string; desc: string; hint: string }[] = [
  { value: 'budget',    label: 'Budget',    emoji: '🎒', desc: 'Hostels, street food, local buses', hint: '₹3K–8K/day' },
  { value: 'comfort',   label: 'Comfort',   emoji: '🏨', desc: '3-star hotels, mix of transport',   hint: '₹8K–20K/day' },
  { value: 'luxury',    label: 'Luxury',    emoji: '✨', desc: '5-star, flights, fine dining',       hint: '₹20K+/day' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗', desc: 'Camping, treks, outdoor activities', hint: '₹5K–15K/day' },
  { value: 'family',    label: 'Family',    emoji: '👨‍👩‍👧', desc: 'Family-friendly, comfort + safety', hint: '₹10K–25K/day' },
]

const INTERESTS: { key: string; label: string; emoji: string }[] = [
  { key: 'beaches',        label: 'Beaches',              emoji: '🏖️' },
  { key: 'history',        label: 'History & Temples',    emoji: '🏛️' },
  { key: 'nature',         label: 'Nature & Wildlife',    emoji: '🌿' },
  { key: 'food',           label: 'Food & Cuisine',       emoji: '🍽️' },
  { key: 'shopping',       label: 'Shopping',             emoji: '🛍️' },
  { key: 'adventure',      label: 'Adventure & Trekking', emoji: '🧗' },
  { key: 'culture',        label: 'Culture & Arts',       emoji: '🎭' },
  { key: 'scenic',         label: 'Scenic Views',         emoji: '🌅' },
  { key: 'nightlife',      label: 'Nightlife & Music',    emoji: '🎪' },
  { key: 'wellness',       label: 'Wellness & Yoga',      emoji: '🧘' },
  { key: 'water_sports',   label: 'Water Sports',         emoji: '🏄' },
  { key: 'cycling',        label: 'Cycling & Hiking',     emoji: '🚵' },
]

const DIET_OPTIONS: { value: TripForm['diet']; label: string; emoji: string; desc: string }[] = [
  { value: 'veg',    label: 'Pure Vegetarian', emoji: '🌱', desc: 'No meat, no eggs' },
  { value: 'nonveg', label: 'Non-Vegetarian',  emoji: '🍗', desc: 'I eat everything' },
  { value: 'jain',   label: 'Jain',            emoji: '🌿', desc: 'No root vegetables' },
  { value: 'any',    label: 'No Preference',   emoji: '🍽️', desc: 'Anything goes' },
]

const TRANSPORT_OPTIONS: { value: TripForm['transport_pref']; label: string; emoji: string; desc: string }[] = [
  { value: 'train',    label: 'Train',          emoji: '🚂', desc: 'Love overnight trains' },
  { value: 'flight',   label: 'Flight',         emoji: '✈️', desc: 'Save time' },
  { value: 'bus',      label: 'Bus',            emoji: '🚌', desc: 'Budget-friendly' },
  { value: 'road',     label: 'Road Trip',      emoji: '🚗', desc: 'Self-drive' },
  { value: 'fastest',  label: 'Fastest Option', emoji: '⚡', desc: 'Get there ASAP' },
  { value: 'cheapest', label: 'Cheapest Option',emoji: '💰', desc: 'Minimise travel cost' },
]

const BUDGET_PRESETS = [15000, 30000, 50000, 100000]

const AI_LOADING_STEPS = [
  { emoji: '🗺️', label: 'Planning your route...',                sub: 'Mapping the best day-by-day flow' },
  { emoji: '🚂', label: 'Finding best transport options...',     sub: 'Trains, flights and buses from your city' },
  { emoji: '🏨', label: 'Searching hotels in your budget...',    sub: 'Real hotels matched to your travel style' },
  { emoji: '📍', label: 'Curating places to visit...',          sub: 'Top spots tailored to your interests' },
  { emoji: '🍽️', label: 'Picking restaurants near your places...', sub: 'Local gems and must-try dishes' },
  { emoji: '💰', label: 'Optimising your budget...',            sub: 'Making every rupee count' },
  { emoji: '✨', label: 'Finalising your perfect trip...',       sub: 'Putting it all together' },
]

const TOTAL_QUESTIONS = 10

// ─── SuggestInput ─────────────────────────────────────────────────────────────

function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  const isExact = suggestions.some(s => s.toLowerCase() === value.toLowerCase())
  const filtered =
    value.length > 0 && !isExact
      ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
      : []

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => setCursor(-1), [value])

  function handleKey(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); onChange(filtered[cursor]); setOpen(false) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Input
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setCursor(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          className={`h-12 text-base ${value ? 'pr-8' : ''}`}
        />
        {value && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(''); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === cursor ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({
  label,
  value,
  min,
  max,
  onChange,
  sub,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  sub?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-blue-400 transition-colors"
        >
          −
        </button>
        <span className="text-xl font-bold w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold hover:border-blue-400 transition-colors"
        >
          +
        </button>
      </div>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

function NewTripForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [question, setQuestion] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward')
  const [visible, setVisible] = useState(true)

  const [form, setForm] = useState<TripForm>({
    destination: searchParams.get('destination') || '',
    isMultiCity: false,
    extraDestinations: [],
    start_city: '',
    start_date: '',
    end_date: '',
    groupType: 'couple',
    group_size: 2,
    children: 0,
    total_budget: 50000,
    useCustomBudget: false,
    travel_style: 'comfort',
    interests: [],
    diet: 'any',
    transport_pref: 'train',
  })

  // Extra city input state
  const [extraCityInput, setExtraCityInput] = useState('')

  const duration =
    form.start_date && form.end_date ? getTripDuration(form.start_date, form.end_date) : 0

  // ── Navigation helpers ───────────────────────────────────────────────────

  const animateTo = useCallback(
    (next: number, dir: 'forward' | 'back') => {
      setAnimDir(dir)
      setVisible(false)
      setTimeout(() => {
        setQuestion(next)
        setVisible(true)
      }, 180)
    },
    []
  )

  const goNext = useCallback(() => {
    if (question < TOTAL_QUESTIONS) animateTo(question + 1, 'forward')
  }, [question, animateTo])

  const goBack = useCallback(() => {
    if (question > 1) animateTo(question - 1, 'back')
  }, [question, animateTo])

  // ── Quick-date helpers ───────────────────────────────────────────────────

  function setQuickDays(n: number) {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + n - 1)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    setForm(f => ({ ...f, start_date: fmt(start), end_date: fmt(end) }))
  }

  // ── Group type side-effects ──────────────────────────────────────────────

  function pickGroupType(gt: TripForm['groupType']) {
    const defaults: Record<TripForm['groupType'], { group_size: number; children: number }> = {
      solo:      { group_size: 1,  children: 0 },
      couple:    { group_size: 2,  children: 0 },
      family:    { group_size: 2,  children: 2 },
      friends:   { group_size: 4,  children: 0 },
      corporate: { group_size: 10, children: 0 },
    }
    setForm(f => ({ ...f, groupType: gt, ...defaults[gt] }))
  }

  // ── Multi-city helpers ───────────────────────────────────────────────────

  function addExtraCity() {
    const city = extraCityInput.trim()
    if (!city) return
    if (form.extraDestinations.length >= 3) { toast.error('Max 3 extra cities'); return }
    if (form.extraDestinations.includes(city)) { toast.error('City already added'); return }
    setForm(f => ({ ...f, extraDestinations: [...f.extraDestinations, city] }))
    setExtraCityInput('')
  }

  function removeExtraCity(city: string) {
    setForm(f => ({ ...f, extraDestinations: f.extraDestinations.filter(c => c !== city) }))
  }

  // ── Interest toggle ──────────────────────────────────────────────────────

  function toggleInterest(key: string) {
    setForm(f => {
      if (f.interests.includes(key)) return { ...f, interests: f.interests.filter(k => k !== key) }
      if (f.interests.length >= 5) { toast.error('Pick up to 5 interests'); return f }
      return { ...f, interests: [...f.interests, key] }
    })
  }

  // ── Can advance? ─────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    switch (question) {
      case 1:  return form.destination.trim().length > 0
      case 2:  return !form.isMultiCity || form.extraDestinations.length >= 1
      case 3:  return form.start_city.trim().length > 0
      case 4:  return !!form.start_date && !!form.end_date && duration >= 1
      case 5:  return true
      case 6:  return form.total_budget > 0
      case 7:  return true
      case 8:  return form.interests.length > 0
      case 9:  return true
      case 10: return true
      default: return true
    }
  }

  // ── AI loading animation ─────────────────────────────────────────────────

  useEffect(() => {
    if (!generating) return
    setAiStep(0)
    let current = 0
    const interval = setInterval(() => {
      current++
      if (current >= AI_LOADING_STEPS.length) { clearInterval(interval); return }
      setAiStep(current)
    }, 1600)
    return () => clearInterval(interval)
  }, [generating])

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.destination || !form.start_date || !form.end_date || !form.start_city) {
      toast.error('Please complete all required fields')
      return
    }
    if (duration < 1) { toast.error('End date must be after start date'); return }

    setGenerating(true)

    try {
      const allDestinations = [form.destination, ...form.extraDestinations]

      const planPayload = {
        destination: form.destination,
        extra_destinations: form.extraDestinations,
        start_city: form.start_city,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: duration,
        group_type: form.groupType,
        group_size: form.group_size,
        children: form.children,
        total_budget: form.total_budget,
        travel_style: form.travel_style,
        interests: form.interests,
        diet: form.diet,
        transport_pref: form.transport_pref,
      }

      // 1. Generate full AI plan
      const planRes = await fetch('/api/ai/full-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planPayload),
      })
      const planData = await planRes.json()
      if (!planRes.ok) throw new Error(planData.error || 'AI plan generation failed')

      // 2. Create trip record
      const tripRes = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: allDestinations.join(' → '),
          start_city: form.start_city,
          start_date: form.start_date,
          end_date: form.end_date,
          total_days: duration,
          total_budget: form.total_budget,
          travel_style: form.travel_style,
          group_size: form.group_size,
          children: form.children,
          title: `${allDestinations.join(' → ')} Trip`,
        }),
      })
      const tripData = await tripRes.json()
      if (!tripRes.ok) throw new Error(tripData.error || 'Failed to create trip')
      const tripId: string = tripData.id

      // 3. Save generated itinerary
      if (planData.days?.length) {
        const startDate = new Date(form.start_date)
        const daysWithDates = (planData.days as Array<{ day_number: number } & Record<string, unknown>>).map(
          (d, i) => {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            return { ...d, date: date.toISOString().split('T')[0] }
          }
        )

        await fetch(`/api/trips/${tripId}/save-itinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            days: daysWithDates,
            ai_meta: {
              budget_breakdown: planData.budget_breakdown,
              route: planData.route,
              hotels: planData.hotels,
              quick_tips: planData.quick_tips,
            },
          }),
        })
      }

      setAiStep(AI_LOADING_STEPS.length) // mark done
      await new Promise(r => setTimeout(r, 500))
      router.push(`/trips/${tripId}?generated=1`)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  // ── Summary strip (shown from question 4 onwards) ────────────────────────

  const summaryParts: string[] = []
  if (form.destination) summaryParts.push(form.destination)
  if (form.extraDestinations.length) summaryParts.push(...form.extraDestinations)
  if (duration > 0) summaryParts.push(`${duration} days`)
  if (form.groupType) summaryParts.push(GROUP_TYPES.find(g => g.value === form.groupType)?.label ?? '')
  if (form.total_budget > 0 && question >= 7) summaryParts.push(formatINR(form.total_budget))

  // ─────────────────────────────────────────────────────────────────────────
  // AI Loading screen
  // ─────────────────────────────────────────────────────────────────────────

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative w-full max-w-md text-center">
          {/* Pulsing orb */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" />
            <div
              className="absolute inset-2 bg-blue-400 rounded-full opacity-30 animate-ping"
              style={{ animationDelay: '0.3s' }}
            />
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-1">
            Planning your {form.destination} trip
          </h2>
          <p className="text-blue-200 text-sm mb-8">
            {duration} days · {formatINR(form.total_budget)} · {form.travel_style}
          </p>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4 text-left">
            {AI_LOADING_STEPS.map((s, i) => {
              const done = aiStep > i
              const current = aiStep === i
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    done || current ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg transition-colors ${
                      done
                        ? 'bg-green-400'
                        : current
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-white/20'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5 text-white" /> : <span>{s.emoji}</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${done || current ? 'text-white' : 'text-white/50'}`}>
                      {s.label}
                    </p>
                    {current && <p className="text-xs text-blue-200 mt-0.5">{s.sub}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-blue-300 text-xs mt-6">
            Powered by Llama 3.3 · Usually takes 20–35 seconds
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Questionnaire UI
  // ─────────────────────────────────────────────────────────────────────────

  const progress = Math.round((question / TOTAL_QUESTIONS) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Fixed top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">TripWise AI</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{question} / {TOTAL_QUESTIONS}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Summary strip (visible from question 4 onwards) */}
      {question >= 4 && summaryParts.length > 0 && (
        <div className="bg-blue-600 text-white text-xs font-medium py-2 px-4 text-center tracking-wide">
          {summaryParts.filter(Boolean).join(' · ')}
        </div>
      )}

      {/* Question card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div
            className="transition-all duration-200"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? 'translateY(0)'
                : animDir === 'forward'
                ? 'translateY(12px)'
                : 'translateY(-12px)',
            }}
          >
            {/* ── Q1: Destination ─────────────────────────────────────── */}
            {question === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 1
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    Where do you want to go?
                  </h1>
                  <p className="text-gray-500 mt-1">Pick any destination in India</p>
                </div>

                <SuggestInput
                  value={form.destination}
                  onChange={v => setForm(f => ({ ...f, destination: v }))}
                  suggestions={INDIAN_CITIES}
                  placeholder="Search city, state or region…"
                />

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Popular destinations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DESTINATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, destination: d }))}
                        className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-all ${
                          form.destination === d
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Q2: Multi-city ──────────────────────────────────────── */}
            {question === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 2
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    Single destination or multi-city?
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: false, label: 'One Destination', emoji: '📍', desc: 'Deep dive into one place' },
                    { value: true,  label: 'Multi-city',      emoji: '🗺️', desc: '2–4 cities in one trip' },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isMultiCity: opt.value, extraDestinations: opt.value ? f.extraDestinations : [] }))}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        form.isMultiCity === opt.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{opt.emoji}</div>
                      <div className="font-bold text-gray-900">{opt.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {form.isMultiCity && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Add cities after <span className="text-blue-600">{form.destination}</span>:
                    </p>
                    <div className="flex gap-2">
                      <SuggestInput
                        value={extraCityInput}
                        onChange={setExtraCityInput}
                        suggestions={INDIAN_CITIES}
                        placeholder="Add a city…"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addExtraCity}
                        disabled={!extraCityInput.trim() || form.extraDestinations.length >= 3}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.extraDestinations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.extraDestinations.map(city => (
                          <span
                            key={city}
                            className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => removeExtraCity(city)}
                              className="hover:text-blue-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Route will be: {[form.destination, ...form.extraDestinations].join(' → ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Q3: Starting city ───────────────────────────────────── */}
            {question === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 3
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    Where are you starting from?
                  </h1>
                  <p className="text-gray-500 mt-1">
                    We'll plan transport from your city to {form.destination}
                  </p>
                </div>
                <SuggestInput
                  value={form.start_city}
                  onChange={v => setForm(f => ({ ...f, start_city: v }))}
                  suggestions={INDIAN_CITIES}
                  placeholder="Your home / departure city…"
                />
              </div>
            )}

            {/* ── Q4: Dates ───────────────────────────────────────────── */}
            {question === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 4
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    When are you travelling?
                  </h1>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[3, 5, 7, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuickDays(n)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        duration === n
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {n} days
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      min={form.start_date || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                </div>

                {duration > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 text-center">
                    <span className="text-3xl font-extrabold text-blue-700">{duration}</span>
                    <span className="text-blue-600 font-semibold text-lg"> day{duration !== 1 ? 's' : ''}</span>
                    <span className="text-blue-400 text-sm"> to {form.destination}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Q5: Group ───────────────────────────────────────────── */}
            {question === 5 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 5
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    Who's joining you?
                  </h1>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GROUP_TYPES.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => pickGroupType(g.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        form.groupType === g.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-1">{g.emoji}</div>
                      <div className="font-semibold text-gray-900 text-sm">{g.label}</div>
                      <div className="text-xs text-gray-500">{g.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <Counter
                    label="Adults"
                    value={form.group_size}
                    min={1}
                    max={30}
                    onChange={v => setForm(f => ({ ...f, group_size: v }))}
                    sub={form.group_size === 1 ? 'Solo traveller' : form.group_size === 2 ? 'Couple' : `${form.group_size} adults`}
                  />
                  <Counter
                    label="Children 👶"
                    value={form.children}
                    min={0}
                    max={10}
                    onChange={v => setForm(f => ({ ...f, children: v }))}
                    sub="Under 12 years"
                  />
                </div>
              </div>
            )}

            {/* ── Q6: Budget ──────────────────────────────────────────── */}
            {question === 6 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 6
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    What's your total trip budget?
                  </h1>
                  <p className="text-gray-500 mt-1">For all {form.group_size} people, {duration} days</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {BUDGET_PRESETS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, total_budget: amt, useCustomBudget: false }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        !form.useCustomBudget && form.total_budget === amt
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-900">{formatINR(amt)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatINR(Math.round(amt / form.group_size))} per person
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, useCustomBudget: true }))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      form.useCustomBudget
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-900">Custom ✏️</div>
                    <div className="text-xs text-gray-500 mt-0.5">Enter your amount</div>
                  </button>
                </div>

                {form.useCustomBudget && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <Label className="text-sm font-medium">Enter budget (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                      <Input
                        type="number"
                        className="pl-8 h-12 text-lg font-semibold"
                        placeholder="50000"
                        value={form.total_budget || ''}
                        onChange={e =>
                          setForm(f => ({ ...f, total_budget: parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                )}

                {form.total_budget > 0 && duration > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Per person</div>
                      <div className="font-bold text-gray-900 text-lg">
                        {formatINR(Math.round(form.total_budget / form.group_size))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Per day</div>
                      <div className="font-bold text-gray-900 text-lg">
                        {formatINR(Math.round(form.total_budget / duration))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Q7: Travel style ────────────────────────────────────── */}
            {question === 7 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 7
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    How do you like to travel?
                  </h1>
                </div>

                <div className="space-y-3">
                  {TRAVEL_STYLES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, travel_style: s.value }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        form.travel_style === s.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{s.label}</div>
                        <div className="text-sm text-gray-500">{s.desc}</div>
                      </div>
                      <span className="text-sm text-blue-600 font-semibold shrink-0">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Q8: Interests ───────────────────────────────────────── */}
            {question === 8 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 8
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    What do you enjoy most?
                  </h1>
                  <p className="text-gray-500 mt-1">Pick up to 5 interests</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const selected = form.interests.includes(interest.key)
                    return (
                      <button
                        key={interest.key}
                        type="button"
                        onClick={() => toggleInterest(interest.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 bg-white'
                        }`}
                      >
                        <span>{interest.emoji}</span> {interest.label}
                      </button>
                    )
                  })}
                </div>

                {form.interests.length > 0 && (
                  <p className="text-sm text-blue-600 font-medium">
                    {form.interests.length}/5 selected
                  </p>
                )}
              </div>
            )}

            {/* ── Q9: Diet ────────────────────────────────────────────── */}
            {question === 9 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 9
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    Food preference?
                  </h1>
                  <p className="text-gray-500 mt-1">We'll suggest restaurants that suit you</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {DIET_OPTIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, diet: d.value }))}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        form.diet === d.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{d.emoji}</div>
                      <div className="font-bold text-gray-900">{d.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Q10: Transport ──────────────────────────────────────── */}
            {question === 10 && (
              <div className="space-y-6">
                <div>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">
                    Question 10
                  </p>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    How do you prefer to travel between cities?
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TRANSPORT_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, transport_pref: t.value }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        form.transport_pref === t.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.emoji}</div>
                      <div className="font-bold text-gray-900 text-sm">{t.label}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Final CTA */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-1">
                  <p className="font-semibold text-gray-900">Ready to generate your trip!</p>
                  <p className="text-sm text-gray-600">
                    {form.destination}
                    {form.extraDestinations.length > 0 && ` → ${form.extraDestinations.join(' → ')}`}
                    {' · '}{duration} days{' · '}{formatINR(form.total_budget)}{' · '}{form.travel_style}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation buttons ─────────────────────────────────── */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {question > 1 ? (
              <Button variant="outline" onClick={goBack} className="gap-2 rounded-xl">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {question < TOTAL_QUESTIONS ? (
              <Button
                onClick={goNext}
                disabled={!canAdvance()}
                className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance()}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-8 h-11 text-base font-bold shadow-lg shadow-blue-200"
              >
                <Sparkles className="h-5 w-5" /> Generate My Trip
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 pb-6">
        Free forever · No credit card · Powered by Llama 3.3
      </p>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function NewTripPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewTripForm />
    </Suspense>
  )
}
