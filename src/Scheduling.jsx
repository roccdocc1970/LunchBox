import {
  Sparkles, AlertTriangle, Check, Bell, GraduationCap, DoorOpen,
  ArrowUpRight, X, Building2, CalendarDays,
} from 'lucide-react'
import { useScheduling }                  from './hooks/useScheduling'
import { DIVISION_COLORS, parseDivisions } from './domain/school'
import { fmt12 }                           from './domain/schedule'

export default function Scheduling({ user, school, onNavigateToClass }) {
  const primaryColor = school?.primary_color || '#f97316'
  const s = useScheduling(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))

  if (s.loading) return <div className="p-12 text-center text-gray-400">Loading schedule…</div>

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><CalendarDays size={22} style={{ color: primaryColor }} />Schedule</h2>
          <p className="text-gray-500 mt-1 text-sm">Assign classes to periods · drag to reschedule · auto-schedule for a first pass</p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 items-center flex-wrap">
          {/* Term selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {s.terms.map(t => (
              <button key={t} onClick={() => s.setTerm(t)}
                className="px-3.5 py-1.5 border-0 rounded-md cursor-pointer text-sm transition-all"
                style={{ fontWeight: s.term === t ? '700' : '400', background: s.term === t ? primaryColor : 'transparent', color: s.term === t ? 'white' : '#6b7280' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Academic year */}
          <input value={s.academicYear} onChange={e => s.setAcademicYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 outline-none" />

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[{ id: 'grid', label: 'Grid', Icon: Check }, { id: 'buildings', label: 'Buildings', Icon: Building2 }].map(v => (
              <button key={v.id} onClick={() => s.setActiveView(v.id)}
                className="px-3.5 py-1.5 border-0 rounded-md cursor-pointer text-sm transition-all"
                style={{ fontWeight: s.activeView === v.id ? '700' : '400', background: s.activeView === v.id ? 'white' : 'transparent', color: s.activeView === v.id ? '#1f2937' : '#6b7280', boxShadow: s.activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                <v.Icon size={14} className="inline mr-1" />{v.label}
              </button>
            ))}
          </div>

          {/* Auto-schedule */}
          {!s.preview && (
            <button onClick={s.runAutoSchedule} disabled={s.saving || s.unscheduled.length === 0}
              className="border-0 rounded-lg px-4 py-1.5 font-semibold text-sm transition-colors"
              style={{ background: s.unscheduled.length === 0 ? '#f3f4f6' : '#8b5cf6', color: s.unscheduled.length === 0 ? '#9ca3af' : 'white', cursor: s.unscheduled.length === 0 ? 'not-allowed' : 'pointer' }}
              title={s.unscheduled.length === 0 ? 'All classes are already scheduled' : `Auto-schedule ${s.unscheduled.length} unscheduled classes`}>
              <Sparkles size={14} className="inline mr-1" />Auto-Schedule
            </button>
          )}

          {/* Clear */}
          {s.sections.length > 0 && !s.preview && (
            <button onClick={s.clearAll} disabled={s.saving}
              className="bg-white text-red-500 border border-red-400 rounded-lg px-3.5 py-1.5 font-semibold cursor-pointer text-sm hover:bg-red-50 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stat bar */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[
          { label: 'Total Active', value: s.stats.total,       color: '#6b7280' },
          { label: 'Scheduled',    value: s.stats.scheduled,   color: '#10b981' },
          { label: 'Unscheduled',  value: s.stats.unscheduled, color: s.stats.unscheduled > 0 ? '#f59e0b' : '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-2.5">
            <span className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-gray-500 text-xs">{stat.label}</span>
          </div>
        ))}
        {s.periods.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-2.5 text-sm text-amber-800">
            <AlertTriangle size={15} className="inline mr-1.5" />No Class-type periods found — add periods in Settings → Bell Schedule first.
          </div>
        )}
      </div>

      {/* Preview banner */}
      {s.preview && (
        <div className="bg-violet-50 border border-violet-400 rounded-xl px-5 py-3.5 mb-4 flex items-center gap-4 flex-wrap">
          <Sparkles size={18} className="text-violet-500 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-violet-800">Auto-Schedule Preview — </span>
            <span className="text-gray-500 text-sm">{s.preview.sections.length} class{s.preview.sections.length !== 1 ? 'es' : ''} placed (shown with dashed border). Review then apply.</span>
          </div>
          <button onClick={s.applyPreview} disabled={s.saving} className="bg-violet-500 text-white border-0 rounded-lg px-4 py-1.5 font-bold cursor-pointer text-sm disabled:opacity-70 hover:bg-violet-600">
            {s.saving ? 'Applying…' : 'Apply'}
          </button>
          <button onClick={s.discardPreview} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-3.5 py-1.5 cursor-pointer text-sm hover:bg-gray-50">Discard</button>
        </div>
      )}

      {/* Alerts */}
      {s.conflictMsg && <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 mb-3.5 text-red-700 text-sm font-medium flex items-center gap-1.5"><AlertTriangle size={14} />{s.conflictMsg}</div>}
      {s.error       && <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 mb-3.5 text-red-700 text-sm">{s.error}</div>}
      {s.success     && <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-2.5 mb-3.5 text-green-700 text-sm font-medium flex items-center gap-1.5"><Check size={14} />{s.success}</div>}

      {/* Views */}
      {s.activeView === 'grid'      && <GridView      s={s} primaryColor={primaryColor} divColorMap={divColorMap} onNavigateToClass={onNavigateToClass} />}
      {s.activeView === 'buildings' && <BuildingsView s={s} primaryColor={primaryColor} divColorMap={divColorMap} />}
    </div>
  )
}

// ── Grid View ─────────────────────────────────────────────────────────────────

function GridView({ s, primaryColor, divColorMap, onNavigateToClass }) {
  if (s.periods.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
        <div className="mb-4 flex justify-center"><Bell size={48} className="text-gray-300" /></div>
        <p className="text-gray-500">No schedulable periods yet. Add Class-type periods in <strong>Settings → Bell Schedule</strong>.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 items-start">

      {/* Unscheduled panel */}
      <div className="w-[220px] shrink-0">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unscheduled</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: s.unscheduled.length > 0 ? '#fef3c7' : '#f0fdf4', color: s.unscheduled.length > 0 ? '#92400e' : '#15803d' }}>
              {s.unscheduled.length}
            </span>
          </div>
          <div className="p-2.5 flex flex-col gap-1.5 min-h-28">
            {s.unscheduled.length === 0 ? (
              <p className="text-green-600 text-xs text-center py-4 m-0 flex items-center justify-center gap-1"><Check size={12} />All classes scheduled</p>
            ) : s.unscheduled.map(cls => (
              <ClassCard key={cls.id} cls={cls} sectionId={null} periodId={null} isPreview={false}
                divColorMap={divColorMap} rooms={s.rooms} staff={s.staff}
                roomPickerOpen={s.roomPickerClassId === cls.id}
                onOpenRoomPicker={() => s.setRoomPickerClassId(cls.id)}
                onCloseRoomPicker={() => s.setRoomPickerClassId(null)}
                onAssignRoom={roomId => s.assignRoom(cls.id, roomId)}
                teacherPickerOpen={s.teacherPickerClassId === cls.id}
                onOpenTeacherPicker={() => s.setTeacherPickerClassId(cls.id)}
                onCloseTeacherPicker={() => s.setTeacherPickerClassId(null)}
                onAssignTeacher={teacherId => s.assignTeacher(cls.id, teacherId)}
                onDragStart={() => s.handleDragStart(cls.id, null, null)}
                onRemove={null} onNavigateToClass={onNavigateToClass} />
            ))}
          </div>
        </div>
      </div>

      {/* Period grid */}
      <div className="flex-1 flex flex-col gap-2">
        {s.periods.map(period => {
          const periodSections = s.sections.filter(sec => sec.period_id === period.id)
          const isTarget = s.dropTarget === period.id
          return (
            <div key={period.id}
              onDragOver={e => s.handleDragOver(e, period.id)}
              onDragLeave={s.handleDragLeave}
              onDrop={e => s.handleDrop(e, period.id)}
              className="rounded-2xl shadow-sm overflow-hidden transition-all"
              style={{ background: isTarget ? '#f0fdf4' : 'white', border: isTarget ? '2px dashed #10b981' : '2px solid transparent' }}>
              {/* Period header */}
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-4" style={{ background: isTarget ? '#f0fdf4' : '#fafafa' }}>
                <div className="min-w-28">
                  <div className="font-bold text-gray-800 text-sm">{period.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{fmt12(period.start_time)} – {fmt12(period.end_time)}</div>
                </div>
                <div className="text-xs text-gray-400">{period.days_of_week}</div>
                {periodSections.length === 0 && (
                  <div className="text-xs text-gray-300 italic ml-auto">{isTarget ? 'Drop here' : 'Empty — drag a class here'}</div>
                )}
              </div>
              {/* Class cards */}
              <div className="p-2.5 flex flex-wrap gap-2 min-h-14">
                {periodSections.map(sec => {
                  const cls = s.classMap[sec.class_id]
                  if (!cls) return null
                  return (
                    <ClassCard key={sec.id} cls={cls} sectionId={sec.id} periodId={period.id} isPreview={!!sec.isPreview}
                      divColorMap={divColorMap} rooms={s.rooms} staff={s.staff}
                      roomPickerOpen={s.roomPickerClassId === cls.id}
                      onOpenRoomPicker={() => s.setRoomPickerClassId(cls.id)}
                      onCloseRoomPicker={() => s.setRoomPickerClassId(null)}
                      onAssignRoom={roomId => s.assignRoom(cls.id, roomId)}
                      teacherPickerOpen={s.teacherPickerClassId === cls.id}
                      onOpenTeacherPicker={() => s.setTeacherPickerClassId(cls.id)}
                      onCloseTeacherPicker={() => s.setTeacherPickerClassId(null)}
                      onAssignTeacher={teacherId => s.assignTeacher(cls.id, teacherId)}
                      onDragStart={() => s.handleDragStart(cls.id, sec.id, period.id)}
                      onRemove={sec.isPreview ? null : () => s.removeSection(sec.id)}
                      onNavigateToClass={onNavigateToClass} />
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

// ── Class Card ────────────────────────────────────────────────────────────────

function ClassCard({ cls, sectionId, periodId, isPreview, divColorMap, rooms, staff,
  roomPickerOpen, onOpenRoomPicker, onCloseRoomPicker, onAssignRoom,
  teacherPickerOpen, onOpenTeacherPicker, onCloseTeacherPicker, onAssignTeacher,
  onDragStart, onRemove, onNavigateToClass }) {
  const divColor = cls.division ? (divColorMap[cls.division] || '#6b7280') : '#d1d5db'

  return (
    <div draggable onDragStart={onDragStart}
      className="rounded-lg px-2.5 py-2 cursor-grab select-none flex items-start gap-1.5 transition-shadow hover:shadow-md"
      style={{
        background:   isPreview ? '#f5f3ff' : 'white',
        border:       isPreview ? '2px dashed #8b5cf6' : '1px solid #e5e7eb',
        borderLeft:   `4px solid ${divColor}`,
        minWidth:     160,
        maxWidth:     220,
        boxShadow:    '0 1px 2px rgba(0,0,0,0.06)',
      }}>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-800 text-[0.82rem] truncate">{cls.name}</div>

        {/* Teacher line */}
        {teacherPickerOpen ? (
          <select autoFocus draggable={false} onDragStart={e => e.stopPropagation()}
            defaultValue={cls.teacher_id || ''}
            onChange={e => { e.stopPropagation(); onAssignTeacher(e.target.value || null) }}
            onBlur={onCloseTeacherPicker} onClick={e => e.stopPropagation()}
            className="text-[0.7rem] w-full mt-1 border border-gray-300 rounded px-1 py-0.5 outline-none cursor-pointer">
            <option value="">— No teacher —</option>
            {(staff || []).map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} — {m.role}</option>)}
          </select>
        ) : (
          <div onClick={e => { e.stopPropagation(); onOpenTeacherPicker() }} title="Click to assign teacher"
            className="text-[0.72rem] truncate cursor-pointer mt-0.5 transition-colors hover:text-orange-500"
            style={{ color: cls.teacher_name ? '#6b7280' : '#d1d5db' }}>
            <GraduationCap size={11} className="inline mr-0.5" />{cls.teacher_name || 'Assign teacher'}
          </div>
        )}

        {/* Room line */}
        {roomPickerOpen ? (
          <select autoFocus draggable={false} onDragStart={e => e.stopPropagation()}
            defaultValue={cls.room_id || ''}
            onChange={e => { e.stopPropagation(); onAssignRoom(e.target.value || null) }}
            onBlur={onCloseRoomPicker} onClick={e => e.stopPropagation()}
            className="text-[0.7rem] w-full mt-1 border border-gray-300 rounded px-1 py-0.5 outline-none cursor-pointer">
            <option value="">— No room —</option>
            {(rooms || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : (
          <div onClick={e => { e.stopPropagation(); onOpenRoomPicker() }} title="Click to assign room"
            className="text-[0.72rem] truncate cursor-pointer mt-0.5 transition-colors hover:text-orange-500"
            style={{ color: cls.room_name ? '#9ca3af' : '#d1d5db' }}>
            <DoorOpen size={11} className="inline mr-0.5" />{cls.room_name || 'Assign room'}
          </div>
        )}

        {cls.division && (
          <div className="text-[0.68rem] font-semibold mt-0.5" style={{ color: divColor }}>{cls.division}</div>
        )}
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {onNavigateToClass && (
          <button onClick={e => { e.stopPropagation(); onNavigateToClass(cls.id) }}
            className="bg-transparent border-0 cursor-pointer text-gray-300 text-[0.7rem] p-0 leading-none hover:text-indigo-500 transition-colors"
            title="Go to class details"><ArrowUpRight size={13} /></button>
        )}
        {onRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove() }}
            className="bg-transparent border-0 cursor-pointer text-gray-300 text-xs p-0 leading-none hover:text-red-500 transition-colors"
            title="Remove from this period"><X size={12} /></button>
        )}
      </div>
    </div>
  )
}

// ── Buildings View ────────────────────────────────────────────────────────────

function BuildingsView({ s, primaryColor, divColorMap }) {
  const roomSectionMap = {}
  s.sections.forEach(sec => {
    const cls = s.classMap[sec.class_id]
    if (!cls || !cls.room_id) return
    if (!roomSectionMap[cls.room_id]) roomSectionMap[cls.room_id] = []
    roomSectionMap[cls.room_id].push({ sec, cls })
  })

  const unassignedRooms = s.rooms.filter(r => !r.building)

  if (s.buildings.length === 0 && s.rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
        <div className="mb-4 flex justify-center"><Building2 size={48} className="text-gray-300" /></div>
        <p className="text-gray-500">No buildings or rooms configured. Add them in <strong>Settings → Campus</strong>.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {s.buildings.map(building => {
        const floors    = Array.isArray(building.floors) ? building.floors : []
        const bldgRooms = s.rooms.filter(r => r.building === building.name)
        return (
          <div key={building.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
              <Building2 size={20} className="text-gray-500 shrink-0" />
              <div>
                <div className="font-bold text-gray-800">{building.name}</div>
                <div className="text-xs text-gray-400">{building.type} · {bldgRooms.length} room{bldgRooms.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {floors.length > 0 ? floors.map(floor => {
                const floorRooms = bldgRooms.filter(r => r.floor === floor)
                return (
                  <div key={floor}>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{floor}</div>
                    {floorRooms.length === 0 ? (
                      <p className="text-xs text-gray-300 italic m-0">No rooms on this floor</p>
                    ) : (
                      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                        {floorRooms.map(room => <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} />)}
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {bldgRooms.map(room => <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} />)}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {unassignedRooms.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="font-bold text-gray-400 text-sm">Unassigned Rooms</div>
          </div>
          <div className="p-5 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {unassignedRooms.map(room => <RoomCard key={room.id} room={room} roomSectionMap={roomSectionMap} allPeriods={s.allPeriods} divColorMap={divColorMap} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, roomSectionMap, allPeriods, divColorMap }) {
  const assigned = roomSectionMap[room.id] || []
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className={`px-3.5 py-2.5 bg-gray-50 flex justify-between items-center ${assigned.length > 0 ? 'border-b border-gray-200' : ''}`}>
        <div>
          <div className="font-semibold text-gray-800 text-sm flex items-center gap-1"><DoorOpen size={14} />{room.name}</div>
          <div className="text-xs text-gray-400">{room.type}{room.capacity ? ` · cap. ${room.capacity}` : ''}</div>
        </div>
        <span className="text-xs font-bold rounded-full px-2 py-0.5"
          style={{ color: assigned.length > 0 ? '#15803d' : '#9ca3af', background: assigned.length > 0 ? '#f0fdf4' : '#f9fafb' }}>
          {assigned.length} class{assigned.length !== 1 ? 'es' : ''}
        </span>
      </div>
      {assigned.length > 0 && (
        <div className="p-2 flex flex-col gap-1">
          {assigned.map(({ sec, cls }) => {
            const period   = allPeriods.find(p => p.id === sec.period_id)
            const divColor = cls.division ? (divColorMap[cls.division] || '#6b7280') : '#d1d5db'
            return (
              <div key={sec.id} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md border-l-4" style={{ borderLeftColor: divColor }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{cls.name}</div>
                  {period && <div className="text-[0.68rem] text-gray-400">{period.name} · {fmt12(period.start_time)}–{fmt12(period.end_time)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {assigned.length === 0 && (
        <div className="px-3.5 py-3 text-xs text-gray-300 italic">No classes scheduled in this room</div>
      )}
    </div>
  )
}
