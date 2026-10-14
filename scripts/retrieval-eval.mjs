/**
 * Retrieval evaluation (roadmap Step 8). Run: npm run eval:retrieval [-- --mode=vector|hybrid] [-- --k=4]
 *
 * Measures how often the right passage comes back — separately from any model's answer, and free
 * (embeddings run locally; no chat model is called). It ingests the sample documents for school A,
 * runs the question set (scripts/evals/retrieval-questions.mjs) and reports, per kind of question:
 *   top-1  the right passage was the FIRST result        top-3 / top-4  it was among the first 3 / 4
 *   MRR    mean reciprocal rank (1 = always first; 0.5 = typically second)
 * For multi-section questions it checks that ALL the needed facts appear somewhere in the top results.
 *
 *   --mode=vector   the Step 7 search (meaning only)          [default]
 *   --mode=hybrid   meaning + keyword, merged (needs migration 006; see the Architecture Guide)
 */

import dotenv from 'dotenv'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { embedTexts, embedText } from '../api/_lib/embed.js'
import { ingestPolicy, searchPolicies } from '../src/services/policies.js'
import { QUESTIONS, scoreQuestion, summarize } from './evals/retrieval-questions.mjs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}
const MODE = option('mode', 'vector')
const K = Math.max(3, parseInt(option('k', '4'), 10) || 4)

const need = name => {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}. See .env.isolation.example.`); process.exit(2) }
  return v
}
const read = name => fs.readFileSync(new URL(`./evals/fixtures/policies/${name}`, import.meta.url), 'utf-8')

async function search(supabase, question) {
  const vector = await embedText(question)
  if (MODE === 'vector') return searchPolicies(supabase, vector, K)
  if (MODE === 'hybrid') {
    const { searchPoliciesHybrid } = await import('../src/services/policies.js')
    if (!searchPoliciesHybrid) throw new Error('Hybrid search is not built yet (needs migration 006 and searchPoliciesHybrid).')
    return searchPoliciesHybrid(supabase, vector, question, K)
  }
  throw new Error(`Unknown --mode=${MODE}`)
}

async function main() {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need('ISO_A_EMAIL'), password: need('ISO_A_PASSWORD') })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  const { schoolId, userId } = await getSchoolContext(supabase)

  console.log(`Mode: ${MODE} | results per search: ${K}\nIngesting the sample documents for school A…`)
  const DOCUMENTS = [
    ['⚡ Emerson Parent Handbook', 'emerson-handbook.md'],
    ['⚡ Emerson Forms and Contacts', 'emerson-forms-and-contacts.md'],
    ['⚡ Emerson Athletics and Activities', 'emerson-athletics-activities.md'],
  ]
  for (const [title, filename] of DOCUMENTS) {
    await ingestPolicy(supabase, { schoolId, userId, title, filename, text: read(filename) }, embedTexts)
  }

  const rows = []
  for (const question of QUESTIONS) {
    const results = await search(supabase, question.q)
    const score = scoreQuestion(question, results)
    rows.push({ ...question, results, score })
  }

  console.table(rows.map(r => ({
    kind: r.kind,
    question: r.q.slice(0, 52),
    result: !r.score.scored ? `top similarity ${Number(r.results[0]?.similarity ?? 0).toFixed(2)}`
      : r.kind === 'multi_section' ? (r.score.top4 ? 'all facts in top 4' : 'MISSING a fact')
        : r.score.rank ? `first hit at rank ${r.score.rank}` : 'NOT FOUND',
    top_results: r.results.slice(0, 3).map(x => String(x.heading || '').split(' > ').pop()).join(' | ').slice(0, 70),
  })))

  console.log(`\nSummary (${MODE} search):`)
  console.table(summarize(rows))
  const single = rows.filter(r => r.score.scored && r.kind !== 'multi_section')
  const total = single.length
  const t1 = single.filter(r => r.score.top1).length
  const t3 = single.filter(r => r.score.top3).length
  const mrr = single.reduce((s, r) => s + r.score.rr, 0) / total
  console.log(`Single-target questions: top-1 ${t1}/${total} | top-3 ${t3}/${total} | MRR ${mrr.toFixed(2)}`)
  console.log('Small question set: treat differences of one or two questions as noise.')
}

main().catch(err => { console.error(err.message); process.exit(2) })
