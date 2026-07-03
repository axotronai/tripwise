'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import {
  Sparkles, Train, Map, IndianRupee, Calendar, Users, Loader2,
  Share2, Hotel, CheckCircle2, Pencil, RefreshCw, X, Settings,
  Backpack, Utensils, Lightbulb, ArrowRight, UtensilsCrossed, AlertTriangle, Compass, Printer, Receipt,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import DayColumn from '@/components/trip/DayColumn'
import AiChatBubble from '@/components/trip/AiChatBubble'
import BudgetTracker from '@/components/budget/BudgetTracker'
import TransportSearch, { AddedTransport } from '@/components/transport/TransportSearch'
import RestaurantSearch from '@/components/trip/RestaurantSearch'
import PlacesExplorer from '@/components/trip/PlacesExplorer'
import ExpenseTracker from '@/components/trip/ExpenseTracker'
import PlanWizard from '@/components/planning/PlanWizard'
import WeatherWidget from '@/components/trip/WeatherWidget'
import CreditCardWidget from '@/components/affiliate/CreditCardWidget'
import InsuranceBanner from '@/components/affiliate/InsuranceBanner'
import DealsBar from '@/components/affiliate/DealsBar'
import { SelectedHotel, TripDay } from '@/components/hotel/HotelSearch'
import { useTripStore } from '@/store/tripStore'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Activity, ItineraryDay, Trip, TravelStyle, Transport } from '@/types'
import { calcBudgetBreakdown, formatINR, generateDays } from '@/lib/utils/trip'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const TripMap    = dynamic(() => import('@/components/map/TripMap'),       { ssr: false, loading: () => <MapSkeleton /> })
const HotelSearch = dynamic(() => import('@/components/hotel/HotelSearch'), { ssr: false })

function MapSkeleton() {
  return <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">Loading map…</div>
}

function createDemoTrip(id: string): Trip {
  const today = new Date()
  const fmt   = (d: Date) => d.toISOString().split('T')[0]
  return {
    id, user_id: 'demo', title: 'Goa Trip', destination: 'Goa', start_city: 'Mumbai',
    start_date: fmt(today), end_date: fmt(new Date(today.getTime() + 4 * 86400000)),
    total_days: 5, total_budget: 25000, travel_style: 'comfort', group_size: 2,
    created_at: new Date().toISOString(),
  }
}

function completionPct(days: ItineraryDay[]) {
  if (!days.length) return 0
  return Math.round(days.filter(d => d.activities.length > 0).length / days.length * 100)
}

function parseDayNotes(notes?: string) {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    if (line.startsWith('Theme: '))  result.theme = line.slice(7)
    if (line.startsWith('Hotel: '))  result.hotel = line.slice(7)
    if (line.startsWith('Food: '))   result.food  = line.slice(6)
    if (line.startsWith('Tip: '))    result.tip   = line.slice(5)
  }
  return result
}

