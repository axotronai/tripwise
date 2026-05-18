import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// These MUST be set as environment variables — no insecure fallbacks.
// If any are missing at boot time, admin login will simply always fail (401).
function getAdminCreds() {
  const email    = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const token    = process.env.ADMIN_SESSION_SECRET

  if (!email || !password || !token) {
    console.error('[admin/login] ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET must be set in environment variables')
    return null
  }
  return { email, password, token }
}

export async function POST(req: NextRequest) {
  const creds = getAdminCreds()

  const { email, password } = await req.json()

  // Always do the comparison — even with dummy values — to avoid timing oracle
  const expectedEmail    = creds?.email    ?? '__unset__'
  const expectedPassword = creds?.password ?? '__unset__'
  const sessionToken     = creds?.token    ?? ''

  // Constant-time comparison to prevent timing attacks
  const emailMatch    = timingSafeEqual(email    ?? '', expectedEmail)
  const passwordMatch = timingSafeEqual(password ?? '', expectedPassword)

  if (!creds || !emailMatch || !passwordMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  // Non-httpOnly cookie so the navbar JS can detect login state
  cookieStore.set('admin_ui', '1', {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })

  return NextResponse.json({ ok: true })
}

/** Constant-time string comparison to mitigate timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate over one string to keep timing consistent
    let diff = 0
    for (let i = 0; i < b.length; i++) diff |= (a.charCodeAt(0) ^ b.charCodeAt(i))
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= (a.charCodeAt(i) ^ b.charCodeAt(i))
  return diff === 0
}
