import { getDivision } from './domain/school'
import { ALL_GRADES } from './domain/enrollment'
import {
  INCIDENT_TYPES, INCIDENT_TYPE_COLORS,
  HEALTH_ENTRY_CATEGORIES, HEALTH_CATEGORY_COLORS, HEALTH_CATEGORY_ICONS,
  BLANK_HEALTH_ENTRY,
  statusColor, parentDisplayName, isEntryExpired, isSkipGrade,
} from './domain/students'

export default function StudentProfile({ student, school, h }) {
  const primaryColor = school?.primary_color || '#f97316'
  const GRADES = h.configuredGrades || ALL_GRADES

  const inputStyle  = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle  = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }
  const cardStyle   = { background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }
  const cardHead    = { fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }

  // ── Grade journey bar data ───────────────────────────────────────────────────
  const gradeSet     = new Set(h.gradeHistory.map(e => e.grade))
  const currentGrade = student.grade
  // Map grade → flags for repeat/skip annotations
  const gradeMeta    = h.gradeHistory.reduce((acc, e) => {
    if (!acc[e.grade]) acc[e.grade] = { repeat: false, skip: false }
    if (e.is_repeat) acc[e.grade].repeat = true
    if (e.is_skip)   acc[e.grade].skip   = true
    return acc
  }, {})

  const gradeState = (g) => {
    if (g === currentGrade) return 'current'
    if (gradeSet.has(g))   return 'past'
    return 'future'
  }

  const division = getDivision(student.grade, school?.divisions)

  // ── Edit mode ────────────────────────────────────────────────────────────────
  if (h.editing) {
    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => h.setEditing(false)}
          style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >← Cancel Edit</button>

        <div style={cardStyle}>
          <div style={{ ...cardHead }}>Edit Student Profile</div>
          {h.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{h.error}</p>}

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>First Name</label><input name="first_name" value={h.editForm.first_name || ''} onChange={h.handleEditChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Last Name</label><input name="last_name" value={h.editForm.last_name || ''} onChange={h.handleEditChange} style={inputStyle} /></div>
            </div>

            <div>
              <label style={labelStyle}>Grade</label>
              {(() => {
                const locked = !h.configuredGrades || h.editForm.status !== 'Enrolled'
                return (
                  <>
                    <select name="grade" value={h.editForm.grade || ''} onChange={e => { h.handleEditChange(e); h.setRepeatGrade(false); h.setSkipGrade(false) }}
                      disabled={locked}
                      style={{ ...inputStyle, background: locked ? '#f3f4f6' : 'white', cursor: locked ? 'not-allowed' : 'pointer', color: locked ? '#9ca3af' : '#1f2937' }}>
                      <option value="">{!h.configuredGrades ? 'Configure grades in Settings first' : 'Select grade'}</option>
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                    {h.configuredGrades && h.editForm.status !== 'Enrolled' && (
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.35rem 0 0' }}>🔒 Grade progression is locked until the student is <strong>Enrolled</strong>.</p>
                    )}
                    {h.editForm.grade && h.editForm.grade === student.grade && (
                      <div onClick={() => h.setRepeatGrade(!h.repeatGrade)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${h.repeatGrade ? primaryColor : '#d1d5db'}`, background: h.repeatGrade ? primaryColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {h.repeatGrade && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: h.repeatGrade ? primaryColor : '#6b7280', fontWeight: h.repeatGrade ? '600' : '400' }}>Student is repeating this grade</span>
                      </div>
                    )}
                    {h.editForm.grade && h.editForm.grade !== student.grade && isSkipGrade(student.grade, h.editForm.grade) && (
                      <div onClick={() => h.setSkipGrade(!h.skipGrade)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${h.skipGrade ? '#8b5cf6' : '#d1d5db'}`, background: h.skipGrade ? '#8b5cf6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {h.skipGrade && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: h.skipGrade ? '#8b5cf6' : '#6b7280', fontWeight: h.skipGrade ? '600' : '400' }}>Student is skipping a grade</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={h.editForm.status || 'Applied'} onChange={h.handleEditChange} style={inputStyle}>
                <option>Applied</option><option>Enrolled</option><option>Waitlisted</option>
              </select>
            </div>

            <div><label style={labelStyle}>Date of Birth</label><input type="date" name="date_of_birth" value={h.editForm.date_of_birth || ''} onChange={h.handleEditChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Notes</label><textarea name="notes" value={h.editForm.notes || ''} onChange={h.handleEditChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>

            <div>
              <label style={labelStyle}>Parent / Guardian</label>
              {!h.changingParent ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{parentDisplayName(h.editParent)}</span>
                  <button onClick={() => h.setChangingParent(true)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Change</button>
                </div>
              ) : (
                <div>
                  <input autoFocus placeholder="Search parents by name or email…" value={h.parentChangeSearch} onChange={e => h.searchParentChange(e.target.value)} style={inputStyle} />
                  {h.parentChangeResults.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white', marginTop: '0.25rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {h.parentChangeResults.map(p => (
                        <div key={p.id} onClick={() => h.selectParentChange(p)}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <strong>{p.first_name} {p.last_name}</strong>
                          {p.email && <span style={{ color: '#6b7280' }}> · {p.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { h.setChangingParent(false); h.searchParentChange('') }} style={{ fontSize: '0.78rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>Cancel</button>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>Edit parent contact details in the Parents module.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={h.saveEdit} disabled={h.saving} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
              {h.saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => h.setEditing(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ── View mode ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <button
        onClick={h.closeProfile}
        style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
      >
        ← Back to Students
      </button>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ background: primaryColor, borderRadius: '1rem', padding: '1.75rem 2rem', marginBottom: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.375rem' }}>
            {student.first_name} {student.last_name}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '9999px', padding: '0.2rem 0.875rem', fontSize: '0.85rem', fontWeight: '600' }}>
              {student.status || 'Applied'}
            </span>
            {student.grade && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.875rem', fontSize: '0.85rem' }}>
                {student.grade}
              </span>
            )}
            {division && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.2rem 0.875rem', fontSize: '0.85rem', borderLeft: `3px solid ${division.color}` }}>
                {division.name}
              </span>
            )}
            {student.date_of_birth && (
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>DOB: {student.date_of_birth}</span>
            )}
          </div>
        </div>
        <button onClick={h.startEdit} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          ✏️ Edit Profile
        </button>
      </div>

      {/* ── Grade Journey Bar ─────────────────────────────────────────────────── */}
      {GRADES.length > 0 && (
        <div style={cardStyle}>
          <div style={cardHead}>Academic Journey</div>
          <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', borderRadius: '0.625rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {GRADES.map((grade, i) => {
              const state = gradeState(grade)
              const isLast = i === GRADES.length - 1
              const bg =
                state === 'current' ? primaryColor :
                state === 'past'    ? primaryColor + '30' :
                '#f9fafb'
              const color =
                state === 'current' ? 'white' :
                state === 'past'    ? primaryColor :
                '#9ca3af'
              const weight = state === 'current' ? '700' : state === 'past' ? '600' : '400'

              return (
                <div
                  key={grade}
                  style={{
                    flex: 1, minWidth: '60px',
                    background: bg,
                    borderRight: isLast ? 'none' : '1px solid #e5e7eb',
                    padding: '0.75rem 0.5rem',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {state === 'current' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.6)', borderRadius: '2px 2px 0 0' }} />
                  )}
                  <div style={{ fontSize: '0.75rem', fontWeight: weight, color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {grade.replace(' Grade', '').replace('Grade ', '')}
                  </div>
                  <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', color: state === 'current' ? 'rgba(255,255,255,0.8)' : state === 'past' ? primaryColor + 'aa' : '#d1d5db' }}>
                    {state === 'current' ? '● now' : state === 'past' ? '✓' : ''}
                  </div>
                  {gradeMeta[grade]?.repeat && <div style={{ fontSize: '0.6rem', color: state === 'current' ? 'rgba(255,255,255,0.75)' : '#f59e0b', marginTop: '0.1rem' }}>repeated</div>}
                  {gradeMeta[grade]?.skip   && <div style={{ fontSize: '0.6rem', color: state === 'current' ? 'rgba(255,255,255,0.75)' : '#8b5cf6', marginTop: '0.1rem' }}>skipped</div>}
                </div>
              )
            })}
          </div>
          {h.gradeHistory.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.75rem 0 0' }}>No grade history recorded yet — highlighted once the student is enrolled and a grade is assigned.</p>
          )}
        </div>
      )}

      {/* ── Info cards (2-col) ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* General Info */}
        <div style={cardStyle}>
          <div style={cardHead}>Student Info</div>
          <InfoRow label="Full Name" value={`${student.first_name} ${student.last_name}`} />
          <InfoRow label="Date of Birth" value={student.date_of_birth || '—'} />
          <InfoRow label="Grade" value={student.grade || '—'} />
          <InfoRow label="Status">
            <span style={{ background: statusColor(student.status) + '20', color: statusColor(student.status), borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
              {student.status || 'Applied'}
            </span>
          </InfoRow>
          {student.notes && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
              {student.notes}
            </div>
          )}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Report cards on file: </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: h.reportCardCount > 0 ? primaryColor : '#9ca3af' }}>
              {h.reportCardCount > 0 ? `${h.reportCardCount} report card${h.reportCardCount !== 1 ? 's' : ''}` : 'None yet'}
            </span>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div style={cardStyle}>
          <div style={cardHead}>Parent / Guardian</div>
          <InfoRow label="Name"    value={parentDisplayName(student.parents)} />
          <InfoRow label="Email"   value={student.parents?.email   || '—'} />
          <InfoRow label="Phone"   value={student.parents?.phone   || '—'} />
          <InfoRow label="Address" value={student.parents?.address || '—'} />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '1rem 0 0' }}>Edit parent contact details in the Parents module.</p>
        </div>
      </div>

      {/* ── Health Records ───────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={cardHead}>Health Records</div>
          <button onClick={h.toggleHealthProfileEdit} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}>
            {h.showHealthProfileEdit ? 'Cancel' : h.healthProfile ? 'Edit Profile' : '+ Add Profile'}
          </button>
        </div>

        {/* Health profile edit form */}
        {h.showHealthProfileEdit && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Blood Type</label>
                <select value={h.healthProfileForm.blood_type || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, blood_type: e.target.value })} style={inputStyle}>
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Last Physical</label>
                <input type="date" value={h.healthProfileForm.physical_date || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, physical_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Primary Physician</label>
                <input value={h.healthProfileForm.primary_physician || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, primary_physician: e.target.value })} style={inputStyle} placeholder="Dr. Name" />
              </div>
              <div>
                <label style={labelStyle}>Physician Phone</label>
                <input value={h.healthProfileForm.physician_phone || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, physician_phone: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Insurance Provider</label>
                <input value={h.healthProfileForm.insurance_provider || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, insurance_provider: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Policy #</label>
                <input value={h.healthProfileForm.insurance_policy_number || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, insurance_policy_number: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact</label>
                <input value={h.healthProfileForm.emergency_contact_name || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_name: e.target.value })} style={inputStyle} placeholder="Full name" />
              </div>
              <div>
                <label style={labelStyle}>Relationship</label>
                <input value={h.healthProfileForm.emergency_contact_relationship || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_relationship: e.target.value })} style={inputStyle} placeholder="e.g. Aunt" />
              </div>
              <div>
                <label style={labelStyle}>Emergency Phone</label>
                <input value={h.healthProfileForm.emergency_contact_phone || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, emergency_contact_phone: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={h.healthProfileForm.notes || ''} onChange={e => h.setHealthProfileForm({ ...h.healthProfileForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={h.handleSaveHealthProfile} disabled={h.savingHealthProfile} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                {h.savingHealthProfile ? 'Saving…' : 'Save Health Profile'}
              </button>
              {h.healthProfile && (
                <button onClick={h.handleDeleteHealthProfile} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
              )}
            </div>
          </div>
        )}

        {/* Health profile view */}
        {!h.showHealthProfileEdit && h.healthProfile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
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
            {h.healthProfile.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Notes: </span><span style={{ fontSize: '0.78rem', color: '#374151' }}>{h.healthProfile.notes}</span></div>}
          </div>
        )}

        {!h.showHealthProfileEdit && !h.healthProfile && (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.25rem' }}>No health profile on file.</p>
        )}

        {/* Health entries */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conditions, Allergies & More</span>
            <button onClick={() => h.setShowHealthEntryForm(!h.showHealthEntryForm)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}>
              {h.showHealthEntryForm ? 'Cancel' : '+ Add Entry'}
            </button>
          </div>

          {h.showHealthEntryForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={h.healthEntryForm.category} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, category: e.target.value })} style={inputStyle}>
                    {HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input value={h.healthEntryForm.name} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, name: e.target.value })} placeholder="e.g. Peanut Allergy" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Detail</label>
                  <input value={h.healthEntryForm.detail} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, detail: e.target.value })} placeholder="Dosage, reaction type…" style={inputStyle} />
                </div>
                <div><label style={labelStyle}>Date</label><input type="date" value={h.healthEntryForm.date} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, date: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Expiration</label><input type="date" value={h.healthEntryForm.expiration_date} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, expiration_date: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><input value={h.healthEntryForm.notes} onChange={e => h.setHealthEntryForm({ ...h.healthEntryForm, notes: e.target.value })} style={inputStyle} /></div>
              </div>
              <button onClick={h.saveHealthEntry} disabled={h.savingHealthEntry || !h.healthEntryForm.name.trim()} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', opacity: !h.healthEntryForm.name.trim() ? 0.5 : 1 }}>
                {h.savingHealthEntry ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          )}

          {h.healthEntries.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>No health entries recorded.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {h.healthEntries.map(entry => {
                const color = HEALTH_CATEGORY_COLORS[entry.category] || '#6b7280'
                const expired = isEntryExpired(entry)
                const isEditing = h.editingHealthEntry === entry.id
                return (
                  <div key={entry.id} style={{ background: '#f9fafb', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '0.5rem', padding: '0.75rem' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div><label style={labelStyle}>Category</label>
                            <select value={h.healthEntryEditForm.category} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, category: e.target.value })} style={inputStyle}>
                              {HEALTH_ENTRY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div><label style={labelStyle}>Name *</label><input value={h.healthEntryEditForm.name} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, name: e.target.value })} style={inputStyle} /></div>
                          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Detail</label><input value={h.healthEntryEditForm.detail || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, detail: e.target.value })} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Date</label><input type="date" value={h.healthEntryEditForm.date || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, date: e.target.value })} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Expiration</label><input type="date" value={h.healthEntryEditForm.expiration_date || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, expiration_date: e.target.value })} style={inputStyle} /></div>
                          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Notes</label><input value={h.healthEntryEditForm.notes || ''} onChange={e => h.setHealthEntryEditForm({ ...h.healthEntryEditForm, notes: e.target.value })} style={inputStyle} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={h.handleUpdateHealthEntry} disabled={h.savingHealthEntryEdit || !h.healthEntryEditForm.name.trim()} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.4rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>{h.savingHealthEntryEdit ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => h.setEditingHealthEntry(null)} style={{ flex: 1, background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                          <button onClick={() => { h.handleDeleteHealthEntry(entry.id); h.setEditingHealthEntry(null) }} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color, background: color + '18', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>{HEALTH_CATEGORY_ICONS[entry.category]} {entry.category}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1f2937' }}>{entry.name}</span>
                            {expired && <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#ef4444', background: '#ef444418', borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>Expired</span>}
                          </div>
                          <button onClick={() => h.openHealthEntryEdit(entry)} style={{ fontSize: '0.72rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.3rem', padding: '0.1rem 0.4rem', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>Edit</button>
                        </div>
                        {entry.detail && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.25rem' }}>{entry.detail}</p>}
                        <div style={{ display: 'flex', gap: '0.875rem' }}>
                          {entry.date && <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>📅 {entry.date}</span>}
                          {entry.expiration_date && <span style={{ fontSize: '0.72rem', color: expired ? '#ef4444' : '#9ca3af' }}>Exp: {entry.expiration_date}</span>}
                        </div>
                        {entry.notes && <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0', fontStyle: 'italic' }}>{entry.notes}</p>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Incidents ────────────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={cardHead}>Incident Log</div>
          {!h.showIncidentForm && (
            <button onClick={() => h.setShowIncidentForm(true)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}>+ Log Incident</button>
          )}
        </div>

        {h.showIncidentForm && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={labelStyle}>Date</label><input type="date" value={h.incidentForm.date} onChange={e => h.setIncidentForm({ ...h.incidentForm, date: e.target.value })} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={h.incidentForm.type} onChange={e => h.setIncidentForm({ ...h.incidentForm, type: e.target.value })} style={inputStyle}>
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><label style={labelStyle}>Description <span style={{ color: '#ef4444' }}>*</span></label><textarea value={h.incidentForm.description} onChange={e => h.setIncidentForm({ ...h.incidentForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What happened?" /></div>
            <div><label style={labelStyle}>Resolution</label><textarea value={h.incidentForm.resolution} onChange={e => h.setIncidentForm({ ...h.incidentForm, resolution: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Action taken (optional)" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Reported By</label>
                {h.incidentForm.reported_by ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>{h.incidentForm.reported_by}</span>
                    <button onClick={() => { h.setIncidentForm({ ...h.incidentForm, reported_by: '' }); h.setStaffSearch(''); h.setStaffResults([]) }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </div>
                ) : (
                  <>
                    <input value={h.staffSearch} onChange={e => h.handleStaffSearch(e.target.value)} style={inputStyle} placeholder="Search staff…" />
                    {h.staffResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '160px', overflowY: 'auto' }}>
                        {h.staffResults.map(s => (
                          <div key={s.id} onClick={() => { h.setIncidentForm({ ...h.incidentForm, reported_by: `${s.first_name} ${s.last_name}` }); h.setStaffSearch(''); h.setStaffResults([]) }}
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <span style={{ fontWeight: '600' }}>{s.first_name} {s.last_name}</span>
                            <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}> · {s.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={h.incidentForm.status} onChange={e => h.setIncidentForm({ ...h.incidentForm, status: e.target.value })} style={inputStyle}>
                  <option>Open</option><option>Resolved</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={h.submitIncident} disabled={h.savingIncident || !h.incidentForm.description} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', opacity: !h.incidentForm.description ? 0.5 : 1 }}>
                {h.savingIncident ? 'Saving…' : 'Save Incident'}
              </button>
              <button onClick={() => h.setShowIncidentForm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </div>
        )}

        {h.incidents.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>No incidents recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {h.incidents.map(inc => (
              <div key={inc.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem' }}>
                {h.editingIncident === inc.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div><label style={labelStyle}>Date</label><input type="date" value={h.incidentEditForm.date || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, date: e.target.value })} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Type</label><select value={h.incidentEditForm.type || 'Behavioral'} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, type: e.target.value })} style={inputStyle}>{INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                    </div>
                    <div><label style={labelStyle}>Description</label><textarea value={h.incidentEditForm.description || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                    <div><label style={labelStyle}>Resolution</label><textarea value={h.incidentEditForm.resolution || ''} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, resolution: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Reported By</label>
                        <input value={h.editStaffSearch} onChange={e => h.handleEditStaffSearch(e.target.value)} placeholder={h.incidentEditForm.reported_by || 'Search staff…'} style={inputStyle} />
                        {h.editStaffResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {h.editStaffResults.map(s => (
                              <div key={s.id} onClick={() => { h.setIncidentEditForm({ ...h.incidentEditForm, reported_by: `${s.first_name} ${s.last_name}` }); h.setEditStaffSearch(''); h.setEditStaffResults([]) }}
                                style={{ padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid #f3f4f6' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                {s.first_name} {s.last_name} <span style={{ color: '#9ca3af' }}>· {s.role}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div><label style={labelStyle}>Status</label><select value={h.incidentEditForm.status || 'Open'} onChange={e => h.setIncidentEditForm({ ...h.incidentEditForm, status: e.target.value })} style={inputStyle}><option>Open</option><option>Resolved</option></select></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={h.saveIncidentEdit} disabled={h.savingIncident} style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.4rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>{h.savingIncident ? 'Saving…' : 'Save'}</button>
                      <button onClick={h.cancelIncidentEdit} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[inc.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[inc.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{inc.type}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{inc.date}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: inc.status === 'Open' ? '#ef4444' : '#10b981' }}>{inc.status}</span>
                      </div>
                      <button onClick={() => { h.setEditingIncident(inc.id); h.setIncidentEditForm({ ...inc }) }} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.3rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}>Edit</button>
                    </div>
                    {inc.description && <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0 0 0.375rem', lineHeight: 1.5 }}>{inc.description}</p>}
                    {inc.resolution && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.25rem', fontStyle: 'italic' }}>Resolution: {inc.resolution}</p>}
                    {inc.reported_by && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Reported by: {inc.reported_by}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: '1.5rem', border: '1px solid #f3f4f6' }}>
        <div style={cardHead}>Actions</div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { h.setGraduateConfirm(true); h.setDeleteConfirm(false); h.setGraduateForm({ graduation_year: new Date().getFullYear(), grade_completed: student.grade || '' }) }}
            style={{ background: '#fff7ed', color: primaryColor, border: `2px solid ${primaryColor}`, borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
          >🎓 Graduate to Alumni</button>

          <button
            onClick={() => h.setDeleteConfirm(true)}
            style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
          >Delete Student</button>
        </div>

        {h.graduateConfirm && (
          <div style={{ marginTop: '1.25rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ color: '#9a3412', fontWeight: '600', margin: '0 0 0.5rem' }}>Graduate {student.first_name} {student.last_name} to Alumni?</p>
            <p style={{ color: '#c2410c', fontSize: '0.875rem', margin: '0 0 1rem' }}>They will be removed from the student roster and added to Alumni.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', maxWidth: '400px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Graduation Year</label>
                <input type="number" value={h.graduateForm.graduation_year} onChange={e => h.setGraduateForm({ ...h.graduateForm, graduation_year: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Grade Completed</label>
                <select value={h.graduateForm.grade_completed} onChange={e => h.setGraduateForm({ ...h.graduateForm, grade_completed: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}>
                  <option value="">Unknown</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={h.graduateToAlumni} disabled={h.graduating} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>{h.graduating ? 'Moving…' : 'Confirm Graduate'}</button>
              <button onClick={() => h.setGraduateConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {h.deleteConfirm && (
          <div style={{ marginTop: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ color: '#991b1b', fontWeight: '600', margin: '0 0 0.5rem' }}>Delete {student.first_name} {student.last_name}?</p>
            <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 1rem' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={h.handleDeleteStudent} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>Yes, Delete</button>
              <button onClick={() => h.setDeleteConfirm(false)} style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: '3rem' }} />
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function InfoRow({ label, value, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
      {children
        ? <div>{children}</div>
        : <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
      }
    </div>
  )
}

function StatPill({ label, value, valueColor }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: valueColor || '#1f2937' }}>{value}</div>
    </div>
  )
}
