import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// Use service role key if it looks like a real JWT, otherwise fall back to anon key
const ACTIVE_KEY = SERVICE_KEY.startsWith('eyJ') ? SERVICE_KEY : ANON_KEY

// Server-side admin client — bypasses RLS when service role key is configured.
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, ACTIVE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
