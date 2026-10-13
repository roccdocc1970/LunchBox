/**
 * Model router (roadmap Step 6 / ID 12) — decides which chat model handles a request.
 *
 * Deliberately simple: plain rules, no model call, deterministic, free to test offline
 * (`npm run test:router`). The cheaper model handles routine lookups and counts; the stronger
 * model handles anything that is analytical, long, or carries write / destructive intent.
 * The choice is made ONCE per request from the user's last message and never changed mid-loop
 * (a model's thinking blocks are bound to the model that wrote them).
 *
 * Why these rules: on our eval suite the cheaper model matched the stronger one on counts,
 * tallies, lookups, writes, navigation and injection resistance, but broad analysis is the
 * area cheaper models most often struggle with, and a wrongly-routed destructive request is the
 * costliest mistake. When unsure, the rules choose the stronger model: a misroute upward costs
 * a few cents; a misroute downward can cost quality or safety.
 *
 * Precedence: CHAT_MODEL (explicit, used by experiments) > CHAT_ROUTING=on > the default model.
 */

export const STRONG_MODEL = 'claude-sonnet-5'
export const CHEAP_MODEL = 'claude-haiku-5-5'

// Broad or analytical questions — where cheaper models most often fall short.
const ANALYSIS = /\b(how (is|are|was|has|have|did)|how's|doing|progress|history|evolution|journey|trend|over the years|across (the )?years|compare|comparison|summar(y|ize|ise)|overview|tell me about|profile of|analy[sz]e|why)\b/i

// Write or destructive intent, or bulk scope.
const RISKY = /\b(delete|remove|erase|wipe|purge|expel|withdraw|transfer|graduate|enroll|change|update|edit|move|assign|bulk|everyone|every student|all (of )?the (students|records)|all students)\b|\blog\b[^.?!]{0,40}\bincident/i

export function chooseModel(question, { routingOn = false, forced = '', defaultModel = STRONG_MODEL } = {}) {
  if (forced) return { model: forced, reason: 'forced by CHAT_MODEL' }
  if (!routingOn) return { model: defaultModel, reason: 'routing off' }
  const q = String(question || '')
  if (q.length > 500) return { model: STRONG_MODEL, reason: 'long question' }
  if (RISKY.test(q)) return { model: STRONG_MODEL, reason: 'write or destructive intent' }
  if (ANALYSIS.test(q)) return { model: STRONG_MODEL, reason: 'analysis-style question' }
  return { model: CHEAP_MODEL, reason: 'simple lookup or count' }
}
