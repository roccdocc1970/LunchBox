import { useStaffDashboard } from './hooks/useStaffDashboard'
import { getRoleColor } from './domain/staff'
import {
  INCIDENT_TYPES, INCIDENT_TYPE_COLORS,
  WO_CATEGORIES, WO_PRIORITIES, WO_PRIORITY_COLORS, WO_STATUS_COLORS, CATEGORY_ICONS,
  STATUS_COLORS, getNavItems, canViewFullHealth, canViewLimitedHealth,
} from './domain/staffDashboard'
import Attendance from './Attendance'

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

export default function StaffDashboard({ user, staffMember, school, onLogout }) {
  const primaryColor = school?.primary_color || '#f97316'
  const navItems     = getNavItems(staffMember.role)

  const {
    role, isTeacher, isPrincipalAdmin, gradeAssignments,
    subjects, gradeOptions, termOptions, academicYear,
    activePage, setActivePage,
    students, loadingStudents, filteredStudents,
    selectedStudent, studentSearch, setStudentSearch,
    openStudentProfile, closeStudentProfile,
    studentHealthProfile, studentHealthEntries,
    studentIncidents, showIncidentForm, setShowIncidentForm,
    incidentForm, setIncidentForm, savingIncident, submitIncident,
    allIncidents, filteredIncidents, incidentFilter, setIncidentFilter, incidentStats,
    filteredCards, rcSearch, setRcSearch,
    editingCard, cardForm, setCardForm, savingCard,
    startNewCard, openExistingCard, saveCard, cancelCard, togglePublish,
    staffList,
    filteredWorkOrders, woFilter, setWoFilter,
    showWoForm, setShowWoForm, woForm, setWoForm,
    savingWo, woFormError, submitWorkOrder,
  } = useStaffDashboard(staffMember, school)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

      {/* Top Nav */}
      <div style={{ background: primaryColor, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {school?.logo_url
            ? <img src={school.logo_url} alt="logo" style={{ height: '2rem', borderRadius: '0.25rem', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            : <span style={{ fontSize: '1.75rem' }}>🍱</span>}
          <div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1.2 }}>{school?.name || 'LunchBox'}</div>
            {school?.motto && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>{school.motto}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>{staffMember.first_name} {staffMember.last_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>{staffMember.role}</div>
          </div>
          <button onClick={onLogout} style={{ background: 'white', color: primaryColor, border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem', fontWeight: '600', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '1.5rem 0', position: 'relative' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{
              width: '100%', textAlign: 'left', padding: '0.75rem 1.5rem',
              background: activePage === item.id ? primaryColor + '18' : 'transparent',
              border: 'none', borderLeft: activePage === item.id ? `3px solid ${primaryColor}` : '3px solid transparent',
              color: activePage === item.id ? primaryColor : '#374151',
              fontWeight: activePage === item.id ? '600' : '400',
              cursor: 'pointer', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, width: '220px', padding: '0 1.5rem', boxSizing: 'border-box' }}>
            <div style={{ background: (getRoleColor(staffMember.role)) + '18', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Signed in as</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: getRoleColor(staffMember.role) }}>{staffMember.role}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* ── Students ── */}
          {activePage === 'students' && (
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{isTeacher ? 'My Students' : 'Students'}</h2>
                  {isTeacher && gradeAssignments.length > 0 && (
                    <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>Grades: {gradeAssignments.join(', ')}</p>
                  )}
                </div>
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students…" style={{ ...inputStyle, width: '220px' }} />
              </div>

              {loadingStudents ? <p style={{ color: '#6b7280' }}>Loading…</p> : filteredStudents.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>No students found.</p>
              ) : (
                <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Student', 'Grade', 'Parent', 'Contact', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.id} onClick={() => openStudentProfile(s)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1f2937' }}>{s.first_name} {s.last_name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{s.grade || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{s.parents ? `${s.parents.first_name} ${s.parents.last_name}` : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>{s.parents?.email || s.parents?.phone || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: STATUS_COLORS[s.status] || '#6b7280', background: (STATUS_COLORS[s.status] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Student Profile Drawer */}
              {selectedStudent && (
                <div onClick={e => { if (e.target === e.currentTarget) closeStudentProfile() }}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '420px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
                    <div style={{ background: primaryColor, padding: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedStudent.first_name} {selectedStudent.last_name}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>{selectedStudent.grade || 'No grade'}</div>
                      </div>
                      <button onClick={closeStudentProfile} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                      {/* Parent Contact */}
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Parent / Guardian</div>
                        {selectedStudent.parents ? (
                          <div style={{ background: '#f9fafb', borderRadius: '0.625rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>{selectedStudent.parents.first_name} {selectedStudent.parents.last_name}</div>
                            {selectedStudent.parents.email && <div style={{ color: '#6b7280' }}>✉ {selectedStudent.parents.email}</div>}
                            {selectedStudent.parents.phone && <div style={{ color: '#6b7280' }}>📞 {selectedStudent.parents.phone}</div>}
                          </div>
                        ) : <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No parent linked.</p>}
                      </div>

                      {/* Health Records — role gated */}
                      {(canViewFullHealth(role) || canViewLimitedHealth(role)) && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
                            Health Records {canViewLimitedHealth(role) && !canViewFullHealth(role) && <span style={{ fontWeight: '400', textTransform: 'none', fontSize: '0.7rem' }}>(Emergency &amp; Allergies)</span>}
                          </div>

                          {studentHealthProfile?.emergency_contact_name && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '0.625rem', fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: '700', color: '#dc2626', marginBottom: '0.2rem' }}>🚨 Emergency Contact</div>
                              <div style={{ color: '#374151' }}>{studentHealthProfile.emergency_contact_name}{studentHealthProfile.emergency_contact_relationship ? ` (${studentHealthProfile.emergency_contact_relationship})` : ''}</div>
                              {studentHealthProfile.emergency_contact_phone && <div style={{ color: '#6b7280' }}>📞 {studentHealthProfile.emergency_contact_phone}</div>}
                            </div>
                          )}

                          {(() => {
                            const allergies = studentHealthEntries.filter(e => e.category === 'Allergy')
                            if (allergies.length === 0) return null
                            return (
                              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '0.625rem', fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: '700', color: '#d97706', marginBottom: '0.35rem' }}>⚠️ Allergies ({allergies.length})</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {allergies.map(a => (
                                    <div key={a.id} style={{ color: '#374151' }}>
                                      <span style={{ fontWeight: '600' }}>{a.name}</span>
                                      {a.detail && <span style={{ color: '#6b7280' }}> — {a.detail}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {canViewFullHealth(role) && studentHealthProfile && (
                            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '0.625rem', fontSize: '0.825rem' }}>
                              <div style={{ fontWeight: '700', color: '#6b7280', marginBottom: '0.375rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Health Profile</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.75rem' }}>
                                {studentHealthProfile.blood_type && <><span style={{ color: '#9ca3af' }}>Blood Type</span><span style={{ fontWeight: '600', color: '#ef4444' }}>{studentHealthProfile.blood_type}</span></>}
                                {studentHealthProfile.primary_physician && <><span style={{ color: '#9ca3af' }}>Physician</span><span>{studentHealthProfile.primary_physician}</span></>}
                                {studentHealthProfile.physician_phone && <><span style={{ color: '#9ca3af' }}>Physician Ph.</span><span>{studentHealthProfile.physician_phone}</span></>}
                                {studentHealthProfile.insurance_provider && <><span style={{ color: '#9ca3af' }}>Insurance</span><span>{studentHealthProfile.insurance_provider}</span></>}
                                {studentHealthProfile.physical_date && <><span style={{ color: '#9ca3af' }}>Last Physical</span><span>{studentHealthProfile.physical_date}</span></>}
                                {studentHealthProfile.notes && <span style={{ gridColumn: 'span 2', color: '#6b7280', fontStyle: 'italic' }}>{studentHealthProfile.notes}</span>}
                              </div>
                            </div>
                          )}

                          {canViewFullHealth(role) && (() => {
                            const entries = studentHealthEntries.filter(e => e.category !== 'Allergy')
                            if (entries.length === 0) return null
                            const HEALTH_CATEGORY_COLORS = { Medication: '#3b82f6', Immunization: '#10b981', Condition: '#f59e0b', Injury: '#8b5cf6', Other: '#6b7280' }
                            const HEALTH_CATEGORY_ICONS  = { Medication: '💊', Immunization: '💉', Condition: '🩺', Injury: '🩹', Other: '📋' }
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {entries.map(e => {
                                  const color   = HEALTH_CATEGORY_COLORS[e.category] || '#6b7280'
                                  const icon    = HEALTH_CATEGORY_ICONS[e.category]  || '📋'
                                  const isExpired = e.expiration_date && e.expiration_date < new Date().toISOString().split('T')[0]
                                  return (
                                    <div key={e.id} style={{ background: '#f9fafb', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color }}>{icon} {e.name}</span>
                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                          {isExpired && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '600', background: '#fee2e2', borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>Expired</span>}
                                          <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: color + '18', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontWeight: '600' }}>{e.category}</span>
                                        </div>
                                      </div>
                                      {e.detail && <div style={{ color: '#6b7280', marginTop: '0.15rem' }}>{e.detail}</div>}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {!studentHealthProfile && studentHealthEntries.length === 0 && (
                            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No health records on file.</p>
                          )}
                        </div>
                      )}

                      {/* Incident Log */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incident Log</div>
                          <button onClick={() => setShowIncidentForm(!showIncidentForm)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontWeight: '600' }}>
                            {showIncidentForm ? 'Cancel' : '+ Log Incident'}
                          </button>
                        </div>

                        {showIncidentForm && (
                          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.875rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                              <div>
                                <label style={labelStyle}>Date</label>
                                <input type="date" value={incidentForm.date || ''} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>Type</label>
                                <select value={incidentForm.type || 'Behavioral'} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} style={inputStyle}>
                                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label style={labelStyle}>Description *</label>
                              <textarea value={incidentForm.description || ''} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div>
                              <label style={labelStyle}>Resolution</label>
                              <textarea value={incidentForm.resolution || ''} onChange={e => setIncidentForm({ ...incidentForm, resolution: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <button onClick={submitIncident} disabled={savingIncident || !incidentForm.description}
                              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                              {savingIncident ? 'Saving…' : 'Save Incident'}
                            </button>
                          </div>
                        )}

                        {studentIncidents.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No incidents logged.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {studentIncidents.map(inc => (
                              <div key={inc.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.625rem', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[inc.type], background: INCIDENT_TYPE_COLORS[inc.type] + '18', borderRadius: '9999px', padding: '0.1rem 0.45rem' }}>{inc.type}</span>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{inc.date}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: inc.status === 'Open' ? '#ef4444' : '#10b981' }}>{inc.status}</span>
                                  </div>
                                </div>
                                {inc.description && <p style={{ fontSize: '0.8rem', color: '#374151', margin: '0.25rem 0 0' }}>{inc.description}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Report Cards ── */}
          {activePage === 'reportcards' && (
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Report Cards</h2>
                <input value={rcSearch} onChange={e => setRcSearch(e.target.value)} placeholder="Search by student…" style={{ ...inputStyle, width: '220px' }} />
              </div>

              {editingCard ? (
                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>
                      {editingCard === 'new' ? 'New Report Card' : `Editing — ${cardForm?.student_name}`}
                    </h3>
                    <button onClick={cancelCard} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    {editingCard === 'new' && (
                      <div>
                        <label style={labelStyle}>Student *</label>
                        <select value={cardForm?.student_id || ''} onChange={e => {
                          const s = students.find(st => st.id === e.target.value)
                          setCardForm({ ...cardForm, student_id: e.target.value, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_grade: s?.grade || '' })
                        }} style={inputStyle}>
                          <option value="">Select student…</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.grade}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>Academic Year</label>
                      <input value={cardForm?.academic_year || ''} onChange={e => setCardForm({ ...cardForm, academic_year: e.target.value })} style={inputStyle} placeholder="2025-2026" />
                    </div>
                    <div>
                      <label style={labelStyle}>Term</label>
                      <select value={cardForm?.term || ''} onChange={e => setCardForm({ ...cardForm, term: e.target.value })} style={inputStyle}>
                        {termOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.5rem 0.5rem 0 0', fontWeight: '600', fontSize: '0.78rem', color: '#6b7280' }}>
                      <span>Subject</span><span>Grade</span><span>Comment</span>
                    </div>
                    {(cardForm?.grades || []).map((row, i) => (
                      <div key={row.subject} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: '0.5rem', padding: '0.375rem 0.75rem', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{row.subject}</span>
                        <select value={row.grade || ''} onChange={e => {
                          const grades = [...cardForm.grades]
                          grades[i] = { ...grades[i], grade: e.target.value }
                          setCardForm({ ...cardForm, grades })
                        }} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}>
                          <option value="">—</option>
                          {gradeOptions.map(g => <option key={g}>{g}</option>)}
                        </select>
                        <input value={row.comment || ''} onChange={e => {
                          const grades = [...cardForm.grades]
                          grades[i] = { ...grades[i], comment: e.target.value }
                          setCardForm({ ...cardForm, grades })
                        }} placeholder="Optional comment" style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Teacher Notes</label>
                    <textarea value={cardForm?.teacher_notes || ''} onChange={e => setCardForm({ ...cardForm, teacher_notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Overall comments for the term…" />
                  </div>

                  <button onClick={saveCard} disabled={savingCard || !cardForm?.student_id}
                    style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}>
                    {savingCard ? 'Saving…' : 'Save Report Card'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button onClick={startNewCard} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>
                      + New Report Card
                    </button>
                  </div>
                  {filteredCards.length === 0 ? (
                    <p style={{ color: '#9ca3af' }}>No report cards yet.</p>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                            {['Student', 'Grade', 'Year', 'Term', 'Status', 'Actions'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCards.map(card => (
                            <tr key={card.id} style={{ borderBottom: '1px solid #f9fafb' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1f2937' }}>{card.student_name}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{card.student_grade || '—'}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{card.academic_year}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{card.term}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: card.published ? '#10b981' : '#f59e0b', background: card.published ? '#10b98118' : '#f59e0b18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>
                                  {card.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {!card.published && (
                                    <button onClick={() => openExistingCard(card)} style={{ fontSize: '0.8rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Edit</button>
                                  )}
                                  <button onClick={() => togglePublish(card)} style={{ fontSize: '0.8rem', color: card.published ? '#6b7280' : '#10b981', background: 'none', border: `1px solid ${card.published ? '#d1d5db' : '#10b981'}`, borderRadius: '0.375rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                                    {card.published ? 'Revert' : 'Publish'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Incidents ── */}
          {activePage === 'incidents' && (
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Student Incidents</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['All', 'Open', 'Resolved'].map(f => (
                    <button key={f} onClick={() => setIncidentFilter(f)} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', border: '1px solid', fontSize: '0.875rem', cursor: 'pointer', fontWeight: incidentFilter === f ? '600' : '400', background: incidentFilter === f ? primaryColor : 'white', color: incidentFilter === f ? 'white' : '#6b7280', borderColor: incidentFilter === f ? primaryColor : '#d1d5db' }}>{f}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total',    value: incidentStats.total,    color: '#6b7280' },
                  { label: 'Open',     value: incidentStats.open,     color: '#ef4444' },
                  { label: 'Resolved', value: incidentStats.resolved, color: '#10b981' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{s.value}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {filteredIncidents.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>No incidents found.</p>
              ) : (
                <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Student', 'Grade', 'Type', 'Date', 'Description', 'Reported By', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map(inc => (
                        <tr key={inc.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 1rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{inc.student_name || '—'}</td>
                          <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{inc.student_grade || '—'}</td>
                          <td style={{ padding: '0.625rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[inc.type], background: INCIDENT_TYPE_COLORS[inc.type] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{inc.type}</span>
                          </td>
                          <td style={{ padding: '0.625rem 1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{inc.date || '—'}</td>
                          <td style={{ padding: '0.625rem 1rem', color: '#374151', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description || '—'}</td>
                          <td style={{ padding: '0.625rem 1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{inc.reported_by || '—'}</td>
                          <td style={{ padding: '0.625rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: inc.status === 'Open' ? '#ef4444' : '#10b981' }}>{inc.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Facilities ── */}
          {activePage === 'facilities' && (
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Facilities</h2>
                  <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>Submit and view maintenance requests</p>
                </div>
                <button onClick={() => { setShowWoForm(!showWoForm); setWoFormError?.('') }}
                  style={{ background: showWoForm ? '#6b7280' : primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>
                  {showWoForm ? 'Cancel' : '+ Submit Request'}
                </button>
              </div>

              {showWoForm && (
                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem', border: `1px solid ${primaryColor}30` }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Submit a Maintenance Request</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Title *</label>
                      <input value={woForm.title} onChange={e => setWoForm({ ...woForm, title: e.target.value })} placeholder="Brief description of the issue" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select value={woForm.category} onChange={e => setWoForm({ ...woForm, category: e.target.value })} style={inputStyle}>
                        {WO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <select value={woForm.priority} onChange={e => setWoForm({ ...woForm, priority: e.target.value })} style={inputStyle}>
                        {WO_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Location / Room</label>
                      <input value={woForm.location} onChange={e => setWoForm({ ...woForm, location: e.target.value })} placeholder="e.g. Room 204, Gym, Parking Lot" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Description</label>
                      <textarea value={woForm.description} onChange={e => setWoForm({ ...woForm, description: e.target.value })} rows={3} placeholder="More detail about the issue…" style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                  </div>
                  {woFormError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{woFormError}</p>}
                  <button onClick={submitWorkOrder} disabled={savingWo} style={{ marginTop: '1rem', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}>
                    {savingWo ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['All', 'Open', 'In Progress', 'On Hold', 'Completed'].map(f => (
                  <button key={f} onClick={() => setWoFilter(f)} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', border: '1px solid', fontSize: '0.875rem', cursor: 'pointer', fontWeight: woFilter === f ? '600' : '400', background: woFilter === f ? primaryColor : 'white', color: woFilter === f ? 'white' : '#6b7280', borderColor: woFilter === f ? primaryColor : '#d1d5db' }}>{f}</button>
                ))}
              </div>

              {filteredWorkOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔧</div>
                  <p style={{ margin: 0 }}>No work orders found.</p>
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Title', 'Category', 'Location', 'Priority', 'Status', 'Assigned To', 'Submitted By'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkOrders.map(wo => (
                        <tr key={wo.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1f2937', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ marginRight: '0.4rem' }}>{CATEGORY_ICONS[wo.category] || '🔧'}</span>{wo.title}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{wo.category}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{wo.location || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{wo.priority}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: WO_STATUS_COLORS[wo.status], background: WO_STATUS_COLORS[wo.status] + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{wo.status}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{wo.submitted_by || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Attendance ── */}
          {activePage === 'attendance' && (
            <Attendance
              user={user}
              school={school}
              schoolId={staffMember.school_id}
              gradeFilter={isTeacher && gradeAssignments.length === 1 ? gradeAssignments[0] : null}
            />
          )}

          {/* ── Staff Directory (Principal/Admin only) ── */}
          {activePage === 'staffdir' && (
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>Staff Directory</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {staffList.map(s => (
                  <div key={s.id} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${getRoleColor(s.role)}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getRoleColor(s.role) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: getRoleColor(s.role), fontSize: '1rem' }}>
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{s.first_name} {s.last_name}</div>
                        <div style={{ fontSize: '0.8rem', color: getRoleColor(s.role) }}>{s.role}</div>
                      </div>
                    </div>
                    {s.email && <div style={{ fontSize: '0.825rem', color: '#6b7280', marginBottom: '0.25rem' }}>✉ {s.email}</div>}
                    {s.phone && <div style={{ fontSize: '0.825rem', color: '#6b7280' }}>📞 {s.phone}</div>}
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: s.status === 'Active' ? '#10b981' : '#9ca3af', background: s.status === 'Active' ? '#10b98118' : '#f3f4f6', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
