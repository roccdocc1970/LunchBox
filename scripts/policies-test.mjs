/**
 * Policy RAG tests (roadmap Step 7). Run: npm run test:policies
 *
 * Tests RETRIEVAL on its own, separately from the model's answers — like testing the tools without
 * the model. If a later chat answer is wrong, these tell you whether the right passage was even found.
 * Free: embeddings run locally and no chat model is called.
 *
 *  1. Chunker (offline): headings kept on every chunk, no oversized chunks, lists kept whole, overlap present.
 *  2. Retrieval: after ingesting the two sample handbooks, does the right section come back first (or in the top 3)?
 *  3. Isolation: school A never retrieves school B's passages and vice versa; B cannot write into A;
 *     anonymous callers cannot search.
 *
 * It ingests the sample handbooks itself (school A: Emerson, school B: Brookside), replacing earlier copies.
 */

import fs from 'node:fs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { embedTexts, embedText } from '../api/_lib/embed.js'
import { chunkMarkdown } from '../src/domain/policies.js'
import { ingestPolicy, searchPolicies } from '../src/services/policies.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const read = name => fs.readFileSync(new URL(`./evals/fixtures/policies/${name}`, import.meta.url), 'utf-8')
const emerson = read('emerson-handbook.md')
const brookside = read('brookside-handbook.md')

const rows = []
const check = (area, name, ok, detail = '') => rows.push({ area, check: name, status: ok ? 'PASS' : 'FAIL', detail })

// ---- 1. Chunker (offline) ----
{
  const chunks = chunkMarkdown(emerson, { title: '⚡ Emerson Parent Handbook' })
  check('chunker', 'produces several chunks', chunks.length >= 6, `${chunks.length} chunks`)
  check('chunker', 'every chunk starts with its section path', chunks.every(c => c.content.startsWith(c.heading)))
  check('chunker', 'no chunk is oversized', chunks.every(c => c.content.length <= 1100 + 400), `longest ${Math.max(...chunks.map(c => c.content.length))} chars`)
  const late = chunks.find(c => c.heading.includes('Late pickup'))
  check('chunker', 'the fee stays with its heading', !!late && late.content.includes('$12') && late.content.includes('Late pickup'))

  const sentences = Array.from({ length: 40 }, (_, i) => `Rule number ${i + 1} applies to every family at the school.`).join(' ')
  const long = chunkMarkdown(`# Long policy\n\n## Rules\n\n${sentences}`, { maxChars: 400, overlapChars: 100 })
  check('chunker', 'a long section splits into several chunks', long.length >= 4, `${long.length} chunks`)
  const overlapOk = long.slice(1).every((c, i) => {
    const prevBody = long[i].content.split('\n\n').slice(1).join('\n\n')
    const tailWords = prevBody.split(/\s+/).slice(-4).join(' ')
    return c.content.includes(tailWords)
  })
  check('chunker', 'neighbouring chunks overlap', overlapOk)

  const list = chunkMarkdown('# Doc\n\n## Supplies\n\n- pencils\n- erasers\n- ruler\n- glue stick\n\n## Other\n\nText here.')
  const supplies = list.find(c => c.heading.includes('Supplies'))
  check('chunker', 'a list stays in one chunk', !!supplies && ['pencils', 'erasers', 'ruler', 'glue stick'].every(w => supplies.content.includes(w)))
}

// ---- 2 and 3. Retrieval and isolation (needs both school accounts) ----
const need = name => {
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

async function main() {
  const A = await signIn('ISO_A')
  const B = await signIn('ISO_B')

  console.log('Ingesting the sample handbooks (first run downloads the embedding model)…')
  await ingestPolicy(A.supabase, { schoolId: A.schoolId, userId: A.userId, title: '⚡ Emerson Parent Handbook', filename: 'emerson-handbook.md', text: emerson }, embedTexts)
  await ingestPolicy(B.supabase, { schoolId: B.schoolId, userId: B.userId, title: '⚡ Brookside Parent Handbook', filename: 'brookside-handbook.md', text: brookside }, embedTexts)

  // Retrieval: the planted facts, asked in everyday words (not the document's own words).
  const questions = [
    ['How much do I pay if I collect my child late?', 'Late pickup'],
    ['What happens when my son arrives at school after the morning bell?', 'Tardiness'],
    ['Can my daughter keep her inhaler in her backpack?', 'Medication'],
    ['How will we hear if school is cancelled for snow?', 'Weather closings'],
    ['What should the kids wear to school?', 'Uniforms'],
    ['Is it okay to pack peanut butter in lunches?', 'Lunch'],
    ['What time do the doors open in the morning?', 'Arrival and dismissal'],
  ]
  let top1 = 0, top3 = 0
  const detail = []
  for (const [q, section] of questions) {
    const hits = await searchPolicies(A.supabase, await embedText(q), 3)
    const hit1 = hits[0]?.heading?.includes(section)
    const hit3 = hits.some(h => h.heading?.includes(section))
    if (hit1) top1 += 1
    if (hit3) top3 += 1
    detail.push({ question: q.slice(0, 58), expected: section, top_result: (hits[0]?.heading || '').split(' > ').pop(), in_top3: hit3 ? 'yes' : 'NO' })
  }
  console.table(detail)
  check('retrieval', `right section is in the top 3 (${top3} of ${questions.length})`, top3 / questions.length >= 0.8, `top-1: ${top1} of ${questions.length}`)

  // Isolation.
  const q = await embedText('What is the late pickup fee?')
  const seenByA = await searchPolicies(A.supabase, q, 10)
  const seenByB = await searchPolicies(B.supabase, q, 10)
  check('isolation', "school A never retrieves school B's passages", seenByA.length > 0 && seenByA.every(h => !/Brookside/.test(h.document_title)))
  check('isolation', "school B never retrieves school A's passages", seenByB.length > 0 && seenByB.every(h => !/Emerson/.test(h.document_title)))
  check('isolation', "each school gets its own answer to the same question", /\$12/.test(seenByA[0]?.content || '') && /\$5 /.test(seenByB[0]?.content || ''))

  const { data: aDocs } = await A.supabase.from('policy_documents').select('id').limit(1)
  const forged = await B.supabase.from('policy_chunks').insert({
    document_id: aDocs[0].id, school_id: A.schoolId, chunk_index: 999, heading: 'forged', content: 'forged', embedding: q,
  }).select()
  check('isolation', "school B cannot write a passage into school A", !!forged.error || !(forged.data || []).length)
  const edit = await B.supabase.from('policy_documents').update({ title: 'HIJACKED' }).eq('id', aDocs[0].id).select()
  check('isolation', "school B cannot edit school A's document", !!edit.error || !(edit.data || []).length)

  const anon = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })
  const anonSearch = await anon.rpc('match_policy_chunks', { query_embedding: q, match_count: 3 })
  check('isolation', 'an anonymous caller cannot search', !!anonSearch.error || !(anonSearch.data || []).length)
  const anonRead = await anon.from('policy_chunks').select('id').limit(1)
  check('isolation', 'an anonymous caller cannot read chunks', !!anonRead.error || !(anonRead.data || []).length)
}

main()
  .catch(err => { console.error(err.message); rows.push({ area: 'setup', check: 'ran to completion', status: 'FAIL', detail: err.message }) })
  .finally(() => {
    console.table(rows)
    const failed = rows.filter(r => r.status === 'FAIL').length
    console.log(`\n${rows.length - failed} passed, ${failed} FAILED`)
    process.exit(failed ? 1 : 0)
  })
