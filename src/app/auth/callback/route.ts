import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Allowed redirect path prefixes after login. */
const SAFE_PREFIXES = [
  '/dashboard',
  '/trips',
  '/packing-list',
  '/trains',
  '/destinations',
  '/profile',
]

function safeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard'

  // Must be a relative path (no protocol/host) and match an allowed prefix
  try {
    // Reject anything that looks like an absolute URL
    if (next.startsWith('//') || next.includes('://')) return '/dashboard'

    const decoded = decodeURIComponent(next)
    const isSafe = SAFE_PREFIXES.some(prefix => decoded.startsWith(prefix))
    return isSafe ? decoded : '/dashboard'
  } catch {
    return '/dashboard'
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
