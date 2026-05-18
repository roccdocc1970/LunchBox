/**
 * useCohorts Hook
 *
 * State and behavior for the Cohorts module.
 * Coordinates cohort CRUD, member management, class assignment, and bulk enrollment.
 */

import { useState, useEffect } from 'react'
import { supabase }            from '../supabase'
import { getStudents }         from '../services/enrollment'
import { getAcademicYear }     from '../services/enrollment'
import {
  getCohorts,
  saveCohort,
  deleteCohort,
  getCohortStudents,
  addCohortStudent,
  removeCohortStudent,
  getCohortClasses,
} from '../services/cohorts'
import { BLANK_COHORT, validateCohort, calcCohortStats } from '../domain/cohorts'
import { parseDivisions }      from '../domain/school'

export function useCohorts(user, school) {
  const currentYear = getAcademicYear()

  // ── Core lists ──────────────────────────────────────────────────────────────
  const [cohorts,   setCohorts]   = useState([])
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)

  // ── Selected cohort + tabs ──────────────────────────────────────────────────
  const [selected,     setSelected]     = useState(null)
  const [activeTab,    setActiveTab]    = useState('members') // 'members' | 'classes'
  const [editing,      setEditing]      = useState(false)
  const [form,         setForm]         = useState({ ...BLANK_COHORT })

  // ── Cohort detail data ──────────────────────────────────────────────────────
  const [members,       setMembers]       = useState([])  // cohort_students rows
  const [cohortClasses, setCohortClasses] = useState([])  // read-only: classes this cohort is assigned to

  // ── Search/filter ───────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Active')

  // ── Status ──────────────────────────────────────────────────────────────────
  const [saving,   setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  // Derived from school config
  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selected) {
      loadMembers(selected.id)
      loadCohortClasses(selected.id)
    } else {
      setMembers([])
      setCohortClasses([])
    }
    setMemberSearch('')
  }, [selected?.id])

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true)
    const [coh, stu] = await Promise.all([
      getCohorts(supabase, user.id),
      getStudents(supabase, user.id),
    ])
    setCohorts(coh)
    setStudents(stu.filter(s => s.status === 'Enrolled'))
    setLoading(false)
  }

  const loadMembers = async (cohortId) => {
    const data = await getCohortStudents(supabase, cohortId)
    setMembers(data)
  }

  const loadCohortClasses = async (cohortId) => {
    const data = await getCohortClasses(supabase, cohortId)
    setCohortClasses(data)
  }

  // ── Detail panel ─────────────────────────────────────────────────────────────

  const openCohort = (cohort) => {
    setSelected(cohort)
    setEditing(false)
    setError(null)
    setDeleteId(null)
    setActiveTab('members')
  }

  const closeCohort = () => {
    setSelected(null)
    setEditing(false)
    setError(null)
    setDeleteId(null)
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  const startAdd = () => {
    setForm({ ...BLANK_COHORT, academic_year: currentYear })
    setEditing(true)
    setSelected(null)
    setError(null)
  }

  const startEdit = (cohort) => {
    setForm({ ...cohort })
    setEditing(true)
    setError(null)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    if (!selected) setForm({ ...BLANK_COHORT })
  }

  const handleSave = async () => {
    const err = validateCohort(form)
    if (err) { setError(err); return }

    setSaving(true)
    setError(null)
    try {
      const saved = await saveCohort(
        supabase,
        user.id,
        selected ? { ...form, id: selected.id } : form,
      )
      setSuccess(selected ? 'Cohort updated.' : 'Cohort created.')
      setTimeout(() => setSuccess(null), 2500)
      setEditing(false)
      setSelected(saved)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCohort(supabase, id)
      closeCohort()
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Member management ─────────────────────────────────────────────────────────

  const handleAddMember = async (studentId) => {
    if (!selected) return
    try {
      await addCohortStudent(supabase, user.id, selected.id, studentId)
      await loadMembers(selected.id)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRemoveMember = async (memberRowId) => {
    if (!selected) return
    try {
      await removeCohortStudent(supabase, memberRowId)
      await loadMembers(selected.id)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const memberStudentIds = new Set(members.map(m => m.student_id))

  const availableStudents = students.filter(s =>
    !memberStudentIds.has(s.id) &&
    (memberSearch === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (s.grade || '').toLowerCase().includes(memberSearch.toLowerCase()))
  )

  const filtered = cohorts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      (c.division || '').toLowerCase().includes(q) ||
      (c.academic_year || '').toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = selected ? calcCohortStats(members, cohortClasses) : null

  return {
    // Data
    cohorts, filtered, students, loading,
    divisions,
    // Selected cohort
    selected, activeTab, setActiveTab,
    editing, form, setForm,
    saving, deleteId, setDeleteId,
    error, success,
    // Members
    members, memberSearch, setMemberSearch, availableStudents,
    handleAddMember, handleRemoveMember,
    // Classes (read-only)
    cohortClasses,
    // Search / filter
    search, setSearch, filterStatus, setFilterStatus,
    // Stats
    stats,
    // Actions
    openCohort, closeCohort,
    startAdd, startEdit, cancelEdit,
    handleSave, handleDelete,
  }
}
