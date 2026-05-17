'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MapPin, Sparkles, LayoutDashboard, Home, LogIn, ShieldCheck, Camera, LogOut, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const isHome      = pathname === '/'
  const isDashboard = pathname === '/dashboard'

  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser]       = useState<SupabaseUser | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)

  useEffect(() => {
    setIsAdmin(document.cookie.split(';').some(c => c.trim() === 'admin_ui=1'))

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as Event & { prompt: () => Promise<void> }) }
    window.addEventListener('beforeinstallprompt', handler)

    if (!isSupabaseConfigured()) {
      setUserLoaded(true)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setUserLoaded(true)
    }).catch(() => setUserLoaded(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setUserLoaded(true)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Far left — Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">TripWise</span>
        </Link>

        {/* Center group */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isHome ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link href="/trips/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-4 sm:px-6 h-9 gap-2 shadow-md shadow-blue-200 hover:shadow-lg transition-all text-sm">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Plan My Trip</span>
              <span className="sm:hidden text-xs">Plan</span>
            </Button>
          </Link>

          <Link href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDashboard ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">My Trips</span>
          </Link>

          <Link href="/activities"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/activities' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Activities</span>
          </Link>
        </div>

        {/* Far right */}
        <div className="flex items-center gap-2 shrink-0">
          {installPrompt && (
            <Button variant="outline" size="sm" onClick={installApp}
              className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 h-9 text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install App</span>
            </Button>
          )}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 h-9 text-sm font-medium transition-colors">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}

          {userLoaded && (
            user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-3 h-9">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {userInitial}
                  </div>
                  <span className="text-sm text-gray-700 font-medium hidden sm:block max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  aria-label="Sign out"
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : !isAdmin ? (
              <Link href="/login">
                <Button variant="outline" className="gap-2 border-gray-300 text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 h-9 text-sm font-medium transition-colors">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            ) : null
          )}
        </div>

      </div>
    </nav>
  )
}
