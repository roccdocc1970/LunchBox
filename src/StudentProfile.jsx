import { getDivision } from './domain/school'
import { ALL_GRADES } from './domain/enrollment'
import {
  INCIDENT_TYPES, INCIDENT_TYPE_COLORS,
  HEALTH_ENTRY_CATEGORIES, HEALTH_CATEGORY_COLORS, HEALTH_CATEGORY_ICONS,
  statusColor, parentDisplayName, isEntryExpired, isSkipGrade,
} from './domain/students'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1'
const cardCls  = 'bg-white rounded-2xl shadow-sm p-6'
const secHead  = 'text-xs font-bold text-gray-400 uppercase tracking-wider mb-4'

export default function StudentProfile({ student, school, h }) {
  const primaryColor = school?.primary_color || '#f97316'
  const GRADES = h.configuredGrades || ALL_GRADES

  const gradeSet  = new Set(h.gradeHistory.map(e => e.grade))
  const gradeMeta = h.gradeHistory.reduce((acc, e) => {
    if (!acc[e.grade]) acc[e.grade] = { repeat: false, skip: false }
    if (e.is_repeat) acc[e.grade].repeat = true
    if (e.is_skip)   acc[e.grade].skip   = true
    return acc
  }, {})

  const gradeState = (g) => {
    if (g === student.grade) return 'current'
    if (gradeSet.has(g))    return 'past'
    return 'future'
  }

  const division = getDivision(student.grade, school?.divisions)

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (h.editing) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <button onClick={() => h.setEditing(false)} className="bg-transparent border-0 font-semibold cursor-pointer text-sm mb-6 flex items-center gap-1.5 hover:opacity-75" style={{ color: primaryColor }}>
          ← Cancel Edit
        </button>

        <div className={cardCls}>
          <div className={secHead}>Edit Student Profile</div>
          {h.error && <p className="text-red-500 text-sm mb-4">{h.error}</p>}

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name</label><input name="first_name" value={h.editForm.first_name || ''} onChange={h.handleEditChange} className={fieldCls} /></div>
              <div><label className={labelCls}>Last Name</label> <input name="last_name"  value={h.editForm.last_name  || ''} onChange={h.handleEditChange} className={fieldCls} /></div>
            </div>

            <div>
              <label className={labelCls}>Grade</label>
              {(() => {
                const locked = !h.configuredGrades || h.editForm.status !== 'Enrolled'
                return (
                  <>
                    <select name="grade" value={h.editForm.grade || ''} onChange={e => { h.handleEditChange(e); h.setRepeatGrade(false); h.setSkipGrade(false) }}
                      disabled={locked}
                      className={`${fieldCls} ${locked ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'}`}>
                      <option value="">{!h.configuredGrades ? 'Configure grades in Settings first' : 'Select grade'}</option>
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                    {h.configuredGrades && h.editForm.status !== 'Enrolled' && (
                      <p className="text-xs text-gray-500 mt-1">🔒 Grade progression is locked until the student is <strong>Enrolled</strong>.</p>
                    )}
                    {h.editForm.grade && h.editForm.grade === student.grade && (
                      <div onClick={() => h.setRepeatGrade(!h.repeatGrade)} className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors" style={{ borderColor: h.repeatGrade ? primaryColor : '#d1d5db', background: h.repeatGrade ? primaryColor : 'white' }}>
                          {h.repeatGrade && <span className="text-white text-[0.6rem] font-bold">✓</span>}
                        </div>
                        <span className={`text-sm ${h.repeatGrade ? 'font-semibold' : 'font-normal text-gray-500'}`} style={{ color: h.repeatGrade ? primaryColor : undefined }}>Student is repeating this grade</span>
                      </div>
                    )}
                    {h.editForm.grade && h.editForm.grade !== student.grade && isSkipGrade(student.grade, h.editForm.grade) && (
                      <div onClick={() => h.setSkipGrade(!h.skipGrade)} className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors" style={{ borderColor: h.skipGrade ? '#8b5cf6' : '#d1d5db', background: h.skipGrade ? '#8b5cf6' : 'white' }}>
                          {h.skipGrade && <span className="text-white text-[0.6rem] font-bold">✓</span>}
                        </div>
                        <span className={`text-sm ${h.skipGrade ? 'font-semibold text-violet-500' : 'font-normal text-gray-500'}`}>Student is skipping a grade</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={h.editForm.status || 'Applied'} onChange={h.handleEditChange} className={fieldCls}>
                <option>Applied</option><option>Enrolled</option><option>Waitlisted</option>
              </select>
            </div>

            <div><label className={labelCls}>Date of Birth</label><input type="date" name="date_of_birth" value={h.editForm.date_of_birth || ''} onChange={h.handleEditChange} className={fieldCls} /></div>
            <div><label className={labelCls}>Notes</label><textarea name="notes" value={h.editForm.notes || ''} onChange={h.handleEditChange} rows={3} className={`${fieldCls} resize-y`} /></div>

            <div>
              <label className={labelCls}>Parent / Guardian</label>
              {!h.changingParent ? (
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{parentDisplayName(h.editParent)}</span>
                  <button onClick={() => h.setChangingParent(true)} className="text-xs font-semibold bg-transparent border-0 cursor-pointer hover:opacity-75" style={{ color: primaryColor }}>Change</button>
                </div>
              ) : (
                <div>
                  <input autoFocus placeholder="Search parents by name or email…" value={h.parentChangeSearch} onChange={e => h.searchParentChange(e.target.value)} className={fieldCls} />
                  {h.parentChangeResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg bg-white mt-1 max-h-40 overflow-y-auto">
                      {h.parentChangeResults.map(p => (
                        <div key={p.id} onClick={() => h.selectParentChange(p)} className="px-3 py-2 cursor-pointer border-b border-gray-100 text-sm hover:bg-gray-50">
                          <strong>{p.first_name} {p.last_name}</strong>
                          {p.email && <span className="text-gray-500"> · {p.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { h.setChangingParent(false); h.searchParentChange('') }} className="text-xs text-gray-400 bg-transparent border-0 cursor-pointer mt-1">Cancel</button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Edit parent contact details in the Parents module.</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={h.saveEdit} disabled={h.saving} className="flex-1 text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
              {h.saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => h.setEditing(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <button onClick={h.closeProfile} className="bg-transparent border-0 font-semibold cursor-pointer text-sm mb-6 flex items-center gap-1.5 hover:opacity-75" style={{ color: primaryColor }}>
        ← Back to Students
      </button>

      {/* Header */}
      <div className="rounded-2xl px-8 py-7 mb-6 text-white flex justify-between items-start" style={{ background: primaryColor }}>
        <div>
          <div className="text-3xl font-bold mb-1.5">{student.first_name} {student.last_name}</div>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="bg-white/25 rounded-full px-3.5 py-0.5 text-sm font-semibold">{student.status || 'Applied'}</span>
            {student.grade && <span className="bg-white/20 rounded-full px-3.5 py-0.5 text-sm">{student.grade}</span>}
            {division && (
              <span className="bg-white/20 rounded-full px-3.5 py-0.5 text-sm border-l-4" style={{ borderLeftColor: division.color }}>{division.name}</span>
            )}
            {student.date_of_birth && <span className="text-sm opacity-80">DOB: {student.date_of_birth}</span>}
          </div>
        </div>
        <button onClick={h.startEdit} className="bg-white/20 border border-white/40 text-white rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm whitespace-nowrap hover:bg-white/30">
          ✏️ Edit Profile
        </button>
      </div>

      {/* Grade Journey Bar */}
      {GRADES.length > 0 && (
        <div className={`${cardCls} mb-6`}>
          <div className={secHead}>Academic Journey</div>
          <div className="flex items-stretch rounded-lg overflow-hidden border border-gray-200">
            {GRADES.map((grade, i) => {
              const state = gradeState(grade)
              const bg    = state === 'current' ? primaryColor : state === 'past' ? primaryColor + '30' : '#f9fafb'
              const color = state === 'current' ? 'white' : state === 'past' ? primaryColor : '#9ca3af'
              const weight = state === 'current' ? '700' : state === 'past' ? '600' : '400'
              return (
                <div key={grade} className={`flex-1 text-center py-3 px-2 relative min-w-[60px] ${i < GRADES.length - 1 ? 'border-r border-gray-200' : ''}`} style={{ background: bg }}>
                  {state === 'current' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/60 rounded-t" />}
                  <div className="text-xs leading-snug truncate" style={{ fontWeight: weight, color }}>{grade.replace(' Grade', '').replace('Grade ', '')}</div>
                  <div className="text-[0.6rem] mt-1" style={{ color: state === 'current' ? 'rgba(255,255,255,0.8)' : state === 'past' ? primaryColor + 'aa' : '#d1d5db' }}>
                    {state === 'current' ? '● now' : state === 'past' ? '✓' : ''}
                  </div>
                  {gradeMeta[grade]?.repeat && <div className="text-[0.6rem] mt-0.5" style={{ color: state === 'current' ? 'rgba(255,255,255,0.75)' : '#f59e0b' }}>repeated</div>}
                  {gradeMeta[grade]?.skip   && <div className="text-[0.6rem] mt-0.5" style={{ color: state === 'current' ? 'rgba(255,255,255,0.75)' : '#8b5cf6' }}>skipped</div>}
                </div>
              )
            })}
          </div>
          {h.gradeHistory.length === 0 && (
            <p className="text-xs text-gray-400 mt-3 mb-0">No grade history recorded yet — highlighted once the student is enrolled and a grade is assigned.</p>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <div className={cardCls}>
          <div className={secHead}>Student Info</div>
          <InfoRow label="Full Name"    value={`${student.first_name} ${student.last_name}`} />
          <InfoRow label="Date of Birth" value={student.date_of_birth || '—'} />
          <InfoRow label="Grade"         value={student.grade || '—'} />
          <InfoRow label="Status">
            <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: statusColor(student.status) + '20', color: statusColor(student.status) }}>
              {student.status || 'Applied'}
            </span>
          </InfoRow>
          {student.notes && <div className="mt-3 px-3 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">{student.notes}</div>}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Report cards on file: </span>
            <span className="text-xs font-semibold" style={{ color: h.reportCardCount > 0 ? primaryColor : '#9ca3af' }}>
              {h.reportCardCount > 0 ? `${h.reportCardCount} report card${h.reportCardCount !== 1 ? 's' : ''}` : 'None yet'}
            </span>
          </div>
        </div>

        <div className={cardCls}>
          <div className={secHead}>Parent / Guardian</div>
          <InfoRow label="Name"    value={parentDisplayName(student.parents)} />
          <InfoRow label="Email"   value={student.parents?.email   || '—'} />
          <InfoRow label="Phone"   value={student.parents?.phone   || '—'} />
          <InfoRow label="Address" value={student.parents?.address || '—'} />
          <p className="text-xs text-gray-400 mt-4 mb-0">Edit parent contact details in the Parents module.</p>
        </div>
      </div>

      {/* Health Records */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Health Records</div>
          <button onClick={h.toggleHealthProfileEdit} className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>
            {h.showHealthProfileEdit ? 'Cancel' : h.healthProfile ? 'Edit Profile' : '+ Add Profile'}
          </button>
        </div>

        {/* Health profile edit form */}
        {h.showHealthProfileEdit && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
            <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div><label className={labelCls}>Blood Type</label>
                <select value={h.healthProfileForm.blood_type || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, blood_type: e.target.value })} className={fieldCls}>
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Last Physical</label><input type="date" value={h.healthProfileForm.physical_date || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, physical_date: e.target.value })} className={fieldCls} /></div>
              <div><label className={labelCls}>Primary Physician</label><input value={h.healthProfileForm.primary_physician || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, primary_physician: e.target.value })} className={fieldCls} placeholder="Dr. Name" /></div>
              <div><label className={labelCls}>Physician Phone</label><input value={h.healthProfileForm.physician_phone || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, physician_phone: e.target.value })} className={fieldCls} /></div>
              <div><label className={labelCls}>Insurance Provider</label><input value={h.healthProfileForm.insurance_provider || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, insurance_provider: e.target.value })} className={fieldCls} /></div>
              <div><label className={labelCls}>Policy #</label><input value={h.healthProfileForm.insurance_policy_number || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, insurance_policy_number: e.target.value })} className={fieldCls} /></div>
              <div><label className={labelCls}>Emergency Contact</label><input value={h.healthProfileForm.emergency_contact_name || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_name: e.target.value })} className={fieldCls} placeholder="Full name" /></div>
              <div><label className={labelCls}>Relationship</label><input value={h.healthProfileForm.emergency_contact_relationship || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_relationship: e.target.value })} className={fieldCls} placeholder="e.g. Aunt" /></div>
              <div><label className={labelCls}>Emergency Phone</label><input value={h.healthProfileForm.emergency_contact_phone || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_phone: e.target.value })} className={fieldCls} /></div>
            </div>
            <div className="mb-3"><label className={labelCls}>Notes</label><textarea value={h.healthProfileForm.notes || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
            <div className="flex gap-2">
              <button onClick={h.handleSaveHealthProfile} disabled={h.savingHealthProfile} className="flex-1 text-white border-0 rounded-lg py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {h.savingHealthProfile ? 'Saving…' : 'Save Health Profile'}
              </button>
              {h.healthProfile && (
                <button onClick={h.handleDeleteHealthProfile} className="bg-red-50 text-red-500 border border-red-200 rounded-lg px-3 py-2 font-semibold cursor-pointer text-sm hover:bg-red-100">Delete</button>
              )}
            </div>
          </div>
        )}

        {!h.showHealthProfileEdit && h.healthProfile && (
          <div className="grid gap-3 bg-gray-50 rounded-xl p-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {h.healthProfile.blood_type && <StatPill label="Blood Type" value={h.healthProfile.blood_type} valueColor="#ef4444" />}
            {h.healthProfile.physical_date && <StatPill label="Last Physical" value={h.healthProfile.physical_date} />}
            {h.healthProfile.primary_physician && <StatPill label="Physician" value={h.healthProfile.primary_physician} />}
            {h.healthProfile.physician_phone && <StatPill label="Physician Ph." value={h.healthProfile.physician_phone} />}
            {h.healthProfile.insurance_provider && <StatPill label="Insurance" value={h.healthProfile.insurance_provider} />}
            {h.healthProfile.insurance_policy_number && <StatPill label="Policy #" value={h.healthProfile.insurance_policy_number} />}
            {h.healthProfile.emergency_contact_name && <>
              <StatPill label="Emergency Contact" value={`${h.healthProfile.emergency_contact_name}${h.healthProfile.emergency_contact_relationship ? ` (${h.healthProfile.emergency_contact_relationship})` : ''}`} />
              <StatPill label="Emergency Phone" value={h.healthProfile.emergency_contact_phone || '—'} />
            </>}
            {h.healthProfile.notes && <div className="col-span-full"><span className="text-xs text-gray-400">Notes: </span><span className="text-xs text-gray-700">{h.healthProfile.notes}</span></div>}
          </div>
        )}

        {!h.showHealthProfileEdit && !h.healthProfile && (
          <p className="text-sm text-gray-400 mb-5">No health profile on file.</p>
        )}

        {/* Health entries */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conditions, Allergies & More</span>
            <button onClick={() => h.setShowHealthEntryForm(!h.showHealthEntryForm)} className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>
              {h.showHealthEntryForm ? 'Cancel' : '+ Add Entry'}
            </button>
          </div>

          {h.showHealthEntryForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex flex-col gap-2.5">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div><label className={labelCls}>Category</label><select value={h.healthEntryForm.category} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, category: e.target.value })} className={fieldCls}>{HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className={labelCls}>Name *</label><input value={h.healthEntryForm.name} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, name: e.target.value })} placeholder="e.g. Peanut Allergy" className={fieldCls} /></div>
                <div className="col-span-full"><label className={labelCls}>Detail</label><input value={h.healthEntryForm.detail} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, detail: e.target.value })} placeholder="Dosage, reaction type…" className={fieldCls} /></div>
                <div><label className={labelCls}>Date</label><input type="date" value={h.healthEntryForm.date} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, date: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>Expiration</label><input type="date" value={h.healthEntryForm.expiration_date} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, expiration_date: e.target.value })} className={fieldCls} /></div>
                <div className="col-span-full"><label className={labelCls}>Notes</label><input value={h.healthEntryForm.notes} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, notes: e.target.value })} className={fieldCls} /></div>
              </div>
              <button onClick={h.saveHealthEntry} disabled={h.savingHealthEntry || !h.healthEntryForm.name.trim()} className="text-white border-0 rounded-lg py-2 font-semibold cursor-pointer text-sm disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {h.savingHealthEntry ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          )}

          {h.healthEntries.length === 0 ? (
            <p className="text-sm text-gray-400 m-0">No health entries recorded.</p>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {h.healthEntries.map(entry => {
                const color   = HEALTH_CATEGORY_COLORS[entry.category] || '#6b7280'
                const expired = isEntryExpired(entry)
                const isEditing = h.editingHealthEntry === entry.id
                return (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-3 border-l-4" style={{ border: `1px solid ${color}30`, borderLeft: `3px solid ${color}` }}>
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={labelCls}>Category</label><select value={h.healthEntryEditForm.category} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, category: e.target.value })} className={fieldCls}>{HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                          <div><label className={labelCls}>Name *</label><input value={h.healthEntryEditForm.name} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, name: e.target.value })} className={fieldCls} /></div>
                          <div className="col-span-2"><label className={labelCls}>Detail</label><input value={h.healthEntryEditForm.detail || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, detail: e.target.value })} className={fieldCls} /></div>
                          <div><label className={labelCls}>Date</label><input type="date" value={h.healthEntryEditForm.date || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, date: e.target.value })} className={fieldCls} /></div>
                          <div><label className={labelCls}>Expiration</label><input type="date" value={h.healthEntryEditForm.expiration_date || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, expiration_date: e.target.value })} className={fieldCls} /></div>
                          <div className="col-span-2"><label className={labelCls}>Notes</label><input value={h.healthEntryEditForm.notes || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, notes: e.target.value })} className={fieldCls} /></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={h.handleUpdateHealthEntry} disabled={h.savingHealthEntryEdit || !h.healthEntryEditForm.name.trim()} className="flex-1 text-white border-0 rounded-md py-1.5 font-semibold cursor-pointer text-xs disabled:opacity-70 hover:opacity-90" style={{ background: primaryColor }}>{h.savingHealthEntryEdit ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => h.setEditingHealthEntry(null)} className="flex-1 bg-white text-gray-500 border border-gray-300 rounded-md py-1.5 cursor-pointer text-xs hover:bg-gray-50">Cancel</button>
                          <button onClick={() => { h.handleDeleteHealthEntry(entry.id); h.setEditingHealthEntry(null) }} className="bg-red-50 text-red-500 border border-red-200 rounded-md px-2.5 py-1.5 cursor-pointer text-xs hover:bg-red-100">Delete</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color, background: color + '18' }}>{HEALTH_CATEGORY_ICONS[entry.category]} {entry.category}</span>
                            <span className="text-sm font-semibold text-gray-800">{entry.name}</span>
                            {expired && <span className="text-[0.65rem] font-semibold text-red-500 bg-red-50 rounded-full px-1.5 py-0.5">Expired</span>}
                          </div>
                          <button onClick={() => h.openHealthEntryEdit(entry)} className="text-[0.7rem] font-semibold border rounded px-1.5 py-0.5 cursor-pointer ml-2 hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>Edit</button>
                        </div>
                        {entry.detail && <p className="text-xs text-gray-500 m-0 mb-1">{entry.detail}</p>}
                        <div className="flex gap-3">
                          {entry.date && <span className="text-[0.7rem] text-gray-400">📅 {entry.date}</span>}
                          {entry.expiration_date && <span className="text-[0.7rem]" style={{ color: expired ? '#ef4444' : '#9ca3af' }}>Exp: {entry.expiration_date}</span>}
                        </div>
                        {entry.notes && <p className="text-[0.7rem] text-gray-400 italic m-0 mt-0.5">{entry.notes}</p>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Incident Log */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Incident Log</div>
          {!h.showIncidentForm && (
            <button onClick={() => h.setShowIncidentForm(true)} className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>+ Log Incident</button>
          )}
        </div>

        {h.showIncidentForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Date</label><input type="date" value={h.incidentForm.date} onChange={e => h.setIncidentForm({ ...h.incidentForm, date: e.target.value })} className={fieldCls} /></div>
              <div><label className={labelCls}>Type</label><select value={h.incidentForm.type} onChange={e => h.setIncidentForm({ ...h.incidentForm, type: e.target.value })} className={fieldCls}>{INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div><label className={labelCls}>Description <span className="text-red-500">*</span></label><textarea value={h.incidentForm.description} onChange={e => h.setIncidentForm({ ...h.incidentForm, description: e.target.value })} rows={3} className={`${fieldCls} resize-y`} placeholder="What happened?" /></div>
            <div><label className={labelCls}>Resolution</label><textarea value={h.incidentForm.resolution} onChange={e => h.setIncidentForm({ ...h.incidentForm, resolution: e.target.value })} rows={2} className={`${fieldCls} resize-y`} placeholder="Action taken (optional)" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className={labelCls}>Reported By</label>
                {h.incidentForm.reported_by ? (
                  <div className="flex justify-between items-center px-3 py-2 bg-green-50 border border-green-300 rounded-lg">
                    <span className="text-sm text-gray-800 font-medium">{h.incidentForm.reported_by}</span>
                    <button onClick={() => { h.setIncidentForm({ ...h.incidentForm, reported_by: '' }); h.setStaffSearch(''); h.setStaffResults([]) }} className="bg-transparent border-0 text-gray-500 cursor-pointer text-base">×</button>
                  </div>
                ) : (
                  <>
                    <input value={h.staffSearch} onChange={e => h.handleStaffSearch(e.target.value)} className={fieldCls} placeholder="Search staff…" />
                    {h.staffResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-20 max-h-40 overflow-y-auto">
                        {h.staffResults.map(s => (
                          <div key={s.id} onClick={() => { h.setIncidentForm({ ...h.incidentForm, reported_by: `${s.first_name} ${s.last_name}` }); h.setStaffSearch(''); h.setStaffResults([]) }}
                            className="px-3 py-2 cursor-pointer border-b border-gray-100 text-sm hover:bg-gray-50">
                            <span className="font-semibold">{s.first_name} {s.last_name}</span>
                            <span className="text-gray-400 text-xs"> · {s.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div><label className={labelCls}>Status</label><select value={h.incidentForm.status} onChange={e => h.setIncidentForm({ ...h.incidentForm, status: e.target.value })} className={fieldCls}><option>Open</option><option>Resolved</option></select></div>
            </div>
            <div className="flex gap-2">
              <button onClick={h.submitIncident} disabled={h.savingIncident || !h.incidentForm.description} className="flex-1 text-white border-0 rounded-lg py-2 font-semibold cursor-pointer text-sm disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {h.savingIncident ? 'Saving…' : 'Save Incident'}
              </button>
              <button onClick={() => h.setShowIncidentForm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {h.incidents.length === 0 ? (
          <p className="text-sm text-gray-400 m-0">No incidents recorded.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {h.incidents.map(inc => (
              <div key={inc.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                {h.editingIncident === inc.id ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={labelCls}>Date</label><input type="date" value={h.incidentEditForm.date || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, date: e.target.value })} className={fieldCls} /></div>
                      <div><label className={labelCls}>Type</label><select value={h.incidentEditForm.type || 'Behavioral'} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, type: e.target.value })} className={fieldCls}>{INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                    </div>
                    <div><label className={labelCls}>Description</label><textarea value={h.incidentEditForm.description || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, description: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
                    <div><label className={labelCls}>Resolution</label><textarea value={h.incidentEditForm.resolution || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, resolution: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <label className={labelCls}>Reported By</label>
                        <input value={h.editStaffSearch} onChange={e => h.handleEditStaffSearch(e.target.value)} placeholder={h.incidentEditForm.reported_by || 'Search staff…'} className={fieldCls} />
                        {h.editStaffResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg z-20 shadow-md">
                            {h.editStaffResults.map(s => (
                              <div key={s.id} onClick={() => { h.setIncidentEditForm({ ...h.incidentEditForm, reported_by: `${s.first_name} ${s.last_name}` }); h.setEditStaffSearch(''); h.setEditStaffResults([]) }}
                                className="px-3 py-2 cursor-pointer text-xs border-b border-gray-100 hover:bg-gray-50">
                                {s.first_name} {s.last_name} <span className="text-gray-400">· {s.role}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div><label className={labelCls}>Status</label><select value={h.incidentEditForm.status || 'Open'} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, status: e.target.value })} className={fieldCls}><option>Open</option><option>Resolved</option></select></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={h.saveIncidentEdit} disabled={h.savingIncident} className="flex-1 text-white border-0 rounded-md py-1.5 font-semibold cursor-pointer text-xs disabled:opacity-70 hover:opacity-90" style={{ background: primaryColor }}>{h.savingIncident ? 'Saving…' : 'Save'}</button>
                      <button onClick={h.cancelIncidentEdit} className="bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer text-xs hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ color: INCIDENT_TYPE_COLORS[inc.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[inc.type] || '#6b7280') + '18' }}>{inc.type}</span>
                        <span className="text-xs text-gray-400">{inc.date}</span>
                        <span className={`text-xs font-semibold ${inc.status === 'Open' ? 'text-red-500' : 'text-green-500'}`}>{inc.status}</span>
                      </div>
                      <button onClick={() => { h.setEditingIncident(inc.id); h.setIncidentEditForm({ ...inc }) }} className="text-[0.7rem] text-gray-400 bg-transparent border border-gray-200 rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-400">Edit</button>
                    </div>
                    {inc.description && <p className="text-sm text-gray-700 m-0 mb-1.5 leading-relaxed">{inc.description}</p>}
                    {inc.resolution && <p className="text-xs text-gray-500 italic m-0 mb-1">Resolution: {inc.resolution}</p>}
                    {inc.reported_by && <p className="text-xs text-gray-400 m-0">Reported by: {inc.reported_by}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`${cardCls} mb-12 border border-gray-100`}>
        <div className={secHead}>Actions</div>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => { h.setGraduateConfirm(true); h.setDeleteConfirm(false); h.setGraduateForm({ graduation_year: new Date().getFullYear(), grade_completed: student.grade || '' }) }}
            className="bg-orange-50 border-2 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >🎓 Graduate to Alumni</button>
          <button onClick={() => h.setDeleteConfirm(true)} className="bg-white text-red-500 border border-red-400 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:bg-red-50">
            Delete Student
          </button>
        </div>

        {h.graduateConfirm && (
          <div className="mt-5 bg-orange-50 border border-orange-200 rounded-xl p-5">
            <p className="text-orange-900 font-semibold m-0 mb-2">Graduate {student.first_name} {student.last_name} to Alumni?</p>
            <p className="text-orange-700 text-sm m-0 mb-4">They will be removed from the student roster and added to Alumni.</p>
            <div className="grid grid-cols-2 gap-3 mb-4 max-w-sm">
              <div>
                <label className={labelCls}>Graduation Year</label>
                <input type="number" value={h.graduateForm.graduation_year} onChange={e => h.setGraduateForm({ ...h.graduateForm, graduation_year: e.target.value })} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Grade Completed</label>
                <select value={h.graduateForm.grade_completed} onChange={e => h.setGraduateForm({ ...h.graduateForm, grade_completed: e.target.value })} className={fieldCls}>
                  <option value="">Unknown</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={h.graduateToAlumni} disabled={h.graduating} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>{h.graduating ? 'Moving…' : 'Confirm Graduate'}</button>
              <button onClick={() => h.setGraduateConfirm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {h.deleteConfirm && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-red-800 font-semibold m-0 mb-2">Delete {student.first_name} {student.last_name}?</p>
            <p className="text-red-700 text-sm m-0 mb-4">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={h.handleDeleteStudent} className="bg-red-500 text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer hover:bg-red-600">Yes, Delete</button>
              <button onClick={() => h.setDeleteConfirm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function InfoRow({ label, value, children }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      {children
        ? <div>{children}</div>
        : <span className="text-sm text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
      }
    </div>
  )
}

function StatPill({ label, value, valueColor }) {
  return (
    <div>
      <div className="text-[0.68rem] text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-semibold" style={{ color: valueColor || '#1f2937' }}>{value}</div>
    </div>
  )
}
