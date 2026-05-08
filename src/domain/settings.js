/**
 * Settings Domain
 *
 * Pure business logic for the Settings module.
 * No React. No Supabase. Input → output only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
]

export const SCHOOL_TYPES = ['Private', 'Charter', 'Public', 'Montessori', 'Religious', 'Other']

export const DEFAULT_DIVISIONS = [
  { name: 'Early Childhood', grades: [] },
  { name: 'Lower School', grades: [] },
  { name: 'Intermediate School', grades: [] },
  { name: 'Upper School', grades: [] },
]

export const DEFAULT_SUBJECTS = [
  'Reading / ELA', 'Writing', 'Mathematics', 'Science',
  'Social Studies', 'Art', 'Music', 'Physical Education', 'Social-Emotional Learning',
].join('\n')

// ─── Parsers (JSONB → editable form state) ────────────────────────────────────

/**
 * Parse grades_offered JSONB into a plain JS array.
 */
export function parseGradesOffered(val) {
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

/**
 * Parse subjects_offered JSONB into a newline-separated string for the textarea.
 */
export function parseSubjectsForEdit(val) {
  try {
    const s = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(s) && s.length > 0) return s.join('\n')
  } catch {}
  return DEFAULT_SUBJECTS
}

/**
 * Parse divisions JSONB with a fallback to DEFAULT_DIVISIONS.
 */
export function parseDivisionsForEdit(val) {
  if (!val) return DEFAULT_DIVISIONS
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(d) && d.length > 0) return d
  } catch {}
  return DEFAULT_DIVISIONS
}

// ─── Serializers (form state → DB-ready values) ───────────────────────────────

/**
 * Convert the textarea string back into a JSON array for storage.
 */
export function serializeSubjects(text) {
  return JSON.stringify(text.split('\n').map(s => s.trim()).filter(Boolean))
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate the school profile form. Throws if required fields are missing.
 */
export function validateProfile(profile) {
  if (!profile.name || !profile.name.trim()) {
    throw new Error('School name is required.')
  }
}
