/**
 * School Domain — Shared
 *
 * Pure logic shared across multiple modules.
 * No React. No Supabase. Input → output only.
 *
 * Covers: divisions, grade sorting, status colors.
 * Import from here — never redefine these in individual modules.
 */

import { ALL_GRADES } from './enrollment.js'

// ─── Division Colors ─────────────────────────────────────────────────────────

/** Assigned by division index (0–5). Consistent across all modules. */
export const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

// ─── Student Status Colors ────────────────────────────────────────────────────

export const STATUS_COLORS = {
  Enrolled: '#10b981',
  Waitlisted: '#f59e0b',
  Applied: '#3b82f6',
}

// ─── Divisions ────────────────────────────────────────────────────────────────

/**
 * Parse the divisions JSONB field from the school record.
 * Returns an array of { name, grades[] } objects, or [] if not configured.
 */
export function parseDivisions(divisionsRaw) {
  if (!divisionsRaw) return []
  try {
    const arr = typeof divisionsRaw === 'string' ? JSON.parse(divisionsRaw) : divisionsRaw
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * Resolve the division name and color for a given grade.
 * Returns { name, color } or null if the grade isn't in any division.
 */
export function getDivision(grade, divisionsRaw) {
  if (!grade || !divisionsRaw) return null
  const divs = parseDivisions(divisionsRaw)
  const idx = divs.findIndex(d => d.grades?.includes(grade))
  if (idx === -1) return null
  return { name: divs[idx].name, color: DIVISION_COLORS[idx % DIVISION_COLORS.length] }
}

/**
 * Sort an array of grade strings by canonical grade order.
 */
export function sortGrades(grades) {
  return [...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
}

/**
 * Get the list of grades available for a school.
 * Prefers grades derived from configured divisions; falls back to ALL_GRADES.
 * Used by Attendance and any module needing a division-aware grade list.
 */
export function getAvailableGrades(school) {
  const divs = parseDivisions(school?.divisions)
  if (divs.length > 0) {
    const grades = [...new Set(divs.flatMap(d => d.grades || []))]
    if (grades.length > 0) return sortGrades(grades)
  }
  return ALL_GRADES
}
