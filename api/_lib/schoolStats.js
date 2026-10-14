/**
 * Code-computed school statistics for the chat agent (roadmap Step 9 / ID 8).
 *
 * The model must never count, filter or add up rows itself — it miscounts (a cohort count came out
 * 32 instead of 33). The app's screens already compute these numbers with pure functions in
 * `src/domain/` (calcStudentStats, calcFacilitiesStats, ...). This module hands the SAME functions
 * to the chat: fetch rows with the existing service (caller's own RLS-scoped client), compute with the
 * existing domain function, return finished numbers for the model to present.
 *
 * Two halves, kept apart so the numbers can be tested offline without a database:
 *   computeStats(topic, rows, filters) — pure; no I/O
 *   getSchoolStats(supabase, schoolId, input, ctx) — fetch + role check + computeStats
 */

import { getStudents, getSchoolIncidents } from '../../src/services/students.js'
import { getInquiries } from '../../src/services/admissions.js'
import { getStaff } from '../../src/services/staff.js'
import { getWorkOrders } from '../../src/services/facilities.js'
import { getReportCards } from '../../src/services/reportCards.js'
import { getAlumni } from '../../src/services/alumni.js'
import { getClasses } from '../../src/services/classes.js'
import { getRooms } from '../../src/services/rooms.js'
import { getFundraisingData } from '../../src/services/fundraising.js'
import { calcStudentStats, filterStudents } from '../../src/domain/students.js'
import { calcPipelineCounts, calcSourceCounts } from '../../src/domain/admissions.js'
import { calcStaffStats } from '../../src/domain/staff.js'
import { calcFacilitiesStats, filterWorkOrders } from '../../src/domain/facilities.js'
import { calcIncidentStats, isPrincipalAdminRole } from '../../src/domain/staffDashboard.js'
import { calcReportCardStats } from '../../src/domain/reportCards.js'
import { calcAlumniStats } from '../../src/domain/alumni.js'
import { calcClassStats } from '../../src/domain/classes.js'
import { calcRoomStats } from '../../src/domain/rooms.js'
import { calcFundraisingStats } from '../../src/domain/fundraising.js'

// PostgREST returns at most 1000 rows per query by default; a count over a capped list is silently wrong.
export const ROW_CAP = 1000

const filterIncidents = (rows, { status, type }) =>
  rows.filter(i => (!status || i.status === status) && (!type || i.type === type))

/**
 * topic → how to fetch, which filters it honours (reusing the screens' own filter functions where they
 * exist), and which domain calculator computes the numbers. `filter` is only called with filters the
 * topic supports; empty ones are left out.
 */
export const STAT_TOPICS = {
  students: {
    about: 'Current roster (Applied, Enrolled, Waitlisted): totals by status. Filters: grade, status.',
    filters: ['grade', 'status'],
    fetch: (sb, id) => getStudents(sb, id),
    filter: (rows, f) => filterStudents(rows, { filterGrade: f.grade || '', filterStatus: f.status || '' }),
    stats: calcStudentStats,
  },
  admissions: {
    about: 'Admissions pipeline (New Inquiry, Toured, Withdrawn): counts by stage and by source.',
    filters: [],
    fetch: (sb, id) => getInquiries(sb, id),
    stats: rows => ({ pipeline: calcPipelineCounts(rows), sources: calcSourceCounts(rows) }),
  },
  staff: {
    about: 'Staff directory: total, active, inactive.',
    filters: [],
    fetch: (sb, id) => getStaff(sb, id),
    stats: calcStaffStats,
  },
  facilities: {
    about: 'Work orders: open, in progress, urgent (unfinished), completed this month. Filters: status, priority, category.',
    filters: ['status', 'priority', 'category'],
    fetch: (sb, id) => getWorkOrders(sb, id),
    // filterWorkOrders treats "no filter" as the text 'All'; undefined would match nothing.
    filter: (rows, f) => filterWorkOrders(rows, {
      search: '', filterStatus: f.status || 'All', filterCategory: f.category || 'All', filterPriority: f.priority || 'All',
    }),
    stats: calcFacilitiesStats,
  },
  incidents: {
    about: 'School-wide incidents: total, open, resolved. Filters: status (Open/Resolved), type (Behavioral, Academic, Medical, Safety, Other). There is no severity field.',
    filters: ['status', 'type'],
    fetch: (sb, id) => getSchoolIncidents(sb, id),
    filter: filterIncidents,
    stats: calcIncidentStats,
  },
  report_cards: {
    about: 'Report cards: total, published, draft.',
    filters: [],
    fetch: (sb, id) => getReportCards(sb, id),
    stats: calcReportCardStats,
  },
  alumni: {
    about: 'Alumni: total, active donors, prospects, opted in.',
    filters: [],
    fetch: (sb, id) => getAlumni(sb, id),
    stats: calcAlumniStats,
  },
  classes: {
    about: 'Classes: total, active, inactive, counts by division and by subject.',
    filters: [],
    fetch: (sb, id) => getClasses(sb, id),
    stats: calcClassStats,
  },
  rooms: {
    about: 'Rooms: total, total capacity, counts by room type.',
    filters: [],
    fetch: (sb, id) => getRooms(sb, id),
    stats: calcRoomStats,
  },
  fundraising: {
    about: 'Fundraising: total raised, active campaigns, unique donors, event count.',
    filters: [],
    // getFundraisingData returns several lists; the calculator takes them separately.
    fetch: (sb, id) => getFundraisingData(sb, id),
    stats: data => calcFundraisingStats(data.campaigns, data.donations, data.events),
    rowCount: data => data.campaigns.length + data.donations.length + data.events.length,
  },
}

