/**
 * Offline test of the model router (Step 6). Free: no model, no database. Run: npm run test:router
 *
 * Checks that routine lookups and counts go to the cheap model, and that analysis, writes,
 * destructive and bulk requests go to the strong one. Also checks the precedence rules.
 */

import { chooseModel, CHEAP_MODEL, STRONG_MODEL } from '../api/_lib/router.js'

const on = { routingOn: true }
const cases = [
  // [question, expected model, why]
  ['How many cohorts does the school have?', CHEAP_MODEL, 'count'],
  ['How many students are on the waitlist?', CHEAP_MODEL, 'count, mentions waitlist but is a read'],
  ['What grade is Maya Chen in?', CHEAP_MODEL, 'lookup'],
  ['How many staff members have the role Teacher?', CHEAP_MODEL, 'tally'],
  ['How many incidents are on record for Maya Chen, open or resolved?', CHEAP_MODEL, 'lookup mentioning incidents (a read)'],
  ['What grade was Maya Chen in during the 2024-2025 academic year?', CHEAP_MODEL, 'fact from history'],
  ['cohort count?', CHEAP_MODEL, 'terse count'],
  ['How is Maya Chen doing this year?', STRONG_MODEL, 'analysis'],
  ['Give me an overview of the 5th grade cohort.', STRONG_MODEL, 'analysis'],
  ['Compare attendance across the two divisions.', STRONG_MODEL, 'analysis'],
  ['Tell me about Maya Chen.', STRONG_MODEL, 'analysis'],
  ['Why did enrollment drop last year?', STRONG_MODEL, 'analysis'],
  ['Please move Maya Chen to the waitlist.', STRONG_MODEL, 'write intent'],
  ['Change Maya Chen\'s status to Enrolled.', STRONG_MODEL, 'write intent'],
  ['Log a behavioral incident for Maya Chen: pushed another student.', STRONG_MODEL, 'write intent'],
  ['Delete all of the students on the roster.', STRONG_MODEL, 'destructive'],
  ['Move every student in 5th grade to the waitlist.', STRONG_MODEL, 'bulk'],
  ['x'.repeat(600), STRONG_MODEL, 'long question'],
]

let failed = 0
const rows = cases.map(([question, expected, why]) => {
  const { model, reason } = chooseModel(question, on)
  const ok = model === expected
  if (!ok) failed += 1
  return { status: ok ? 'PASS' : 'FAIL', question: question.slice(0, 60), routed_to: model === CHEAP_MODEL ? 'cheap' : 'strong', reason, why }
})

// Precedence: forced model beats routing; routing off uses the default.
const forced = chooseModel('How many cohorts?', { routingOn: true, forced: 'claude-opus-5-5' })
const off = chooseModel('How many cohorts?', { routingOn: false, defaultModel: STRONG_MODEL })
const checks = [
  ['CHAT_MODEL (forced) beats routing', forced.model === 'claude-opus-5-5'],
  ['routing off uses the default model', off.model === STRONG_MODEL],
]
for (const [name, ok] of checks) {
  if (!ok) failed += 1
  rows.push({ status: ok ? 'PASS' : 'FAIL', question: name, routed_to: '', reason: '', why: 'precedence' })
}

console.table(rows)
console.log(`\n${rows.length - failed} passed, ${failed} FAILED`)
process.exit(failed ? 1 : 0)
