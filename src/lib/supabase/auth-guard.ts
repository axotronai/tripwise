/**
 * Auth guard helpers — verifies the calling user owns a given trip.
 * Use in every /api/trips/[id]/* route to prevent IDOR attacks.
 */
import { NextResponse } from 'next/server'
import { createClient }     from './server'
import { createAdminClient } from './server-admin'

export type GuardResult =
  | { userId: string; error: null }
  | { userId: null;   error: NextResponse }

/**
 * Ensures the authenticated user owns the given trip.
 * Returns { userId, error: null } on success,
 *         { userId: null, error: <NextResponse> } otherwise.
 */
export async function requireTripOwner(tripId: string): Promise<GuardResult> {
  // 1. Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // 2. Check trip ownership (select only user_id for minimal data exposure)
  const admin = createAdminClient()
  const { data: trip, error: dbError } = await admin
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  if (dbError || !trip) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Trip not found' }, { status: 404 }),
    }
  }

  if (trip.user_id !== user.id) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { userId: user.id, error: null }
}
