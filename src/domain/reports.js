/**
 * Reports Domain
 *
 * Pure constants and calculation functions for all seven report tabs.
 * No React. No Supabase. No side effects.
 */

import { fmt, CAMPAIGN_TYPE_COLORS } from './fundraising.js'
import { ROLE_COLORS, parseGradeAssignments, calcStaffStats } from './staff.js'
import { CATEGORIES as WO_CATEGORIES, PRIORITY_COLORS as WO_PRIORITY_COLORS, STATUS_COLORS as WO_STATUS_COLORS, isOverdue, thisMonth } from './facilities.js'
import { INCIDENT_TYPES, INCIDENT_TYPE_COLORS, STATUS_COLORS as STUDENT_STATUS_COLORS } from './students.js'
import { parseDivisions, DIVISION_COLORS } from './school.js'

export { fmt, CAMPAIGN_TYPE_COLORS, ROLE_COLORS, WO_CATEGORIES, WO_PRIORITY_COLORS, WO_STATUS_COLORS, INCIDENT_TYPES, INCIDENT_TYPE_COLORS, STUDENT_STATUS_COLORS, DIVISION_COLORS, parseDivisions }

// ─── Constants ────────────────────────────────────────────────────────────────

export const TABS = [
  { id: 'enrollment',     label: 'Enrollment' },
  { id: 'attendance',     label: 'Attendance' },
  { id: 'incidents',      label: 'Student Incidents' },
  { id: 'communications', label: 'Communications' },
  { id: 'staff',          label: 'Staff' },
  { id: 'fundraising',    label: 'Fundraising' },
  { id: 'facilities',     label: 'Facilities' },
]

export const ATTENDANCE_STATUS_COLORS = {
  Present: '#10b981', Absent: '#ef4444', Tardy: '#f59e0b', Excused: '#6b7280',
}

export const WO_CATEGORY_COLORS = ['#6366f1', '#f97316', '#14b8a6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#0ea5e9', '#6b7280']

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Returns an array of {label, year, month} for the last N months (oldest first). */
export function getLastNMonths(n) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })
}

/**
 * Groups records into month buckets.
 * @param {object[]} records
 * @param {function} getDate - (record) => Date string or Date
 * @param {object[]} months - from getLastNMonths()
 * @param {function} [getValue] - (record) => number; defaults to () => 1 (count)
 */
export function groupByMonth(records, getDate, months, getValue = () => 1) {
  return months.map(m => ({
    ...m,
    count: records.reduce((sum, r) => {
      const raw = getDate(r)
      if (!raw) return sum
      const d = new Date(raw)
      if (isNaN(d)) return sum
      return d.getFullYear() === m.year && d.getMonth() === m.month ? sum + getValue(r) : sum
    }, 0),
  }))
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export function calcEnrollmentStats(students, school) {
  const total      = students.length
  const enrolled   = students.filter(s => s.status === 'Enrolled').length
  const applied    = students.filter(s => s.status === 'Applied').length
  const waitlisted = students.filter(s => s.status === 'Waitlisted').length
  const capacity   = school?.student_capacity || 0
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null

  const gradeCounts = {}
  students.forEach(s => { const g = s.grade || 'Unknown'; gradeCounts[g] = (gradeCounts[g] || 0) + 1 })
  const gradeEntries = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])
  const maxGradeCount = gradeEntries.length > 0 ? gradeEntries[0][1] : 1

  return { total, enrolled, applied, waitlisted, capacity, capacityPct, gradeEntries, maxGradeCount }
}

