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

export default function Enrollment({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    grade: '',
    date_of_birth: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setStudents(data)
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert([{ ...form, school_id: user.id }])
      .select()
      .single()
    if (error) {
      setError(error.message)
    } else {
      if (form.grade) {
        await supabase.from('student_grade_history').insert([{
          student_id: newStudent.id,
          grade: form.grade,
          academic_year: getAcademicYear(),
          school_id: user.id,
        }])
      }
      setForm({
        first_name: '', last_name: '', grade: '', date_of_birth: '',
        parent_name: '', parent_email: '', parent_phone: '', address: '', notes: ''
      })
      setShowForm(false)
      fetchStudents()
    }
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {!configuredGrades && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}><strong>Grade selection is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Enrollment</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage student applications and enrollment</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          {showForm ? 'Cancel' : '+ New Student'}
        </button>
      </div>

      {/* Enrollment Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Student Enrollment</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'First Name', name: 'first_name', type: 'text', required: true },
              { label: 'Last Name', name: 'last_name', type: 'text', required: true },
              { label: 'Date of Birth', name: 'date_of_birth', type: 'date' },
              { label: 'Parent/Guardian Name', name: 'parent_name', type: 'text', required: true },
              { label: 'Parent Email', name: 'parent_email', type: 'email', required: true },
              { label: 'Parent Phone', name: 'parent_phone', type: 'tel' },
              { label: 'Address', name: 'address', type: 'text' },
            ].map((field) => (
              <div key={field.name}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder || ''}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Grade</label>
              <select name="grade" value={form.grade} onChange={handleChange} disabled={!configuredGrades}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', background: !configuredGrades ? '#f3f4f6' : 'white', cursor: !configuredGrades ? 'not-allowed' : 'pointer', color: !configuredGrades ? '#9ca3af' : '#1f2937' }}>
                <option value="">{configuredGrades ? 'Select grade' : 'Configure grades in Settings first'}</option>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ marginTop: '1.5rem', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
          >
            {saving ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading students...</p>
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
                {['Student', 'Grade', 'Parent', 'Contact', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{student.first_name} {student.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.date_of_birth || ''}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{student.grade}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{student.parent_name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>{student.parent_email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.parent_phone}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: statusColor(student.status) + '20', color: statusColor(student.status), borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={student.status}
                      onChange={(e) => updateStatus(student.id, e.target.value)}
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