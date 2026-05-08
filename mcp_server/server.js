import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { supabaseAdmin, schoolId } from './supabase_admin.js'

// Services
import { getStudents as getEnrollmentStudents, searchParents, enrollStudent, updateStudentStatus, getAcademicYear } from '../src/services/enrollment.js'
import { getStudentsWithAttendance, saveAttendance, getAttendanceHistory } from '../src/services/attendance.js'
import { getStudents, updateStudent, deleteStudent, graduateStudentToAlumni, getGradeHistory, getIncidents, logIncident, updateIncident, resolveIncident } from '../src/services/students.js'
import { getInquiries, createInquiry, updateInquiry, convertInquiryToStudent } from '../src/services/admissions.js'
import { getReportCards, getEnrolledStudents, createReportCard, setReportCardPublished, deleteReportCard } from '../src/services/reportCards.js'
import { getStaff, createStaffMember, updateStaffMember, deleteStaffMember } from '../src/services/staff.js'
import { getWorkOrders, createWorkOrder, updateWorkOrder, updateWorkOrderStatus } from '../src/services/facilities.js'

const server = new McpServer({
  name: 'lunchbox',
  version: '1.0.0',
})

// Normalize Supabase error objects into proper Error instances so MCP surfaces readable messages
function normErr(err) {
  if (err instanceof Error) return err
  const msg = err?.message || err?.error_description || err?.details || JSON.stringify(err)
  return new Error(msg)
}

function ok(text) {
  return { content: [{ type: 'text', text: String(text) }] }
}

