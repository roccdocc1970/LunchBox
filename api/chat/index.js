/**
 * Chat backend — tool-calling loop over the existing service layer.
 *
 * Read tools execute immediately and the loop continues. Write tools and
 * navigate tools short-circuit the loop: the model is never allowed to
 * mutate data or attempt a scheduling/enrollment change on its own — it can
 * only propose an action (rendered as a ConfirmAction card, executed only
 * via /api/chat/execute.js on explicit human confirmation) or hand off to
 * the real screen. See the plan's "guiding rule" for why.
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseFromRequest } from '../_lib/supabaseFromRequest.js'
import { getSchoolContext } from '../_lib/getSchoolContext.js'
import { READ_TOOLS, WRITE_TOOLS, NAVIGATE_TOOLS, allToolSchemas } from '../_lib/tools.js'
import { startTrace, lastUserText } from '../_lib/trace.js'
import { chooseModel } from '../_lib/router.js'

// Built lazily (inside the handler, not here at module load) so it reads
// ANTHROPIC_API_KEY at request time. In local dev, ES module imports are
// hoisted above plain statements, so dev-server.js's dotenv.config() call
// wouldn't have run yet if this were constructed at import time.
let anthropic
function getAnthropicClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

/**
 * LLMs are unreliable at manually tallying a list of items read out of a
 * tool result, even when the underlying data is correct — this was the root
 * cause of a real miscount bug (a cohort count reported as 32 instead of 33).
 * Give the exact count explicitly instead of making the model count itself.
 * Handles both a tool returning a bare array (get_students, get_cohorts,
 * etc.) and a tool returning an object whose direct properties are arrays
 * (get_student_health's `entries`, get_student_evolution's `years`,
 * get_fundraising_data's `campaigns`/`donations`/`events`/`alumniProspects`).
 * Deliberately one level deep, not recursive — deeper nested lists in this
 * app's shapes are small enough that manual counting isn't a real risk.
 */
function withCounts(result) {
  if (Array.isArray(result)) return { count: result.length, items: result }
  if (result && typeof result === 'object') {
    return Object.fromEntries(Object.entries(result).map(([key, value]) =>
      [key, Array.isArray(value) ? { count: value.length, items: value } : value]
    ))
  }
  return result
}

const SYSTEM_PROMPT = `You are the in-app assistant for LunchBox, a K-12 school operations platform. Answer questions using only the tools provided — never invent data. Always look up a student's id via get_students before calling a student-scoped tool. Prefer get_student_evolution for broad "how is this student doing" questions over calling several narrow tools.

List-returning tools give you a "count" field alongside "items" — when asked "how many," always use that exact count field, never count the items yourself by reading through the list.

For anything involving scheduling, cohort assignment, or class enrollment/capacity changes, call the matching navigate_to_* tool instead of guessing — never attempt those changes yourself, even if the request seems simple. Look up the real class/cohort id first via get_classes/get_cohorts before calling navigate_to_class/navigate_to_cohort. For scheduling requests specifically, do not ask clarifying questions first — navigate_to_scheduling needs no details, so call it right away; the user chooses the class and period on that screen. If you say you will open a screen, you must call the tool in the same turn.

You cannot delete records or change many records at once. If asked to, say clearly that this can't be done through chat and explain what you can do instead (for example, changing one student's status with confirmation) — do not open a page unless the user asks to go somewhere.

For an enrollment status change or logging an incident, call the matching tool once you have the details — it will be shown to a human for confirmation and is never executed automatically by you.

Call render_view as your final step once you have the data needed to answer. Use a view template (table/stat_row/chip_list/mini_timeline) whenever the answer is a list, a set of counts, or a history — use template "none" only for a single fact or short explanation.`

// Token usage is returned with every response so callers (the eval runner today,
// tracing later) can see what a request cost without scraping the Anthropic console.
function addUsage(total, u = {}) {
  total.calls += 1
  total.input_tokens += u.input_tokens || 0
  total.output_tokens += u.output_tokens || 0
  total.cache_read_tokens += u.cache_read_input_tokens || 0
  total.cache_creation_tokens += u.cache_creation_input_tokens || 0
}

const MAX_TURNS = 8
const DEFAULT_MODEL = 'claude-sonnet-5'
// Model choice, once per request (api/_lib/router.js): CHAT_MODEL forces one model (experiments), CHAT_ROUTING=on lets the
// router pick by question, otherwise the default. Never switched mid-loop (thinking blocks are bound to the model that wrote them).
const pickModel = messages => chooseModel(lastUserText(messages), {
  routingOn: process.env.CHAT_ROUTING === 'on', forced: process.env.CHAT_MODEL || '', defaultModel: DEFAULT_MODEL,
})

