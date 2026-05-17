'use client'

import { useEffect, useState } from 'react'

type CurrentWeather = {
  temperature: number
  windspeed: number
  weathercode: number
}

type DailyWeather = {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
  weathercode: number[]
}

type WeatherData = {
  current_weather: CurrentWeather
  daily: DailyWeather
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 55) return '🌦️'
  if (code >= 61 && code <= 65) return '🌧️'
  if (code >= 71 && code <= 75) return '❄️'
  if (code >= 80 && code <= 82) return '🌧️'
  if (code === 95) return '⛈️'
  return '🌡️'
}

function getWeatherDesc(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 75) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code === 95) return 'Thunderstorm'
  return 'Unknown'
}

function getGradient(code: number): string {
  if (code === 0) return 'from-amber-400 to-orange-400'
  if (code <= 3) return 'from-blue-400 to-sky-500'
  if (code === 45 || code === 48) return 'from-gray-400 to-slate-500'
  if (code >= 51 && code <= 55) return 'from-blue-400 to-indigo-500'
  if (code >= 61 && code <= 65) return 'from-blue-500 to-indigo-600'
  if (code >= 71 && code <= 75) return 'from-sky-200 to-blue-300'
  if (code >= 80 && code <= 82) return 'from-blue-500 to-indigo-600'
  if (code === 95) return 'from-gray-600 to-slate-700'
  return 'from-blue-500 to-indigo-600'
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short' })
}

export default function WeatherWidget({ city, lat, lon }: { city: string; lat: number; lon: number }) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia%2FKolkata&forecast_days=7`
    )
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lat, lon])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="h-28 bg-gray-200" />
        <div className="p-4 flex gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { current_weather, daily } = data
  const gradient = getGradient(current_weather.weathercode)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} text-white px-6 py-5 flex items-center justify-between`}>
        <div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">Current Weather · {city}</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold">{Math.round(current_weather.temperature)}°C</span>
            <div>
              <p className="text-lg font-medium">{getWeatherEmoji(current_weather.weathercode)} {getWeatherDesc(current_weather.weathercode)}</p>
              <p className="text-white/70 text-sm">Wind {current_weather.windspeed} km/h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {daily.time.map((date, i) => (
            <div key={date} className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-3 min-w-[68px] text-center border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">{i === 0 ? 'Today' : getDayName(date)}</p>
              <span className="text-xl mb-1">{getWeatherEmoji(daily.weathercode[i])}</span>
              <p className="text-xs font-bold text-gray-800">{Math.round(daily.temperature_2m_max[i])}°</p>
              <p className="text-xs text-gray-400">{Math.round(daily.temperature_2m_min[i])}°</p>
              {daily.precipitation_sum[i] > 0 && (
                <p className="text-xs text-blue-500 mt-0.5">💧{daily.precipitation_sum[i]}mm</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
