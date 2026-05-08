import { useStaff } from './hooks/useStaff'
import { ROLES, ROLE_COLORS, getRoleColor, parseGradeAssignments, getOrphanedGrades, getAssignmentDivisions } from './domain/staff'
import { getDivision } from './domain/school'
import { ALL_GRADES } from './domain/enrollment'
import { parseDivisions } from './domain/school'

export default function Staff({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    staff, loading, filtered, stats,
    configuredGrades, grades,
    showForm, toggleForm,
    form, handleChange, toggleGradeInForm,
    saving, error, submit,
    selected, openProfile, closeProfile,
    editing, editForm, editGrades,
    startEdit, handleEditChange, toggleGradeInEdit,
    saveEdit, remove,
    deleteConfirm, setDeleteConfirm,
    search, setSearch,
    filterRole, setFilterRole,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
  } = useStaff(user.id, school)

  const inputStyle = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem',
  }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }
  const formLabelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }
  const hasFilters = search || filterRole || filterStatus || filterDivision
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Staff</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage your school's staff directory</p>
        </div>
        <button
          onClick={toggleForm}
          style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
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
              { label: 'Last Name',  name: 'last_name',  type: 'text', required: true },
              { label: 'Email',      name: 'email',      type: 'email' },
              { label: 'Phone',      name: 'phone',      type: 'tel' },
              { label: 'Hire Date',  name: 'hire_date',  type: 'date' },
            ].map(field => (
              <div key={field.name}>
                <label style={formLabelStyle}>{field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
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
              <label style={formLabelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={formLabelStyle}>Grade Assignments</label>
            <GradePicker selected={form.grade_assignments} onToggle={toggleGradeInForm} locked={!configuredGrades}
              grades={grades} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={formLabelStyle}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}

          <button onClick={submit} disabled={saving}
            style={{ marginTop: '1.5rem', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>
            {saving ? 'Saving...' : 'Save Staff Member'}
          </button>
        </div>
      )}

      {/* Summary counts */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Staff', value: stats.total },
          { label: 'Active',      value: stats.active,   color: '#10b981' },
          { label: 'Inactive',    value: stats.inactive, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {s.color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />}
            <span style={{ fontWeight: '600', color: '#1f2937' }}>{s.value}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name, email, or role..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: '1', minWidth: '220px' }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
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
            <div key={member.id} onClick={() => openProfile(member)}
              style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderTop: `3px solid ${getRoleColor(member.role)}`, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: getRoleColor(member.role) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: getRoleColor(member.role), flexShrink: 0 }}>
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>{member.first_name} {member.last_name}</div>
                  <div style={{ fontSize: '0.8rem', color: getRoleColor(member.role), fontWeight: '500' }}>{member.role}</div>
                </div>
              </div>

              <GradeBadges member={member} compact configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />

              {member.email && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {member.email}</div>}
              {member.phone && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>📞 {member.phone}</div>}

              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ background: member.status === 'Active' ? '#f0fdf4' : '#f3f4f6', color: member.status === 'Active' ? '#15803d' : '#6b7280', borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  {member.status || 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) closeProfile() }}>
          <div style={{ width: '420px', maxWidth: '100%', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            <div style={{ background: getRoleColor(selected.role), padding: '1.5rem', color: 'white' }}>
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
                    <DrawerField label="Hire Date" value={selected.hire_date || '—'} />
                    <DrawerField label="Status" value={selected.status || 'Active'} />
                    {selected.notes && <DrawerField label="Notes" value={selected.notes} />}
                  </DrawerSection>

                  <GradeBadges member={selected} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />

                  <DrawerSection title="Contact">
                    <DrawerField label="Email" value={selected.email || '—'} />
                    <DrawerField label="Phone" value={selected.phone || '—'} />
                  </DrawerSection>

                  <DrawerSection title="Portal Access">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selected.auth_user_id ? '#10b981' : '#d1d5db', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.875rem', color: selected.auth_user_id ? '#10b981' : '#9ca3af', fontWeight: '500' }}>
                          {selected.auth_user_id ? 'Account linked' : 'No account yet'}
                        </span>
                      </div>
                      {!selected.auth_user_id && selected.email && (
                        <button
                          onClick={() => {
                            const link = window.location.origin
                            navigator.clipboard.writeText(link)
                            alert(`Invite link copied!\n\nSend this to ${selected.first_name}:\n${link}\n\nThey should sign up using: ${selected.email}`)
                          }}
                          style={{ fontSize: '0.8rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Copy Invite Link
                        </button>
                      )}
                    </div>
                    {!selected.email && !selected.auth_user_id && (
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.5rem 0 0' }}>Add an email address to enable portal access.</p>
                    )}
                  </DrawerSection>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={startEdit}
                      style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
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
                        <button onClick={remove} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer' }}>Yes, Remove</button>
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
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select name="role" value={editForm.role || ''} onChange={handleEditChange} style={inputStyle}>
                        <option value="">Select role</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Grade Assignments</label>
                      <GradePicker selected={editGrades} onToggle={toggleGradeInEdit} locked={!configuredGrades}
                        grades={grades} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select name="status" value={editForm.status || 'Active'} onChange={handleEditChange} style={inputStyle}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div><label style={labelStyle}>Email</label><input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Phone</label><input type="tel" name="phone" value={editForm.phone || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Hire Date</label><input type="date" name="hire_date" value={editForm.hire_date || ''} onChange={handleEditChange} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Notes</label><textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={saveEdit} disabled={saving}
                      style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
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

// ─── Local render helpers ─────────────────────────────────────────────────────

function GradePicker({ selected: picked, onToggle, locked, grades, configuredGrades, school, primaryColor }) {
  const sorted = [...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  const orphaned = getOrphanedGrades(picked, configuredGrades)
  return (
    <div>
      {locked ? (
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Configure grades in Settings → Academic Config first.</p>
      ) : sorted.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>No grades configured yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {sorted.map(grade => {
            const active = picked.includes(grade)
            const div = getDivision(grade, school?.divisions)
            const color = div ? div.color : primaryColor
            return (
              <button key={grade} type="button" onClick={() => onToggle(grade)}
                style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: active ? '600' : '400', cursor: 'pointer', border: `1.5px solid ${active ? color : '#d1d5db'}`, background: active ? color : 'white', color: active ? 'white' : '#374151', transition: 'all 0.1s' }}>
                {grade}
              </button>
            )
          })}
          {orphaned.map(grade => (
            <button key={grade} type="button" onClick={() => onToggle(grade)}
              title="This grade is no longer offered at your school. Click to remove."
              style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '400', cursor: 'pointer', border: '1.5px solid #fcd34d', background: '#fefce8', color: '#92400e', textDecoration: 'line-through', transition: 'all 0.1s' }}>
              ⚠ {grade}
            </button>
          ))}
        </div>
      )}
      {orphaned.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', marginBottom: 0 }}>
          ⚠ {orphaned.length} grade{orphaned.length !== 1 ? 's are' : ' is'} no longer offered. Click to remove.
        </p>
      )}
      {picked.length > 0 && orphaned.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.375rem', marginBottom: 0 }}>
          {picked.length} grade{picked.length !== 1 ? 's' : ''} assigned
        </p>
      )}
    </div>
  )
}

