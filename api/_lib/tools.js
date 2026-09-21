/**
 * Tool definitions for the chat backend, split by risk — mirrors
 * mcp_server/server.js's server.tool(name, description, schema, handler)
 * pattern, but stateless per-request (schoolId comes from the caller's own
 * session, not a hardcoded .env value) and split into three kinds:
 *
 * - READ_TOOLS: executed immediately, result fed back to the model. Never
 *   mutate anything.
 * - WRITE_TOOLS: NEVER auto-executed by the chat loop. A call to one of
 *   these stops the loop and returns a pending-action payload for the
 *   frontend to render as a ConfirmAction card; `run()` is only invoked by
 *   /api/chat/execute.js after the human clicks Confirm.
 * - NAVIGATE_TOOLS: no `run()` at all — calling one stops the loop and
 *   tells the frontend to deep-link into the real screen instead of
 *   attempting anything conversationally. Used for scheduling/cohort/class
 *   changes, which are too risky to guess at in natural language.
 */

import { getGradeHistory, getIncidents, getStudentHealth, logIncident } from '../../src/services/students.js'
import { getStudents as getEnrollmentStudents, updateStudentStatus } from '../../src/services/enrollment.js'
import { getAttendanceHistory } from '../../src/services/attendance.js'
import { getReportCardsForStudent } from '../../src/services/reportCards.js'
import { getCohorts, getCohortsForStudent } from '../../src/services/cohorts.js'
import { getClasses } from '../../src/services/classes.js'
import { getClassEnrollmentsForStudent } from '../../src/services/classEnrollments.js'
import { getAlumni } from '../../src/services/alumni.js'
import { getInquiries } from '../../src/services/admissions.js'
import { getStudentTimelineData } from '../../src/services/timeline.js'
import { buildStudentTimeline } from '../../src/domain/timeline.js'
import { getWorkOrders } from '../../src/services/facilities.js'
import { getStaff } from '../../src/services/staff.js'
import { getRooms } from '../../src/services/rooms.js'
import { getBuildings } from '../../src/services/buildings.js'
import { getMessages } from '../../src/services/messages.js'
import { getParents } from '../../src/services/parents.js'
import { getFundraisingData } from '../../src/services/fundraising.js'
import { canViewFullHealth, canViewLimitedHealth } from '../../src/domain/staffDashboard.js'

export const READ_TOOLS = [
  {
    name: 'get_students',
    description: 'Get the active student roster (Applied, Enrolled, Waitlisted) for this school, with parent contact info. Use this first to look up a student\'s id by name.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getEnrollmentStudents(supabase, schoolId),
  },
  {
    name: 'get_incidents',
    description: 'Get all logged incidents for one student.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }) => getIncidents(supabase, studentId),
  },
  {
    name: 'get_attendance_history',
    description: 'Get attendance records, optionally filtered to one student.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        grade: { type: 'string' },
        status: { type: 'string', enum: ['Present', 'Absent', 'Tardy', 'Excused'] },
      },
    },
    run: async (supabase, schoolId, input) => getAttendanceHistory(supabase, schoolId, input),
  },
  {
    name: 'get_grade_history',
    description: 'Get one student\'s grade progression history across years.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }) => getGradeHistory(supabase, studentId),
  },
  {
    name: 'get_student_health',
    description: 'Get one student\'s health profile and health entries (allergies, medications, etc). Access is role-gated — some callers only see emergency contact + allergies, or nothing.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }, ctx = {}) => {
      // Admins (isStaff: false) always get full access, matching every
      // other admin-only table. Staff are gated by role exactly like
      // StaffDashboard.jsx's canViewFullHealth/canViewLimitedHealth —
      // RLS alone grants ALL staff full DB access to this table, so this
      // tool is the only place that boundary is actually enforced.
      if (ctx.isStaff && !canViewFullHealth(ctx.role) && !canViewLimitedHealth(ctx.role)) {
        return { access: 'none', message: 'This role does not have permission to view health records.' }
      }
      const { profile, entries } = await getStudentHealth(supabase, studentId)
      if (!ctx.isStaff || canViewFullHealth(ctx.role)) return { access: 'full', profile, entries }
      return {
        access: 'limited',
        profile: profile ? {
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          emergency_contact_relationship: profile.emergency_contact_relationship,
        } : null,
        entries: entries.filter(e => e.category === 'Allergy'),
      }
    },
  },
  {
    name: 'get_report_cards_for_student',
    description: 'Get one student\'s report cards.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }) => getReportCardsForStudent(supabase, studentId),
  },
  {
    name: 'get_student_evolution',
    description: 'Get one student\'s FULL lifecycle timeline in one call — grade progression, cohort membership and changes, electives, report card/incident/attendance counts per year, and lifecycle bookends (inquiry date, graduation). Prefer this over the individual per-topic tools when the question is broad (e.g. "tell me about Marcus" or "how has this student done over time").',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, schoolId, { studentId }) => {
      const { data: row, error } = await supabase
        .from('students')
        .select('*, student_alumni_details(*)')
        .eq('id', studentId)
        .single()
      if (error) throw error
      const { student_alumni_details, ...student } = row
      const flattened = { ...student, ...(student_alumni_details || {}) }
      const data = await getStudentTimelineData(supabase, schoolId, flattened)
      return buildStudentTimeline({ student: flattened, ...data })
    },
  },
  {
    name: 'get_alumni',
    description: 'Get all alumni (graduated students) for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getAlumni(supabase, schoolId),
  },
  {
    name: 'get_inquiries',
    description: 'Get the admissions pipeline (prospective families who haven\'t enrolled yet).',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getInquiries(supabase, schoolId),
  },
  {
    name: 'get_classes',
    description: 'Get all classes for this school (id, name, subject, teacher, etc). Use this to resolve a class name to its id before calling navigate_to_class.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getClasses(supabase, schoolId),
  },
  {
    name: 'get_cohorts',
    description: 'Get all cohorts for this school (id, name, academic_year, etc). Use this to resolve a cohort name to its id before calling navigate_to_cohort.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getCohorts(supabase, schoolId),
  },
  {
    name: 'get_class_enrollments_for_student',
    description: 'Get one student\'s class/elective enrollment history.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }) => getClassEnrollmentsForStudent(supabase, studentId),
  },
  {
    name: 'get_cohorts_for_student',
    description: 'Get one student\'s cohort membership history.',
    input_schema: { type: 'object', properties: { studentId: { type: 'string' } }, required: ['studentId'] },
    run: async (supabase, _schoolId, { studentId }) => getCohortsForStudent(supabase, studentId),
  },
  {
    name: 'get_work_orders',
    description: 'Get all facilities/maintenance work orders (tickets) for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getWorkOrders(supabase, schoolId),
  },
  {
    name: 'get_staff',
    description: 'Get the staff directory for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getStaff(supabase, schoolId),
  },
  {
    name: 'get_rooms',
    description: 'Get all rooms/classrooms for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getRooms(supabase, schoolId),
  },
  {
    name: 'get_buildings',
    description: 'Get all buildings for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getBuildings(supabase, schoolId),
  },
  {
    name: 'get_messages',
    description: 'Get past parent-communication messages sent by this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getMessages(supabase, schoolId),
  },
  {
    name: 'get_parents',
    description: 'Get the parent/guardian directory for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getParents(supabase, schoolId),
  },
  {
    name: 'get_fundraising_data',
    description: 'Get fundraising campaigns, donations, events, and alumni donor prospects for this school.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => getFundraisingData(supabase, schoolId),
  },
  {
    name: 'get_school_settings',
    description: 'Get this school\'s configuration — profile, grading scale/period, subjects offered, divisions, grades offered, branding. Read-only: settings CHANGES are never made via chat, always via navigate_to_page("settings") instead.',
    input_schema: { type: 'object', properties: {} },
    run: async (supabase, schoolId) => {
      const { data, error } = await supabase.from('schools').select('*').eq('user_id', schoolId).single()
      if (error) throw error
      return data
    },
  },
]

