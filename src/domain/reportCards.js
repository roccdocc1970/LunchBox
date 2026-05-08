/**
 * Report Cards Domain
 *
 * Pure business logic for the Report Cards module.
 * No React. No Supabase. Input → output only.
 */

import { getDivision } from './school.js'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_SUBJECTS = [
  'Reading / ELA', 'Writing', 'Mathematics', 'Science',
  'Social Studies', 'Art', 'Music', 'Physical Education', 'Social-Emotional Learning',
]

export const GRADE_OPTIONS = {
  Letter: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'INC', 'N/A'],
  Standards: ['4 - Exceeds', '3 - Meets', '2 - Approaching', '1 - Beginning', 'N/A'],
  Satisfactory: ['E - Excellent', 'S - Satisfactory', 'N - Needs Improvement', 'N/A'],
}

export const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#10b981',
  'B+': '#3b82f6', 'B': '#3b82f6', 'B-': '#3b82f6',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#f59e0b',
  'D+': '#ef4444', 'D': '#ef4444', 'F': '#ef4444',
  '4 - Exceeds': '#10b981', '3 - Meets': '#3b82f6',
  '2 - Approaching': '#f59e0b', '1 - Beginning': '#ef4444',
  'E - Excellent': '#10b981', 'S - Satisfactory': '#3b82f6',
  'N - Needs Improvement': '#ef4444',
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Returns the list of term labels for a given grading period setting.
 */
export function getTerms(gradingPeriod) {
  if (gradingPeriod === 'Trimesters') return ['T1', 'T2', 'T3']
  if (gradingPeriod === 'Semesters') return ['S1 - Fall', 'S2 - Spring']
  if (gradingPeriod === 'Annual') return ['Annual']
  return ['Q1', 'Q2', 'Q3', 'Q4']
}

/**
 * Returns the grade options array for a given grading scale setting.
 * Falls back to Letter scale if not configured.
 */
export function buildGradeOptions(scale) {
  return GRADE_OPTIONS[scale] || GRADE_OPTIONS.Letter
}

/**
 * Parses subjects_offered JSONB. Falls back to DEFAULT_SUBJECTS if empty or invalid.
 */
export function parseSubjects(val) {
  try {
    const s = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(s) && s.length > 0) return s
  } catch {}
  return DEFAULT_SUBJECTS
}

/**
 * Returns the number of subjects that have a grade entered.
 */
export function gradedCount(grades) {
  return (grades || []).filter(g => g.grade && g.grade !== '').length
}

/**
 * Filter report cards by search text, term, published status, and division.
 */
export function filterReportCards(reportCards, { search, filterTerm, filterStatus, filterDivision }, divisionsRaw) {
  return reportCards.filter(rc => {
    if (search && !rc.student_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTerm && rc.term !== filterTerm) return false
    if (filterStatus === 'published' && !rc.published) return false
    if (filterStatus === 'draft' && rc.published) return false
    if (filterDivision && getDivision(rc.student_grade, divisionsRaw)?.name !== filterDivision) return false
    return true
  })
}

/**
 * Summarize report card counts for the stat bar.
 */
export function calcReportCardStats(reportCards) {
  return {
    total: reportCards.length,
    published: reportCards.filter(r => r.published).length,
    draft: reportCards.filter(r => !r.published).length,
  }
}
