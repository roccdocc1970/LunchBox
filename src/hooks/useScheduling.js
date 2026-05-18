/**
 * useScheduling Hook
 *
 * State and behavior for the Schedule module.
 * Coordinates drag-and-drop, auto-schedule, and section CRUD.
 */

import { useState, useEffect, useRef } from 'react'
import { supabase }            from '../supabase'
import { getClasses, saveClass } from '../services/classes'
import { getPeriods }          from '../services/schedule'
import { getRooms }            from '../services/rooms'
import { getBuildings }        from '../services/buildings'
import { getStaff }            from '../services/staff'
import { getAcademicYear }     from '../services/enrollment'
import {
  getSections,
  saveSection,
  deleteSection,
  batchSaveSections,
  clearSections,
} from '../services/classSections'
import { getAllCohortClasses, getAllCohortStudents } from '../services/cohorts'
import {
  getTerms,
  detectConflict,
  detectCohortConflict,
  autoSchedule,
  calcScheduleStats,
} from '../domain/scheduling'

export function useScheduling(user, school) {
  const terms       = getTerms(school?.grading_period)
  const currentYear = getAcademicYear()

  const [classes,        setClasses]        = useState([])
  const [allPeriods,     setAllPeriods]     = useState([])
  const [rooms,          setRooms]          = useState([])
  const [buildings,      setBuildings]      = useState([])
  const [staff,          setStaff]          = useState([])
  const [sections,       setSections]       = useState([])
  const [cohortClasses,  setCohortClasses]  = useState([])  // all cohort_classes rows
  const [cohortStudents, setCohortStudents] = useState([])  // all cohort_students rows
  const [loading,        setLoading]        = useState(true)

  const [term,         setTerm]         = useState(terms[0])
  const [academicYear, setAcademicYear] = useState(currentYear)
  const [activeView,   setActiveView]   = useState('grid')

  // Picker state
  const [roomPickerClassId,    setRoomPickerClassId]    = useState(null)
  const [teacherPickerClassId, setTeacherPickerClassId] = useState(null)

  // Drag-and-drop state
  const [dragData,    setDragData]    = useState(null)  // { classId, sectionId, fromPeriodId }
  const [dropTarget,  setDropTarget]  = useState(null)  // periodId being hovered
  const [conflictMsg, setConflictMsg] = useState(null)

  // Auto-schedule preview state
  const [preview, setPreview] = useState(null)  // { sections, unplaceable } | null

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  const initializedRef = useRef(false)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    // Skip mount — loadAll handles the first load.
    // Only fire when the user explicitly changes term or academicYear.
    if (!initializedRef.current) return
    loadSections()
  }, [term, academicYear])

  const loadAll = async () => {
    setLoading(true)
    const [cls, per, rm, bld, st, cc, cs] = await Promise.all([
      getClasses(supabase, user.id),
      getPeriods(supabase, user.id),
      getRooms(supabase, user.id),
      getBuildings(supabase, user.id),
      getStaff(supabase, user.id),
      getAllCohortClasses(supabase, user.id),
      getAllCohortStudents(supabase, user.id),
    ])
    setClasses(cls)
    setAllPeriods(per)
    setRooms(rm)
    setBuildings(bld)
    setStaff(st.filter(s => s.status === 'Active'))
    setCohortClasses(cc)
    setCohortStudents(cs)
    initializedRef.current = true
    await loadSections()
    setLoading(false)
  }

  const loadSections = async () => {
    const data = await getSections(supabase, user.id, term, academicYear)
    setSections(data)
    setPreview(null)
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const classMap   = Object.fromEntries(classes.map(c => [c.id, c]))
  const periodMap  = Object.fromEntries(allPeriods.map(p => [p.id, p]))
  const periods    = allPeriods.filter(p => p.type === 'Class')

  const scheduledIds = new Set(sections.map(s => s.class_id))
  const previewIds   = preview ? new Set(preview.sections.map(s => s.class_id)) : new Set()

  const unscheduled = classes.filter(c =>
    c.status === 'Active' &&
    !scheduledIds.has(c.id) &&
    !previewIds.has(c.id)
  )

  // Combine committed sections + preview sections for display
  const effectiveSections = preview
    ? [...sections, ...preview.sections.map(s => ({ ...s, id: `preview-${s.class_id}`, isPreview: true }))]
    : sections

  const stats = calcScheduleStats(classes, sections)

  // ── Drag and drop ──────────────────────────────────────────────────────────

  const handleDragStart = (classId, sectionId = null, fromPeriodId = null) => {
    setDragData({ classId, sectionId, fromPeriodId })
    setConflictMsg(null)
  }

  const handleDragOver = (e, periodId) => {
    e.preventDefault()
    setDropTarget(periodId)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (e, toPeriodId) => {
    e.preventDefault()
    setDropTarget(null)
    if (!dragData) return
    const { classId, sectionId, fromPeriodId } = dragData
    setDragData(null)
    if (fromPeriodId === toPeriodId) return

    const conflict = detectConflict(classId, toPeriodId, classes, sections)
      || detectCohortConflict(classId, toPeriodId, cohortClasses, cohortStudents, sections)
    if (conflict) {
      setConflictMsg(conflict)
      setTimeout(() => setConflictMsg(null), 4000)
      return
    }

    setSaving(true)
    try {
      if (sectionId) await deleteSection(supabase, sectionId)
      await saveSection(supabase, user.id, classId, toPeriodId, term, academicYear)
      await loadSections()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeSection = async (sectionId) => {
    try {
      await deleteSection(supabase, sectionId)
      await loadSections()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Auto-schedule ──────────────────────────────────────────────────────────

  const runAutoSchedule = () => {
    setError(null)
    const result = autoSchedule(classes, periods, sections, rooms)
    if (result.sections.length === 0 && result.unplaceable.length === 0) {
      setError('All active classes are already scheduled.')
      return
    }
    setPreview(result)
    if (result.unplaceable.length > 0) {
      setError(`Could not place: ${result.unplaceable.join(', ')}`)
    }
  }

  const applyPreview = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await batchSaveSections(supabase, user.id, preview.sections, term, academicYear)
      setPreview(null)
      setError(null)
      setSuccess(`Schedule applied — ${preview.sections.length} class${preview.sections.length !== 1 ? 'es' : ''} placed.`)
      setTimeout(() => setSuccess(null), 3000)
      await loadSections()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const discardPreview = () => {
    setPreview(null)
    setError(null)
  }

  const assignRoom = async (classId, roomId) => {
    const cls  = classes.find(c => c.id === classId)
    if (!cls) return
    const room = roomId ? rooms.find(r => r.id === roomId) : null

    // Pre-check: detect conflict before touching the DB so the original room is preserved on conflict
    if (roomId) {
      const classSection = sections.find(s => s.class_id === classId)
      if (classSection) {
        const testClasses = classes.map(c => c.id === classId
          ? { ...c, room_id: roomId, room_name: room?.name || null }
          : c
        )
        const conflict = detectConflict(classId, classSection.period_id, testClasses, sections)
        if (conflict) {
          setConflictMsg(conflict)
          setTimeout(() => setConflictMsg(null), 4500)
          setRoomPickerClassId(null)
          return
        }
      }
    }

    try {
      const updated = await saveClass(supabase, user.id, {
        ...cls,
        room_id:   roomId || null,
        room_name: room?.name || null,
      })
      setClasses(prev => prev.map(c => c.id === classId ? updated : c))
    } catch (err) {
      setError(err.message)
    }
    setRoomPickerClassId(null)
  }

  const assignTeacher = async (classId, teacherId) => {
    const cls     = classes.find(c => c.id === classId)
    if (!cls) return
    const member  = teacherId ? staff.find(s => s.id === teacherId) : null

    if (teacherId) {
      const classSection = sections.find(s => s.class_id === classId)
      if (classSection) {
        const testClasses = classes.map(c => c.id === classId
          ? { ...c, teacher_id: teacherId, teacher_name: member ? `${member.first_name} ${member.last_name}` : null }
          : c
        )
        const conflict = detectConflict(classId, classSection.period_id, testClasses, sections)
        if (conflict) {
          setConflictMsg(conflict)
          setTimeout(() => setConflictMsg(null), 4500)
          setTeacherPickerClassId(null)
          return
        }
      }
    }

    try {
      const updated = await saveClass(supabase, user.id, {
        ...cls,
        teacher_id:   teacherId || null,
        teacher_name: member ? `${member.first_name} ${member.last_name}` : null,
      })
      setClasses(prev => prev.map(c => c.id === classId ? updated : c))
    } catch (err) {
      setError(err.message)
    }
    setTeacherPickerClassId(null)
  }

  const clearAll = async () => {
    setSaving(true)
    try {
      await clearSections(supabase, user.id, term, academicYear)
      await loadSections()
      setSuccess('Schedule cleared.')
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return {
    // Data
    classes, periods, allPeriods, rooms, buildings,
    sections: effectiveSections, unscheduled,
    classMap, periodMap, stats,
    // Term / year
    terms, term, setTerm,
    academicYear, setAcademicYear,
    // View
    activeView, setActiveView,
    // Status
    loading, saving, error, success, conflictMsg,
    // Drag-and-drop
    dragData, dropTarget,
    handleDragStart, handleDragOver, handleDragLeave, handleDrop,
    removeSection,
    // Auto-schedule
    preview, runAutoSchedule, applyPreview, discardPreview,
    clearAll,
    // Room assignment
    roomPickerClassId, setRoomPickerClassId, assignRoom,
    // Teacher assignment
    staff, teacherPickerClassId, setTeacherPickerClassId, assignTeacher,
  }
}
