import { useStaff } from './hooks/useStaff'
import { ROLES, getRoleColor, parseGradeAssignments, getOrphanedGrades, getAssignmentDivisions } from './domain/staff'
import { getDivision, parseDivisions } from './domain/school'
import { ALL_GRADES } from './domain/enrollment'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-gray-500 mb-1'

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

  const hasFilters = search || filterRole || filterStatus || filterDivision
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Staff</h2>
          <p className="text-gray-500 mt-1">Manage your school's staff directory</p>
        </div>
        <button
          onClick={toggleForm}
          className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-base hover:opacity-90 transition-opacity"
          style={{ background: primaryColor }}
        >
          {showForm ? 'Cancel' : '+ Add Staff Member'}
        </button>
      </div>

      {/* Config nudge */}
      {!configuredGrades && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="text-sm text-red-800"><strong>Grade assignment is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to staff.</span>
        </div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">New Staff Member</h3>

          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {[
              { label: 'First Name', name: 'first_name', type: 'text',  required: true },
              { label: 'Last Name',  name: 'last_name',  type: 'text',  required: true },
              { label: 'Email',      name: 'email',      type: 'email' },
              { label: 'Phone',      name: 'phone',      type: 'tel' },
              { label: 'Hire Date',  name: 'hire_date',  type: 'date' },
            ].map(field => (
              <div key={field.name}>
                <label className={labelCls}>{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange} className={fieldCls} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Role <span className="text-red-500">*</span></label>
              <select name="role" value={form.role} onChange={handleChange} className={fieldCls}>
                <option value="">Select role</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={fieldCls}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Grade Assignments</label>
            <GradePicker selected={form.grade_assignments} onToggle={toggleGradeInForm} locked={!configuredGrades}
              grades={grades} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />
          </div>

          <div className="mt-4">
            <label className={labelCls}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={`${fieldCls} resize-y`} />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="mt-6 text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer text-base disabled:opacity-70 hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {saving ? 'Saving...' : 'Save Staff Member'}
          </button>
        </div>
      )}

      {/* Summary counts */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { label: 'Total Staff', value: stats.total },
          { label: 'Active',      value: stats.active,   color: '#10b981' },
          { label: 'Inactive',    value: stats.inactive, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
            {s.color && <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />}
            <span className="font-semibold text-gray-800">{s.value}</span>
            <span className="text-gray-500 text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Search by name, email, or role..." value={search}
          onChange={e => setSearch(e.target.value)} className="flex-1 min-w-56 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm" />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-40">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white">
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {divisions.length > 0 && (
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-40">
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={clearFilters} className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">Clear</button>
        )}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <p className="text-gray-500">Loading staff...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👩‍🏫</div>
          <p className="text-gray-500 text-lg">
            {staff.length === 0 ? 'No staff members yet. Add your first staff member above!' : 'No staff match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map(member => (
            <div
              key={member.id}
              onClick={() => openProfile(member)}
              className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer border-t-4 hover:shadow-md transition-shadow"
              style={{ borderTopColor: getRoleColor(member.role) }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: getRoleColor(member.role) + '20', color: getRoleColor(member.role) }}
                >
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{member.first_name} {member.last_name}</div>
                  <div className="text-xs font-medium" style={{ color: getRoleColor(member.role) }}>{member.role}</div>
                </div>
              </div>

              <GradeBadges member={member} compact configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />

              {member.email && <div className="text-xs text-gray-500 mb-1 truncate">✉️ {member.email}</div>}
              {member.phone && <div className="text-xs text-gray-500 mb-1">📞 {member.phone}</div>}

              <div className="mt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
          className="fixed inset-0 bg-black/30 z-50 flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) closeProfile() }}
        >
          <div className="w-[420px] max-w-full bg-white h-full overflow-y-auto shadow-2xl">

            {/* Drawer header */}
            <div className="p-6 text-white" style={{ background: getRoleColor(selected.role) }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <div className="text-xl font-bold">{selected.first_name} {selected.last_name}</div>
                    <div className="text-sm opacity-85">{selected.role}</div>
                  </div>
                </div>
                <button onClick={closeProfile} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer text-lg hover:bg-white/30">✕</button>
              </div>
              <span className="inline-block mt-3 bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">
                {selected.status || 'Active'}
              </span>
            </div>

            <div className="p-6">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              {!editing ? (
                <>
                  <DrawerSection title="Staff Info">
                    <DrawerField label="Role"      value={selected.role      || '—'} />
                    <DrawerField label="Hire Date" value={selected.hire_date || '—'} />
                    <DrawerField label="Status"    value={selected.status    || 'Active'} />
                    {selected.notes && <DrawerField label="Notes" value={selected.notes} />}
                  </DrawerSection>

                  <GradeBadges member={selected} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />

                  <DrawerSection title="Contact">
                    <DrawerField label="Email" value={selected.email || '—'} />
                    <DrawerField label="Phone" value={selected.phone || '—'} />
                  </DrawerSection>

                  <DrawerSection title="Portal Access">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full inline-block ${selected.auth_user_id ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={`text-sm font-medium ${selected.auth_user_id ? 'text-green-600' : 'text-gray-400'}`}>
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
                          className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80 bg-transparent"
                          style={{ color: primaryColor, borderColor: primaryColor }}
                        >
                          Copy Invite Link
                        </button>
                      )}
                    </div>
                    {!selected.email && !selected.auth_user_id && (
                      <p className="text-xs text-gray-400 mt-2 mb-0">Add an email address to enable portal access.</p>
                    )}
                  </DrawerSection>

                  <div className="flex gap-3 mt-6">
                    <button onClick={startEdit} className="flex-1 text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                      Edit Profile
                    </button>
                    <button onClick={() => setDeleteConfirm(true)} className="bg-white text-red-500 border border-red-400 rounded-lg px-4 py-2.5 font-semibold cursor-pointer hover:bg-red-50">
                      Remove
                    </button>
                  </div>

                  {deleteConfirm && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-semibold m-0 mb-2">Remove {selected.first_name} {selected.last_name}?</p>
                      <p className="text-red-700 text-sm m-0 mb-4">This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={remove} className="bg-red-500 text-white border-0 rounded-lg px-4 py-2 font-semibold cursor-pointer hover:bg-red-600">Yes, Remove</button>
                        <button onClick={() => setDeleteConfirm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>First Name</label><input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} className={fieldCls} /></div>
                      <div><label className={labelCls}>Last Name</label> <input name="last_name"  value={editForm.last_name  || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    </div>
                    <div>
                      <label className={labelCls}>Role</label>
                      <select name="role" value={editForm.role || ''} onChange={handleEditChange} className={fieldCls}>
                        <option value="">Select role</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Grade Assignments</label>
                      <GradePicker selected={editGrades} onToggle={toggleGradeInEdit} locked={!configuredGrades}
                        grades={grades} configuredGrades={configuredGrades} school={school} primaryColor={primaryColor} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select name="status" value={editForm.status || 'Active'} onChange={handleEditChange} className={fieldCls}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div><label className={labelCls}>Email</label>    <input type="email" name="email"     value={editForm.email     || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Phone</label>    <input type="tel"   name="phone"     value={editForm.phone     || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Hire Date</label><input type="date"  name="hire_date" value={editForm.hire_date  || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Notes</label>    <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} className={`${fieldCls} resize-y`} /></div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={saveEdit} disabled={saving} className="flex-1 text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => startEdit(null)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-50">Cancel</button>
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
        <p className="text-sm text-gray-400 m-0">Configure grades in Settings → Academic Config first.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 m-0">No grades configured yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sorted.map(grade => {
            const active = picked.includes(grade)
            const div = getDivision(grade, school?.divisions)
            const color = div ? div.color : primaryColor
            return (
              <button key={grade} type="button" onClick={() => onToggle(grade)}
                className={`px-2.5 py-1 rounded-full text-xs cursor-pointer border-2 transition-all ${active ? 'font-semibold text-white' : 'font-normal text-gray-700 bg-white border-gray-300'}`}
                style={active ? { borderColor: color, background: color } : undefined}>
                {grade}
              </button>
            )
          })}
          {orphaned.map(grade => (
            <button key={grade} type="button" onClick={() => onToggle(grade)}
              title="This grade is no longer offered at your school. Click to remove."
              className="px-2.5 py-1 rounded-full text-xs cursor-pointer border-2 line-through transition-all border-yellow-300 bg-yellow-50 text-amber-800">
              ⚠ {grade}
            </button>
          ))}
        </div>
      )}
      {orphaned.length > 0 && (
        <p className="text-xs text-amber-600 mt-2 mb-0">⚠ {orphaned.length} grade{orphaned.length !== 1 ? 's are' : ' is'} no longer offered. Click to remove.</p>
      )}
      {picked.length > 0 && orphaned.length === 0 && (
        <p className="text-xs text-gray-400 mt-1.5 mb-0">{picked.length} grade{picked.length !== 1 ? 's' : ''} assigned</p>
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
      <div className="mb-2">
        <div className={`flex flex-wrap gap-1 ${uniqueDivisions.length > 0 ? 'mb-1' : ''}`}>
          {sorted.map(g => isOrphaned(g)
            ? <span key={g} title="Grade no longer offered" className="text-[0.72rem] bg-yellow-50 text-amber-800 rounded-full px-2 py-0.5 line-through border border-yellow-300">⚠ {g}</span>
            : <span key={g} className="text-[0.72rem] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{g}</span>
          )}
        </div>
        {uniqueDivisions.map(div => (
          <span key={div.name} className="text-[0.72rem] font-semibold rounded-full px-2 py-0.5 mr-1 inline-block" style={{ color: div.color, background: div.color + '15' }}>{div.name}</span>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Grade Assignments</div>
      <div className={`flex flex-wrap gap-1.5 ${uniqueDivisions.length > 0 ? 'mb-5' : ''}`}>
        {sorted.map(g => {
          if (isOrphaned(g)) return (
            <span key={g} title="Grade no longer offered at this school"
              className="text-xs bg-yellow-50 text-amber-800 border border-yellow-300 rounded-full px-2.5 py-0.5 line-through">
              ⚠ {g}
            </span>
          )
          const div = getDivision(g, school?.divisions)
          const color = div ? div.color : primaryColor
          return <span key={g} className="text-xs font-medium rounded-full px-2.5 py-0.5 border" style={{ background: color + '15', color, borderColor: color + '30' }}>{g}</span>
        })}
      </div>
      {sorted.some(isOrphaned) && (
        <p className="text-xs text-amber-600 m-0 mb-4">⚠ Strikethrough grades are no longer offered. Edit this profile to remove them.</p>
      )}
      {uniqueDivisions.length > 0 && (
        <>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">School Divisions</div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueDivisions.map(div => (
              <span key={div.name} className="text-xs font-semibold rounded-full px-3 py-0.5 border" style={{ color: div.color, background: div.color + '12', borderColor: div.color + '30' }}>{div.name}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DrawerSection({ title, children }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</div>
      <div className="grid gap-0">{children}</div>
    </div>
  )
}

function DrawerField({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}
