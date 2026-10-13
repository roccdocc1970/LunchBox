/**
 * Policy Upload Service (browser only)
 *
 * Thin client for /api/policies/ingest. Forwards the current Supabase session's access token so
 * the server acts as this admin under RLS (same pattern as services/chat.js). Kept separate from
 * services/policies.js because that file is also run by Node scripts, which cannot import the
 * browser Supabase client.
 */

import { supabase } from '../supabase'

/** Sends one policy document for chunking, embedding and storage. Returns { chunks, chars, replaced }. */
export async function uploadPolicy({ title, text, filename }) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/policies/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ title, text, filename }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}
