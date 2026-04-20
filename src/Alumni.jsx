import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const RELATIONSHIPS = ['None', 'Donor', 'Volunteer', 'Mentor', 'Ambassador']
const DONOR_STATUSES = ['Never', 'Prospect', 'Active Donor', 'Lapsed']
const CONTACT_METHODS = ['Email', 'Phone', 'Mail']

const DONOR_COLORS = {
  'Active Donor': '#10b981',
  'Prospect': '#3b82f6',
  'Lapsed': '#f59e0b',
  'Never': '#9ca3af',
}

const RELATIONSHIP_COLORS = {
  'Donor': '#10b981',
  'Volunteer': '#3b82f6',
  'Mentor': '#8b5cf6',
  'Ambassador': '#f97316',
  'None': '#9ca3af',
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

export default function Alumni({ user, school }) {
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES

  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDonor, setFilterDonor] = useState('')
  const [filterRelationship, setFilterRelationship] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [reenrollConfirm, setReenrollConfirm] = useState(false)
  const [reenrolling, setReenrolling] = useState(false)
  const [gradeHistory, setGradeHistory] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => { fetchAlumni() }, [])

  const fetchAlumni = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('alumni')
      .select('*')
      .order('graduation_year', { ascending: false })
    if (data) setAlumni(data)
    setLoading(false)
  }

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const { first_name, last_name, graduation_year, grade_completed, email, phone, address, city, state, zip, opt_in, preferred_contact, last_contacted_date, relationship, donor_status, employer, college, notes } = editForm
    const { data, error } = await supabase
      .from('alumni')
      .update({
        first_name, last_name,
        graduation_year: graduation_year || null,
        grade_completed,
        email, phone, address, city, state, zip,
        opt_in: opt_in === 'true' || opt_in === true,
        preferred_contact,
        last_contacted_date: last_contacted_date || null,
        relationship, donor_status, employer, college, notes
      })
      .eq('id', selected.id)
      .select()
      .single()
    if (error) {
      setError(error.message)
    } else {
      setSelected(data)
      setEditing(false)
      fetchAlumni()
    }
    setSaving(false)
  }

  const deleteAlumni = async () => {
    const { error } = await supabase.from('alumni').delete().eq('id', selected.id)
    if (error) {
      setError(error.message)
    } else {
      closeProfile()
      fetchAlumni()
    }
  }

  const reenrollAsStudent = async () => {
    setReenrolling(true)
    setError(null)
    const { data: newStudent, error: insertError } = await supabase.from('students').insert([{
      first_name: selected.first_name,
      last_name: selected.last_name,
      grade: selected.grade_completed || '',
      parent_name: `${selected.first_name} ${selected.last_name}`,
      parent_email: selected.email || '',
      parent_phone: selected.phone || '',
      address: selected.address || '',
      status: 'Applied',
      school_id: user.id,
    }]).select().single()
    if (insertError) {
      setError(insertError.message)
      setReenrolling(false)
      return
    }
    // Reattach grade history to the new student record
    if (selected.original_student_id) {
      await supabase
        .from('student_grade_history')
        .update({ student_id: newStudent.id })
        .eq('student_id', selected.original_student_id)
    }
    await supabase.from('alumni').delete().eq('id', selected.id)
    setReenrolling(false)
    closeProfile()
    fetchAlumni()
  }

  const fetchGradeHistory = async (studentId) => {
    if (!studentId) return
    const { data } = await supabase
      .from('student_grade_history')
      .select('*')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: true })
    setGradeHistory(data || [])
  }

  const openProfile = (alumnus) => {
    setSelected(alumnus)
    setEditing(false)
    setDeleteConfirm(false)
    setReenrollConfirm(false)
    setError(null)
    fetchGradeHistory(alumnus.original_student_id)
  }

  const closeProfile = () => {
    setSelected(null)
    setGradeHistory([])
    setEditing(false)
    setDeleteConfirm(false)
    setReenrollConfirm(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected, opt_in: selected.opt_in ? 'true' : 'false' })
    setEditing(true)
    setDeleteConfirm(false)
  }

  const graduationYears = [...new Set(alumni.map(a => a.graduation_year).filter(Boolean))].sort((a, b) => b - a)

  const filtered = alumni.filter(a => {
    const name = `${a.first_name} ${a.last_name}`.toLowerCase()
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.employer || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.college || '').toLowerCase().includes(search.toLowerCase())
    const matchYear = !filterYear || String(a.graduation_year) === filterYear
    const matchDonor = !filterDonor || a.donor_status === filterDonor
    const matchRel = !filterRelationship || a.relationship === filterRelationship
    return matchSearch && matchYear && matchDonor && matchRel
  })

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Alumni</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Track graduates and manage long-term relationships</p>
      </div>

      {!configuredGrades && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>⚙️</span>
          <span style={{ fontSize: '0.875rem', color: '#92400e' }}>Grade options are showing all grades. <strong>Configure your grade levels in Settings → Academic Config</strong> to restrict options to your school.</span>
        </div>
      )}

      {/* Summary counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Alumni', value: alumni.length, color: '#f97316' },
          { label: 'Active Donors', value: alumni.filter(a => a.donor_status === 'Active Donor').length, color: '#10b981' },
          { label: 'Prospects', value: alumni.filter(a => a.donor_status === 'Prospect').length, color: '#3b82f6' },
          { label: 'Opted In', value: alumni.filter(a => a.opt_in).length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{s.value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email, employer, or college..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '240px' }}
        />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
          <option value="">All Years</option>
          {graduationYears.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filterDonor} onChange={e => setFilterDonor(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
          <option value="">Donor Status</option>
          {DONOR_STATUSES.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterRelationship} onChange={e => setFilterRelationship(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}>
          <option value="">Relationship</option>
          {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
        </select>
        {(search || filterYear || filterDonor || filterRelationship) && (
          <button onClick={() => { setSearch(''); setFilterYear(''); setFilterDonor(''); setFilterRelationship('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Clear
          </button>
        )}
      </div>

      {/* Alumni Grid */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading alumni...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {alumni.length === 0
              ? 'No alumni yet. Graduate students from the Students module to get started.'
              : 'No alumni match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(alumnus => (
            <div
              key={alumnus.id}
              onClick={() => openProfile(alumnus)}
              style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderTop: `3px solid ${RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af'}`, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#f97316', flexShrink: 0 }}>
                  {alumnus.first_name?.[0]}{alumnus.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>{alumnus.first_name} {alumnus.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {alumnus.graduation_year ? `Class of ${alumnus.graduation_year}` : 'Year unknown'}
                    {alumnus.grade_completed ? ` · ${alumnus.grade_completed}` : ''}
                  </div>
                </div>
              </div>

              {alumnus.employer && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>💼 {alumnus.employer}</div>}
              {alumnus.college && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>🎓 {alumnus.college}</div>}
              {alumnus.email && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {alumnus.email}</div>}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: (DONOR_COLORS[alumnus.donor_status] || '#9ca3af') + '20', color: DONOR_COLORS[alumnus.donor_status] || '#9ca3af', borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  {alumnus.donor_status || 'Never'}
                </span>
                {alumnus.relationship && alumnus.relationship !== 'None' && (
                  <span style={{ background: (RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af') + '20', color: RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af', borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '600' }}>
                    {alumnus.relationship}
                  </span>
                )}
                {!alumnus.opt_in && (
                  <span style={{ background: '#fef2f2', color: '#ef4444', borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '600' }}>
                    Opted Out
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) closeProfile() }}
        >
          <div style={{ width: '440px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            <div style={{ background: '#f97316', padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selected.first_name} {selected.last_name}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>
                      {selected.graduation_year ? `Class of ${selected.graduation_year}` : 'Graduation year unknown'}
                    </div>
                  </div>
                </div>
                <button onClick={closeProfile} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  {selected.donor_status || 'Never'}
                </span>
                {selected.relationship && selected.relationship !== 'None' && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                    {selected.relationship}
                  </span>
                )}
                <span style={{ background: selected.opt_in ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.4)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  {selected.opt_in ? '✓ Opted In' : '✗ Opted Out'}
                </span>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              {!editing ? (
                <>
                  <DrawerSection title="Alumni Info">
                    <DrawerField label="Graduation Year" value={selected.graduation_year || '—'} />
                    <DrawerField label="Grade Completed" value={selected.grade_completed || '—'} />
                    <DrawerField label="College / University" value={selected.college || '—'} />
                    <DrawerField label="Employer" value={selected.employer || '—'} />
                    {selected.notes && <DrawerField label="Notes" value={selected.notes} />}
                  </DrawerSection>

                  <DrawerSection title="Contact">
                    <DrawerField label="Email" value={selected.email || '—'} />
                    <DrawerField label="Phone" value={selected.phone || '—'} />
                    <DrawerField label="Address" value={[selected.address, selected.city, selected.state, selected.zip].filter(Boolean).join(', ') || '—'} />
                    <DrawerField label="Preferred Contact" value={selected.preferred_contact || '—'} />
                    <DrawerField label="Last Contacted" value={selected.last_contacted_date || '—'} />
                  </DrawerSection>

                  <DrawerSection title="Engagement">
                    <DrawerField label="Relationship" value={selected.relationship || 'None'} />
                    <DrawerField label="Donor Status" value={selected.donor_status || 'Never'} />
                    <DrawerField label="Opt-In" value={selected.opt_in ? 'Yes — OK to contact' : 'No — Do not contact'} />
                  </DrawerSection>

                  {gradeHistory.length > 0 && (
                    <DrawerSection title="Academic Journey">
                      <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
                        <div style={{ position: 'absolute', left: '5px', top: 0, bottom: 0, width: '2px', background: '#e5e7eb' }} />
                        {gradeHistory.map((entry, i) => {
                          const isFinal = i === gradeHistory.length - 1
                          return (
                            <div key={entry.id} style={{ position: 'relative', marginBottom: i < gradeHistory.length - 1 ? '0.875rem' : 0 }}>
                              <div style={{ position: 'absolute', left: '-1.1rem', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: isFinal ? '#f97316' : '#d1d5db', border: `2px solid ${isFinal ? '#f97316' : '#e5e7eb'}` }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: isFinal ? '600' : '400', color: isFinal ? '#f97316' : '#374151' }}>{entry.grade}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{entry.academic_year}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isFinal && <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: '500' }}>graduated</span>}
                                {entry.is_repeat && <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500' }}>repeated</span>}
                                {entry.is_skip && <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '500' }}>skipped</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </DrawerSection>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={startEdit}
                      style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Edit Profile
                    </button>
                    <button onClick={() => setDeleteConfirm(true)}
                      style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Remove
                    </button>
                  </div>

                  {/* Re-enroll as Student */}
                  <button
                    onClick={() => { setReenrollConfirm(true); setDeleteConfirm(false) }}
                    style={{ width: '100%', marginTop: '0.75rem', background: '#f0fdf4', color: '#15803d', border: '2px solid #16a34a', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                  >
                    🎒 Re-enroll as Student
                  </button>

                  {reenrollConfirm && (
                    <div style={{ marginTop: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ color: '#14532d', fontWeight: '600', margin: '0 0 0.5rem' }}>Re-enroll {selected.first_name} {selected.last_name} as a student?</p>
                      <p style={{ color: '#15803d', fontSize: '0.875rem', margin: '0 0 1rem' }}>They will be moved back to the student roster with <strong>Applied</strong> status. Their alumni record will be removed.</p>
                      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{error}</p>}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={reenrollAsStudent} disabled={reenrolling}
                          style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>
                          {reenrolling ? 'Moving...' : 'Confirm Re-enroll'}
                        </button>
                        <button onClick={() => setReenrollConfirm(false)}
                          style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {deleteConfirm && (
                    <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ color: '#991b1b', fontWeight: '600', margin: '0 0 0.5rem' }}>Remove {selected.first_name} {selected.last_name} from alumni?</p>
                      <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 1rem' }}>This cannot be undone.</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={deleteAlumni} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>Yes, Remove</button>
                        <button onClick={() => setDeleteConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div><label style={labelStyle}>First Name</label><input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Last Name</label><input name="last_name" value={editForm.last_name || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div><label style={labelStyle}>Graduation Year</label><input type="number" name="graduation_year" value={editForm.graduation_year || ''} onChange={handleEditChange} placeholder="e.g. 2024" style={inputStyle} /></div>
                      <div>
                        <label style={labelStyle}>Grade Completed</label>
                        <select name="grade_completed" value={editForm.grade_completed || ''} onChange={handleEditChange} style={inputStyle}>
                          <option value="">Unknown</option>
                          {GRADES.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label style={labelStyle}>Email</label><input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Phone</label><input type="tel" name="phone" value={editForm.phone || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Address</label><input name="address" value={editForm.address || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                      <div><label style={labelStyle}>City</label><input name="city" value={editForm.city || ''} onChange={handleEditChange} style={inputStyle} /></div>
                      <div><label style={labelStyle}>State</label><input name="state" value={editForm.state || ''} onChange={handleEditChange} style={inputStyle} /></div>
                      <div><label style={labelStyle}>ZIP</label><input name="zip" value={editForm.zip || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    </div>
                    <div><label style={labelStyle}>Employer</label><input name="employer" value={editForm.employer || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>College / University</label><input name="college" value={editForm.college || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div>
                      <label style={labelStyle}>Relationship</label>
                      <select name="relationship" value={editForm.relationship || 'None'} onChange={handleEditChange} style={inputStyle}>
                        {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Donor Status</label>
                      <select name="donor_status" value={editForm.donor_status || 'Never'} onChange={handleEditChange} style={inputStyle}>
                        {DONOR_STATUSES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Preferred Contact Method</label>
                      <select name="preferred_contact" value={editForm.preferred_contact || 'Email'} onChange={handleEditChange} style={inputStyle}>
                        {CONTACT_METHODS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Last Contacted Date</label><input type="date" name="last_contacted_date" value={editForm.last_contacted_date || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div>
                      <label style={labelStyle}>Opt-In to Communications</label>
                      <select name="opt_in" value={editForm.opt_in} onChange={handleEditChange} style={inputStyle}>
                        <option value="true">Yes — OK to contact</option>
                        <option value="false">No — Do not contact</option>
                      </select>
                    </div>
                    <div><label style={labelStyle}>Notes</label><textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={saveEdit} disabled={saving}
                      style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)}
                      style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>
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

function DrawerSection({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{title}</div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>{children}</div>
    </div>
  )
}

function DrawerField({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}
