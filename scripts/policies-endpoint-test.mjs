/**
 * Policy upload endpoint test (roadmap Step 7 feature). Run: npm run test:policies-endpoint
 *
 * Calls the real handler (api/policies/ingest.js) directly with a mock request, as the evals do —
 * no server needs to be running. Free: embeddings run locally, no chat model is called.
 *
 *   - no login → refused (401)            - empty title / empty text → refused (400)
 *   - oversized document → refused (400)  - unsupported file type → refused (400)
 *   - a valid upload by the school admin → stored, searchable, and listed
 *   - re-uploading the same title REPLACES it (one document, not two)
 *   - school B cannot see or search school A's upload
 *   - the upload appears in the audit log (policy changes are audited)
 *
 * Not covered: the staff-refused path (403) needs a staff account; it is a single check in the handler.
 * Leaves no test data behind (the upload is removed at the end; the append-only audit log keeps its entries).
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { embedText } from '../api/_lib/embed.js'
import handler from '../api/policies/ingest.js'
import { listPolicies, deletePolicy, searchPolicies } from '../src/services/policies.js'
import { POLICY_MAX_CHARS } from '../src/domain/policies.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const need = name => {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}. See .env.isolation.example.`); process.exit(2) }
  return v
}
const rows = []
const check = (name, ok, detail = '') => rows.push({ check: name, status: ok ? 'PASS' : 'FAIL', detail })

async function signIn(prefix) {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need(`${prefix}_EMAIL`), password: need(`${prefix}_PASSWORD`) })
  if (error) throw new Error(`${prefix} sign-in failed: ${error.message}`)
  const token = data.session.access_token
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${token}` } })
  return { token, supabase, ...(await getSchoolContext(supabase)) }
}

async function call(token, body) {
  const req = { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body }
  const out = { status: 200, body: null }
  const res = { status(c) { out.status = c; return res }, json(b) { out.body = b; return res } }
  await handler(req, res)
  return out
}

const TITLE = '⚡ Endpoint Test Policy'
const textV1 = '# ⚡ Endpoint Test Policy\n\n## Library hours\n\nThe library is open from 7:30 AM to 4:00 PM on school days.\n'
const textV2 = '# ⚡ Endpoint Test Policy\n\n## Library hours\n\nThe library is open from 8:00 AM to 5:00 PM on school days.\n'

async function main() {
  const A = await signIn('ISO_A')
  const B = await signIn('ISO_B')

  check('no login is refused (401)', (await call(null, { title: TITLE, text: textV1 })).status === 401)
  check('empty title is refused (400)', (await call(A.token, { title: '  ', text: textV1 })).status === 400)
  check('empty text is refused (400)', (await call(A.token, { title: TITLE, text: '   ' })).status === 400)
  check('oversized document is refused (400)', (await call(A.token, { title: TITLE, text: 'x'.repeat(POLICY_MAX_CHARS + 1) })).status === 400)
  check('unsupported file type is refused (400)', (await call(A.token, { title: TITLE, text: textV1, filename: 'handbook.pdf' })).status === 400)

  const first = await call(A.token, { title: TITLE, text: textV1, filename: 'endpoint-test.md' })
  check('a valid upload is stored', first.status === 200 && first.body?.chunks >= 1, `status ${first.status}${first.body?.error ? ': ' + first.body.error : ''}`)

  const q = await embedText('When is the library open?')
  const hits1 = await searchPolicies(A.supabase, q, 3)
  check('the upload is searchable', hits1.some(h => /7:30 AM/.test(h.content)))

  const second = await call(A.token, { title: TITLE, text: textV2, filename: 'endpoint-test.md' })
  check('re-uploading the same title replaces it', second.status === 200 && second.body?.replaced === 1)
  const mine = (await listPolicies(A.supabase)).filter(d => d.title === TITLE)
  check('only one document with that title remains', mine.length === 1)
  const hits2 = await searchPolicies(A.supabase, q, 3)
  check('search now returns the new version, not the old', hits2.some(h => /8:00 AM/.test(h.content)) && !hits2.some(h => /7:30 AM/.test(h.content)))

  check("school B cannot list school A's upload", !(await listPolicies(B.supabase)).some(d => d.title === TITLE))
  check("school B cannot find school A's text by search", !(await searchPolicies(B.supabase, q, 10)).some(h => /library/i.test(h.content) && /8:00 AM/.test(h.content)))

  const { data: audit } = await A.supabase.from('audit_log').select('action').eq('table_name', 'policy_documents').eq('row_id', mine[0].id)
  check('the upload is recorded in the audit log', (audit || []).some(a => a.action === 'INSERT'))

  const removed = await deletePolicy(A.supabase, A.schoolId, TITLE)
  check('cleanup removed the test document', removed === 1)
}

main()
  .catch(err => { console.error(err.message); rows.push({ check: 'ran to completion', status: 'FAIL', detail: err.message }) })
  .finally(() => {
    console.table(rows)
    const failed = rows.filter(r => r.status === 'FAIL').length
    console.log(`\n${rows.length - failed} passed, ${failed} FAILED`)
    process.exit(failed ? 1 : 0)
  })
