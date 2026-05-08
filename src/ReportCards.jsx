import { useReportCards } from './hooks/useReportCards'
import { GRADE_COLORS, gradedCount } from './domain/reportCards'
import { parseDivisions } from './domain/school'

export default function ReportCards({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    students, loading, filtered, stats,
    showForm, openForm, closeForm,
    form, setForm, saving, error,
    handleStudentSelect, handleGradeChange, submit,
    selected, setSelected,
    togglePublished, remove,
    search, setSearch,
    filterTerm, setFilterTerm,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
    terms, gradeOptions,
  } = useReportCards(user.id, school)

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: '500',
    color: '#6b7280', marginBottom: '0.25rem',
  }

  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
  const hasFilters = search || filterTerm || filterStatus || filterDivision

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Report Cards</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Create and manage student report cards by term</p>
        </div>
        <button
          onClick={showForm ? closeForm : openForm}
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

          <button onClick={submit} disabled={saving}
            style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
            {saving ? 'Saving...' : 'Save Report Card'}
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: stats.total, color: '#6b7280' },
          { label: 'Published', count: stats.published, color: '#10b981' },
          { label: 'Draft', count: stats.draft, color: '#f59e0b' },
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
        {divisions.length > 0 && (
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={clearFilters}
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
            {stats.total === 0 ? 'No report cards yet. Create your first one above.' : 'No report cards match your filters.'}
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

              {selected.teacher_notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Teacher Notes</div>
                  <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>
                    {selected.teacher_notes}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                Created {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>

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
                  onClick={() => { if (window.confirm(`Delete ${selected.student_name}'s ${selected.term} report card?`)) remove(selected.id) }}
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
