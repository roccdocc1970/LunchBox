/**
 * Student Timeline Service
 *
 * Fetches every data source the student evolution timeline needs, in
 * parallel. Aggregation into year buckets happens in domain/timeline.js —
 * this file only fetches.
 */

import { getGradeHistory, getIncidents, getStudentHealth } from './students.js'
import { getCohortsForStudent } from './cohorts.js'
import { getClassEnrollmentsForStudent } from './classEnrollments.js'
import { getReportCardsForStudent } from './reportCards.js'
import { getAttendanceHistory } from './attendance.js'
import { getDonationsForFamily } from './fundraising.js'

export async function getStudentTimelineData(supabase, schoolId, student) {
  const [
    gradeHistory,
    cohortMemberships,
    classEnrollments,
    reportCards,
    incidents,
    { entries: healthEntries },
    attendanceRecords,
    donations,
  ] = await Promise.all([
    getGradeHistory(supabase, student.id),
    getCohortsForStudent(supabase, student.id),
    getClassEnrollmentsForStudent(supabase, student.id),
    getReportCardsForStudent(supabase, student.id),
    getIncidents(supabase, student.id),
    getStudentHealth(supabase, student.id),
    getAttendanceHistory(supabase, schoolId, { studentId: student.id }),
    getDonationsForFamily(supabase, { parentId: student.parent_id, studentId: student.id }),
  ])

  return { gradeHistory, cohortMemberships, classEnrollments, reportCards, incidents, healthEntries, attendanceRecords, donations }
}
