import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Star, Clock, Calendar, MapPin, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminEditButton from '@/components/admin/AdminEditButton'
import WeatherWidget from '@/components/destination/WeatherWidget'

type Destination = {
  name: string; emoji: string; tagline: string; gradient: string
  type: string; rating: number; reviews: string; duration: string; budget: string
  photo: string; description: string
  highlights: { icon: string; title: string; desc: string }[]
  thingsToDo: { emoji: string; name: string }[]
  bestTime: string
  howToReach: { mode: string; detail: string; icon: string }[]
  lat?: number
  lon?: number
  emergency?: { police: string; ambulance: string; tourist: string; hospital: string }
  festivals?: { name: string; month: string; desc: string }[]
}

function readDestinations(): Record<string, Destination> {
  try {
    const p = path.join(process.cwd(), 'src/data/destinations.json')
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function getFallback(slug: string): Destination {
  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    name, emoji: '📍', tagline: 'Discover this destination', gradient: 'from-blue-500 to-indigo-600',
    type: 'Destination', rating: 4.5, reviews: '—', duration: 'Flexible', budget: 'Varies',
    photo: '',
    description: `${name} is a wonderful destination waiting to be explored. Our AI can build you a personalised itinerary with activities, hotels, transport options, and a day-by-day plan — completely free.`,
    highlights: [],
    thingsToDo: [
      { emoji: '🗺️', name: 'Explore' }, { emoji: '📸', name: 'Sightseeing' },
      { emoji: '🍽️', name: 'Local Food' }, { emoji: '🛍️', name: 'Shopping' },
    ],
    bestTime: 'Check local weather before planning.',
    howToReach: [{ mode: 'Plan with AI', detail: 'Our AI will suggest the best transport options for your trip.', icon: '✨' }],
  }
}

/**
 * Pre-render all known destination pages at build time.
 * Unknown slugs (future destinations added via admin) are rendered on-demand.
 */
export async function generateStaticParams() {
  const destinations = readDestinations()
  return Object.keys(destinations).map(slug => ({ slug }))
}

export const dynamicParams = true // allow unknown slugs to be rendered on-demand

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const destinations = readDestinations()
  const dest = destinations[slug.toLowerCase()] ?? getFallback(slug)
  const description = dest.description.slice(0, 160)
  const title = `${dest.name} Trip Guide — Best Time, Hotels & Itinerary`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'}/destinations/${slug}`,
      images: dest.photo ? [{ url: dest.photo, alt: dest.name }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      dest.photo ? [dest.photo] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'}/destinations/${slug}`,
    },
  }
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const destinations = readDestinations()
  const dest = destinations[slug.toLowerCase()] ?? getFallback(slug)

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_ui')?.value === '1'

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://axozen.com'
  const waText = encodeURIComponent(`Check out ${dest.name} on TripWise! Plan your trip free: ${SITE}/destinations/${slug}`)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className={`relative bg-gradient-to-br ${dest.gradient} text-white overflow-hidden`}>
        {dest.photo && (
          <img src={dest.photo} alt={dest.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/destinations" className="hover:text-white transition-colors">Destinations</Link>
            <span>/</span>
            <span className="text-white">{dest.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">{dest.type}</p>
              <h1 className="text-5xl sm:text-6xl font-extrabold flex items-center gap-4">
                <span>{dest.emoji}</span> {dest.name}
              </h1>
              <p className="text-white/80 text-xl mt-2">{dest.tagline}</p>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{dest.rating}</span>
                  <span className="text-white/60 text-sm">({dest.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Clock className="h-3.5 w-3.5" /> {dest.duration}
                </div>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <span>💰</span> {dest.budget} per person
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Share
              </a>
              <Link href={`/trips/new?destination=${encodeURIComponent(dest.name)}`}>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 h-12 gap-2 shadow-lg text-base">
                  <Sparkles className="h-5 w-5" /> Plan Trip with AI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* About */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About {dest.name}</h2>
          <p className="text-gray-600 leading-relaxed text-base">{dest.description}</p>
        </section>

        {/* Highlights */}
        {dest.highlights.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Why Visit {dest.name}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {dest.highlights.map(h => (
                <div key={h.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{h.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{h.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Things To Do */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-5">Things To Do</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dest.thingsToDo.map(t => (
              <div key={t.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                <div className="text-3xl mb-2">{t.emoji}</div>
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Info row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">Best Time to Visit</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{dest.bestTime}</p>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">How to Reach</h2>
            </div>
            <div className="space-y-2">
              {dest.howToReach.map(r => (
                <div key={r.mode} className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{r.mode}</span>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Weather Widget */}
        {dest.lat !== undefined && dest.lon !== undefined && (
          <WeatherWidget city={dest.name} lat={dest.lat} lon={dest.lon} />
        )}

        {/* Festivals & Emergency */}
        {(dest.festivals || dest.emergency) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {dest.festivals && dest.festivals.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎉</span>
                  <h2 className="font-bold text-gray-900">Festivals & Events</h2>
                </div>
                <div className="space-y-3">
                  {dest.festivals.map(f => (
                    <div key={f.name} className="flex items-start gap-2.5">
                      <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mt-0.5">{f.month}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dest.emergency && (
              <section className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🚨</span>
                  <h2 className="font-bold text-gray-900">Emergency Contacts</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Police</p>
                    <p className="text-sm font-bold text-gray-900">{dest.emergency.police}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Ambulance</p>
                    <p className="text-sm font-bold text-gray-900">{dest.emergency.ambulance}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Tourist Helpline</p>
                    <p className="text-sm font-bold text-gray-900">{dest.emergency.tourist}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Hospital</p>
                    <p className="text-sm text-gray-700 leading-tight">{dest.emergency.hospital}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* CTA strip */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-blue-200" />
          <h2 className="text-xl font-bold mb-2">Ready to visit {dest.name}?</h2>
          <p className="text-blue-100 text-sm mb-5">Get a free AI-generated day-by-day itinerary with hotels, transport options, and budget breakdown.</p>
          <Link href={`/trips/new?destination=${encodeURIComponent(dest.name)}`}>
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-11 gap-2">
              <Sparkles className="h-4 w-4" /> Plan My {dest.name} Trip — Free
            </Button>
          </Link>
        </section>

      </div>

      {isAdmin && <AdminEditButton slug={slug.toLowerCase()} />}
    </div>
  )
}
