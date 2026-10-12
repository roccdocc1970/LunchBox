/**
 * Two-school isolation test (ROADMAP: Agentic Learning Track, item 0).
 *
 * Proves that school B can neither read nor write school A's data, using the
 * exact client the chat backend builds (api/_lib/supabaseFromRequest.js —
 * anon key + the caller's own JWT). No service-role key is used anywhere in
 * this script: it only does what a real user of school B could do.
 *
 * Needs two real accounts that each completed onboarding (separate schools).
 * Credentials live in .env.isolation.local (gitignored via *.local) — see
 * .env.isolation.example. Run: npm run test:isolation
 *
 * Result per check: PASS, FAIL (a leak — fix before any second school), or
 * VACUOUS (school A has no rows there, so a pass would prove nothing).
 * Nothing destructive touches A's real data: the write checks use a
 * sacrificial row that A creates and deletes itself.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { READ_TOOLS } from '../api/_lib/tools.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

// [table, column holding the owning school's id]
const TABLES = [
  ['schools', 'user_id'], ['students', 'school_id'], ['parents', 'school_id'],
  ['student_alumni_details', 'school_id'], ['student_grade_history', 'school_id'],
  ['student_health', 'school_id'], ['student_health_entries', 'school_id'],
  ['incidents', 'school_id'], ['attendance', 'school_id'], ['messages', 'school_id'],
  ['staff', 'school_id'], ['report_cards', 'school_id'], ['campaigns', 'school_id'],
  ['donations', 'school_id'], ['fundraising_events', 'school_id'],
  ['work_orders', 'school_id'], ['rooms', 'school_id'], ['buildings', 'school_id'],
  ['cohorts', 'school_id'], ['cohort_students', 'school_id'], ['cohort_classes', 'school_id'],
  ['periods', 'school_id'], ['classes', 'school_id'], ['class_sections', 'school_id'],
  ['class_enrollments', 'school_id'], ['agent_traces', 'school_id'],
]

const results = []
const record = (area, check, status, detail = '') => results.push({ area, check, status, detail })

function need(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing ${name}. Copy .env.isolation.example to .env.isolation.local and fill it in.`)
    process.exit(2)
  }
  return v
}

async function signIn(prefix) {
  const url = need('VITE_SUPABASE_URL')
  const anon = need('VITE_SUPABASE_ANON_KEY')
  const bootstrap = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({
    email: need(`${prefix}_EMAIL`), password: need(`${prefix}_PASSWORD`),
  })
  if (error) throw new Error(`${prefix} sign-in failed: ${error.message}`)
  // Build the client the same way the real backend does.
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  let ctx
  try {
    ctx = await getSchoolContext(supabase)
  } catch (err) {
    throw new Error(`${prefix} signed in, but: ${err.message}. This login needs to be a school admin (owns a row in the schools table) or a linked staff member.`)
  }
  return { supabase, ...ctx }
}

async function fetchAll(supabase, table) {
  const { data, error } = await supabase.from(table).select('*').limit(2000)
  return { rows: data || [], error }
}

const idsOf = rows => rows.map(r => r.id).filter(Boolean)

async function main() {
  const A = await signIn('ISO_A')
  const B = await signIn('ISO_B')
  if (A.schoolId === B.schoolId) {
    console.error('Accounts A and B resolve to the SAME school — the test needs two different schools.')
    process.exit(2)
  }
  console.log(`School A: ${A.schoolId}\nSchool B: ${B.schoolId}\n`)

  // 1. Table sweep — everything B can see must belong to B.
  const aIds = new Set()
  for (const [table, col] of TABLES) {
    const a = await fetchAll(A.supabase, table)
    if (a.error) { record('table sweep', table, 'FAIL', `A could not read its own table: ${a.error.message}`); continue }
    idsOf(a.rows).forEach(id => aIds.add(id))
    const b = await fetchAll(B.supabase, table)
    if (b.error) { record('table sweep', table, 'PASS', `B denied: ${b.error.message}`); continue }
    const foreign = b.rows.filter(r => r[col] && r[col] !== B.schoolId)
    if (foreign.length) record('table sweep', table, 'FAIL', `B saw ${foreign.length} row(s) owned by another school`)
    else if (a.rows.length === 0) record('table sweep', table, 'VACUOUS', 'school A has no rows here — seed some')
    else record('table sweep', table, 'PASS', `A has ${a.rows.length}, B sees 0 of them`)
  }

  // 2. Anonymous (no session) — must see nothing.
  const anon = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  for (const [table] of TABLES) {
    const { data, error } = await anon.from(table).select('*').limit(5)
    record('anonymous', table, !error && data?.length ? 'FAIL' : 'PASS', error ? 'denied' : `${data?.length || 0} rows`)
  }

  // 3. Chat tools run as B. School-scoped tools get B's id, then A's id (a
  //    spoofed value — can't happen in the real path, but RLS is the backstop).
  const leaked = (value, allowId) => {
    const text = JSON.stringify(value ?? null)
    for (const id of aIds) if (id !== allowId && text.includes(id)) return true
    return false
  }
  const aStudent = (await fetchAll(A.supabase, 'students')).rows[0]
  for (const tool of READ_TOOLS) {
    const studentScoped = tool.run.length >= 3 && /studentId/.test(tool.run.toString())
    const inputs = studentScoped ? [{ studentId: aStudent?.id }] : [{}]
    if (studentScoped && !aStudent) { record('tools', tool.name, 'VACUOUS', 'school A has no students'); continue }
    for (const schoolId of studentScoped ? [B.schoolId] : [B.schoolId, A.schoolId]) {
      const label = studentScoped ? `${tool.name} (A's studentId)` : `${tool.name} (schoolId=${schoolId === A.schoolId ? 'A, spoofed' : 'B'})`
      try {
        const out = await tool.run(B.supabase, schoolId, inputs[0], { isStaff: false, role: null })
        const nonEmptyArray = studentScoped && Array.isArray(out) && out.length > 0
        record('tools', label, leaked(out, aStudent?.id) || nonEmptyArray ? 'FAIL' : 'PASS')
      } catch (err) {
        record('tools', label, 'PASS', `denied/errored: ${err.message.slice(0, 60)}`)
      }
    }
  }

  // 4. Writes — A creates a sacrificial row; B tries to modify, delete, and
  //    forge rows into A. A's real data is never at risk.
  const marker = `⚡ ISOLATION-TEST ${Date.now()}`
  const { data: made, error: makeErr } = await A.supabase.from('work_orders')
    .insert({ school_id: A.schoolId, title: marker, category: 'Other', priority: 'Low', status: 'Open' })
    .select().single()
  if (makeErr) {
    record('writes', 'sacrificial row', 'VACUOUS', `could not create test row: ${makeErr.message}`)
  } else {
    try {
      const upd = await B.supabase.from('work_orders').update({ title: 'HIJACKED' }).eq('id', made.id).select()
      record('writes', "B updates A's row", upd.data?.length ? 'FAIL' : 'PASS')
      const del = await B.supabase.from('work_orders').delete().eq('id', made.id).select()
      record('writes', "B deletes A's row", del.data?.length ? 'FAIL' : 'PASS')
      const forge = await B.supabase.from('work_orders')
        .insert({ school_id: A.schoolId, title: '⚡ FORGED', category: 'Other', priority: 'Low', status: 'Open' }).select()
      record('writes', "B inserts a row into A", forge.data?.length ? 'FAIL' : 'PASS', forge.error ? 'denied' : '')
      const { data: still } = await A.supabase.from('work_orders').select('title').eq('id', made.id).maybeSingle()
      record('writes', "A's row unchanged afterward", still?.title === marker ? 'PASS' : 'FAIL')
    } finally {
      await A.supabase.from('work_orders').delete().eq('id', made.id)
      await A.supabase.from('work_orders').delete().eq('title', '⚡ FORGED')
    }
  }

  // Report
  const order = { FAIL: 0, VACUOUS: 1, PASS: 2 }
  console.table(results.sort((x, y) => order[x.status] - order[y.status])
    .map(r => ({ area: r.area, check: r.check, status: r.status, detail: r.detail })))
  const count = s => results.filter(r => r.status === s).length
  console.log(`\n${count('PASS')} passed, ${count('FAIL')} FAILED, ${count('VACUOUS')} vacuous (not meaningful yet)`)
  process.exit(count('FAIL') ? 1 : 0)
}

main().catch(err => { console.error(err.message); process.exit(2) })
