/**
 * useAlumni Hook
 *
 * Manages all state and behavior for the Alumni module.
 * Coordinates between the domain (stats, filtering) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getAlumni,
  updateAlumnus,
  deleteAlumnus,
  reenrollAsStudent,
  getAlumnusGivingHistory,
  getAlumnusGradeHistory,
} from '../services/alumni'
import {
  filterAlumni,
  calcAlumniStats,
  getGraduationYears,
  buildAlumnusPayload,
} from '../domain/alumni'
import { parseConfiguredGrades } from '../domain/admissions'
import { ALL_GRADES } from '../domain/enrollment'

export function useAlumni(userId, school) {
  const configuredGrades = parseConfiguredGrades(school)
  const grades = configuredGrades || ALL_GRADES

  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDonor, setFilterDonor] = useState('')
  const [filterRelationship, setFilterRelationship] = useState('')

  // Drawer
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [reenrollConfirm, setReenrollConfirm] = useState(false)
  const [reenrolling, setReenrolling] = useState(false)
  const [gradeHistory, setGradeHistory] = useState([])
  const [givingHistory, setGivingHistory] = useState([])

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const data = await getAlumni(supabase, userId)
    setAlumni(data)
    setLoading(false)
  }

  // ─── Drawer ────────────────────────────────────────────────────────────────

  const openProfile = (alumnus) => {
    setSelected(alumnus)
    setEditing(false)
    setDeleteConfirm(false)
    setReenrollConfirm(false)
    setError(null)
    setGivingHistory([])
    getAlumnusGradeHistory(supabase, alumnus.original_student_id).then(setGradeHistory)
    getAlumnusGivingHistory(supabase, alumnus.id).then(setGivingHistory)
  }

  const closeProfile = () => {
    setSelected(null)
    setGradeHistory([])
    setGivingHistory([])
    setEditing(false)
    setDeleteConfirm(false)
    setReenrollConfirm(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected, opt_in: selected.opt_in ? 'true' : 'false' })
    setEditing(true)
    setDeleteConfirm(false)
  }

  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = buildAlumnusPayload(editForm)
      const data = await updateAlumnus(supabase, selected.id, payload)
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
      await deleteAlumnus(supabase, selected.id)
      closeProfile()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const reenroll = async () => {
    setReenrolling(true)
    setError(null)
    try {
      await reenrollAsStudent(supabase, userId, selected)
      closeProfile()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setReenrolling(false)
    }
  }

  // ─── Filters ───────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('')
    setFilterYear('')
    setFilterDonor('')
    setFilterRelationship('')
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filtered = filterAlumni(alumni, { search, filterYear, filterDonor, filterRelationship })
  const stats = calcAlumniStats(alumni)
  const graduationYears = getGraduationYears(alumni)

  return {
    // data
    alumni, loading, filtered, stats, graduationYears,
    configuredGrades, grades,
    // drawer
    selected, openProfile, closeProfile,
    editing, editForm, setEditForm, handleEditChange,
    startEdit, saving, saveEdit,
    deleteConfirm, setDeleteConfirm, remove,
    reenrollConfirm, setReenrollConfirm, reenrolling, reenroll,
    gradeHistory, givingHistory,
    error,
    // filters
    search, setSearch,
    filterYear, setFilterYear,
    filterDonor, setFilterDonor,
    filterRelationship, setFilterRelationship,
    clearFilters,
  }
}
