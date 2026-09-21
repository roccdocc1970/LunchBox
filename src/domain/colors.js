/**
 * Colors Domain
 *
 * Generalizes the `statusColor = (s) => STATUS_COLORS[s] || '#6b7280'`
 * pattern already used in domain/students.js into a reusable helper, for
 * coloring categories a generative view spec returns that aren't one of
 * the app's known status enums.
 */

export const UNKNOWN_COLOR = '#6b7280'

export function colorFor(value, map = {}, fallback = UNKNOWN_COLOR) {
  return map[value] || fallback
}
