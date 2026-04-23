import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUS_COLORS = {
  Enrolled: '#10b981',
  Applied: '#3b82f6',
  Waitlisted: '#f59e0b',
}

const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const INCIDENT_TYPES = ['Behavioral', 'Academic', 'Attendance', 'Safety', 'Other']
const INCIDENT_TYPE_COLORS = {
  Behavioral: '#ef4444',
  Academic: '#f59e0b',
  Attendance: '#3b82f6',
  Safety: '#8b5cf6',
  Other: '#6b7280',
}

const parseDivisions = (val) => {
  if (!val) return []
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(d) ? d : []
  } catch { return [] }
}

const STAFF_ROLES = ['Principal', 'Teacher', 'Assistant Teacher', 'Substitute Teacher', 'Administrator', 'Counselor', 'Support Staff', 'Facilities', 'Maintenance']
const ROLE_COLORS = {
  Principal: '#f97316', Teacher: '#3b82f6', 'Assistant Teacher': '#6366f1',
  'Substitute Teacher': '#14b8a6', Administrator: '#8b5cf6', Counselor: '#10b981', 'Support Staff': '#6b7280',
  Facilities: '#0ea5e9', Maintenance: '#84cc16',
}

const parseGradeAssignments = (member) => {
  if (member?.grade_assignments) {
    try {
      const a = typeof member.grade_assignments === 'string' ? JSON.parse(member.grade_assignments) : member.grade_assignments
      if (Array.isArray(a)) return a
    } catch {}
  }
  if (member?.grade_assignment) return [member.grade_assignment]
  return []
}

const CAMPAIGN_TYPE_COLORS = {
  'Annual Fund': '#3b82f6', 'Capital Campaign': '#8b5cf6', 'Event': '#f97316',
  'Emergency Appeal': '#ef4444', 'Grant': '#10b981', 'Scholarship': '#f59e0b', 'Other': '#6b7280',
}

const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const TABS = [
  { id: 'enrollment', label: 'Enrollment' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'incidents', label: 'Student Incidents' },
  { id: 'communications', label: 'Communications' },
  { id: 'staff', label: 'Staff' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'facilities', label: 'Facilities' },
]

const ATTENDANCE_STATUS_COLORS = { Present: '#10b981', Absent: '#ef4444', Tardy: '#f59e0b', Excused: '#6b7280' }

