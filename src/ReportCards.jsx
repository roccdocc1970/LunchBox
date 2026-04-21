import { useState, useEffect } from 'react'
import { supabase } from './supabase'

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

const DEFAULT_SUBJECTS = [
  'Reading / ELA', 'Writing', 'Mathematics', 'Science',
  'Social Studies', 'Art', 'Music', 'Physical Education', 'Social-Emotional Learning',
]

const GRADE_OPTIONS = {
  Letter: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'INC', 'N/A'],
  Standards: ['4 - Exceeds', '3 - Meets', '2 - Approaching', '1 - Beginning', 'N/A'],
  Satisfactory: ['E - Excellent', 'S - Satisfactory', 'N - Needs Improvement', 'N/A'],
}

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#10b981',
  'B+': '#3b82f6', 'B': '#3b82f6', 'B-': '#3b82f6',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#f59e0b',
  'D+': '#ef4444', 'D': '#ef4444', 'F': '#ef4444',
  '4 - Exceeds': '#10b981', '3 - Meets': '#3b82f6',
  '2 - Approaching': '#f59e0b', '1 - Beginning': '#ef4444',
  'E - Excellent': '#10b981', 'S - Satisfactory': '#3b82f6',
  'N - Needs Improvement': '#ef4444',
}

const getTerms = (gradingPeriod) => {
  if (gradingPeriod === 'Trimesters') return ['T1', 'T2', 'T3']
  if (gradingPeriod === 'Semesters') return ['S1 - Fall', 'S2 - Spring']
  if (gradingPeriod === 'Annual') return ['Annual']
  return ['Q1', 'Q2', 'Q3', 'Q4']
}

const getAcademicYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

const parseSubjects = (val) => {
  try {
    const s = JSON.parse(val)
    if (Array.isArray(s) && s.length > 0) return s
  } catch {}
  return DEFAULT_SUBJECTS
}

