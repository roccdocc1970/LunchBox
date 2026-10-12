/**
 * Audit-log test (roadmap item 15). Run: npm run test:audit
 *
 * Proves, using only the two existing school accounts:
 *   1. every change to an audited table is recorded (insert, update, delete) with the right
 *      actor and the changed fields;
 *   2. another school cannot read this school's log;
 *   3. nobody can write, edit or delete the log through the API;
 *   4. record_agent_approval() always records the CALLER as the actor (cannot be forged).
 *
 * It creates one ⚡-marked incident for an existing student of school A, edits it, deletes it,
 * and reads back the audit entries. Note: the log is append-only by design, so every run leaves
 * a few permanent ⚡ test entries behind.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

function need(name) {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}. See .env.isolation.example.`); process.exit(2) }
  return v
}

async function signIn(prefix) {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need(`${prefix}_EMAIL`), password: need(`${prefix}_PASSWORD`) })
  if (error) throw new Error(`${prefix} sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  const ctx = await getSchoolContext(supabase)
  return { supabase, user: data.user, ...ctx }
}

const results = []
const check = (name, ok, detail = '') => results.push({ check: name, status: ok ? 'PASS' : 'FAIL', detail })

async function main() {
  const A = await signIn('ISO_A')
  const B = await signIn('ISO_B')

  const { data: student } = await A.supabase.from('students').select('id').eq('school_id', A.schoolId).limit(1).single()
  if (!student) throw new Error('School A has no students to attach a test incident to.')

  // 1. Insert, update, delete a ⚡ incident as school A.
  const { data: inc, error: insErr } = await A.supabase.from('incidents').insert({
    school_id: A.schoolId, student_id: student.id, student_name: '⚡ audit test', date: new Date().toISOString().slice(0, 10),
    type: 'Other', description: '⚡ AUDIT-TEST', reported_by: '⚡ test', status: 'Open',
  }).select().single()
  if (insErr) throw new Error(`Could not create the test incident: ${insErr.message}`)
  await A.supabase.from('incidents').update({ status: 'Resolved' }).eq('id', inc.id)
  await A.supabase.from('incidents').delete().eq('id', inc.id)

  const { data: entries, error: readErr } = await A.supabase.from('audit_log').select('*')
    .eq('row_id', inc.id).order('occurred_at', { ascending: true })
  if (readErr) throw new Error(`School A could not read its own log: ${readErr.message}`)

  const actions = (entries || []).map(e => e.action)
  check('INSERT, UPDATE, DELETE each recorded', JSON.stringify(actions) === JSON.stringify(['INSERT', 'UPDATE', 'DELETE']), actions.join(' → ') || 'no entries')
  check('actor is the signed-in user', (entries || []).length > 0 && entries.every(e => e.actor_id === A.user.id && e.actor_kind === 'user'))
  const upd = (entries || []).find(e => e.action === 'UPDATE')
  check('UPDATE records old and new values', upd?.changes?.status?.old === 'Open' && upd?.changes?.status?.new === 'Resolved', JSON.stringify(upd?.changes || {}).slice(0, 80))
  check('entries carry the owning school', (entries || []).length > 0 && entries.every(e => e.school_id === A.schoolId))

  // 2. School B cannot read school A's log.
  const { data: seenByB } = await B.supabase.from('audit_log').select('id').eq('row_id', inc.id)
  check("school B cannot read school A's entries", (seenByB || []).length === 0)
  const { data: allB } = await B.supabase.from('audit_log').select('school_id').limit(500)
  check('school B sees no entries from other schools', (allB || []).every(r => r.school_id === B.schoolId))

  // 3. The log cannot be written through the API.
  const forgedInsert = await A.supabase.from('audit_log').insert({ school_id: A.schoolId, actor_kind: 'user', table_name: 'forged', action: 'INSERT' }).select()
  check('direct INSERT into the log is refused', !!forgedInsert.error || !(forgedInsert.data || []).length, forgedInsert.error?.message || '')
  const editAttempt = await A.supabase.from('audit_log').update({ action: 'DELETE' }).eq('id', entries[0].id).select()
  check('UPDATE of a log entry is refused', !!editAttempt.error || !(editAttempt.data || []).length, editAttempt.error?.message || '')
  const deleteAttempt = await A.supabase.from('audit_log').delete().eq('id', entries[0].id).select()
  check('DELETE of a log entry is refused', !!deleteAttempt.error || !(deleteAttempt.data || []).length, deleteAttempt.error?.message || '')
  const { count: stillThere } = await A.supabase.from('audit_log').select('*', { count: 'exact', head: true }).eq('row_id', inc.id)
  check('entries are all still present afterward', stillThere === 3)

  // 4. Agent-approval entries are always written in the caller's own name and school.
  const approval = await B.supabase.rpc('record_agent_approval', { p_tool: '⚡ audit-test', p_target: student.id, p_summary: { note: 'test' } })
  check('record_agent_approval accepts a signed-in caller', !approval.error, approval.error?.message || '')
  const { data: bEntries } = await B.supabase.from('audit_log').select('*').eq('action', 'AGENT_APPROVED').order('occurred_at', { ascending: false }).limit(1)
  const mine = bEntries?.[0]
  check('approval entry is attributed to the caller and the caller\'s school', mine?.actor_id === B.user.id && mine?.school_id === B.schoolId)
  const { data: seenByA } = await A.supabase.from('audit_log').select('id').eq('id', mine?.id || '00000000-0000-0000-0000-000000000000')
  check("approval entry is not visible to the other school", (seenByA || []).length === 0)

  console.table(results)
  const failed = results.filter(r => r.status === 'FAIL').length
  console.log(`\n${results.length - failed} passed, ${failed} FAILED`)
  process.exit(failed ? 1 : 0)
}

main().catch(err => { console.error(err.message); process.exit(2) })
