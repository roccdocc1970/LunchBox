/**
 * useClasses Hook
 *
 * State and behavior for the Classes module.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getClasses, saveClass, deleteClass } from '../services/classes'
import { getStaff } from '../services/staff'
import { getRooms } from '../services/rooms'
import { getStudents } from '../services/enrollment'
import { getEnrollments, enrollStudent, unenrollStudent } from '../services/classEnrollments'
import { getCohorts, getClassCohorts, getCohortStudents, addCohortClass, removeCohortClass, bulkEnrollCohort } from '../services/cohorts'
import { BLANK_CLASS, validateClass, calcClassStats } from '../domain/classes'
import { parseDivisions } from '../domain/school'

export function useClasses(user, school) {
  const [classes,      setClasses]      = useState([])
  const [staff,        setStaff]        = useState([])
  const [rooms,        setRooms]        = useState([])
  const [students,     setStudents]     = useState([])
  const [cohorts,      setCohorts]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)
  const [editing,      setEditing]      = useState(false)
  const [form,         setForm]         = useState({ ...BLANK_CLASS })
  const [saving,       setSaving]       = useState(false)
  const [deleteId,     setDeleteId]     = useState(null)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterDiv,    setFilterDiv]    = useState('')
  const [filterStatus, setFilterStatus] = useState('Active')

  // Individual enrollment state
  const [enrollments,    setEnrollments]    = useState([])
  const [enrollSearch,   setEnrollSearch]   = useState('')
  const [enrollSaving,   setEnrollSaving]   = useState(false)

  // Cohort assignment state
  const [classCohorts,   setClassCohorts]   = useState([])  // cohort_classes rows for selected class
  const [cohortSearch,   setCohortSearch]   = useState('')
  const [cohortEnrolling, setCohortEnrolling] = useState(false)

  // Derived from school config
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
  const subjects  = Array.isArray(school?.subjects_offered) ? school.subjects_offered : []

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selected) {
      loadEnrollments(selected.id)
      loadClassCohorts(selected.id)
    } else {
      setEnrollments([])
      setClassCohorts([])
    }
    setEnrollSearch('')
    setCohortSearch('')
  }, [selected?.id])

  const load = async () => {
    setLoading(true)
    const [cls, st, rm, stu, coh] = await Promise.all([
      getClasses(supabase, user.id),
      getStaff(supabase, user.id),
      getRooms(supabase, user.id),
      getStudents(supabase, user.id),
      getCohorts(supabase, user.id),
    ])
    setClasses(cls)
    setStaff(st.filter(s => s.status === 'Active'))
    setRooms(rm)
    setStudents(stu.filter(s => s.status === 'Enrolled'))
    setCohorts(coh.filter(c => c.status === 'Active'))
    setLoading(false)
  }

  const loadEnrollments = async (classId) => {
    const data = await getEnrollments(supabase, user.id, classId)
    setEnrollments(data)
  }

  const loadClassCohorts = async (classId) => {
    const data = await getClassCohorts(supabase, classId)
    setClassCohorts(data)
  }

  // ── Detail panel ──────────────────────────────────────────────────────────

  const openClass = (cls) => {
    setSelected(cls)
    setEditing(false)
    setError(null)
    setDeleteId(null)
  }

  const closeClass = () => {
    setSelected(null)
    setEditing(false)
    setError(null)
    setDeleteId(null)
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  const startAdd = () => {
    setForm({ ...BLANK_CLASS })
    setEditing(true)
    setSelected(null)
    setError(null)
  }

  const startEdit = (cls) => {
    setForm({ ...cls })
    setEditing(true)
    setError(null)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    if (!selected) setForm({ ...BLANK_CLASS })
  }

  // ── Teacher helper ────────────────────────────────────────────────────────

  const selectTeacher = (teacherId) => {
    const member = staff.find(s => s.id === teacherId)
    setForm(prev => ({
      ...prev,
      teacher_id:   teacherId,
      teacher_name: member ? `${member.first_name} ${member.last_name}` : '',
    }))
  }

  // ── Room helper ───────────────────────────────────────────────────────────

  const selectRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId)
    setForm(prev => ({
      ...prev,
      room_id:   roomId,
      room_name: room ? room.name : '',
    }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const err = validateClass(form)
    if (err) { setError(err); return }

    setSaving(true)
    setError(null)
    try {
      const saved = await saveClass(
        supabase,
        user.id,
        selected ? { ...form, id: selected.id } : form,
      )
      setSuccess(selected ? 'Class updated.' : 'Class added.')
      setTimeout(() => setSuccess(null), 2500)
      setEditing(false)
      setSelected(saved)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    try {
      await deleteClass(supabase, id)
      closeClass()
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Enrollment ────────────────────────────────────────────────────────────

  const handleEnroll = async (studentId) => {
    if (!selected) return

    const cap = form.class_size ? parseInt(form.class_size, 10) : null
    if (cap !== null && enrollments.length >= cap) {
      setError(`This class is at capacity (${cap} students). Increase the Class Size limit to enroll more.`)
      return
    }

    setEnrollSaving(true)
    setError(null)
    try {
      await enrollStudent(supabase, user.id, selected.id, studentId)
      await loadEnrollments(selected.id)
      setEnrollSearch('')
    } catch (e) {
      setError(e.message)
    } finally {
      setEnrollSaving(false)
    }
  }

  const handleUnenroll = async (enrollmentId) => {
    if (!selected) return
    try {
      await unenrollStudent(supabase, enrollmentId)
      await loadEnrollments(selected.id)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Cohort assignment ─────────────────────────────────────────────────────

  const handleAddCohort = async (cohortId) => {
    if (!selected) return
    setCohortEnrolling(true)
    setError(null)
    try {
      await addCohortClass(supabase, user.id, cohortId, selected.id, true)
      const result = await bulkEnrollCohort(supabase, user.id, cohortId, selected.id)
      await Promise.all([loadClassCohorts(selected.id), loadEnrollments(selected.id)])
      if (result.enrolled > 0) {
        setSuccess(`Cohort assigned — ${result.enrolled} student${result.enrolled !== 1 ? 's' : ''} enrolled.${result.skipped > 0 ? ` ${result.skipped} skipped (already enrolled).` : ''}`)
      } else if (result.skipped > 0) {
        setSuccess(`Cohort assigned — all ${result.skipped} member${result.skipped !== 1 ? 's' : ''} already enrolled.`)
      } else {
        setSuccess('Cohort assigned — no members to enroll yet.')
      }
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError(e.message)
    } finally {
      setCohortEnrolling(false)
    }
  }

  const handleRemoveCohort = async (cohortClassId, cohortId) => {
    if (!selected) return
    try {
      // Unenroll this cohort's students from the class
      const members  = await getCohortStudents(supabase, cohortId)
      const memberIds = new Set(members.map(m => m.student_id))
      const toUnenroll = enrollments.filter(e => memberIds.has(e.student_id))
      await Promise.all(toUnenroll.map(e => unenrollStudent(supabase, e.id)))
      // Remove the cohort_classes link
      await removeCohortClass(supabase, cohortClassId)
      await Promise.all([loadClassCohorts(selected.id), loadEnrollments(selected.id)])
    } catch (e) {
      setError(e.message)
    }
  }

  // Cohorts not yet assigned to this class
  const assignedCohortIds  = new Set(classCohorts.map(cc => cc.cohort_id))
  const availableCohorts   = cohorts.filter(c =>
    !assignedCohortIds.has(c.id) &&
    (cohortSearch === '' ||
      c.name.toLowerCase().includes(cohortSearch.toLowerCase()) ||
      (c.division || '').toLowerCase().includes(cohortSearch.toLowerCase()))
  )

  // ── Students eligible to add: enrolled status, not already in this class
  const enrolledStudentIds = new Set(enrollments.map(e => e.student_id))
  const availableStudents  = students.filter(s =>
    !enrolledStudentIds.has(s.id) &&
    (enrollSearch === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      (s.grade || '').toLowerCase().includes(enrollSearch.toLowerCase()))
  )

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = classes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      (c.teacher_name || '').toLowerCase().includes(q) ||
      (c.subject || '').toLowerCase().includes(q)
    const matchDiv    = !filterDiv    || c.division === filterDiv
    const matchStatus = !filterStatus || c.status   === filterStatus
    return matchSearch && matchDiv && matchStatus
  })

  const stats = calcClassStats(classes)

  return {
    classes, filtered, staff, rooms, students, cohorts, loading, stats,
    divisions, subjects,
    selected, editing,
    form, setForm,
    saving, error, success,
    deleteId, setDeleteId,
    search, setSearch,
    filterDiv, setFilterDiv,
    filterStatus, setFilterStatus,
    openClass, closeClass,
    startAdd, startEdit, cancelEdit,
    selectTeacher, selectRoom,
    handleSave, handleDelete,
    // Individual enrollment
    enrollments, enrollSearch, setEnrollSearch,
    enrollSaving, availableStudents,
    handleEnroll, handleUnenroll,
    // Cohort assignment
    classCohorts, cohortSearch, setCohortSearch,
    availableCohorts, cohortEnrolling,
    handleAddCohort, handleRemoveCohort,
  }
}
