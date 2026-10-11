/**
 * Eval runner (ROADMAP: Agentic Learning Track, item 1).
 *
 * Two phases, cheapest first:
 *
 *  1. TOOL CHECKS (free, no model). Each chat tool is run directly and compared with a plain
 *     database count. This verifies the data the model will be handed is correct, so a later
 *     model failure can be pinned on the model, not the tool.
 *
 *  2. MODEL EVALS (costs tokens — only runs with --model). Each question is sent through the
 *     real chat handler (api/chat/index.js) and the reply is scored against the right answer,
 *     which is computed from the database independently of the tools. Each question can be
 *     repeated, because answers vary run to run.
 *
 * Usage:
 *   npm run evals                                   tool checks only (free)
 *   npm run evals -- --model --only=cohorts         one question, one run (cheapest model run)
 *   npm run evals -- --model --repeats=3            every question, 3 repeats each
 *
 * Needs ISO_A_EMAIL / ISO_A_PASSWORD (.env.isolation.local) and, for --model, ANTHROPIC_API_KEY
 * (.env.local). Optional, to print a dollar estimate (check the Anthropic pricing page for your
 * model): EVAL_PRICE_INPUT_PER_MTOK, EVAL_PRICE_OUTPUT_PER_MTOK,
 * EVAL_PRICE_CACHE_READ_PER_MTOK, EVAL_PRICE_CACHE_WRITE_PER_MTOK.
 *
 * Scoring is deliberately strict: the right answer must appear in the reply text.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { READ_TOOLS } from '../api/_lib/tools.js'
import handler from '../api/chat/index.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const args = process.argv.slice(2)
const flag = name => args.includes(`--${name}`)
const option = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}
const RUN_MODEL = flag('model')
const REPEATS = Math.max(1, parseInt(option('repeats', '1'), 10) || 1)
const ONLY = option('only', '') ? option('only', '').split(',') : null

function need(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing ${name}. See .env.isolation.example / .env.local.`)
    process.exit(2)
  }
  return v
}

async function login() {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({
    email: need('ISO_A_EMAIL'), password: need('ISO_A_PASSWORD'),
  })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const token = data.session.access_token
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${token}` } })
  const { schoolId, isStaff, role } = await getSchoolContext(supabase)
  return { token, supabase, schoolId, ctx: { isStaff, role } }
}

/** Plain database count — the independent source of truth. */
async function count(supabase, schoolId, table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true }).eq('school_id', schoolId)
  if (filter) q = filter(q)
  const { count: n, error } = await q
  if (error) throw new Error(`${table}: ${error.message}`)
  return n
}

const withStatus = status => rows => rows.filter(r => r.status === status).length
const total = rows => rows.length

