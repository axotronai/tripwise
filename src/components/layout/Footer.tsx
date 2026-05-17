import Link from 'next/link'
import { MapPin } from 'lucide-react'

const LINKS = {
  'Plan': [
    { label: 'New Trip', href: '/trips/new' },
    { label: 'My Trips', href: '/dashboard' },
    { label: 'Goa Itinerary', href: '/trips/new?destination=Goa' },
    { label: 'Manali Itinerary', href: '/trips/new?destination=Manali' },
    { label: 'Kerala Itinerary', href: '/trips/new?destination=Kerala' },
  ],
  'Features': [
    { label: 'AI Itinerary', href: '/trips/new' },
    { label: 'Train Search', href: '/trains' },
    { label: 'Activities', href: '/activities' },
    { label: 'Packing List', href: '/packing-list' },
    { label: 'Destinations', href: '/destinations' },
  ],
  'Destinations': [
    { label: 'Goa', href: '/destinations/goa' },
    { label: 'Ladakh', href: '/destinations/ladakh' },
    { label: 'Jaipur', href: '/destinations/jaipur' },
    { label: 'Kerala', href: '/destinations/kerala' },
    { label: 'Andaman', href: '/destinations/andaman' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-white font-bold text-lg">TripWise</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              India&apos;s all-in-one trip planner. Built for Indian travelers, priced at ₹0.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 bg-green-900/40 text-green-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Free forever
              </span>
              <span className="bg-blue-900/40 text-blue-400 px-2 py-1 rounded-full">India-first</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-3">{heading}</h4>
              <ul className="space-y-2">
                {links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TripWise. Built with ❤️ for Indian travelers.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> All systems operational
            </span>
            <span>Powered by Groq · OpenStreetMap · Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
