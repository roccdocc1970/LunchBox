/**
 * Policy ingest command (roadmap Step 7). Adds, lists or removes a school's policy documents.
 * A school admin would do this from a screen (a later step); this command proves the pipeline
 * — chunk, embed, store — without one. It signs in as the admin of school A (default) or B,
 * using the accounts in .env.isolation.local, and writes through that admin's own RLS-scoped client.
 *
 *   npm run policies -- --file=path/to/handbook.md --title="Parent Handbook"
 *   npm run policies -- --school=B --file=... --title=...
 *   npm run policies -- --list [--school=B]
 *   npm run policies -- --delete="Parent Handbook"
 *   npm run policies -- --search="When are permission slips due?"   (what the chat search would return — a diagnostic)
 */

import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../api/_lib/getSchoolContext.js'
import { embedTexts, embedText, EMBEDDING_MODEL } from '../api/_lib/embed.js'
import { ingestPolicy, listPolicies, deletePolicy, searchPolicies } from '../src/services/policies.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const args = process.argv.slice(2)
const option = (name, fallback = '') => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const need = name => {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}. See .env.isolation.example.`); process.exit(2) }
  return v
}

async function main() {
  const prefix = option('school', 'A').toUpperCase() === 'B' ? 'ISO_B' : 'ISO_A'
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need(`${prefix}_EMAIL`), password: need(`${prefix}_PASSWORD`) })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })
  const { schoolId, isStaff, userId } = await getSchoolContext(supabase)
  if (isStaff) throw new Error('Only a school admin can manage policy documents.')

  if (args.includes('--list')) {
    const docs = await listPolicies(supabase)
    if (!docs.length) return console.log('No policy documents on file.')
    return console.table(docs.map(d => ({ title: d.title, file: d.filename, chunks: d.chunk_count, chars: d.char_count, added: new Date(d.created_at).toLocaleString() })))
  }
  if (option('search')) {
    const hits = await searchPolicies(supabase, await embedText(option('search')), 4)
    if (!hits.length) return console.log('The search returned nothing: no policy passages are on file for this school.')
    return console.table(hits.map(h => ({ similarity: Number(h.similarity).toFixed(3), document: h.document_title, section: String(h.heading || '').split(' > ').pop(), starts: String(h.content).split('\n\n').slice(1).join(' ').slice(0, 60) })))
  }
  if (option('delete')) {
    const n = await deletePolicy(supabase, schoolId, option('delete'))
    return console.log(`Removed ${n} document(s) titled "${option('delete')}".`)
  }

  const file = option('file')
  if (!file) { console.error('Give --file=<path> and --title=<title> (or --list / --delete=<title>).'); process.exit(2) }
  const text = fs.readFileSync(file, 'utf-8')
  const title = option('title') || (text.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(file))
  console.log(`Embedding with ${EMBEDDING_MODEL} (first run downloads the model)…`)
  const result = await ingestPolicy(supabase, { schoolId, userId, title, filename: path.basename(file), text }, embedTexts)
  console.log(`Stored "${title}": ${result.chunks} chunks, ${result.chars} characters${result.replaced ? ` (replaced ${result.replaced} earlier version)` : ''}.`)
}

main().catch(err => { console.error(err.message); process.exit(2) })
