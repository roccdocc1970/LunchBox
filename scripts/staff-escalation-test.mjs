/**
 * Staff self-update escalation test (ROADMAP Item 0, finding F9).
 *
 * Question: can a user rewrite their OWN staff row so that it points at
 * another school — and thereby gain staff-level read access to that school?
 *
 * Why it might be possible: the `staff_update_own` policy only checks
 * `email = auth.email()` (no column limits), and `get_staff_school_id()`
 * decides a staff member's school from their own staff row.
 *
 * No third account is needed. Any school admin can create a staff row with
 * their own email, so this test uses the existing school B admin as the
 * "attacker" and school A as the target. Only ⚡-marked test rows are
 * created, and they are always deleted at the end (by whichever admin owns
 * the row at that point). Run: npm run test:staff-escalation
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

function need(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing ${name}. See .env.isolation.example.`)
    process.exit(2)
  }
  return v
}

async function signIn(prefix) {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({
    email: need(`${prefix}_EMAIL`), password: need(`${prefix}_PASSWORD`),
  })
  if (error) throw new Error(`${prefix} sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  const ctx = await getSchoolContext(supabase)
  return { supabase, user: data.user, ...ctx }
}

async function main() {
  const A = await signIn('ISO_A')
  const B = await signIn('ISO_B')
  if (A.schoolId === B.schoolId) {
    console.error('Accounts A and B must be two different schools.')
    process.exit(2)
  }

  const marker = '⚡ ISO-STAFF-TEST'
  const steps = []
  const note = (step, outcome, detail = '') => steps.push({ step, outcome, detail })
  let exploitWorks = false

  // 1. As admin of school B, create a staff row carrying B's own email.
  const { data: row, error: insErr } = await B.supabase.from('staff')
    .insert({ school_id: B.schoolId, first_name: marker, last_name: 'TEST', email: B.user.email, role: 'Teacher', status: 'Active' })
    .select().single()
  if (insErr) {
    console.error(`Could not create the test staff row: ${insErr.message}`)
    process.exit(2)
  }
  note('1. Admin B creates a staff row with B\'s own email', 'done')

  try {
    // 2. Try to rewrite that row to point at school A and link B's login to it.
    const upd = await B.supabase.from('staff')
      .update({ school_id: A.schoolId, auth_user_id: B.user.id })
      .eq('id', row.id).select()
    const moved = !!upd.data?.length && upd.data[0].school_id === A.schoolId
    note('2. B rewrites its own staff row to point at school A', moved ? 'FAIL — allowed' : 'PASS — blocked',
      upd.error ? upd.error.message : '')

    // 3. Does the helper function now resolve B to school A?
    const { data: resolved } = await B.supabase.rpc('get_staff_school_id')
    note('3. get_staff_school_id() for B now returns', resolved === A.schoolId ? 'FAIL — school A' : 'PASS — not school A',
      resolved ? `school ${resolved === B.schoolId ? 'B' : resolved === A.schoolId ? 'A' : 'other'}` : 'null')

    // 4. Can B now read school A's students through the staff policy?
    const { data: studs } = await B.supabase.from('students').select('id, school_id').eq('school_id', A.schoolId).limit(5)
    const leaked = studs?.length || 0
    note("4. B reads school A's students", leaked ? `FAIL — saw ${leaked}+ rows` : 'PASS — saw none')

    exploitWorks = moved || resolved === A.schoolId || leaked > 0
  } finally {
    // Cleanup: whichever admin owns the row now deletes it.
    await B.supabase.from('staff').delete().eq('id', row.id)
    await A.supabase.from('staff').delete().eq('id', row.id)
    const left = [
      ...((await A.supabase.from('staff').select('id').eq('id', row.id)).data || []),
      ...((await B.supabase.from('staff').select('id').eq('id', row.id)).data || []),
    ]
    note('Cleanup: test row removed', left.length ? 'WARNING — row still exists, delete it manually (first name starts with ⚡ ISO-STAFF-TEST)' : 'done')
  }

  console.table(steps)
  console.log(exploitWorks
    ? '\nRESULT: ESCALATION POSSIBLE — a staff member can redirect their own record to another school. Fix before any second school uses this.'
    : '\nRESULT: blocked — the staff self-update rule did not allow the escalation.')
  process.exit(exploitWorks ? 1 : 0)
}

main().catch(err => { console.error(err.message); process.exit(2) })
