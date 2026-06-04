import { Mail, X } from 'lucide-react'
import { useParents } from './hooks/useParents'
import { getDivision } from './domain/school'
import { initials } from './domain/parents'
import { STATUS_COLORS } from './domain/school'

const fieldCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white'

export default function Parents({ user, school, onCompose }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    filtered, loading, parents,
    parsedDivisions, hasDivisions, gradeOptions, divisionOptions,
    search, setSearch,
    filterGrade, setFilterGrade,
    filterDivision, setFilterDivision,
    clearFilters,
    selected, openDrawer, closeDrawer,
    editing, setEditing,
    editForm, setEditForm,
    saving, error,
    startEdit, saveEdit,
  } = useParents(user.id, school)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Parent Directory</h2>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {filtered.length} parent{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6">
        <input
          placeholder="Search by parent or student name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-56 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
        />
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white min-w-36">
          <option value="">All Grades</option>
          {gradeOptions.map(g => <option key={g}>{g}</option>)}
        </select>
        {hasDivisions && (
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white min-w-36">
            <option value="">All Divisions</option>
            {divisionOptions.map(d => <option key={d}>{d}</option>)}
          </select>
        )}
        {(search || filterGrade || filterDivision) && (
          <button onClick={clearFilters} className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer text-gray-500 bg-white hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
          {parents.length === 0
            ? 'No parents yet. Add students via Enrollment to populate the directory.'
            : 'No parents match your filters.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Parent', 'Email', 'Phone', 'Student(s)', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => openDrawer(p)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: primaryColor + '20', color: primaryColor }}
                      >
                        {initials(p)}
                      </div>
                      <span className="font-semibold text-gray-800">{p.first_name} {p.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 text-sm">{p.email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3.5 text-gray-700 text-sm">{p.phone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {(p.students || []).map(s => {
                        const div = getDivision(s.grade, parsedDivisions)
                        return (
                          <span key={s.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5 text-xs text-gray-700 font-medium">
                            {s.first_name} {s.last_name}
                            {s.grade && <span className="font-semibold" style={{ color: div?.color || '#9ca3af' }}>· {s.grade}</span>}
                          </span>
                        )
                      })}
                      {(p.students || []).length === 0 && <span className="text-gray-300 text-sm">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.email && (
                      <button
                        onClick={e => { e.stopPropagation(); onCompose && onCompose(p) }}
                        className="border rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap bg-transparent"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <Mail size={13} className="inline mr-1" />Message
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-[500] flex justify-end" onClick={closeDrawer}>
          <div className="w-[420px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center font-extrabold text-lg shrink-0"
                    style={{ background: primaryColor + '20', color: primaryColor }}
                  >
                    {initials(selected)}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{selected.first_name} {selected.last_name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {(selected.students || []).length} linked student{(selected.students || []).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 flex items-center"><X size={16} /></button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="px-6 py-5 flex-1 flex flex-col gap-6">
              {error && <p className="text-red-500 text-sm m-0">{error}</p>}

              {!editing ? (
                <>
                  {/* Contact details */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</div>
                    {[
                      { label: 'Email',   value: selected.email },
                      { label: 'Phone',   value: selected.phone },
                      { label: 'Address', value: selected.address },
                    ].map(row => (
                      <div key={row.label} className="flex gap-3 items-start py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-400 w-14 shrink-0 pt-px">{row.label}</span>
                        <span className={`text-sm ${row.value ? 'text-gray-800' : 'text-gray-300'}`}>{row.value || '—'}</span>
                      </div>
                    ))}
                    {selected.notes && (
                      <div className="mt-2 text-sm text-gray-500">{selected.notes}</div>
                    )}
                  </div>

                  {/* Linked Students */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Linked Students</div>
                    {(selected.students || []).length === 0 ? (
                      <p className="text-sm text-gray-400 m-0">No students linked to this parent.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {(selected.students || []).map(s => {
                          const div = getDivision(s.grade, parsedDivisions)
                          return (
                            <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800 text-sm">{s.first_name} {s.last_name}</span>
                                <span
                                  className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                                  style={{ color: STATUS_COLORS[s.status] || '#9ca3af', background: (STATUS_COLORS[s.status] || '#9ca3af') + '18' }}
                                >
                                  {s.status}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1.5 flex-wrap">
                                {s.grade && <span className="text-xs text-gray-500">{s.grade}</span>}
                                {div && (
                                  <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: div.color, background: div.color + '15' }}>
                                    {div.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Edit form */
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                      <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className={fieldCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                      <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className={fieldCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                    <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className={`${fieldCls} resize-y`} />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 text-white border-0 rounded-lg py-2.5 font-bold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity"
                      style={{ background: primaryColor }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {!editing && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => startEdit(selected)}
                  className="flex-1 bg-white border rounded-xl py-2 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity"
                  style={{ color: primaryColor, borderColor: primaryColor }}
                >
                  Edit Contact
                </button>
                {selected.email && (
                  <button
                    onClick={() => { onCompose && onCompose(selected); closeDrawer() }}
                    className="flex-1 text-white border-0 rounded-xl py-2 font-bold cursor-pointer text-sm hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}
                  >
                    <Mail size={14} className="inline mr-1" />Send Message
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
