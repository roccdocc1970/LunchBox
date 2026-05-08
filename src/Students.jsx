import { useStudents } from './hooks/useStudents'
import { getDivision } from './domain/school'
import { statusColor, parentDisplayName } from './domain/students'
import StudentProfile from './StudentProfile'

export default function Students({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const h = useStudents(user, school)

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }

  // ── Profile page view ───────────────────────────────────────────────────────
  if (h.selected) {
    return <StudentProfile student={h.selected} school={school} h={h} />
  }

  // ── Roster view ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Students</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View and manage your student roster</p>
      </div>

      {!h.configuredGrades && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}><strong>Grade editing is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, parent, or email…"
          value={h.search}
          onChange={(e) => h.setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <select value={h.filterGrade} onChange={(e) => h.setFilterGrade(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
          <option value="">All Grades</option>
          {h.gradeOptions.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={h.filterStatus} onChange={(e) => h.setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
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
              <select value={h.filterDivision} onChange={e => h.setFilterDivision(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
                <option value="">All Divisions</option>
                {named.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            )
          } catch { return null }
        })()}
        {h.hasFilters && (
          <button onClick={h.clearFilters} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Clear
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['Enrolled', 'Applied', 'Waitlisted'].map((s) => (
          <div key={s} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor(s), display: 'inline-block' }} />
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{h.stats[s.toLowerCase()]}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s}</span>
          </div>
        ))}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>{h.stats.total}</span>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total</span>
        </div>
      </div>

      {/* Roster table */}
      {h.loading ? (
        <p style={{ color: '#6b7280' }}>Loading students…</p>
      ) : h.filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {h.students.length === 0 ? 'No students yet. Add students via Enrollment.' : 'No students match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Student', 'Grade', 'Parent / Guardian', 'Contact', 'Status'].map((hd) => (
                  <th key={hd} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{hd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {h.filtered.map((student, i) => (
                <tr
                  key={student.id}
                  onClick={() => h.openProfile(student)}
                  style={{ borderBottom: i < h.filtered.length - 1 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
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
            Showing {h.filtered.length} of {h.students.length} students — click a row to view profile
          </div>
        </div>
      )}
    </div>
  )
}
