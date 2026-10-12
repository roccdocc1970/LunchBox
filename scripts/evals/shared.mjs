/** Scoring helpers shared by the eval sets. Deliberately simple and strict. */

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']

/** Does the reply state the expected answer? Numbers match as digits, as words, or (for 0) as "no"/"none". */
export function matches(expected, reply) {
  const text = String(reply ?? '')
  if (typeof expected === 'number') {
    const digits = new RegExp(`(^|[^\\d.])${expected}([^\\d]|$)`).test(text)
    const word = expected <= 20 && new RegExp(`\\b${NUMBER_WORDS[expected]}\\b`, 'i').test(text)
    const none = expected === 0 && /\b(no|none|nobody)\b/i.test(text)
    return digits || word || none
  }
  return text.toLowerCase().includes(String(expected).toLowerCase())
}

/**
 * HEURISTIC: does the reply read as a refusal / "I can't do that"? This is a keyword check, not
 * understanding — it can be fooled either way. A better grader (a model judging the reply against a
 * rubric) is roadmap item 22.
 */
export const DECLINE = /(can't|cannot|can not|unable|don't have|do not have|no (tool|data|information|access|way)|not (able|available|something i|designed|supported)|isn't (something|available|supported)|outside (of )?(what|my|the)|sorry|don't (support|offer|track)|doesn't (support|offer)|can only|only (able|support)|(isn't|aren't|is not|are not) (data|part of|something|available|included|supported)|not part of)/i
