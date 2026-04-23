import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const STATUS_COLORS = {
  Enrolled: '#10b981',
  Waitlisted: '#f59e0b',
  Applied: '#3b82f6',
}

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

const initials = (p) => {
  if (!p) return '?'
  const f = p.first_name?.[0] || ''
  const l = p.last_name?.[0] || ''
  return (f + l).toUpperCase() || '?'
}

export default function Parents({ user, school, onCompose }) {
  const primaryColor = school?.primary_color || '#f97316'

  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterDivision, setFilterDivision] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { fetchParents() }, [])

  const fetchParents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('parents')
      .select('*, students(id, first_name, last_name, grade, status)')
      .order('last_name', { ascending: true })
    if (data) setParents(data)
    setLoading(false)
  }

  const parsedDivisions = (() => {
    try {
      const d = school?.divisions
      if (!d) return []
      const arr = typeof d === 'string' ? JSON.parse(d) : d
      return Array.isArray(arr) ? arr : []
    } catch { return [] }
  })()

  const hasDivisions = parsedDivisions.some(d => d.grades?.length > 0)

  const allStudentGrades = [...new Set(parents.flatMap(p => (p.students || []).map(s => s.grade).filter(Boolean)))]
    .sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))

  const configuredGrades = (() => {
    try {
      const g = JSON.parse(school?.grades_offered)
      if (Array.isArray(g) && g.length > 0) return [...g].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
    } catch {}
    return null
  })()

  const gradeOptions = configuredGrades || allStudentGrades
  const divisionOptions = parsedDivisions.filter(d => d.grades?.length > 0).map(d => d.name)

  const filtered = parents.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.students || []).some(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q))

    const matchesGrade = !filterGrade || (p.students || []).some(s => s.grade === filterGrade)

    const matchesDivision = !filterDivision || (p.students || []).some(s => {
      const div = getDivision(s.grade, parsedDivisions)
      return div?.name === filterDivision
    })

    return matchesSearch && matchesGrade && matchesDivision
  })

  const startEdit = (p) => {
    setEditForm({ first_name: p.first_name, last_name: p.last_name, email: p.email || '', phone: p.phone || '', address: p.address || '', notes: p.notes || '' })
    setEditing(true)
    setError(null)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('parents')
      .update(editForm)
      .eq('id', selected.id)
      .select('*, students(id, first_name, last_name, grade, status)')
      .single()
    if (error) {
      setError(error.message)
    } else {
      setSelected(data)
      setEditing(false)
      fetchParents()
    }
    setSaving(false)
  }

  const inputStyle = { border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Parent Directory</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            {filtered.length} parent{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          placeholder="Search by parent or student name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
          <option value="">All Grades</option>
          {gradeOptions.map(g => <option key={g}>{g}</option>)}
        </select>
        {hasDivisions && (
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
            <option value="">All Divisions</option>
            {divisionOptions.map(d => <option key={d}>{d}</option>)}
          </select>
        )}
        {(search || filterGrade || filterDivision) && (
          <button onClick={() => { setSearch(''); setFilterGrade(''); setFilterDivision('') }} style={{ ...inputStyle, cursor: 'pointer', color: '#6b7280', width: 'auto' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
          {parents.length === 0
            ? 'No parents yet. Add students via Enrollment to populate the directory.'
            : 'No parents match your filters.'}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Parent', 'Email', 'Phone', 'Student(s)', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => { setSelected(p); setEditing(false); setError(null) }}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: primaryColor + '20', color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                        {initials(p)}
                      </div>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{p.first_name} {p.last_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{p.email || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{p.phone || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {(p.students || []).map(s => {
                        const div = getDivision(s.grade, parsedDivisions)
                        return (
                          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#f3f4f6', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.78rem', color: '#374151', fontWeight: '500' }}>
                            {s.first_name} {s.last_name}
                            {s.grade && <span style={{ color: div?.color || '#9ca3af', fontWeight: '600' }}>· {s.grade}</span>}
                          </span>
                        )
                      })}
                      {(p.students || []).length === 0 && <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {p.email && (
                      <button
                        onClick={e => { e.stopPropagation(); onCompose && onCompose(p) }}
                        style={{ background: 'transparent', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.78rem', color: primaryColor, cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}
                      >
                        ✉ Message
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', justifyContent: 'flex-end' }} onClick={() => { setSelected(null); setEditing(false) }}>
          <div style={{ width: '420px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

            <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: primaryColor + '20', color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
                    {initials(selected)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1f2937' }}>{selected.first_name} {selected.last_name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {(selected.students || []).length} linked student{(selected.students || []).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setEditing(false) }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

              {!editing ? (
                <>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Contact</div>
                    {[
                      { label: 'Email', value: selected.email },
                      { label: 'Phone', value: selected.phone },
                      { label: 'Address', value: selected.address },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.4rem 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', width: '56px', flexShrink: 0, paddingTop: '1px' }}>{row.label}</span>
                        <span style={{ fontSize: '0.875rem', color: row.value ? '#1f2937' : '#d1d5db' }}>{row.value || '—'}</span>
                      </div>
                    ))}
                    {selected.notes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>{selected.notes}</div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Linked Students</div>
                    {(selected.students || []).length === 0 ? (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>No students linked to this parent.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {(selected.students || []).map(s => {
                          const div = getDivision(s.grade, parsedDivisions)
                          return (
                            <div key={s.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.75rem 1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{s.first_name} {s.last_name}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: STATUS_COLORS[s.status] || '#9ca3af', background: (STATUS_COLORS[s.status] || '#9ca3af') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                                  {s.status}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                                {s.grade && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{s.grade}</span>}
                                {div && <span style={{ fontSize: '0.78rem', fontWeight: '600', color: div.color, background: div.color + '15', borderRadius: '9999px', padding: '0.1rem 0.45rem' }}>{div.name}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={saveEdit} disabled={saving} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '700', cursor: 'pointer' }}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!editing && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => startEdit(selected)}
                  style={{ flex: 1, background: 'white', color: primaryColor, border: `1px solid ${primaryColor}`, borderRadius: '0.625rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Edit Contact
                </button>
                {selected.email && (
                  <button
                    onClick={() => { onCompose && onCompose(selected); setSelected(null) }}
                    style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.625rem', padding: '0.5rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    ✉ Send Message
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
