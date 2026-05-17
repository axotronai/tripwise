'use client'

import { Cloud } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeather } from '@/hooks/useWeather'
import { format } from 'date-fns'

interface Props { city: string }

export default function WeatherWidget({ city }: Props) {
  const { data, loading, error, getLabel } = useWeather(city)

  if (error) return null  // Silent fail — don't break the page

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Weather in {city}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
                <div className="w-8 h-3 bg-gray-200 rounded" />
                <div className="w-8 h-6 bg-gray-200 rounded" />
                <div className="w-8 h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3 text-gray-400">
          <Cloud className="h-5 w-5" />
          <span className="text-sm">Weather data not available for {city}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Cloud className="h-4 w-4 text-blue-500" />
          7-Day Weather — {city}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.days.map((day, i) => {
            const { emoji } = getLabel(day.weathercode)
            return (
              <div key={day.date} className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[56px] shrink-0 ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <span className="text-xs text-gray-500 font-medium">
                  {i === 0 ? 'Today' : format(new Date(day.date), 'EEE')}
                </span>
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-bold text-gray-800">{day.max_temp}°</span>
                <span className="text-xs text-gray-400">{day.min_temp}°</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
