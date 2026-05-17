import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { Globe, Map, Users, TrendingUp, ArrowRight, Star } from 'lucide-react'

function getDestinationCount(): number {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/destinations.json'), 'utf-8'))
    return Object.keys(data).length
  } catch {
    return 0
  }
}

const QUICK_LINKS = [
  { href: '/admin/destinations', label: 'Manage Destinations', desc: 'Add photos, edit descriptions, add new places', icon: Globe },
  { href: '/admin/trips',        label: 'View Trips',          desc: 'Browse user-created trip plans',              icon: Map  },
  { href: '/admin/settings',     label: 'Settings',            desc: 'Update credentials and site settings',        icon: TrendingUp },
]

export default function AdminDashboard() {
  const destCount = getDestinationCount()

  const STATS = [
    { label: 'Destinations', value: destCount.toString(), sub: 'in destinations.json', icon: Globe, color: 'bg-blue-50 text-blue-600' },
    { label: 'Indian States', value: '28',  sub: 'state guides',          icon: Map,   color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Active Trips',  value: '—',   sub: 'connect Supabase',      icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Avg Rating',    value: '4.7', sub: 'across destinations',   icon: Star,  color: 'bg-amber-50 text-amber-600'  },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back — manage your TripWise content below.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-blue-600" />
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-700">
        <p className="font-semibold mb-1">Getting started</p>
        <p className="text-blue-600">Head to <Link href="/admin/destinations" className="underline font-medium">Destinations</Link> to add photos and edit destination info. Photos can be pasted as image URLs (Unsplash, etc.).</p>
      </div>
    </div>
  )
}
