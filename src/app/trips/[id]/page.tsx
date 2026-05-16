'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Sparkles, Train, Map, IndianRupee, Calendar, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import DayColumn from '@/components/trip/DayColumn'
import BudgetTracker from '@/components/budget/BudgetTracker'
import TransportSearch from '@/components/transport/TransportSearch'
import { useTripStore } from '@/store/tripStore'
import { Activity, ItineraryDay, Trip } from '@/types'
import { calcBudgetBreakdown, formatINR, generateDays } from '@/lib/utils/trip'
import { toast } from 'sonner'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

const TripMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
)})

// Demo trip for when Supabase isn't configured yet
function createDemoTrip(id: string): Trip {
  const today = new Date()
  const start = format(today, 'yyyy-MM-dd')
  const end = format(new Date(today.getTime() + 4 * 86400000), 'yyyy-MM-dd')
  return {
    id, user_id: 'demo', title: 'Goa Trip', destination: 'Goa', start_city: 'Mumbai',
    start_date: start, end_date: end, total_days: 5, total_budget: 25000,
    travel_style: 'comfort', group_size: 2, created_at: new Date().toISOString(),
  }
}

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const { currentTrip, days, budgetBreakdown, setCurrentTrip, setDays, setBudgetBreakdown, addActivity, removeActivity, reorderActivities, moveActivity } = useTripStore()
  const [activeDay, setActiveDay] = useState(0)
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrip() {
      setLoading(true)
      try {
        const res = await fetch(`/api/trips/${id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCurrentTrip(data.trip)
        const generatedDays = generateDays(data.trip.start_date, data.trip.end_date, data.trip.destination)
        const daysWithIds = (data.days?.length ? data.days : generatedDays).map((d: any, i: number) => ({
          ...d, id: d.id || `day-${i}`, activities: d.activities || [],
        }))
        setDays(daysWithIds)
        setBudgetBreakdown(calcBudgetBreakdown(data.trip.total_budget, data.trip.travel_style, data.trip.total_days, data.trip.group_size))
      } catch {
        // Use demo data if API fails (no Supabase configured)
        const demo = createDemoTrip(id)
        setCurrentTrip(demo)
        const demodays = generateDays(demo.start_date, demo.end_date, demo.destination).map((d, i) => ({
          ...d, id: `day-${i}`, trip_id: demo.id, activities: [],
        }))
        setDays(demodays)
        setBudgetBreakdown(calcBudgetBreakdown(demo.total_budget, demo.travel_style, demo.total_days, demo.group_size))
      } finally {
        setLoading(false)
      }
    }
    loadTrip()
  }, [id])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) {
      const day = days.find(d => d.id === source.droppableId)
      if (!day) return
      const reordered = Array.from(day.activities)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      reorderActivities(source.droppableId, reordered.map((a, i) => ({ ...a, order_index: i })))
    } else {
      const fromDay = days.find(d => d.id === source.droppableId)
      const activity = fromDay?.activities[source.index]
      if (activity) moveActivity(source.droppableId, destination.droppableId, activity)
    }
  }, [days, reorderActivities, moveActivity])

  const handleAddActivity = useCallback((dayId: string, activity: Omit<Activity, 'id'>) => {
    addActivity(dayId, { ...activity, id: `act-${Date.now()}` })
    toast.success('Activity added')
  }, [addActivity])

  const handleDeleteActivity = useCallback((dayId: string, activityId: string) => {
    removeActivity(dayId, activityId)
    toast.success('Activity removed')
  }, [removeActivity])

  async function generateAIItinerary() {
    if (!currentTrip) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: currentTrip.destination,
          days: currentTrip.total_days,
          budget: currentTrip.total_budget,
          travel_style: currentTrip.travel_style,
          group_size: currentTrip.group_size,
          start_city: currentTrip.start_city,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const updatedDays = days.map((day, i) => {
        const aiDay = data.days?.[i]
        if (!aiDay) return day
        return {
          ...day,
          city: aiDay.city || day.city,
          activities: aiDay.activities.map((a: any, j: number) => ({
            ...a, id: `ai-${day.id}-${j}`, day_id: day.id, order_index: j,
          })),
        }
      })
      setDays(updatedDays)
      toast.success('AI itinerary generated!')
    } catch (e: any) {
      toast.error(e.message || 'AI failed — check your Groq API key')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentTrip) return null

  const allActivities = days.flatMap(d => d.activities)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Trip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentTrip.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(currentTrip.start_date), 'd MMM')} – {format(new Date(currentTrip.end_date), 'd MMM yyyy')}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{currentTrip.group_size} {currentTrip.group_size === 1 ? 'person' : 'people'}</span>
            <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" />{formatINR(currentTrip.total_budget)}</span>
            <Badge variant="outline" className="capitalize">{currentTrip.travel_style}</Badge>
          </div>
        </div>
        <Button
          onClick={generateAIItinerary}
          disabled={aiLoading}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {aiLoading ? 'Generating...' : 'AI Generate Itinerary'}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="itinerary" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="itinerary" className="gap-2"><Calendar className="h-4 w-4" />Itinerary</TabsTrigger>
          <TabsTrigger value="map" className="gap-2"><Map className="h-4 w-4" />Map</TabsTrigger>
          <TabsTrigger value="transport" className="gap-2"><Train className="h-4 w-4" />Transport</TabsTrigger>
          <TabsTrigger value="budget" className="gap-2"><IndianRupee className="h-4 w-4" />Budget</TabsTrigger>
        </TabsList>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-3">
              {days.map((day, i) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  isActive={activeDay === i}
                  onActivate={() => setActiveDay(activeDay === i ? -1 : i)}
                  onAddActivity={handleAddActivity}
                  onDeleteActivity={handleDeleteActivity}
                />
              ))}
            </div>
          </DragDropContext>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <div className="h-[600px] rounded-2xl overflow-hidden border shadow-sm">
            <TripMap activities={allActivities} destination={currentTrip.destination} />
          </div>
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport">
          <TransportSearch defaultFrom={currentTrip.start_city} defaultTo={currentTrip.destination} />
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          {budgetBreakdown && <BudgetTracker breakdown={budgetBreakdown} days={days} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
