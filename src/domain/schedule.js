/**
 * Schedule Domain
 *
 * Pure constants and logic for bell schedule and (future) class scheduling.
 */

export const PERIOD_TYPES = ['Instruction', 'Homeroom', 'Break', 'Lunch', 'Other']

export const DAYS_OPTIONS = [
  'Daily',
  'Mon / Wed / Fri',
  'Tue / Thu',
  'Mon – Thu',
  'Mon – Fri',
]

export const PERIOD_TYPE_COLORS = {
  Instruction: '#3b82f6',
  Homeroom:    '#8b5cf6',
  Break:       '#10b981',
  Lunch:       '#f59e0b',
  Other:       '#6b7280',
}

export const BLANK_PERIOD = {
  name:         '',
  start_time:   '',
  end_time:     '',
  days_of_week: 'Daily',
  type:         'Instruction',
  sort_order:   0,
}

/** Validate a period form — returns error string or null */
export function validatePeriod(form) {
  if (!form.name?.trim())       return 'Period name is required.'
  if (!form.start_time)         return 'Start time is required.'
  if (!form.end_time)           return 'End time is required.'
  if (form.start_time >= form.end_time) return 'End time must be after start time.'
  return null
}

/** Format "08:00" → "8:00 AM" */
export function fmt12(time) {
  if (!time) return '—'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Sort periods by start_time, then sort_order */
export function sortPeriods(periods) {
  return [...periods].sort((a, b) => {
    if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time)
    return a.sort_order - b.sort_order
  })
}