export default function ReportCards({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const terms = getTerms(school?.grading_period)
  const gradeOptions = GRADE_OPTIONS[school?.grading_scale] || GRADE_OPTIONS.Letter
  const subjects = parseSubjects(school?.subjects_offered)

  const emptyForm = () => ({
    student_id: '',
    student_name: '',
    student_grade: '',
    academic_year: school?.academic_year || getAcademicYear(),
    term: terms[0],
    grades: subjects.map(s => ({ subject: s, grade: '', comment: '' })),
    teacher_notes: '',
  })

  const [reportCards, setReportCards] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDivision, setFilterDivision] = useState('')
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    fetchReportCards()
    fetchStudents()
  }, [])

  const fetchReportCards = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('report_cards')
      .select('*')
      .eq('school_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setReportCards(data)
    setLoading(false)
  }

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, grade')
      .eq('school_id', user.id)
      .eq('status', 'Enrolled')
      .order('last_name')
    if (data) setStudents(data)
  }

  const handleStudentSelect = (studentId) => {
    const s = students.find(st => st.id === studentId)
    setForm({
      ...form,
      student_id: studentId,
      student_name: s ? `${s.first_name} ${s.last_name}` : '',
      student_grade: s?.grade || '',
    })
  }

  const handleGradeChange = (idx, field, value) => {
    const updated = [...form.grades]
    updated[idx] = { ...updated[idx], [field]: value }
    setForm({ ...form, grades: updated })
  }

  const handleSubmit = async () => {
    if (!form.student_id) { setError('Please select a student.'); return }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('report_cards').insert([{
      student_id: form.student_id,
      student_name: form.student_name,
      student_grade: form.student_grade,
      academic_year: form.academic_year,
      term: form.term,
      grades: form.grades,
      teacher_notes: form.teacher_notes,
      published: false,
      school_id: user.id,
    }])
    if (err) {
      setError(err.message)
    } else {
      setForm(emptyForm())
      setShowForm(false)
      fetchReportCards()
    }
    setSaving(false)
  }

  const togglePublished = async (rc) => {
    const next = !rc.published
    await supabase.from('report_cards').update({ published: next }).eq('id', rc.id)
    setSelected(prev => prev ? { ...prev, published: next } : null)
    setReportCards(prev => prev.map(r => r.id === rc.id ? { ...r, published: next } : r))
  }

  const deleteReportCard = async (id) => {
    await supabase.from('report_cards').delete().eq('id', id)
    setSelected(null)
    fetchReportCards()
  }

  const filtered = reportCards.filter(rc => {
    const matchSearch = !search || rc.student_name?.toLowerCase().includes(search.toLowerCase())
    const matchTerm = !filterTerm || rc.term === filterTerm
    const matchStatus = !filterStatus ||
      (filterStatus === 'published' ? rc.published : !rc.published)
    const matchDivision = !filterDivision || getDivision(rc.student_grade, school?.divisions)?.name === filterDivision
    return matchSearch && matchTerm && matchStatus && matchDivision
  })

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: '500',
    color: '#6b7280', marginBottom: '0.25rem',
  }

  const gradedCount = (grades) => (grades || []).filter(g => g.grade && g.grade !== '').length

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Report Cards</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Create and manage student report cards by term</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); setForm(emptyForm()) }}
          style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          {showForm ? 'Cancel' : '+ New Report Card'}
        </button>
      </div>

      {/* Config nudge */}
      {!school?.grading_scale && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#1d4ed8' }}>
          💡 Using default <strong>Letter Grade</strong> scale and standard subjects. Configure both in <strong>School Settings → Academic Config</strong>.
        </div>
      )}

      {/* New Report Card Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Report Card</h3>

          {/* Top fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Student <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.student_id} onChange={e => handleStudentSelect(e.target.value)} style={inputStyle}>
                <option value="">Select enrolled student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}{s.grade ? ` — ${s.grade}` : ''}</option>
                ))}
              </select>
              {students.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.3rem' }}>No enrolled students found. Enroll students first.</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Term</label>
              <select value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} style={inputStyle}>
                {terms.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Academic Year</label>
              <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} style={inputStyle} placeholder="e.g. 2025-2026" />
            </div>
          </div>

          {/* Grades grid */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
              Subject Grades <span style={{ fontWeight: '400', color: '#9ca3af', fontSize: '0.8rem' }}>({school?.grading_scale || 'Letter'} scale)</span>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 160px 1fr', background: '#f9fafb', padding: '0.625rem 1rem', borderBottom: '1px solid #e5e7eb', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Subject</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Grade</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Teacher Comment</span>
              </div>
              {form.grades.map((g, i) => (
                <div key={g.subject} style={{ display: 'grid', gridTemplateColumns: '200px 160px 1fr', padding: '0.5rem 1rem', borderBottom: i < form.grades.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>{g.subject}</span>
                  <select
                    value={g.grade}
                    onChange={e => handleGradeChange(i, 'grade', e.target.value)}
                    style={{ ...inputStyle, width: '100%', color: GRADE_COLORS[g.grade] || '#374151', fontWeight: g.grade ? '600' : '400' }}
                  >
                    <option value="">—</option>
                    {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input
                    value={g.comment}
                    onChange={e => handleGradeChange(i, 'comment', e.target.value)}
                    placeholder="Optional comment..."
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Teacher notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, fontSize: '0.875rem' }}>Overall Teacher Notes</label>
            <textarea
              value={form.teacher_notes}
              onChange={e => setForm({ ...form, teacher_notes: e.target.value })}
              rows={3}
              placeholder="General comments about the student's progress this term..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={saving}
            style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
            {saving ? 'Saving...' : 'Save Report Card'}
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: reportCards.length, color: '#6b7280' },
          { label: 'Published', count: reportCards.filter(r => r.published).length, color: '#10b981' },
          { label: 'Draft', count: reportCards.filter(r => !r.published).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{s.count}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by student name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="">All Terms</option>
          {terms.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {(() => {
          try {
            const divs = school?.divisions ? (typeof school.divisions === 'string' ? JSON.parse(school.divisions) : school.divisions) : []
            const named = Array.isArray(divs) ? divs.filter(d => d.grades?.length > 0) : []
            if (named.length === 0) return null
            return (
              <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
                <option value="">All Divisions</option>
                {named.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            )
          } catch { return null }
        })()}
        {(search || filterTerm || filterStatus || filterDivision) && (
          <button onClick={() => { setSearch(''); setFilterTerm(''); setFilterStatus(''); setFilterDivision('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading report cards...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {reportCards.length === 0 ? 'No report cards yet. Create your first one above.' : 'No report cards match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Student', 'Grade Level', 'Term', 'Year', 'Graded', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rc, i) => (
                <tr key={rc.id}
                  onClick={() => setSelected(rc)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1f2937' }}>{rc.student_name || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{rc.student_grade || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{rc.term}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{rc.academic_year}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                    {gradedCount(rc.grades)}/{(rc.grades || []).length}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      background: rc.published ? '#f0fdf4' : '#f9fafb',
                      color: rc.published ? '#15803d' : '#6b7280',
                      border: `1px solid ${rc.published ? '#bbf7d0' : '#e5e7eb'}`,
                      borderRadius: '9999px', padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem', fontWeight: '600',
                    }}>
                      {rc.published ? '✓ Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#9ca3af' }}>
            {filtered.length} report card{filtered.length !== 1 ? 's' : ''} — click a row to view
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ width: '520px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            {/* Drawer header */}
            <div style={{ background: primaryColor, padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.student_name}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: '0.25rem' }}>
                    {selected.term} · {selected.academic_year}{selected.student_grade ? ` · ${selected.student_grade}` : ''}
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <span style={{
                display: 'inline-block', marginTop: '0.75rem',
                background: selected.published ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600',
              }}>
                {selected.published ? '✓ Published' : 'Draft'}
              </span>
            </div>

            <div style={{ padding: '1.5rem' }}>

              {/* Grades */}
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Subject Grades</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                {(selected.grades || []).map((g, i) => (
                  <div key={g.subject} style={{
                    padding: '0.75rem 1rem',
                    borderBottom: i < selected.grades.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>{g.subject}</div>
                      {g.comment && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem', lineHeight: 1.4 }}>{g.comment}</div>}
                    </div>
                    <span style={{
                      fontWeight: '700', fontSize: '0.9rem',
                      color: GRADE_COLORS[g.grade] || (g.grade ? primaryColor : '#d1d5db'),
                      minWidth: '80px', textAlign: 'right', flexShrink: 0,
                    }}>
                      {g.grade || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Teacher notes */}
              {selected.teacher_notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Teacher Notes</div>
                  <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>
                    {selected.teacher_notes}
                  </div>
                </div>
              )}

              {/* Created date */}
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                Created {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => togglePublished(selected)}
                  style={{
                    flex: 1, background: selected.published ? 'white' : primaryColor,
                    color: selected.published ? '#374151' : 'white',
                    border: selected.published ? '1px solid #d1d5db' : 'none',
                    borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
                  }}>
                  {selected.published ? 'Revert to Draft' : '✓ Publish Report Card'}
                </button>
                <button
                  onClick={() => { if (window.confirm(`Delete ${selected.student_name}'s ${selected.term} report card?`)) deleteReportCard(selected.id) }}
                  style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
