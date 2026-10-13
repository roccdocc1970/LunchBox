/**
 * Trace viewer (roadmap item 2). Lists recent chat requests for school A (the account in
 * .env.isolation.local) from the agent_traces table — read through the same RLS-scoped
 * client the app uses, so it can only ever show that school's own traces.
 *
 *   npm run traces                      20 most recent
 *   npm run traces -- --n=50            more
 *   npm run traces -- --slowest         sort by duration, slowest first
 *   npm run traces -- --steps           also print each request's steps (model/tool calls)
 *
 * Optional dollar estimate: set EVAL_PRICE_INPUT_PER_MTOK, EVAL_PRICE_OUTPUT_PER_MTOK,
 * EVAL_PRICE_CACHE_READ_PER_MTOK, EVAL_PRICE_CACHE_WRITE_PER_MTOK (see scripts/run-evals.mjs).
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabaseFromRequest } from '../api/_lib/supabaseFromRequest.js'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.isolation.local' })

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}
const N = Math.max(1, parseInt(option('n', '20'), 10) || 20)
const SLOWEST = args.includes('--slowest')
const SHOW_STEPS = args.includes('--steps')

function need(name) {
  const v = process.env[name]
  if (!v) { console.error(`Missing ${name}.`); process.exit(2) }
  return v
}

function dollars(t) {
  const p = n => parseFloat(process.env[n])
  const inP = p('EVAL_PRICE_INPUT_PER_MTOK'), outP = p('EVAL_PRICE_OUTPUT_PER_MTOK')
  if (!(inP >= 0) || !(outP >= 0)) return null
  const readP = p('EVAL_PRICE_CACHE_READ_PER_MTOK') || 0, writeP = p('EVAL_PRICE_CACHE_WRITE_PER_MTOK') || 0
  return (t.input_tokens * inP + t.output_tokens * outP + t.cache_read_tokens * readP + t.cache_creation_tokens * writeP) / 1e6
}

async function main() {
  const bootstrap = createClient(need('VITE_SUPABASE_URL'), need('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await bootstrap.auth.signInWithPassword({ email: need('ISO_A_EMAIL'), password: need('ISO_A_PASSWORD') })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const supabase = supabaseFromRequest({ headers: { authorization: `Bearer ${data.session.access_token}` } })

  const order = SLOWEST ? { column: 'duration_ms', ascending: false } : { column: 'created_at', ascending: false }
  const { data: rows, error: qErr } = await supabase.from('agent_traces').select('*')
    .order(order.column, { ascending: order.ascending }).limit(N)
  if (qErr) throw new Error(`Could not read traces: ${qErr.message}`)
  if (!rows.length) {
    console.log('No traces yet. Send a chat message (or run `npm run evals -- --model --only=cohorts`) first.')
    return
  }

  console.table(rows.map(r => {
    const cost = dollars(r)
    return {
      when: new Date(r.created_at).toLocaleString(),
      outcome: r.outcome,
      seconds: (r.duration_ms / 1000).toFixed(1),
      model_calls: r.model_calls,
      in_tokens: r.input_tokens,
      out_tokens: r.output_tokens,
      cached: r.cache_read_tokens,
      ...(cost === null ? {} : { est_usd: cost.toFixed(4) }),
      question: (r.question || '').slice(0, 50),
    }
  }))

  const sum = k => rows.reduce((s, r) => s + (r[k] || 0), 0)
  const totals = { input_tokens: sum('input_tokens'), output_tokens: sum('output_tokens'), cache_read_tokens: sum('cache_read_tokens'), cache_creation_tokens: sum('cache_creation_tokens') }
  console.log(`\n${rows.length} request(s): average ${(sum('duration_ms') / rows.length / 1000).toFixed(1)}s, ${(sum('model_calls') / rows.length).toFixed(1)} model calls, ` +
    `${Math.round(sum('input_tokens') / rows.length)} fresh input + ${Math.round(sum('cache_read_tokens') / rows.length)} cached + ${Math.round(sum('output_tokens') / rows.length)} output tokens each`)
  const total = dollars(totals)
  if (total !== null) console.log(`Estimated total: $${total.toFixed(4)} ($${(total / rows.length).toFixed(4)} per request)`)

  if (SHOW_STEPS) {
    for (const r of rows) {
      console.log(`\n— ${new Date(r.created_at).toLocaleTimeString()} "${(r.question || '').slice(0, 60)}" → ${r.outcome} (${(r.duration_ms / 1000).toFixed(1)}s)${r.error ? `  ERROR: ${r.error}` : ''}`)
      for (const s of r.steps || []) {
        if (s.type === 'model') console.log(`    model call ${s.turn}: ${s.ms}ms, ${s.input_tokens} in / ${s.output_tokens} out (${s.cache_read_tokens} cached), stopped: ${s.stop_reason}`)
        else if (s.type === 'tool') console.log(`    tool ${s.name}(${(s.args || []).join(', ')}): ${s.ms}ms, ${s.result_rows ?? '?'} rows, ${s.result_bytes ?? '?'} bytes${s.error ? '  ERROR' : ''}`)
        else if (s.type === 'route') console.log(`    route: ${s.model} (${s.reason})`)
        else console.log(`    final: ${s.name}`)
      }
    }
  }
}

main().catch(err => { console.error(err.message); process.exit(2) })
