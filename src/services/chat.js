/**
 * Chat Service
 *
 * Thin client for /api/chat and /api/chat/execute. Forwards the current
 * Supabase session's access token so the backend can build a per-request
 * client scoped to this user (see api/_lib/supabaseFromRequest.js).
 */

import { supabase } from '../supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

/** Sends the full conversation so far; returns { reply, view?, pendingAction?, navigate? }. */
export async function sendChatMessage(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ messages }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Chat request failed')
  return data
}

/** Executes a write action the human has confirmed. */
export async function executeConfirmedAction(tool, input) {
  const res = await fetch('/api/chat/execute', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ tool, input }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Action failed')
  return data
}
