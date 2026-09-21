/**
 * Executes a write action the human has explicitly confirmed in the UI.
 * This is the ONLY place a chat-originated write actually happens — the
 * main chat loop (index.js) only ever proposes these, never runs them.
 */

import { supabaseFromRequest } from '../_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../_lib/getSchoolContext.js'
import { WRITE_TOOLS } from '../_lib/tools.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let supabase, schoolId
  try {
    supabase = supabaseFromRequest(req)
    ;({ schoolId } = await getSchoolContext(supabase))
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }

  const { tool: toolName, input } = req.body || {}
  const tool = WRITE_TOOLS.find(t => t.name === toolName)
  if (!tool) return res.status(400).json({ error: 'Unknown or non-writable tool' })

  try {
    const result = await tool.run(supabase, schoolId, input || {})
    return res.status(200).json({ ok: true, result })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