const TRAVEL_STYLES: { value: TravelStyle; label: string; emoji: string }[] = [
  { value: 'budget',    label: 'Budget',    emoji: '🎒' },
  { value: 'comfort',   label: 'Comfort',   emoji: '🏨' },
  { value: 'luxury',    label: 'Luxury',    emoji: '✨' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗' },
  { value: 'family',    label: 'Family',    emoji: '👨‍👩‍👧' },
]

interface AiInsights {
  trip_summary?: string
  transport_to_destination?: { mode: string; detail: string; estimated_cost: number; duration: string }
  return_transport?: { mode: string; detail: string; estimated_cost: number; duration: string }
  best_local_foods?: string[]
  packing_essentials?: string[]
  money_saving_tips?: string[]
}

function TripPageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const justGenerated = searchParams.get('generated') === '1'

  const { currentTrip, days, budgetBreakdown,
    setCurrentTrip, setDays, setBudgetBreakdown,
    addActivity, removeActivity, updateActivity, reorderActivities, moveActivity } = useTripStore()

  const [activeDay,      setActiveDay]      = useState(justGenerated ? 0 : -1)
  const [aiLoading,      setAiLoading]      = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [editBudget,     setEditBudget]     = useState(false)
  const [newBudget,      setNewBudget]      = useState(0)
  const [editTitle,      setEditTitle]      = useState(false)
  const [newTitle,       setNewTitle]       = useState('')
  const [showSettings,   setShowSettings]   = useState(false)
  const [settings,       setSettings]       = useState({ total_budget: 0, travel_style: 'comfort' as TravelStyle, group_size: 1, children: 0 })
  const [savingSettings, setSavingSettings] = useState(false)
  const [isGuest,        setIsGuest]        = useState(false)
  const [aiInsights, setAiInsights] = useState<AiInsights>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(`insights-${id}`) || '{}') } catch { return {} }
  })
  const [dayHotels,         setDayHotels]         = useState<Record<string, SelectedHotel>>({}) // dayId → hotel
  const [savedTransports,   setSavedTransports]   = useState<Transport[]>([])
  const [addedTransportIds, setAddedTransportIds] = useState<Set<string>>(new Set())
  const [budgetWarning,     setBudgetWarning]     = useState<string | null>(null)
  const [showWizard,        setShowWizard]        = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res  = await fetch(`/api/trips/${id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCurrentTrip(data.trip)
        setNewTitle(data.trip.title)

        let sessionUserId: string | null = null
        if (isSupabaseConfigured()) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          sessionUserId = user?.id ?? null
        }
        setIsGuest(!sessionUserId || sessionUserId !== data.trip.user_id)
        setSettings({ total_budget: data.trip.total_budget, travel_style: data.trip.travel_style, group_size: data.trip.group_size, children: data.trip.children ?? 0 })
        setNewBudget(data.trip.total_budget)
        const daysWithIds = (data.days?.length ? data.days : generateDays(data.trip.start_date, data.trip.end_date, data.trip.destination))
          .map((d: ItineraryDay, i: number) => ({ ...d, id: d.id || `day-${i}`, trip_id: data.trip.id, activities: d.activities || [] }))
        setDays(daysWithIds)
        setBudgetBreakdown(calcBudgetBreakdown(data.trip.total_budget, data.trip.travel_style, data.trip.total_days, data.trip.group_size, data.trip.children ?? 0))

        // Load persisted hotels and transports
        const [hotelsRes, transportsRes] = await Promise.all([
          fetch(`/api/trips/${id}/hotels`),
          fetch(`/api/trips/${id}/transports`),
        ])
        if (hotelsRes.ok) {
          const { dayHotels: loaded } = await hotelsRes.json()
          if (loaded) setDayHotels(loaded)
        }
        if (transportsRes.ok) {
          const { transports: loaded } = await transportsRes.json()
          if (loaded) {
            setSavedTransports(loaded)
            setAddedTransportIds(new Set((loaded as Transport[]).map(t => t.id)))
          }
        }
      } catch {
        const demo = createDemoTrip(id)
        setCurrentTrip(demo)
        setNewTitle(demo.title)
        setIsGuest(true)
        setNewBudget(demo.total_budget)
        setSettings({ total_budget: demo.total_budget, travel_style: demo.travel_style, group_size: demo.group_size, children: 0 })
        const demoDays = generateDays(demo.start_date, demo.end_date, demo.destination)
          .map((d, i) => ({ ...d, id: `day-${i}`, trip_id: demo.id, activities: [] }))
        setDays(demoDays)
        setBudgetBreakdown(calcBudgetBreakdown(demo.total_budget, demo.travel_style, demo.total_days, demo.group_size, 0))
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source: s, destination: d } = result
    if (!d) return
    if (s.droppableId === d.droppableId) {
      const day = days.find(x => x.id === s.droppableId)
      if (!day) return
      const reordered = [...day.activities]
      const [moved] = reordered.splice(s.index, 1)
      reordered.splice(d.index, 0, moved)
      reorderActivities(s.droppableId, reordered.map((a, i) => ({ ...a, order_index: i })))
    } else {
      const fromDay  = days.find(x => x.id === s.droppableId)
      const activity = fromDay?.activities[s.index]
      if (activity) moveActivity(s.droppableId, d.droppableId, activity)
    }
  }, [days, reorderActivities, moveActivity])

  const handleAddActivity = useCallback((dayId: string, activity: Omit<Activity, 'id'>) => {
    addActivity(dayId, { ...activity, id: `act-${Date.now()}-${Math.random().toString(36).slice(2)}` })
    toast.success('Activity added')
  }, [addActivity])

  const handleDeleteActivity = useCallback((dayId: string, activityId: string) => {
    removeActivity(dayId, activityId)
  }, [removeActivity])

  const handleEditActivity = useCallback((dayId: string, activity: Activity) => {
    updateActivity(dayId, activity)
    toast.success('Activity updated')
  }, [updateActivity])

  const handleReplaceActivity = useCallback((dayId: string, activity: Activity) => {
    updateActivity(dayId, activity)
    toast.success(`Replaced with "${activity.name}"`)
  }, [updateActivity])

  const handleRefineDay = useCallback((dayId: string, updatedActivities: Activity[]) => {
    setDays(days.map(d => d.id === dayId ? { ...d, activities: updatedActivities } : d))
  }, [days, setDays])

  const handleSelectHotel = useCallback(async (hotel: SelectedHotel, dayIds: string[]) => {
    setDayHotels(prev => {
      const next = { ...prev }
      dayIds.forEach(dId => { next[dId] = hotel })
      return next
    })
    try {
      await fetch(`/api/trips/${id}/hotels`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel, dayIds }),
      })
      toast.success(`${hotel.name} saved to your trip!`)
    } catch { toast.error('Could not save hotel') }
  }, [id])

  const handleRemoveHotel = useCallback(async (dayId: string) => {
    setDayHotels(prev => { const n = { ...prev }; delete n[dayId]; return n })
    try {
      await fetch(`/api/trips/${id}/hotels?dayId=${dayId}`, { method: 'DELETE' })
    } catch { /* silent */ }
  }, [id])

  const handleAddTransport = useCallback(async (t: AddedTransport) => {
    try {
      const res = await fetch(`/api/trips/${id}/transports`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      })
      if (!res.ok) throw new Error()
      const { transport } = await res.json()
      setSavedTransports(prev => [...prev, transport])
      setAddedTransportIds(prev => new Set([...prev, transport.id]))
      toast.success(`${t.operator} added to your trip!`)
    } catch { toast.error('Could not save transport') }
  }, [id])

  async function saveTitle() {
    if (!currentTrip || !newTitle.trim()) return
    try {
      await fetch(`/api/trips/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      setCurrentTrip({ ...currentTrip, title: newTitle.trim() })
      setEditTitle(false)
      toast.success('Title updated')
    } catch { toast.error('Could not save title') }
  }

  async function generateAI() {
    if (!currentTrip) return
    setAiLoading(true)
    try {
      const res  = await fetch('/api/ai/itinerary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination:     currentTrip.destination,
          days:            currentTrip.total_days,
          budget:          currentTrip.total_budget,
          travel_style:    currentTrip.travel_style,
          group_size:      currentTrip.group_size,
          children:        currentTrip.children ?? 0,
          diet:            currentTrip.diet ?? 'any',
          start_city:      currentTrip.start_city,
          start_date:      currentTrip.start_date,
          dayHotels,
          savedTransports,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Show budget warning if AI exceeded budget
      if (data.budget_warning) {
        setBudgetWarning(data.budget_warning)
        toast.warning('Budget note: ' + data.budget_warning)
      } else {
        setBudgetWarning(null)
      }

      // Store AI insights (persisted to localStorage so tab survives refresh)
      const insights: AiInsights = {
        trip_summary:             data.trip_summary,
        transport_to_destination: data.transport_to_destination,
        return_transport:         data.return_transport,
        best_local_foods:         data.best_local_foods,
        packing_essentials:       data.packing_essentials,
        money_saving_tips:        data.money_saving_tips,
      }
      setAiInsights(insights)
      // Persist insights locally (fast) AND to server (durable, cross-device)
      try { localStorage.setItem(`insights-${id}`, JSON.stringify(insights)) } catch { /* storage full */ }
      // Fire-and-forget server sync — non-blocking so it doesn't slow the UI
      fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_insights: JSON.stringify(insights) }),
      }).catch(() => { /* sync failure is non-critical — localStorage still works */ })

      const startDate = new Date(currentTrip.start_date)
      const updated = days.map((day, i) => {
        const aiDay = data.days?.[i]
        if (!aiDay) return day
        return {
          ...day, city: aiDay.city || day.city,
          notes: [
            aiDay.theme            ? `Theme: ${aiDay.theme}`                                                   : '',
            aiDay.hotel_suggestion ? `Hotel: ${aiDay.hotel_suggestion} (₹${aiDay.hotel_cost_per_night}/night)` : '',
            aiDay.food_plan        ? `Food: ${aiDay.food_plan}`                                                : '',
            aiDay.local_tip        ? `Tip: ${aiDay.local_tip}`                                                 : '',
          ].filter(Boolean).join('\n'),
          activities: (aiDay.activities || []).map((a: Activity, j: number) => ({
            ...a, id: `ai-${day.id}-${j}`, day_id: day.id, order_index: j,
          })),
        }
      })
      setDays(updated)

      const daysWithDates = data.days?.map((d: Record<string, unknown>, i: number) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        return { ...d, date: date.toISOString().split('T')[0] }
      })
      if (daysWithDates) {
        await fetch(`/api/trips/${id}/save-itinerary`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: daysWithDates }),
        })
      }

      toast.success('AI itinerary generated and saved!')
      setActiveDay(0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      toast.error(msg || 'AI generation failed — check your GROQ_API_KEY in .env.local')
    } finally { setAiLoading(false) }
  }

  async function saveBudget() {
    const MAX_BUDGET = 10_000_000 // ₹1 crore
    if (!currentTrip || newBudget < 1000 || newBudget > MAX_BUDGET) {
      toast.error(`Budget must be between ₹1,000 and ${formatINR(MAX_BUDGET)}`)
      return
    }
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_budget: newBudget }),
      })
      if (!res.ok) throw new Error()
      setCurrentTrip({ ...currentTrip, total_budget: newBudget })
      setBudgetBreakdown(calcBudgetBreakdown(newBudget, currentTrip.travel_style, currentTrip.total_days, currentTrip.group_size, currentTrip.children ?? 0))
      setEditBudget(false)
      toast.success('Budget updated')
    } catch { toast.error('Could not save budget') }
  }

  async function saveSettings() {
    if (!currentTrip) return
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setCurrentTrip({ ...currentTrip, ...settings })
      setBudgetBreakdown(calcBudgetBreakdown(settings.total_budget, settings.travel_style, currentTrip.total_days, settings.group_size, settings.children ?? 0))
      setShowSettings(false)
      toast.success('Settings saved — regenerate AI to apply changes')
    } catch { toast.error('Could not save settings') }
    finally { setSavingSettings(false) }
  }

  function shareTrip() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Trip link copied!')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-500">Loading your trip…</p>
      </div>
    </div>
  )
  if (!currentTrip) return null

  const allActivities   = days.flatMap(d => d.activities)
  const pct             = completionPct(days)
  const activityCost    = allActivities.reduce((s, a) => s + (a.is_free ? 0 : a.cost), 0)
  const hotelCostTotal  = Object.values(dayHotels).reduce((s, h) => s + h.price_per_night, 0)
  const transportCost   = savedTransports.reduce((s, t) => s + t.cost, 0)
  const totalSpent      = activityCost + hotelCostTotal + transportCost
  const overBudget    = totalSpent > currentTrip.total_budget
  const hasInsights   = !!(aiInsights.trip_summary || aiInsights.best_local_foods?.length)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

      {/* Trip Header */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">

            {/* Editable Title */}
            {editTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditTitle(false) }}
                  className="text-xl font-bold h-9 max-w-xs"
                  autoFocus
                />
                <button onClick={saveTitle} className="text-green-600 hover:text-green-700"><CheckCircle2 className="h-5 w-5" /></button>
                <button onClick={() => setEditTitle(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors group"
                  onClick={() => setEditTitle(true)}
                  title="Click to edit title"
                >
                  {currentTrip.title}
                  <Pencil className="h-3.5 w-3.5 inline ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </h1>
                <Badge variant="outline" className="capitalize shrink-0">{currentTrip.travel_style}</Badge>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(currentTrip.start_date), 'd MMM')} – {format(new Date(currentTrip.end_date), 'd MMM yyyy')}
                <span className="text-blue-600 font-medium ml-1">({currentTrip.total_days}d)</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentTrip.group_size} adult{currentTrip.group_size !== 1 ? 's' : ''}
                {(currentTrip.children ?? 0) > 0 && ` · ${currentTrip.children} child${(currentTrip.children ?? 0) > 1 ? 'ren' : ''}`}
              </span>

              {editBudget ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">₹</span>
                  <Input type="number" value={newBudget} onChange={e => setNewBudget(parseInt(e.target.value) || 0)}
                    className="h-7 w-32 text-sm" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveBudget(); if (e.key === 'Escape') setEditBudget(false) }} />
                  <button onClick={saveBudget} className="text-green-600 hover:text-green-700"><CheckCircle2 className="h-4 w-4" /></button>
                  <button onClick={() => setEditBudget(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button onClick={() => setEditBudget(true)}
                  className={`flex items-center gap-1 group ${overBudget ? 'text-red-500' : 'text-gray-500'}`}>
                  <IndianRupee className="h-4 w-4" />
                  <span className="font-medium">{formatINR(currentTrip.total_budget)}</span>
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                </button>
              )}

              {totalSpent > 0 && (
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${overBudget ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {formatINR(totalSpent)} planned {overBudget ? '⚠ over budget' : '✓ within budget'}
                </span>
              )}
            </div>

            {totalSpent > 0 && (
              <div className="space-y-1 pt-1 max-w-sm">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Budget used</span>
                  <span>{Math.min(100, Math.round(totalSpent / currentTrip.total_budget * 100))}%</span>
                </div>
                <Progress value={Math.min(totalSpent / currentTrip.total_budget * 100, 100)}
                  className={`h-1.5 ${overBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`} />
              </div>
            )}

            <div className="space-y-1 max-w-sm">
              <div className="flex justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Planning progress</span>
                <span>{pct}% · {days.filter(d => d.activities.length).length}/{days.length} days</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          </div>

          {/* ── Action buttons — 2 primary CTAs always visible; rest in ⋯ on mobile ── */}
          <div className="flex gap-2 shrink-0 items-center flex-wrap sm:flex-nowrap">

            {/* Primary: Generate AI */}
            <Button onClick={generateAI} disabled={aiLoading}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md h-9">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden xs:inline">{aiLoading ? 'Generating…' : pct > 0 ? 'Regenerate' : 'Generate AI'}</span>
              <span className="xs:hidden text-xs">{aiLoading ? '…' : 'AI'}</span>
            </Button>

            {/* Primary: Plan Wizard */}
            <Button
              onClick={() => setShowWizard(true)}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md h-9 font-semibold"
            >
              🗺️ <span className="hidden sm:inline">Plan Step by Step</span>
              <span className="sm:hidden text-xs">Plan</span>
            </Button>

            {/* Secondary actions — visible on sm+, collapsed into ⋯ on mobile */}
            <div className="hidden sm:flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-1.5 h-9">
                <Settings className="h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={shareTrip} className="gap-1.5 h-9">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <a href={`/trips/${id}/print`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors h-9">
                <Printer className="h-4 w-4" /> Export PDF
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Check my ${currentTrip.total_days}-day trip to ${currentTrip.destination} on TripWise! ${window.location.href}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors h-9">
                💬 WhatsApp
              </a>
              <a href={`/packing-list?destination=${encodeURIComponent(currentTrip.destination)}&days=${currentTrip.total_days}&start_date=${currentTrip.start_date}&style=${currentTrip.travel_style}&group=${currentTrip.group_size}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors h-9">
                <Backpack className="h-4 w-4" /> Packing List
              </a>
            </div>

            {/* ⋯ overflow menu — mobile only */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" /> Edit Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareTrip}>
                  <Share2 className="h-4 w-4" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/trips/${id}/print`, '_blank', 'noopener,noreferrer')}>
                  <Printer className="h-4 w-4" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check my ${currentTrip.total_days}-day trip to ${currentTrip.destination} on TripWise! ${window.location.href}`)}`, '_blank', 'noopener,noreferrer')}>
                  <span>💬</span> Share on WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/packing-list?destination=${encodeURIComponent(currentTrip.destination)}&days=${currentTrip.total_days}&start_date=${currentTrip.start_date}&style=${currentTrip.travel_style}&group=${currentTrip.group_size}`, '_blank', 'noopener,noreferrer')}>
                  <Backpack className="h-4 w-4" /> Packing List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>

      {/* Success banner */}
      {justGenerated && pct > 0 && !isGuest && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Your AI trip plan is ready!</p>
            <p className="text-xs text-green-600 mt-0.5">All {days.length} days planned and saved. Click any activity to edit, or use ✨ on an activity to get AI alternatives.</p>
          </div>
        </div>
      )}

      {/* Guest save banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div>
            <p className="font-semibold text-sm">💾 Create a free account to save this trip</p>
            <p className="text-blue-200 text-xs mt-0.5">Your plan will be lost if you close this tab. Sign up free — takes 30 seconds.</p>
          </div>
          <a href="/login" className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm px-5 py-2 rounded-xl transition-colors">
            Save My Trip →
          </a>
        </div>
      )}

      {/* Budget warning from AI */}
      {budgetWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">AI Budget Note</p>
            <p className="text-xs text-amber-700 mt-0.5">{budgetWarning}</p>
          </div>
          <button onClick={() => setBudgetWarning(null)} className="text-amber-400 hover:text-amber-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Weather */}
      <WeatherWidget city={currentTrip.destination} />

      {/* Main Tabs */}
      <Tabs defaultValue="itinerary">
        <TabsList className="bg-white border shadow-sm w-full flex overflow-x-auto scrollbar-hide gap-0">
          <TabsTrigger value="itinerary"   className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Calendar        className="h-4 w-4 sm:h-4 sm:w-4" /><span>Itinerary</span></TabsTrigger>
          <TabsTrigger value="map"         className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Map             className="h-4 w-4" /><span>Map</span></TabsTrigger>
          <TabsTrigger value="transport"   className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Train           className="h-4 w-4" /><span>Transport</span></TabsTrigger>
          <TabsTrigger value="hotels"      className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Hotel           className="h-4 w-4" /><span>Hotels</span></TabsTrigger>
          <TabsTrigger value="restaurants" className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><UtensilsCrossed className="h-4 w-4" /><span>Food</span></TabsTrigger>
          <TabsTrigger value="places"      className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Compass         className="h-4 w-4" /><span>Places</span></TabsTrigger>
          <TabsTrigger value="budget"      className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><IndianRupee     className="h-4 w-4" /><span>Budget</span></TabsTrigger>
          <TabsTrigger value="expenses"    className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Receipt         className="h-4 w-4" /><span>Expenses</span></TabsTrigger>
          {hasInsights && (
            <TabsTrigger value="insights"  className="flex-col gap-0.5 py-2 px-2.5 sm:flex-row sm:gap-1.5 sm:py-2 sm:px-3 text-[10px] sm:text-sm shrink-0"><Sparkles        className="h-4 w-4" /><span>Insights</span></TabsTrigger>
          )}
        </TabsList>

        {/* Itinerary */}
        <TabsContent value="itinerary" className="mt-4">
          {/* Getting There — saved transports */}
          {savedTransports.length > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <Train className="h-3.5 w-3.5" /> Getting There
              </p>
              <div className="space-y-2">
                {savedTransports.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-lg px-3 py-2">
                    <span className="text-lg shrink-0">
                      {t.mode === 'train' ? '🚂' : t.mode === 'flight' ? '✈️' : '🚌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.operator}</p>
                      <p className="text-xs text-gray-500">{t.from_city} → {t.to_city} · {t.duration}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-blue-600">{formatINR(t.cost)}</p>
                      <button
                        onClick={async () => {
                          await fetch(`/api/trips/${id}/transports?transportId=${t.id}`, { method: 'DELETE' })
                          setSavedTransports(prev => prev.filter(x => x.id !== t.id))
                        }}
                        className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(dayHotels).length > 0 && (
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">🏨 Booked Hotels</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(
                  Object.values(dayHotels).reduce<Record<string, SelectedHotel>>((acc, h) => { acc[h.id] = h; return acc }, {})
                ).map(h => {
                  const bookedDayNums = days.filter(d => dayHotels[d.id]?.id === h.id).map(d => `D${d.day_number}`).join(', ')
                  return (
                    <div key={h.id} className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-1.5">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{h.name}</p>
                        <p className="text-xs text-purple-600">{formatINR(h.price_per_night)}/night · {bookedDayNums}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pct === 0 && (
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-800">Your itinerary is empty</p>
                <p className="text-sm text-blue-600 mt-0.5">Click "Generate with AI" for a complete day-by-day plan, or add activities manually.</p>
              </div>
              <Button size="sm" onClick={generateAI} disabled={aiLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0 px-6">
                <Sparkles className="h-4 w-4" /> Generate with AI
              </Button>
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-3">
              {days.map((day, i) => {
                const meta = parseDayNotes(day.notes)
                return (
                  <div key={day.id} className="space-y-0">
                    {(meta.theme || meta.hotel || meta.food || meta.tip) && (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 rounded-t-xl px-4 py-2.5 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        {meta.theme && <span className="font-semibold text-indigo-700 sm:col-span-2">✨ {meta.theme}</span>}
                        {meta.hotel && <span className="text-gray-600">🏨 {meta.hotel}</span>}
                        {meta.food  && <span className="text-gray-600">🍽️ {meta.food}</span>}
                        {meta.tip   && <span className="text-blue-600 italic sm:col-span-2">💡 {meta.tip}</span>}
                      </div>
                    )}
                    <div className={meta.theme || meta.hotel || meta.food || meta.tip ? 'rounded-b-xl overflow-hidden border border-t-0 border-blue-100' : ''}>
                      <DayColumn
                        day={day}
                        destination={currentTrip.destination}
                        startDate={currentTrip.start_date}
                        budget={currentTrip.total_budget}
                        travelStyle={currentTrip.travel_style}
                        isActive={activeDay === i}
                        onActivate={() => setActiveDay(activeDay === i ? -1 : i)}
                        onAddActivity={handleAddActivity}
                        onDeleteActivity={handleDeleteActivity}
                        onEditActivity={handleEditActivity}
                        onReplaceActivity={handleReplaceActivity}
                        onRefineDay={handleRefineDay}
                        hotel={dayHotels[day.id]}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <div className="h-[580px] rounded-2xl overflow-hidden border shadow-sm bg-gray-100">
            <TripMap activities={allActivities} destination={currentTrip.destination} />
          </div>
          {allActivities.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">Generate AI or add activities with locations to see them pinned on the map.</p>
          )}
        </TabsContent>

        <TabsContent value="transport" className="mt-4">
          {aiInsights.transport_to_destination && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> AI Recommended Transport
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl">{aiInsights.transport_to_destination.mode === 'train' ? '🚂' : aiInsights.transport_to_destination.mode === 'flight' ? '✈️' : '🚌'}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{aiInsights.transport_to_destination.detail}</p>
                  <p className="text-xs text-gray-500">{aiInsights.transport_to_destination.duration} · {formatINR(aiInsights.transport_to_destination.estimated_cost)} est.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 hidden sm:block" />
                <p className="text-xs text-gray-400">Search below to book</p>
              </div>
            </div>
          )}
          <TransportSearch
            defaultFrom={currentTrip.start_city}
            defaultTo={currentTrip.destination}
            onAddToTrip={handleAddTransport}
            addedTransportIds={addedTransportIds}
          />
          {/* Affiliate: Deals Bar */}
          <div className="mt-4">
            <DealsBar
              from={currentTrip.start_city}
              to={currentTrip.destination}
              date={currentTrip.start_date}
              adults={currentTrip.group_size}
              destination={currentTrip.destination}
            />
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="mt-4 space-y-4">
          <HotelSearch
            defaultCity={currentTrip.destination}
            checkin={currentTrip.start_date}
            checkout={currentTrip.end_date}
            tripDays={days.map((d): TripDay => ({ id: d.id, day_number: d.day_number, city: d.city, date: d.date }))}
            dayHotels={dayHotels}
            onSelectHotelForDays={handleSelectHotel}
            onRemoveHotelFromDay={handleRemoveHotel}
          />
          {/* Affiliate: Credit Card Widget */}
          <CreditCardWidget compact />
          {/* Affiliate: Insurance */}
          <InsuranceBanner
            destination={currentTrip.destination}
            totalDays={currentTrip.total_days}
            groupSize={currentTrip.group_size}
            totalBudget={currentTrip.total_budget}
            compact
          />
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4">
          <RestaurantSearch
            destination={currentTrip.destination}
            days={days}
            onAddToDay={handleAddActivity}
          />
        </TabsContent>

        <TabsContent value="places" className="mt-4">
          <PlacesExplorer
            destination={currentTrip.destination}
            days={days}
            travelStyle={currentTrip.travel_style}
            startDate={currentTrip.start_date}
            onAddToDay={handleAddActivity}
          />
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-4">
          {budgetBreakdown && (
            <BudgetTracker
              breakdown={budgetBreakdown}
              days={days}
              hotelCost={hotelCostTotal}
              hotelName={Object.keys(dayHotels).length > 0
                ? [...new Set(Object.values(dayHotels).map(h => h.name))].join(', ')
                : undefined}
            />
          )}
          {/* Affiliate: Full credit card comparison */}
          <CreditCardWidget />
          {/* Affiliate: Travel insurance */}
          <InsuranceBanner
            destination={currentTrip.destination}
            totalDays={currentTrip.total_days}
            groupSize={currentTrip.group_size}
            totalBudget={currentTrip.total_budget}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpenseTracker
            tripId={id}
            totalBudget={currentTrip.total_budget}
          />
        </TabsContent>

        {/* AI Insights Tab */}
        {hasInsights && (
          <TabsContent value="insights" className="mt-4 space-y-4">
            {aiInsights.trip_summary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Trip Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.trip_summary}</p>
              </div>
            )}

            {(aiInsights.transport_to_destination || aiInsights.return_transport) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transport</p>
                {aiInsights.transport_to_destination && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{aiInsights.transport_to_destination.mode === 'train' ? '🚂' : aiInsights.transport_to_destination.mode === 'flight' ? '✈️' : '🚌'}</span>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Getting there</p>
                      <p className="font-semibold text-gray-900 text-sm">{aiInsights.transport_to_destination.detail}</p>
                      <p className="text-xs text-gray-500">{aiInsights.transport_to_destination.duration} · {formatINR(aiInsights.transport_to_destination.estimated_cost)} est.</p>
                    </div>
                  </div>
                )}
                {aiInsights.return_transport && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <span className="text-3xl">{aiInsights.return_transport.mode === 'train' ? '🚂' : aiInsights.return_transport.mode === 'flight' ? '✈️' : '🚌'}</span>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Return journey</p>
                      <p className="font-semibold text-gray-900 text-sm">{aiInsights.return_transport.detail}</p>
                      <p className="text-xs text-gray-500">{aiInsights.return_transport.duration} · {formatINR(aiInsights.return_transport.estimated_cost)} est.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {aiInsights.best_local_foods && aiInsights.best_local_foods.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5" /> Must-Try Foods
                  </p>
                  <ul className="space-y-2">
                    {aiInsights.best_local_foods.map((food, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-orange-400">🍽️</span> {food}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.packing_essentials && aiInsights.packing_essentials.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Backpack className="h-3.5 w-3.5" /> Packing Essentials
                  </p>
                  <ul className="space-y-2">
                    {aiInsights.packing_essentials.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {aiInsights.money_saving_tips && aiInsights.money_saving_tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Money-Saving Tips
                </p>
                <ul className="space-y-2">
                  {aiInsights.money_saving_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500 shrink-0 mt-0.5">💡</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Trip Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Total Budget (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                <Input type="number" className="pl-7 h-11"
                  value={settings.total_budget}
                  onChange={e => setSettings(s => ({ ...s, total_budget: parseInt(e.target.value) || 0 }))} />
              </div>
              <p className="text-xs text-gray-500">
                {formatINR(Math.round(settings.total_budget / Math.max(currentTrip.total_days, 1)))} per day ·{' '}
                {formatINR(Math.round(settings.total_budget / Math.max(settings.group_size + (settings.children ?? 0), 1)))} per person
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Adults</Label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSettings(s => ({ ...s, group_size: Math.max(1, s.group_size - 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold hover:border-blue-400">−</button>
                  <span className="text-lg font-bold w-10 text-center">{settings.group_size}</span>
                  <button onClick={() => setSettings(s => ({ ...s, group_size: Math.min(20, s.group_size + 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold hover:border-blue-400">+</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Children 👶</Label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSettings(s => ({ ...s, children: Math.max(0, (s.children ?? 0) - 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold hover:border-orange-400">−</button>
                  <span className="text-lg font-bold w-10 text-center">{settings.children ?? 0}</span>
                  <button onClick={() => setSettings(s => ({ ...s, children: Math.min(10, (s.children ?? 0) + 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold hover:border-orange-400">+</button>
                </div>
                <p className="text-xs text-gray-400">under 12 years</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Travel Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {TRAVEL_STYLES.map(s => (
                  <button key={s.value} onClick={() => setSettings(st => ({ ...st, travel_style: s.value }))}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                      settings.travel_style === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <span className="text-xl">{s.emoji}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={saveSettings} disabled={savingSettings}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 gap-2">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center -mt-2">After saving, click "Regenerate AI" to apply the new settings to your plan.</p>
          </div>
        </div>
      )}

      {/* AI Chat Bubble */}
      <AiChatBubble
        trip={currentTrip}
        days={days}
        dayHotels={dayHotels}
        savedTransports={savedTransports}
      />

      {/* Step-by-step Planning Wizard */}
      {showWizard && (
        <PlanWizard
          trip={currentTrip}
          existingDays={days}
          onComplete={(newDays) => {
            setDays(newDays)
            setShowWizard(false)
            toast.success('🎉 Itinerary updated from your plan!')
          }}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

export default function TripPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    }>
      <TripPageInner />
    </Suspense>
  )
}
