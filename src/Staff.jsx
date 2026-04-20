import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ROLES = [
  'Principal',
  'Teacher',
  'Assistant Teacher',
  'Substitute Teacher',
  'Administrator',
  'Counselor',
  'Support Staff',
]

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

const ROLE_COLORS = {
  Principal: '#f97316',
  Teacher: '#3b82f6',
  'Assistant Teacher': '#6366f1',
  'Substitute Teacher': '#14b8a6',
  Administrator: '#8b5cf6',
  Counselor: '#10b981',
  'Support Staff': '#6b7280',
}

export default function Staff({ user, school }) {
  const configuredGrades = parseGrades(school)
  const GRADES = configuredGrades || ALL_GRADES
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role: '', grade_assignment: '', hire_date: '', status: 'Active', notes: ''
  })

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('last_name', { ascending: true })
    if (data) setStaff(data)
    setLoading(false)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.role) {
      setError('First name, last name, and role are required.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = { ...form, school_id: user.id, hire_date: form.hire_date || null }
    const { error } = await supabase.from('staff').insert([payload])
    if (error) {
      setError(error.message)
    } else {
      setForm({ first_name: '', last_name: '', email: '', phone: '', role: '', grade_assignment: '', hire_date: '', status: 'Active', notes: '' })
      setShowForm(false)
      fetchStaff()
    }
    setSaving(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    const { first_name, last_name, email, phone, role, grade_assignment, hire_date, status, notes } = editForm
    const { data, error } = await supabase
      .from('staff')
      .update({ first_name, last_name, email, phone, role, grade_assignment, hire_date: hire_date || null, status, notes })
      .eq('id', selected.id)
      .select()
      .single()
    if (error) {
      setError(error.message)
    } else {
      setSelected(data)
      setEditing(false)
      fetchStaff()
    }
    setSaving(false)
  }

  const deleteStaff = async () => {
    const { error } = await supabase.from('staff').delete().eq('id', selected.id)
    if (error) {
      setError(error.message)
    } else {
      closeProfile()
      fetchStaff()
    }
  }

  const openProfile = (member) => {
    setSelected(member)
    setEditing(false)
    setDeleteConfirm(false)
    setError(null)
  }

  const closeProfile = () => {
    setSelected(null)
    setEditing(false)
    setDeleteConfirm(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditing(true)
    setDeleteConfirm(false)
  }

  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = !search ||
      name.includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.role || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || s.role === filterRole
    const matchStatus = !filterStatus || s.status === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const roleColor = (role) => ROLE_COLORS[role] || '#6b7280'

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem'
  }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }
  const formLabelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }

  const activeCount = staff.filter(s => s.status === 'Active').length
  const inactiveCount = staff.filter(s => s.status === 'Inactive').length

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Staff</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage your school's staff directory</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null) }}
          style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >

          {showForm ? 'Cancel' : '+ Add Staff Member'}
        </button>
      </div>

      {!configuredGrades && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}><strong>Grade assignment is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to staff.</span>
        </div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Staff Member</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'First Name', name: 'first_name', type: 'text', required: true },
              { label: 'Last Name', name: 'last_name', type: 'text', required: true },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Phone', name: 'phone', type: 'tel' },
              { label: 'Hire Date', name: 'hire_date', type: 'date' },
            ].map(field => (
              <div key={field.name}>
                <label style={formLabelStyle}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
            ))}

            <div>
              <label style={formLabelStyle}>Role <span style={{ color: '#ef4444' }}>*</span></label>
              <select name="role" value={form.role} onChange={handleChange}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}>
                <option value="">Select role</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label style={formLabelStyle}>Grade Assignment</label>
              <select name="grade_assignment" value={form.grade_assignment} onChange={handleChange}
                disabled={!configuredGrades}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', background: !configuredGrades ? '#f3f4f6' : 'white', cursor: !configuredGrades ? 'not-allowed' : 'pointer', color: !configuredGrades ? '#9ca3af' : '#1f2937' }}>
                <option value="">{configuredGrades ? 'Not assigned' : 'Configure grades in Settings first'}</option>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label style={formLabelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={formLabelStyle}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={saving}
            style={{ marginTop: '1.5rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>
            {saving ? 'Saving...' : 'Save Staff Member'}
          </button>
        </div>
      )}

      {/* Summary counts */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Staff', value: staff.length },
          { label: 'Active', value: activeCount, color: '#10b981' },
          { label: 'Inactive', value: inactiveCount, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {s.color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />}
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{s.value}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {(search || filterRole || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Clear
          </button>
        )}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading staff...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍🏫</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {staff.length === 0 ? 'No staff members yet. Add your first staff member above!' : 'No staff match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(member => (
            <div
              key={member.id}
              onClick={() => openProfile(member)}
              style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderTop: `3px solid ${roleColor(member.role)}`, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
            >
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: roleColor(member.role) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: roleColor(member.role), flexShrink: 0 }}>
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>{member.first_name} {member.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: roleColor(member.role), fontWeight: '500' }}>{member.role}</div>
                </div>
              </div>

              {member.grade_assignment && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>📚 {member.grade_assignment}</div>
              )}
              {member.email && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {member.email}</div>
              )}
              {member.phone && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>📞 {member.phone}</div>
              )}

              <div style={{ marginTop: '0.75rem' }}>
                <span style={{
                  background: member.status === 'Active' ? '#f0fdf4' : '#f3f4f6',
                  color: member.status === 'Active' ? '#15803d' : '#6b7280',
                  borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '600'
                }}>
                  {member.status || 'Active'}
                </span>
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
          <div style={{ width: '420px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            {/* Drawer Header */}
            <div style={{ background: roleColor(selected.role), padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selected.first_name} {selected.last_name}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>{selected.role}</div>
                  </div>
                </div>
                <button onClick={closeProfile} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <span style={{ display: 'inline-block', marginTop: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                {selected.status || 'Active'}
              </span>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              {!editing ? (
                <>
                  <DrawerSection title="Staff Info">
                    <DrawerField label="Role" value={selected.role || '—'} />
                    <DrawerField label="Grade Assignment" value={selected.grade_assignment || 'Not assigned'} />
                    <DrawerField label="Hire Date" value={selected.hire_date || '—'} />
                    <DrawerField label="Status" value={selected.status || 'Active'} />
                    {selected.notes && <DrawerField label="Notes" value={selected.notes} />}
                  </DrawerSection>

                  <DrawerSection title="Contact">
                    <DrawerField label="Email" value={selected.email || '—'} />
                    <DrawerField label="Phone" value={selected.phone || '—'} />
                  </DrawerSection>

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

                  {deleteConfirm && (
                    <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ color: '#991b1b', fontWeight: '600', margin: '0 0 0.5rem' }}>Remove {selected.first_name} {selected.last_name}?</p>
                      <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 1rem' }}>This cannot be undone.</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={deleteStaff} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>Yes, Remove</button>
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
                      <label style={labelStyle}>Role</label>
                      <select name="role" value={editForm.role || ''} onChange={handleEditChange} style={inputStyle}>
                        <option value="">Select role</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Grade Assignment</label>
                      <select name="grade_assignment" value={editForm.grade_assignment || ''} onChange={handleEditChange}
                        disabled={!configuredGrades}
                        style={{ ...inputStyle, background: !configuredGrades ? '#f3f4f6' : 'white', cursor: !configuredGrades ? 'not-allowed' : 'pointer', color: !configuredGrades ? '#9ca3af' : '#1f2937' }}>
                        <option value="">{configuredGrades ? 'Not assigned' : 'Configure grades in Settings first'}</option>
                        {GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select name="status" value={editForm.status || 'Active'} onChange={handleEditChange} style={inputStyle}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="tel" name="phone" value={editForm.phone || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Hire Date</label>
                      <input type="date" name="hire_date" value={editForm.hire_date || ''} onChange={handleEditChange} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Notes</label>
                      <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
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
