import Link from 'next/link'
import { MapPin, Train, Plane, IndianRupee, Brain, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: Calendar, title: 'Multi-Day Planner', desc: 'Drag & drop activities across days. AI fills your empty days automatically.' },
  { icon: Train, title: 'Trains & Flights', desc: 'Search IRCTC trains, flights, and buses with price filters — all in one place.' },
  { icon: IndianRupee, title: 'Budget Tracker', desc: 'Set budget in INR. Track spend per day, per category. Get alerts when you overshoot.' },
  { icon: MapPin, title: 'Interactive Map', desc: 'See your full route on a map. Day-wise view, hotel pins, and travel time between spots.' },
  { icon: Brain, title: 'AI Itinerary', desc: 'Tell AI your style and budget. Get a complete day-by-day plan in seconds.' },
  { icon: Users, title: 'Group Planning', desc: 'Plan with friends in real time. Split costs, share the link, travel together.' },
]

const popularDestinations = [
  { name: 'Goa', type: 'Beach', emoji: '🏖️', days: '4-6 days' },
  { name: 'Manali', type: 'Mountains', emoji: '🏔️', days: '5-7 days' },
  { name: 'Rajasthan', type: 'Heritage', emoji: '🏰', days: '7-10 days' },
  { name: 'Kerala', type: 'Backwaters', emoji: '🌿', days: '5-7 days' },
  { name: 'Ladakh', type: 'Adventure', emoji: '🎒', days: '7-10 days' },
  { name: 'Andaman', type: 'Islands', emoji: '🐠', days: '5-7 days' },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            100% Free — No credit card needed
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Plan Your India Trip<br />
            <span className="text-blue-200">Without the Chaos</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Stop juggling IRCTC, MakeMyTrip, Google Maps, and spreadsheets.
            TripWise brings trains, flights, hotels, maps, and budget — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/trips/new">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 h-12 text-base">
                Plan My Trip — Free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-12 text-base">
                See My Trips
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-blue-200">
            <span>✓ IRCTC Train Search</span>
            <span>✓ Flight Comparison</span>
            <span>✓ INR Budget Tracker</span>
            <span>✓ AI Itinerary Builder</span>
            <span>✓ Offline Maps</span>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Popular Indian Destinations</h2>
          <p className="text-gray-500 mt-2">Quick-start with a pre-built itinerary template</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((dest) => (
            <Link key={dest.name} href={`/trips/new?destination=${dest.name}`}>
              <Card className="hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center group">
                <CardContent className="p-4">
                  <div className="text-4xl mb-2">{dest.emoji}</div>
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600">{dest.name}</div>
                  <div className="text-xs text-gray-500">{dest.type}</div>
                  <div className="text-xs text-blue-500 mt-1">{dest.days}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything in One Place</h2>
            <p className="text-gray-500 mt-2">Built specifically for Indian travelers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl h-fit">
                    <f.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to plan your next trip?</h2>
          <p className="text-blue-100 mb-8">Join thousands of Indian travelers who stopped the tab-switching chaos.</p>
          <Link href="/trips/new">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-10 h-12 text-base">
              Start Planning — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
