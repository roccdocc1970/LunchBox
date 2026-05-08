/**
 * Alumni Domain
 *
 * Pure business logic for the Alumni module.
 * No React. No Supabase. Input → output only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const RELATIONSHIPS = ['None', 'Donor', 'Volunteer', 'Mentor', 'Ambassador']

export const DONOR_STATUSES = ['Never', 'Prospect', 'Active Donor', 'Lapsed']

export const CONTACT_METHODS = ['Email', 'Phone', 'Mail']

export const DONOR_COLORS = {
  'Active Donor': '#10b981',
  'Prospect':     '#3b82f6',
  'Lapsed':       '#f59e0b',
  'Never':        '#9ca3af',
}

export const RELATIONSHIP_COLORS = {
  'Donor':      '#10b981',
  'Volunteer':  '#3b82f6',
  'Mentor':     '#8b5cf6',
  'Ambassador': '#f97316',
  'None':       '#9ca3af',
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Calculate summary stat counts for the alumni dashboard.
 */
export function calcAlumniStats(alumni) {
  return {
    total:        alumni.length,
    activeDonors: alumni.filter(a => a.donor_status === 'Active Donor').length,
    prospects:    alumni.filter(a => a.donor_status === 'Prospect').length,
    optedIn:      alumni.filter(a => a.opt_in).length,
  }
}

/**
 * Sum the total giving from a giving history array.
 */
export function calcGivingTotal(givingHistory) {
  return givingHistory.reduce((sum, d) => sum + (d.amount || 0), 0)
}

/**
 * Return sorted unique graduation years from the alumni list.
 */
export function getGraduationYears(alumni) {
  return [...new Set(alumni.map(a => a.graduation_year).filter(Boolean))].sort((a, b) => b - a)
}

/**
 * Filter alumni by search text, graduation year, donor status, and relationship.
 */
export function filterAlumni(alumni, { search, filterYear, filterDonor, filterRelationship }) {
  return alumni.filter(a => {
    if (filterYear && String(a.graduation_year) !== filterYear) return false
    if (filterDonor && a.donor_status !== filterDonor) return false
    if (filterRelationship && a.relationship !== filterRelationship) return false
    if (search) {
      const q = search.toLowerCase()
      const match =
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.employer || '').toLowerCase().includes(q) ||
        (a.college || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
}

/**
 * Build the DB update payload for an alumni edit form.
 * Normalises the opt_in field (string "true"/"false" → boolean).
 */
export function buildAlumnusPayload(editForm) {
  const {
    first_name, last_name, graduation_year, grade_completed,
    email, phone, address, city, state, zip,
    opt_in, preferred_contact, last_contacted_date,
    relationship, donor_status, employer, college, notes,
  } = editForm
  return {
    first_name, last_name,
    graduation_year: graduation_year || null,
    grade_completed,
    email, phone, address, city, state, zip,
    opt_in: opt_in === 'true' || opt_in === true,
    preferred_contact,
    last_contacted_date: last_contacted_date || null,
    relationship, donor_status, employer, college, notes,
  }
}