function okJson(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

server.tool(
  'get_students',
  'Get all enrolled students for the school.',
  {},
  async () => {
    const data = await getEnrollmentStudents(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'search_parents',
  'Search parents by name or email.',
  { query: z.string().describe('Name or email fragment to search') },
  async ({ query }) => {
    const data = await searchParents(supabaseAdmin, schoolId, query)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'enroll_student',
  'Enroll a new student. Provide either parentId for an existing parent, or parentData to create a new one.',
  {
    parentId: z.string().uuid().optional().describe('UUID of existing parent'),
    parentData: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }).optional().describe('New parent to create if no parentId'),
    studentData: z.object({
      first_name: z.string(),
      last_name: z.string(),
      grade: z.string().optional(),
      date_of_birth: z.string().optional().describe('YYYY-MM-DD'),
      status: z.enum(['Applied', 'Enrolled', 'Waitlisted']).optional(),
      notes: z.string().optional(),
    }),
  },
  async (args) => {
    const student = await enrollStudent(supabaseAdmin, schoolId, args)
    return { content: [{ type: 'text', text: JSON.stringify(student) }] }
  }
)

server.tool(
  'update_student_status',
  'Update a student\'s enrollment status.',
  {
    studentId: z.string().uuid(),
    status: z.enum(['Applied', 'Enrolled', 'Waitlisted']),
  },
  async ({ studentId, status }) => {
    await updateStudentStatus(supabaseAdmin, studentId, status)
    return { content: [{ type: 'text', text: `Status updated to ${status}` }] }
  }
)

// ─── Attendance ───────────────────────────────────────────────────────────────

server.tool(
  'get_attendance',
  'Get students with their attendance status for a given date, optionally filtered by grade.',
  {
    date: z.string().describe('YYYY-MM-DD'),
    grade: z.string().optional().describe('Filter by grade, e.g. "3rd Grade"'),
  },
  async ({ date, grade }) => {
    const data = await getStudentsWithAttendance(supabaseAdmin, schoolId, { date, grade })
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'save_attendance',
  'Save attendance records for a list of students on a given date.',
  {
    date: z.string().describe('YYYY-MM-DD'),
    records: z.array(z.object({
      studentId: z.string().uuid(),
      studentName: z.string(),
      studentGrade: z.string(),
      status: z.enum(['Present', 'Absent', 'Tardy', 'Excused']),
      notes: z.string().optional(),
    })),
  },
  async ({ date, records }) => {
    const students = records.map(r => ({ id: r.studentId, first_name: '', last_name: '', grade: r.studentGrade }))
    const attendanceMap = Object.fromEntries(
      records.map(r => [r.studentId, { status: r.status, notes: r.notes || '' }])
    )
    await saveAttendance(supabaseAdmin, schoolId, { students, attendanceMap, date })
    return { content: [{ type: 'text', text: `Attendance saved for ${records.length} students on ${date}` }] }
  }
)

server.tool(
  'get_attendance_history',
  'Query attendance history with optional date, grade, and status filters.',
  {
    date: z.string().optional().describe('YYYY-MM-DD'),
    grade: z.string().optional(),
    status: z.string().optional().describe('Present, Absent, Tardy, or Excused'),
  },
  async ({ date, grade, status }) => {
    const data = await getAttendanceHistory(supabaseAdmin, schoolId, { date, grade, status })
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

// ─── Students ─────────────────────────────────────────────────────────────────

server.tool(
  'get_students_full',
  'Get full student roster with parent join.',
  {},
  async () => {
    const data = await getStudents(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'delete_student',
  'Permanently delete a student record.',
  { studentId: z.string().uuid() },
  async ({ studentId }) => {
    await deleteStudent(supabaseAdmin, studentId)
    return { content: [{ type: 'text', text: 'Student deleted.' }] }
  }
)

server.tool(
  'graduate_student_to_alumni',
  'Graduate a student, moving them to the alumni table.',
  {
    studentId: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    grade: z.string(),
    graduationYear: z.number().int(),
    gradeCompleted: z.string(),
  },
  async ({ studentId, firstName, lastName, grade, graduationYear, gradeCompleted }) => {
    await graduateStudentToAlumni(supabaseAdmin, schoolId, { id: studentId, first_name: firstName, last_name: lastName, grade }, { graduationYear, gradeCompleted })
    return { content: [{ type: 'text', text: `${firstName} ${lastName} graduated to alumni.` }] }
  }
)

server.tool(
  'get_grade_history',
  'Get grade progression history for a student.',
  { studentId: z.string().uuid() },
  async ({ studentId }) => {
    const data = await getGradeHistory(supabaseAdmin, studentId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

// ─── Incidents ────────────────────────────────────────────────────────────────

server.tool(
  'get_incidents',
  'Get all incidents for a student.',
  { studentId: z.string().uuid() },
  async ({ studentId }) => {
    const data = await getIncidents(supabaseAdmin, studentId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'log_incident',
  'Log a new incident for a student.',
  {
    studentId: z.string().uuid(),
    studentName: z.string(),
    type: z.string().describe('Behavioral, Academic, Medical, Safety, Other'),
    description: z.string(),
    reported_by: z.string().optional(),
    resolution: z.string().optional().describe('Action taken or resolution notes'),
    status: z.enum(['Open', 'Resolved']).optional(),
  },
  async ({ studentId, studentName, type, description, reported_by, resolution, status }) => {
    await logIncident(supabaseAdmin, schoolId, { studentId, studentName, type, description, reported_by, resolution, status })
    return { content: [{ type: 'text', text: 'Incident logged.' }] }
  }
)

server.tool(
  'resolve_incident',
  'Mark an incident as resolved.',
  { incidentId: z.string().uuid() },
  async ({ incidentId }) => {
    await resolveIncident(supabaseAdmin, incidentId)
    return { content: [{ type: 'text', text: 'Incident resolved.' }] }
  }
)

// ─── Admissions ───────────────────────────────────────────────────────────────

server.tool(
  'get_inquiries',
  'Get all admissions inquiries.',
  {},
  async () => {
    const data = await getInquiries(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'create_inquiry',
  'Create a new admissions inquiry.',
  {
    parent_first_name: z.string(),
    parent_last_name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    student_first_name: z.string(),
    student_last_name: z.string(),
    grade_applying_for: z.string().optional(),
    source: z.string().optional().describe('Web, Tour, Referral, Word of Mouth, Social Media, Other'),
    notes: z.string().optional(),
  },
  async (form) => {
    await createInquiry(supabaseAdmin, schoolId, form)
    return { content: [{ type: 'text', text: 'Inquiry created.' }] }
  }
)

server.tool(
  'convert_inquiry_to_student',
  'Convert an admissions inquiry into a parent + student record.',
  { inquiryId: z.string().uuid() },
  async ({ inquiryId }) => {
    const inquiries = await getInquiries(supabaseAdmin, schoolId)
    const inquiry = inquiries.find(i => i.id === inquiryId)
    if (!inquiry) throw new Error('Inquiry not found')
    await convertInquiryToStudent(supabaseAdmin, schoolId, inquiry)
    return { content: [{ type: 'text', text: 'Inquiry converted to student.' }] }
  }
)

// ─── Report Cards ─────────────────────────────────────────────────────────────

server.tool(
  'get_report_cards',
  'Get all report cards for the school.',
  {},
  async () => {
    const data = await getReportCards(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'create_report_card',
  'Create a new report card for a student.',
  {
    studentId: z.string().uuid(),
    studentName: z.string(),
    studentGrade: z.string(),
    academicYear: z.string().describe('e.g. 2025-2026'),
    term: z.string().describe('Q1–Q4, T1–T3, S1–S2, or Annual'),
    grades: z.array(z.object({
      subject: z.string(),
      grade: z.string(),
      comment: z.string().optional(),
    })),
    teacherNotes: z.string().optional(),
  },
  async ({ studentId, studentName, studentGrade, academicYear, term, grades, teacherNotes }) => {
    await createReportCard(supabaseAdmin, schoolId, {
      student_id: studentId,
      student_name: studentName,
      student_grade: studentGrade,
      academic_year: academicYear,
      term,
      grades,
      teacher_notes: teacherNotes || '',
      published: false,
    })
    return { content: [{ type: 'text', text: 'Report card created.' }] }
  }
)

server.tool(
  'set_report_card_published',
  'Publish or unpublish a report card.',
  {
    reportCardId: z.string().uuid(),
    published: z.boolean(),
  },
  async ({ reportCardId, published }) => {
    await setReportCardPublished(supabaseAdmin, reportCardId, published)
    return { content: [{ type: 'text', text: `Report card ${published ? 'published' : 'unpublished'}.` }] }
  }
)

server.tool(
  'delete_report_card',
  'Permanently delete a report card by ID.',
  { reportCardId: z.string().uuid() },
  async ({ reportCardId }) => {
    await deleteReportCard(supabaseAdmin, reportCardId)
    return { content: [{ type: 'text', text: 'Report card deleted.' }] }
  }
)

// ─── Staff ────────────────────────────────────────────────────────────────────

server.tool(
  'get_staff',
  'Get all staff members.',
  {},
  async () => {
    const data = await getStaff(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'create_staff_member',
  'Add a new staff member.',
  {
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string().describe('Principal, Teacher, Assistant Teacher, Substitute Teacher, Administrator, Counselor, Support Staff, Facilities, Maintenance'),
    grade_assignments: z.array(z.string()).optional(),
    hire_date: z.string().optional().describe('YYYY-MM-DD'),
    status: z.enum(['Active', 'Inactive']).optional(),
    notes: z.string().optional(),
  },
  async (form) => {
    await createStaffMember(supabaseAdmin, schoolId, form)
    return { content: [{ type: 'text', text: 'Staff member created.' }] }
  }
)

server.tool(
  'delete_staff_member',
  'Remove a staff member.',
  { staffId: z.string().uuid() },
  async ({ staffId }) => {
    await deleteStaffMember(supabaseAdmin, staffId)
    return { content: [{ type: 'text', text: 'Staff member deleted.' }] }
  }
)

// ─── Facilities ───────────────────────────────────────────────────────────────

server.tool(
  'get_work_orders',
  'Get all work orders.',
  {},
  async () => {
    const data = await getWorkOrders(supabaseAdmin, schoolId)
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }
)

server.tool(
  'create_work_order',
  'Create a new facilities work order.',
  {
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional().describe('Plumbing, Electrical, HVAC, Carpentry, Grounds, Custodial, Safety, Technology, Other'),
    location: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    status: z.enum(['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional(),
    submitted_by: z.string().optional(),
    assigned_to: z.string().optional(),
    due_date: z.string().optional().describe('YYYY-MM-DD'),
    estimated_cost: z.number().optional(),
  },
  async (form) => {
    await createWorkOrder(supabaseAdmin, schoolId, form)
    return { content: [{ type: 'text', text: 'Work order created.' }] }
  }
)

server.tool(
  'update_work_order_status',
  'Quick-update the status of a work order.',
  {
    workOrderId: z.string().uuid(),
    status: z.enum(['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled']),
  },
  async ({ workOrderId, status }) => {
    const result = await updateWorkOrderStatus(supabaseAdmin, workOrderId, status)
    return { content: [{ type: 'text', text: JSON.stringify(result) }] }
  }
)

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
