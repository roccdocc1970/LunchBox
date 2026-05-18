/**
 * Cohorts Domain
 *
 * Pure constants and logic for the Cohorts module.
 * No React. No Supabase. Just functions.
 */

export const COHORT_STATUS = ['Active', 'Archived']

export const BLANK_COHORT = {
  name:          '',
  division:      '',
  academic_year: '',
  description:   '',
  status:        'Active',
}

/** Validate a cohort form — returns error string or null */
export function validateCohort(form) {
  if (!form.name?.trim()) return 'Cohort name is required.'
  return null
}

/**
 * Calculate stats for a single cohort given its member and class rows.
 *
 * @param {object[]} members      - rows from cohort_students
 * @param {object[]} cohortClasses - rows from cohort_classes (with auto_enroll)
 */
export function calcCohortStats(members, cohortClasses) {
  const memberCount    = members.length
  const classCount     = cohortClasses.length
  const coreCount      = cohortClasses.filter(cc => cc.auto_enroll).length
  const electiveCount  = cohortClasses.filter(cc => !cc.auto_enroll).length
  return { memberCount, classCount, coreCount, electiveCount }
}

/**
 * Returns 'cohort' for auto-enrolled (core) classes, 'individual' for electives.
 */
export function getCohortEnrollmentMode(cohortClass) {
  return cohortClass.auto_enroll ? 'cohort' : 'individual'
}
