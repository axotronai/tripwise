'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MapPin, Sparkles, LayoutDashboard, Home, LogIn,
  ShieldCheck, Camera, LogOut, Download, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ─── Nav link items ───────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/',            label: 'Home',       icon: Home },
  { href: '/dashboard',   label: 'My Trips',   icon: LayoutDashboard },
  { href: '/activities',  label: 'Activities', icon: Camera },
]

export default function Navbar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const isHome      = pathname === '/'

  const [menuOpen, setMenuOpen]         = useState(false)
  const [isAdmin, setIsAdmin]           = useState(false)
  const [user, setUser]                 = useState<SupabaseUser | null>(null)
  const [userLoaded, setUserLoaded]     = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    setIsAdmin(document.cookie.split(';').some(c => c.trim() === 'admin_ui=1'))

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as Event & { prompt: () => Promise<void> })
    }
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
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* ── Main navbar bar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">TripWise</span>
          </Link>

          {/* ── Desktop center nav (hidden on mobile) ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* ── Desktop right actions (hidden on mobile) ── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link href="/trips/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 h-9 gap-2 shadow-md shadow-blue-200 hover:shadow-lg transition-all text-sm">
                <Sparkles className="h-4 w-4" />
                Plan My Trip
              </Button>
            </Link>

            {installPrompt && (
              <Button variant="outline" size="sm" onClick={installApp}
                className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white h-9 text-sm">
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}

            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white h-9 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
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
                    <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <button onClick={signOut} title="Sign out" aria-label="Sign out"
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : !isAdmin ? (
                <Link href="/login">
                  <Button variant="outline"
                    className="gap-2 border-gray-300 text-gray-700 hover:bg-blue-600 hover:text-white h-9 text-sm">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
              ) : null
            )}
          </div>

          {/* ── Mobile right: Plan button + hamburger ── */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link href="/trips/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-4 h-9 gap-1.5 shadow-md shadow-blue-200 text-sm">
                <Sparkles className="h-4 w-4" />
                Plan
              </Button>
            </Link>

            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile drawer backdrop ─────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer (slides from right) ─────────────────────────── */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-lg font-extrabold text-gray-900">TripWise</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}

          {/* Plan My Trip CTA in drawer */}
          <Link href="/trips/new"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
            <Sparkles className="h-5 w-5 shrink-0" />
            Plan My Trip with AI
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              Admin Panel
            </Link>
          )}

          {/* Install App */}
          {installPrompt && (
            <button onClick={installApp}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-5 w-5 shrink-0" />
              Install App
            </button>
          )}
        </nav>

        {/* Drawer footer — user info */}
        <div className="px-4 py-4 border-t border-gray-100 shrink-0">
          {userLoaded && (
            user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign Out
                </button>
              </div>
            ) : !isAdmin ? (
              <Link href="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <LogIn className="h-5 w-5 shrink-0" />
                Login / Sign Up
              </Link>
            ) : null
          )}
        </div>
      </div>
    </>
  )
}
