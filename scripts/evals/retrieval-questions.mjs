/**
 * Retrieval question set and metrics (roadmap Step 8 / ID 17). Used by scripts/retrieval-eval.mjs.
 *
 * Each question names text that MUST appear in a retrieved chunk for the search to count as a hit —
 * matching on content (not headings) so the check does not depend on how a document happens to be cut.
 * Four kinds:
 *   exact_term   — hinges on an exact code, number or name (where keyword search should shine)
 *   paraphrase   — everyday wording far from the document's own (where meaning search should shine)
 *   multi_section — needs two different chunks at once (a measure of recall within the top results)
 *   not_covered  — the documents are silent; not scored, only the top similarity is reported
 */

export const QUESTIONS = [
  // exact_term
  { id: 'exact_form_pu7', kind: 'exact_term', q: 'What is Form PU-7?', mustContain: ['Form PU-7'] },
  { id: 'exact_extension', kind: 'exact_term', q: 'Who is at extension 4417?', mustContain: ['nurse: extension 4417'] },
  { id: 'exact_form_rr2', kind: 'exact_term', q: 'How long do Form RR-2 requests take?', mustContain: ['5 business days'] },
  { id: 'exact_form_med3', kind: 'exact_term', q: 'What does Form MED-3 do?', mustContain: ['Form MED-3'] },
  // exact_term against look-alike codes and extensions (added after the first baseline proved too easy)
  { id: 'exact_form_pu9', kind: 'exact_term', q: 'What is Form PU-9?', mustContain: ['Form PU-9 (Pool Use Agreement)'] },
  { id: 'exact_ext_4471', kind: 'exact_term', q: 'Who is at extension 4471?', mustContain: ['Brandt: extension 4471'] },
  { id: 'exact_ext_4407', kind: 'exact_term', q: 'Who do I reach at extension 4407?', mustContain: ['Pool manager: extension 4407'] },
  { id: 'exact_form_fa12', kind: 'exact_term', q: 'How long does a Form FA-12 decision take?', mustContain: ['10 business days'] },
  // held-out exact-term questions: written BEFORE the keyword-ranking fix (migration 007) and never used to tune it
  { id: 'holdout_ext_4474', kind: 'exact_holdout', q: 'Who is at extension 4474?', mustContain: ['Osei: extension 4474'] },
  { id: 'holdout_ext_4430', kind: 'exact_holdout', q: 'Who do I reach at extension 4430?', mustContain: ['Alvarez: extension 4430'] },
  { id: 'holdout_ext_4410', kind: 'exact_holdout', q: 'Whose number is extension 4410?', mustContain: ['Equipment room: extension 4410'] },
  { id: 'holdout_form_er3', kind: 'exact_holdout', q: 'What is Form ER-3 for?', mustContain: ['returned with Form ER-3'] },
  // paraphrase
  { id: 'para_late_fee', kind: 'paraphrase', q: 'How much do I pay if I collect my child late?', mustContain: ['$12'] },
  { id: 'para_inhaler', kind: 'paraphrase', q: 'Can my daughter keep her inhaler in her backpack?', mustContain: ['EpiPen'] },
  { id: 'para_tardy', kind: 'paraphrase', q: 'What happens when my son arrives after the morning bell?', mustContain: ['8:10'] },
  { id: 'para_snow', kind: 'paraphrase', q: 'How will we hear if school is cancelled for snow?', mustContain: ['6:00 AM'] },
  { id: 'para_peanut', kind: 'paraphrase', q: 'Is it okay to pack peanut butter in lunches?', mustContain: ['nut-free'] },
  // multi_section: both facts must appear somewhere in the top results
  { id: 'multi_medication', kind: 'multi_section', q: 'What form does the nurse need before giving my child medicine, and may students carry their own medication?', mustContain: ['Form MED-3', 'may not carry any medication'] },
  { id: 'multi_late_contact', kind: 'multi_section', q: 'What is the late pickup fee, and which extension do I call about being late?', mustContain: ['$12', 'extension 4401'] },
  // not_covered (reported, not scored)
  { id: 'none_cellphone', kind: 'not_covered', q: "What is the school's cell phone policy?", mustContain: [] },
  { id: 'none_tuition', kind: 'not_covered', q: 'How much is annual tuition?', mustContain: [] },
]

const has = (chunk, text) => String(chunk?.content ?? '').toLowerCase().includes(text.toLowerCase())

/** 1-based rank of the first result containing ALL of `mustContain` in one chunk; null if none. */
export function rankOfFirstHit(results, mustContain) {
  const i = results.findIndex(r => mustContain.every(t => has(r, t)))
  return i === -1 ? null : i + 1
}

/** True when every required text appears somewhere in the top-k results (possibly in different chunks). */
export function unionHasAll(results, mustContain, k) {
  const top = results.slice(0, k)
  return mustContain.every(t => top.some(r => has(r, t)))
}

/** Scores one question against its ranked results. */
export function scoreQuestion(question, results) {
  if (question.kind === 'not_covered') return { scored: false }
  if (question.kind === 'multi_section') {
    return { scored: true, top1: false, top3: unionHasAll(results, question.mustContain, 3), top4: unionHasAll(results, question.mustContain, 4), rank: null, rr: 0 }
  }
  const rank = rankOfFirstHit(results, question.mustContain)
  return { scored: true, top1: rank === 1, top3: rank !== null && rank <= 3, top4: rank !== null && rank <= 4, rank, rr: rank ? 1 / rank : 0 }
}

/** Summary per kind: counts and (for single-target kinds) mean reciprocal rank. */
export function summarize(scoredRows) {
  const byKind = {}
  for (const r of scoredRows) {
    if (!r.score.scored) continue
    const k = (byKind[r.kind] ||= { n: 0, top1: 0, top3: 0, top4: 0, rr: 0 })
    k.n += 1
    if (r.score.top1) k.top1 += 1
    if (r.score.top3) k.top3 += 1
    if (r.score.top4) k.top4 += 1
    k.rr += r.score.rr
  }
  return Object.entries(byKind).map(([kind, k]) => ({
    kind, questions: k.n,
    top1: kind === 'multi_section' ? '—' : `${k.top1}/${k.n}`,
    top3: `${k.top3}/${k.n}`,
    top4: `${k.top4}/${k.n}`,
    mrr: kind === 'multi_section' ? '—' : (k.rr / k.n).toFixed(2),
  }))
}
