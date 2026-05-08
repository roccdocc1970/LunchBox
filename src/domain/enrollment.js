/**
 * Enrollment Domain
 *
 * Pure business logic for the Enrollment module.
 * No React. No Supabase. Input → output only.
 */

/**
 * Canonical grade order used across the entire app.
 * Always sort grades by their index in this array.
 */
export const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

/**
 * Parse and sort the grades_offered field from the school config.
 * Returns a sorted array of grade strings, or null if not configured.
 */
export function parseGrades(school) {
  try {
    const g = JSON.parse(school?.grades_offered)
    if (!Array.isArray(g) || g.length === 0) return null
    return [...g].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  } catch {
    return null
  }
}

/**
 * Map an enrollment status to its display color.
 */
export function statusColor(status) {
  if (status === 'Enrolled') return '#10b981'
  if (status === 'Waitlisted') return '#f59e0b'
  return '#3b82f6' // Applied (default)
}
