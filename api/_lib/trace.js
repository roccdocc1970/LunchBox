/**
 * Request tracing for the chat backend (roadmap item 2).
 *
 * One trace per request: the ordered steps (model calls, tool calls, the final action) with
 * timing, token counts and result sizes. It records METADATA, not payloads — never tool
 * results, never argument values (only argument names) — so student data stays out of
 * traces. The question text is kept only as a short truncated copy for debugging, and it
 * CAN contain a student's name; turn it off with TRACE_STORE_QUESTION=false.
 *
 * Written through the caller's own Supabase client, so the agent_traces RLS policies decide
 * where it lands (db/migrations/003). Tracing must never break a chat request: every failure
 * here is swallowed (and logged without data).
 */

const QUESTION_LIMIT = 200
const ERROR_LIMIT = 300
// A question can contain a student's name ("How is Marcus Johnson doing?"), so the text is the one
// place personal data can reach a trace. Set TRACE_STORE_QUESTION=false to store only its length.
const STORE_QUESTION = process.env.TRACE_STORE_QUESTION !== 'false'

function lastUserText(messages) {
  const last = [...(messages || [])].reverse().find(m => m.role === 'user')
  if (!last) return ''
  if (typeof last.content === 'string') return last.content
  if (Array.isArray(last.content)) return last.content.filter(b => b.type === 'text').map(b => b.text).join(' ')
  return ''
}

export function startTrace({ supabase, schoolId, userId, model, messages }) {
  const startedAt = Date.now()
  const steps = []
  const question = lastUserText(messages)

  return {
    /** Record one step, e.g. { type: 'model', ms, ... } or { type: 'tool', name, ms, ... }. */
    step(step) { steps.push(step) },

    /** Persist the trace. Never throws. */
    async save(outcome, usage, errorMessage) {
      try {
        const { error } = await supabase.from('agent_traces').insert({
          school_id: schoolId,
          user_id: userId,
          question: STORE_QUESTION ? question.slice(0, QUESTION_LIMIT) : null,
          question_chars: question.length,
          outcome,
          model,
          duration_ms: Date.now() - startedAt,
          model_calls: usage?.calls ?? 0,
          input_tokens: usage?.input_tokens ?? 0,
          output_tokens: usage?.output_tokens ?? 0,
          cache_read_tokens: usage?.cache_read_tokens ?? 0,
          cache_creation_tokens: usage?.cache_creation_tokens ?? 0,
          steps,
          error: errorMessage ? String(errorMessage).slice(0, ERROR_LIMIT) : null,
        })
        if (error) console.error('trace not saved:', error.code || '', error.message)
      } catch (err) {
        console.error('trace not saved:', err.message)
      }
    },
  }
}
