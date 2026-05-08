/**
 * useBuildings Hook
 *
 * State and behavior for the Campus / Buildings settings tab.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getBuildings, saveBuilding, deleteBuilding } from '../services/buildings'
import { BLANK_BUILDING, validateBuilding, parseFloors } from '../domain/buildings'

export function useBuildings(schoolId) {
  const [buildings,   setBuildings]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expandedId,  setExpandedId]  = useState(null)  // which building is expanded
  const [form,        setForm]        = useState({ ...BLANK_BUILDING })
  const [editingId,   setEditingId]   = useState(null)  // null = add mode
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(null)
  // Floor editor state
  const [newFloor,    setNewFloor]    = useState('')

  useEffect(() => { load() }, [schoolId])

  const load = async () => {
    setLoading(true)
    const data = await getBuildings(supabase, schoolId)
    setBuildings(data)
    setLoading(false)
  }

  // ── Building form ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({ ...BLANK_BUILDING })
    setEditingId(null)
    setError(null)
    setShowForm(true)
    setExpandedId(null)
  }

  const openEdit = (building) => {
    setForm({ ...building, floors: parseFloors(building.floors) })
    setEditingId(building.id)
    setError(null)
    setShowForm(true)
    setExpandedId(null)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError(null)
    setForm({ ...BLANK_BUILDING })
    setNewFloor('')
  }

  const handleSave = async () => {
    const err = validateBuilding(form)
    if (err) { setError(err); return }

    setSaving(true)
    setError(null)
    try {
      await saveBuilding(supabase, schoolId, editingId ? { ...form, id: editingId } : form)
      setSuccess(editingId ? 'Building updated.' : 'Building added.')
      setTimeout(() => setSuccess(null), 2500)
      cancelForm()
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteBuilding(supabase, id)
      setDeleteId(null)
      if (expandedId === id) setExpandedId(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Floor management (within the form) ───────────────────────────────────

  const addFloor = () => {
    const name = newFloor.trim()
    if (!name || form.floors.includes(name)) return
    setForm(prev => ({ ...prev, floors: [...prev.floors, name] }))
    setNewFloor('')
  }

  const removeFloor = (floor) => {
    setForm(prev => ({ ...prev, floors: prev.floors.filter(f => f !== floor) }))
  }

  const moveFloor = (floor, dir) => {
    setForm(prev => {
      const floors = [...prev.floors]
      const i = floors.indexOf(floor)
      const j = i + dir
      if (j < 0 || j >= floors.length) return prev
      ;[floors[i], floors[j]] = [floors[j], floors[i]]
      return { ...prev, floors }
    })
  }

  return {
    buildings, loading,
    expandedId, setExpandedId,
    form, setForm,
    editingId, showForm,
    saving, error, success,
    deleteId, setDeleteId,
    newFloor, setNewFloor,
    openAdd, openEdit, cancelForm, handleSave, handleDelete,
    addFloor, removeFloor, moveFloor,
  }
}
