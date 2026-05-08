/**
 * useSchedule Hook
 *
 * Bell schedule state + behavior for the Settings tab.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getPeriods, savePeriod, deletePeriod } from '../services/schedule'
import { BLANK_PERIOD, validatePeriod, sortPeriods } from '../domain/schedule'

export function useSchedule(schoolId) {
  const [periods,      setPeriods]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [form,         setForm]         = useState({ ...BLANK_PERIOD })
  const [editingId,    setEditingId]    = useState(null)   // null = add mode, uuid = edit mode
  const [showForm,     setShowForm]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [deleteId,     setDeleteId]     = useState(null)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(null)

  useEffect(() => { load() }, [schoolId])

  const load = async () => {
    setLoading(true)
    const data = await getPeriods(supabase, schoolId)
    setPeriods(sortPeriods(data))
    setLoading(false)
  }

  const openAdd = () => {
    setForm({ ...BLANK_PERIOD, sort_order: periods.length })
    setEditingId(null)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (period) => {
    setForm({ ...period })
    setEditingId(period.id)
    setError(null)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError(null)
    setForm({ ...BLANK_PERIOD })
  }

  const handleSave = async () => {
    const err = validatePeriod(form)
    if (err) { setError(err); return }

    setSaving(true)
    setError(null)
    try {
      await savePeriod(supabase, schoolId, editingId ? { ...form, id: editingId } : form)
      setSuccess(editingId ? 'Period updated.' : 'Period added.')
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
      await deletePeriod(supabase, id)
      setDeleteId(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return {
    periods, loading,
    form, setForm,
    editingId,
    showForm,
    saving,
    deleteId, setDeleteId,
    error, success,
    openAdd, openEdit, cancelForm, handleSave, handleDelete,
  }
}
