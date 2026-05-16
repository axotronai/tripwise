'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Clock, MapPin, IndianRupee, Trash2, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity } from '@/types'
import { formatINR } from '@/lib/utils/trip'

const TYPE_COLORS: Record<string, string> = {
  sightseeing: 'bg-blue-100 text-blue-700',
  food: 'bg-orange-100 text-orange-700',
  adventure: 'bg-red-100 text-red-700',
  culture: 'bg-purple-100 text-purple-700',
  beach: 'bg-cyan-100 text-cyan-700',
  shopping: 'bg-pink-100 text-pink-700',
  rest: 'bg-gray-100 text-gray-600',
}

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  beach: '🏖️', shopping: '🛍️', rest: '😴',
}

interface Props {
  activity: Activity
  index: number
  onDelete: (id: string) => void
}

export default function ActivityCard({ activity, index, onDelete }: Props) {
  return (
    <Draggable draggableId={activity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white rounded-xl border p-3 flex gap-3 group transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-1 border-blue-300' : 'hover:shadow-sm'
          }`}
        >
          <div {...provided.dragHandleProps} className="flex items-center text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="text-xl">{TYPE_EMOJI[activity.type] || '📍'}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-gray-900 text-sm leading-tight">{activity.name}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => onDelete(activity.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {activity.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.description}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {activity.start_time} – {activity.end_time}
              </div>
              {activity.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{activity.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs">
                {activity.is_free ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 text-xs py-0">Free</Badge>
                ) : (
                  <span className="flex items-center gap-0.5 text-gray-600">
                    <IndianRupee className="h-3 w-3" />{formatINR(activity.cost).replace('₹', '')}
                  </span>
                )}
              </div>
              <Badge className={`text-xs py-0 ${TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-600'}`}>
                {activity.type}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