export const RENDER_VIEW_TOOL = {
  name: 'render_view',
  description: 'Call this LAST, once you have the data, to give your final answer. Always call this rather than just replying in plain text when the answer is a list, a set of counts, or a chronological history — reply-only text is fine for a single fact or a short explanation.',
  input_schema: {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'A short sentence of accompanying prose.' },
      template: { type: 'string', enum: ['table', 'stat_row', 'chip_list', 'mini_timeline', 'none'] },
      data: {
        type: 'object',
        description: 'table: {columns:[string], rows:[[...]]}. stat_row: {items:[{value,label,color?}]}. chip_list: {items:[{label,icon?}]}. mini_timeline: {rows:[{label,sublabel?}]}. Omit or use template "none" for plain prose only.',
      },
    },
    required: ['reply', 'template'],
  },
}

export const WRITE_TOOLS = [
  {
    name: 'update_student_status',
    description: 'Propose changing a student\'s enrollment status (Applied, Enrolled, Waitlisted). Requires human confirmation before it takes effect.',
    input_schema: {
      type: 'object',
      properties: { studentId: { type: 'string' }, status: { type: 'string', enum: ['Applied', 'Enrolled', 'Waitlisted'] } },
      required: ['studentId', 'status'],
    },
    run: async (supabase, _schoolId, { studentId, status }) => updateStudentStatus(supabase, studentId, status),
  },
  {
    name: 'log_incident',
    description: 'Propose logging a new incident for a student. Requires human confirmation before it takes effect.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        studentName: { type: 'string' },
        type: { type: 'string', enum: ['Behavioral', 'Academic', 'Attendance', 'Safety', 'Other'] },
        description: { type: 'string' },
      },
      required: ['studentId', 'studentName', 'type', 'description'],
    },
    run: async (supabase, schoolId, input) => logIncident(supabase, schoolId, input),
  },
]

export const NAVIGATE_TOOLS = [
  {
    name: 'navigate_to_cohort',
    description: 'Deep-link the user into the Cohorts screen with a specific cohort open. Use this instead of attempting any cohort assignment/change conversationally.',
    input_schema: { type: 'object', properties: { cohortId: { type: 'string' } }, required: ['cohortId'] },
  },
  {
    name: 'navigate_to_class',
    description: 'Deep-link the user into the Classes screen with a specific class open. Use this instead of attempting any class enrollment/capacity change conversationally.',
    input_schema: { type: 'object', properties: { classId: { type: 'string' } }, required: ['classId'] },
  },
  {
    name: 'navigate_to_scheduling',
    description: 'Deep-link the user into the Scheduling screen. Use this for anything involving moving a class to a different period/room/day — never attempt a schedule change conversationally.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'navigate_to_page',
    description: 'Deep-link the user to a general page (reportcards, attendance, fundraising, students, alumni, admissions, settings) for anything better looked at directly than described. Always use page="settings" for ANY request to change school configuration — profile, grading scale/period, subjects offered, divisions, grades offered, branding, bell schedule, buildings/rooms — never attempt a settings change conversationally, even a small one like a color change.',
    input_schema: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] },
  },
]

export function allToolSchemas() {
  return [
    ...READ_TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema })),
    ...WRITE_TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema })),
    ...NAVIGATE_TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema })),
    RENDER_VIEW_TOOL,
  ]
}
