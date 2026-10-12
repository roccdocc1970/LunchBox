/**
 * Audit-log viewer (roadmap item 15). Lists recent entries from school A's audit log, read
 * through the same RLS-scoped client the app uses (only the school's admin can read it).
 *
 *   npm run audit                          25 most recent entries
 *   npm run audit -- --n=100               more
 *   npm run audit -- --table=students      one audited table (or --table=agent_action)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}
const N = Math.max(1, parseInt(option('n', '25'), 10) || 25)
const TABLE = option('table', '')

function need(name) {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}.`); process.exit(2) }
  return v
}

function summarize(entry) {
  const c = entry.changes || {}
  if (entry.action === 'AGENT_APPROVED') return `tool ${c.tool}${c.summary && Object.keys(c.summary).length ? ' ' + JSON.stringify(c.summary) : ''}`
  if (entry.action === 'UPDATE') return Object.entries(c).map(([k, v]) => `${k}: ${JSON.stringify(v.old)} → ${JSON.stringify(v.new)}`).join('; ').slice(0, 90)
  return `${Object.keys(c).length} fields`
}

async function main() {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need('ISO_A_EMAIL'), password: need('ISO_A_PASSWORD') })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })

  let q = supabase.from('audit_log').select('*').order('occurred_at', { ascending: false }).limit(N)
  if (TABLE) q = q.eq('table_name', TABLE)
  const { data: rows, error: qErr } = await q
  if (qErr) throw new Error(`Could not read the audit log: ${qErr.message}`)
  if (!rows.length) { console.log('The audit log is empty. Make a change to an audited table first (or run `npm run test:audit`).'); return }

  console.table(rows.map(r => ({
    when: new Date(r.occurred_at).toLocaleString(),
    who: r.actor_kind === 'user' ? `user ${String(r.actor_id).slice(0, 8)}` : 'service (no user)',
    action: r.action,
    table: r.table_name,
    row: String(r.row_id || '').slice(0, 8),
    what: summarize(r),
  })))
}

main().catch(err => { console.error(err.message); process.exit(2) })
