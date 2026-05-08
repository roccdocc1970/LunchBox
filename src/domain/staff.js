/**
 * Staff Domain
 *
 * Pure business logic for the Staff module.
 * No React. No Supabase. Input → output only.
 */

import { getDivision } from './school.js'
import { ALL_GRADES } from './enrollment.js'

// ─── Constants ────────────────────────────────────────────────────────────────

export const ROLES = [
  'Principal',
  'Teacher',
  'Assistant Teacher',
  'Substitute Teacher',
  'Administrator',
  'Counselor',
  'Support Staff',
  'Facilities',
  'Maintenance',
]

export const ROLE_COLORS = {
  Principal:            '#f97316',
  Teacher:              '#3b82f6',
  'Assistant Teacher':  '#6366f1',
  'Substitute Teacher': '#14b8a6',
  Administrator:        '#8b5cf6',
  Counselor:            '#10b981',
  'Support Staff':      '#6b7280',
  Facilities:           '#0ea5e9',
  Maintenance:          '#84cc16',
}

export const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  role: '', grade_assignments: [], hire_date: '', status: 'Active', notes: '',
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Returns the brand color for a given staff role.
 */
export function getRoleColor(role) {
  return ROLE_COLORS[role] || '#6b7280'
}

/**
 * Reads grade_assignments (JSONB array) or falls back to legacy grade_assignment text field.
 */
export function parseGradeAssignments(member) {
  if (member?.grade_assignments) {
    try {
      const a = typeof member.grade_assignments === 'string'
        ? JSON.parse(member.grade_assignments)
        : member.grade_assignments
      if (Array.isArray(a)) return a
    } catch {}
  }
  if (member?.grade_assignment) return [member.grade_assignment]
  return []
}

/**
 * Returns grades assigned to a staff member that are no longer offered at the school.
 */
export function getOrphanedGrades(picked, configuredGrades) {
  if (!configuredGrades) return []
  return picked
    .filter(g => !configuredGrades.includes(g))
    .sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
}

/**
 * Returns unique divisions covering a staff member's active (non-orphaned) grade assignments.
 */
export function getAssignmentDivisions(assignments, configuredGrades, divisionsRaw) {
  const sorted = [...assignments].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  const isOrphaned = (g) => configuredGrades && !configuredGrades.includes(g)
  const uniqueDivisions = []
  sorted.filter(g => !isOrphaned(g)).forEach(g => {
    const div = getDivision(g, divisionsRaw)
    if (div && !uniqueDivisions.find(d => d.name === div.name)) uniqueDivisions.push(div)
  })
  return uniqueDivisions
}

/**
 * Calculate summary stat counts for the staff dashboard.
 */
export function calcStaffStats(staff) {
  return {
    total:    staff.length,
    active:   staff.filter(s => s.status === 'Active').length,
    inactive: staff.filter(s => s.status === 'Inactive').length,
  }
}

/**
 * Filter staff by search text, role, status, and division.
 */
export function filterStaff(staff, { search, filterRole, filterStatus, filterDivision }, divisionsRaw) {
  return staff.filter(s => {
    if (filterRole && s.role !== filterRole) return false
    if (filterStatus && s.status !== filterStatus) return false
    if (filterDivision) {
      const assignments = parseGradeAssignments(s)
      const inDiv = assignments.some(g => getDivision(g, divisionsRaw)?.name === filterDivision)
      if (!inDiv) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const match =
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
}
