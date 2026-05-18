import { useEffect, useRef, useState } from 'react'
import { useClasses } from './hooks/useClasses'
import { CLASS_STATUS, ENROLLMENT_MODES } from './domain/classes'
import { DIVISION_COLORS, parseDivisions } from './domain/school'

export default function Classes({ user, school, openClassId, onClearOpenClass }) {
  const primaryColor = school?.primary_color || '#f97316'
  const c = useClasses(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))
  const divisions   = allDivs.filter(d => d.grades?.length > 0)

  // Edit tab state — local UI only
  const [editTab, setEditTab] = useState('info')

  // Capture the target ID at mount so prop-clearing doesn't race with async class load
  const pendingIdRef = useRef(openClassId)
  useEffect(() => {
    if (!pendingIdRef.current || c.loading || c.classes.length === 0) return
    const cls = c.classes.find(cl => cl.id === pendingIdRef.current)
    if (cls) {
      pendingIdRef.current = null
      c.openClass(cls)
      c.startEdit(cls)
      onClearOpenClass?.()
    }
  }, [c.loading, c.classes.length])

  // Reset to info tab when edit opens
  useEffect(() => {
    if (c.editing) setEditTab('info')
  }, [c.editing])

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  // ── Edit view (full screen, two tabs) ─────────────────────────────────────
  if (c.editing) {
    const cap   = c.form.class_size ? parseInt(c.form.class_size, 10) : null
    const count = c.enrollments.length
    const atCap = cap !== null && count >= cap
    const pct   = cap ? Math.min(100, Math.round(count / cap * 100)) : null
    const mode  = c.form.enrollment_mode || 'open'
    const showIndividual = mode === 'open' || mode === 'mixed'
    const showCohort     = mode === 'cohort' || mode === 'mixed'

    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={c.cancelEdit}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0' }}
            >← Classes</button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              {c.selected ? c.selected.name : 'New Class'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <button
              onClick={c.handleSave}
              disabled={c.saving}
              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
            >{c.saving ? 'Saving…' : c.selected ? 'Save Changes' : 'Add Class'}</button>
            <button
              onClick={c.cancelEdit}
              style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
            >Cancel</button>
            {c.selected && (
              c.deleteId === c.selected.id ? (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '500' }}>Delete this class?</span>
                  <button onClick={() => c.handleDelete(c.selected.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Yes, Delete</button>
                  <button onClick={() => c.setDeleteId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => c.setDeleteId(c.selected.id)}
                  style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >Delete</button>
              )
            )}
          </div>
        </div>

        {c.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>⚠ {c.error}</p>}
        {c.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {c.success}</p>}

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
            {[
              { id: 'info',       label: '📚 Class Info' },
              { id: 'enrollment', label: (() => {
                if (!c.selected) return '👥 Class Enrollment'
                if (count > 0) return `👥 Class Enrollment (${count} enrolled)`
                return '👥 Class Enrollment'
              })() },
            ].map(tab => {
              const isActive   = editTab === tab.id
              const isDisabled = tab.id === 'enrollment' && !c.selected
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setEditTab(tab.id)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '400',
                    background: isActive ? primaryColor : 'transparent',
                    color: isActive ? 'white' : isDisabled ? '#d1d5db' : '#6b7280',
                    boxShadow: isActive ? `0 1px 3px ${primaryColor}40` : 'none',
                    transition: 'all 0.15s',
                  }}
                >{tab.label}</button>
              )
            })}
          </div>
          {!c.selected && (
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
              Save the class first to manage enrollment
            </span>
          )}
        </div>

        {/* ── Tab: Class Info ── */}
        {editTab === 'info' && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

              <div>
                <label style={labelStyle}>Class Name *</label>
                <input
                  value={c.form.name}
                  onChange={e => c.setForm({ ...c.form, name: e.target.value })}
                  placeholder="e.g. 3rd Grade Math"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                {c.subjects.length > 0 ? (
                  <select value={c.form.subject} onChange={e => c.setForm({ ...c.form, subject: e.target.value })} style={inputStyle}>
                    <option value="">— None —</option>
                    {c.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={c.form.subject} onChange={e => c.setForm({ ...c.form, subject: e.target.value })} placeholder="e.g. Mathematics" style={inputStyle} />
                )}
              </div>

              <div>
                <label style={labelStyle}>Division</label>
                {c.divisions.length > 0 ? (
                  <select value={c.form.division} onChange={e => c.setForm({ ...c.form, division: e.target.value })} style={inputStyle}>
                    <option value="">— None —</option>
                    {c.divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                ) : (
                  <input value={c.form.division} onChange={e => c.setForm({ ...c.form, division: e.target.value })} placeholder="e.g. Lower School" style={inputStyle} />
                )}
              </div>

              <div>
                <label style={labelStyle}>Teacher</label>
                <select value={c.form.teacher_id} onChange={e => c.selectTeacher(e.target.value)} style={inputStyle}>
                  <option value="">— Unassigned —</option>
                  {c.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Default Room</label>
                <select value={c.form.room_id} onChange={e => c.selectRoom(e.target.value)} style={inputStyle}>
                  <option value="">— Unassigned —</option>
                  {c.rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}{r.building ? ` (${r.building})` : ''}{r.capacity ? ` — cap. ${r.capacity}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Class Size (cap)</label>
                <input
                  type="number"
                  min="1"
                  value={c.form.class_size || ''}
                  onChange={e => c.setForm({ ...c.form, class_size: e.target.value })}
                  placeholder="Max students"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select value={c.form.status} onChange={e => c.setForm({ ...c.form, status: e.target.value })} style={inputStyle}>
                  {CLASS_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={c.form.description || ''}
                  onChange={e => c.setForm({ ...c.form, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of this class…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={c.form.notes || ''}
                  onChange={e => c.setForm({ ...c.form, notes: e.target.value })}
                  rows={2}
                  placeholder="Internal notes…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Capacity warning */}
            {(() => {
              const room = c.form.room_id ? c.rooms.find(r => r.id === c.form.room_id) : null
              const size = parseInt(c.form.class_size, 10)
              if (room && room.capacity && size && size > room.capacity) {
                return (
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.5rem', padding: '0.625rem 1rem', color: '#92400e', fontSize: '0.875rem' }}>
                    ⚠️ Class size ({size}) exceeds <strong>{room.name}</strong> capacity ({room.capacity}). Consider a larger room or reduce class size.
                  </div>
                )
              }
              return null
            })()}

          </div>
        )}

        {/* ── Tab: Class Enrollment ── */}
        {editTab === 'enrollment' && c.selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Mode selector */}
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
                Class Enrollment Mode
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {ENROLLMENT_MODES.map(m => {
                  const active = mode === m.value
                  return (
                    <button
                      key={m.value}
                      onClick={() => c.setForm({ ...c.form, enrollment_mode: m.value })}
                      style={{
                        flex: 1, padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: '600',
                        border: `2px solid ${active ? primaryColor : '#e5e7eb'}`,
                        background: active ? primaryColor + '10' : 'white',
                        color: active ? primaryColor : '#6b7280',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      }}
                    >
                      <div>{m.label}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '400', opacity: 0.75, marginTop: '0.15rem' }}>{m.description}</div>
                    </button>
                  )
                })}
              </div>
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                Changes to enrollment mode are saved when you click <strong>Save Changes</strong> above.
              </p>
            </div>

            {/* Cohort assignment panel */}
            {showCohort && (
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Cohort Assignment
                </div>
                {c.cohortEnrolling && (
                  <p style={{ fontSize: '0.8rem', color: '#6366f1', marginBottom: '0.75rem' }}>⏳ Assigning cohort and enrolling students…</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                  {/* Left — available cohorts */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Available Cohorts ({c.availableCohorts.length})
                    </div>
                    <input
                      type="text"
                      placeholder="Filter cohorts…"
                      value={c.cohortSearch}
                      onChange={e => c.setCohortSearch(e.target.value)}
                      style={{ ...inputStyle, marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.375rem 0.625rem' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto', padding: '0.25rem 0' }}>
                      {c.availableCohorts.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>
                          {c.cohortSearch ? 'No matches.' : 'All cohorts assigned.'}
                        </p>
                      ) : c.availableCohorts.map(coh => (
                        <button
                          key={coh.id}
                          onClick={() => c.handleAddCohort(coh.id)}
                          disabled={c.cohortEnrolling}
                          title="Assign cohort and enroll all members"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
                            border: '1.5px solid #6366f1', background: 'white', color: '#6366f1',
                            cursor: c.cohortEnrolling ? 'not-allowed' : 'pointer',
                            opacity: c.cohortEnrolling ? 0.5 : 1,
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={ev => { if (!c.cohortEnrolling) { ev.currentTarget.style.background = '#6366f1'; ev.currentTarget.style.color = 'white' }}}
                          onMouseLeave={ev => { ev.currentTarget.style.background = 'white'; ev.currentTarget.style.color = '#6366f1' }}
                        >
                          👥 {coh.name}
                          {coh.division && <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>{coh.division}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right — assigned cohorts */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Assigned ({c.classCohorts.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto', padding: '0.25rem 0' }}>
                      {c.classCohorts.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>No cohorts assigned yet.</p>
                      ) : c.classCohorts.map(cc => (
                        <div key={cc.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.85rem',
                          background: '#f0fdf4', border: '1.5px solid #86efac',
                        }}>
                          <span style={{ flex: 1, fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            👥 {cc.cohorts?.name}
                          </span>
                          {cc.cohorts?.division && (
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{cc.cohorts.division}</span>
                          )}
                          <button
                            onClick={() => c.handleRemoveCohort(cc.id, cc.cohort_id)}
                            title="Remove cohort and unenroll its students"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '1rem', padding: '0 0.125rem', lineHeight: 1 }}
                            onMouseEnter={ev => ev.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={ev => ev.currentTarget.style.color = '#d1d5db'}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual student enrollment panel */}
            {showIndividual && (
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Individual Class Enrollment
                  </div>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: '700', borderRadius: '9999px', padding: '0.25rem 0.75rem',
                    background: atCap ? '#fef2f2' : '#f0fdf4',
                    color:      atCap ? '#b91c1c' : '#15803d',
                  }}>
                    {cap ? `${count} / ${cap}` : `${count} enrolled`}{atCap ? ' · Full' : ''}
                  </span>
                </div>

                {cap && (
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '9999px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: atCap ? '#ef4444' : primaryColor, borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                )}

                {atCap && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.8rem', fontWeight: '500' }}>
                    🔒 Class is at capacity — increase Class Size (cap) on the Class Info tab to enroll more.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* Left — available */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Available ({c.availableStudents.length})
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by name or grade…"
                      value={c.enrollSearch}
                      onChange={e => c.setEnrollSearch(e.target.value)}
                      style={{ ...inputStyle, marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.375rem 0.625rem' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', maxHeight: '240px', overflowY: 'auto', padding: '0.25rem 0' }}>
                      {c.availableStudents.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>
                          {c.enrollSearch ? 'No matches.' : 'All students enrolled.'}
                        </p>
                      ) : c.availableStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => !atCap && c.handleEnroll(s.id)}
                          disabled={atCap || c.enrollSaving}
                          title={atCap ? 'Class is at capacity' : `Enroll ${s.first_name} ${s.last_name}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
                            border: `1.5px solid ${primaryColor}`, background: 'white', color: primaryColor,
                            cursor: atCap ? 'not-allowed' : 'pointer', opacity: atCap ? 0.45 : 1,
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={ev => { if (!atCap) { ev.currentTarget.style.background = primaryColor; ev.currentTarget.style.color = 'white' }}}
                          onMouseLeave={ev => { ev.currentTarget.style.background = 'white'; ev.currentTarget.style.color = primaryColor }}
                        >
                          {s.first_name} {s.last_name}
                          <span style={{ fontSize: '0.68rem', color: 'inherit', opacity: 0.65 }}>{s.grade}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right — enrolled */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Enrolled ({count})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', maxHeight: '280px', overflowY: 'auto', padding: '0.25rem 0' }}>
                      {c.enrollments.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>No students enrolled yet.</p>
                      ) : c.enrollments.map(e => (
                        <div
                          key={e.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.3rem 0.5rem 0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
                            background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d',
                          }}
                        >
                          {e.students?.first_name} {e.students?.last_name}
                          <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>{e.students?.grade}</span>
                          <button
                            onClick={() => c.handleUnenroll(e.id)}
                            title="Remove student"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac', fontSize: '0.75rem', lineHeight: 1, padding: '0 0 0 0.125rem', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={ev => ev.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={ev => ev.currentTarget.style.color = '#86efac'}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    )
  }

  // ── Card grid view ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Classes</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage your school's classes, subjects, and teacher assignments</p>
        </div>
        <button onClick={c.startAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
          + Add Class
        </button>
      </div>

      {c.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {c.success}</p>}

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Total Classes" value={c.stats.total}    icon="📚" />
        <StatCard label="Active"        value={c.stats.active}   color="#10b981" />
        <StatCard label="Inactive"      value={c.stats.inactive} color="#9ca3af" />
        {Object.entries(c.stats.byDivision).map(([div, count]) => (
          <StatCard key={div} label={div} value={count} color={divColorMap[div] || '#6b7280'} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, teacher, or subject…"
          value={c.search}
          onChange={e => c.setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', fontSize: '0.875rem' }}
        />
        {divisions.length > 0 && (
          <select value={c.filterDiv} onChange={e => c.setFilterDiv(e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', fontSize: '0.875rem', background: 'white', minWidth: '160px' }}>
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        )}
        <select value={c.filterStatus} onChange={e => c.setFilterStatus(e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', fontSize: '0.875rem', background: 'white', minWidth: '130px' }}>
          <option value="">All Statuses</option>
          {CLASS_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(c.search || c.filterDiv || c.filterStatus) && (
          <button
            onClick={() => { c.setSearch(''); c.setFilterDiv(''); c.setFilterStatus('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}
          >Clear</button>
        )}
      </div>

      {/* Class cards */}
      {c.loading ? (
        <p style={{ color: '#9ca3af' }}>Loading classes…</p>
      ) : c.filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {c.classes.length === 0 ? 'No classes yet. Add your first class to get started.' : 'No classes match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {c.filtered.map(cls => {
            const divColor = divColorMap[cls.division] || null
            const isActive = cls.status === 'Active'

            return (
              <div
                key={cls.id}
                onClick={() => { c.openClass(cls); c.startEdit(cls) }}
                style={{
                  background: 'white', borderRadius: '1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  overflow: 'hidden', transition: 'box-shadow 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
              >
                <div style={{ height: '4px', background: divColor || primaryColor }} />

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>{cls.name}</div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', borderRadius: '9999px', padding: '0.2rem 0.625rem', whiteSpace: 'nowrap',
                      background: isActive ? '#f0fdf4' : '#f3f4f6',
                      color:      isActive ? '#15803d' : '#9ca3af',
                    }}>{cls.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                    {cls.subject && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: primaryColor, background: primaryColor + '15', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                        {cls.subject}
                      </span>
                    )}
                    {cls.division && divColor && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: divColor, background: divColor + '15', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                        {cls.division}
                      </span>
                    )}
                    {cls.enrollment_mode && cls.enrollment_mode !== 'open' && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6366f1', background: '#eef2ff', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                        {cls.enrollment_mode === 'cohort' ? '👥 Cohort' : '👥 Mixed'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {cls.teacher_name && <span>👩‍🏫 {cls.teacher_name}</span>}
                    {cls.room_name    && <span>🚪 {cls.room_name}</span>}
                    {cls.class_size   && <span>👥 {cls.class_size} max</span>}
                  </div>

                  {/* Capacity conflict badge */}
                  {(() => {
                    const room = cls.room_id ? c.rooms.find(r => r.id === cls.room_id) : null
                    if (room && room.capacity && cls.class_size && cls.class_size > room.capacity) {
                      return (
                        <div style={{ marginBottom: '0.625rem', fontSize: '0.72rem', fontWeight: '600', color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.375rem', padding: '0.2rem 0.5rem' }}>
                          ⚠️ Over capacity by {cls.class_size - room.capacity}
                        </div>
                      )
                    }
                    return null
                  })()}

                  {cls.description && (
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.5rem 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cls.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon  && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
      {color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />}
      <span style={{ fontWeight: '700', color: '#1f2937' }}>{value}</span>
      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</span>
    </div>
  )
}
