'use client'

import { useEffect, useState } from 'react'

interface WeatherDay {
  date: string
  max_temp: number
  min_temp: number
  weathercode: number
}

interface WeatherData {
  city: string
  days: WeatherDay[]
}

const WMO_LABELS: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear sky',        emoji: '☀️' },
  1:  { label: 'Mainly clear',     emoji: '🌤️' },
  2:  { label: 'Partly cloudy',    emoji: '⛅' },
  3:  { label: 'Overcast',         emoji: '☁️' },
  45: { label: 'Foggy',            emoji: '🌫️' },
  48: { label: 'Icy fog',          emoji: '🌫️' },
  51: { label: 'Light drizzle',    emoji: '🌦️' },
  61: { label: 'Light rain',       emoji: '🌦️' },
  63: { label: 'Moderate rain',    emoji: '🌧️' },
  65: { label: 'Heavy rain',       emoji: '🌧️' },
  71: { label: 'Light snow',       emoji: '🌨️' },
  73: { label: 'Moderate snow',    emoji: '❄️' },
  75: { label: 'Heavy snow',       emoji: '❄️' },
  80: { label: 'Rain showers',     emoji: '🌧️' },
  85: { label: 'Snow showers',     emoji: '🌨️' },
  95: { label: 'Thunderstorm',     emoji: '⛈️' },
  96: { label: 'Thunderstorm + hail', emoji: '⛈️' },
}

const CITY_COORDS: Record<string, [number, number]> = {
  // Top destinations
  'Goa':           [15.2993,  74.1240],
  'Manali':        [32.2396,  77.1887],
  'Jaipur':        [26.9124,  75.7873],
  'Kerala':        [10.8505,  76.2711],
  'Ladakh':        [34.1526,  77.5771],
  'Andaman':       [11.7401,  92.6586],
  'Varanasi':      [25.3176,  82.9739],
  'Rishikesh':     [30.0869,  78.2676],
  'Shimla':        [31.1048,  77.1734],
  'Udaipur':       [24.5854,  73.7125],
  'Munnar':        [10.0889,  77.0595],
  'Darjeeling':    [27.0360,  88.2627],
  'Ooty':          [11.4102,  76.6950],
  'Coorg':         [12.3375,  75.8069],
  'Pondicherry':   [11.9416,  79.8083],
  'Agra':          [27.1767,  78.0081],
  'Jodhpur':       [26.2389,  73.0243],
  'Jaisalmer':     [26.9157,  70.9083],
  'Pushkar':       [26.4900,  74.5510],
  'Hampi':         [15.3350,  76.4600],
  'Mysore':        [12.2958,  76.6394],
  'Alleppey':      [9.4981,   76.3388],
  'Wayanad':       [11.6854,  76.1320],
  'Kochi':         [9.9312,   76.2673],
  'Thekkady':      [9.5916,   77.1625],
  'Dharamshala':   [32.2190,  76.3234],
  'Kasol':         [32.0094,  77.3150],
  'Spiti':         [32.2461,  78.0339],
  'Nainital':      [29.3909,  79.4701],
  'Mussoorie':     [30.4598,  78.0664],
  'Haridwar':      [29.9457,  78.1642],
  'Auli':          [30.5191,  79.5622],
  'Leh':           [34.1526,  77.5771],
  'Srinagar':      [34.0837,  74.7973],
  'Pahalgam':      [34.0120,  75.3155],
  'Gulmarg':       [34.0503,  74.3800],
  'Dalhousie':     [32.5381,  75.9797],
  'Mcleodganj':    [32.2414,  76.3234],
  'Amritsar':      [31.6340,  74.8723],
  'Puri':          [19.8135,  85.8312],
  'Bhubaneswar':   [20.2961,  85.8245],
  'Konark':        [19.8876,  86.0944],
  'Rann of Kutch': [23.7337,  69.8597],
  'Ahmedabad':     [23.0225,  72.5714],
  'Dwarka':        [22.2394,  68.9678],
  'Somnath':       [20.8880,  70.4017],
  'Mahabalipuram': [12.6269,  80.1927],
  'Madurai':       [9.9252,   78.1198],
  'Rameswaram':    [9.2876,   79.3129],
  'Kodaikanal':    [10.2381,  77.4892],
  'Jim Corbett':   [29.5300,  78.7747],
  'Kaziranga':     [26.5775,  93.1710],
  'Sundarbans':    [21.9497,  89.1833],
  'Dudhsagar':     [15.3143,  74.3172],
  'Lonavala':      [18.7481,  73.4072],
  'Mahabaleshwar': [17.9237,  73.6586],
  'Aurangabad':    [19.8762,  75.3433],
  'Ellora':        [20.0258,  75.1780],
  'Ajanta':        [20.5519,  75.7033],
  // Major cities
  'Mumbai':        [19.0760,  72.8777],
  'Delhi':         [28.7041,  77.1025],
  'Bangalore':     [12.9716,  77.5946],
  'Chennai':       [13.0827,  80.2707],
  'Hyderabad':     [17.3850,  78.4867],
  'Kolkata':       [22.5726,  88.3639],
  'Pune':          [18.5204,  73.8567],
  'Chandigarh':    [30.7333,  76.7794],
  'Guwahati':      [26.1445,  91.7362],
  'Indore':        [22.7196,  75.8577],
  'Bhopal':        [23.2599,  77.4126],
  'Lucknow':       [26.8467,  80.9462],
  'Patna':         [25.5941,  85.1376],
  'Nagpur':        [21.1458,  79.0882],
  'Visakhapatnam': [17.6868,  83.2185],
  'Coimbatore':    [11.0168,  76.9558],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Jabalpur':      [23.1815,  79.9864],
  'Raipur':        [21.2514,  81.6296],
}

// Module-level cache so re-mounting doesn't re-fetch
const weatherCache = new Map<string, WeatherData>()

export function useWeather(city: string) {
  const [data, setData]       = useState<WeatherData | null>(() => weatherCache.get(city) ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)

  useEffect(() => {
    if (!city) return
    if (weatherCache.has(city)) {
      setData(weatherCache.get(city)!)
      return
    }

    // Try exact match first, then case-insensitive
    const key = Object.keys(CITY_COORDS).find(
      k => k.toLowerCase() === city.toLowerCase()
    )
    const coords = key ? CITY_COORDS[key] : null
    if (!coords) return  // Unknown city — widget stays hidden

    setLoading(true)
    setError(false)
    const [lat, lng] = coords
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FKolkata&forecast_days=7`
    )
      .then(r => {
        if (!r.ok) throw new Error('Weather fetch failed')
        return r.json()
      })
      .then(json => {
        const days: WeatherDay[] = json.daily.time.map((date: string, i: number) => ({
          date,
          max_temp: Math.round(json.daily.temperature_2m_max[i]),
          min_temp: Math.round(json.daily.temperature_2m_min[i]),
          weathercode: json.daily.weathercode[i],
        }))
        const result: WeatherData = { city, days }
        weatherCache.set(city, result)
        setData(result)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [city])

  return {
    data,
    loading,
    error,
    getLabel: (code: number) => WMO_LABELS[code] ?? { label: 'Unknown', emoji: '🌡️' },
  }
}
