/**
 * Students Domain
 *
 * Pure constants and business logic for the Students module.
 * No React. No Supabase. No side effects.
 */

import { ALL_GRADES } from './enrollment.js'
import { getDivision } from './school.js'

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  Enrolled:   '#10b981',
  Waitlisted: '#f59e0b',
  Applied:    '#3b82f6',
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export const INCIDENT_TYPES = ['Behavioral', 'Academic', 'Attendance', 'Safety', 'Other']

export const INCIDENT_TYPE_COLORS = {
  Behavioral: '#ef4444',
  Academic:   '#f59e0b',
  Attendance: '#3b82f6',
  Safety:     '#8b5cf6',
  Other:      '#6b7280',
}

export const today = () => new Date().toISOString().split('T')[0]

export const BLANK_INCIDENT = () => ({
  date: today(), type: 'Behavioral', description: '', resolution: '', reported_by: '', status: 'Open',
})

// ─── Health ───────────────────────────────────────────────────────────────────

export const HEALTH_ENTRY_CATEGORIES = ['Allergy', 'Medication', 'Immunization', 'Condition', 'Injury', 'Other']

export const HEALTH_CATEGORY_COLORS = {
  Allergy: '#ef4444', Medication: '#3b82f6', Immunization: '#10b981',
  Condition: '#f59e0b', Injury: '#8b5cf6', Other: '#6b7280',
}

export const HEALTH_CATEGORY_ICONS = {
  Allergy: 'AlertTriangle', Medication: 'Pill', Immunization: 'Syringe',
  Condition: 'Stethoscope', Injury: 'Bandage', Other: 'ClipboardList',
}

export const BLANK_HEALTH_ENTRY = {
  category: 'Allergy', name: '', detail: '', date: '', expiration_date: '', notes: '',
}

export const BLANK_HEALTH_PROFILE = {
  blood_type: '', primary_physician: '', physician_phone: '',
  insurance_provider: '', insurance_policy_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
  physical_date: '', notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const parentDisplayName = (p) => p ? `${p.first_name} ${p.last_name}` : '—'

export const statusColor = (status) => STATUS_COLORS[status] || '#6b7280'

export const isEntryExpired = (entry) =>
  !!(entry.expiration_date && entry.expiration_date < today())

/** True when moving from currentGrade skips one or more grades. */
export const isSkipGrade = (currentGrade, newGrade) => {
  const ci = ALL_GRADES.indexOf(currentGrade)
  const ni = ALL_GRADES.indexOf(newGrade)
  return ci !== -1 && ni !== -1 && ni > ci + 1
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function calcStudentStats(students) {
  return {
    enrolled:   students.filter(s => s.status === 'Enrolled').length,
    applied:    students.filter(s => s.status === 'Applied').length,
    waitlisted: students.filter(s => s.status === 'Waitlisted').length,
    total:      students.length,
  }
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * Filter the student roster by search text, grade, status, and division.
 * @param {object} filters - { search, filterGrade, filterStatus, filterDivision }
 * @param {any} divisionsRaw - school.divisions (JSON or array)
 */
export function filterStudents(students, { search = '', filterGrade = '', filterStatus = '', filterDivision = '' }, divisionsRaw) {
  return students.filter((s) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const parentName = `${s.parents?.first_name || ''} ${s.parents?.last_name || ''}`.toLowerCase()
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      parentName.includes(search.toLowerCase()) ||
      (s.parents?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchGrade = !filterGrade || s.grade === filterGrade
    const matchStatus = !filterStatus || s.status === filterStatus
    const matchDivision = !filterDivision || getDivision(s.grade, divisionsRaw)?.name === filterDivision

    return matchSearch && matchGrade && matchStatus && matchDivision
  })
}

/** Sorted unique grade values present in the roster. */
export function getGradeOptions(students) {
  return [...new Set(students.map(s => s.grade).filter(Boolean))]
    .sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
}
