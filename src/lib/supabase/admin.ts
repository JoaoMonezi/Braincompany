import { createClient } from '@supabase/supabase-js'

/**
 * Admin client com service_role key.
 * Usar APENAS em API routes server-side — nunca no browser.
 * Bypassa RLS.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