export function calcDivisionEnrollmentStats(students, divisionsRaw) {
  const divisions = parseDivisions(divisionsRaw).filter(d => d.grades?.length > 0)
  if (divisions.length === 0) return null
  const stats = divisions.map((div, i) => ({
    name: div.name,
    color: DIVISION_COLORS[i % DIVISION_COLORS.length],
    count: students.filter(s => div.grades.includes(s.grade)).length,
    enrolledCount: students.filter(s => div.grades.includes(s.grade) && s.status === 'Enrolled').length,
  }))
  return { stats, maxCount: Math.max(...stats.map(d => d.count), 1) }
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function calcAttendanceStats(attendanceRecords, months) {
  const total   = attendanceRecords.length
  const present = attendanceRecords.filter(r => r.status === 'Present').length
  const absent  = attendanceRecords.filter(r => r.status === 'Absent').length
  const tardy   = attendanceRecords.filter(r => r.status === 'Tardy').length
  const presentRate = total > 0 ? Math.round((present / total) * 100) : null

  const absenceMonthCounts = groupByMonth(
    attendanceRecords.filter(r => r.status !== 'Present'),
    r => r.date, months
  )
  const maxAbsenceMonth = Math.max(...absenceMonthCounts.map(m => m.count), 1)

  // Chronic absenteeism: >10% non-present, min 5 days
  const studentMap = {}
  attendanceRecords.forEach(r => {
    if (!studentMap[r.student_id]) studentMap[r.student_id] = { name: r.student_name, grade: r.student_grade, total: 0, absent: 0 }
    studentMap[r.student_id].total++
    if (r.status !== 'Present') studentMap[r.student_id].absent++
  })
  const chronic = Object.values(studentMap)
    .filter(s => s.total >= 5 && s.absent / s.total > 0.1)
    .sort((a, b) => (b.absent / b.total) - (a.absent / a.total))

  return { total, present, absent, tardy, presentRate, absenceMonthCounts, maxAbsenceMonth, chronic }
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export function calcIncidentReportStats(incidents, months) {
  const total    = incidents.length
  const open     = incidents.filter(i => i.status === 'Open').length
  const resolved = incidents.filter(i => i.status === 'Resolved').length
  const openList = incidents.filter(i => i.status === 'Open')

  const typeCounts = INCIDENT_TYPES.map(type => ({
    type, count: incidents.filter(i => i.type === type).length,
  }))
  const maxTypeCount = Math.max(...typeCounts.map(t => t.count), 1)

  const monthCounts = groupByMonth(incidents, i => i.date, months)
  const maxMonth    = Math.max(...monthCounts.map(m => m.count), 1)

  return { total, open, resolved, openList, typeCounts, maxTypeCount, monthCounts, maxMonth }
}

// ─── Communications ───────────────────────────────────────────────────────────

export function calcCommReportStats(messages, months) {
  const totalParentsReached = messages.reduce((sum, m) => sum + (m.recipient_count || 0), 0)
  const monthCounts = groupByMonth(messages, m => m.created_at, months)
  const maxMonth    = Math.max(...monthCounts.map(m => m.count), 1)
  return { totalParentsReached, monthCounts, maxMonth }
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export function calcStaffReportStats(staff, divisionsRaw) {
  const activeStaff   = staff.filter(s => s.status === 'Active')
  const inactiveStaff = staff.filter(s => s.status === 'Inactive')
  const distinctRoles = [...new Set(activeStaff.map(s => s.role).filter(Boolean))].length

  const ROLES = ['Principal', 'Teacher', 'Assistant Teacher', 'Substitute Teacher', 'Administrator', 'Counselor', 'Support Staff', 'Facilities', 'Maintenance']
  const roleCounts = ROLES.map(role => ({
    role, count: activeStaff.filter(s => s.role === role).length,
  })).filter(r => r.count > 0)
  const maxRoleCount = Math.max(...roleCounts.map(r => r.count), 1)

  const divisions = parseDivisions(divisionsRaw).filter(d => d.grades?.length > 0)
  const divisionStaffCounts = divisions.map((div, i) => ({
    name: div.name,
    color: DIVISION_COLORS[i % DIVISION_COLORS.length],
    count: activeStaff.filter(s => parseGradeAssignments(s).some(g => div.grades.includes(g))).length,
  }))
  const maxDivStaffCount = Math.max(...divisionStaffCounts.map(d => d.count), 1)

  const gradeCoverage = {}
  activeStaff.forEach(s => {
    parseGradeAssignments(s).forEach(g => { gradeCoverage[g] = (gradeCoverage[g] || 0) + 1 })
  })
  const gradeCoverageEntries = Object.entries(gradeCoverage).sort((a, b) => b[1] - a[1])
  const maxGradeCoverage = gradeCoverageEntries.length > 0 ? gradeCoverageEntries[0][1] : 1

  const unassignedStaff = activeStaff.filter(s => parseGradeAssignments(s).length === 0)

  return {
    activeStaff, inactiveStaff, distinctRoles,
    roleCounts, maxRoleCount,
    divisions, divisionStaffCounts, maxDivStaffCount,
    gradeCoverageEntries, maxGradeCoverage,
    unassignedStaff,
  }
}

// ─── Fundraising ──────────────────────────────────────────────────────────────

export function calcFundraisingReportStats(campaigns, donations, fundEvents) {
  const getCampaignRaised = (id) => donations.filter(d => d.campaign_id === id).reduce((s, d) => s + (d.amount || 0), 0)

  const totalRaised = donations.reduce((s, d) => s + (d.amount || 0), 0)
  const avgGift     = donations.length > 0 ? totalRaised / donations.length : 0

  const completedCampaigns = campaigns.filter(c => c.status === 'Completed')
  const hitGoal = completedCampaigns.filter(c => c.goal > 0 && getCampaignRaised(c.id) >= c.goal)
  const completedWithGoal = completedCampaigns.filter(c => c.goal > 0)
  const goalHitRate = completedWithGoal.length > 0
    ? Math.round((hitGoal.length / completedWithGoal.length) * 100)
    : null

  // 12-month donation trend
  const months12 = getLastNMonths(12)
  const donationMonthTotals = groupByMonth(donations, d => d.date, months12, d => d.amount || 0)
  const maxDonationMonth = Math.max(...donationMonthTotals.map(m => m.count), 1)

  // Raised by campaign type
  const typeRaised = {}
  campaigns.forEach(c => { typeRaised[c.type] = (typeRaised[c.type] || 0) + getCampaignRaised(c.id) })
  const typeEntries = Object.entries(typeRaised).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const maxTypeRaised = typeEntries.length > 0 ? typeEntries[0][1] : 1

  // Campaign scoreboard
  const scoreboard = campaigns.map(c => {
    const raised = getCampaignRaised(c.id)
    const pct = c.goal > 0 ? Math.round((raised / c.goal) * 100) : null
    return { ...c, raised, pct }
  }).sort((a, b) => {
    if (a.pct === null && b.pct === null) return b.raised - a.raised
    if (a.pct === null) return 1
    if (b.pct === null) return -1
    return b.pct - a.pct
  })

  // Event ROI
  const eventROI = fundEvents.map(ev => {
    const gross = (ev.ticket_price || 0) * (ev.tickets_sold || 0) + (ev.sponsorship_revenue || 0)
    const net   = gross - (ev.expenses || 0)
    return { ...ev, gross, net }
  }).sort((a, b) => b.net - a.net)

  return {
    totalRaised, avgGift, goalHitRate,
    completedCampaigns, hitGoal, completedWithGoal,
    donationMonthTotals, maxDonationMonth,
    typeEntries, maxTypeRaised,
    scoreboard, eventROI,
    getCampaignRaised,
  }
}

// ─── Facilities ───────────────────────────────────────────────────────────────

export function calcFacilitiesReportStats(workOrders, months) {
  const todayStr     = new Date().toISOString().split('T')[0]
  const thisMonthStr = thisMonth()

  const openWOs            = workOrders.filter(w => w.status === 'Open')
  const inProgressWOs      = workOrders.filter(w => w.status === 'In Progress')
  const overdueWOs         = workOrders.filter(w => isOverdue(w))
  const completedThisMonth = workOrders.filter(w => w.status === 'Completed' && w.completed_date?.startsWith(thisMonthStr))

  // Avg resolution time in days
  const resolved = workOrders.filter(w => w.status === 'Completed' && w.completed_date && w.created_at)
  const avgDays = resolved.length > 0
    ? Math.round(resolved.reduce((sum, w) => {
        const diff = new Date(w.completed_date) - new Date(w.created_at)
        return sum + diff / (1000 * 60 * 60 * 24)
      }, 0) / resolved.length)
    : null

  // By category
  const catCounts = WO_CATEGORIES.map((cat, i) => ({
    label: cat, count: workOrders.filter(w => w.category === cat).length, color: WO_CATEGORY_COLORS[i],
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  const maxCatCount = Math.max(...catCounts.map(c => c.count), 1)

  // By priority (active only)
  const priorityCounts = ['Urgent', 'High', 'Medium', 'Low'].map(p => ({
    label: p,
    count: workOrders.filter(w => w.priority === p && !['Completed', 'Cancelled'].includes(w.status)).length,
    color: WO_PRIORITY_COLORS[p],
  }))
  const maxPriCount = Math.max(...priorityCounts.map(p => p.count), 1)

  // By status
  const statusCounts = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map(s => ({
    label: s, count: workOrders.filter(w => w.status === s).length, color: WO_STATUS_COLORS[s],
  })).filter(s => s.count > 0)

  // Trend
  const woMonthCounts = groupByMonth(workOrders, w => w.created_at, months)
  const maxWoMonth    = Math.max(...woMonthCounts.map(m => m.count), 1)

  // Cost by category
  const costByCat = WO_CATEGORIES.map((cat, i) => {
    const wos    = workOrders.filter(w => w.category === cat && (w.estimated_cost || w.actual_cost))
    const est    = wos.reduce((s, w) => s + (w.estimated_cost || 0), 0)
    const actual = wos.reduce((s, w) => s + (w.actual_cost || 0), 0)
    return { cat, est, actual, color: WO_CATEGORY_COLORS[i] }
  }).filter(c => c.est > 0 || c.actual > 0)
  const totalEst    = costByCat.reduce((s, c) => s + c.est, 0)
  const totalActual = costByCat.reduce((s, c) => s + c.actual, 0)

  // Assignee workload
  const assigneeCounts = {}
  workOrders.filter(w => w.assigned_to && !['Completed', 'Cancelled'].includes(w.status))
    .forEach(w => { assigneeCounts[w.assigned_to] = (assigneeCounts[w.assigned_to] || 0) + 1 })
  const workloadEntries = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1])
  const maxWorkload     = workloadEntries.length > 0 ? workloadEntries[0][1] : 1

  return {
    openWOs, inProgressWOs, overdueWOs, completedThisMonth, avgDays,
    catCounts, maxCatCount,
    priorityCounts, maxPriCount,
    statusCounts,
    woMonthCounts, maxWoMonth,
    costByCat, totalEst, totalActual,
    workloadEntries, maxWorkload,
  }
}
