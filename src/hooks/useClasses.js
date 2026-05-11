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
import { BLANK_CLASS, validateClass, calcClassStats } from '../domain/classes'
import { parseDivisions } from '../domain/school'

export function useClasses(user, school) {
  const [classes,      setClasses]      = useState([])
  const [staff,        setStaff]        = useState([])
  const [rooms,        setRooms]        = useState([])
  const [students,     setStudents]     = useState([])
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

  // Enrollment state
  const [enrollments,    setEnrollments]    = useState([])
  const [enrollSearch,   setEnrollSearch]   = useState('')
  const [enrollSaving,   setEnrollSaving]   = useState(false)

  // Derived from school config
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
  const subjects  = Array.isArray(school?.subjects_offered) ? school.subjects_offered : []

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selected) loadEnrollments(selected.id)
    else setEnrollments([])
    setEnrollSearch('')
  }, [selected?.id])

  const load = async () => {
    setLoading(true)
    const [cls, st, rm, stu] = await Promise.all([
      getClasses(supabase, user.id),
      getStaff(supabase, user.id),
      getRooms(supabase, user.id),
      getStudents(supabase, user.id),
    ])
    setClasses(cls)
    setStaff(st.filter(s => s.status === 'Active'))
    setRooms(rm)
    setStudents(stu.filter(s => s.status === 'Enrolled'))
    setLoading(false)
  }

  const loadEnrollments = async (classId) => {
    const data = await getEnrollments(supabase, user.id, classId)
    setEnrollments(data)
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

  // Students eligible to add: enrolled status, not already in this class
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
    classes, filtered, staff, rooms, students, loading, stats,
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
    // Enrollment
    enrollments, enrollSearch, setEnrollSearch,
    enrollSaving, availableStudents,
    handleEnroll, handleUnenroll,
  }
}
