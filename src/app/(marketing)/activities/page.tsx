'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const CATEGORIES = [
  { emoji: '🏄', label: 'Adventure Sports',      slug: 'adventure-sports' },
  { emoji: '🏕️', label: 'Camping & Trekking',    slug: 'camping-trekking' },
  { emoji: '🐘', label: 'Wildlife Safari',        slug: 'wildlife-safari' },
  { emoji: '🤿', label: 'Water Sports',           slug: 'water-sports' },
  { emoji: '🧘', label: 'Yoga & Wellness',        slug: 'yoga-wellness' },
  { emoji: '🏰', label: 'Heritage Tours',         slug: 'heritage-tours' },
  { emoji: '🍛', label: 'Food Tours',             slug: 'food-tours' },
  { emoji: '🎭', label: 'Cultural Experiences',   slug: 'cultural-experiences' },
]

const POPULAR_CITIES = [
  { name: 'Goa',       gradient: 'from-cyan-400 to-blue-500',    emoji: '🏖️' },
  { name: 'Manali',    gradient: 'from-blue-400 to-indigo-600',  emoji: '🏔️' },
  { name: 'Rishikesh', gradient: 'from-green-500 to-teal-600',   emoji: '🧘' },
  { name: 'Ladakh',    gradient: 'from-indigo-400 to-purple-600',emoji: '🎒' },
  { name: 'Kerala',    gradient: 'from-green-400 to-emerald-600',emoji: '🌿' },
  { name: 'Jaipur',    gradient: 'from-orange-400 to-pink-500',  emoji: '🏰' },
  { name: 'Andaman',   gradient: 'from-teal-400 to-cyan-600',    emoji: '🐠' },
  { name: 'Coorg',     gradient: 'from-lime-500 to-green-600',   emoji: '☕' },
]

function thrillUrl(city: string, categorySlug?: string) {
  const base = `https://www.thrillophilia.com/places/${city.toLowerCase().replace(/\s+/g, '-')}`
  const path = categorySlug ? `/${categorySlug}` : ''
  return `${base}${path}?utm_source=tripwise&utm_medium=affiliate`
}

export default function ActivitiesPage() {
  const [city, setCity] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Experiences &amp; Activities</h1>
        <p className="text-white/80 text-lg mb-8">Hand-picked adventures across India</p>

        {/* City search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <Input
            className="pl-12 h-12 bg-white text-gray-900 border-0 rounded-xl shadow-lg text-base placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white"
            placeholder="Search a city — Goa, Manali, Rishikesh…"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Activity Categories */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <a
                key={cat.slug}
                href={thrillUrl(city || 'india', cat.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer p-6 flex flex-col items-center gap-3 text-center"
              >
                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</div>
                <span className="font-semibold text-gray-800 text-sm leading-tight">{cat.label}</span>
                <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View on Thrillophilia →</span>
              </a>
            ))}
          </div>
        </section>

        {/* Popular Destinations */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Destinations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {POPULAR_CITIES.map(dest => (
              <a
                key={dest.name}
                href={thrillUrl(dest.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer h-36"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient}`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl drop-shadow group-hover:scale-110 transition-transform duration-200">{dest.emoji}</span>
                  <span className="text-white font-bold text-base drop-shadow">{dest.name}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Why book through TripWise */}
        <section className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-900 mb-2">Why book through TripWise?</h2>
          <p className="text-indigo-700 text-sm leading-relaxed">
            All experiences are on Thrillophilia, India&apos;s most trusted activity platform with 1M+ verified reviews.
            You get the same prices — we earn a small commission that helps keep TripWise free forever.
          </p>
        </section>

      </div>
    </div>
  )
}