function GradeBadges({ member, compact = false, configuredGrades, school, primaryColor }) {
  const assignments = parseGradeAssignments(member)
  if (assignments.length === 0) return null
  const sorted = [...assignments].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
  const isOrphaned = (g) => configuredGrades && !configuredGrades.includes(g)
  const uniqueDivisions = getAssignmentDivisions(assignments, configuredGrades, school?.divisions)

  if (compact) {
    return (
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: uniqueDivisions.length > 0 ? '0.25rem' : 0 }}>
          {sorted.map(g => isOrphaned(g)
            ? <span key={g} title="Grade no longer offered" style={{ fontSize: '0.72rem', background: '#fefce8', color: '#92400e', borderRadius: '9999px', padding: '0.15rem 0.5rem', textDecoration: 'line-through', border: '1px solid #fcd34d' }}>⚠ {g}</span>
            : <span key={g} style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#374151', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{g}</span>
          )}
        </div>
        {uniqueDivisions.map(div => (
          <span key={div.name} style={{ fontSize: '0.72rem', color: div.color, fontWeight: '600', background: div.color + '15', borderRadius: '9999px', padding: '0.1rem 0.5rem', marginRight: '0.25rem', display: 'inline-block' }}>{div.name}</span>
        ))}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Grade Assignments</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: uniqueDivisions.length > 0 ? '1.25rem' : 0 }}>
        {sorted.map(g => {
          if (isOrphaned(g)) return (
            <span key={g} title="Grade no longer offered at this school"
              style={{ fontSize: '0.8rem', fontWeight: '400', background: '#fefce8', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '9999px', padding: '0.2rem 0.625rem', textDecoration: 'line-through' }}>
              ⚠ {g}
            </span>
          )
          const div = getDivision(g, school?.divisions)
          const color = div ? div.color : primaryColor
          return <span key={g} style={{ fontSize: '0.8rem', fontWeight: '500', background: color + '15', color, border: `1px solid ${color}30`, borderRadius: '9999px', padding: '0.2rem 0.625rem' }}>{g}</span>
        })}
      </div>
      {sorted.some(isOrphaned) && (
        <p style={{ fontSize: '0.75rem', color: '#d97706', margin: '0 0 1rem' }}>⚠ Strikethrough grades are no longer offered. Edit this profile to remove them.</p>
      )}
      {uniqueDivisions.length > 0 && (
        <>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>School Divisions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {uniqueDivisions.map(div => (
              <span key={div.name} style={{ fontSize: '0.8rem', color: div.color, fontWeight: '600', background: div.color + '12', border: `1px solid ${div.color}30`, borderRadius: '9999px', padding: '0.2rem 0.75rem' }}>{div.name}</span>
            ))}
          </div>
        </>
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
