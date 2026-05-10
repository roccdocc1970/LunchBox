import { useScheduling }                  from './hooks/useScheduling'
import { DIVISION_COLORS, parseDivisions } from './domain/school'
import { fmt12 }                           from './domain/schedule'

export default function Scheduling({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const s = useScheduling(user, school)

  const allDivs    = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(
    allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]])
  )

  if (s.loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading schedule…
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Schedule</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Assign classes to periods · drag to reschedule · auto-schedule for a first pass
          </p>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Term selector */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem' }}>
            {s.terms.map(t => (
              <button
                key={t}
                onClick={() => s.setTerm(t)}
                style={{
                  padding: '0.375rem 0.875rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                  fontWeight: s.term === t ? '700' : '400', fontSize: '0.875rem',
                  background: s.term === t ? primaryColor : 'transparent',
                  color: s.term === t ? 'white' : '#6b7280',
                  transition: 'all 0.15s',
                }}
              >{t}</button>
            ))}
          </div>

          {/* Academic year */}
          <input
            value={s.academicYear}
            onChange={e => s.setAcademicYear(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: '110px', outline: 'none' }}
          />

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem' }}>
            {[{ id: 'grid', label: '📅 Grid' }, { id: 'buildings', label: '🏛️ Buildings' }].map(v => (
              <button
                key={v.id}
                onClick={() => s.setActiveView(v.id)}
                style={{
                  padding: '0.375rem 0.875rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                  fontWeight: s.activeView === v.id ? '700' : '400', fontSize: '0.875rem',
                  background: s.activeView === v.id ? 'white' : 'transparent',
                  color: s.activeView === v.id ? '#1f2937' : '#6b7280',
                  boxShadow: s.activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >{v.label}</button>
            ))}
          </div>

          {/* Auto-schedule */}
          {!s.preview && (
            <button
              onClick={s.runAutoSchedule}
              disabled={s.saving || s.unscheduled.length === 0}
              style={{
                background: s.unscheduled.length === 0 ? '#f3f4f6' : '#8b5cf6',
                color: s.unscheduled.length === 0 ? '#9ca3af' : 'white',
                border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem',
                fontWeight: '600', cursor: s.unscheduled.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
              }}
              title={s.unscheduled.length === 0 ? 'All classes are already scheduled' : `Auto-schedule ${s.unscheduled.length} unscheduled classes`}
            >✨ Auto-Schedule</button>
          )}

          {/* Clear */}
          {s.sections.length > 0 && !s.preview && (
            <button
              onClick={s.clearAll}
              disabled={s.saving}
              style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.375rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
            >Clear</button>
          )}
        </div>
      </div>

      {/* ── Stat bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Active', value: s.stats.total,       color: '#6b7280' },
          { label: 'Scheduled',    value: s.stats.scheduled,   color: '#10b981' },
          { label: 'Unscheduled',  value: s.stats.unscheduled, color: s.stats.unscheduled > 0 ? '#f59e0b' : '#10b981' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.625rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontWeight: '700', color: stat.color, fontSize: '1.1rem' }}>{stat.value}</span>
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{stat.label}</span>
          </div>
        ))}
        {s.periods.length === 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.75rem', padding: '0.625rem 1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
            ⚠️ No Class-type periods found — add periods in Settings → Bell Schedule first.
          </div>
        )}
      </div>

      {/* ── Preview banner ─────────────────────────────────────────────────── */}
      {s.preview && (
        <div style={{ background: '#f5f3ff', border: '1px solid #8b5cf6', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem' }}>✨</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '700', color: '#5b21b6' }}>Auto-Schedule Preview — </span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {s.preview.sections.length} class{s.preview.sections.length !== 1 ? 'es' : ''} placed (shown with dashed border). Review then apply.
            </span>
          </div>
          <button onClick={s.applyPreview} disabled={s.saving} style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem' }}>
            {s.saving ? 'Applying…' : 'Apply'}
          </button>
          <button onClick={s.discardPreview} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.375rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            Discard
          </button>
        </div>
      )}

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {s.conflictMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.625rem 1rem', marginBottom: '0.875rem', color: '#b91c1c', fontSize: '0.875rem', fontWeight: '500' }}>
          ⚠️ {s.conflictMsg}
        </div>
      )}
      {s.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.625rem 1rem', marginBottom: '0.875rem', color: '#b91c1c', fontSize: '0.875rem' }}>
          {s.error}
        </div>
      )}
      {s.success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.625rem 1rem', marginBottom: '0.875rem', color: '#15803d', fontSize: '0.875rem', fontWeight: '500' }}>
          ✓ {s.success}
        </div>
      )}

      {/* ── Views ──────────────────────────────────────────────────────────── */}
      {s.activeView === 'grid'      && <GridView      s={s} primaryColor={primaryColor} divColorMap={divColorMap} />}
      {s.activeView === 'buildings' && <BuildingsView s={s} primaryColor={primaryColor} divColorMap={divColorMap} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid View
// ─────────────────────────────────────────────────────────────────────────────

function GridView({ s, primaryColor, divColorMap }) {
  if (s.periods.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
        <p style={{ color: '#6b7280' }}>No schedulable periods yet. Add Class-type periods in <strong>Settings → Bell Schedule</strong>.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

      {/* ── Unscheduled panel ─────────────────────────────────────────────── */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unscheduled</span>
            <span style={{ background: s.unscheduled.length > 0 ? '#fef3c7' : '#f0fdf4', color: s.unscheduled.length > 0 ? '#92400e' : '#15803d', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
              {s.unscheduled.length}
            </span>
          </div>
          <div style={{ padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', minHeight: '120px' }}>
            {s.unscheduled.length === 0 ? (
              <p style={{ color: '#10b981', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0', margin: 0 }}>✓ All classes scheduled</p>
            ) : (
              s.unscheduled.map(cls => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  sectionId={null}
                  periodId={null}
                  isPreview={false}
                  divColorMap={divColorMap}
                  onDragStart={() => s.handleDragStart(cls.id, null, null)}
                  onRemove={null}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Period grid ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {s.periods.map(period => {
          const periodSections = s.sections.filter(sec => sec.period_id === period.id)
          const isTarget = s.dropTarget === period.id

          return (
            <div
              key={period.id}
              onDragOver={e => s.handleDragOver(e, period.id)}
              onDragLeave={s.handleDragLeave}
              onDrop={e => s.handleDrop(e, period.id)}
              style={{
                background: isTarget ? '#f0fdf4' : 'white',
                border: isTarget ? '2px dashed #10b981' : '2px solid transparent',
                borderRadius: '0.875rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.1s',
                overflow: 'hidden',
              }}
            >
              {/* Period header */}
              <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '1rem', background: isTarget ? '#f0fdf4' : '#fafafa' }}>
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>{period.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                    {fmt12(period.start_time)} – {fmt12(period.end_time)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{period.days_of_week}</div>
                {periodSections.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#d1d5db', fontStyle: 'italic', marginLeft: 'auto' }}>
                    {isTarget ? 'Drop here' : 'Empty — drag a class here'}
                  </div>
                )}
              </div>

              {/* Class cards in this period */}
              <div style={{ padding: '0.625rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '60px' }}>
                {periodSections.map(sec => {
                  const cls = s.classMap[sec.class_id]
                  if (!cls) return null
                  return (
                    <ClassCard
                      key={sec.id}
                      cls={cls}
                      sectionId={sec.id}
                      periodId={period.id}
                      isPreview={!!sec.isPreview}
                      divColorMap={divColorMap}
                      onDragStart={() => s.handleDragStart(cls.id, sec.id, period.id)}
                      onRemove={sec.isPreview ? null : () => s.removeSection(sec.id)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Class Card — used in both unscheduled panel and period rows
// ─────────────────────────────────────────────────────────────────────────────

function ClassCard({ cls, sectionId, periodId, isPreview, divColorMap, onDragStart, onRemove }) {
  const divColor = cls.division ? (divColorMap[cls.division] || '#6b7280') : '#d1d5db'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background: isPreview ? '#f5f3ff' : 'white',
        border: isPreview ? `2px dashed #8b5cf6` : `1px solid #e5e7eb`,
        borderLeft: `4px solid ${divColor}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.625rem',
        cursor: 'grab',
        userSelect: 'none',
        minWidth: '160px',
        maxWidth: '220px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.375rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cls.name}
        </div>
        {cls.teacher_name && (
          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            👩‍🏫 {cls.teacher_name}
          </div>
        )}
        {cls.room_name && (
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🚪 {cls.room_name}
          </div>
        )}
        {cls.division && (
          <div style={{ fontSize: '0.68rem', color: divColor, fontWeight: '600', marginTop: '0.15rem' }}>
            {cls.division}
          </div>
        )}
      </div>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.75rem', padding: '0', lineHeight: 1, flexShrink: 0 }}
          title="Remove from this period"
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
        >✕</button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Buildings View
// ─────────────────────────────────────────────────────────────────────────────

function BuildingsView({ s, primaryColor, divColorMap }) {
  // Build a lookup: room_id → sections in current term
  const roomSectionMap = {}
  s.sections.forEach(sec => {
    const cls = s.classMap[sec.class_id]
    if (!cls || !cls.room_id) return
    if (!roomSectionMap[cls.room_id]) roomSectionMap[cls.room_id] = []
    roomSectionMap[cls.room_id].push({ sec, cls })
  })

  // Rooms with no building assignment
  const unassignedRooms = s.rooms.filter(r => !r.building)

  if (s.buildings.length === 0 && s.rooms.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <p style={{ color: '#6b7280' }}>No buildings or rooms configured. Add them in <strong>Settings → Campus</strong> and <strong>Rooms</strong>.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {s.buildings.map(building => {
        const floors     = Array.isArray(building.floors) ? building.floors : []
        const bldgRooms  = s.rooms.filter(r => r.building === building.name)

        return (
          <div key={building.id} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {/* Building header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fafafa' }}>
              <span style={{ fontSize: '1.25rem' }}>🏛️</span>
              <div>
                <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem' }}>{building.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{building.type} · {bldgRooms.length} room{bldgRooms.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {floors.length > 0 ? floors.map(floor => {
                const floorRooms = bldgRooms.filter(r => r.floor === floor)
                return (
                  <div key={floor}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {floor}
                    </div>
                    {floorRooms.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>No rooms on this floor</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
                        {floorRooms.map(room => (
                          <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} primaryColor={primaryColor} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              }) : (
                /* No floors — just show all rooms in this building */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
                  {bldgRooms.map(room => (
                    <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} primaryColor={primaryColor} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Unassigned rooms */}
      {unassignedRooms.length > 0 && (
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
            <div style={{ fontWeight: '700', color: '#9ca3af', fontSize: '0.875rem' }}>Unassigned Rooms</div>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
            {unassignedRooms.map(room => (
              <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} primaryColor={primaryColor} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, roomSectionMap, allPeriods, divColorMap, primaryColor }) {
  const assigned = roomSectionMap[room.id] || []

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
      {/* Room header */}
      <div style={{ padding: '0.625rem 0.875rem', background: '#f9fafb', borderBottom: assigned.length > 0 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>🚪 {room.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{room.type}{room.capacity ? ` · cap. ${room.capacity}` : ''}</div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: assigned.length > 0 ? '#15803d' : '#9ca3af', background: assigned.length > 0 ? '#f0fdf4' : '#f9fafb', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
          {assigned.length} class{assigned.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Assigned classes */}
      {assigned.length > 0 && (
        <div style={{ padding: '0.5rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {assigned.map(({ sec, cls }) => {
            const period   = allPeriods.find(p => p.id === sec.period_id)
            const divColor = cls.division ? (divColorMap[cls.division] || '#6b7280') : '#d1d5db'
            return (
              <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', background: '#fafafa', borderRadius: '0.375rem', borderLeft: `3px solid ${divColor}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
                  {period && (
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      {period.name} · {fmt12(period.start_time)}–{fmt12(period.end_time)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {assigned.length === 0 && (
        <div style={{ padding: '0.75rem 0.875rem', fontSize: '0.78rem', color: '#d1d5db', fontStyle: 'italic' }}>
          No classes scheduled in this room
        </div>
      )}
    </div>
  )
}
