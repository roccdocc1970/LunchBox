/**
 * useParents Hook
 *
 * Manages all state and behavior for the Parents module.
 * Coordinates between the domain (divisions, initials) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getParents, updateParent } from '../services/parents'
import { parseDivisions, getDivision, sortGrades } from '../domain/school'
import { parseGrades, ALL_GRADES } from '../domain/enrollment'

export function useParents(userId, school) {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterDivision, setFilterDivision] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Derived from school config
  const parsedDivisions = parseDivisions(school?.divisions)
  const hasDivisions = parsedDivisions.some(d => d.grades?.length > 0)
  const divisionOptions = parsedDivisions.filter(d => d.grades?.length > 0).map(d => d.name)
  const configuredGrades = parseGrades(school)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getParents(supabase, userId)
      setParents(data)
    } catch {
      setParents([])
    } finally {
      setLoading(false)
    }
  }

  // Grade options: prefer school-configured grades, fall back to grades seen in parent data
  const allStudentGrades = sortGrades(
    [...new Set(parents.flatMap(p => (p.students || []).map(s => s.grade).filter(Boolean)))]
  )
  const gradeOptions = configuredGrades || allStudentGrades

  // Filtered list
  const filtered = parents.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.students || []).some(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q))

    const matchesGrade = !filterGrade ||
      (p.students || []).some(s => s.grade === filterGrade)

    const matchesDivision = !filterDivision ||
      (p.students || []).some(s => getDivision(s.grade, parsedDivisions)?.name === filterDivision)

    return matchesSearch && matchesGrade && matchesDivision
  })

  const clearFilters = () => {
    setSearch('')
    setFilterGrade('')
    setFilterDivision('')
  }

  const openDrawer = (parent) => {
    setSelected(parent)
    setEditing(false)
    setError(null)
  }

  const closeDrawer = () => {
    setSelected(null)
    setEditing(false)
    setError(null)
  }

  const startEdit = (parent) => {
    setEditForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      email: parent.email || '',
      phone: parent.phone || '',
      address: parent.address || '',
      notes: parent.notes || '',
    })
    setEditing(true)
    setError(null)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateParent(supabase, selected.id, editForm)
      setSelected(updated)
      setEditing(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return {
    // data
    parents,
    filtered,
    loading,
    parsedDivisions,
    hasDivisions,
    gradeOptions,
    divisionOptions,
    // filters
    search, setSearch,
    filterGrade, setFilterGrade,
    filterDivision, setFilterDivision,
    clearFilters,
    // drawer
    selected, openDrawer, closeDrawer,
    editing, setEditing,
    editForm, setEditForm,
    saving, error,
    // actions
    startEdit,
    saveEdit,
  }
}
