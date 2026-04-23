import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

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

const BLANK_PARENT = { first_name: '', last_name: '', email: '', phone: '', address: '' }
const BLANK_STUDENT = { first_name: '', last_name: '', grade: '', date_of_birth: '', notes: '' }

export default function Enrollment({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState([])
  const [selectedParent, setSelectedParent] = useState(null)
  const [parentForm, setParentForm] = useState(BLANK_PARENT)
  const [studentForm, setStudentForm] = useState(BLANK_STUDENT)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, parents(first_name, last_name, email, phone)')
      .order('created_at', { ascending: false })
    if (data) setStudents(data)
    setLoading(false)
  }

  const searchParents = async (q) => {
    if (q.length < 2) { setParentResults([]); return }
    const { data } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email, phone')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .eq('school_id', user.id)
      .limit(8)
    setParentResults(data || [])
  }

  const resetForm = () => {
    setParentSearch('')
    setParentResults([])
    setSelectedParent(null)
    setParentForm(BLANK_PARENT)
    setStudentForm(BLANK_STUDENT)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!studentForm.first_name || !studentForm.last_name) {
      setError('Student first and last name are required.')
      return
    }
    if (!selectedParent && (!parentForm.first_name || !parentForm.last_name || !parentForm.email)) {
      setError('Parent first name, last name, and email are required.')
      return
    }
    setSaving(true)
    setError(null)

    let parentId = selectedParent?.id

    if (!parentId) {
      const { data: newParent, error: parentError } = await supabase
        .from('parents')
        .insert([{ ...parentForm, school_id: user.id }])
        .select()
        .single()
      if (parentError) { setError(parentError.message); setSaving(false); return }
      parentId = newParent.id
    }

    const studentData = { ...studentForm, parent_id: parentId, school_id: user.id }
    if (!studentData.date_of_birth) studentData.date_of_birth = null

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single()

    if (studentError) { setError(studentError.message); setSaving(false); return }

    if (studentForm.grade) {
      await supabase.from('student_grade_history').insert([{
        student_id: newStudent.id,
        grade: studentForm.grade,
        academic_year: getAcademicYear(),
        school_id: user.id,
      }])
    }

    resetForm()
    setShowForm(false)
    fetchStudents()
    setSaving(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('students').update({ status }).eq('id', id)
    fetchStudents()
  }

  const statusColor = (status) => {
    if (status === 'Enrolled') return '#10b981'
    if (status === 'Waitlisted') return '#f59e0b'
    return '#3b82f6'
  }

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }
  const sectionLabel = { fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {!configuredGrades && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}><strong>Grade selection is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Enrollment</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage student applications and enrollment</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}
          style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          {showForm ? 'Cancel' : '+ New Student'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Student Enrollment</h3>

          {/* Parent Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={sectionLabel}>Parent / Guardian</div>

            {selectedParent ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>{selectedParent.first_name} {selectedParent.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                    {[selectedParent.email, selectedParent.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button onClick={() => { setSelectedParent(null); setParentSearch('') }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    placeholder="Search existing parent by name or email…"
                    value={parentSearch}
                    onChange={e => { setParentSearch(e.target.value); searchParents(e.target.value) }}
                    style={{ ...inputStyle, paddingLeft: '2.25rem', background: '#f9fafb' }}
                  />
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
                  {parentResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                      {parentResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedParent(p); setParentSearch(''); setParentResults([]) }}
                          style={{ padding: '0.625rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <span style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</span>
                          {p.email && <span style={{ color: '#6b7280' }}> · {p.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'First Name', key: 'first_name', required: true },
                    { label: 'Last Name', key: 'last_name', required: true },
                    { label: 'Email', key: 'email', type: 'email', required: true },
                    { label: 'Phone', key: 'phone', type: 'tel' },
                    { label: 'Address', key: 'address' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                      <input
                        type={f.type || 'text'}
                        value={parentForm[f.key]}
                        onChange={e => setParentForm({ ...parentForm, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '1.5rem 0' }} />

          {/* Student Section */}
          <div>
            <div style={sectionLabel}>Student Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={studentForm.first_name} onChange={e => setStudentForm({ ...studentForm, first_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={studentForm.last_name} onChange={e => setStudentForm({ ...studentForm, last_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input type="date" value={studentForm.date_of_birth} onChange={e => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Grade</label>
                <select
                  value={studentForm.grade}
                  onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })}
                  disabled={!configuredGrades}
                  style={{ ...inputStyle, background: !configuredGrades ? '#f3f4f6' : 'white', cursor: !configuredGrades ? 'not-allowed' : 'pointer', color: !configuredGrades ? '#9ca3af' : '#1f2937' }}
                >
                  <option value="">{configuredGrades ? 'Select grade' : 'Configure grades in Settings first'}</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={studentForm.notes} onChange={e => setStudentForm({ ...studentForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ marginTop: '1.5rem', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Student'}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading students…</p>
      ) : students.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No students yet. Add your first student above!</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Student', 'Grade', 'Parent', 'Contact', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{student.first_name} {student.last_name}</div>
                    {student.date_of_birth && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.date_of_birth}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{student.grade || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                    {student.parents ? `${student.parents.first_name} ${student.parents.last_name}` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>{student.parents?.email || <span style={{ color: '#d1d5db' }}>—</span>}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.parents?.phone || ''}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: statusColor(student.status) + '20', color: statusColor(student.status), borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                      {student.status || 'Applied'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={student.status || 'Applied'}
                      onChange={e => updateStatus(student.id, e.target.value)}
                      style={{ border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      <option>Applied</option>
                      <option>Enrolled</option>
                      <option>Waitlisted</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
