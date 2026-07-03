/**
 * AI Route Guard — shared auth + rate-limit for all /api/ai/* routes.
 *
 * Rules:
 *  - Authenticated users : 20 AI calls / hour  (keyed by user_id)
 *  - Guest (no session)  :  3 AI calls / hour  (keyed by IP)
 *
 * Returns { userId, error }:
 *  - If `error` is set, return it immediately from the route handler.
 *  - If `userId` is null, the caller is a guest (still allowed within limit).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── In-memory store (resets on cold start — intentional, lightweight) ────────
const RATE_MAP: Map<string, { count: number; resetAt: number }> = new Map()

const AUTH_MAX   = 20   // authenticated users
const GUEST_MAX  = 3    // guests
const WINDOW_MS  = 60 * 60 * 1000  // 1 hour

function checkLimit(key: string, max: number): boolean {
  const now   = Date.now()
  const entry = RATE_MAP.get(key)
  if (!entry || now > entry.resetAt) {
    RATE_MAP.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()        ||
    'unknown'
  )
}

// ─── Input sanitisation — strip prompt-injection prefixes ─────────────────────
const INJECTION_PATTERNS = [
  /^system:/i, /<\/?s>/i, /\[INST\]/i, /<<SYS>>/i,
  /ignore previous/i, /ignore all instructions/i,
]

export function sanitise(value: unknown): string {
  if (typeof value !== 'string') return ''
  let s = value.trim().slice(0, 500) // hard cap per field
  for (const re of INJECTION_PATTERNS) {
    if (re.test(s)) {
      // Strip the matched prefix rather than reject (keeps UX smooth)
      s = s.replace(re, '').trim()
    }
  }
  return s
}

// ─── Main guard ───────────────────────────────────────────────────────────────
export async function aiGuard(
  req: NextRequest,
): Promise<{ userId: string | null; error: NextResponse | null }> {
  // 1. Try to get authenticated user
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    // Supabase not configured in dev — allow guest
  }

  // 2. Rate limit
  if (userId) {
    if (!checkLimit(`user:${userId}`, AUTH_MAX)) {
      return {
        userId,
        error: NextResponse.json(
          { error: 'Too many AI requests. Limit resets in 1 hour.' },
          { status: 429 },
        ),
      }
    }
  } else {
    const ip = getIp(req)
    if (!checkLimit(`ip:${ip}`, GUEST_MAX)) {
      return {
        userId: null,
        error: NextResponse.json(
          { error: 'Guest AI limit reached (3/hour). Sign in for more.' },
          { status: 429 },
        ),
      }
    }
  }

  return { userId, error: null }
}
