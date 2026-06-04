import { Lock, GraduationCap, Briefcase, Mail, X, Check, Backpack } from 'lucide-react'
import { useAlumni } from './hooks/useAlumni'
import {
  RELATIONSHIPS, DONOR_STATUSES, CONTACT_METHODS,
  DONOR_COLORS, RELATIONSHIP_COLORS,
  calcGivingTotal,
} from './domain/alumni'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

export default function Alumni({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    alumni, loading, filtered, stats, graduationYears,
    configuredGrades, grades,
    selected, openProfile, closeProfile,
    editing, editForm, handleEditChange,
    startEdit, saving, saveEdit,
    deleteConfirm, setDeleteConfirm, remove,
    reenrollConfirm, setReenrollConfirm, reenrolling, reenroll,
    gradeHistory, givingHistory,
    error,
    search, setSearch,
    filterYear, setFilterYear,
    filterDonor, setFilterDonor,
    filterRelationship, setFilterRelationship,
    clearFilters,
  } = useAlumni(user.id, school)

  const hasFilters = search || filterYear || filterDonor || filterRelationship

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 m-0">Alumni</h2>
        <p className="text-gray-500 mt-1">Track graduates and manage long-term relationships</p>
      </div>

      {/* Config nudge */}
      {!configuredGrades && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <Lock size={18} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-800"><strong>Grade editing is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades.</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {[
          { label: 'Total Alumni',  value: stats.total,        color: primaryColor },
          { label: 'Active Donors', value: stats.activeDonors, color: '#10b981' },
          { label: 'Prospects',     value: stats.prospects,    color: '#3b82f6' },
          { label: 'Opted In',      value: stats.optedIn,      color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl px-5 py-4 shadow-sm border-t-4" style={{ borderTopColor: s.color }}>
            <div className="text-3xl font-bold text-gray-800">{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, employer, or college..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-60 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
        />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-36">
          <option value="">All Years</option>
          {graduationYears.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filterDonor} onChange={e => setFilterDonor(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-36">
          <option value="">Donor Status</option>
          {DONOR_STATUSES.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterRelationship} onChange={e => setFilterRelationship(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-36">
          <option value="">Relationship</option>
          {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {/* Alumni Grid */}
      {loading ? (
        <p className="text-gray-500">Loading alumni...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 flex justify-center"><GraduationCap size={48} className="text-gray-300" /></div>
          <p className="text-gray-500 text-lg">
            {alumni.length === 0
              ? 'No alumni yet. Graduate students from the Students module to get started.'
              : 'No alumni match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map(alumnus => (
            <div
              key={alumnus.id}
              onClick={() => openProfile(alumnus)}
              className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer border-t-4 hover:shadow-md transition-shadow"
              style={{ borderTopColor: RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: primaryColor + '18', color: primaryColor }}
                >
                  {alumnus.first_name?.[0]}{alumnus.last_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{alumnus.first_name} {alumnus.last_name}</div>
                  <div className="text-xs text-gray-500">
                    {alumnus.graduation_year ? `Class of ${alumnus.graduation_year}` : 'Year unknown'}
                    {alumnus.grade_completed ? ` · ${alumnus.grade_completed}` : ''}
                  </div>
                </div>
              </div>

              {alumnus.employer && <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Briefcase size={11} /> {alumnus.employer}</div>}
              {alumnus.college  && <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><GraduationCap size={11} /> {alumnus.college}</div>}
              {alumnus.email    && <div className="text-xs text-gray-500 mb-1 truncate flex items-center gap-1"><Mail size={11} /> {alumnus.email}</div>}

              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: (DONOR_COLORS[alumnus.donor_status] || '#9ca3af') + '20', color: DONOR_COLORS[alumnus.donor_status] || '#9ca3af' }}>
                  {alumnus.donor_status || 'Never'}
                </span>
                {alumnus.relationship && alumnus.relationship !== 'None' && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: (RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af') + '20', color: RELATIONSHIP_COLORS[alumnus.relationship] || '#9ca3af' }}>
                    {alumnus.relationship}
                  </span>
                )}
                {!alumnus.opt_in && (
                  <span className="bg-red-50 text-red-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">Opted Out</span>
                )}
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
          <div className="w-[440px] max-w-full bg-white h-full overflow-y-auto shadow-2xl">

            {/* Drawer header */}
            <div className="p-6 text-white" style={{ background: primaryColor }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <div className="text-xl font-bold">{selected.first_name} {selected.last_name}</div>
                    <div className="text-sm opacity-85">
                      {selected.graduation_year ? `Class of ${selected.graduation_year}` : 'Graduation year unknown'}
                    </div>
                  </div>
                </div>
                <button onClick={closeProfile} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer hover:bg-white/30 flex items-center"><X size={16} /></button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">{selected.donor_status || 'Never'}</span>
                {selected.relationship && selected.relationship !== 'None' && (
                  <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">{selected.relationship}</span>
                )}
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${selected.opt_in ? 'bg-white/20' : 'bg-red-400/40'}`}>
                  {selected.opt_in ? <><Check size={12} className="inline mr-0.5" />Opted In</> : <><X size={12} className="inline mr-0.5" />Opted Out</>}
                </span>
              </div>
            </div>

            <div className="p-6">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              {!editing ? (
                <>
                  <DrawerSection title="Alumni Info">
                    <DrawerField label="Graduation Year"    value={selected.graduation_year || '—'} />
                    <DrawerField label="Grade Completed"    value={selected.grade_completed  || '—'} />
                    <DrawerField label="College / University" value={selected.college        || '—'} />
                    <DrawerField label="Employer"           value={selected.employer         || '—'} />
                    {selected.notes && <DrawerField label="Notes" value={selected.notes} />}
                  </DrawerSection>

                  <DrawerSection title="Contact">
                    <DrawerField label="Email"           value={selected.email  || '—'} />
                    <DrawerField label="Phone"           value={selected.phone  || '—'} />
                    <DrawerField label="Address"         value={[selected.address, selected.city, selected.state, selected.zip].filter(Boolean).join(', ') || '—'} />
                    <DrawerField label="Preferred"       value={selected.preferred_contact  || '—'} />
                    <DrawerField label="Last Contacted"  value={selected.last_contacted_date || '—'} />
                  </DrawerSection>

                  <DrawerSection title="Engagement">
                    <DrawerField label="Relationship"  value={selected.relationship  || 'None'} />
                    <DrawerField label="Donor Status"  value={selected.donor_status  || 'Never'} />
                    <DrawerField label="Opt-In"        value={selected.opt_in ? 'Yes — OK to contact' : 'No — Do not contact'} />
                  </DrawerSection>

                  {givingHistory.length > 0 && (
                    <DrawerSection title="Giving History">
                      <div className="flex justify-between mb-3">
                        <span className="text-xs text-gray-500">{givingHistory.length} gift{givingHistory.length !== 1 ? 's' : ''}</span>
                        <span className="text-sm font-bold text-green-600">${calcGivingTotal(givingHistory).toLocaleString()} total</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {givingHistory.map((d, i) => (
                          <div key={i} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{d.anonymous ? 'Anonymous' : `$${Number(d.amount || 0).toLocaleString()}`}</div>
                              <div className="text-xs text-gray-400">{d.payment_method || 'Unknown method'}</div>
                            </div>
                            <div className="text-xs text-gray-500 text-right">{d.date}</div>
                          </div>
                        ))}
                      </div>
                    </DrawerSection>
                  )}

                  {gradeHistory.length > 0 && (
                    <DrawerSection title="Academic Journey">
                      <div className="relative pl-5">
                        <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-gray-200" />
                        {gradeHistory.map((entry, i) => {
                          const isFinal = i === gradeHistory.length - 1
                          return (
                            <div key={entry.id} className={`relative ${i < gradeHistory.length - 1 ? 'mb-3.5' : ''}`}>
                              <div
                                className={`absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full border-2 ${isFinal ? '' : 'bg-gray-300 border-gray-200'}`}
                                style={isFinal ? { background: primaryColor, borderColor: primaryColor } : undefined}
                              />
                              <div className="flex justify-between items-center">
                                <span className={`text-sm ${isFinal ? 'font-semibold' : 'font-normal text-gray-700'}`} style={isFinal ? { color: primaryColor } : undefined}>{entry.grade}</span>
                                <span className="text-xs text-gray-400">{entry.academic_year}</span>
                              </div>
                              <div className="flex gap-2">
                                {isFinal       && <span className="text-xs font-medium" style={{ color: primaryColor }}>graduated</span>}
                                {entry.is_repeat && <span className="text-xs text-amber-500 font-medium">repeated</span>}
                                {entry.is_skip   && <span className="text-xs text-purple-500 font-medium">skipped</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </DrawerSection>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={startEdit}
                      className="flex-1 text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background: primaryColor }}
                    >Edit Profile</button>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="bg-white text-red-500 border border-red-400 rounded-lg px-4 py-2.5 font-semibold cursor-pointer hover:bg-red-50"
                    >Remove</button>
                  </div>

                  <button
                    onClick={() => { setReenrollConfirm(true); setDeleteConfirm(false) }}
                    className="w-full mt-3 bg-green-50 text-green-700 border-2 border-green-600 rounded-lg py-2.5 font-semibold cursor-pointer hover:bg-green-100 transition-colors"
                  ><Backpack size={16} className="inline mr-1.5" />Re-enroll as Student</button>

                  {reenrollConfirm && (
                    <div className="mt-4 bg-green-50 border border-green-300 rounded-xl p-4">
                      <p className="text-green-900 font-semibold m-0 mb-2">Re-enroll {selected.first_name} {selected.last_name} as a student?</p>
                      <p className="text-green-700 text-sm m-0 mb-4">They will be moved back to the student roster with <strong>Applied</strong> status. Their alumni record will be removed.</p>
                      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                      <div className="flex gap-2">
                        <button onClick={reenroll} disabled={reenrolling} className="bg-green-600 text-white border-0 rounded-lg px-4 py-2 font-semibold cursor-pointer disabled:opacity-70 hover:bg-green-700">
                          {reenrolling ? 'Moving...' : 'Confirm Re-enroll'}
                        </button>
                        <button onClick={() => setReenrollConfirm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}

                  {deleteConfirm && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-semibold m-0 mb-2">Remove {selected.first_name} {selected.last_name} from alumni?</p>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Graduation Year</label><input type="number" name="graduation_year" value={editForm.graduation_year || ''} onChange={handleEditChange} placeholder="e.g. 2024" className={fieldCls} /></div>
                      <div>
                        <label className={labelCls}>Grade Completed</label>
                        <select name="grade_completed" value={editForm.grade_completed || ''} onChange={handleEditChange}
                          disabled={!configuredGrades}
                          className={`${fieldCls} ${!configuredGrades ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'}`}>
                          <option value="">{configuredGrades ? 'Unknown' : 'Configure grades in Settings first'}</option>
                          {grades.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className={labelCls}>Email</label>  <input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Phone</label>  <input type="tel"   name="phone" value={editForm.phone || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Address</label><input name="address" value={editForm.address || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div className="grid gap-3 grid-cols-[2fr_1fr_1fr]">
                      <div><label className={labelCls}>City</label> <input name="city"  value={editForm.city  || ''} onChange={handleEditChange} className={fieldCls} /></div>
                      <div><label className={labelCls}>State</label><input name="state" value={editForm.state || ''} onChange={handleEditChange} className={fieldCls} /></div>
                      <div><label className={labelCls}>ZIP</label>  <input name="zip"   value={editForm.zip   || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    </div>
                    <div><label className={labelCls}>Employer</label>          <input name="employer" value={editForm.employer || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>College / University</label><input name="college"  value={editForm.college  || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div>
                      <label className={labelCls}>Relationship</label>
                      <select name="relationship" value={editForm.relationship || 'None'} onChange={handleEditChange} className={fieldCls}>
                        {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Donor Status</label>
                      <select name="donor_status" value={editForm.donor_status || 'Never'} onChange={handleEditChange} className={fieldCls}>
                        {DONOR_STATUSES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Preferred Contact Method</label>
                      <select name="preferred_contact" value={editForm.preferred_contact || 'Email'} onChange={handleEditChange} className={fieldCls}>
                        {CONTACT_METHODS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className={labelCls}>Last Contacted Date</label><input type="date" name="last_contacted_date" value={editForm.last_contacted_date || ''} onChange={handleEditChange} className={fieldCls} /></div>
                    <div>
                      <label className={labelCls}>Opt-In to Communications</label>
                      <select name="opt_in" value={editForm.opt_in} onChange={handleEditChange} className={fieldCls}>
                        <option value="true">Yes — OK to contact</option>
                        <option value="false">No — Do not contact</option>
                      </select>
                    </div>
                    <div><label className={labelCls}>Notes</label><textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} className={`${fieldCls} resize-y`} /></div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity"
                      style={{ background: primaryColor }}
                    >{saving ? 'Saving...' : 'Save Changes'}</button>
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
