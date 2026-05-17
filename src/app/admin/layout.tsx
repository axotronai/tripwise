'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, LayoutDashboard, Globe, Map, Settings, LogOut, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const NAV = [
  { href: '/admin',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/destinations', label: 'Destinations', icon: Globe },
  { href: '/admin/trips',        label: 'Trips',        icon: Map },
  { href: '/admin/settings',     label: 'Settings',     icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-200">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-lg">TripWise</span>
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-md ml-auto">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
