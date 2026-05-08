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
import { BLANK_CLASS, validateClass, calcClassStats } from '../domain/classes'
import { parseDivisions } from '../domain/school'

export function useClasses(user, school) {
  const [classes,      setClasses]      = useState([])
  const [staff,        setStaff]        = useState([])
  const [rooms,        setRooms]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)   // class open in detail
  const [editing,      setEditing]      = useState(false)
  const [form,         setForm]         = useState({ ...BLANK_CLASS })
  const [saving,       setSaving]       = useState(false)
  const [deleteId,     setDeleteId]     = useState(null)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterDiv,    setFilterDiv]    = useState('')
  const [filterStatus, setFilterStatus] = useState('Active')

  // Derived from school config
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
  const subjects  = Array.isArray(school?.subjects_offered) ? school.subjects_offered : []

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [cls, st, rm] = await Promise.all([
      getClasses(supabase, user.id),
      getStaff(supabase, user.id),
      getRooms(supabase, user.id),
    ])
    setClasses(cls)
    setStaff(st.filter(s => s.status === 'Active'))
    setRooms(rm)
    setLoading(false)
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

  // ── Teacher helper — keeps teacher_name in sync with teacher_id ───────────

  const selectTeacher = (teacherId) => {
    const member = staff.find(s => s.id === teacherId)
    setForm(prev => ({
      ...prev,
      teacher_id:   teacherId,
      teacher_name: member ? `${member.first_name} ${member.last_name}` : '',
    }))
  }

  // ── Room helper — keeps room_name in sync with room_id ───────────────────

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
    classes, filtered, staff, rooms, loading, stats,
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
  }
}
