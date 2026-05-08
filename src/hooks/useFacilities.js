/**
 * useFacilities Hook
 *
 * Manages all state and behavior for the Facilities module.
 * Coordinates between the domain (stats, filtering, validation) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getWorkOrders,
  getFacilitiesStaff,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
} from '../services/facilities'
import {
  BLANK_FORM,
  calcFacilitiesStats,
  filterWorkOrders,
} from '../domain/facilities'

export function useFacilities(userId) {
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState([])

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Drawer / edit
  const [selected, setSelected] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')

  useEffect(() => {
    load()
    loadStaff()
  }, [])

  const load = async () => {
    setLoading(true)
    const data = await getWorkOrders(supabase, userId)
    setWorkOrders(data)
    setLoading(false)
  }

  const loadStaff = async () => {
    const data = await getFacilitiesStaff(supabase, userId)
    setStaffList(data)
  }

  const submitWorkOrder = async () => {
    setFormError('')
    setSaving(true)
    try {
      await createWorkOrder(supabase, userId, form)
      setForm({ ...BLANK_FORM })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    const payload = await updateWorkOrder(supabase, selected.id, editForm)
    setSavingEdit(false)
    setEditMode(false)
    const updated = { ...selected, ...payload }
    setSelected(updated)
    setWorkOrders(prev => prev.map(w => w.id === selected.id ? updated : w))
  }

  const quickUpdateStatus = async (workOrderId, status) => {
    const patch = await updateWorkOrderStatus(supabase, workOrderId, status)
    const updated = { ...selected, ...patch }
    setSelected(updated)
    setEditForm(updated)
    setWorkOrders(prev => prev.map(w => w.id === workOrderId ? updated : w))
  }

  const openDrawer = (wo) => {
    setSelected(wo)
    setEditMode(false)
    setEditForm({ ...wo })
  }

  const closeDrawer = () => {
    setSelected(null)
    setEditMode(false)
  }

  const toggleForm = () => {
    setShowForm(f => !f)
    setFormError('')
  }

  const clearFilters = () => {
    setFilterStatus('All')
    setFilterCategory('All')
    setFilterPriority('All')
    setSearch('')
  }

  const filtered = filterWorkOrders(workOrders, { search, filterStatus, filterCategory, filterPriority })
  const stats = calcFacilitiesStats(workOrders)

  return {
    // data
    workOrders, loading, filtered, stats, staffList,
    // create form
    showForm, toggleForm, form, setForm, saving, formError, submitWorkOrder,
    // drawer
    selected, openDrawer, closeDrawer,
    editMode, setEditMode,
    editForm, setEditForm,
    savingEdit, saveEdit,
    quickUpdateStatus,
    // filters
    search, setSearch,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    filterPriority, setFilterPriority,
    clearFilters,
  }
}
