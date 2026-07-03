/**
 * Zod schemas for trip API validation.
 * All user-supplied fields are typed, range-checked, and length-capped
 * before they ever touch the database.
 *
 * Booking-site security practice: strict server-side schemas are the
 * first line of defense against injection, data corruption, and DoS.
 */

import { z } from 'zod'

// ─── Shared field definitions ─────────────────────────────────────────────────

const TRAVEL_STYLES = ['budget', 'comfort', 'luxury', 'adventure', 'family'] as const
const DIET_OPTIONS  = ['any', 'veg', 'nonveg', 'jain'] as const

const destination = z.string().trim().min(1).max(100)
const startCity   = z.string().trim().min(1).max(100)
const dateStr     = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
const travelStyle = z.enum(TRAVEL_STYLES)
const groupSize   = z.number().int().min(1).max(50)
const children    = z.number().int().min(0).max(20).default(0)
const totalBudget = z.number().min(500).max(10_000_000)   // ₹500 – ₹1 crore
const totalDays   = z.number().int().min(1).max(90)
const diet        = z.enum(DIET_OPTIONS).default('any')

// ─── POST /api/trips — create trip ───────────────────────────────────────────

export const CreateTripSchema = z.object({
  destination,
  start_city:   startCity,
  start_date:   dateStr,
  end_date:     dateStr,
  total_days:   totalDays,
  total_budget: totalBudget,
  travel_style: travelStyle,
  group_size:   groupSize,
  children,
  diet,
}).refine(d => d.start_date <= d.end_date, {
  message: 'start_date must be on or before end_date',
  path: ['start_date'],
})

export type CreateTripInput = z.infer<typeof CreateTripSchema>

// ─── PATCH /api/trips/[id] — update trip ─────────────────────────────────────

export const UpdateTripSchema = z.object({
  total_budget: totalBudget.optional(),
  travel_style: travelStyle.optional(),
  group_size:   groupSize.optional(),
  children:     children.optional(),
  title:        z.string().trim().min(1).max(200).optional(),
  // ai_insights is a JSON blob written by server — keep permissive but cap size
  ai_insights:  z.string().max(50_000).optional(),
}).refine(
  obj => Object.keys(obj).length > 0,
  { message: 'At least one field must be provided' }
)

export type UpdateTripInput = z.infer<typeof UpdateTripSchema>

// ─── POST /api/trips/[id]/save-itinerary ─────────────────────────────────────

export const ActivitySchema = z.object({
  name:        z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  start_time:  z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_time:    z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  cost:        z.number().min(0).max(1_000_000).default(0),
  type:        z.string().trim().max(50).default('sightseeing'),
  location:    z.string().trim().max(200).optional().nullable(),
  is_free:     z.boolean().default(false),
  order_index: z.number().int().min(0).default(0),
})

export const SaveItinerarySchema = z.object({
  days: z.array(z.object({
    day_number:           z.number().int().min(1).max(90),
    date:                 dateStr,
    city:                 z.string().trim().min(1).max(100),
    daily_budget:         z.number().min(0).optional(),
    notes:                z.string().trim().max(2000).optional().nullable(),
    // AI plan fields — combined into `notes` column when saving
    theme:                z.string().trim().max(200).optional(),
    hotel_suggestion:     z.string().trim().max(300).optional(),
    hotel_cost_per_night: z.number().min(0).optional(),
    food_plan:            z.string().trim().max(500).optional(),
    local_tip:            z.string().trim().max(500).optional(),
    activities:           z.array(ActivitySchema).max(20).default([]),
  })).min(1).max(90),
})

// ─── Shared helper — parse body with body-size guard ─────────────────────────

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success, { error: NextResponse } on failure.
 */
import { NextRequest, NextResponse } from 'next/server'

const MAX_BODY_BYTES: Record<string, number> = {
  default:        50_000,   // 50 KB — trip create/update
  'save-itinerary': 500_000, // 500 KB — full day+activity payload
}

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
  sizeKey = 'default',
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  // 1. Content-length guard (best-effort — not set by all clients)
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  const maxBytes = MAX_BODY_BYTES[sizeKey] ?? MAX_BODY_BYTES.default
  if (contentLength > maxBytes) {
    return { data: null, error: NextResponse.json({ error: 'Request too large' }, { status: 413 }) }
  }

  // 2. Parse JSON
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { data: null, error: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  }

  // 3. Validate schema
  const result = schema.safeParse(raw)
  if (!result.success) {
    const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    return { data: null, error: NextResponse.json({ error: `Validation failed: ${messages}` }, { status: 400 }) }
  }

  return { data: result.data, error: null }
}

// ─── CSRF / origin guard (booking-site practice) ─────────────────────────────

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axozen.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

/**
 * Verify the request Origin matches our domain.
 * Called on all state-changing routes (POST / PATCH / DELETE).
 * Browsers always send Origin for cross-site requests — if it's missing or
 * wrong it either means a non-browser client (API tools — fine) or a
 * cross-site forgery attempt.
 */
export function checkOrigin(req: NextRequest): true | NextResponse {
  const origin = req.headers.get('origin')
  // No Origin header = server-to-server call (curl, Postman, internal) — allow
  if (!origin) return true
  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return true
  return NextResponse.json({ error: 'Forbidden — invalid origin' }, { status: 403 })
}