const WO_CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Grounds', 'Custodial', 'Safety', 'Technology', 'Other']
const WO_PRIORITY_COLORS = { Low: '#10b981', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' }
const WO_STATUS_COLORS = { Open: '#3b82f6', 'In Progress': '#f59e0b', 'On Hold': '#6b7280', Completed: '#10b981', Cancelled: '#9ca3af' }
const WO_CATEGORY_COLORS = ['#6366f1', '#f97316', '#14b8a6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#0ea5e9', '#6b7280']

export default function Reports({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const [students, setStudents] = useState([])
  const [messages, setMessages] = useState([])
  const [incidents, setIncidents] = useState([])
  const [staff, setStaff] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [donations, setDonations] = useState([])
  const [fundEvents, setFundEvents] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('enrollment')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: studs }, { data: msgs }, { data: incs }, { data: stf }, { data: camps }, { data: dons }, { data: fevs }, { data: wos }, { data: att }] = await Promise.all([
      supabase.from('students').select('*').eq('school_id', user.id).order('created_at', { ascending: true }),
      supabase.from('messages').select('*').eq('school_id', user.id).order('created_at', { ascending: true }),
      supabase.from('incidents').select('*').eq('school_id', user.id).order('date', { ascending: false }),
      supabase.from('staff').select('*').eq('school_id', user.id).order('last_name', { ascending: true }),
      supabase.from('campaigns').select('*').eq('school_id', user.id).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('school_id', user.id).order('date', { ascending: false }),
      supabase.from('fundraising_events').select('*').eq('school_id', user.id).order('date', { ascending: false }),
      supabase.from('work_orders').select('*').eq('school_id', user.id).order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').eq('school_id', user.id).order('date', { ascending: false }),
    ])
    if (studs) setStudents(studs)
    if (msgs) setMessages(msgs)
    if (incs) setIncidents(incs)
    if (stf) setStaff(stf)
    if (camps) setCampaigns(camps)
    if (dons) setDonations(dons)
    if (fevs) setFundEvents(fevs)
    if (wos) setWorkOrders(wos)
    if (att) setAttendanceRecords(att)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading reports...</div>

  // Shared: last 6 months
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })

  // --- Enrollment ---
  const total = students.length
  const enrolled = students.filter(s => s.status === 'Enrolled').length
  const applied = students.filter(s => s.status === 'Applied').length
  const waitlisted = students.filter(s => s.status === 'Waitlisted').length
  const capacity = school?.student_capacity || 0
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null

  const gradeCounts = {}
  students.forEach(s => { const g = s.grade || 'Unknown'; gradeCounts[g] = (gradeCounts[g] || 0) + 1 })
  const gradeEntries = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])
  const maxGradeCount = gradeEntries.length > 0 ? gradeEntries[0][1] : 1

  const enrollmentMonthCounts = months.map(m => ({
    ...m,
    count: students.filter(s => {
      const d = new Date(s.created_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).length,
  }))
  const maxEnrollmentMonth = Math.max(...enrollmentMonthCounts.map(m => m.count), 1)

  // --- Incidents ---
  const totalIncidents = incidents.length
  const openIncidents = incidents.filter(i => i.status === 'Open').length
  const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length
  const openIncidentsList = incidents.filter(i => i.status === 'Open')

  const incidentTypeCounts = INCIDENT_TYPES.map(type => ({
    type, count: incidents.filter(i => i.type === type).length,
  }))
  const maxTypeCount = Math.max(...incidentTypeCounts.map(t => t.count), 1)

  const incidentMonthCounts = months.map(m => ({
    ...m,
    count: incidents.filter(i => {
      if (!i.date) return false
      const d = new Date(i.date)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).length,
  }))
  const maxIncidentMonth = Math.max(...incidentMonthCounts.map(m => m.count), 1)

  // --- Communications ---
  const totalParentsReached = messages.reduce((sum, m) => sum + (m.recipient_count || 0), 0)
  const messageMonthCounts = months.map(m => ({
    ...m,
    count: messages.filter(msg => {
      const d = new Date(msg.created_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).length,
  }))
  const maxMessageMonth = Math.max(...messageMonthCounts.map(m => m.count), 1)

  // --- Staff ---
  const activeStaff = staff.filter(s => s.status === 'Active')
  const inactiveStaff = staff.filter(s => s.status === 'Inactive')
  const distinctRoles = [...new Set(activeStaff.map(s => s.role).filter(Boolean))].length

  const roleCounts = STAFF_ROLES.map(role => ({
    role, count: activeStaff.filter(s => s.role === role).length,
  })).filter(r => r.count > 0)
  const maxRoleCount = Math.max(...roleCounts.map(r => r.count), 1)

  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
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

  const card = (children, extra = {}) => (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...extra }}>
      {children}
    </div>
  )

  const cardTitle = (text) => (
    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.25rem' }}>{text}</h3>
  )

  const statCards = (stats) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>{s.value}</div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )

  const barChart = (data, maxVal, color, height = 140) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: `${height}px` }}>
      {data.map((m) => {
        const barH = m.count > 0 ? Math.max((m.count / maxVal) * 100, 8) : 0
        return (
          <div key={m.label + m.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>{m.count > 0 ? m.count : ''}</span>
            <div style={{ width: '100%', background: m.count > 0 ? color : '#f3f4f6', borderRadius: '0.375rem 0.375rem 0 0', height: `${barH}%`, minHeight: '4px', transition: 'height 0.4s' }} />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Reports</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>School activity and analytics</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.625rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? primaryColor : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              boxShadow: activeTab === tab.id ? `0 1px 3px ${primaryColor}40` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Enrollment Tab ── */}
      {activeTab === 'enrollment' && (
        <>
          {statCards([
            { label: 'Total Students', value: total, icon: '🎒', color: primaryColor },
            { label: 'Enrolled', value: enrolled, icon: '✅', color: '#10b981' },
            { label: 'Applied', value: applied, icon: '📋', color: '#3b82f6' },
            { label: 'Waitlisted', value: waitlisted, icon: '⏳', color: '#f59e0b' },
          ])}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {card(<>
              {cardTitle('Enrollment Status')}
              {total === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No students yet.</p> : (<>
                <div style={{ display: 'flex', height: '20px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                  {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                    const count = students.filter(s => s.status === status).length
                    const pct = total > 0 ? (count / total) * 100 : 0
                    return pct > 0 ? <div key={status} style={{ width: `${pct}%`, background: STATUS_COLORS[status] }} title={`${status}: ${count}`} /> : null
                  })}
                </div>
                {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                  const count = students.filter(s => s.status === status).length
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{count}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </>)}
            </>)}

            {card(<>
              {cardTitle('Capacity Utilization')}
              {capacityPct === null ? (
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>No capacity set. Add your student capacity in Settings.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>{enrolled}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>enrolled students</div>
                  </div>
                </div>
              ) : (<>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#10b981' }}>{capacityPct}%</span>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>full</span>
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{enrolled} / {capacity} seats</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${capacityPct}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.4s', background: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#10b981' }} />
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                  {capacity - enrolled} seat{capacity - enrolled !== 1 ? 's' : ''} remaining
                </p>
              </>)}
            </>)}
          </div>

          {card(<>
            {cardTitle('New Students — Last 6 Months')}
            {barChart(enrollmentMonthCounts, maxEnrollmentMonth, primaryColor)}
          </>, { marginBottom: '1.5rem' })}

          {(() => {
            const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
            if (divisions.length === 0) return null
            const divStats = divisions.map((div, i) => {
              const count = students.filter(s => div.grades.includes(s.grade)).length
              const enrolledCount = students.filter(s => div.grades.includes(s.grade) && s.status === 'Enrolled').length
              return { name: div.name, color: DIVISION_COLORS[i % DIVISION_COLORS.length], count, enrolledCount }
            })
            const maxCount = Math.max(...divStats.map(d => d.count), 1)
            return card(<>
              {cardTitle('Students by Division')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {divStats.map(div => (
                  <div key={div.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0, fontWeight: '500' }}>{div.name}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(div.count / maxCount) * 100}%`, height: '100%', background: div.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{div.count}</span>
                    <span style={{ fontSize: '0.75rem', color: div.color, fontWeight: '500', width: '80px' }}>{div.enrolledCount} enrolled</span>
                  </div>
                ))}
              </div>
            </>, { marginBottom: '1.5rem' })
          })()}

          {card(<>
            {cardTitle('Students by Grade')}
            {gradeEntries.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No grade data yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gradeEntries.map(([grade, count]) => (
                  <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{grade}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxGradeCount) * 100}%`, height: '100%', background: primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </>
      )}

      {/* ── Attendance Tab ── */}
      {activeTab === 'attendance' && (() => {
        const totalRecords = attendanceRecords.length
        const presentRecords = attendanceRecords.filter(r => r.status === 'Present').length
        const absentRecords = attendanceRecords.filter(r => r.status === 'Absent').length
        const tardyRecords = attendanceRecords.filter(r => r.status === 'Tardy').length
        const presentRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : null

        // Absences by month (last 6)
        const absenceMonthCounts = months.map(m => ({
          ...m,
          count: attendanceRecords.filter(r => {
            if (!r.date || r.status === 'Present') return false
            const d = new Date(r.date)
            return d.getFullYear() === m.year && d.getMonth() === m.month
          }).length,
        }))
        const maxAbsenceMonth = Math.max(...absenceMonthCounts.map(m => m.count), 1)

        // Chronic absenteeism: students with >10% non-Present records
        const studentMap = {}
        attendanceRecords.forEach(r => {
          if (!studentMap[r.student_id]) studentMap[r.student_id] = { name: r.student_name, grade: r.student_grade, total: 0, absent: 0 }
          studentMap[r.student_id].total++
          if (r.status !== 'Present') studentMap[r.student_id].absent++
        })
        const chronic = Object.values(studentMap)
          .filter(s => s.total >= 5 && s.absent / s.total > 0.1)
          .sort((a, b) => (b.absent / b.total) - (a.absent / a.total))

        return (
          <>
            {statCards([
              { label: 'Total Records', value: totalRecords, icon: '📅', color: '#3b82f6' },
              { label: 'Present Rate', value: presentRate !== null ? `${presentRate}%` : '—', icon: '✅', color: '#10b981' },
              { label: 'Absences', value: absentRecords, icon: '❌', color: '#ef4444' },
              { label: 'Tardies', value: tardyRecords, icon: '⏰', color: '#f59e0b' },
              { label: 'Chronic Absentees', value: chronic.length, icon: '⚠️', color: chronic.length > 0 ? '#ef4444' : '#10b981' },
            ])}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

              {card(<>
                {cardTitle('Absences & Tardies — Last 6 Months')}
                {totalRecords === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No attendance records yet.</p> : barChart(absenceMonthCounts, maxAbsenceMonth, '#3b82f6')}
              </>)}

              {card(<>
                {cardTitle('Attendance Breakdown')}
                {totalRecords === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No attendance records yet.</p> : (<>
                  <div style={{ display: 'flex', height: '16px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                    {['Present', 'Absent', 'Tardy', 'Excused'].map(status => {
                      const count = attendanceRecords.filter(r => r.status === status).length
                      const pct = totalRecords > 0 ? (count / totalRecords) * 100 : 0
                      return pct > 0 ? <div key={status} style={{ width: `${pct}%`, background: ATTENDANCE_STATUS_COLORS[status] }} title={`${status}: ${count}`} /> : null
                    })}
                  </div>
                  {['Present', 'Absent', 'Tardy', 'Excused'].map(status => {
                    const count = attendanceRecords.filter(r => r.status === status).length
                    const pct = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: ATTENDANCE_STATUS_COLORS[status], display: 'inline-block' }} />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{count}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </>)}
              </>)}
            </div>

            {card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Chronic Absentees</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Students with &gt;10% non-present rate (min. 5 days recorded)</span>
              </div>
              {chronic.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No chronic absentees. Great attendance! 🎉</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Student', 'Grade', 'Days Recorded', 'Non-Present', 'Rate'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chronic.map((s, i) => {
                        const rate = Math.round((s.absent / s.total) * 100)
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937' }}>{s.name}</td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{s.grade || '—'}</td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#374151' }}>{s.total}</td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#ef4444', fontWeight: '600' }}>{s.absent}</td>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: rate >= 20 ? '#ef4444' : '#f59e0b', background: rate >= 20 ? '#ef444418' : '#f59e0b18', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>)}
          </>
        )
      })()}

      {/* ── Incidents Tab ── */}
      {activeTab === 'incidents' && (
        <>
          {statCards([
            { label: 'Total Student Incidents', value: totalIncidents, icon: '📋', color: '#6b7280' },
            { label: 'Open', value: openIncidents, icon: '🔴', color: '#ef4444' },
            { label: 'Resolved', value: resolvedIncidents, icon: '✅', color: '#10b981' },
          ])}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {card(<>
              {cardTitle('Student Incidents by Type')}
              {totalIncidents === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No student incidents logged yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {incidentTypeCounts.map(({ type, count }) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151', width: '100px', flexShrink: 0 }}>{type}</span>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${(count / maxTypeCount) * 100}%`, height: '100%', background: INCIDENT_TYPE_COLORS[type], borderRadius: '9999px', transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>✓ {resolvedIncidents} resolved</span>
                    <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>● {openIncidents} open</span>
                  </div>
                </div>
              )}
            </>)}

            {card(<>
              {cardTitle('Student Incidents — Last 6 Months')}
              {barChart(incidentMonthCounts, maxIncidentMonth, '#ef4444', 120)}
            </>)}
          </div>

          {card(<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Open Student Incidents</h3>
              {openIncidents > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{openIncidents}</span>
              )}
            </div>
            {openIncidentsList.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No open student incidents. All caught up! 🎉</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Student', 'Grade', 'Type', 'Date', 'Description', 'Reported By'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openIncidentsList.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{inc.student_name || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{inc.student_grade || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[inc.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[inc.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>{inc.type}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{inc.date || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#374151', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{inc.reported_by || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>)}
        </>
      )}

      {/* ── Communications Tab ── */}
      {activeTab === 'communications' && (
        <>
          {statCards([
            { label: 'Messages Sent', value: messages.length, icon: '✉️', color: '#8b5cf6' },
            { label: 'Parents Reached', value: totalParentsReached, icon: '👪', color: '#ec4899' },
          ])}

          {card(<>
            {cardTitle('Messages Sent — Last 6 Months')}
            {messages.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No messages sent yet.</p> : barChart(messageMonthCounts, maxMessageMonth, '#8b5cf6')}
          </>, { marginBottom: '1.5rem' })}

          {card(<>
            {cardTitle('Message History')}
            {messages.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No messages yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Subject', 'Recipients', 'Date', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...messages].reverse().map(msg => (
                      <tr key={msg.id} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937' }}>{msg.subject}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{msg.recipient_count || 0} parents</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(msg.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', background: '#10b98118', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{msg.status || 'Sent'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>)}
        </>
      )}

      {/* ── Fundraising Tab ── */}
      {activeTab === 'fundraising' && (() => {
        const totalRaised = donations.reduce((s, d) => s + (d.amount || 0), 0)
        const avgGift = donations.length > 0 ? totalRaised / donations.length : 0
        const completedCampaigns = campaigns.filter(c => c.status === 'Completed')
        const getCampaignRaised = (id) => donations.filter(d => d.campaign_id === id).reduce((s, d) => s + (d.amount || 0), 0)
        const hitGoal = completedCampaigns.filter(c => c.goal > 0 && getCampaignRaised(c.id) >= c.goal)
        const goalHitRate = completedCampaigns.filter(c => c.goal > 0).length > 0
          ? Math.round((hitGoal.length / completedCampaigns.filter(c => c.goal > 0).length) * 100)
          : null

        // 12-month donation trend
        const now = new Date()
        const months12 = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
          return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
        })
        const donationMonthTotals = months12.map(m => ({
          ...m,
          count: donations.filter(d => {
            if (!d.date) return false
            const dt = new Date(d.date)
            return dt.getFullYear() === m.year && dt.getMonth() === m.month
          }).reduce((s, d) => s + (d.amount || 0), 0),
        }))
        const maxDonationMonth = Math.max(...donationMonthTotals.map(m => m.count), 1)

        // Raised by campaign type
        const typeRaised = {}
        campaigns.forEach(c => {
          const r = getCampaignRaised(c.id)
          typeRaised[c.type] = (typeRaised[c.type] || 0) + r
        })
        const typeEntries = Object.entries(typeRaised).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
        const maxTypeRaised = typeEntries.length > 0 ? typeEntries[0][1] : 1

        // Campaign scoreboard — all campaigns sorted by % of goal
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
          const net = gross - (ev.expenses || 0)
          return { ...ev, gross, net }
        }).sort((a, b) => b.net - a.net)

        return (
          <>
            {statCards([
              { label: 'Total Raised', value: fmt(totalRaised), icon: '💰', color: '#10b981' },
              { label: 'Campaigns', value: campaigns.length, icon: '🎯', color: primaryColor },
              { label: 'Goal Hit Rate', value: goalHitRate !== null ? `${goalHitRate}%` : '—', icon: '🏆', color: '#f59e0b' },
              { label: 'Avg Gift', value: fmt(avgGift), icon: '🎁', color: '#8b5cf6' },
            ])}

            {/* Campaign Scoreboard */}
            {card(<>
              {cardTitle('Campaign Scoreboard')}
              {scoreboard.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No campaigns yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {scoreboard.map(c => {
                    const color = CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280'
                    const isCompleted = c.status === 'Completed'
                    const hit = isCompleted && c.goal > 0 && c.raised >= c.goal
                    const missed = isCompleted && c.goal > 0 && c.raised < c.goal
                    return (
                      <div key={c.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color, background: color + '18', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.type}</span>
                            {hit && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981', background: '#10b98118', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>✓ Goal Hit</span>}
                            {missed && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ef4444', background: '#ef444418', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>✗ Missed</span>}
                            {c.status === 'Active' && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#10b981', whiteSpace: 'nowrap', flexShrink: 0 }}>● Active</span>}
                            {c.status === 'Paused' && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#f59e0b', whiteSpace: 'nowrap', flexShrink: 0 }}>⏸ Paused</span>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>{fmt(c.raised)}</span>
                            {c.goal > 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}> / {fmt(c.goal)}</span>}
                          </div>
                        </div>
                        {c.goal > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, c.pct)}%`, height: '100%', background: hit ? '#10b981' : missed ? '#ef4444' : color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', width: '36px', textAlign: 'right' }}>{c.pct}%</span>
                          </div>
                        ) : (
                          <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>, { marginBottom: '1.5rem' })}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

              {/* Monthly donation trend */}
              {card(<>
                {cardTitle('Monthly Donations — Last 12 Months')}
                {donations.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donations yet.</p> : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '140px' }}>
                    {donationMonthTotals.map(m => {
                      const barH = m.count > 0 ? Math.max((m.count / maxDonationMonth) * 100, 6) : 0
                      return (
                        <div key={m.label + m.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', height: '100%', justifyContent: 'flex-end' }}>
                          {m.count > 0 && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#374151' }}>{fmt(m.count)}</span>}
                          <div style={{ width: '100%', background: m.count > 0 ? '#10b981' : '#f3f4f6', borderRadius: '0.25rem 0.25rem 0 0', height: `${barH}%`, minHeight: '4px' }} />
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>)}

              {/* Raised by campaign type */}
              {card(<>
                {cardTitle('Raised by Campaign Type')}
                {typeEntries.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donation data yet.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {typeEntries.map(([type, total]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#374151', width: '130px', flexShrink: 0 }}>{type}</span>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${(total / maxTypeRaised) * 100}%`, height: '100%', background: CAMPAIGN_TYPE_COLORS[type] || '#6b7280', borderRadius: '9999px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '72px', textAlign: 'right' }}>{fmt(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>)}
            </div>

            {/* Completed Campaign History */}
            {card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Completed Campaign History</h3>
                {completedCampaigns.length > 0 && goalHitRate !== null && (
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: goalHitRate >= 75 ? '#10b981' : goalHitRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.75rem' }}>
                    {hitGoal.length} of {completedCampaigns.filter(c => c.goal > 0).length} goals hit
                  </span>
                )}
              </div>
              {completedCampaigns.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No completed campaigns yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Campaign', 'Type', 'Goal', 'Raised', 'Result', 'Dates'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completedCampaigns.map(c => {
                        const raised = getCampaignRaised(c.id)
                        const hit = c.goal > 0 && raised >= c.goal
                        const pct = c.goal > 0 ? Math.round((raised / c.goal) * 100) : null
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '0.625rem 0.75rem', fontWeight: '600', color: '#1f2937' }}>{c.name}</td>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280', background: (CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{c.type}</span>
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{c.goal > 0 ? fmt(c.goal) : '—'}</td>
                            <td style={{ padding: '0.625rem 0.75rem', fontWeight: '700', color: '#10b981' }}>{fmt(raised)}</td>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              {c.goal > 0 ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: hit ? '#10b981' : '#ef4444', background: hit ? '#10b98118' : '#ef444418', borderRadius: '9999px', padding: '0.15rem 0.6rem', whiteSpace: 'nowrap' }}>
                                  {hit ? `✓ Hit (${pct}%)` : `✗ ${pct}% of goal`}
                                </span>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No goal set</span>
                              )}
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.end_date || c.start_date || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>, { marginBottom: '1.5rem' })}

            {/* Event ROI */}
            {card(<>
              {cardTitle('Event ROI')}
              {eventROI.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No fundraising events yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Event', 'Type', 'Date', 'Gross Revenue', 'Expenses', 'Net'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eventROI.map(ev => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '600', color: '#1f2937' }}>{ev.name}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{ev.type}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{ev.date || '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#374151', fontWeight: '500' }}>{fmt(ev.gross)}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: ev.expenses > 0 ? '#ef4444' : '#9ca3af' }}>{ev.expenses > 0 ? fmt(ev.expenses) : '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '700', color: ev.net >= 0 ? '#10b981' : '#ef4444' }}>{fmt(ev.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>)}
          </>
        )
      })()}

      {/* ── Staff Tab ── */}
      {activeTab === 'staff' && (
        <>
          {statCards([
            { label: 'Total Staff', value: staff.length, icon: '👩‍🏫', color: primaryColor },
            { label: 'Active', value: activeStaff.length, icon: '✅', color: '#10b981' },
            { label: 'Inactive', value: inactiveStaff.length, icon: '⏸️', color: '#9ca3af' },
            { label: 'Roles', value: distinctRoles, icon: '🏷️', color: '#6366f1' },
          ])}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {card(<>
              {cardTitle('Active Staff by Role')}
              {roleCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No active staff yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {roleCounts.map(({ role, count }) => (
                    <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0 }}>{role}</span>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${(count / maxRoleCount) * 100}%`, height: '100%', background: ROLE_COLORS[role] || primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {divisions.length > 0 ? card(<>
              {cardTitle('Staff by Division')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {divisionStaffCounts.map(div => (
                  <div key={div.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0, fontWeight: '500' }}>{div.name}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(div.count / maxDivStaffCount) * 100}%`, height: '100%', background: div.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{div.count}</span>
                  </div>
                ))}
              </div>
            </>) : null}
          </div>

          {gradeCoverageEntries.length > 0 && card(<>
            {cardTitle('Staff Coverage by Grade')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gradeCoverageEntries.map(([grade, count]) => (
                <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{grade}</span>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / maxGradeCoverage) * 100}%`, height: '100%', background: primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          </>, { marginBottom: '1.5rem' })}

          {card(<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Unassigned Active Staff</h3>
              {unassignedStaff.length > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#f59e0b', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{unassignedStaff.length}</span>
              )}
            </div>
            {unassignedStaff.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>All active staff have grade assignments. 🎉</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Name', 'Role', 'Email', 'Phone'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedStaff.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{s.first_name} {s.last_name}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: ROLE_COLORS[s.role] || '#6b7280', background: (ROLE_COLORS[s.role] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>{s.role || '—'}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{s.email || '—'}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{s.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>)}
        </>
      )}

      {/* ── Facilities Tab ── */}
      {activeTab === 'facilities' && (() => {
        const todayStr = new Date().toISOString().split('T')[0]
        const thisMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

        const openWOs = workOrders.filter(w => w.status === 'Open')
        const inProgressWOs = workOrders.filter(w => w.status === 'In Progress')
        const overdueWOs = workOrders.filter(w => w.due_date && w.due_date < todayStr && !['Completed', 'Cancelled'].includes(w.status))
        const completedThisMonth = workOrders.filter(w => w.status === 'Completed' && w.completed_date?.startsWith(thisMonthStr))

        // Avg resolution time (days): completed WOs with both created_at and completed_date
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

        // By priority
        const priorityCounts = ['Urgent', 'High', 'Medium', 'Low'].map(p => ({
          label: p, count: workOrders.filter(w => w.priority === p && !['Completed', 'Cancelled'].includes(w.status)).length, color: WO_PRIORITY_COLORS[p],
        }))
        const maxPriCount = Math.max(...priorityCounts.map(p => p.count), 1)

        // By status
        const statusCounts = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map(s => ({
          label: s, count: workOrders.filter(w => w.status === s).length, color: WO_STATUS_COLORS[s],
        })).filter(s => s.count > 0)

        // Trend: last 6 months (by created_at)
        const woMonthCounts = months.map(m => ({
          ...m,
          count: workOrders.filter(w => {
            const d = new Date(w.created_at)
            return d.getFullYear() === m.year && d.getMonth() === m.month
          }).length,
        }))
        const maxWoMonth = Math.max(...woMonthCounts.map(m => m.count), 1)

        // Cost summary by category
        const costByCat = WO_CATEGORIES.map((cat, i) => {
          const wos = workOrders.filter(w => w.category === cat && (w.estimated_cost || w.actual_cost))
          const est = wos.reduce((s, w) => s + (w.estimated_cost || 0), 0)
          const actual = wos.reduce((s, w) => s + (w.actual_cost || 0), 0)
          return { cat, est, actual, color: WO_CATEGORY_COLORS[i] }
        }).filter(c => c.est > 0 || c.actual > 0)
        const totalEst = costByCat.reduce((s, c) => s + c.est, 0)
        const totalActual = costByCat.reduce((s, c) => s + c.actual, 0)

        // Staff workload (by assigned_to)
        const assigneeCounts = {}
        workOrders.filter(w => w.assigned_to && !['Completed', 'Cancelled'].includes(w.status)).forEach(w => {
          assigneeCounts[w.assigned_to] = (assigneeCounts[w.assigned_to] || 0) + 1
        })
        const workloadEntries = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1])
        const maxWorkload = workloadEntries.length > 0 ? workloadEntries[0][1] : 1

        return (
          <>
            {statCards([
              { label: 'Total Work Orders', value: workOrders.length, icon: '🔧', color: '#6b7280' },
              { label: 'Open', value: openWOs.length, icon: '📂', color: '#3b82f6' },
              { label: 'In Progress', value: inProgressWOs.length, icon: '⚙️', color: '#f59e0b' },
              { label: 'Overdue', value: overdueWOs.length, icon: '⚠️', color: '#ef4444' },
              { label: 'Completed This Month', value: completedThisMonth.length, icon: '✅', color: '#10b981' },
              { label: 'Avg Resolution (days)', value: avgDays !== null ? avgDays : '—', icon: '📅', color: '#8b5cf6' },
            ])}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

              {/* Work Orders by Category */}
              {card(<>
                {cardTitle('Work Orders by Category')}
                {catCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No work orders yet.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {catCounts.map(c => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{c.label}</span>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${(c.count / maxCatCount) * 100}%`, height: '100%', background: c.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>)}

              {/* Status distribution */}
              {card(<>
                {cardTitle('Work Orders by Status')}
                {statusCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No work orders yet.</p> : (<>
                  <div style={{ display: 'flex', height: '16px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                    {statusCounts.map(s => {
                      const pct = workOrders.length > 0 ? (s.count / workOrders.length) * 100 : 0
                      return pct > 0 ? <div key={s.label} style={{ width: `${pct}%`, background: s.color }} title={`${s.label}: ${s.count}`} /> : null
                    })}
                  </div>
                  {statusCounts.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{s.count}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{Math.round((s.count / workOrders.length) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </>)}
              </>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

              {/* Trend */}
              {card(<>
                {cardTitle('Work Orders Opened — Last 6 Months')}
                {barChart(woMonthCounts, maxWoMonth, '#0ea5e9')}
              </>)}

              {/* Open by Priority */}
              {card(<>
                {cardTitle('Open & In-Progress by Priority')}
                {priorityCounts.every(p => p.count === 0) ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No active work orders.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {priorityCounts.map(p => (
                      <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: p.color, width: '70px', flexShrink: 0 }}>{p.label}</span>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${(p.count / maxPriCount) * 100}%`, height: '100%', background: p.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1f2937', width: '24px', textAlign: 'right' }}>{p.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>)}
            </div>

            {/* Staff Workload */}
            {workloadEntries.length > 0 && card(<>
              {cardTitle('Active Work Orders by Assignee')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workloadEntries.map(([name, count]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '160px', flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxWorkload) * 100}%`, height: '100%', background: '#0ea5e9', borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </>, { marginBottom: '1.5rem' })}

            {/* Cost Summary */}
            {costByCat.length > 0 && card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Cost Summary by Category</h3>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7280' }}>Est: <strong style={{ color: '#374151' }}>{fmt(totalEst)}</strong></span>
                  <span style={{ color: '#6b7280' }}>Actual: <strong style={{ color: totalActual > totalEst ? '#ef4444' : '#10b981' }}>{fmt(totalActual)}</strong></span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Category', 'Est. Cost', 'Actual Cost', 'Variance'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costByCat.map(c => {
                      const variance = c.actual - c.est
                      return (
                        <tr key={c.cat} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ fontWeight: '500', color: '#1f2937' }}>{c.cat}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#374151' }}>{c.est > 0 ? fmt(c.est) : '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#374151' }}>{c.actual > 0 ? fmt(c.actual) : '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '600', color: variance > 0 ? '#ef4444' : variance < 0 ? '#10b981' : '#9ca3af' }}>
                            {c.est > 0 && c.actual > 0 ? (variance > 0 ? `+${fmt(variance)}` : variance < 0 ? `-${fmt(Math.abs(variance))}` : '—') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>, { marginBottom: '1.5rem' })}

            {/* Overdue Work Orders */}
            {card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Overdue Work Orders</h3>
                {overdueWOs.length > 0 && (
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{overdueWOs.length}</span>
                )}
              </div>
              {overdueWOs.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No overdue work orders. All caught up! 🎉</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Title', 'Category', 'Location', 'Priority', 'Status', 'Due Date', 'Assigned To'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overdueWOs.sort((a, b) => a.due_date.localeCompare(b.due_date)).map(wo => (
                        <tr key={wo.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{wo.category}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{wo.location || '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.priority}</span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: WO_STATUS_COLORS[wo.status], background: WO_STATUS_COLORS[wo.status] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.status}</span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#ef4444', fontWeight: '600', whiteSpace: 'nowrap' }}>{wo.due_date}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>, { marginBottom: '1.5rem' })}

            {/* Open Work Orders Table */}
            {card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>All Open Work Orders</h3>
                {openWOs.length > 0 && (
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#3b82f6', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{openWOs.length}</span>
                )}
              </div>
              {openWOs.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No open work orders.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Title', 'Category', 'Location', 'Priority', 'Submitted By', 'Assigned To', 'Opened'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {openWOs.map(wo => (
                        <tr key={wo.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{wo.category}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{wo.location || '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.priority}</span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{wo.submitted_by || '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(wo.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>)}
          </>
        )
      })()}

    </div>
  )
}
