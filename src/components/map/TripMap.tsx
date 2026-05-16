'use client'

import { useEffect, useRef } from 'react'
import { Activity } from '@/types'

interface Props {
  activities: Activity[]
  destination: string
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Goa': [15.2993, 74.1240], 'Manali': [32.2396, 77.1887], 'Jaipur': [26.9124, 75.7873],
  'Kerala': [10.8505, 76.2711], 'Ladakh': [34.1526, 77.5771], 'Andaman': [11.7401, 92.6586],
  'Varanasi': [25.3176, 82.9739], 'Rishikesh': [30.0869, 78.2676], 'Coorg': [12.3375, 75.8069],
  'Ooty': [11.4102, 76.6950], 'Shimla': [31.1048, 77.1734], 'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025], 'Bangalore': [12.9716, 77.5946], 'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639], 'Hyderabad': [17.3850, 78.4867], 'Pune': [18.5204, 73.8567],
}

export default function TripMap({ activities, destination }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      const center = CITY_COORDS[destination] || [20.5937, 78.9629]

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      map.setView(center, 12)

      // Custom icon
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#2563eb;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const bounds: [number, number][] = []

      activities.forEach((activity, i) => {
        if (activity.lat && activity.lng) {
          const marker = L.marker([activity.lat, activity.lng], { icon })
          marker.addTo(map)
          marker.bindPopup(`
            <div style="font-family:sans-serif;padding:4px">
              <strong style="font-size:13px">${activity.name}</strong><br/>
              <span style="color:#6b7280;font-size:11px">${activity.start_time} – ${activity.end_time}</span><br/>
              ${activity.cost > 0 ? `<span style="color:#2563eb;font-size:12px">₹${activity.cost}</span>` : '<span style="color:#16a34a;font-size:12px">Free</span>'}
            </div>
          `)
          bounds.push([activity.lat, activity.lng])
        }
      })

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when activities change
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    // Clear existing markers and re-add (simplified)
    map.eachLayer((layer: any) => { if (layer._icon) map.removeLayer(layer) })
  }, [activities])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {activities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm font-medium">Add activities with locations<br/>to see them on the map</p>
          </div>
        </div>
      )}
    </div>
  )
}
