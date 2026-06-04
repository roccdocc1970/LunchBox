/**
 * StaffDashboard Domain
 *
 * Pure business logic for the Staff Portal module.
 * No React. No Supabase. Input → output only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const INCIDENT_TYPES = ['Behavioral', 'Academic', 'Attendance', 'Safety', 'Other']

export const INCIDENT_TYPE_COLORS = {
  Behavioral: '#ef4444',
  Academic:   '#f59e0b',
  Attendance: '#3b82f6',
  Safety:     '#8b5cf6',
  Other:      '#6b7280',
}

export const WO_CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Grounds',
  'Custodial', 'Safety', 'Technology', 'Other',
]

export const WO_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export const WO_PRIORITY_COLORS = {
  Low: '#10b981', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444',
}

export const WO_STATUS_COLORS = {
  Open: '#3b82f6', 'In Progress': '#f59e0b', 'On Hold': '#6b7280',
  Completed: '#10b981', Cancelled: '#9ca3af',
}

export const CATEGORY_ICONS = {
  Plumbing: 'Droplets', Electrical: 'Zap', HVAC: 'Wind', Carpentry: 'Hammer',
  Grounds: 'Leaf', Custodial: 'Brush', Safety: 'Shield', Technology: 'Monitor', Other: 'Wrench',
}

export const STATUS_COLORS = { Enrolled: '#10b981', Applied: '#3b82f6', Waitlisted: '#f59e0b' }

export const BLANK_WO_FORM = { title: '', category: 'Other', priority: 'Medium', location: '', description: '' }

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const isTeacherRole       = (role) => ['Teacher', 'Assistant Teacher', 'Substitute Teacher'].includes(role)
export const isPrincipalAdminRole = (role) => ['Principal', 'Administrator'].includes(role)
export const isCounselorRole     = (role) => role === 'Counselor'
export const canViewFullHealth   = (role) => isPrincipalAdminRole(role) || isCounselorRole(role)
export const canViewLimitedHealth = (role) => isTeacherRole(role)

// ─── Nav ─────────────────────────────────────────────────────────────────────

export function getNavItems(role) {
  return [
    { id: 'students',    label: isTeacherRole(role) ? 'My Students' : 'Students', icon: 'Users' },
    ...(isTeacherRole(role) || isPrincipalAdminRole(role) ? [{ id: 'attendance',  label: 'Attendance',       icon: 'ClipboardCheck' }] : []),
    ...(isTeacherRole(role) || isPrincipalAdminRole(role) ? [{ id: 'reportcards', label: 'Report Cards',     icon: 'FileText' }] : []),
    { id: 'incidents',   label: 'Student Incidents', icon: 'AlertTriangle' },
    { id: 'facilities',  label: 'Facilities',        icon: 'Wrench' },
    ...(isPrincipalAdminRole(role) ? [{ id: 'staffdir', label: 'Staff', icon: 'Briefcase' }] : []),
  ]
}

// ─── Blank forms ──────────────────────────────────────────────────────────────

export function buildBlankIncident(staffMember) {
  return {
    date:        new Date().toISOString().split('T')[0],
    type:        'Behavioral',
    description: '',
    resolution:  '',
    reported_by: `${staffMember.first_name} ${staffMember.last_name}`,
    status:      'Open',
  }
}

export function buildNewCardForm(student, subjects, term, academicYear) {
  return {
    student_id:    student.id,
    student_name:  `${student.first_name} ${student.last_name}`,
    student_grade: student.grade || '',
    academic_year: academicYear,
    term,
    grades:        subjects.map(s => ({ subject: s, grade: '', comment: '' })),
    teacher_notes: '',
    published:     false,
  }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export function filterStudents(students, search) {
  if (!search) return students
  const q = search.toLowerCase()
  return students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
    (s.grade || '').toLowerCase().includes(q)
  )
}

export function filterIncidents(incidents, filter) {
  return filter === 'All' ? incidents : incidents.filter(i => i.status === filter)
}

export function filterCards(cards, search) {
  if (!search) return cards
  return cards.filter(c => c.student_name?.toLowerCase().includes(search.toLowerCase()))
}

export function filterWorkOrders(workOrders, filter) {
  return filter === 'All' ? workOrders : workOrders.filter(w => w.status === filter)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function calcIncidentStats(incidents) {
  return {
    total:    incidents.length,
    open:     incidents.filter(i => i.status === 'Open').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
  }
}
