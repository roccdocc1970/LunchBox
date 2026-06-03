import { useRooms } from './hooks/useRooms'
import { ROOM_TYPES, ROOM_TYPE_COLORS, parseRoomDivisions } from './domain/rooms'
import { getFloorsForBuilding } from './domain/buildings'
import { parseDivisions, DIVISION_COLORS } from './domain/school'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-[0.9rem]'
const labelCls = 'block text-[0.8rem] font-medium text-gray-500 mb-1'

export default function Rooms({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const r = useRooms(user, school)

  const divisions = parseDivisions(school?.divisions)
    .map((d, i) => ({ ...d, color: DIVISION_COLORS[i % DIVISION_COLORS.length] }))
    .filter(d => d.grades?.length > 0)

  const renderForm = () => (
    <div className="bg-white rounded-2xl shadow-sm p-7 mb-6">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-5">
        {r.selected ? 'Edit Room' : 'New Room'}
      </div>
      {r.error && <p className="text-red-500 text-sm mb-4">{r.error}</p>}

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <label className={labelCls}>Room Name *</label>
          <input value={r.form.name} onChange={e => r.setForm({ ...r.form, name: e.target.value })} placeholder="e.g. Room 204" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select value={r.form.type} onChange={e => r.setForm({ ...r.form, type: e.target.value })} className={fieldCls}>
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Building</label>
          {r.buildings.length > 0 ? (
            <select value={r.form.building || ''} onChange={e => r.setForm({ ...r.form, building: e.target.value, floor: '' })} className={fieldCls}>
              <option value="">— None —</option>
              {r.buildings.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          ) : (
            <input value={r.form.building || ''} onChange={e => r.setForm({ ...r.form, building: e.target.value })} placeholder="e.g. Main Building" className={fieldCls} />
          )}
        </div>
        <div>
          <label className={labelCls}>Floor</label>
          {(() => {
            const floors = getFloorsForBuilding(r.buildings, r.form.building)
            return floors.length > 0 ? (
              <select value={r.form.floor || ''} onChange={e => r.setForm({ ...r.form, floor: e.target.value })} className={fieldCls}>
                <option value="">— None —</option>
                {floors.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <input value={r.form.floor || ''} onChange={e => r.setForm({ ...r.form, floor: e.target.value })} placeholder="e.g. 2nd Floor" className={fieldCls} />
            )
          })()}
        </div>
        <div>
          <label className={labelCls}>Capacity</label>
          <input type="number" min="1" value={r.form.capacity} onChange={e => r.setForm({ ...r.form, capacity: e.target.value })} placeholder="Max students" className={fieldCls} />
        </div>
      </div>

      {divisions.length > 0 && (
        <div className="mb-4">
          <label className={labelCls}>Assigned Divisions</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {divisions.map(div => {
              const selected = (r.form.divisions || []).includes(div.name)
              return (
                <button
                  key={div.name}
                  type="button"
                  onClick={() => r.toggleDivision(div.name)}
                  className="px-3.5 py-1 rounded-full text-[0.825rem] font-semibold cursor-pointer border-2 transition-all"
                  style={{
                    background: selected ? div.color : 'white',
                    color: selected ? 'white' : div.color,
                    borderColor: div.color,
                  }}
                >{div.name}</button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-5">
        <label className={labelCls}>Notes</label>
        <textarea value={r.form.notes || ''} onChange={e => r.setForm({ ...r.form, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} placeholder="AV equipment, accessibility notes…" />
      </div>

      <div className="flex gap-3">
        <button onClick={r.handleSave} disabled={r.saving}
          className="text-white border-0 rounded-lg px-6 py-2 font-semibold cursor-pointer text-[0.9rem] hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background: primaryColor }}>
          {r.saving ? 'Saving…' : r.selected ? 'Update Room' : 'Add Room'}
        </button>
        <button onClick={r.cancelEdit} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-[0.9rem] hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Rooms</h2>
          <p className="text-gray-500 mt-1">Manage classrooms and spaces across your school</p>
        </div>
        {!r.editing && (
          <button onClick={r.startAdd}
            className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-[0.9rem] hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}>
            + Add Room
          </button>
        )}
      </div>

      {r.success && <p className="text-green-700 text-sm mb-4 font-medium">✓ {r.success}</p>}

      {r.editing && renderForm()}

      {/* Stat cards */}
      {!r.editing && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <StatCard label="Total Rooms" value={r.stats.total} icon="🏫" />
          <StatCard label="Total Capacity" value={r.stats.capacity || '—'} icon="👥" />
          {Object.entries(r.stats.byType).map(([type, count]) => (
            <StatCard key={type} label={type} value={count} color={ROOM_TYPE_COLORS[type]} />
          ))}
        </div>
      )}

      {/* Filters */}
      {!r.editing && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or building…"
            value={r.search}
            onChange={e => r.setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 outline-none text-[0.9rem]"
          />
          <select value={r.filterType} onChange={e => r.setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-[0.9rem] min-w-[160px] bg-white">
            <option value="">All Types</option>
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          {(r.search || r.filterType) && (
            <button onClick={() => { r.setSearch(''); r.setFilterType('') }}
              className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-[0.9rem] hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Room list */}
      {r.loading ? (
        <p className="text-gray-400">Loading rooms…</p>
      ) : r.filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-[3rem] mb-4">🏫</div>
          <p className="text-gray-500 text-[1.1rem]">
            {r.rooms.length === 0 ? 'No rooms yet. Add your first room to get started.' : 'No rooms match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
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
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-shadow"
                style={{ boxShadow: isOpen ? `0 0 0 2px ${primaryColor}` : '0 1px 4px rgba(0,0,0,0.08)' }}
                onClick={() => isOpen ? r.closeRoom() : r.openRoom(room)}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)' }}
              >
                <div className="h-1" style={{ background: color }} />

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <div className="font-bold text-gray-800 text-base">{room.name}</div>
                      {(room.building || room.floor) && (
                        <div className="text-[0.78rem] text-gray-400 mt-0.5">
                          {[room.building, room.floor].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span className="text-[0.72rem] font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap"
                      style={{ color, background: color + '15' }}>
                      {room.type}
                    </span>
                  </div>

                  <div className="flex gap-4 text-[0.825rem] text-gray-500">
                    {room.capacity && <span>👥 {room.capacity} max</span>}
                  </div>

                  {overCapacityClasses.length > 0 && (
                    <div className="mt-2 bg-amber-50 border border-amber-300 rounded-md px-2.5 py-1.5 text-xs text-amber-900">
                      ⚠️ Over capacity: {overCapacityClasses.map(c => `${c.name} (${c.class_size})`).join(', ')}
                    </div>
                  )}

                  {roomDivs.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      {roomDivs.map(d => {
                        const div = divisions.find(x => x.name === d)
                        const dc = div?.color || '#6b7280'
                        return (
                          <span key={d} className="text-[0.7rem] font-semibold rounded-full px-2 py-0.5"
                            style={{ color: dc, background: dc + '15' }}>{d}</span>
                        )
                      })}
                    </div>
                  )}

                  {room.notes && (
                    <p className="text-[0.78rem] text-gray-400 mt-2.5 mb-0 leading-snug">{room.notes}</p>
                  )}

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); r.startEdit(room) }}
                        className="flex-1 text-white border-0 rounded-lg py-1.5 font-semibold cursor-pointer text-[0.85rem] hover:opacity-90 transition-opacity"
                        style={{ background: primaryColor }}>
                        Edit
                      </button>
                      {r.deleteId === room.id ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); r.handleDelete(room.id) }}
                            className="bg-red-500 text-white border-0 rounded-lg px-3.5 py-1.5 font-semibold cursor-pointer text-[0.85rem] hover:bg-red-600">
                            Confirm
                          </button>
                          <button onClick={e => { e.stopPropagation(); r.setDeleteId(null) }}
                            className="bg-white text-gray-500 border border-gray-300 rounded-lg px-3.5 py-1.5 cursor-pointer text-[0.85rem] hover:bg-gray-50">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); r.setDeleteId(room.id) }}
                          className="bg-white text-red-500 border border-red-500 rounded-lg px-3.5 py-1.5 cursor-pointer text-[0.85rem] hover:bg-red-50">
                          Delete
                        </button>
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
    <div className="bg-white rounded-xl px-5 py-3.5 shadow-sm flex items-center gap-3">
      {icon  && <span className="text-xl">{icon}</span>}
      {color && <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: color }} />}
      <span className="font-bold text-gray-800">{value}</span>
      <span className="text-gray-500 text-[0.85rem]">{label}</span>
    </div>
  )
}
