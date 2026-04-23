import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUS_COLORS = {
  Enrolled: '#10b981',
  Waitlisted: '#f59e0b',
  Applied: '#3b82f6',
}

const INCIDENT_TYPES = ['Behavioral', 'Academic', 'Attendance', 'Safety', 'Other']

const INCIDENT_TYPE_COLORS = {
  Behavioral: '#ef4444',
  Academic:   '#f59e0b',
  Attendance: '#3b82f6',
  Safety:     '#8b5cf6',
  Other:      '#6b7280',
}

const HEALTH_ENTRY_CATEGORIES = ['Allergy', 'Medication', 'Immunization', 'Condition', 'Injury', 'Other']
const HEALTH_CATEGORY_COLORS = {
  Allergy: '#ef4444', Medication: '#3b82f6', Immunization: '#10b981',
  Condition: '#f59e0b', Injury: '#8b5cf6', Other: '#6b7280',
}
const HEALTH_CATEGORY_ICONS = {
  Allergy: '⚠️', Medication: '💊', Immunization: '💉',
  Condition: '🩺', Injury: '🩹', Other: '📋',
}
const BLANK_HEALTH_ENTRY = { category: 'Allergy', name: '', detail: '', date: '', expiration_date: '', notes: '' }
const BLANK_HEALTH_PROFILE = { blood_type: '', primary_physician: '', physician_phone: '', insurance_provider: '', insurance_policy_number: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '', physical_date: '', notes: '' }

const today = () => new Date().toISOString().split('T')[0]
const BLANK_INCIDENT = { date: today(), type: 'Behavioral', description: '', resolution: '', reported_by: '', status: 'Open' }

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const getDivision = (grade, divisionsRaw) => {
  if (!grade || !divisionsRaw) return null
  try {
    const divs = typeof divisionsRaw === 'string' ? JSON.parse(divisionsRaw) : divisionsRaw
    if (!Array.isArray(divs)) return null
    const idx = divs.findIndex(d => d.grades?.includes(grade))
    if (idx === -1) return null
    return { name: divs[idx].name, color: DIVISION_COLORS[idx % DIVISION_COLORS.length] }
  } catch { return null }
}

const parseGrades = (school) => {
  try {
    const g = JSON.parse(school?.grades_offered)
    if (!Array.isArray(g) || g.length === 0) return null
    return [...g].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  } catch { return null }
}

const getAcademicYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export default function Students({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDivision, setFilterDivision] = useState('')
  const [selected, setSelected] = useState(null)
  const [gradeHistory, setGradeHistory] = useState([])
  const [reportCardCount, setReportCardCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [graduateConfirm, setGraduateConfirm] = useState(false)
  const [graduateForm, setGraduateForm] = useState({ graduation_year: new Date().getFullYear(), grade_completed: '' })
  const [graduating, setGraduating] = useState(false)
  const [repeatGrade, setRepeatGrade] = useState(false)
  const [skipGrade, setSkipGrade] = useState(false)
  const [error, setError] = useState(null)

  // Incident log state
  const [incidents, setIncidents] = useState([])
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [incidentForm, setIncidentForm] = useState(BLANK_INCIDENT)
  const [savingIncident, setSavingIncident] = useState(false)
  const [editingIncident, setEditingIncident] = useState(null)
  const [incidentEditForm, setIncidentEditForm] = useState({})
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState([])
  const [editStaffSearch, setEditStaffSearch] = useState('')
  const [editStaffResults, setEditStaffResults] = useState([])

  // Health records state
  const [healthProfile, setHealthProfile] = useState(null)
  const [healthEntries, setHealthEntries] = useState([])
  const [showHealthEntryForm, setShowHealthEntryForm] = useState(false)
  const [healthEntryForm, setHealthEntryForm] = useState({ ...BLANK_HEALTH_ENTRY })
  const [savingHealthEntry, setSavingHealthEntry] = useState(false)
  const [showHealthProfileEdit, setShowHealthProfileEdit] = useState(false)
  const [healthProfileForm, setHealthProfileForm] = useState({ ...BLANK_HEALTH_PROFILE })
  const [savingHealthProfile, setSavingHealthProfile] = useState(false)
  const [editingHealthEntry, setEditingHealthEntry] = useState(null)
  const [healthEntryEditForm, setHealthEntryEditForm] = useState({ ...BLANK_HEALTH_ENTRY })
  const [savingHealthEntryEdit, setSavingHealthEntryEdit] = useState(false)

  // Parent change state (edit mode)
  const [changingParent, setChangingParent] = useState(false)
  const [parentChangeSearch, setParentChangeSearch] = useState('')
  const [parentChangeResults, setParentChangeResults] = useState([])
  const [editParent, setEditParent] = useState(null)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, parents(id, first_name, last_name, email, phone, address)')
      .order('last_name', { ascending: true })
    if (data) setStudents(data)
    setLoading(false)
  }

  const filtered = students.filter((s) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const parentName = `${s.parents?.first_name || ''} ${s.parents?.last_name || ''}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) ||
      parentName.includes(search.toLowerCase()) ||
      (s.parents?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchGrade = !filterGrade || s.grade === filterGrade
    const matchStatus = !filterStatus || s.status === filterStatus
    const matchDivision = !filterDivision || getDivision(s.grade, school?.divisions)?.name === filterDivision
    return matchSearch && matchGrade && matchStatus && matchDivision
  })

  const gradeOptions = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))

  const statusColor = (status) => STATUS_COLORS[status] || '#6b7280'

  const fetchGradeHistory = async (studentId) => {
    const { data } = await supabase
      .from('student_grade_history')
      .select('*')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: true })
    setGradeHistory(data || [])
  }

  const graduateToAlumni = async () => {
    setGraduating(true)
    setError(null)
    const { error: insertError } = await supabase.from('alumni').insert([{
      first_name: selected.first_name,
      last_name: selected.last_name,
      email: selected.parents?.email || null,
      phone: selected.parents?.phone || null,
      address: selected.parents?.address || null,
      graduation_year: graduateForm.graduation_year || null,
      grade_completed: graduateForm.grade_completed || selected.grade || null,
      donor_status: 'Never',
      relationship: 'None',
      opt_in: true,
      original_student_id: selected.id,
      school_id: user.id,
    }])
    if (insertError) {
      setError(insertError.message)
      setGraduating(false)
      return
    }
    await supabase.from('students').delete().eq('id', selected.id)
    setGraduating(false)
    closeProfile()
    fetchStudents()
  }

  const fetchIncidents = async (studentId) => {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
    setIncidents(data || [])
  }

  const logIncident = async () => {
    if (!incidentForm.description) return
    setSavingIncident(true)
    const { error } = await supabase.from('incidents').insert([{
      ...incidentForm,
      student_id: selected.id,
      student_name: `${selected.first_name} ${selected.last_name}`,
      student_grade: selected.grade || null,
      school_id: user.id,
    }])
    if (!error) {
      setShowIncidentForm(false)
      setIncidentForm(BLANK_INCIDENT)
      fetchIncidents(selected.id)
    }
    setSavingIncident(false)
  }

  const searchStaff = async (q) => {
    if (q.length < 1) { setStaffResults([]); return }
    const { data } = await supabase
      .from('staff')
      .select('id, first_name, last_name, role')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .eq('school_id', user.id)
      .eq('status', 'Active')
      .limit(8)
    setStaffResults(data || [])
  }

  const searchEditStaff = async (q) => {
    if (q.length < 1) { setEditStaffResults([]); return }
    const { data } = await supabase
      .from('staff')
      .select('id, first_name, last_name, role')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .eq('school_id', user.id)
      .eq('status', 'Active')
      .limit(8)
    setEditStaffResults(data || [])
  }

  const resolveIncident = async (incidentId) => {
    await supabase.from('incidents').update({ status: 'Resolved' }).eq('id', incidentId)
    fetchIncidents(selected.id)
  }

  const saveIncidentEdit = async () => {
    setSavingIncident(true)
    await supabase.from('incidents').update(incidentEditForm).eq('id', editingIncident)
    setEditingIncident(null)
    setIncidentEditForm({})
    setSavingIncident(false)
    fetchIncidents(selected.id)
  }

  const fetchReportCardCount = async (studentId) => {
    const { count } = await supabase
      .from('report_cards')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
    setReportCardCount(count || 0)
  }

  const fetchHealth = async (studentId) => {
    const [{ data: profile }, { data: entries }] = await Promise.all([
      supabase.from('student_health').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('student_health_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    ])
    setHealthProfile(profile || null)
    setHealthEntries(entries || [])
  }

  const nullify = (obj) => Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])
  )

  const saveHealthProfile = async () => {
    setSavingHealthProfile(true)
    const payload = nullify(healthProfileForm)
    if (healthProfile) {
      await supabase.from('student_health').update(payload).eq('id', healthProfile.id)
    } else {
      await supabase.from('student_health').insert([{ ...payload, student_id: selected.id, school_id: user.id }])
    }
    setSavingHealthProfile(false)
    setShowHealthProfileEdit(false)
    fetchHealth(selected.id)
  }

  const saveHealthEntry = async () => {
    if (!healthEntryForm.name.trim()) return
    setSavingHealthEntry(true)
    const payload = nullify(healthEntryForm)
    await supabase.from('student_health_entries').insert([{ ...payload, student_id: selected.id, school_id: user.id }])
    setSavingHealthEntry(false)
    setShowHealthEntryForm(false)
    setHealthEntryForm({ ...BLANK_HEALTH_ENTRY })
    fetchHealth(selected.id)
  }

  const deleteHealthEntry = async (entryId) => {
    await supabase.from('student_health_entries').delete().eq('id', entryId)
    fetchHealth(selected.id)
  }

  const deleteHealthProfile = async () => {
    await supabase.from('student_health').delete().eq('id', healthProfile.id)
    setShowHealthProfileEdit(false)
    fetchHealth(selected.id)
  }

  const updateHealthEntry = async () => {
    setSavingHealthEntryEdit(true)
    const payload = nullify(healthEntryEditForm)
    await supabase.from('student_health_entries').update(payload).eq('id', editingHealthEntry)
    setSavingHealthEntryEdit(false)
    setEditingHealthEntry(null)
    fetchHealth(selected.id)
  }

  const openProfile = (student) => {
    setSelected(student)
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setError(null)
    fetchGradeHistory(student.id)
    fetchReportCardCount(student.id)
    fetchIncidents(student.id)
    fetchHealth(student.id)
  }

  const closeProfile = () => {
    setSelected(null)
    setGradeHistory([])
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setChangingParent(false)
    setParentChangeSearch('')
    setParentChangeResults([])
    setIncidents([])
    setShowIncidentForm(false)
    setIncidentForm(BLANK_INCIDENT)
    setStaffSearch('')
    setStaffResults([])
    setError(null)
    setHealthProfile(null)
    setHealthEntries([])
    setShowHealthEntryForm(false)
    setShowHealthProfileEdit(false)
    setHealthEntryForm({ ...BLANK_HEALTH_ENTRY })
    setHealthProfileForm({ ...BLANK_HEALTH_PROFILE })
    setEditingHealthEntry(null)
    setHealthEntryEditForm({ ...BLANK_HEALTH_ENTRY })
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditParent(selected.parents || null)
    setEditing(true)
    setRepeatGrade(false)
    setSkipGrade(false)
    setChangingParent(false)
    setDeleteConfirm(false)
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const searchParentChange = async (q) => {
    if (q.length < 2) { setParentChangeResults([]); return }
    const { data } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email, phone, address')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .eq('school_id', user.id)
      .limit(8)
    setParentChangeResults(data || [])
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const { first_name, last_name, grade, date_of_birth, notes, status, parent_id } = editForm
    const { data, error } = await supabase
      .from('students')
      .update({ first_name, last_name, grade, date_of_birth, notes, status, parent_id })
      .eq('id', selected.id)
      .select('*, parents(id, first_name, last_name, email, phone, address)')
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    const gradeChanged = editForm.grade && editForm.grade !== selected.grade
    const gradeRepeated = editForm.grade && editForm.grade === selected.grade && repeatGrade

    if ((gradeChanged || gradeRepeated) && editForm.status !== 'Enrolled') {
      setError('Grade progression is locked until the student has Enrolled status.')
      setSaving(false)
      return
    }

    if (gradeChanged) {
      const currentIdx = ALL_GRADES.indexOf(selected.grade)
      const newIdx = ALL_GRADES.indexOf(editForm.grade)
      if (currentIdx !== -1 && newIdx !== -1 && newIdx < currentIdx) {
        setError(`Cannot move a student back from ${selected.grade} to ${editForm.grade}. Grade changes must move forward.`)
        setSaving(false)
        return
      }
      if (currentIdx !== -1 && newIdx !== -1 && newIdx > currentIdx + 1 && !skipGrade) {
        setError(`${editForm.grade} skips one or more grades. Check "Student is skipping a grade" to confirm.`)
        setSaving(false)
        return
      }
    }

    if (gradeChanged || gradeRepeated) {
      await supabase.from('student_grade_history').insert([{
        student_id: selected.id,
        grade: editForm.grade,
        academic_year: getAcademicYear(),
        is_repeat: gradeRepeated,
        is_skip: gradeChanged && (() => {
          const currentIdx = ALL_GRADES.indexOf(selected.grade)
          const newIdx = ALL_GRADES.indexOf(editForm.grade)
          return currentIdx !== -1 && newIdx !== -1 && newIdx > currentIdx + 1
        })(),
        school_id: user.id,
      }])
      fetchGradeHistory(selected.id)
      setRepeatGrade(false)
      setSkipGrade(false)
    }

    setSelected(data)
    setEditing(false)
    fetchStudents()
    setSaving(false)
  }

  const deleteStudent = async () => {
    const { error } = await supabase.from('students').delete().eq('id', selected.id)
    if (error) {
      setError(error.message)
    } else {
      closeProfile()
      fetchStudents()
    }
  }

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  const parentDisplayName = (p) => p ? `${p.first_name} ${p.last_name}` : '—'

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Students</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View and manage your student roster</p>
      </div>

      {!configuredGrades && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}><strong>Grade editing is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, parent, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
          <option value="">All Grades</option>
          {gradeOptions.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
          <option value="">All Statuses</option>
          <option>Applied</option>
          <option>Enrolled</option>
          <option>Waitlisted</option>
        </select>
        {(() => {
          try {
            const divs = school?.divisions ? (typeof school.divisions === 'string' ? JSON.parse(school.divisions) : school.divisions) : []
            const named = Array.isArray(divs) ? divs.filter(d => d.grades?.length > 0) : []
            if (named.length === 0) return null
            return (
              <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
                <option value="">All Divisions</option>
                {named.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            )
          } catch { return null }
        })()}
        {(search || filterGrade || filterStatus || filterDivision) && (
          <button onClick={() => { setSearch(''); setFilterGrade(''); setFilterStatus(''); setFilterDivision('') }} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['Enrolled', 'Applied', 'Waitlisted'].map((s) => {
          const count = students.filter((st) => st.status === s).length
          return (
            <div key={s} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor(s), display: 'inline-block' }} />
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{count}</span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s}</span>
            </div>
          )
        })}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>{students.length}</span>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total</span>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading students…</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {students.length === 0 ? 'No students yet. Add students via Enrollment.' : 'No students match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Student', 'Grade', 'Parent / Guardian', 'Contact', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, i) => (
                <tr
                  key={student.id}
                  onClick={() => openProfile(student)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{student.first_name} {student.last_name}</div>
                    {student.date_of_birth && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>DOB: {student.date_of_birth}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                    <div>{student.grade || '—'}</div>
                    {(() => {
                      const div = getDivision(student.grade, school?.divisions)
                      if (!div) return null
                      return <span style={{ fontSize: '0.7rem', color: div.color, fontWeight: '600', background: div.color + '15', borderRadius: '9999px', padding: '0.1rem 0.5rem', display: 'inline-block', marginTop: '0.2rem' }}>{div.name}</span>
                    })()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{parentDisplayName(student.parents)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>{student.parents?.email || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.parents?.phone || ''}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: statusColor(student.status) + '20', color: statusColor(student.status), borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                      {student.status || 'Applied'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#9ca3af' }}>
            Showing {filtered.length} of {students.length} students — click a row to view profile
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) closeProfile() }}>
          <div style={{ width: '420px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            <div style={{ background: primaryColor, padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: '0.25rem' }}>{selected.grade || 'No grade set'}</div>
                </div>
                <button onClick={closeProfile} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  {selected.status || 'Applied'}
                </span>
                {(() => {
                  const div = getDivision(selected.grade, school?.divisions)
                  if (!div) return null
                  return <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', borderLeft: `3px solid ${div.color}` }}>{div.name}</span>
                })()}
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              {!editing ? (
                <>
                  <Section title="Student Info">
                    <Field label="Date of Birth" value={selected.date_of_birth || '—'} />
                    {selected.notes && <Field label="Notes" value={selected.notes} />}
                  </Section>

                  <Section title="Parent / Guardian">
                    <Field label="Name" value={parentDisplayName(selected.parents)} />
                    <Field label="Email" value={selected.parents?.email || '—'} />
                    <Field label="Phone" value={selected.parents?.phone || '—'} />
                    <Field label="Address" value={selected.parents?.address || '—'} />
                  </Section>

                  <Section title="Academic Journey">
                    {gradeHistory.length === 0 ? (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>No grade history recorded yet.</p>
                    ) : (
                      <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
                        <div style={{ position: 'absolute', left: '5px', top: 0, bottom: 0, width: '2px', background: '#e5e7eb' }} />
                        {gradeHistory.map((entry, i) => {
                          const isCurrent = i === gradeHistory.length - 1
                          return (
                            <div key={entry.id} style={{ position: 'relative', marginBottom: i < gradeHistory.length - 1 ? '0.875rem' : 0 }}>
                              <div style={{ position: 'absolute', left: '-1.1rem', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: isCurrent ? primaryColor : '#d1d5db', border: `2px solid ${isCurrent ? primaryColor : '#e5e7eb'}` }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: isCurrent ? '600' : '400', color: isCurrent ? primaryColor : '#374151' }}>{entry.grade}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{entry.academic_year}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isCurrent && <span style={{ fontSize: '0.75rem', color: primaryColor, fontWeight: '500' }}>current</span>}
                                {entry.is_repeat && <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500' }}>repeated</span>}
                                {entry.is_skip && <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '500' }}>skipped</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Section>

                  <Section title="Report Cards">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Report cards on file</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: reportCardCount > 0 ? primaryColor : '#9ca3af' }}>
                        {reportCardCount > 0 ? `${reportCardCount} report card${reportCardCount !== 1 ? 's' : ''}` : 'None yet'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Manage report cards in the Report Cards module.</p>
                  </Section>

                  <Section title="Health Records">
                    {/* Health Profile */}
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</span>
                        <button onClick={() => { setShowHealthProfileEdit(!showHealthProfileEdit); setHealthProfileForm({ ...BLANK_HEALTH_PROFILE, ...healthProfile }) }} style={{ fontSize: '0.75rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.15rem 0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                          {showHealthProfileEdit ? 'Cancel' : healthProfile ? 'Edit' : '+ Add'}
                        </button>
                      </div>
                      {showHealthProfileEdit ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={labelStyle}>Blood Type</label>
                              <select value={healthProfileForm.blood_type || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, blood_type: e.target.value })} style={inputStyle}>
                                <option value="">Unknown</option>
                                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>Last Physical</label>
                              <input type="date" value={healthProfileForm.physical_date || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, physical_date: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>Primary Physician</label>
                              <input value={healthProfileForm.primary_physician || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, primary_physician: e.target.value })} style={inputStyle} placeholder="Dr. Name" />
                            </div>
                            <div>
                              <label style={labelStyle}>Physician Phone</label>
                              <input value={healthProfileForm.physician_phone || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, physician_phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>Insurance Provider</label>
                              <input value={healthProfileForm.insurance_provider || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, insurance_provider: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>Policy #</label>
                              <input value={healthProfileForm.insurance_policy_number || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, insurance_policy_number: e.target.value })} style={inputStyle} />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={labelStyle}>Emergency Contact</label>
                              <input value={healthProfileForm.emergency_contact_name || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, emergency_contact_name: e.target.value })} style={inputStyle} placeholder="Full name" />
                            </div>
                            <div>
                              <label style={labelStyle}>Relationship</label>
                              <input value={healthProfileForm.emergency_contact_relationship || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, emergency_contact_relationship: e.target.value })} style={inputStyle} placeholder="e.g. Aunt" />
                            </div>
                            <div style={{ gridColumn: 'span 3' }}>
                              <label style={labelStyle}>Emergency Phone</label>
                              <input value={healthProfileForm.emergency_contact_phone || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, emergency_contact_phone: e.target.value })} style={inputStyle} />
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>Notes</label>
                            <textarea value={healthProfileForm.notes || ''} onChange={e => setHealthProfileForm({ ...healthProfileForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={saveHealthProfile} disabled={savingHealthProfile} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
                              {savingHealthProfile ? 'Saving…' : 'Save Health Profile'}
                            </button>
                            {healthProfile && (
                              <button onClick={deleteHealthProfile} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ) : healthProfile ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem 1rem', fontSize: '0.825rem' }}>
                          {healthProfile.blood_type && <><span style={{ color: '#9ca3af' }}>Blood Type</span><span style={{ fontWeight: '600', color: '#ef4444' }}>{healthProfile.blood_type}</span></>}
                          {healthProfile.primary_physician && <><span style={{ color: '#9ca3af' }}>Physician</span><span style={{ color: '#374151' }}>{healthProfile.primary_physician}</span></>}
                          {healthProfile.physician_phone && <><span style={{ color: '#9ca3af' }}>Physician Ph.</span><span style={{ color: '#374151' }}>{healthProfile.physician_phone}</span></>}
                          {healthProfile.insurance_provider && <><span style={{ color: '#9ca3af' }}>Insurance</span><span style={{ color: '#374151' }}>{healthProfile.insurance_provider}</span></>}
                          {healthProfile.insurance_policy_number && <><span style={{ color: '#9ca3af' }}>Policy #</span><span style={{ color: '#374151' }}>{healthProfile.insurance_policy_number}</span></>}
                          {healthProfile.physical_date && <><span style={{ color: '#9ca3af' }}>Last Physical</span><span style={{ color: '#374151' }}>{healthProfile.physical_date}</span></>}
                          {healthProfile.emergency_contact_name && <>
                            <span style={{ color: '#9ca3af' }}>Emergency</span>
                            <span style={{ color: '#374151' }}>{healthProfile.emergency_contact_name}{healthProfile.emergency_contact_relationship ? ` (${healthProfile.emergency_contact_relationship})` : ''}</span>
                            <span style={{ color: '#9ca3af' }}>Emerg. Phone</span>
                            <span style={{ color: '#374151' }}>{healthProfile.emergency_contact_phone || '—'}</span>
                          </>}
                          {healthProfile.notes && <><span style={{ color: '#9ca3af', gridColumn: 'span 2' }}>Notes: <span style={{ color: '#374151' }}>{healthProfile.notes}</span></span></>}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.825rem', color: '#9ca3af', margin: 0 }}>No health profile on file.</p>
                      )}
                    </div>

                    {/* Health Entries */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conditions, Allergies & More</span>
                      <button onClick={() => setShowHealthEntryForm(!showHealthEntryForm)} style={{ fontSize: '0.75rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.15rem 0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                        {showHealthEntryForm ? 'Cancel' : '+ Add Entry'}
                      </button>
                    </div>

                    {showHealthEntryForm && (
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={labelStyle}>Category</label>
                            <select value={healthEntryForm.category} onChange={e => setHealthEntryForm({ ...healthEntryForm, category: e.target.value })} style={inputStyle}>
                              {HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Name *</label>
                            <input value={healthEntryForm.name} onChange={e => setHealthEntryForm({ ...healthEntryForm, name: e.target.value })} placeholder="e.g. Peanut Allergy" style={inputStyle} />
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Detail</label>
                            <input value={healthEntryForm.detail} onChange={e => setHealthEntryForm({ ...healthEntryForm, detail: e.target.value })} placeholder="Dosage, reaction type, lot number…" style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={healthEntryForm.date} onChange={e => setHealthEntryForm({ ...healthEntryForm, date: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Expiration</label>
                            <input type="date" value={healthEntryForm.expiration_date} onChange={e => setHealthEntryForm({ ...healthEntryForm, expiration_date: e.target.value })} style={inputStyle} />
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Notes</label>
                            <input value={healthEntryForm.notes} onChange={e => setHealthEntryForm({ ...healthEntryForm, notes: e.target.value })} style={inputStyle} />
                          </div>
                        </div>
                        <button onClick={saveHealthEntry} disabled={savingHealthEntry || !healthEntryForm.name.trim()} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', opacity: !healthEntryForm.name.trim() ? 0.5 : 1 }}>
                          {savingHealthEntry ? 'Saving…' : 'Save Entry'}
                        </button>
                      </div>
                    )}

                    {healthEntries.length === 0 ? (
                      <p style={{ fontSize: '0.825rem', color: '#9ca3af', margin: 0 }}>No health entries recorded.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {healthEntries.map(entry => {
                          const color = HEALTH_CATEGORY_COLORS[entry.category] || '#6b7280'
                          const expired = entry.expiration_date && entry.expiration_date < today()
                          const isEditing = editingHealthEntry === entry.id
                          return (
                            <div key={entry.id} style={{ background: '#f9fafb', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                      <label style={labelStyle}>Category</label>
                                      <select value={healthEntryEditForm.category} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, category: e.target.value })} style={inputStyle}>
                                        {HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label style={labelStyle}>Name *</label>
                                      <input value={healthEntryEditForm.name} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, name: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label style={labelStyle}>Detail</label>
                                      <input value={healthEntryEditForm.detail || ''} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, detail: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>Date</label>
                                      <input type="date" value={healthEntryEditForm.date || ''} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, date: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>Expiration</label>
                                      <input type="date" value={healthEntryEditForm.expiration_date || ''} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, expiration_date: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label style={labelStyle}>Notes</label>
                                      <input value={healthEntryEditForm.notes || ''} onChange={e => setHealthEntryEditForm({ ...healthEntryEditForm, notes: e.target.value })} style={inputStyle} />
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={updateHealthEntry} disabled={savingHealthEntryEdit || !healthEntryEditForm.name.trim()} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.825rem' }}>
                                      {savingHealthEntryEdit ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingHealthEntry(null)} style={{ flex: 1, background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.825rem' }}>
                                      Cancel
                                    </button>
                                    <button onClick={() => { deleteHealthEntry(entry.id); setEditingHealthEntry(null) }} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.4rem 0.65rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.825rem' }}>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color, background: color + '18', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                                        {HEALTH_CATEGORY_ICONS[entry.category]} {entry.category}
                                      </span>
                                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1f2937' }}>{entry.name}</span>
                                      {expired && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#ef4444', background: '#ef444418', borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>Expired</span>}
                                    </div>
                                    <button onClick={() => { setEditingHealthEntry(entry.id); setHealthEntryEditForm({ category: entry.category, name: entry.name, detail: entry.detail || '', date: entry.date || '', expiration_date: entry.expiration_date || '', notes: entry.notes || '' }) }} style={{ fontSize: '0.72rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.1rem 0.45rem', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>Edit</button>
                                  </div>
                                  {entry.detail && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>{entry.detail}</p>}
                                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                    {entry.date && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>📅 {entry.date}</span>}
                                    {entry.expiration_date && <span style={{ fontSize: '0.75rem', color: expired ? '#ef4444' : '#9ca3af' }}>Exp: {entry.expiration_date}</span>}
                                  </div>
                                  {entry.notes && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0', fontStyle: 'italic' }}>{entry.notes}</p>}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Section>

                  <Section title="Student Incident Log">
                    {incidents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.75rem' }}>
                        {incidents.map(inc => (
                          <div key={inc.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.75rem' }}>
                            {editingIncident === inc.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <div>
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" value={incidentEditForm.date || ''} onChange={e => setIncidentEditForm({ ...incidentEditForm, date: e.target.value })} style={inputStyle} />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Type</label>
                                    <select value={incidentEditForm.type || 'Behavioral'} onChange={e => setIncidentEditForm({ ...incidentEditForm, type: e.target.value })} style={inputStyle}>
                                      {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label style={labelStyle}>Description</label>
                                  <textarea value={incidentEditForm.description || ''} onChange={e => setIncidentEditForm({ ...incidentEditForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Resolution</label>
                                  <textarea value={incidentEditForm.resolution || ''} onChange={e => setIncidentEditForm({ ...incidentEditForm, resolution: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Reported By</label>
                                    <input
                                      value={editStaffSearch}
                                      onChange={e => { setEditStaffSearch(e.target.value); searchEditStaff(e.target.value) }}
                                      placeholder={incidentEditForm.reported_by || 'Search staff…'}
                                      style={inputStyle}
                                    />
                                    {editStaffResults.length > 0 && (
                                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {editStaffResults.map(s => (
                                          <div
                                            key={s.id}
                                            onClick={() => { setIncidentEditForm({ ...incidentEditForm, reported_by: `${s.first_name} ${s.last_name}` }); setEditStaffSearch(''); setEditStaffResults([]) }}
                                            style={{ padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid #f3f4f6' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                          >
                                            {s.first_name} {s.last_name} <span style={{ color: '#9ca3af' }}>· {s.role}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Status</label>
                                    <select value={incidentEditForm.status || 'Open'} onChange={e => setIncidentEditForm({ ...incidentEditForm, status: e.target.value })} style={inputStyle}>
                                      <option>Open</option>
                                      <option>Resolved</option>
                                    </select>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  <button onClick={saveIncidentEdit} disabled={savingIncident} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.4rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    {savingIncident ? 'Saving…' : 'Save'}
                                  </button>
                                  <button onClick={() => { setEditingIncident(null); setIncidentEditForm({}); setEditStaffSearch(''); setEditStaffResults([]) }} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[inc.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[inc.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{inc.type}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{inc.date}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: inc.status === 'Open' ? '#ef4444' : '#10b981' }}>{inc.status}</span>
                                    <button onClick={() => { setEditingIncident(inc.id); setIncidentEditForm({ ...inc }) }} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.3rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}>Edit</button>
                                  </div>
                                </div>
                                {inc.description && <p style={{ fontSize: '0.8rem', color: '#374151', margin: '0 0 0.25rem', lineHeight: 1.5 }}>{inc.description}</p>}
                                {inc.resolution && <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 0.25rem', fontStyle: 'italic' }}>Resolution: {inc.resolution}</p>}
                                {inc.reported_by && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Reported by: {inc.reported_by}</p>}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {showIncidentForm ? (
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                          <div>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={incidentForm.date} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Type</label>
                            <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} style={inputStyle}>
                              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                          <textarea value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What happened?" />
                        </div>
                        <div>
                          <label style={labelStyle}>Resolution</label>
                          <textarea value={incidentForm.resolution} onChange={e => setIncidentForm({ ...incidentForm, resolution: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Action taken (optional)" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                          <div style={{ position: 'relative' }}>
                            <label style={labelStyle}>Reported By</label>
                            {incidentForm.reported_by ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>{incidentForm.reported_by}</span>
                                <button onClick={() => { setIncidentForm({ ...incidentForm, reported_by: '' }); setStaffSearch(''); setStaffResults([]) }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                              </div>
                            ) : (
                              <>
                                <input
                                  value={staffSearch}
                                  onChange={e => { setStaffSearch(e.target.value); searchStaff(e.target.value) }}
                                  style={inputStyle}
                                  placeholder="Search staff…"
                                />
                                {staffResults.length > 0 && (
                                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '160px', overflowY: 'auto' }}>
                                    {staffResults.map(s => (
                                      <div
                                        key={s.id}
                                        onClick={() => { setIncidentForm({ ...incidentForm, reported_by: `${s.first_name} ${s.last_name}` }); setStaffSearch(''); setStaffResults([]) }}
                                        style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                      >
                                        <span style={{ fontWeight: '600' }}>{s.first_name} {s.last_name}</span>
                                        <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}> · {s.role}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <label style={labelStyle}>Status</label>
                            <select value={incidentForm.status} onChange={e => setIncidentForm({ ...incidentForm, status: e.target.value })} style={inputStyle}>
                              <option>Open</option>
                              <option>Resolved</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button onClick={logIncident} disabled={savingIncident || !incidentForm.description} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', opacity: !incidentForm.description ? 0.5 : 1 }}>
                            {savingIncident ? 'Saving…' : 'Save Incident'}
                          </button>
                          <button onClick={() => { setShowIncidentForm(false); setIncidentForm(BLANK_INCIDENT) }} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowIncidentForm(true)} style={{ fontSize: '0.8rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                        + Log Incident
                      </button>
                    )}
                  </Section>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={startEdit} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Edit Profile
                    </button>
                    <button onClick={() => setDeleteConfirm(true)} style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Delete
                    </button>
                  </div>

                  <button
                    onClick={() => { setGraduateConfirm(true); setDeleteConfirm(false); setGraduateForm({ graduation_year: new Date().getFullYear(), grade_completed: selected.grade || '' }) }}
                    style={{ width: '100%', marginTop: '0.75rem', background: '#fff7ed', color: primaryColor, border: '2px solid #f97316', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                  >
                    🎓 Graduate to Alumni
                  </button>

                  {graduateConfirm && (
                    <div style={{ marginTop: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ color: '#9a3412', fontWeight: '600', margin: '0 0 0.75rem' }}>Graduate {selected.first_name} {selected.last_name} to Alumni?</p>
                      <p style={{ color: '#c2410c', fontSize: '0.875rem', margin: '0 0 1rem' }}>They will be removed from the student roster and added to Alumni.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Graduation Year</label>
                          <input type="number" value={graduateForm.graduation_year} onChange={e => setGraduateForm({ ...graduateForm, graduation_year: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Grade Completed</label>
                          <select value={graduateForm.grade_completed} onChange={e => setGraduateForm({ ...graduateForm, grade_completed: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}>
                            <option value="">Unknown</option>
                            {GRADES.map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={graduateToAlumni} disabled={graduating} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>
                          {graduating ? 'Moving…' : 'Confirm Graduate'}
                        </button>
                        <button onClick={() => setGraduateConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {deleteConfirm && (
                    <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ color: '#991b1b', fontWeight: '600', margin: '0 0 0.75rem' }}>Delete {selected.first_name} {selected.last_name}?</p>
                      <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 1rem' }}>This cannot be undone.</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={deleteStudent} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>Yes, Delete</button>
                        <button onClick={() => setDeleteConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>First Name</label>
                        <input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Last Name</label>
                        <input name="last_name" value={editForm.last_name || ''} onChange={handleEditChange} style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Grade</label>
                      {(() => {
                        const gradeLocked = !configuredGrades || editForm.status !== 'Enrolled'
                        return (
                          <>
                            <select name="grade" value={editForm.grade || ''} onChange={e => { handleEditChange(e); setRepeatGrade(false); setSkipGrade(false) }}
                              disabled={gradeLocked}
                              style={{ ...inputStyle, background: gradeLocked ? '#f3f4f6' : 'white', cursor: gradeLocked ? 'not-allowed' : 'pointer', color: gradeLocked ? '#9ca3af' : '#1f2937' }}>
                              <option value="">{!configuredGrades ? 'Configure grades in Settings first' : 'Select grade'}</option>
                              {GRADES.map((g) => <option key={g}>{g}</option>)}
                            </select>
                            {configuredGrades && editForm.status !== 'Enrolled' && (
                              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.35rem 0 0' }}>
                                🔒 Grade progression is locked until the student is <strong>Enrolled</strong>.
                              </p>
                            )}
                          </>
                        )
                      })()}
                      {editForm.grade && editForm.grade === selected.grade && (
                        <div onClick={() => setRepeatGrade(!repeatGrade)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${repeatGrade ? primaryColor : '#d1d5db'}`, background: repeatGrade ? primaryColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {repeatGrade && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: repeatGrade ? primaryColor : '#6b7280', fontWeight: repeatGrade ? '600' : '400' }}>Student is repeating this grade</span>
                        </div>
                      )}
                      {editForm.grade && editForm.grade !== selected.grade && (() => {
                        const ci = ALL_GRADES.indexOf(selected.grade)
                        const ni = ALL_GRADES.indexOf(editForm.grade)
                        return ci !== -1 && ni !== -1 && ni > ci + 1
                      })() && (
                        <div onClick={() => setSkipGrade(!skipGrade)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${skipGrade ? '#8b5cf6' : '#d1d5db'}`, background: skipGrade ? '#8b5cf6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {skipGrade && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: skipGrade ? '#8b5cf6' : '#6b7280', fontWeight: skipGrade ? '600' : '400' }}>Student is skipping a grade</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Status</label>
                      <select name="status" value={editForm.status || 'Applied'} onChange={handleEditChange} style={inputStyle}>
                        <option>Applied</option>
                        <option>Enrolled</option>
                        <option>Waitlisted</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Date of Birth</label>
                      <input type="date" name="date_of_birth" value={editForm.date_of_birth || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Notes</label>
                      <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>

                    {/* Parent / Guardian */}
                    <div>
                      <label style={labelStyle}>Parent / Guardian</label>
                      {!changingParent ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{parentDisplayName(editParent)}</span>
                          <button onClick={() => setChangingParent(true)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Change</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            autoFocus
                            placeholder="Search parents by name or email…"
                            value={parentChangeSearch}
                            onChange={e => { setParentChangeSearch(e.target.value); searchParentChange(e.target.value) }}
                            style={inputStyle}
                          />
                          {parentChangeResults.length > 0 && (
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white', marginTop: '0.25rem', maxHeight: '160px', overflowY: 'auto' }}>
                              {parentChangeResults.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setEditForm({ ...editForm, parent_id: p.id })
                                    setEditParent(p)
                                    setChangingParent(false)
                                    setParentChangeSearch('')
                                    setParentChangeResults([])
                                  }}
                                  style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                  <strong>{p.first_name} {p.last_name}</strong>
                                  {p.email && <span style={{ color: '#6b7280' }}> · {p.email}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => { setChangingParent(false); setParentChangeSearch(''); setParentChangeResults([]) }} style={{ fontSize: '0.78rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>
                            Cancel
                          </button>
                        </div>
                      )}
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>Edit parent contact details in the Parents module.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={saveEdit} disabled={saving} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{title}</div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}
