import { useClasses } from './hooks/useClasses'
import { CLASS_STATUS } from './domain/classes'
import { DIVISION_COLORS, parseDivisions } from './domain/school'

export default function Classes({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const c = useClasses(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))
  const divisions   = allDivs.filter(d => d.grades?.length > 0)

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  // ── Form ─────────────────────────────────────────────────────────────────
  const renderForm = () => (
    <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
        {c.selected ? 'Edit Class' : 'New Class'}
      </div>
      {c.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{c.error}</p>}

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
          <label style={labelStyle}>Room</label>
          <select value={c.form.room_id} onChange={e => c.selectRoom(e.target.value)} style={inputStyle}>
            <option value="">— Unassigned —</option>
            {c.rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}{r.building ? ` (${r.building})` : ''}</option>
            ))}
          </select>
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

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={c.handleSave} disabled={c.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
          {c.saving ? 'Saving…' : c.selected ? 'Update Class' : 'Add Class'}
        </button>
        <button onClick={c.cancelEdit} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          Cancel
        </button>
      </div>
    </div>
  )

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Classes</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage your school's classes, subjects, and teacher assignments</p>
        </div>
        {!c.editing && (
          <button onClick={c.startAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            + Add Class
          </button>
        )}
      </div>

      {c.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {c.success}</p>}

      {/* Add / Edit form */}
      {c.editing && renderForm()}

      {/* Stat cards */}
      {!c.editing && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatCard label="Total Classes" value={c.stats.total}    icon="📚" />
          <StatCard label="Active"        value={c.stats.active}   color="#10b981" />
          <StatCard label="Inactive"      value={c.stats.inactive} color="#9ca3af" />
          {Object.entries(c.stats.byDivision).map(([div, count]) => (
            <StatCard key={div} label={div} value={count} color={divColorMap[div] || '#6b7280'} />
          ))}
        </div>
      )}

      {/* Filters */}
      {!c.editing && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, teacher, or subject…"
            value={c.search}
            onChange={e => c.setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
          />
          {divisions.length > 0 && (
            <select value={c.filterDiv} onChange={e => c.setFilterDiv(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
              <option value="">All Divisions</option>
              {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          )}
          <select value={c.filterStatus} onChange={e => c.setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '130px' }}>
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
      )}

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
            const divColor  = divColorMap[cls.division] || null
            const isOpen    = c.selected?.id === cls.id && !c.editing
            const isActive  = cls.status === 'Active'

            return (
              <div
                key={cls.id}
                style={{
                  background: 'white', borderRadius: '1rem',
                  boxShadow: isOpen ? `0 0 0 2px ${primaryColor}` : '0 1px 4px rgba(0,0,0,0.08)',
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s',
                }}
                onClick={() => isOpen ? c.closeClass() : c.openClass(cls)}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)' }}
              >
                {/* Color bar — division color or primary */}
                <div style={{ height: '4px', background: divColor || primaryColor }} />

                <div style={{ padding: '1.25rem' }}>
                  {/* Name + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>{cls.name}</div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', borderRadius: '9999px', padding: '0.2rem 0.625rem', whiteSpace: 'nowrap',
                      background: isActive ? '#f0fdf4' : '#f3f4f6',
                      color:      isActive ? '#15803d' : '#9ca3af',
                    }}>{cls.status}</span>
                  </div>

                  {/* Chips row — subject + division */}
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
                  </div>

                  {/* Teacher + Room */}
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {cls.teacher_name && <span>👩‍🏫 {cls.teacher_name}</span>}
                    {cls.room_name    && <span>🚪 {cls.room_name}</span>}
                  </div>

                  {cls.description && (
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.625rem 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cls.description}
                    </p>
                  )}

                  {/* Expanded actions */}
                  {isOpen && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={e => { e.stopPropagation(); c.startEdit(cls) }}
                        style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                      >Edit</button>
                      {c.deleteId === cls.id ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); c.handleDelete(cls.id) }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>Confirm</button>
                          <button onClick={e => { e.stopPropagation(); c.setDeleteId(null) }} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); c.setDeleteId(cls.id) }} style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                      )}
                    </div>
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
