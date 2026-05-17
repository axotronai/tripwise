import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

const SESSION_TOKEN = process.env.ADMIN_SESSION_SECRET ?? 'tripwise-admin-secret-2025'
const DATA_PATH = path.join(process.cwd(), 'src/data/destinations.json')

function readDestinations(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function writeDestinations(data: Record<string, unknown>) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === SESSION_TOKEN
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
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

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
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const destinations = readDestinations()
  delete destinations[slug]
  writeDestinations(destinations)

  return NextResponse.json({ ok: true })
}
