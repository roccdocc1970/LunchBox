import { useFacilities } from './hooks/useFacilities'
import {
  CATEGORIES, PRIORITIES, STATUSES,
  PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS,
  isOverdue,
} from './domain/facilities'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none'
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'

const Field = ({ label, value, span2 }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <div className={labelCls}>{label}</div>
    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 min-h-8">{value || '—'}</div>
  </div>
)

export default function Facilities({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    loading, filtered, stats, staffList,
    showForm, toggleForm, form, setForm, saving, formError, submitWorkOrder,
    selected, openDrawer, closeDrawer,
    editMode, setEditMode, editForm, setEditForm, savingEdit, saveEdit,
    quickUpdateStatus,
    search, setSearch,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    filterPriority, setFilterPriority,
    clearFilters,
  } = useFacilities(user.id)

  const hasFilters = filterStatus !== 'All' || filterCategory !== 'All' || filterPriority !== 'All' || search

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Facilities</h2>
          <p className="text-gray-500 mt-1 mb-0">Work orders and maintenance requests</p>
        </div>
        <button
          onClick={toggleForm}
          className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: showForm ? '#6b7280' : primaryColor }}
        >
          {showForm ? 'Cancel' : '+ New Work Order'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[
          { label: 'Open',                 value: stats.open,               color: '#3b82f6' },
          { label: 'In Progress',          value: stats.inProgress,         color: '#f59e0b' },
          { label: 'Urgent',               value: stats.urgent,             color: '#ef4444' },
          { label: 'Completed This Month', value: stats.completedThisMonth, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border-t-4" style={{ borderTopColor: s.color }}>
            <div className="text-3xl font-bold text-gray-800">{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New Work Order Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border" style={{ borderColor: primaryColor + '30' }}>
          <h3 className="m-0 mb-5 text-lg font-bold text-gray-800">New Work Order</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={fieldCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={fieldCls}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Location / Room</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 204, Gym" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Submitted By</label>
              <input value={form.submitted_by} onChange={e => setForm({ ...form, submitted_by: e.target.value })} placeholder="Name of requester" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Assign To</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className={fieldCls}>
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name} — {s.role}</option>)}
                <option value="External Vendor">External Vendor</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Est. Cost ($)</label>
              <input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0.00" className={fieldCls} />
            </div>
            <div className="col-span-full">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Full details of the issue…" className={`${fieldCls} resize-y`} />
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}
          <div className="mt-4">
            <button
              onClick={submitWorkOrder}
              disabled={saving}
              className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity"
              style={{ background: primaryColor }}
            >
              {saving ? 'Saving…' : 'Submit Work Order'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders…" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none w-56" />
        <select value={filterStatus}   onChange={e => setFilterStatus(e.target.value)}   className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-gray-500 bg-transparent border border-gray-300 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-gray-50">Clear</button>
        )}
        <span className="text-gray-500 text-sm ml-auto">{filtered.length} work order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Work Orders Table */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🔧</div>
          <p className="m-0">No work orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['Title', 'Category', 'Location', 'Priority', 'Status', 'Assigned To', 'Submitted', 'Due'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(wo => (
                <tr key={wo.id} onClick={() => openDrawer(wo)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="mr-1.5">{CATEGORY_ICONS[wo.category] || '🔧'}</span>{wo.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{wo.category}</td>
                  <td className="px-4 py-3 text-gray-500">{wo.location || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ color: PRIORITY_COLORS[wo.priority], background: PRIORITY_COLORS[wo.priority] + '18' }}>{wo.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ color: STATUS_COLORS[wo.status], background: STATUS_COLORS[wo.status] + '18' }}>{wo.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{wo.assigned_to || <span className="text-gray-400">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{wo.submitted_by || '—'}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${isOverdue(wo) ? 'text-red-500' : 'text-gray-500'}`}>{wo.due_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeDrawer() }}
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
        >
          <div className="w-[480px] bg-white h-full overflow-y-auto shadow-2xl">

            {/* Drawer Header */}
            <div className="p-6 text-white flex justify-between items-start" style={{ background: primaryColor }}>
              <div className="flex-1 pr-4">
                <div className="text-lg font-bold leading-snug mb-2">{selected.title}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-bold bg-white/20 rounded-full px-2.5 py-0.5">
                    {CATEGORY_ICONS[selected.category]} {selected.category}
                  </span>
                  <span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ background: PRIORITY_COLORS[selected.priority] + 'cc' }}>
                    {selected.priority}
                  </span>
                </div>
              </div>
              <button onClick={closeDrawer} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer hover:bg-white/30">✕</button>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Status quick-update */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Status</div>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => quickUpdateStatus(selected.id, s)}
                      className="text-xs rounded-full px-3 py-1 cursor-pointer border transition-all"
                      style={{
                        fontWeight: selected.status === s ? '700' : '500',
                        color: selected.status === s ? 'white' : STATUS_COLORS[s],
                        background: selected.status === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '18',
                        borderColor: STATUS_COLORS[s],
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Edit toggle */}
              <div className="flex justify-end">
                <button
                  onClick={() => { setEditMode(!editMode); setEditForm({ ...selected }) }}
                  className="text-xs font-semibold border rounded-md px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}
                >
                  {editMode ? 'Cancel Edit' : 'Edit'}
                </button>
              </div>

              {editMode ? (
                /* Edit Form */
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={fieldCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className={fieldCls}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Priority</label>
                      <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className={fieldCls}>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Location</label>
                      <input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Submitted By</label>
                      <input value={editForm.submitted_by || ''} onChange={e => setEditForm({ ...editForm, submitted_by: e.target.value })} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Assign To</label>
                      <select value={editForm.assigned_to || ''} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} className={fieldCls}>
                        <option value="">Unassigned</option>
                        {staffList.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name} — {s.role}</option>)}
                        <option value="External Vendor">External Vendor</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Due Date</label>
                      <input type="date" value={editForm.due_date || ''} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Est. Cost ($)</label>
                      <input type="number" value={editForm.estimated_cost || ''} onChange={e => setEditForm({ ...editForm, estimated_cost: e.target.value })} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Actual Cost ($)</label>
                      <input type="number" value={editForm.actual_cost || ''} onChange={e => setEditForm({ ...editForm, actual_cost: e.target.value })} className={fieldCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={`${fieldCls} resize-y`} />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} />
                  </div>
                  <button
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="text-white border-0 rounded-lg py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}
                  >
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                /* View Mode */
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Location"     value={selected.location} />
                  <Field label="Submitted By" value={selected.submitted_by} />
                  <Field label="Assigned To"  value={selected.assigned_to || 'Unassigned'} />
                  <Field label="Due Date"     value={selected.due_date} />
                  <Field label="Est. Cost"    value={selected.estimated_cost != null ? `$${Number(selected.estimated_cost).toLocaleString()}` : null} />
                  <Field label="Actual Cost"  value={selected.actual_cost   != null ? `$${Number(selected.actual_cost).toLocaleString()}`   : null} />
                  {selected.completed_date && <Field label="Completed" value={selected.completed_date} />}
                  {selected.description && (
                    <div className="col-span-2">
                      <div className={labelCls}>Description</div>
                      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{selected.description}</div>
                    </div>
                  )}
                  {selected.notes && (
                    <div className="col-span-2">
                      <div className={labelCls}>Notes</div>
                      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{selected.notes}</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className={labelCls}>Opened</div>
                    <div className="text-sm text-gray-500">{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
