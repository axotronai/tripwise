import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Use env var only — no insecure fallback (fixed from hard-coded default)
function getSessionToken() {
  return process.env.ADMIN_SESSION_SECRET ?? null
}

const DATA_PATH = path.join(process.cwd(), 'src/data/destinations.json')

function readDestinations(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * Atomic write — writes to a temp file first then renames over the target.
 * Prevents data corruption if the process crashes mid-write.
 */
function writeDestinations(data: Record<string, unknown>) {
  const dir     = path.dirname(DATA_PATH)
  const tmpPath = path.join(dir, `.destinations-${crypto.randomUUID()}.tmp`)
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: 'utf-8', flag: 'w' })
    fs.renameSync(tmpPath, DATA_PATH)
  } catch (err) {
    // Clean up temp file if rename failed
    try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
    throw err
  }
}

async function isAdmin() {
  const token = getSessionToken()
  if (!token) return false
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('admin_session')?.value
  if (!sessionValue) return false
  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(sessionValue), Buffer.from(token))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const data = readDestinations()
  if (slug) {
    return NextResponse.json(data[slug] ?? null)
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body: Record<string, unknown> = await req.json()
  const { slug, ...fields } = body as { slug: string } & Record<string, unknown>
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid or missing slug' }, { status: 400 })
  }

  const destinations = readDestinations()
  destinations[slug] = { ...(destinations[slug] as Record<string, unknown> ?? {}), ...fields }
  writeDestinations(destinations)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid or missing slug' }, { status: 400 })
  }

  const destinations = readDestinations()
  delete destinations[slug]
  writeDestinations(destinations)

  return NextResponse.json({ ok: true })
}
