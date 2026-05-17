import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('your_supabase')
}

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
