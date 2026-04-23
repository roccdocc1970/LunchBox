import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const STATUSES = ['New Inquiry', 'Toured', 'Applied', 'Withdrawn']

const SOURCES = ['Web', 'Tour', 'Referral', 'Word of Mouth', 'Social Media', 'Other']

const STATUS_COLORS = {
  'New Inquiry': '#3b82f6',
  'Toured':      '#8b5cf6',
  'Applied':     '#f97316',
  'Withdrawn':   '#9ca3af',
}

const SOURCE_COLORS = {
  'Web':           '#0ea5e9',
  'Tour':          '#8b5cf6',
  'Referral':      '#10b981',
  'Word of Mouth': '#f59e0b',
  'Social Media':  '#ec4899',
  'Other':         '#9ca3af',
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

const today = () => new Date().toISOString().split('T')[0]

const BLANK_FORM = {
  parent_first_name: '', parent_last_name: '', email: '', phone: '',
  student_first_name: '', student_last_name: '', grade_applying_for: '',
  status: 'New Inquiry', source: 'Other', inquiry_date: today(), tour_date: '', notes: '',
}

export default function Admissions({ user, school, onNavigate }) {
  const primaryColor = school?.primary_color || '#f97316'
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES

  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterGrade, setFilterGrade] = useState('')

  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [convertConfirm, setConvertConfirm] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyApplicationLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?apply=${user.id}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  useEffect(() => { fetchInquiries() }, [])

  const fetchInquiries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setInquiries(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.parent_first_name || !form.parent_last_name || !form.student_first_name || !form.student_last_name) {
      setError('Parent name and student name are required.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = { ...form, school_id: user.id }
    if (!payload.tour_date) payload.tour_date = null
    const { error: err } = await supabase.from('inquiries').insert([payload])
    if (err) { setError(err.message) } else { setForm(BLANK_FORM); setShowForm(false); fetchInquiries() }
    setSaving(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const payload = { ...editForm }
    if (!payload.tour_date) payload.tour_date = null
    const { data, error: err } = await supabase
      .from('inquiries').update(payload).eq('id', selected.id)
      .select().single()
    if (err) { setError(err.message) } else { setSelected(data); setEditing(false); fetchInquiries() }
    setSaving(false)
  }

  const convertToStudent = async () => {
    setConverting(true)
    setError(null)

    let parentId = null
    if (selected.email) {
      const { data: existing } = await supabase
        .from('parents').select('id').eq('email', selected.email).eq('school_id', user.id).maybeSingle()
      if (existing) parentId = existing.id
    }

    if (!parentId) {
      const { data: newParent, error: pErr } = await supabase
        .from('parents')
        .insert([{ school_id: user.id, first_name: selected.parent_first_name, last_name: selected.parent_last_name, email: selected.email || null, phone: selected.phone || null }])
        .select().single()
      if (pErr) { setError(pErr.message); setConverting(false); return }
      parentId = newParent.id
    }

    const { data: newStudent, error: sErr } = await supabase
      .from('students')
      .insert([{ school_id: user.id, first_name: selected.student_first_name, last_name: selected.student_last_name, grade: selected.grade_applying_for || null, parent_id: parentId, status: 'Applied' }])
      .select().single()
    if (sErr) { setError(sErr.message); setConverting(false); return }

    if (selected.grade_applying_for) {
      await supabase.from('student_grade_history').insert([{ student_id: newStudent.id, grade: selected.grade_applying_for, academic_year: getAcademicYear(), school_id: user.id }])
    }

    await supabase.from('inquiries').update({ status: 'Applied' }).eq('id', selected.id)
    setSelected({ ...selected, status: 'Applied' })
    setConvertConfirm(false)
    setConvertSuccess(true)
    setConverting(false)
    fetchInquiries()
  }

  const closeDrawer = () => {
    setSelected(null); setEditing(false); setConvertConfirm(false)
    setConvertSuccess(false); setError(null)
  }

  const filtered = inquiries.filter(inq => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${inq.student_first_name} ${inq.student_last_name}`.toLowerCase().includes(q) ||
      `${inq.parent_first_name} ${inq.parent_last_name}`.toLowerCase().includes(q) ||
      (inq.email || '').toLowerCase().includes(q)
    const matchStatus = !filterStatus || inq.status === filterStatus
    const matchSource = !filterSource || inq.source === filterSource
    const matchGrade  = !filterGrade  || inq.grade_applying_for === filterGrade
    return matchSearch && matchStatus && matchSource && matchGrade
  })

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: inquiries.filter(i => i.status === s).length }), {})
  const sourceCounts = SOURCES.reduce((acc, s) => {
    const n = inquiries.filter(i => i.source === s).length
    return n > 0 ? { ...acc, [s]: n } : acc
  }, {})

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const secLabel  = { fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }
  const filterStyle = { border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', background: 'white' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Admissions</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>Track prospective families from first contact to enrollment</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={copyApplicationLink}
            style={{ background: linkCopied ? '#10b981' : 'white', color: linkCopied ? 'white' : primaryColor, border: `1.5px solid ${linkCopied ? '#10b981' : primaryColor}`, borderRadius: '0.5rem', padding: '0.625rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s' }}
          >
            {linkCopied ? '✓ Link Copied!' : '🔗 Copy Application Link'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setError(null); if (showForm) setForm(BLANK_FORM) }}
            style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            {showForm ? 'Cancel' : '+ New Inquiry'}
          </button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {STATUSES.map(s => (
          <div
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            style={{ background: 'white', borderRadius: '0.875rem', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: `4px solid ${filterStatus === s ? STATUS_COLORS[s] : '#e5e7eb'}`, transition: 'border-color 0.15s' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: STATUS_COLORS[s] }}>{counts[s]}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500', marginTop: '0.1rem' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Source breakdown */}
      {Object.keys(sourceCounts).length > 0 && (
        <div style={{ background: 'white', borderRadius: '0.875rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sources</span>
          {Object.entries(sourceCounts).map(([src, n]) => (
            <span
              key={src}
              onClick={() => setFilterSource(filterSource === src ? '' : src)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: SOURCE_COLORS[src] + '15', color: SOURCE_COLORS[src], fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', border: filterSource === src ? `1.5px solid ${SOURCE_COLORS[src]}` : '1.5px solid transparent' }}
            >
              {src} <span style={{ fontWeight: '800' }}>{n}</span>
            </span>
          ))}
        </div>
      )}

      {/* New Inquiry Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Inquiry</h3>

          {/* Parent */}
          <div style={secLabel}>Parent / Guardian</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <FormField label="First Name" required><input value={form.parent_first_name} onChange={e => setForm({ ...form, parent_first_name: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Last Name" required><input value={form.parent_last_name} onChange={e => setForm({ ...form, parent_last_name: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Phone"><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></FormField>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0 0 1.5rem' }} />

          {/* Student */}
          <div style={secLabel}>Student</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <FormField label="First Name" required><input value={form.student_first_name} onChange={e => setForm({ ...form, student_first_name: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Last Name" required><input value={form.student_last_name} onChange={e => setForm({ ...form, student_last_name: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Grade Applying For">
              <select value={form.grade_applying_for} onChange={e => setForm({ ...form, grade_applying_for: e.target.value })} style={inputStyle}>
                <option value="">Unknown</option>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </FormField>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0 0 1.5rem' }} />

          {/* Pipeline */}
          <div style={secLabel}>Pipeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <FormField label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="How They Found Us">
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={inputStyle}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Inquiry Date">
              <input type="date" value={form.inquiry_date} onChange={e => setForm({ ...form, inquiry_date: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Tour Date">
              <input type="date" value={form.tour_date} onChange={e => setForm({ ...form, tour_date: e.target.value })} style={inputStyle} />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={saving} style={{ marginTop: '1.25rem', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Inquiry'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <input
          placeholder="Search by student or parent name, email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...filterStyle, flex: '1', minWidth: '220px' }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterStyle}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={filterStyle}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={filterStyle}>
          <option value="">All Grades</option>
          {GRADES.map(g => <option key={g}>{g}</option>)}
        </select>
        {(search || filterStatus || filterSource || filterGrade) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterSource(''); setFilterGrade('') }} style={{ ...filterStyle, cursor: 'pointer', color: '#6b7280' }}>Clear</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
          <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>
            {inquiries.length === 0 ? 'No inquiries yet. Add your first prospective family above.' : 'No inquiries match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Student', 'Grade', 'Parent', 'Contact', 'Source', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inq, i) => (
                <tr
                  key={inq.id}
                  onClick={() => { setSelected(inq); setEditing(false); setConvertConfirm(false); setConvertSuccess(false); setError(null) }}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: '600', color: '#1f2937' }}>{inq.student_first_name} {inq.student_last_name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{inq.grade_applying_for || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{inq.parent_first_name} {inq.parent_last_name}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>{inq.email || <span style={{ color: '#d1d5db' }}>—</span>}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{inq.phone || ''}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: SOURCE_COLORS[inq.source] || '#9ca3af', background: (SOURCE_COLORS[inq.source] || '#9ca3af') + '15', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{inq.source}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>{inq.inquiry_date || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: STATUS_COLORS[inq.status], background: STATUS_COLORS[inq.status] + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{inq.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '0.625rem 1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '0.78rem', color: '#9ca3af' }}>
            Showing {filtered.length} of {inquiries.length} inquiries — click a row to view
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', justifyContent: 'flex-end' }} onClick={closeDrawer}>
          <div style={{ width: '440px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div style={{ background: primaryColor, padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selected.student_first_name} {selected.student_last_name}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.2rem' }}>{selected.grade_applying_for ? `Applying for ${selected.grade_applying_for}` : 'Grade not specified'}</div>
                </div>
                <button onClick={closeDrawer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>{selected.status}</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem' }}>{selected.source}</span>
              </div>
            </div>

            <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

              {convertSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
                  <div style={{ fontWeight: '600', color: '#15803d', fontSize: '0.9rem' }}>✓ Converted to student successfully</div>
                  <p style={{ color: '#166534', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Parent and student records created in Enrollment.</p>
                  <button onClick={() => { closeDrawer(); onNavigate && onNavigate('enrollment') }} style={{ marginTop: '0.625rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                    View in Enrollment →
                  </button>
                </div>
              )}

              {!editing ? (
                <>
                  <DrawerSection title="Parent / Guardian">
                    <DrawerField label="Name" value={`${selected.parent_first_name} ${selected.parent_last_name}`} />
                    <DrawerField label="Email" value={selected.email} />
                    <DrawerField label="Phone" value={selected.phone} />
                  </DrawerSection>

                  <DrawerSection title="Inquiry Details">
                    <DrawerField label="Status" value={selected.status} />
                    <DrawerField label="Source" value={selected.source} />
                    <DrawerField label="Inquiry Date" value={selected.inquiry_date} />
                    <DrawerField label="Tour Date" value={selected.tour_date} />
                  </DrawerSection>

                  {selected.notes && (
                    <DrawerSection title="Notes">
                      <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.6 }}>{selected.notes}</p>
                    </DrawerSection>
                  )}

                  {/* Convert to Student */}
                  {(selected.status === 'New Inquiry' || selected.status === 'Toured') && !convertSuccess && (
                    <>
                      <button
                        onClick={() => setConvertConfirm(true)}
                        style={{ width: '100%', background: '#fff7ed', color: primaryColor, border: `2px solid ${primaryColor}`, borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        🎒 Convert to Student
                      </button>

                      {convertConfirm && (
                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem' }}>
                          <p style={{ color: '#9a3412', fontWeight: '600', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Convert {selected.student_first_name} {selected.student_last_name} to a student?</p>
                          <p style={{ color: '#c2410c', fontSize: '0.8rem', margin: '0 0 0.875rem', lineHeight: 1.5 }}>
                            A parent record and student application will be created in Enrollment. This inquiry will be marked as Applied.
                            {selected.email && <><br />Parent email <strong>{selected.email}</strong> will be checked for duplicates.</>}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={convertToStudent} disabled={converting} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                              {converting ? 'Converting…' : 'Yes, Convert'}
                            </button>
                            <button onClick={() => setConvertConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* Edit Mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parent / Guardian</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>First Name</label><input value={editForm.parent_first_name || ''} onChange={e => setEditForm({ ...editForm, parent_first_name: e.target.value })} style={inputStyle} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Last Name</label><input value={editForm.parent_last_name || ''} onChange={e => setEditForm({ ...editForm, parent_last_name: e.target.value })} style={inputStyle} /></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Email</label><input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Phone</label><input type="tel" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} /></div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>First Name</label><input value={editForm.student_first_name || ''} onChange={e => setEditForm({ ...editForm, student_first_name: e.target.value })} style={inputStyle} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Last Name</label><input value={editForm.student_last_name || ''} onChange={e => setEditForm({ ...editForm, student_last_name: e.target.value })} style={inputStyle} /></div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Grade Applying For</label>
                    <select value={editForm.grade_applying_for || ''} onChange={e => setEditForm({ ...editForm, grade_applying_for: e.target.value })} style={inputStyle}>
                      <option value="">Unknown</option>
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Status</label>
                      <select value={editForm.status || 'New Inquiry'} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Source</label>
                      <select value={editForm.source || 'Other'} onChange={e => setEditForm({ ...editForm, source: e.target.value })} style={inputStyle}>
                        {SOURCES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Inquiry Date</label><input type="date" value={editForm.inquiry_date || ''} onChange={e => setEditForm({ ...editForm, inquiry_date: e.target.value })} style={inputStyle} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Tour Date</label><input type="date" value={editForm.tour_date || ''} onChange={e => setEditForm({ ...editForm, tour_date: e.target.value })} style={inputStyle} /></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Notes</label><textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>

                  {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={saveEdit} disabled={saving} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '700', cursor: 'pointer' }}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {!editing && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6' }}>
                <button
                  onClick={() => { setEditForm({ ...selected }); setEditing(true); setConvertConfirm(false) }}
                  style={{ width: '100%', background: 'white', color: primaryColor, border: `1px solid ${primaryColor}`, borderRadius: '0.625rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Edit Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function DrawerSection({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>{children}</div>
    </div>
  )
}

function DrawerField({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: value ? '#1f2937' : '#d1d5db', fontWeight: '500', textAlign: 'right', maxWidth: '65%' }}>{value || '—'}</span>
    </div>
  )
}