/** Each case: the question, how to compute the right answer, and how the matching tool's rows reduce to a number. */
async function buildCases(supabase, schoolId) {
  const c = (table, filter) => () => count(supabase, schoolId, table, filter)
  const cases = [
    { id: 'roster', question: 'How many students are on the active roster (Applied, Enrolled or Waitlisted)?',
      truth: c('students', q => q.in('status', ['Applied', 'Enrolled', 'Waitlisted'])), tool: 'get_students', fromTool: total },
    { id: 'enrolled', question: 'How many students are currently enrolled (status Enrolled)?',
      truth: c('students', q => q.eq('status', 'Enrolled')), tool: 'get_students', fromTool: withStatus('Enrolled') },
    { id: 'waitlisted', question: 'How many students are on the waitlist?',
      truth: c('students', q => q.eq('status', 'Waitlisted')), tool: 'get_students', fromTool: withStatus('Waitlisted') },
    { id: 'cohorts', question: 'How many cohorts does the school have?',
      truth: c('cohorts'), tool: 'get_cohorts', fromTool: total },
    { id: 'classes', question: 'How many classes are there in total?',
      truth: c('classes'), tool: 'get_classes', fromTool: total },
    { id: 'staff', question: 'How many staff members are there in total?',
      truth: c('staff'), tool: 'get_staff', fromTool: total },
    { id: 'open_work_orders', question: 'How many work orders have the status Open?',
      truth: c('work_orders', q => q.eq('status', 'Open')), tool: 'get_work_orders', fromTool: withStatus('Open') },
    { id: 'rooms', question: 'How many rooms are there?',
      truth: c('rooms'), tool: 'get_rooms', fromTool: total },
    { id: 'buildings', question: 'How many buildings are on campus?',
      truth: c('buildings'), tool: 'get_buildings', fromTool: total },
    { id: 'alumni', question: 'How many alumni does the school have?',
      truth: c('students', q => q.eq('status', 'Alumni')), tool: 'get_alumni', fromTool: total },
  ]

  // A lookup question built from live data: pick an enrolled student whose full name is unique.
  const { data: students } = await supabase.from('students').select('first_name, last_name, grade, status').eq('school_id', schoolId)
  const names = {}
  for (const s of students || []) {
    const key = `${s.first_name} ${s.last_name}`.toLowerCase()
    names[key] = (names[key] || 0) + 1
  }
  const pick = (students || []).find(s => s.status === 'Enrolled' && s.grade && names[`${s.first_name} ${s.last_name}`.toLowerCase()] === 1)
  if (pick) {
    cases.push({ id: 'grade_lookup', question: `What grade is ${pick.first_name} ${pick.last_name} in?`,
      truth: async () => pick.grade, tool: null })
  }
  // A filter-and-tally question: pick a grade with a few students on the active roster, so the model has to
  // count matching rows among all of them (the kind of tally where a miscount can creep in).
  const roster = (students || []).filter(s => ['Applied', 'Enrolled', 'Waitlisted'].includes(s.status) && s.grade)
  const perGrade = {}
  for (const s of roster) perGrade[s.grade] = (perGrade[s.grade] || 0) + 1
  const grade = Object.keys(perGrade).sort().find(g => perGrade[g] >= 2 && perGrade[g] <= 6)
  if (grade) {
    cases.push({ id: 'grade_count', question: `How many students on the active roster are in ${grade}?`,
      truth: c('students', q => q.in('status', ['Applied', 'Enrolled', 'Waitlisted']).eq('grade', grade)),
      tool: 'get_students', fromTool: rows => rows.filter(r => r.grade === grade).length })
  }
  return ONLY ? cases.filter(x => ONLY.includes(x.id)) : cases
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']

function matches(expected, reply) {
  const text = String(reply ?? '')
  if (typeof expected === 'number') {
    const digits = new RegExp(`(^|[^\\d.])${expected}([^\\d]|$)`).test(text)
    const word = expected <= 20 && new RegExp(`\\b${NUMBER_WORDS[expected]}\\b`, 'i').test(text)
    const none = expected === 0 && /\b(no|none|nobody)\b/i.test(text)
    return digits || word || none
  }
  return text.toLowerCase().includes(String(expected).toLowerCase())
}

async function ask(token, question) {
  const req = { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { messages: [{ role: 'user', content: question }] } }
  const out = { status: 200, body: null }
  const res = { status(code) { out.status = code; return res }, json(body) { out.body = body; return res } }
  await handler(req, res)
  return out
}

function priceEstimate(u) {
  const p = n => parseFloat(process.env[n])
  const inP = p('EVAL_PRICE_INPUT_PER_MTOK'), outP = p('EVAL_PRICE_OUTPUT_PER_MTOK')
  if (!(inP >= 0) || !(outP >= 0)) return null
  const readP = p('EVAL_PRICE_CACHE_READ_PER_MTOK') || 0, writeP = p('EVAL_PRICE_CACHE_WRITE_PER_MTOK') || 0
  return (u.input_tokens * inP + u.output_tokens * outP + u.cache_read_tokens * readP + u.cache_creation_tokens * writeP) / 1e6
}

async function main() {
  const { token, supabase, schoolId, ctx } = await login()
  const cases = await buildCases(supabase, schoolId)
  console.log(`School ${schoolId} — ${cases.length} question(s)\n`)

  // Phase 1 — tool checks (no model)
  const toolRows = []
  const expected = {}
  for (const cs of cases) {
    expected[cs.id] = await cs.truth()
    if (!cs.tool) continue
    const tool = READ_TOOLS.find(t => t.name === cs.tool)
    try {
      const rows = await tool.run(supabase, schoolId, {}, ctx)
      const got = cs.fromTool(rows)
      toolRows.push({ case: cs.id, tool: cs.tool, expected: expected[cs.id], tool_returns: got, status: got === expected[cs.id] ? 'PASS' : 'FAIL' })
    } catch (err) {
      toolRows.push({ case: cs.id, tool: cs.tool, expected: expected[cs.id], tool_returns: `error: ${err.message.slice(0, 40)}`, status: 'FAIL' })
    }
  }
  console.log('PHASE 1 — tool checks (no model, free)')
  console.table(toolRows)
  const toolFails = toolRows.filter(r => r.status === 'FAIL').length
  console.log(`${toolRows.length - toolFails} passed, ${toolFails} failed\n`)

  if (!RUN_MODEL) {
    console.log('Model evals not run (they cost tokens). Add --model to run them, e.g.:  npm run evals -- --model --only=cohorts')
    process.exit(toolFails ? 1 : 0)
  }

  // Phase 2 — model evals
  need('ANTHROPIC_API_KEY')
  const totalRuns = cases.length * REPEATS
  console.log(`PHASE 2 — model evals: ${cases.length} question(s) × ${REPEATS} repeat(s) = ${totalRuns} run(s)\n`)
  const usage = { calls: 0, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0 }
  const results = []
  let n = 0
  for (const cs of cases) {
    let passes = 0
    const misses = []
    for (let r = 1; r <= REPEATS; r++) {
      n += 1
      process.stdout.write(`  [${n}/${totalRuns}] ${cs.id} ... `)
      const { status, body } = await ask(token, cs.question)
      const ok = status === 200 && matches(expected[cs.id], body?.reply)
      if (body?.usage) for (const k of Object.keys(usage)) usage[k] += body.usage[k] || 0
      console.log(ok ? 'pass' : 'FAIL')
      if (ok) passes += 1
      else misses.push(status === 200 ? String(body?.reply ?? '(no reply)').slice(0, 120) : `HTTP ${status}: ${body?.error}`)
    }
    results.push({ case: cs.id, expected: expected[cs.id], passes: `${passes}/${REPEATS}`, sample_miss: misses[0] || '' })
  }
  console.log('')
  console.table(results)
  const passed = results.reduce((s, r) => s + parseInt(r.passes, 10), 0)
  console.log(`\nOverall: ${passed}/${totalRuns} runs correct (${Math.round((100 * passed) / totalRuns)}%)`)
  console.log(`Model calls: ${usage.calls} | input tokens: ${usage.input_tokens} | output tokens: ${usage.output_tokens} | cache read: ${usage.cache_read_tokens} | cache write: ${usage.cache_creation_tokens}`)
  const est = priceEstimate(usage)
  console.log(est === null
    ? 'Cost: set EVAL_PRICE_* in .env.isolation.local to print a dollar estimate (see header of scripts/run-evals.mjs), or check the Anthropic console usage page.'
    : `Estimated cost of this run: $${est.toFixed(4)}`)
  process.exit(toolFails || passed < totalRuns ? 1 : 0)
}

main().catch(err => { console.error(err.message); process.exit(2) })
