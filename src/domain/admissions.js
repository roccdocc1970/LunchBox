/**
 * Admissions Domain
 *
 * Pure business logic for the Admissions module.
 * No React. No Supabase. Input → output only.
 */

import { ALL_GRADES } from './enrollment.js'

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUSES = ['New Inquiry', 'Toured', 'Applied', 'Withdrawn']

export const SOURCES = ['Web', 'Tour', 'Referral', 'Word of Mouth', 'Social Media', 'Other']

export const STATUS_COLORS = {
  'New Inquiry': '#3b82f6',
  'Toured':      '#8b5cf6',
  'Applied':     '#f97316',
  'Withdrawn':   '#9ca3af',
}

export const SOURCE_COLORS = {
  'Web':           '#0ea5e9',
  'Tour':          '#8b5cf6',
  'Referral':      '#10b981',
  'Word of Mouth': '#f59e0b',
  'Social Media':  '#ec4899',
  'Other':         '#9ca3af',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function today() {
  return new Date().toISOString().split('T')[0]
}

// ─── Blank form ───────────────────────────────────────────────────────────────

export function makeBlankForm() {
  return {
    parent_first_name: '', parent_last_name: '', email: '', phone: '',
    student_first_name: '', student_last_name: '', grade_applying_for: '',
    status: 'New Inquiry', source: 'Other', inquiry_date: today(), tour_date: '', notes: '',
  }
}

// ─── Business rules ───────────────────────────────────────────────────────────

/**
 * Returns true if an inquiry can be converted to a student record.
 */
export function canConvertToStudent(inquiry) {
  return inquiry.status === 'New Inquiry' || inquiry.status === 'Toured'
}

/**
 * Parse configured grades from school settings, sorted canonically.
 * Returns null if not configured (caller falls back to ALL_GRADES).
 */
export function parseConfiguredGrades(school) {
  try {
    const g = JSON.parse(school?.grades_offered)
    if (!Array.isArray(g) || g.length === 0) return null
    return [...g].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  } catch { return null }
}

/**
 * Build the public-facing application link for a school.
 */
export function buildApplicationLink(userId) {
  return `${window.location.origin}${window.location.pathname}?apply=${userId}`
}

// ─── Filtering & stats ────────────────────────────────────────────────────────

/**
 * Filter inquiries by search text, status, source, and grade.
 */
export function filterInquiries(inquiries, { search, filterStatus, filterSource, filterGrade }) {
  return inquiries.filter(inq => {
    if (filterStatus && inq.status !== filterStatus) return false
    if (filterSource && inq.source !== filterSource) return false
    if (filterGrade && inq.grade_applying_for !== filterGrade) return false
    if (search) {
      const q = search.toLowerCase()
      const match =
        `${inq.student_first_name} ${inq.student_last_name}`.toLowerCase().includes(q) ||
        `${inq.parent_first_name} ${inq.parent_last_name}`.toLowerCase().includes(q) ||
        (inq.email || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
}

/**
 * Count inquiries by pipeline status. Returns { 'New Inquiry': n, ... }
 */
export function calcPipelineCounts(inquiries) {
  return STATUSES.reduce((acc, s) => ({ ...acc, [s]: inquiries.filter(i => i.status === s).length }), {})
}

/**
 * Count inquiries by source, omitting sources with zero count.
 */
export function calcSourceCounts(inquiries) {
  return SOURCES.reduce((acc, s) => {
    const n = inquiries.filter(i => i.source === s).length
    return n > 0 ? { ...acc, [s]: n } : acc
  }, {})
}
