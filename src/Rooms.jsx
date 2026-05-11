import { useRooms } from './hooks/useRooms'
import { ROOM_TYPES, ROOM_TYPE_COLORS, parseRoomDivisions } from './domain/rooms'
import { getFloorsForBuilding, parseFloors } from './domain/buildings'
import { parseDivisions, DIVISION_COLORS } from './domain/school'

export default function Rooms({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const r = useRooms(user, school)

  const divisions = parseDivisions(school?.divisions)
    .map((d, i) => ({ ...d, color: DIVISION_COLORS[i % DIVISION_COLORS.length] }))
    .filter(d => d.grades?.length > 0)

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  // ── Form (add or edit) ───────────────────────────────────────────────────
  const renderForm = () => (
    <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
        {r.selected ? 'Edit Room' : 'New Room'}
      </div>
      {r.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{r.error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>Room Name *</label>
          <input value={r.form.name} onChange={e => r.setForm({ ...r.form, name: e.target.value })} placeholder="e.g. Room 204" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={r.form.type} onChange={e => r.setForm({ ...r.form, type: e.target.value })} style={inputStyle}>
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Building</label>
          {r.buildings.length > 0 ? (
            <select
              value={r.form.building || ''}
              onChange={e => r.setForm({ ...r.form, building: e.target.value, floor: '' })}
              style={inputStyle}
            >
              <option value="">— None —</option>
              {r.buildings.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          ) : (
            <input value={r.form.building || ''} onChange={e => r.setForm({ ...r.form, building: e.target.value })} placeholder="e.g. Main Building" style={inputStyle} />
          )}
        </div>
        <div>
          <label style={labelStyle}>Floor</label>
          {(() => {
            const floors = getFloorsForBuilding(r.buildings, r.form.building)
            return floors.length > 0 ? (
              <select value={r.form.floor || ''} onChange={e => r.setForm({ ...r.form, floor: e.target.value })} style={inputStyle}>
                <option value="">— None —</option>
                {floors.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <input value={r.form.floor || ''} onChange={e => r.setForm({ ...r.form, floor: e.target.value })} placeholder="e.g. 2nd Floor" style={inputStyle} />
            )
          })()}
        </div>
        <div>
          <label style={labelStyle}>Capacity</label>
          <input type="number" min="1" value={r.form.capacity} onChange={e => r.setForm({ ...r.form, capacity: e.target.value })} placeholder="Max students" style={inputStyle} />
        </div>
      </div>

      {divisions.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Assigned Divisions</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {divisions.map(div => {
              const selected = (r.form.divisions || []).includes(div.name)
              return (
                <button
                  key={div.name}
                  type="button"
                  onClick={() => r.toggleDivision(div.name)}
                  style={{
                    padding: '0.3rem 0.875rem', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer',
                    background: selected ? div.color : 'white',
                    color: selected ? 'white' : div.color,
                    border: `2px solid ${div.color}`,
                    transition: 'all 0.15s',
                  }}
                >{div.name}</button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Notes</label>
        <textarea value={r.form.notes || ''} onChange={e => r.setForm({ ...r.form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="AV equipment, accessibility notes…" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={r.handleSave} disabled={r.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
          {r.saving ? 'Saving…' : r.selected ? 'Update Room' : 'Add Room'}
        </button>
        <button onClick={r.cancelEdit} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Rooms</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage classrooms and spaces across your school</p>
        </div>
        {!r.editing && (
          <button onClick={r.startAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            + Add Room
          </button>
        )}
      </div>

      {r.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {r.success}</p>}

      {/* Add / Edit form */}
      {r.editing && renderForm()}

      {/* Stat cards */}
      {!r.editing && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatCard label="Total Rooms" value={r.stats.total} icon="🏫" />
          <StatCard label="Total Capacity" value={r.stats.capacity || '—'} icon="👥" />
          {Object.entries(r.stats.byType).map(([type, count]) => (
            <StatCard key={type} label={type} value={count} color={ROOM_TYPE_COLORS[type]} />
          ))}
        </div>
      )}

      {/* Filters */}
      {!r.editing && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name or building…"
            value={r.search}
            onChange={e => r.setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          />
          <select value={r.filterType} onChange={e => r.setFilterType(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
            <option value="">All Types</option>
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          {(r.search || r.filterType) && (
            <button onClick={() => { r.setSearch(''); r.setFilterType('') }} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>Clear</button>
          )}
        </div>
      )}

      {/* Room list */}
      {r.loading ? (
        <p style={{ color: '#9ca3af' }}>Loading rooms…</p>
      ) : r.filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {r.rooms.length === 0 ? 'No rooms yet. Add your first room to get started.' : 'No rooms match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {r.filtered.map(room => {
            const color = ROOM_TYPE_COLORS[room.type] || '#6b7280'
            const roomDivs = parseRoomDivisions(room.divisions)
            const isOpen = r.selected?.id === room.id && !r.editing
            const overCapacityClasses = room.capacity
              ? r.classes.filter(c => c.room_id === room.id && c.class_size && c.class_size > room.capacity)
              : []

            return (
              <div
                key={room.id}
                style={{
                  background: 'white', borderRadius: '1rem',
                  boxShadow: isOpen ? `0 0 0 2px ${primaryColor}` : '0 1px 4px rgba(0,0,0,0.08)',
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s',
                }}
                onClick={() => isOpen ? r.closeRoom() : r.openRoom(room)}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)' }}
              >
                {/* Color bar */}
                <div style={{ height: '4px', background: color }} />

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem' }}>{room.name}</div>
                      {(room.building || room.floor) && (
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                          {[room.building, room.floor].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color, background: color + '15', borderRadius: '9999px', padding: '0.2rem 0.625rem', whiteSpace: 'nowrap' }}>
                      {room.type}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.825rem', color: '#6b7280' }}>
                    {room.capacity && (
                      <span>👥 {room.capacity} max</span>
                    )}
                  </div>

                  {overCapacityClasses.length > 0 && (
                    <div style={{ marginTop: '0.5rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.375rem', padding: '0.375rem 0.625rem', fontSize: '0.75rem', color: '#92400e' }}>
                      ⚠️ Over capacity: {overCapacityClasses.map(c => `${c.name} (${c.class_size})`).join(', ')}
                    </div>
                  )}

                  {roomDivs.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.625rem' }}>
                      {roomDivs.map(d => {
                        const div = divisions.find(x => x.name === d)
                        const dc = div?.color || '#6b7280'
                        return (
                          <span key={d} style={{ fontSize: '0.7rem', fontWeight: '600', color: dc, background: dc + '15', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{d}</span>
                        )
                      })}
                    </div>
                  )}

                  {room.notes && (
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.625rem 0 0', lineHeight: 1.4 }}>{room.notes}</p>
                  )}

                  {/* Expanded actions */}
                  {isOpen && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={e => { e.stopPropagation(); r.startEdit(room) }}
                        style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                      >Edit</button>
                      {r.deleteId === room.id ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); r.handleDelete(room.id) }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>Confirm</button>
                          <button onClick={e => { e.stopPropagation(); r.setDeleteId(null) }} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); r.setDeleteId(room.id) }} style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
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
      {icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
      {color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />}
      <span style={{ fontWeight: '700', color: '#1f2937' }}>{value}</span>
      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</span>
    </div>
  )
}
