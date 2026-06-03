import { useState, useEffect } from 'react'
import { useCohorts } from './hooks/useCohorts'
import { COHORT_STATUS } from './domain/cohorts'
import { DIVISION_COLORS, parseDivisions } from './domain/school'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

export default function Cohorts({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const c = useCohorts(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))
  const divisions   = allDivs.filter(d => d.grades?.length > 0)

  const [detailTab, setDetailTab] = useState('info')
  useEffect(() => { if (c.editing) setDetailTab('info') }, [c.editing])

  const total    = c.cohorts.length
  const active   = c.cohorts.filter(x => x.status === 'Active').length
  const archived = c.cohorts.filter(x => x.status === 'Archived').length
  const byDiv    = c.cohorts.reduce((acc, x) => { if (x.division) acc[x.division] = (acc[x.division] || 0) + 1; return acc }, {})

  // ── Full-screen edit / detail view ───────────────────────────────────────────
  if (c.editing) {
    const memberCount = c.members.length
    const classCount  = c.cohortClasses.length

    return (
      <div className="p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={c.cancelEdit} className="bg-transparent border-0 text-gray-500 cursor-pointer text-sm flex items-center gap-1.5 hover:text-gray-700">← Cohorts</button>
            <span className="text-gray-300">|</span>
            <h2 className="m-0 text-xl font-bold text-gray-800">{c.selected ? c.selected.name : 'New Cohort'}</h2>
          </div>
          <div className="flex gap-2.5 items-center">
            <button onClick={c.handleSave} disabled={c.saving} className="text-white border-0 rounded-lg px-6 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
              {c.saving ? 'Saving…' : c.selected ? 'Save Changes' : 'Create Cohort'}
            </button>
            <button onClick={c.cancelEdit} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
            {c.selected && (
              c.deleteId === c.selected.id ? (
                <>
                  <span className="text-xs text-red-700 font-medium">Delete this cohort?</span>
                  <button onClick={() => c.handleDelete(c.selected.id)} className="bg-red-500 text-white border-0 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm hover:bg-red-600">Yes, Delete</button>
                  <button onClick={() => c.setDeleteId(null)} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
                </>
              ) : (
                <button onClick={() => c.setDeleteId(c.selected.id)} className="bg-white text-red-500 border border-red-200 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm hover:bg-red-50">Delete</button>
              )
            )}
          </div>
        </div>

        {c.error   && <p className="text-red-500 text-sm mb-4 font-medium">⚠ {c.error}</p>}
        {c.success && <p className="text-green-700 text-sm mb-4 font-medium">✓ {c.success}</p>}

        {/* Tab bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { id: 'info',    label: '📋 Cohort Info' },
              { id: 'members', label: memberCount > 0 ? `👥 Members (${memberCount})` : '👥 Members' },
              { id: 'classes', label: classCount  > 0 ? `📚 Classes (${classCount})`  : '📚 Classes'  },
            ].map(tab => {
              const isActive   = detailTab === tab.id
              const isDisabled = tab.id !== 'info' && !c.selected
              return (
                <button key={tab.id} onClick={() => !isDisabled && setDetailTab(tab.id)}
                  className={`px-5 py-2 rounded-lg border-0 text-sm transition-all ${isActive ? 'font-semibold text-white' : isDisabled ? 'font-normal text-gray-300 cursor-not-allowed' : 'font-normal text-gray-500 cursor-pointer'}`}
                  style={{ background: isActive ? primaryColor : 'transparent' }}>
                  {tab.label}
                </button>
              )
            })}
          </div>
          {!c.selected && <span className="text-xs text-gray-400 italic">Save the cohort first to manage members and classes</span>}
        </div>

        {/* ── Cohort Info ── */}
        {detailTab === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm p-7">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <label className={labelCls}>Cohort Name *</label>
                <input value={c.form.name} onChange={e => c.setForm({ ...c.form, name: e.target.value })} placeholder="e.g. Class of 2028, Blue Track" className={fieldCls} />
              </div>
              {c.divisions.length > 0 && (
                <div>
                  <label className={labelCls}>Division</label>
                  <select value={c.form.division || ''} onChange={e => c.setForm({ ...c.form, division: e.target.value })} className={fieldCls}>
                    <option value="">— None —</option>
                    {c.divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={labelCls}>Academic Year</label>
                <input value={c.form.academic_year || ''} onChange={e => c.setForm({ ...c.form, academic_year: e.target.value })} placeholder="e.g. 2025-2026" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={c.form.status} onChange={e => c.setForm({ ...c.form, status: e.target.value })} className={fieldCls}>
                  {COHORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-full">
                <label className={labelCls}>Description</label>
                <textarea value={c.form.description || ''} onChange={e => c.setForm({ ...c.form, description: e.target.value })} placeholder="Optional notes about this cohort…" rows={3} className={`${fieldCls} resize-y`} />
              </div>
            </div>
          </div>
        )}

        {/* ── Members ── */}
        {detailTab === 'members' && c.selected && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-2 gap-5">
              {/* Available students */}
              <div>
                <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Available ({c.availableStudents.length})</div>
                <input type="text" placeholder="Filter by name or grade…" value={c.memberSearch} onChange={e => c.setMemberSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none text-xs mb-2" />
                <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto py-1">
                  {c.availableStudents.length === 0 ? (
                    <p className="text-xs text-gray-300 italic m-0">{c.memberSearch ? 'No matches.' : 'All enrolled students are in this cohort.'}</p>
                  ) : c.availableStudents.map(s => (
                    <button key={s.id} onClick={() => c.handleAddMember(s.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all hover:text-white"
                      style={{ borderColor: primaryColor, background: 'white', color: primaryColor }}
                      onMouseEnter={ev => { ev.currentTarget.style.background = primaryColor; ev.currentTarget.style.color = 'white' }}
                      onMouseLeave={ev => { ev.currentTarget.style.background = 'white'; ev.currentTarget.style.color = primaryColor }}>
                      {s.first_name} {s.last_name}
                      <span className="text-[0.65rem] opacity-65">{s.grade}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Cohort members */}
              <div>
                <div className="text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wide mb-2">Cohort Members ({c.members.length})</div>
                <div className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto py-1">
                  {c.members.length === 0 ? (
                    <p className="text-xs text-gray-300 italic m-0">No members yet. Add students from the left.</p>
                  ) : c.members.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium bg-green-50 border-2 border-green-200 text-green-700">
                      {m.students?.first_name} {m.students?.last_name}
                      <span className="text-[0.65rem] opacity-65">{m.students?.grade}</span>
                      <button onClick={() => c.handleRemoveMember(m.id)} title="Remove from cohort"
                        className="bg-transparent border-0 cursor-pointer text-green-300 text-xs leading-none flex items-center hover:text-red-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Classes (read-only) ── */}
        {detailTab === 'classes' && c.selected && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-4">
              Classes are assigned to cohorts from the <strong>Classes</strong> module. Open a class, go to the Class Enrollment tab, and assign this cohort there.
            </p>
            {c.cohortClasses.length === 0 ? (
              <p className="text-sm text-gray-300 italic m-0">No classes assigned to this cohort yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {c.cohortClasses.map(cc => {
                  const cls      = cc.classes
                  const divColor = cls?.division ? (divColorMap[cls.division] || '#6b7280') : '#6b7280'
                  return (
                    <div key={cc.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm bg-green-50 border-2 border-green-200">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{cls?.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{[cls?.subject, cls?.division].filter(Boolean).join(' · ')}</div>
                      </div>
                      {cls?.teacher_name && <span className="text-xs text-gray-500">👩‍🏫 {cls.teacher_name}</span>}
                      {cls?.division && (
                        <span className="text-xs font-semibold rounded-full px-2 py-0.5 border" style={{ background: divColor + '18', color: divColor, borderColor: divColor + '40' }}>
                          {cls.division}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Card grid view ────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Cohorts</h2>
          <p className="text-gray-500 mt-1 text-sm">Group students for shared academic journeys — assign cohorts to classes for automatic enrollment</p>
        </div>
        <button onClick={c.startAdd} className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
          + New Cohort
        </button>
      </div>

      {c.success && <p className="text-green-700 text-sm mb-4 font-medium">✓ {c.success}</p>}

      {/* Stat cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard label="Total Cohorts" value={total}    icon="👥" />
        <StatCard label="Active"        value={active}   color="#10b981" />
        <StatCard label="Archived"      value={archived} color="#9ca3af" />
        {Object.entries(byDiv).map(([div, count]) => (
          <StatCard key={div} label={div} value={count} color={divColorMap[div] || '#6b7280'} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Search by name, division, or year…" value={c.search} onChange={e => c.setSearch(e.target.value)}
          className="flex-1 min-w-56 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm" />
        <select value={c.filterStatus} onChange={e => c.setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white">
          <option value="">All Statuses</option>
          {COHORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(c.search || c.filterStatus) && (
          <button onClick={() => { c.setSearch(''); c.setFilterStatus('') }}
            className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">Clear</button>
        )}
      </div>

      {/* Cohort cards */}
      {c.loading ? (
        <p className="text-gray-400">Loading cohorts…</p>
      ) : c.filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-500 text-lg">
            {c.cohorts.length === 0 ? 'No cohorts yet. Click + New Cohort to get started.' : 'No cohorts match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {c.filtered.map(cohort => {
            const divColor = cohort.division ? (divColorMap[cohort.division] || primaryColor) : primaryColor
            const isActive = cohort.status === 'Active'
            return (
              <div key={cohort.id} onClick={() => { c.openCohort(cohort); c.startEdit(cohort) }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-1" style={{ background: divColor }} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="font-bold text-gray-800 flex-1 pr-2">{cohort.name}</div>
                    <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {cohort.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    {cohort.division && (
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: divColor, background: divColor + '15' }}>{cohort.division}</span>
                    )}
                    {cohort.academic_year && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{cohort.academic_year}</span>
                    )}
                  </div>
                  {cohort.description && (
                    <p className="text-xs text-gray-400 m-0 leading-snug line-clamp-2">{cohort.description}</p>
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
    <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
      {icon  && <span className="text-xl">{icon}</span>}
      {color && <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: color }} />}
      <span className="font-bold text-gray-800">{value}</span>
      <span className="text-gray-500 text-sm">{label}</span>
    </div>
  )
}
