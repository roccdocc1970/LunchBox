/**
 * Builds a per-request Supabase client scoped to the calling user's own
 * session — the anon key plus their JWT, exactly like the browser client
 * (src/supabase.js). This is the whole multi-tenant safety mechanism for
 * the chat backend: every query the model triggers goes through the same
 * RLS policies already enforced everywhere else in the app, so tenant
 * isolation is inherited for free instead of re-implemented here.
 *
 * Never use the service-role key in this backend — see the plan's
 * Architecture section for why.
 */

import { createClient } from '@supabase/supabase-js'

export function supabaseFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!accessToken) {
    const err = new Error('Missing Authorization bearer token')
    err.status = 401
    throw err
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
