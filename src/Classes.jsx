import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Check, BookOpen, Users, Loader2, Lock, X,
  GraduationCap, DoorOpen,
} from 'lucide-react'
import { useClasses } from './hooks/useClasses'
import { CLASS_STATUS, ENROLLMENT_MODES } from './domain/classes'
import { DIVISION_COLORS, parseDivisions } from './domain/school'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

export default function Classes({ user, school, openClassId, onClearOpenClass }) {
  const primaryColor = school?.primary_color || '#f97316'
  const c = useClasses(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))
  const divisions   = allDivs.filter(d => d.grades?.length > 0)

  const [editTab, setEditTab] = useState('info')

  const pendingIdRef = useRef(openClassId)
  useEffect(() => {
    if (!pendingIdRef.current || c.loading || c.classes.length === 0) return
    const cls = c.classes.find(cl => cl.id === pendingIdRef.current)
    if (cls) { pendingIdRef.current = null; c.openClass(cls); c.startEdit(cls); onClearOpenClass?.() }
  }, [c.loading, c.classes.length])

  useEffect(() => { if (c.editing) setEditTab('info') }, [c.editing])

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (c.editing) {
    const cap   = c.form.class_size ? parseInt(c.form.class_size, 10) : null
    const count = c.enrollments.length
    const atCap = cap !== null && count >= cap
    const pct   = cap ? Math.min(100, Math.round(count / cap * 100)) : null
    const mode  = c.form.enrollment_mode || 'open'
    const showIndividual = mode === 'open' || mode === 'mixed'
    const showCohort     = mode === 'cohort' || mode === 'mixed'

    return (
      <div className="p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={c.cancelEdit} className="bg-transparent border-0 text-gray-500 cursor-pointer text-sm flex items-center gap-1.5 hover:text-gray-700">← Classes</button>
            <span className="text-gray-300">|</span>
            <h2 className="m-0 text-xl font-bold text-gray-800">{c.selected ? c.selected.name : 'New Class'}</h2>
          </div>
          <div className="flex gap-2.5 items-center">
            <button onClick={c.handleSave} disabled={c.saving} className="text-white border-0 rounded-lg px-6 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
              {c.saving ? 'Saving…' : c.selected ? 'Save Changes' : 'Add Class'}
            </button>
            <button onClick={c.cancelEdit} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
            {c.selected && (
              c.deleteId === c.selected.id ? (
                <>
                  <span className="text-xs text-red-700 font-medium">Delete this class?</span>
                  <button onClick={() => c.handleDelete(c.selected.id)} className="bg-red-500 text-white border-0 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm hover:bg-red-600">Yes, Delete</button>
                  <button onClick={() => c.setDeleteId(null)} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
                </>
              ) : (
                <button onClick={() => c.setDeleteId(c.selected.id)} className="bg-white text-red-500 border border-red-200 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm hover:bg-red-50">Delete</button>
              )
            )}
          </div>
        </div>

        {c.error   && <p className="text-red-500 text-sm mb-4 font-medium flex items-center gap-1"><AlertTriangle size={14} />{c.error}</p>}
        {c.success && <p className="text-green-700 text-sm mb-4 font-medium flex items-center gap-1"><Check size={14} />{c.success}</p>}

        {/* Tab bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { id: 'info',       label: 'Class Info',       Icon: BookOpen },
              { id: 'enrollment', label: count > 0 && c.selected ? `Class Enrollment (${count} enrolled)` : 'Class Enrollment', Icon: Users },
            ].map(tab => {
              const isActive   = editTab === tab.id
              const isDisabled = tab.id === 'enrollment' && !c.selected
              return (
                <button key={tab.id} onClick={() => !isDisabled && setEditTab(tab.id)}
                  className="px-5 py-2 rounded-lg border-0 text-sm transition-all"
                  style={{
                    fontWeight:  isActive ? '600' : '400',
                    background:  isActive ? primaryColor : 'transparent',
                    color:       isActive ? 'white' : isDisabled ? '#d1d5db' : '#6b7280',
                    cursor:      isDisabled ? 'not-allowed' : 'pointer',
                  }}>
                  {tab.Icon && <tab.Icon size={14} className="inline mr-1.5" />}{tab.label}
                </button>
              )
            })}
          </div>
          {!c.selected && <span className="text-xs text-gray-400 italic">Save the class first to manage enrollment</span>}
        </div>

        {/* ── Class Info tab ── */}
        {editTab === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm p-7">
            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <label className={labelCls}>Class Name *</label>
                <input value={c.form.name} onChange={e => c.setForm({ ...c.form, name: e.target.value })} placeholder="e.g. 3rd Grade Math" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Subject</label>
                {c.subjects.length > 0
                  ? <select value={c.form.subject} onChange={e => c.setForm({ ...c.form, subject: e.target.value })} className={fieldCls}><option value="">— None —</option>{c.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  : <input value={c.form.subject} onChange={e => c.setForm({ ...c.form, subject: e.target.value })} placeholder="e.g. Mathematics" className={fieldCls} />
                }
              </div>
              <div>
                <label className={labelCls}>Division</label>
                {c.divisions.length > 0
                  ? <select value={c.form.division} onChange={e => c.setForm({ ...c.form, division: e.target.value })} className={fieldCls}><option value="">— None —</option>{c.divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</select>
                  : <input value={c.form.division} onChange={e => c.setForm({ ...c.form, division: e.target.value })} placeholder="e.g. Lower School" className={fieldCls} />
                }
              </div>
              <div>
                <label className={labelCls}>Teacher</label>
                <select value={c.form.teacher_id} onChange={e => c.selectTeacher(e.target.value)} className={fieldCls}>
                  <option value="">— Unassigned —</option>
                  {c.staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.role}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Default Room</label>
                <select value={c.form.room_id} onChange={e => c.selectRoom(e.target.value)} className={fieldCls}>
                  <option value="">— Unassigned —</option>
                  {c.rooms.map(r => <option key={r.id} value={r.id}>{r.name}{r.building ? ` (${r.building})` : ''}{r.capacity ? ` — cap. ${r.capacity}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Class Size (cap)</label>
                <input type="number" min="1" value={c.form.class_size || ''} onChange={e => c.setForm({ ...c.form, class_size: e.target.value })} placeholder="Max students" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={c.form.status} onChange={e => c.setForm({ ...c.form, status: e.target.value })} className={fieldCls}>
                  {CLASS_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-full">
                <label className={labelCls}>Description</label>
                <textarea value={c.form.description || ''} onChange={e => c.setForm({ ...c.form, description: e.target.value })} rows={2} placeholder="Brief description of this class…" className={`${fieldCls} resize-y`} />
              </div>
              <div className="col-span-full">
                <label className={labelCls}>Notes</label>
                <textarea value={c.form.notes || ''} onChange={e => c.setForm({ ...c.form, notes: e.target.value })} rows={2} placeholder="Internal notes…" className={`${fieldCls} resize-y`} />
              </div>
            </div>

            {/* Capacity warning */}
            {(() => {
              const room = c.form.room_id ? c.rooms.find(r => r.id === c.form.room_id) : null
              const size = parseInt(c.form.class_size, 10)
              if (room && room.capacity && size && size > room.capacity) {
                return (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 text-amber-800 text-sm">
                    <AlertTriangle size={13} className="inline mr-1" />Class size ({size}) exceeds <strong>{room.name}</strong> capacity ({room.capacity}). Consider a larger room or reduce class size.
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}

        {/* ── Class Enrollment tab ── */}
        {editTab === 'enrollment' && c.selected && (
          <div className="flex flex-col gap-6">

            {/* Mode selector */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">Class Enrollment Mode</div>
              <div className="flex gap-3">
                {ENROLLMENT_MODES.map(m => {
                  const active = mode === m.value
                  return (
                    <button key={m.value} onClick={() => c.setForm({ ...c.form, enrollment_mode: m.value })}
                      className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all text-left"
                      style={{ borderColor: active ? primaryColor : '#e5e7eb', background: active ? primaryColor + '10' : 'white', color: active ? primaryColor : '#6b7280' }}>
                      <div>{m.label}</div>
                      <div className="text-xs font-normal opacity-75 mt-0.5">{m.description}</div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 mb-0">Changes to enrollment mode are saved when you click <strong>Save Changes</strong> above.</p>
            </div>

            {/* Cohort assignment panel */}
            {showCohort && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cohort Assignment</div>
                {c.cohortEnrolling && <p className="text-xs text-indigo-500 mb-3 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Assigning cohort and enrolling students…</p>}
                <div className="grid grid-cols-2 gap-5">
                  {/* Available cohorts */}
                  <div>
                    <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Cohorts ({c.availableCohorts.length})</div>
                    <input type="text" placeholder="Filter cohorts…" value={c.cohortSearch} onChange={e => c.setCohortSearch(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none text-xs mb-2" />
                    <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto py-1">
                      {c.availableCohorts.length === 0 ? (
                        <p className="text-xs text-gray-300 italic m-0">{c.cohortSearch ? 'No matches.' : 'All cohorts assigned.'}</p>
                      ) : c.availableCohorts.map(coh => (
                        <button key={coh.id} onClick={() => c.handleAddCohort(coh.id)} disabled={c.cohortEnrolling}
                          title="Assign cohort and enroll all members"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 hover:text-white"
                          style={{ borderColor: '#6366f1', background: 'white', color: '#6366f1', cursor: c.cohortEnrolling ? 'not-allowed' : 'pointer' }}>
                          <Users size={13} className="inline mr-1" />{coh.name}
                          {coh.division && <span className="text-[0.65rem] opacity-65">{coh.division}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Assigned cohorts */}
                  <div>
                    <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned ({c.classCohorts.length})</div>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto py-1">
                      {c.classCohorts.length === 0 ? (
                        <p className="text-xs text-gray-300 italic m-0">No cohorts assigned yet.</p>
                      ) : c.classCohorts.map(cc => (
                        <div key={cc.id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-green-50 border-2 border-green-200">
                          <span className="flex-1 font-semibold text-gray-800 truncate flex items-center gap-1"><Users size={13} />{cc.cohorts?.name}</span>
                          {cc.cohorts?.division && <span className="text-xs text-gray-500 whitespace-nowrap">{cc.cohorts.division}</span>}
                          <button onClick={() => c.handleRemoveCohort(cc.id, cc.cohort_id)} title="Remove cohort and unenroll its students"
                            className="bg-transparent border-0 cursor-pointer text-gray-300 px-0.5 hover:text-red-500 transition-colors flex items-center"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual enrollment panel */}
            {showIndividual && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Individual Class Enrollment</div>
                  <span className="text-xs font-bold rounded-full px-3 py-1" style={{ background: atCap ? '#fef2f2' : '#f0fdf4', color: atCap ? '#b91c1c' : '#15803d' }}>
                    {cap ? `${count} / ${cap}` : `${count} enrolled`}{atCap ? ' · Full' : ''}
                  </span>
                </div>

                {cap && (
                  <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: atCap ? '#ef4444' : primaryColor }} />
                  </div>
                )}

                {atCap && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 mb-4 text-red-700 text-xs font-medium">
                    <Lock size={13} className="inline mr-1" />Class is at capacity — increase Class Size (cap) on the Class Info tab to enroll more.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                  {/* Available students */}
                  <div>
                    <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Available ({c.availableStudents.length})</div>
                    <input type="text" placeholder="Filter by name or grade…" value={c.enrollSearch} onChange={e => c.setEnrollSearch(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none text-xs mb-2" />
                    <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto py-1">
                      {c.availableStudents.length === 0 ? (
                        <p className="text-xs text-gray-300 italic m-0">{c.enrollSearch ? 'No matches.' : 'All students enrolled.'}</p>
                      ) : c.availableStudents.map(s => (
                        <button key={s.id} onClick={() => !atCap && c.handleEnroll(s.id)} disabled={atCap || c.enrollSaving}
                          title={atCap ? 'Class is at capacity' : `Enroll ${s.first_name} ${s.last_name}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all"
                          style={{ borderColor: primaryColor, background: 'white', color: primaryColor, cursor: atCap ? 'not-allowed' : 'pointer', opacity: atCap ? 0.45 : 1 }}
                          onMouseEnter={ev => { if (!atCap) { ev.currentTarget.style.background = primaryColor; ev.currentTarget.style.color = 'white' }}}
                          onMouseLeave={ev => { ev.currentTarget.style.background = 'white'; ev.currentTarget.style.color = primaryColor }}>
                          {s.first_name} {s.last_name}
                          <span className="text-[0.65rem] opacity-65">{s.grade}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Enrolled students */}
                  <div>
                    <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Enrolled ({count})</div>
                    <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto py-1">
                      {c.enrollments.length === 0 ? (
                        <p className="text-xs text-gray-300 italic m-0">No students enrolled yet.</p>
                      ) : c.enrollments.map(e => (
                        <div key={e.id} className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium bg-green-50 border-2 border-green-200 text-green-700">
                          {e.students?.first_name} {e.students?.last_name}
                          <span className="text-[0.65rem] opacity-65">{e.students?.grade}</span>
                          <button onClick={() => c.handleUnenroll(e.id)} title="Remove student"
                            className="bg-transparent border-0 cursor-pointer text-green-300 flex items-center hover:text-red-500 transition-colors"><X size={13} /></button>
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

  // ── Card grid view ─────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><BookOpen size={22} style={{ color: primaryColor }} />Classes</h2>
          <p className="text-gray-500 mt-1">Manage your school's classes, subjects, and teacher assignments</p>
        </div>
        <button onClick={c.startAdd} className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
          + Add Class
        </button>
      </div>

      {c.success && <p className="text-green-700 text-sm mb-4 font-medium flex items-center gap-1"><Check size={14} />{c.success}</p>}

      {/* Stat cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard label="Total Classes" value={c.stats.total}    color={primaryColor} />
        <StatCard label="Active"        value={c.stats.active}   color="#10b981" />
        <StatCard label="Inactive"      value={c.stats.inactive} color="#9ca3af" />
        {Object.entries(c.stats.byDivision).map(([div, count]) => (
          <StatCard key={div} label={div} value={count} color={divColorMap[div] || '#6b7280'} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Search by name, teacher, or subject…" value={c.search} onChange={e => c.setSearch(e.target.value)}
          className="flex-1 min-w-56 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm" />
        {divisions.length > 0 && (
          <select value={c.filterDiv} onChange={e => c.setFilterDiv(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-40">
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        )}
        <select value={c.filterStatus} onChange={e => c.setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white">
          <option value="">All Statuses</option>
          {CLASS_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(c.search || c.filterDiv || c.filterStatus) && (
          <button onClick={() => { c.setSearch(''); c.setFilterDiv(''); c.setFilterStatus('') }}
            className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">Clear</button>
        )}
      </div>

      {/* Class cards */}
      {c.loading ? (
        <p className="text-gray-400">Loading classes…</p>
      ) : c.filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 flex justify-center"><BookOpen size={48} className="text-gray-300" /></div>
          <p className="text-gray-500 text-lg">
            {c.classes.length === 0 ? 'No classes yet. Add your first class to get started.' : 'No classes match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {c.filtered.map(cls => {
            const divColor = divColorMap[cls.division] || null
            const isActive = cls.status === 'Active'
            return (
              <div key={cls.id} onClick={() => { c.openClass(cls); c.startEdit(cls) }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-1" style={{ background: divColor || primaryColor }} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="font-bold text-gray-800 flex-1 pr-2">{cls.name}</div>
                    <span className="text-xs font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap" style={{ background: isActive ? '#f0fdf4' : '#f3f4f6', color: isActive ? '#15803d' : '#9ca3af' }}>
                      {cls.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    {cls.subject && (
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: primaryColor, background: primaryColor + '15' }}>{cls.subject}</span>
                    )}
                    {cls.division && divColor && (
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: divColor, background: divColor + '15' }}>{cls.division}</span>
                    )}
                    {cls.enrollment_mode && cls.enrollment_mode !== 'open' && (
                      <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 rounded-full px-2 py-0.5">
                        <Users size={11} className="inline mr-0.5" />{cls.enrollment_mode === 'cohort' ? 'Cohort' : 'Mixed'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                    {cls.teacher_name && <span className="flex items-center gap-1"><GraduationCap size={11} />{cls.teacher_name}</span>}
                    {cls.room_name    && <span className="flex items-center gap-1"><DoorOpen size={11} />{cls.room_name}</span>}
                    {cls.class_size   && <span className="flex items-center gap-1"><Users size={11} />{cls.class_size} max</span>}
                  </div>
                  {(() => {
                    const room = cls.room_id ? c.rooms.find(r => r.id === cls.room_id) : null
                    if (room && room.capacity && cls.class_size && cls.class_size > room.capacity) {
                      return <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-2 py-1 flex items-center gap-1"><AlertTriangle size={11} />Over capacity by {cls.class_size - room.capacity}</div>
                    }
                    return null
                  })()}
                  {cls.description && (
                    <p className="text-xs text-gray-400 mt-2 mb-0 leading-snug line-clamp-2">{cls.description}</p>
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

function StatCard({ label, value, Icon, color }) {
  return (
    <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
      {Icon  && <Icon size={18} className="text-gray-400 shrink-0" />}
      {color && <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: color }} />}
      <span className="font-bold text-gray-800">{value}</span>
      <span className="text-gray-500 text-sm">{label}</span>
    </div>
  )
}
