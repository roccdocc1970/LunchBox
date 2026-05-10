/**
 * useScheduling Hook
 *
 * State and behavior for the Schedule module.
 * Coordinates drag-and-drop, auto-schedule, and section CRUD.
 */

import { useState, useEffect } from 'react'
import { supabase }            from '../supabase'
import { getClasses }          from '../services/classes'
import { getPeriods }          from '../services/schedule'
import { getRooms }            from '../services/rooms'
import { getBuildings }        from '../services/buildings'
import { getAcademicYear }     from '../services/enrollment'
import {
  getSections,
  saveSection,
  deleteSection,
  batchSaveSections,
  clearSections,
} from '../services/classSections'
import {
  getTerms,
  detectConflict,
  autoSchedule,
  calcScheduleStats,
} from '../domain/scheduling'

export function useScheduling(user, school) {
  const terms       = getTerms(school?.grading_period)
  const currentYear = getAcademicYear()

  const [classes,   setClasses]   = useState([])
  const [allPeriods, setAllPeriods] = useState([])
  const [rooms,     setRooms]     = useState([])
  const [buildings, setBuildings] = useState([])
  const [sections,  setSections]  = useState([])
  const [loading,   setLoading]   = useState(true)

  const [term,         setTerm]         = useState(terms[0])
  const [academicYear, setAcademicYear] = useState(currentYear)
  const [activeView,   setActiveView]   = useState('grid')

  // Drag-and-drop state
  const [dragData,    setDragData]    = useState(null)  // { classId, sectionId, fromPeriodId }
  const [dropTarget,  setDropTarget]  = useState(null)  // periodId being hovered
  const [conflictMsg, setConflictMsg] = useState(null)

  // Auto-schedule preview state
  const [preview, setPreview] = useState(null)  // { sections, unplaceable } | null

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!loading) loadSections()
  }, [term, academicYear])

  const loadAll = async () => {
    setLoading(true)
    const [cls, per, rm, bld] = await Promise.all([
      getClasses(supabase, user.id),
      getPeriods(supabase, user.id),
      getRooms(supabase, user.id),
      getBuildings(supabase, user.id),
    ])
    setClasses(cls)
    setAllPeriods(per)
    setRooms(rm)
    setBuildings(bld)
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
    const result = autoSchedule(classes, periods, sections)
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
  }
}
