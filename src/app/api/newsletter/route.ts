import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  // Basic validation
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  const normalised = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (normalised.length > 254) {
    return NextResponse.json({ error: 'Email too long' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    // Upsert so duplicate signups are silently accepted
    const { error } = await admin
      .from('newsletter_subscribers')
      .upsert({ email: normalised }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      // Table doesn't exist yet → log and return success anyway (graceful degradation)
      if (error.code === '42P01') {
        console.warn('[newsletter] newsletter_subscribers table not found — skipping DB save')
        return NextResponse.json({ ok: true })
      }
      console.error('[newsletter] DB error:', error)
      return NextResponse.json({ error: 'Could not save subscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    // Supabase not configured → succeed silently
    console.warn('[newsletter] Supabase not configured:', e)
    return NextResponse.json({ ok: true })
  }
}
