import {
  Users, ClipboardCheck, FileText, AlertTriangle, Wrench, Briefcase,
  Droplets, Zap, Wind, Hammer, Leaf, Brush, Shield, Monitor,
  Mail, Phone, Siren, Pill, Syringe, Stethoscope, Bandage, ClipboardList,
  X,
} from 'lucide-react'
import { useStaffDashboard } from './hooks/useStaffDashboard'
import { getRoleColor } from './domain/staff'
import {
  INCIDENT_TYPES, INCIDENT_TYPE_COLORS,
  WO_CATEGORIES, WO_PRIORITIES, WO_PRIORITY_COLORS, WO_STATUS_COLORS, CATEGORY_ICONS,
  STATUS_COLORS, getNavItems, canViewFullHealth, canViewLimitedHealth,
} from './domain/staffDashboard'
import Attendance from './Attendance'

const STAFF_NAV_ICONS = { Users, ClipboardCheck, FileText, AlertTriangle, Wrench, Briefcase }

const WO_ICON_COMPONENTS = {
  Droplets, Zap, Wind, Hammer, Leaf, Brush, Shield, Monitor, Wrench,
}

function WoCategoryIcon({ category }) {
  const name = CATEGORY_ICONS[category] || 'Wrench'
  const Icon = WO_ICON_COMPONENTS[name] || Wrench
  return <Icon size={14} />
}

