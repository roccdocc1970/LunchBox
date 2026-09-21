/**
 * Student Timeline Domain
 *
 * Pure aggregation of a student's full lifecycle (inquiry through alumni)
 * into per-academic-year buckets. No React. No Supabase. Input -> output only.
 */

import { academicYearForDate } from './enrollment.js'

function bucketByYear(rows, getYear) {
  const map = {}
  for (const row of rows) {
    const year = getYear(row)
    if (!year) continue
    if (!map[year]) map[year] = []
    map[year].push(row)
  }
  return map
}

const ATTENDANCE_COUNTED = ['Present', 'Absent', 'Tardy']

export function buildStudentTimeline({
  student,
  gradeHistory = [],
  cohortMemberships = [],
  classEnrollments = [],
  reportCards = [],
  incidents = [],
  healthEntries = [],
  attendanceRecords = [],
  donations = [],
}) {
  const cohortsByYear     = bucketByYear(cohortMemberships, m => m.cohorts?.academic_year)
  const classesByYear     = bucketByYear(classEnrollments, e => e.academic_year)
  const reportCardsByYear = bucketByYear(reportCards, r => r.academic_year)
  const incidentsByYear   = bucketByYear(incidents, r => academicYearForDate(r.date))
  const healthByYear      = bucketByYear(healthEntries, r => r.date && academicYearForDate(r.date))
  const attendanceByYear  = bucketByYear(attendanceRecords, r => academicYearForDate(r.date))
  const donationsByYear   = bucketByYear(donations, r => academicYearForDate(r.date))

  const allYears = new Set([
    ...gradeHistory.map(g => g.academic_year),
    ...Object.keys(cohortsByYear),
    ...Object.keys(classesByYear),
    ...Object.keys(reportCardsByYear),
    ...Object.keys(incidentsByYear),
    ...Object.keys(healthByYear),
    ...Object.keys(attendanceByYear),
    ...Object.keys(donationsByYear),
  ].filter(Boolean))

  const sortedYears = [...allYears].sort()

  let previousCohortNames = null

  const years = sortedYears.map((academicYear, i) => {
    const gradeEntry = gradeHistory.find(g => g.academic_year === academicYear)
    const cohorts = (cohortsByYear[academicYear] || []).map(m => ({ id: m.cohort_id, name: m.cohorts.name }))
    const classes = (classesByYear[academicYear] || []).map(e => ({ id: e.class_id, name: e.classes?.name || 'Class' }))

    const cohortNames = new Set(cohorts.map(c => c.name))
    const cohortChanged = i > 0 && previousCohortNames !== null && (
      cohortNames.size !== previousCohortNames.size ||
      [...cohortNames].some(n => !previousCohortNames.has(n))
    )
    if (cohortNames.size > 0) previousCohortNames = cohortNames

    const yearAttendance = attendanceByYear[academicYear] || []
    const present = yearAttendance.filter(a => a.status === 'Present').length
    const countedTotal = yearAttendance.filter(a => ATTENDANCE_COUNTED.includes(a.status)).length
    const attendanceRate = countedTotal > 0 ? Math.round((present / countedTotal) * 100) : null

    const donationTotal = (donationsByYear[academicYear] || []).reduce((sum, d) => sum + (d.amount || 0), 0)

    return {
      academicYear,
      grade: gradeEntry?.grade || null,
      isRepeat: !!gradeEntry?.is_repeat,
      isSkip: !!gradeEntry?.is_skip,
      cohorts,
      cohortChanged,
      classes,
      reportCardCount: (reportCardsByYear[academicYear] || []).length,
      incidentCount: (incidentsByYear[academicYear] || []).length,
      attendanceRate,
      healthFlagCount: (healthByYear[academicYear] || []).length,
      donationTotal,
      isCurrent: i === sortedYears.length - 1 && student.status !== 'Alumni',
    }
  })

  return {
    bookends: {
      inquiryDate: student.inquiry_date || null,
      status: student.status,
      graduationYear: student.graduation_year || null,
    },
    years,
  }
}
