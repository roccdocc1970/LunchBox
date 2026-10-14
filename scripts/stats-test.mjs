/**
 * Tests for the code-computed statistics tool (roadmap Step 9 / ID 8). Run: npm run test:stats
 * Free: no model and (by default) no database. Expected numbers below are written out by hand, not
 * recomputed with the code under test.
 *
 *   npm run test:stats              offline checks on fake rows
 *   npm run test:stats -- --live    also runs every topic against school A's real data (needs
 *                                   .env.isolation.local; reads only; still no model)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { computeStats, getSchoolStats, mayViewTopic, TOPIC_NAMES, ROW_CAP } from '../api/_lib/schoolStats.js'
import { READ_TOOLS } from '../api/_lib/tools.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

let passed = 0, failed = 0
const ok = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`PASS  ${name}`) }
  else { failed++; console.log(`FAIL  ${name} ${detail}`) }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// ---------- fake data ----------
const students = [
  { first_name: 'A', last_name: 'One', grade: '3rd Grade', status: 'Enrolled' },
  { first_name: 'B', last_name: 'Two', grade: '3rd Grade', status: 'Enrolled' },
  { first_name: 'C', last_name: 'Three', grade: '4th Grade', status: 'Enrolled' },
  { first_name: 'D', last_name: 'Four', grade: '3rd Grade', status: 'Applied' },
  { first_name: 'E', last_name: 'Five', grade: '5th Grade', status: 'Waitlisted' },
]
const workOrders = [
  { title: 'Leak', status: 'Open', priority: 'Urgent', category: 'Plumbing' },
  { title: 'Light', status: 'Open', priority: 'Low', category: 'Electrical' },
  { title: 'Door', status: 'In Progress', priority: 'High', category: 'Carpentry' },
  { title: 'Fan', status: 'Completed', priority: 'Urgent', category: 'HVAC', completed_date: '2000-01-15' },
  { title: 'Roof', status: 'Open', priority: 'Urgent', category: 'Plumbing' },
]
const incidents = [
  { status: 'Open', type: 'Safety' }, { status: 'Open', type: 'Behavioral' },
  { status: 'Resolved', type: 'Safety' }, { status: 'Open', type: 'Safety' },
]

// ---------- students ----------
let r = computeStats('students', students)
ok('students: totals by status', same(r.stats, { enrolled: 3, applied: 1, waitlisted: 1, total: 5 }), JSON.stringify(r.stats))
ok('students: rows_read is 5 and no filter-only fields appear', r.rows_read === 5 && r.matching === undefined && !r.note)
r = computeStats('students', students, { grade: '3rd Grade' })
ok('students: grade filter counts only that grade', same(r.stats, { enrolled: 2, applied: 1, waitlisted: 0, total: 3 }) && r.matching === 3, JSON.stringify(r))
r = computeStats('students', students, { grade: '3rd Grade', status: 'Enrolled' })
ok('students: grade + status together', r.stats.total === 2 && r.matching === 2)
r = computeStats('students', students, { grade: '12th Grade' })
ok('students: a grade with nobody gives a real zero, not an error', r.stats.total === 0 && r.matching === 0)

// ---------- unsupported filters are reported, never dropped ----------
r = computeStats('students', students, { priority: 'Urgent' })
ok('unsupported filter: reported and the numbers cover all records', same(r.ignored_filters, ['priority']) && r.stats.total === 5 && /cannot filter by priority/.test(r.note), JSON.stringify(r))
r = computeStats('staff', [{ status: 'Active' }], { grade: '3rd Grade' })
ok('unsupported filter on a topic with no filters', same(r.ignored_filters, ['grade']))

// ---------- facilities (and the "All" trap) ----------
r = computeStats('facilities', workOrders)
ok('facilities: no filter leaves every row in', r.stats.open === 3 && r.stats.inProgress === 1 && r.stats.urgent === 2, JSON.stringify(r.stats))
r = computeStats('facilities', workOrders, { priority: 'Urgent' })
ok('facilities: priority filter alone does not zero out (the "All" default trap)', r.matching === 3, JSON.stringify(r))
r = computeStats('facilities', workOrders, { status: 'Open', category: 'Plumbing' })
ok('facilities: status + category', r.matching === 2 && r.stats.open === 2)
r = computeStats('facilities', workOrders, { status: 'Open', priority: 'Urgent' })
ok('facilities: open AND urgent', r.matching === 2)

// ---------- incidents ----------
r = computeStats('incidents', incidents)
ok('incidents: total, open, resolved', same(r.stats, { total: 4, open: 3, resolved: 1 }), JSON.stringify(r.stats))
r = computeStats('incidents', incidents, { status: 'Open', type: 'Safety' })
ok('incidents: open safety incidents', r.matching === 2 && r.stats.total === 2)
ok('incidents: the topic description says there is no severity field', /no severity/i.test(JSON.stringify(READ_TOOLS.find(t => t.name === 'get_school_stats').description)))

// ---------- other topics ----------
r = computeStats('fundraising', { campaigns: [{ status: 'Active' }, { status: 'Completed' }], donations: [{ amount: 100.5, donor_id: 'x' }, { amount: 49.5, donor_id: 'x' }, { amount: 50, donor_name: 'Pat' }], events: [{}] })
ok('fundraising: total raised, active campaigns, unique donors, events', same(r.stats, { totalRaised: 200, activeCampaigns: 1, uniqueDonors: 2, eventCount: 1 }), JSON.stringify(r.stats))
ok('fundraising: rows_read counts all three lists', r.rows_read === 6)
r = computeStats('admissions', [{ status: 'Toured', source: 'Web' }, { status: 'Toured', source: 'Web' }, { status: 'New Inquiry', source: 'Referral' }])
ok('admissions: counts by stage and by source', r.stats.pipeline.Toured === 2 && r.stats.pipeline['New Inquiry'] === 1 && r.stats.sources.Web === 2 && r.stats.sources.Referral === 1, JSON.stringify(r.stats))
r = computeStats('rooms', [{ type: 'Classroom', capacity: 25 }, { type: 'Classroom', capacity: '20' }, { type: 'Gymnasium', capacity: 100 }])
ok('rooms: capacity adds numbers stored as text', r.stats.total === 3 && r.stats.capacity === 145 && r.stats.byType.Classroom === 2, JSON.stringify(r.stats))
r = computeStats('report_cards', [{ published: true }, { published: false }, { published: true }])
ok('report cards: published vs draft', same(r.stats, { total: 3, published: 2, draft: 1 }))
r = computeStats('alumni', [{ donor_status: 'Active Donor', opt_in: true }, { donor_status: 'Prospect', opt_in: false }, { donor_status: 'Never', opt_in: true }])
ok('alumni: donors, prospects, opted in', same(r.stats, { total: 3, activeDonors: 1, prospects: 1, optedIn: 2 }))

// ---------- the 1000-row cap ----------
r = computeStats('staff', Array.from({ length: ROW_CAP }, () => ({ status: 'Active' })))
ok('row cap: a possibly-truncated list carries a warning', /may have capped/.test(r.warning || ''))
r = computeStats('staff', Array.from({ length: ROW_CAP - 1 }, () => ({ status: 'Active' })))
ok('row cap: no warning just under the cap', !r.warning)

// ---------- roles ----------
ok('roles: school admin may view every topic', TOPIC_NAMES.every(t => mayViewTopic(t, { isStaff: false })))
ok('roles: a teacher may view students, incidents, facilities', ['students', 'incidents', 'facilities'].every(t => mayViewTopic(t, { isStaff: true, role: 'Teacher' })))
ok('roles: a teacher may NOT view alumni, fundraising, admissions or staff', ['alumni', 'fundraising', 'admissions', 'staff'].every(t => !mayViewTopic(t, { isStaff: true, role: 'Teacher' })))
ok('roles: a principal may view the staff directory; a counselor may not', mayViewTopic('staff', { isStaff: true, role: 'Principal' }) && !mayViewTopic('staff', { isStaff: true, role: 'Counselor' }))
const denied = await getSchoolStats(null, 'school', { topic: 'alumni' }, { isStaff: true, role: 'Teacher' })
ok('roles: a denied request returns access none and never touches the database', denied.access === 'none')
const unknown = await getSchoolStats(null, 'school', { topic: 'lunch_menu' }, {})
ok('unknown topic: an error listing valid topics', !!unknown.error && Array.isArray(unknown.topics))

// ---------- tool registration ----------
const names = READ_TOOLS.map(t => t.name)
ok('tools: get_school_stats and get_school_incidents are registered', names.includes('get_school_stats') && names.includes('get_school_incidents'))
ok('tools: tool names are unique', new Set(names).size === names.length)
const statsTool = READ_TOOLS.find(t => t.name === 'get_school_stats')
ok('tools: the topic list in the schema matches the module', same(statsTool.input_schema.properties.topic.enum, TOPIC_NAMES))

// ---------- live wiring check (optional) ----------
if (process.argv.includes('--live')) {
  const need = n => { const v = process.env[n]; if (!v) { console.error(`Missing ${n}`); process.exit(2) } return v }
  const { supabaseFromRequest } = await import('../api/_lib/supabaseFromRequest.js')
  const { getSchoolContext } = await import('../api/_lib/getSchoolContext.js')
  const boot = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await boot.auth.signInWithPassword({ email: need('ISO_A_EMAIL'), password: need('ISO_A_PASSWORD') })
  if (error) { console.error(`Sign-in failed: ${error.message}`); process.exit(2) }
  const sb = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  const ctx = await getSchoolContext(sb)
  console.log(`\nLive: every topic against school A (admin)`)
  const rows = []
  for (const topic of TOPIC_NAMES) {
    try {
      const res = await getSchoolStats(sb, ctx.schoolId, { topic }, ctx)
      ok(`live: ${topic} runs and returns numbers`, !!res.stats && typeof res.rows_read === 'number', JSON.stringify(res).slice(0, 120))
      rows.push({ topic, rows_read: res.rows_read, stats: JSON.stringify(res.stats).slice(0, 90) })
    } catch (e) { ok(`live: ${topic} runs`, false, e.message) }
  }
  console.table(rows)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