const HEALTH_ICON_COMPONENTS = {
  Allergy: AlertTriangle, Medication: Pill, Immunization: Syringe,
  Condition: Stethoscope, Injury: Bandage, Other: ClipboardList,
}

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'
const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top Nav */}
      <div className="flex items-center justify-between px-8 py-4" style={{ background: primaryColor }}>
        <div className="flex items-center gap-3">
          {school?.logo_url
            ? <img src={school.logo_url} alt="logo" className="h-8 rounded object-contain" onError={e => e.target.style.display = 'none'} />
            : <span className="text-[1.75rem]">🍱</span>}
          <div>
            <div className="text-white font-bold text-xl leading-tight">{school?.name || 'LunchBox'}</div>
            {school?.motto && <div className="text-white/75 text-xs">{school.motto}</div>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white text-sm font-semibold">{staffMember.first_name} {staffMember.last_name}</div>
            <div className="text-white/75 text-xs">{staffMember.role}</div>
          </div>
          <button onClick={onLogout} className="bg-white font-semibold rounded-lg px-4 py-1.5 cursor-pointer border-0 text-sm" style={{ color: primaryColor }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-1">

        {/* Sidebar */}
        <div className="w-[220px] bg-white border-r border-gray-200 py-6 relative shrink-0">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`w-full text-left px-6 py-3 border-0 border-l-[3px] flex items-center gap-3 text-[0.95rem] cursor-pointer transition-colors ${activePage === item.id ? 'font-semibold' : 'font-normal text-gray-700'}`}
              style={{
                background: activePage === item.id ? primaryColor + '18' : 'transparent',
                borderLeftColor: activePage === item.id ? primaryColor : 'transparent',
                color: activePage === item.id ? primaryColor : undefined,
              }}>
              {(() => { const Icon = STAFF_NAV_ICONS[item.icon]; return Icon ? <Icon size={16} /> : null })()}<span>{item.label}</span>
            </button>
          ))}
          <div className="absolute bottom-6 left-0 w-[220px] px-6">
            <div className="rounded-lg px-3 py-2.5" style={{ background: getRoleColor(staffMember.role) + '18' }}>
              <div className="text-xs text-gray-500">Signed in as</div>
              <div className="text-[0.8rem] font-semibold" style={{ color: getRoleColor(staffMember.role) }}>{staffMember.role}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">

          {/* ── Students ── */}
          {activePage === 'students' && (
            <div className="p-8 max-w-[1100px] mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 m-0">{isTeacher ? 'My Students' : 'Students'}</h2>
                  {isTeacher && gradeAssignments.length > 0 && (
                    <p className="text-gray-500 mt-1 mb-0">Grades: {gradeAssignments.join(', ')}</p>
                  )}
                </div>
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students…"
                  className="w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>

              {loadingStudents ? <p className="text-gray-500">Loading…</p> : filteredStudents.length === 0 ? (
                <p className="text-gray-400">No students found.</p>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-[0.9rem]">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {['Student', 'Grade', 'Parent', 'Contact', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.id} onClick={() => openStudentProfile(s)} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
                          <td className="px-4 py-3 text-gray-500">{s.grade || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{s.parents ? `${s.parents.first_name} ${s.parents.last_name}` : '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-[0.85rem]">{s.parents?.email || s.parents?.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                              style={{ color: STATUS_COLORS[s.status] || '#6b7280', background: (STATUS_COLORS[s.status] || '#6b7280') + '18' }}>
                              {s.status}
                            </span>
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
                  className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                  <div className="w-[420px] bg-white h-full overflow-y-auto shadow-2xl">
                    <div className="p-6 text-white flex justify-between items-start" style={{ background: primaryColor }}>
                      <div>
                        <div className="text-[1.2rem] font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                        <div className="text-sm opacity-85">{selectedStudent.grade || 'No grade'}</div>
                      </div>
                      <button onClick={closeStudentProfile} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer flex items-center"><X size={16} /></button>
                    </div>
                    <div className="p-6 flex flex-col gap-5">

                      {/* Parent Contact */}
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">Parent / Guardian</div>
                        {selectedStudent.parents ? (
                          <div className="bg-gray-50 rounded-xl p-3 text-sm">
                            <div className="font-semibold text-gray-800 mb-1">{selectedStudent.parents.first_name} {selectedStudent.parents.last_name}</div>
                            {selectedStudent.parents.email && <div className="text-gray-500 flex items-center gap-1.5"><Mail size={12} /> {selectedStudent.parents.email}</div>}
                            {selectedStudent.parents.phone && <div className="text-gray-500 flex items-center gap-1.5"><Phone size={12} /> {selectedStudent.parents.phone}</div>}
                          </div>
                        ) : <p className="text-gray-400 text-sm">No parent linked.</p>}
                      </div>

                      {/* Health Records — role gated */}
                      {(canViewFullHealth(role) || canViewLimitedHealth(role)) && (
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                            Health Records {canViewLimitedHealth(role) && !canViewFullHealth(role) && <span className="font-normal normal-case text-[0.7rem]">(Emergency &amp; Allergies)</span>}
                          </div>

                          {studentHealthProfile?.emergency_contact_name && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2.5 text-[0.85rem]">
                              <div className="font-bold text-red-600 mb-0.5 flex items-center gap-1.5"><Siren size={14} /> Emergency Contact</div>
                              <div className="text-gray-700">{studentHealthProfile.emergency_contact_name}{studentHealthProfile.emergency_contact_relationship ? ` (${studentHealthProfile.emergency_contact_relationship})` : ''}</div>
                              {studentHealthProfile.emergency_contact_phone && <div className="text-gray-500 flex items-center gap-1.5"><Phone size={12} /> {studentHealthProfile.emergency_contact_phone}</div>}
                            </div>
                          )}

                          {(() => {
                            const allergies = studentHealthEntries.filter(e => e.category === 'Allergy')
                            if (allergies.length === 0) return null
                            return (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2.5 text-[0.85rem]">
                                <div className="font-bold text-amber-600 mb-1.5 flex items-center gap-1.5"><AlertTriangle size={14} /> Allergies ({allergies.length})</div>
                                <div className="flex flex-col gap-1">
                                  {allergies.map(a => (
                                    <div key={a.id} className="text-gray-700">
                                      <span className="font-semibold">{a.name}</span>
                                      {a.detail && <span className="text-gray-500"> — {a.detail}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {canViewFullHealth(role) && studentHealthProfile && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2.5 text-[0.825rem]">
                              <div className="font-bold text-gray-500 mb-1.5 text-xs uppercase tracking-wide">Health Profile</div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                {studentHealthProfile.blood_type && <><span className="text-gray-400">Blood Type</span><span className="font-semibold text-red-500">{studentHealthProfile.blood_type}</span></>}
                                {studentHealthProfile.primary_physician && <><span className="text-gray-400">Physician</span><span>{studentHealthProfile.primary_physician}</span></>}
                                {studentHealthProfile.physician_phone && <><span className="text-gray-400">Physician Ph.</span><span>{studentHealthProfile.physician_phone}</span></>}
                                {studentHealthProfile.insurance_provider && <><span className="text-gray-400">Insurance</span><span>{studentHealthProfile.insurance_provider}</span></>}
                                {studentHealthProfile.physical_date && <><span className="text-gray-400">Last Physical</span><span>{studentHealthProfile.physical_date}</span></>}
                                {studentHealthProfile.notes && <span className="col-span-2 text-gray-500 italic">{studentHealthProfile.notes}</span>}
                              </div>
                            </div>
                          )}

                          {canViewFullHealth(role) && (() => {
                            const entries = studentHealthEntries.filter(e => e.category !== 'Allergy')
                            if (entries.length === 0) return null
                            const HEALTH_CATEGORY_COLORS = { Medication: '#3b82f6', Immunization: '#10b981', Condition: '#f59e0b', Injury: '#8b5cf6', Other: '#6b7280' }
                            return (
                              <div className="flex flex-col gap-1.5">
                                {entries.map(e => {
                                  const color     = HEALTH_CATEGORY_COLORS[e.category] || '#6b7280'
                                  const HealthIcon = HEALTH_ICON_COMPONENTS[e.category] || ClipboardList
                                  const isExpired = e.expiration_date && e.expiration_date < new Date().toISOString().split('T')[0]
                                  return (
                                    <div key={e.id} className="bg-gray-50 rounded-lg px-3 py-2 text-[0.825rem]"
                                      style={{ border: `1px solid ${color}30`, borderLeft: `3px solid ${color}` }}>
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold flex items-center gap-1" style={{ color }}><HealthIcon size={13} /> {e.name}</span>
                                        <div className="flex gap-1.5 items-center">
                                          {isExpired && <span className="text-[0.7rem] text-red-500 font-semibold bg-red-100 rounded-full px-1.5 py-0.5">Expired</span>}
                                          <span className="text-[0.7rem] font-semibold rounded-full px-1.5 py-0.5" style={{ color, background: color + '18' }}>{e.category}</span>
                                        </div>
                                      </div>
                                      {e.detail && <div className="text-gray-500 mt-0.5">{e.detail}</div>}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {!studentHealthProfile && studentHealthEntries.length === 0 && (
                            <p className="text-gray-400 text-[0.85rem]">No health records on file.</p>
                          )}
                        </div>
                      )}

                      {/* Incident Log */}
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Incident Log</div>
                          <button onClick={() => setShowIncidentForm(!showIncidentForm)}
                            className="text-[0.78rem] bg-transparent rounded border px-2 py-0.5 cursor-pointer font-semibold"
                            style={{ color: primaryColor, borderColor: primaryColor }}>
                            {showIncidentForm ? 'Cancel' : '+ Log Incident'}
                          </button>
                        </div>

                        {showIncidentForm && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-3 flex flex-col gap-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className={labelCls}>Date</label>
                                <input type="date" value={incidentForm.date || ''} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })} className={fieldCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Type</label>
                                <select value={incidentForm.type || 'Behavioral'} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} className={fieldCls}>
                                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Description *</label>
                              <textarea value={incidentForm.description || ''} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} rows={2} className={`${fieldCls} resize-y`} />
                            </div>
                            <div>
                              <label className={labelCls}>Resolution</label>
                              <textarea value={incidentForm.resolution || ''} onChange={e => setIncidentForm({ ...incidentForm, resolution: e.target.value })} rows={2} className={`${fieldCls} resize-y`} />
                            </div>
                            <button onClick={submitIncident} disabled={savingIncident || !incidentForm.description}
                              className="text-white border-0 rounded-lg py-2 font-semibold cursor-pointer text-sm disabled:opacity-60 hover:opacity-90 transition-opacity"
                              style={{ background: primaryColor }}>
                              {savingIncident ? 'Saving…' : 'Save Incident'}
                            </button>
                          </div>
                        )}

                        {studentIncidents.length === 0 ? (
                          <p className="text-gray-400 text-sm">No incidents logged.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {studentIncidents.map(inc => (
                              <div key={inc.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                                    style={{ color: INCIDENT_TYPE_COLORS[inc.type], background: INCIDENT_TYPE_COLORS[inc.type] + '18' }}>
                                    {inc.type}
                                  </span>
                                  <div className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400">{inc.date}</span>
                                    <span className={`text-[0.72rem] font-semibold ${inc.status === 'Open' ? 'text-red-500' : 'text-green-500'}`}>{inc.status}</span>
                                  </div>
                                </div>
                                {inc.description && <p className="text-[0.8rem] text-gray-700 mt-1 mb-0">{inc.description}</p>}
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
            <div className="p-8 max-w-[1100px] mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Report Cards</h2>
                <input value={rcSearch} onChange={e => setRcSearch(e.target.value)} placeholder="Search by student…"
                  className="w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>

              {editingCard ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="m-0 text-[1.1rem] font-bold text-gray-800">
                      {editingCard === 'new' ? 'New Report Card' : `Editing — ${cardForm?.student_name}`}
                    </h3>
                    <button onClick={cancelCard} className="bg-transparent border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer text-gray-500 text-sm">Cancel</button>
                  </div>

                  <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {editingCard === 'new' && (
                      <div>
                        <label className={labelCls}>Student *</label>
                        <select value={cardForm?.student_id || ''} onChange={e => {
                          const s = students.find(st => st.id === e.target.value)
                          setCardForm({ ...cardForm, student_id: e.target.value, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_grade: s?.grade || '' })
                        }} className={fieldCls}>
                          <option value="">Select student…</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.grade}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Academic Year</label>
                      <input value={cardForm?.academic_year || ''} onChange={e => setCardForm({ ...cardForm, academic_year: e.target.value })} className={fieldCls} placeholder="2025-2026" />
                    </div>
                    <div>
                      <label className={labelCls}>Term</label>
                      <select value={cardForm?.term || ''} onChange={e => setCardForm({ ...cardForm, term: e.target.value })} className={fieldCls}>
                        {termOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="grid px-3 py-2 bg-gray-50 rounded-t-lg font-semibold text-xs text-gray-500 gap-2" style={{ gridTemplateColumns: '1.5fr 1fr 2fr' }}>
                      <span>Subject</span><span>Grade</span><span>Comment</span>
                    </div>
                    {(cardForm?.grades || []).map((row, i) => (
                      <div key={row.subject} className="grid px-3 py-1.5 border-b border-gray-100 items-center gap-2" style={{ gridTemplateColumns: '1.5fr 1fr 2fr' }}>
                        <span className="text-sm text-gray-700">{row.subject}</span>
                        <select value={row.grade || ''} onChange={e => {
                          const grades = [...cardForm.grades]
                          grades[i] = { ...grades[i], grade: e.target.value }
                          setCardForm({ ...cardForm, grades })
                        }} className="border border-gray-300 rounded-lg px-2 py-1 text-[0.82rem] outline-none">
                          <option value="">—</option>
                          {gradeOptions.map(g => <option key={g}>{g}</option>)}
                        </select>
                        <input value={row.comment || ''} onChange={e => {
                          const grades = [...cardForm.grades]
                          grades[i] = { ...grades[i], comment: e.target.value }
                          setCardForm({ ...cardForm, grades })
                        }} placeholder="Optional comment" className="border border-gray-300 rounded-lg px-2 py-1 text-[0.82rem] outline-none" />
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label className={labelCls}>Teacher Notes</label>
                    <textarea value={cardForm?.teacher_notes || ''} onChange={e => setCardForm({ ...cardForm, teacher_notes: e.target.value })} rows={3} className={`${fieldCls} resize-y`} placeholder="Overall comments for the term…" />
                  </div>

                  <button onClick={saveCard} disabled={savingCard || !cardForm?.student_id}
                    className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}>
                    {savingCard ? 'Saving…' : 'Save Report Card'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button onClick={startNewCard} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                      + New Report Card
                    </button>
                  </div>
                  {filteredCards.length === 0 ? (
                    <p className="text-gray-400">No report cards yet.</p>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <table className="w-full border-collapse text-[0.9rem]">
                        <thead>
                          <tr className="border-b-2 border-gray-100">
                            {['Student', 'Grade', 'Year', 'Term', 'Status', 'Actions'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCards.map(card => (
                            <tr key={card.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{card.student_name}</td>
                              <td className="px-4 py-3 text-gray-500">{card.student_grade || '—'}</td>
                              <td className="px-4 py-3 text-gray-500">{card.academic_year}</td>
                              <td className="px-4 py-3 text-gray-700">{card.term}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${card.published ? 'text-green-600 bg-green-50' : 'text-amber-500 bg-amber-50'}`}>
                                  {card.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  {!card.published && (
                                    <button onClick={() => openExistingCard(card)}
                                      className="text-[0.8rem] bg-transparent rounded border px-2 py-0.5 cursor-pointer font-medium"
                                      style={{ color: primaryColor, borderColor: primaryColor }}>Edit</button>
                                  )}
                                  <button onClick={() => togglePublish(card)}
                                    className={`text-[0.8rem] bg-transparent rounded border px-2 py-0.5 cursor-pointer ${card.published ? 'text-gray-500 border-gray-300' : 'text-green-600 border-green-500'}`}>
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
            <div className="p-8 max-w-[1100px] mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Student Incidents</h2>
                <div className="flex gap-2">
                  {['All', 'Open', 'Resolved'].map(f => (
                    <button key={f} onClick={() => setIncidentFilter(f)}
                      className={`px-3.5 py-1.5 rounded-lg border text-sm cursor-pointer ${incidentFilter === f ? 'font-semibold text-white border-transparent' : 'font-normal text-gray-500 border-gray-300 bg-white'}`}
                      style={incidentFilter === f ? { background: primaryColor } : {}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                  { label: 'Total',    value: incidentStats.total,    color: '#6b7280' },
                  { label: 'Open',     value: incidentStats.open,     color: '#ef4444' },
                  { label: 'Resolved', value: incidentStats.resolved, color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border-t-[3px]" style={{ borderTopColor: s.color }}>
                    <div className="text-[2rem] font-bold text-gray-800">{s.value}</div>
                    <div className="text-gray-500 text-[0.8rem] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {filteredIncidents.length === 0 ? (
                <p className="text-gray-400">No incidents found.</p>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {['Student', 'Grade', 'Type', 'Date', 'Description', 'Reported By', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map(inc => (
                        <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{inc.student_name || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-500">{inc.student_grade || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                              style={{ color: INCIDENT_TYPE_COLORS[inc.type], background: INCIDENT_TYPE_COLORS[inc.type] + '18' }}>
                              {inc.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{inc.date || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-700 max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">{inc.description || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{inc.reported_by || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-semibold ${inc.status === 'Open' ? 'text-red-500' : 'text-green-500'}`}>{inc.status}</span>
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
            <div className="p-8 max-w-[1100px] mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 m-0">Facilities</h2>
                  <p className="text-gray-500 mt-1 mb-0">Submit and view maintenance requests</p>
                </div>
                <button onClick={() => { setShowWoForm(!showWoForm); setWoFormError?.('') }}
                  className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: showWoForm ? '#6b7280' : primaryColor }}>
                  {showWoForm ? 'Cancel' : '+ Submit Request'}
                </button>
              </div>

              {showWoForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border" style={{ borderColor: primaryColor + '30' }}>
                  <h3 className="m-0 mb-4 text-base font-bold text-gray-800">Submit a Maintenance Request</h3>
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="col-span-full">
                      <label className={labelCls}>Title *</label>
                      <input value={woForm.title} onChange={e => setWoForm({ ...woForm, title: e.target.value })} placeholder="Brief description of the issue" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={woForm.category} onChange={e => setWoForm({ ...woForm, category: e.target.value })} className={fieldCls}>
                        {WO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Priority</label>
                      <select value={woForm.priority} onChange={e => setWoForm({ ...woForm, priority: e.target.value })} className={fieldCls}>
                        {WO_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-span-full">
                      <label className={labelCls}>Location / Room</label>
                      <input value={woForm.location} onChange={e => setWoForm({ ...woForm, location: e.target.value })} placeholder="e.g. Room 204, Gym, Parking Lot" className={fieldCls} />
                    </div>
                    <div className="col-span-full">
                      <label className={labelCls}>Description</label>
                      <textarea value={woForm.description} onChange={e => setWoForm({ ...woForm, description: e.target.value })} rows={3} placeholder="More detail about the issue…" className={`${fieldCls} resize-y`} />
                    </div>
                  </div>
                  {woFormError && <p className="text-red-500 text-sm mt-3">{woFormError}</p>}
                  <button onClick={submitWorkOrder} disabled={savingWo}
                    className="mt-4 text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}>
                    {savingWo ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              )}

              <div className="flex gap-2 mb-4 flex-wrap">
                {['All', 'Open', 'In Progress', 'On Hold', 'Completed'].map(f => (
                  <button key={f} onClick={() => setWoFilter(f)}
                    className={`px-3.5 py-1.5 rounded-lg border text-sm cursor-pointer ${woFilter === f ? 'font-semibold text-white border-transparent' : 'font-normal text-gray-500 border-gray-300 bg-white'}`}
                    style={woFilter === f ? { background: primaryColor } : {}}>
                    {f}
                  </button>
                ))}
              </div>

              {filteredWorkOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="mb-3 flex justify-center"><Wrench size={40} className="text-gray-300" /></div>
                  <p className="m-0">No work orders found.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {['Title', 'Category', 'Location', 'Priority', 'Status', 'Assigned To', 'Submitted By'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkOrders.map(wo => (
                        <tr key={wo.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="mr-1.5 inline-flex items-center"><WoCategoryIcon category={wo.category} /></span>{wo.title}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{wo.category}</td>
                          <td className="px-4 py-3 text-gray-500">{wo.location || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold rounded-full px-2.5 py-0.5"
                              style={{ color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18' }}>
                              {wo.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                              style={{ color: WO_STATUS_COLORS[wo.status], background: WO_STATUS_COLORS[wo.status] + '18' }}>
                              {wo.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{wo.assigned_to || <span className="text-gray-400">Unassigned</span>}</td>
                          <td className="px-4 py-3 text-gray-500">{wo.submitted_by || '—'}</td>
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
            <div className="p-8 max-w-[1100px] mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Staff Directory</h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {staffList.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border-t-[3px]" style={{ borderTopColor: getRoleColor(s.role) }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                        style={{ background: getRoleColor(s.role) + '22', color: getRoleColor(s.role) }}>
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{s.first_name} {s.last_name}</div>
                        <div className="text-[0.8rem]" style={{ color: getRoleColor(s.role) }}>{s.role}</div>
                      </div>
                    </div>
                    {s.email && <div className="text-[0.825rem] text-gray-500 mb-1 flex items-center gap-1.5"><Mail size={12} /> {s.email}</div>}
                    {s.phone && <div className="text-[0.825rem] text-gray-500 flex items-center gap-1.5"><Phone size={12} /> {s.phone}</div>}
                    <div className="mt-2">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${s.status === 'Active' ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>{s.status}</span>
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
