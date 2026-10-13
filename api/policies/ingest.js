/**
 * Policy upload endpoint (roadmap Step 7 feature): chunks, embeds and stores one policy document.
 *
 * Runs with the CALLER's own Supabase session (never the service-role key), so RLS decides what
 * can be written. Admin-only: staff may read policies through chat but cannot change them.
 * Embedding happens here, on the server, because the embedding model runs server-side
 * (api/_lib/embed.js) — note that a local model does not run on Vercel's serverless hosting, so
 * until a hosted embedding service is chosen this endpoint works in local development
 * (`npm run dev:api`). Replacing a document is by title; the old version is removed only after the
 * new one is fully stored.
 */

import { supabaseFromRequest } from '../_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../_lib/getSchoolContext.js'
import { embedTexts } from '../_lib/embed.js'
import { ingestPolicy } from '../../src/services/policies.js'
import { validatePolicyInput } from '../../src/domain/policies.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let supabase, ctx
  try {
    supabase = supabaseFromRequest(req)
    ctx = await getSchoolContext(supabase)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
  if (ctx.isStaff) return res.status(403).json({ error: 'Only a school admin can manage policy documents.' })

  const { title, text, filename } = req.body || {}
  const problem = validatePolicyInput({ title, text, filename })
  if (problem) return res.status(400).json({ error: problem })

  try {
    const result = await ingestPolicy(
      supabase,
      { schoolId: ctx.schoolId, userId: ctx.userId, title: String(title).trim(), filename: filename || null, text: String(text) },
      embedTexts,
    )
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    console.error('policy ingest failed:', err.message) // details stay in the server log
    return res.status(500).json({ error: 'The document could not be processed. Please try again.' })
  }
}