// The system prompt and tool definitions are identical on every call in the
// loop (and across separate messages in the same session) — marking them
// cacheable means only the first call pays full price; every following call
// within the cache window reads them at a steep discount instead of
// reprocessing the same ~2,100 tokens from scratch.
const CACHED_SYSTEM = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]

function cachedTools() {
  const tools = allToolSchemas()
  tools[tools.length - 1] = { ...tools[tools.length - 1], cache_control: { type: 'ephemeral' } }
  return tools
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let supabase, userId, schoolId, isStaff, role
  try {
    supabase = supabaseFromRequest(req)
    ;({ userId, schoolId, isStaff, role } = await getSchoolContext(supabase))
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
  const ctx = { isStaff, role }

  const { messages } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages is required' })
  }

  const readByName = Object.fromEntries(READ_TOOLS.map(t => [t.name, t]))
  const conversation = [...messages]
  const usage = { calls: 0, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0 }

  // One trace per request (metadata only — see api/_lib/trace.js). It is saved just before
  // every response, so even failed requests leave a record.
  const { model, reason: routeReason } = pickModel(messages)
  const trace = startTrace({ supabase, schoolId, userId, model, messages })
  trace.step({ type: 'route', model, reason: routeReason })
  const respond = async (status, body, outcome, errorMessage) => {
    await trace.save(outcome, usage, errorMessage)
    return res.status(status).json({ ...body, model })
  }

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const modelStart = Date.now()
      const response = await getAnthropicClient().messages.create({
        model,
        max_tokens: 1500,
        system: CACHED_SYSTEM,
        tools: cachedTools(),
        messages: conversation,
      })

      addUsage(usage, response.usage)
      trace.step({
        type: 'model', turn: turn + 1, ms: Date.now() - modelStart, stop_reason: response.stop_reason,
        input_tokens: response.usage?.input_tokens || 0, output_tokens: response.usage?.output_tokens || 0,
        cache_read_tokens: response.usage?.cache_read_input_tokens || 0, cache_write_tokens: response.usage?.cache_creation_input_tokens || 0,
      })

      const toolUses = response.content.filter(b => b.type === 'tool_use')

      if (toolUses.length === 0) {
        const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        return respond(200, { reply: text, view: null, usage }, 'reply')
      }

      const shortCircuit = toolUses.find(tu =>
        tu.name === 'render_view' ||
        WRITE_TOOLS.some(t => t.name === tu.name) ||
        NAVIGATE_TOOLS.some(t => t.name === tu.name)
      )

      if (shortCircuit) {
        trace.step({ type: 'final', name: shortCircuit.name })
        if (shortCircuit.name === 'render_view') {
          const { reply, template, data } = shortCircuit.input
          return respond(200, { reply, view: template && template !== 'none' ? { template, data } : null, usage }, 'view')
        }
        if (WRITE_TOOLS.some(t => t.name === shortCircuit.name)) {
          return respond(200, {
            reply: `I'd like to ${shortCircuit.name.replace(/_/g, ' ')} — take a look and confirm.`,
            pendingAction: { tool: shortCircuit.name, input: shortCircuit.input },
            usage,
          }, 'pending_action')
        }
        return respond(200, {
          reply: `Opening that for you.`,
          navigate: { tool: shortCircuit.name, input: shortCircuit.input },
          usage,
        }, 'navigate')
      }

      conversation.push({ role: 'assistant', content: response.content })
      const toolResults = await Promise.all(toolUses.map(async (tu) => {
        const tool = readByName[tu.name]
        const toolStart = Date.now()
        const argNames = Object.keys(tu.input || {}) // names only — values may identify a student
        if (!tool) {
          trace.step({ type: 'tool', name: tu.name, ms: 0, args: argNames, error: true })
          return { type: 'tool_result', tool_use_id: tu.id, content: 'Unknown tool', is_error: true }
        }
        try {
          const result = await tool.run(supabase, schoolId, tu.input, ctx)
          const payload = withCounts(result)
          const content = JSON.stringify(payload)
          trace.step({
            type: 'tool', name: tu.name, ms: Date.now() - toolStart, args: argNames,
            result_rows: Array.isArray(result) ? result.length : null, result_bytes: content.length,
          })
          return { type: 'tool_result', tool_use_id: tu.id, content }
        } catch (err) {
          trace.step({ type: 'tool', name: tu.name, ms: Date.now() - toolStart, args: argNames, error: true })
          return { type: 'tool_result', tool_use_id: tu.id, content: err.message, is_error: true }
        }
      }))
      conversation.push({ role: 'user', content: toolResults })
    }

    return respond(200, { reply: "I wasn't able to finish that — try rephrasing or asking something narrower.", view: null, usage }, 'max_turns')
  } catch (err) {
    return respond(500, { error: err.message }, 'error', err.message)
  }
}
