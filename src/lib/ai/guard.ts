/**
 * AI Route Guard — shared auth + rate-limit for all /api/ai/* routes.
 *
 * Rules (per your Security Rules doc):
 *  - Authenticated users : 20 AI calls / hour  (keyed by user_id)
 *  - Guest (no session)  :  3 AI calls / hour  (keyed by IP)
 *  - All 429s include a Retry-After header (required by RFC 6585)
 *  - Token usage is logged per call for cost abuse detection
 *
 * Returns { userId, error }:
 *  - If `error` is set, return it immediately from the route handler.
 *  - If `userId` is null, the caller is a guest (still allowed within limit).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── In-memory store (resets on cold start — intentional, lightweight) ────────
const RATE_MAP: Map<string, { count: number; resetAt: number }> = new Map()

const AUTH_MAX  = 20             // authenticated users per hour
const GUEST_MAX = 3              // guests per hour
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

/** Returns true = allowed, false = rate limited. */
function checkLimit(key: string, max: number): { allowed: boolean; retryAfterSec: number } {
  const now   = Date.now()
  const entry = RATE_MAP.get(key)
  if (!entry || now > entry.resetAt) {
    RATE_MAP.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true, retryAfterSec: 0 }
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
  /\bdo not follow\b/i, /\bdisregard\b/i,
]

export function sanitise(value: unknown): string {
  if (typeof value !== 'string') return ''
  let s = value.trim().slice(0, 500) // hard cap per field
  for (const re of INJECTION_PATTERNS) {
    if (re.test(s)) {
      // Strip the matched phrase rather than reject (keeps UX smooth)
      s = s.replace(re, '').trim()
    }
  }
  return s
}

// ─── Token usage logger (per your security guide: log LLM usage per user) ─────
/**
 * Call this after every Groq completion to log token usage.
 * Helps detect cost abuse early.
 *
 * Usage: logTokenUsage(userId, 'full-plan', completion.usage)
 */
export function logTokenUsage(
  userId: string | null,
  route: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null | undefined,
) {
  if (!usage) return
  const who = userId ? `user:${userId.slice(0, 8)}` : 'guest'
  console.info(
    `[ai-tokens] ${route} | ${who} | ` +
    `prompt=${usage.prompt_tokens ?? '?'} ` +
    `completion=${usage.completion_tokens ?? '?'} ` +
    `total=${usage.total_tokens ?? '?'}`
  )
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

  // 2. Rate limit — include Retry-After header on 429 (RFC 6585 / your security guide)
  if (userId) {
    const { allowed, retryAfterSec } = checkLimit(`user:${userId}`, AUTH_MAX)
    if (!allowed) {
      return {
        userId,
        error: NextResponse.json(
          { error: 'Too many AI requests. Limit resets in 1 hour.' },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSec) },
          },
        ),
      }
    }
  } else {
    const ip = getIp(req)
    const { allowed, retryAfterSec } = checkLimit(`ip:${ip}`, GUEST_MAX)
    if (!allowed) {
      return {
        userId: null,
        error: NextResponse.json(
          { error: 'Guest AI limit reached (3/hour). Sign in for more.' },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSec) },
          },
        ),
      }
    }
  }

  return { userId, error: null }
}
