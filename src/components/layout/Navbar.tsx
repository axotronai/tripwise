'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Plus, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">TripWise</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">India</span>
          </Link>

          <div className="flex items-center gap-3">
            {pathname !== '/' && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  My Trips
                </Button>
              </Link>
            )}
            <Link href="/trips/new">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Plan Trip
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
