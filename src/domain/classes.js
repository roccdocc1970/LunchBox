/**
 * Classes Domain
 *
 * Pure constants and logic for the Classes module.
 */

export const CLASS_STATUS = ['Active', 'Inactive']

export const ENROLLMENT_MODES = [
  { value: 'open',   label: 'Open',   description: 'Individual student enrollment only' },
  { value: 'cohort', label: 'Cohort', description: 'Cohort bulk-enrollment only — individual add hidden' },
  { value: 'mixed',  label: 'Mixed',  description: 'Both cohort bulk-enroll and individual add available' },
]

export const BLANK_CLASS = {
  name:            '',
  subject:         '',
  division:        '',
  teacher_id:      '',
  teacher_name:    '',
  room_id:         '',
  room_name:       '',
  class_size:      '',
  enrollment_mode: 'open',
  description:     '',
  notes:           '',
  status:          'Active',
}

/** Validate a class form — returns error string or null */
export function validateClass(form) {
  if (!form.name?.trim()) return 'Class name is required.'
  return null
}

/** Aggregate summary stats for a list of classes */
export function calcClassStats(classes) {
  const total  = classes.length
  const active = classes.filter(c => c.status === 'Active').length

  const byDivision = classes.reduce((acc, c) => {
    if (c.division) acc[c.division] = (acc[c.division] || 0) + 1
    return acc
  }, {})

  const bySubject = classes.reduce((acc, c) => {
    if (c.subject) acc[c.subject] = (acc[c.subject] || 0) + 1
    return acc
  }, {})

  return { total, active, inactive: total - active, byDivision, bySubject }
}
