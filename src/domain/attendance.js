/**
 * Attendance Domain
 *
 * Pure business logic for the Attendance module.
 * No React. No Supabase. Input → output only.
 */

/** Valid attendance status values. */
export const STATUSES = ['Present', 'Absent', 'Tardy', 'Excused']

/** Color map for attendance statuses. Separate from enrollment STATUS_COLORS in school.js. */
export const ATTENDANCE_STATUS_COLORS = {
  Present: '#10b981',
  Absent:  '#ef4444',
  Tardy:   '#f59e0b',
  Excused: '#6b7280',
}

/**
 * Return today's date as a YYYY-MM-DD string.
 */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Count how many students have each attendance status.
 * Returns { present, absent, tardy, excused }.
 */
export function summarizeAttendance(students, attendanceMap) {
  return students.reduce(
    (acc, s) => {
      const status = attendanceMap[s.id]?.status || 'Present'
      if (status === 'Present') acc.present++
      else if (status === 'Absent') acc.absent++
      else if (status === 'Tardy') acc.tardy++
      else if (status === 'Excused') acc.excused++
      return acc
    },
    { present: 0, absent: 0, tardy: 0, excused: 0 }
  )
}
