import { useFacilities } from './hooks/useFacilities'
import {
  CATEGORIES, PRIORITIES, STATUSES,
  PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS,
  isOverdue, today,
} from './domain/facilities'

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

const Field = ({ label, value, half }) => (
  <div style={half ? { gridColumn: 'span 1' } : { gridColumn: 'span 2' }}>
    <div style={labelStyle}>{label}</div>
    <div style={{ fontSize: '0.9rem', color: '#374151', background: '#f9fafb', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', minHeight: '2rem' }}>{value || '—'}</div>
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Facilities</h2>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>Work orders and maintenance requests</p>
        </div>
        <button
          onClick={toggleForm}
          style={{ background: showForm ? '#6b7280' : primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ New Work Order'}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Open',                  value: stats.open,                color: '#3b82f6' },
          { label: 'In Progress',           value: stats.inProgress,          color: '#f59e0b' },
          { label: 'Urgent',                value: stats.urgent,              color: '#ef4444' },
          { label: 'Completed This Month',  value: stats.completedThisMonth,  color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{s.value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New Work Order Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem', border: `1px solid ${primaryColor}30` }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: '700', color: '#1f2937' }}>New Work Order</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Location / Room</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 204, Gym" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Submitted By</label>
              <input value={form.submitted_by} onChange={e => setForm({ ...form, submitted_by: e.target.value })} placeholder="Name of requester" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Assign To</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} style={inputStyle}>
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name} — {s.role}</option>)}
                <option value="External Vendor">External Vendor</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Est. Cost ($)</label>
              <input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0.00" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Full details of the issue…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          {formError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{formError}</p>}
          <div style={{ marginTop: '1rem' }}>
            <button onClick={submitWorkOrder} disabled={saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Submit Work Order'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders…" style={{ ...inputStyle, width: '220px', flex: 'none' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} style={{ fontSize: '0.8rem', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.375rem 0.625rem', cursor: 'pointer' }}>Clear</button>
        )}
        <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: 'auto' }}>{filtered.length} work order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Work Orders Table */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔧</div>
          <p style={{ margin: 0 }}>No work orders found.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Title', 'Category', 'Location', 'Priority', 'Status', 'Assigned To', 'Submitted', 'Due'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(wo => (
                <tr key={wo.id} onClick={() => openDrawer(wo)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1f2937', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ marginRight: '0.4rem' }}>{CATEGORY_ICONS[wo.category] || '🔧'}</span>{wo.title}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{wo.category}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{wo.location || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: PRIORITY_COLORS[wo.priority], background: PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{wo.priority}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: STATUS_COLORS[wo.status], background: STATUS_COLORS[wo.status] + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>{wo.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{wo.submitted_by || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: isOverdue(wo) ? '#ef4444' : '#6b7280', whiteSpace: 'nowrap' }}>
                    {wo.due_date || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeDrawer() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div style={{ width: '480px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            {/* Drawer Header */}
            <div style={{ background: primaryColor, padding: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '0.5rem' }}>{selected.title}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                    {CATEGORY_ICONS[selected.category]} {selected.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: PRIORITY_COLORS[selected.priority] + 'cc', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                    {selected.priority}
                  </span>
                </div>
              </div>
              <button onClick={closeDrawer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Status quick-update */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Status</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => quickUpdateStatus(selected.id, s)} style={{
                      fontSize: '0.8rem', fontWeight: selected.status === s ? '700' : '500',
                      color: selected.status === s ? 'white' : STATUS_COLORS[s],
                      background: selected.status === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '18',
                      border: `1px solid ${STATUS_COLORS[s]}`, borderRadius: '9999px',
                      padding: '0.25rem 0.75rem', cursor: 'pointer',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Edit toggle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditMode(!editMode); setEditForm({ ...selected }) }}
                  style={{ fontSize: '0.8rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  {editMode ? 'Cancel Edit' : 'Edit'}
                </button>
              </div>

              {editMode ? (
                /* Edit Form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <label style={labelStyle}>Title *</label>
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Location</label>
                      <input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Submitted By</label>
                      <input value={editForm.submitted_by || ''} onChange={e => setEditForm({ ...editForm, submitted_by: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Assign To</label>
                      <select value={editForm.assigned_to || ''} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} style={inputStyle}>
                        <option value="">Unassigned</option>
                        {staffList.map(s => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name} — {s.role}</option>)}
                        <option value="External Vendor">External Vendor</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Due Date</label>
                      <input type="date" value={editForm.due_date || ''} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Est. Cost ($)</label>
                      <input type="number" value={editForm.estimated_cost || ''} onChange={e => setEditForm({ ...editForm, estimated_cost: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Actual Cost ($)</label>
                      <input type="number" value={editForm.actual_cost || ''} onChange={e => setEditForm({ ...editForm, actual_cost: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <button onClick={saveEdit} disabled={savingEdit} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontWeight: '600', cursor: 'pointer' }}>
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                /* View Mode */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <Field label="Location"     value={selected.location}     half />
                  <Field label="Submitted By" value={selected.submitted_by} half />
                  <Field label="Assigned To"  value={selected.assigned_to || 'Unassigned'} half />
                  <Field label="Due Date"     value={selected.due_date}     half />
                  <Field label="Est. Cost"    value={selected.estimated_cost != null ? `$${Number(selected.estimated_cost).toLocaleString()}` : null} half />
                  <Field label="Actual Cost"  value={selected.actual_cost   != null ? `$${Number(selected.actual_cost).toLocaleString()}`   : null} half />
                  {selected.completed_date && <Field label="Completed" value={selected.completed_date} half />}
                  {selected.description && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={labelStyle}>Description</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', background: '#f9fafb', borderRadius: '0.5rem', padding: '0.75rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.description}</div>
                    </div>
                  )}
                  {selected.notes && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={labelStyle}>Notes</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', background: '#f9fafb', borderRadius: '0.5rem', padding: '0.75rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.notes}</div>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={labelStyle}>Opened</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
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
