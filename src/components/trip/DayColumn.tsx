'use client'

import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Plus, MapPin, IndianRupee, ChevronDown, ChevronUp, Sparkles, Loader2, RefreshCw, Hotel } from 'lucide-react'
import { SelectedHotel } from '@/components/hotel/HotelSearch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ActivityCard from './ActivityCard'
import AddActivityModal from './AddActivityModal'
import { ItineraryDay, Activity } from '@/types'
import { formatINR } from '@/lib/utils/trip'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  day: ItineraryDay
  destination: string
  startDate?: string
  budget?: number
  travelStyle?: string
  isActive: boolean
  onActivate: () => void
  onAddActivity: (dayId: string, activity: Omit<Activity, 'id'>) => void
  onDeleteActivity: (dayId: string, activityId: string) => void
  onEditActivity: (dayId: string, activity: Activity) => void
  onReplaceActivity: (dayId: string, activity: Activity) => void
  onRefineDay: (dayId: string, updatedActivities: Activity[]) => void
  hotel?: SelectedHotel
}

export default function DayColumn({
  day, destination, startDate, budget, travelStyle, isActive, onActivate,
  onAddActivity, onDeleteActivity, onEditActivity, onReplaceActivity, onRefineDay, hotel,
}: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [refining, setRefining]     = useState(false)

  const totalCost = day.activities.reduce((sum, a) => sum + (a.is_free ? 0 : a.cost), 0)
  const freebies  = day.activities.filter(a => a.is_free).length

  async function refineThisDay() {
    if (day.activities.length > 0 && !window.confirm(`Replace all ${day.activities.length} activities on Day ${day.day_number} with fresh AI suggestions?`)) return
    setRefining(true)
    try {
      const res = await fetch('/api/ai/refine-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          city: day.city,
          day_number: day.day_number,
          current_activities: day.activities.map(a => ({ name: a.name, type: a.type })),
          start_date: startDate,
          budget,
          travel_style: travelStyle,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const newActivities: Activity[] = (data.activities || []).map((a: Omit<Activity, 'id' | 'day_id'>, i: number) => ({
        ...a, id: `refined-${day.id}-${i}`, day_id: day.id, order_index: i,
      }))
      if (newActivities.length === 0) throw new Error()
      onRefineDay(day.id, newActivities)
      toast.success(`Day ${day.day_number} refined with fresh ideas!`)
    } catch {
      toast.error('Could not refine day — try again')
    } finally {
      setRefining(false)
    }
  }

  return (
    <>
      <div className={`rounded-2xl border-2 transition-all ${
        isActive ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Day Header */}
        <div
          className={`p-4 cursor-pointer rounded-t-2xl transition-colors ${isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
          onClick={onActivate}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  Day {day.day_number}
                </span>
                <span className="text-xs text-gray-500">{format(new Date(day.date), 'EEE, d MMM')}</span>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                {day.city}
              </div>
              {hotel && (
                <div className="flex items-center gap-1 mt-1 text-xs text-purple-600 font-medium">
                  <Hotel className="h-3 w-3" />
                  {hotel.name} · {formatINR(hotel.price_per_night)}/night
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <IndianRupee className="h-3.5 w-3.5" />
                {formatINR(totalCost).replace('₹', '')}
              </div>
              <div className="text-xs text-gray-400">{day.activities.length} activities</div>
            </div>
            <div className="ml-2 text-gray-400">
              {isActive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>

          {day.activities.length > 0 && !isActive && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {day.activities.slice(0, 3).map(a => (
                <Badge key={a.id} variant="outline" className="text-xs py-0">{a.name}</Badge>
              ))}
              {day.activities.length > 3 && (
                <Badge variant="outline" className="text-xs py-0">+{day.activities.length - 3} more</Badge>
              )}
            </div>
          )}
        </div>

        {/* Day Content */}
        {isActive && (
          <div className="p-4 pt-2 bg-white rounded-b-2xl">
            <div className="flex items-center justify-between mb-2">
              {freebies > 0 && (
                <p className="text-xs text-green-600">{freebies} free activit{freebies > 1 ? 'ies' : 'y'} today</p>
              )}
              <button
                onClick={e => { e.stopPropagation(); refineThisDay() }}
                disabled={refining}
                className="ml-auto flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {refining ? 'Refining…' : 'Refine Day with AI'}
              </button>
            </div>

            <Droppable droppableId={day.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[60px] rounded-xl transition-colors ${
                    snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-2' : ''
                  }`}
                >
                  {day.activities.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-sm">No activities yet</p>
                      <p className="text-xs mt-1">Add one below or use AI</p>
                    </div>
                  ) : (
                    day.activities
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((activity, index) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          index={index}
                          destination={destination}
                          startDate={startDate}
                          budget={budget}
                          travelStyle={travelStyle}
                          onDelete={id => onDeleteActivity(day.id, id)}
                          onEdit={a => onEditActivity(day.id, a)}
                          onReplace={a => onReplaceActivity(day.id, a)}
                        />
                      ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm"
                className="flex-1 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Add Activity
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddActivityModal
        dayId={day.id}
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={a => onAddActivity(day.id, a)}
        existingCount={day.activities.length}
      />
    </>
  )
}
