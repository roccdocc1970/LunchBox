/**
 * useStaff Hook
 *
 * Manages all state and behavior for the Staff module.
 * Coordinates between the domain (filtering, stats, role colors) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getStaff, createStaffMember, updateStaffMember, deleteStaffMember } from '../services/staff'
import {
  EMPTY_FORM,
  filterStaff,
  calcStaffStats,
  parseGradeAssignments,
} from '../domain/staff'
import { parseConfiguredGrades } from '../domain/admissions'
import { ALL_GRADES } from '../domain/enrollment'

export function useStaff(userId, school) {
  const configuredGrades = parseConfiguredGrades(school)
  const grades = configuredGrades || ALL_GRADES

  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // Filters
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDivision, setFilterDivision] = useState('')

  // Drawer
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editGrades, setEditGrades] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const data = await getStaff(supabase, userId)
    setStaff(data)
    setLoading(false)
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleGradeInForm = (grade) => {
    setForm(prev => {
      const has = prev.grade_assignments.includes(grade)
      return {
        ...prev,
        grade_assignments: has
          ? prev.grade_assignments.filter(g => g !== grade)
          : [...prev.grade_assignments, grade],
      }
    })
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await createStaffMember(supabase, userId, form)
      setForm({ ...EMPTY_FORM })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleForm = () => { setShowForm(f => !f); setError(null) }

  // ─── Drawer ────────────────────────────────────────────────────────────────

  const openProfile = (member) => {
    setSelected(member)
    setEditing(false)
    setDeleteConfirm(false)
    setError(null)
  }

  const closeProfile = () => {
    setSelected(null)
    setEditing(false)
    setDeleteConfirm(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditGrades(parseGradeAssignments(selected))
    setEditing(true)
    setDeleteConfirm(false)
  }

  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleGradeInEdit = (grade) => {
    setEditGrades(prev => {
      const has = prev.includes(grade)
      return has ? prev.filter(g => g !== grade) : [...prev, grade]
    })
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await updateStaffMember(supabase, selected.id, { editForm, editGrades })
      setSelected(data)
      setEditing(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await deleteStaffMember(supabase, selected.id)
      closeProfile()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  // ─── Filters ───────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('')
    setFilterRole('')
    setFilterStatus('')
    setFilterDivision('')
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filtered = filterStaff(staff, { search, filterRole, filterStatus, filterDivision }, school?.divisions)
  const stats = calcStaffStats(staff)

  return {
    // data
    staff, loading, filtered, stats,
    configuredGrades, grades,
    // form
    showForm, toggleForm,
    form, handleChange, toggleGradeInForm,
    saving, error, submit,
    // drawer
    selected, openProfile, closeProfile,
    editing, editForm, editGrades,
    startEdit, handleEditChange, toggleGradeInEdit,
    saveEdit, remove,
    deleteConfirm, setDeleteConfirm,
    // filters
    search, setSearch,
    filterRole, setFilterRole,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
  }
}
