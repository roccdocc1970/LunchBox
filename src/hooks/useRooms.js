/**
 * useRooms Hook
 *
 * State and behavior for the Rooms module.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getRooms, saveRoom, deleteRoom } from '../services/rooms'
import { getBuildings } from '../services/buildings'
import { BLANK_ROOM, validateRoom, calcRoomStats, parseRoomDivisions } from '../domain/rooms'

export function useRooms(user, school) {
  const [rooms,       setRooms]       = useState([])
  const [buildings,   setBuildings]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)   // room open in drawer
  const [form,        setForm]        = useState({ ...BLANK_ROOM })
  const [editing,     setEditing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterType,  setFilterType]  = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [data, bldgs] = await Promise.all([
      getRooms(supabase, user.id),
      getBuildings(supabase, user.id),
    ])
    setRooms(data)
    setBuildings(bldgs)
    setLoading(false)
  }

  // ── Drawer ────────────────────────────────────────────────────────────────

  const openRoom = (room) => {
    setSelected(room)
    setEditing(false)
    setError(null)
    setDeleteId(null)
  }

  const closeRoom = () => {
    setSelected(null)
    setEditing(false)
    setError(null)
    setDeleteId(null)
  }

  const startAdd = () => {
    setForm({ ...BLANK_ROOM })
    setEditing(true)
    setSelected(null)
    setError(null)
  }

  const startEdit = (room) => {
    setForm({
      ...room,
      capacity:  room.capacity ?? '',
      divisions: parseRoomDivisions(room.divisions),
    })
    setEditing(true)
    setError(null)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    if (!selected) setForm({ ...BLANK_ROOM })
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const err = validateRoom(form)
    if (err) { setError(err); return }

    setSaving(true)
    setError(null)
    try {
      const saved = await saveRoom(supabase, user.id, selected ? { ...form, id: selected.id } : form)
      setSuccess(selected ? 'Room updated.' : 'Room added.')
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
      await deleteRoom(supabase, id)
      closeRoom()
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Division toggle (multi-select) ────────────────────────────────────────

  const toggleDivision = (divName) => {
    setForm(prev => {
      const current = prev.divisions || []
      return {
        ...prev,
        divisions: current.includes(divName)
          ? current.filter(d => d !== divName)
          : [...current, divName],
      }
    })
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.name.toLowerCase().includes(q) ||
      (r.building || '').toLowerCase().includes(q)
    const matchType = !filterType || r.type === filterType
    return matchSearch && matchType
  })

  const stats = calcRoomStats(rooms)

  return {
    rooms, buildings, filtered, loading, stats,
    selected, editing,
    form, setForm,
    saving, error, success,
    deleteId, setDeleteId,
    search, setSearch,
    filterType, setFilterType,
    openRoom, closeRoom,
    startAdd, startEdit, cancelEdit,
    handleSave, handleDelete,
    toggleDivision,
  }
}
