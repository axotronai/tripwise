import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@tripwise.in'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@TripWise2025'
const SESSION_TOKEN  = process.env.ADMIN_SESSION_SECRET ?? 'tripwise-admin-secret-2025'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  // Non-httpOnly cookie so the navbar JS can detect login state
  cookieStore.set('admin_ui', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}
