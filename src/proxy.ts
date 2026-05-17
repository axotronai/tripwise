import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_TOKEN  = process.env.ADMIN_SESSION_SECRET ?? 'tripwise-admin-secret-2025'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function supabaseConfigured() {
  return SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('your_supabase')
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin route protection (cookie-based, no Supabase needed)
  if (pathname.startsWith('/admin')) {
    if (req.cookies.get('admin_session')?.value !== ADMIN_TOKEN) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('admin', '1')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Skip Supabase session refresh if not configured
  if (!supabaseConfigured()) {
    return NextResponse.next()
  }

  // Supabase session refresh (required for SSR — keeps session alive)
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        )
      },
    },
  })

  // Verify session (also refreshes expired tokens)
  const { data: { user } } = await supabase.auth.getUser()

  // Only protect dashboard — trip pages are open so anyone can plan a trip
  if (pathname === '/dashboard' && !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard',
    '/trips/:path*',
    // Broad matcher refreshes Supabase session on every page (skip static files)
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
