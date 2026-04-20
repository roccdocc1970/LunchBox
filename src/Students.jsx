import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUS_COLORS = {
  Enrolled: '#10b981',
  Waitlisted: '#f59e0b',
  Applied: '#3b82f6',
}

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const parseGrades = (school) => {
  try {
    const g = JSON.parse(school?.grades_offered)
    return Array.isArray(g) && g.length > 0 ? g : null
  } catch { return null }
}

const getAcademicYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export default function Students({ user, school }) {
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [gradeHistory, setGradeHistory] = useState([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [graduateConfirm, setGraduateConfirm] = useState(false)
  const [graduateForm, setGraduateForm] = useState({ graduation_year: new Date().getFullYear(), grade_completed: '' })
  const [graduating, setGraduating] = useState(false)
  const [repeatGrade, setRepeatGrade] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('last_name', { ascending: true })
    if (data) setStudents(data)
    setLoading(false)
  }

  const filtered = students.filter((s) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) ||
      (s.parent_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.parent_email || '').toLowerCase().includes(search.toLowerCase())
    const matchGrade = !filterGrade || s.grade === filterGrade
    const matchStatus = !filterStatus || s.status === filterStatus
    return matchSearch && matchGrade && matchStatus
  })

  const gradeOptions = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort()

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
      email: selected.parent_email,
      phone: selected.parent_phone,
      address: selected.address,
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

  const openProfile = (student) => {
    setSelected(student)
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setError(null)
    fetchGradeHistory(student.id)
  }

  const closeProfile = () => {
    setSelected(null)
    setGradeHistory([])
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditing(true)
    setRepeatGrade(false)
    setDeleteConfirm(false)
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const { first_name, last_name, grade, date_of_birth, parent_name, parent_email, parent_phone, address, notes, status } = editForm
    const { data, error } = await supabase
      .from('students')
      .update({ first_name, last_name, grade, date_of_birth, parent_name, parent_email, parent_phone, address, notes, status })
      .eq('id', selected.id)
      .select()
      .single()
    if (error) {
      setError(error.message)
    } else {
      const gradeChanged = editForm.grade && editForm.grade !== selected.grade
      const gradeRepeated = editForm.grade && editForm.grade === selected.grade && repeatGrade

      if (gradeChanged) {
        const currentIdx = ALL_GRADES.indexOf(selected.grade)
        const newIdx = ALL_GRADES.indexOf(editForm.grade)
        if (currentIdx !== -1 && newIdx !== -1 && newIdx < currentIdx) {
          setError(`Cannot move a student back from ${selected.grade} to ${editForm.grade}. Grade changes must move forward.`)
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
          school_id: user.id,
        }])
        fetchGradeHistory(selected.id)
        setRepeatGrade(false)
      }
      setSelected(data)
      setEditing(false)
      fetchStudents()
    }
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

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem'
  }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Students</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View and manage your student roster</p>
      </div>

      {!configuredGrades && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>⚙️</span>
          <span style={{ fontSize: '0.875rem', color: '#92400e' }}>Grade options are showing all grades. <strong>Configure your grade levels in Settings → Academic Config</strong> to restrict options to your school.</span>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, parent, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Grades</option>
          {gradeOptions.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option>Applied</option>
          <option>Enrolled</option>
          <option>Waitlisted</option>
        </select>
        {(search || filterGrade || filterStatus) && (
          <button
            onClick={() => { setSearch(''); setFilterGrade(''); setFilterStatus('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary counts */}
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

      {/* Table */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading students...</p>
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
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{student.grade || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{student.parent_name || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>{student.parent_email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.parent_phone}</div>
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
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeProfile() }}
        >
          <div style={{ width: '420px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            {/* Drawer Header */}
            <div style={{ background: '#f97316', padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: '0.25rem' }}>{selected.grade || 'No grade set'}</div>
                </div>
                <button onClick={closeProfile} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <span style={{ display: 'inline-block', marginTop: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                {selected.status || 'Applied'}
              </span>
            </div>

            <div style={{ padding: '1.5rem' }}>

              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              {!editing ? (
                <>
                  {/* View Mode */}
                  <Section title="Student Info">
                    <Field label="Date of Birth" value={selected.date_of_birth || '—'} />
                    <Field label="Address" value={selected.address || '—'} />
                    {selected.notes && <Field label="Notes" value={selected.notes} />}
                  </Section>

                  <Section title="Parent / Guardian">
                    <Field label="Name" value={selected.parent_name || '—'} />
                    <Field label="Email" value={selected.parent_email || '—'} />
                    <Field label="Phone" value={selected.parent_phone || '—'} />
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
                              <div style={{ position: 'absolute', left: '-1.1rem', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: isCurrent ? '#f97316' : '#d1d5db', border: `2px solid ${isCurrent ? '#f97316' : '#e5e7eb'}` }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: isCurrent ? '600' : '400', color: isCurrent ? '#f97316' : '#374151' }}>
                                  {entry.grade}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{entry.academic_year}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isCurrent && <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: '500' }}>current</span>}
                                {entry.is_repeat && <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500' }}>repeated</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Section>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={startEdit}
                      style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Graduate to Alumni */}
                  <button
                    onClick={() => { setGraduateConfirm(true); setDeleteConfirm(false); setGraduateForm({ graduation_year: new Date().getFullYear(), grade_completed: selected.grade || '' }) }}
                    style={{ width: '100%', marginTop: '0.75rem', background: '#fff7ed', color: '#f97316', border: '2px solid #f97316', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
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
                          <input
                            type="number"
                            value={graduateForm.graduation_year}
                            onChange={e => setGraduateForm({ ...graduateForm, graduation_year: e.target.value })}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Grade Completed</label>
                          <select
                            value={graduateForm.grade_completed}
                            onChange={e => setGraduateForm({ ...graduateForm, grade_completed: e.target.value })}
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                          >
                            <option value="">Unknown</option>
                            {GRADES.map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={graduateToAlumni} disabled={graduating}
                          style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>
                          {graduating ? 'Moving...' : 'Confirm Graduate'}
                        </button>
                        <button onClick={() => setGraduateConfirm(false)}
                          style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                          Cancel
                        </button>
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
                  {/* Edit Mode */}
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
                      <select name="grade" value={editForm.grade || ''} onChange={e => { handleEditChange(e); setRepeatGrade(false) }} style={inputStyle}>
                        <option value="">Select grade</option>
                        {GRADES.map((g) => <option key={g}>{g}</option>)}
                      </select>
                      {editForm.grade && editForm.grade === selected.grade && (
                        <div
                          onClick={() => setRepeatGrade(!repeatGrade)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${repeatGrade ? '#f97316' : '#d1d5db'}`, background: repeatGrade ? '#f97316' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {repeatGrade && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: repeatGrade ? '#f97316' : '#6b7280', fontWeight: repeatGrade ? '600' : '400' }}>
                            Student is repeating this grade
                          </span>
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
                      <label style={labelStyle}>Address</label>
                      <input name="address" value={editForm.address || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Parent / Guardian Name</label>
                      <input name="parent_name" value={editForm.parent_name || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Parent Email</label>
                      <input type="email" name="parent_email" value={editForm.parent_email || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Parent Phone</label>
                      <input type="tel" name="parent_phone" value={editForm.parent_phone || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Notes</label>
                      <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}
                    >
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