export const TOPIC_NAMES = Object.keys(STAT_TOPICS)

// Topics each staff role may ask about. RLS hides some tables from staff entirely (they would read as a
// misleading "0"), so staff are limited to the areas their own screens show.
const STAFF_TOPICS = ['students', 'incidents', 'report_cards', 'facilities', 'classes', 'rooms']
export function mayViewTopic(topic, { isStaff = false, role = null } = {}) {
  if (!isStaff) return true // school admin: everything
  if (STAFF_TOPICS.includes(topic)) return true
  return topic === 'staff' && isPrincipalAdminRole(role)
}

/**
 * Pure: numbers from rows already in hand. Unsupported filters are reported, never silently dropped —
 * a total that ignored the asked-for filter would be a confident wrong answer.
 */
export function computeStats(topicName, rows, requested = {}) {
  const topic = STAT_TOPICS[topicName]
  if (!topic) throw new Error(`Unknown topic "${topicName}"`)
  const given = Object.fromEntries(Object.entries(requested).filter(([k, v]) => k !== 'topic' && v !== undefined && v !== null && v !== ''))
  const applied = Object.fromEntries(Object.entries(given).filter(([k]) => topic.filters.includes(k)))
  const ignored = Object.keys(given).filter(k => !topic.filters.includes(k))

  const matching = topic.filter && Object.keys(applied).length ? topic.filter(rows, applied) : rows
  const out = {
    topic: topicName,
    filters_applied: applied,
    rows_read: topic.rowCount ? topic.rowCount(rows) : rows.length,
    stats: topic.stats(matching),
  }
  if (topic.filter && Object.keys(applied).length) out.matching = matching.length
  if (ignored.length) {
    out.ignored_filters = ignored
    out.note = `This topic cannot filter by ${ignored.join(', ')}; the numbers cover all records. ` +
      `Supported filters: ${topic.filters.length ? topic.filters.join(', ') : 'none'}. Say so rather than estimating.`
  }
  if (out.rows_read >= ROW_CAP) {
    out.warning = `At least ${ROW_CAP} records were read; the database may have capped the list, so these numbers could be too low.`
  }
  return out
}

export async function getSchoolStats(supabase, schoolId, input = {}, ctx = {}) {
  if (!STAT_TOPICS[input.topic]) {
    return { error: `Unknown topic "${input.topic}"`, topics: TOPIC_NAMES }
  }
  if (!mayViewTopic(input.topic, ctx)) {
    return { access: 'none', message: 'This role does not have permission to view these statistics.' }
  }
  const rows = await STAT_TOPICS[input.topic].fetch(supabase, schoolId)
  return computeStats(input.topic, rows, input)
}
