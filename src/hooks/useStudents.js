/**
 * useStudents Hook
 *
 * Manages all state and behavior for the Students module.
 * Coordinates between domain (logic) and services (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getStudents,
  updateStudent,
  deleteStudent,
  graduateStudentToAlumni,
  getGradeHistory,
  getReportCardCount,
  getStudentHealth,
  saveHealthProfile,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  deleteHealthProfile,
  getIncidents,
  logIncident,
  updateIncident,
  resolveIncident,
  searchStaff,
} from '../services/students'
import { searchParents } from '../services/enrollment'
import { parseGrades } from '../domain/enrollment'
import {
  BLANK_INCIDENT,
  BLANK_HEALTH_ENTRY,
  BLANK_HEALTH_PROFILE,
  filterStudents,
  getGradeOptions,
  calcStudentStats,
} from '../domain/students'

export function useStudents(user, school) {
  const configuredGrades = parseGrades(school)

  // ─── Roster ─────────────────────────────────────────────────────────────────
  const [students,        setStudents]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [filterGrade,     setFilterGrade]     = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterDivision,  setFilterDivision]  = useState('')

  // ─── Profile drawer ──────────────────────────────────────────────────────────
  const [selected,        setSelected]        = useState(null)
  const [gradeHistory,    setGradeHistory]    = useState([])
  const [reportCardCount, setReportCardCount] = useState(0)
  const [editing,         setEditing]         = useState(false)
  const [editForm,        setEditForm]        = useState({})
  const [editParent,      setEditParent]      = useState(null)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState(null)
  const [repeatGrade,     setRepeatGrade]     = useState(false)
  const [skipGrade,       setSkipGrade]       = useState(false)
  const [deleteConfirm,   setDeleteConfirm]   = useState(false)
  const [graduateConfirm, setGraduateConfirm] = useState(false)
  const [graduateForm,    setGraduateForm]    = useState({ graduation_year: new Date().getFullYear(), grade_completed: '' })
  const [graduating,      setGraduating]      = useState(false)

  // ─── Parent change ──────────────────────────────────────────────────────────
  const [changingParent,       setChangingParent]       = useState(false)
  const [parentChangeSearch,   setParentChangeSearch]   = useState('')
  const [parentChangeResults,  setParentChangeResults]  = useState([])

  // ─── Incidents ──────────────────────────────────────────────────────────────
  const [incidents,       setIncidents]       = useState([])
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [incidentForm,    setIncidentForm]    = useState(BLANK_INCIDENT())
  const [savingIncident,  setSavingIncident]  = useState(false)
  const [editingIncident, setEditingIncident] = useState(null)
  const [incidentEditForm, setIncidentEditForm] = useState({})
  const [staffSearch,     setStaffSearch]     = useState('')
  const [staffResults,    setStaffResults]    = useState([])
  const [editStaffSearch,  setEditStaffSearch]  = useState('')
  const [editStaffResults, setEditStaffResults] = useState([])

  // ─── Health ─────────────────────────────────────────────────────────────────
  const [healthProfile,        setHealthProfile]        = useState(null)
  const [healthEntries,        setHealthEntries]        = useState([])
  const [showHealthEntryForm,  setShowHealthEntryForm]  = useState(false)
  const [healthEntryForm,      setHealthEntryForm]      = useState({ ...BLANK_HEALTH_ENTRY })
  const [savingHealthEntry,    setSavingHealthEntry]    = useState(false)
  const [showHealthProfileEdit, setShowHealthProfileEdit] = useState(false)
  const [healthProfileForm,    setHealthProfileForm]    = useState({ ...BLANK_HEALTH_PROFILE })
  const [savingHealthProfile,  setSavingHealthProfile]  = useState(false)
  const [editingHealthEntry,   setEditingHealthEntry]   = useState(null)
  const [healthEntryEditForm,  setHealthEntryEditForm]  = useState({ ...BLANK_HEALTH_ENTRY })
  const [savingHealthEntryEdit, setSavingHealthEntryEdit] = useState(false)

  useEffect(() => { fetchStudents() }, [])

  // ─── Loaders ─────────────────────────────────────────────────────────────────

  const fetchStudents = async () => {
    setLoading(true)
    const data = await getStudents(supabase, user.id)
    setStudents(data)
    setLoading(false)
  }

  const fetchGradeHistory = async (studentId) => {
    const data = await getGradeHistory(supabase, studentId)
    setGradeHistory(data)
  }

  const fetchReportCardCount = async (studentId) => {
    const count = await getReportCardCount(supabase, studentId)
    setReportCardCount(count)
  }

  const fetchIncidents = async (studentId) => {
    const data = await getIncidents(supabase, studentId)
    setIncidents(data)
  }

  const fetchHealth = async (studentId) => {
    const { profile, entries } = await getStudentHealth(supabase, studentId)
    setHealthProfile(profile)
    setHealthEntries(entries)
  }

  // ─── Profile drawer ──────────────────────────────────────────────────────────

  const openProfile = (student) => {
    setSelected(student)
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setError(null)
    fetchGradeHistory(student.id)
    fetchReportCardCount(student.id)
    fetchIncidents(student.id)
    fetchHealth(student.id)
  }

  const closeProfile = () => {
    setSelected(null)
    setGradeHistory([])
    setEditing(false)
    setDeleteConfirm(false)
    setGraduateConfirm(false)
    setChangingParent(false)
    setParentChangeSearch('')
    setParentChangeResults([])
    setIncidents([])
    setShowIncidentForm(false)
    setIncidentForm(BLANK_INCIDENT())
    setStaffSearch('')
    setStaffResults([])
    setError(null)
    setHealthProfile(null)
    setHealthEntries([])
    setShowHealthEntryForm(false)
    setShowHealthProfileEdit(false)
    setHealthEntryForm({ ...BLANK_HEALTH_ENTRY })
    setHealthProfileForm({ ...BLANK_HEALTH_PROFILE })
    setEditingHealthEntry(null)
    setHealthEntryEditForm({ ...BLANK_HEALTH_ENTRY })
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditParent(selected.parents || null)
    setEditing(true)
    setRepeatGrade(false)
    setSkipGrade(false)
    setChangingParent(false)
    setDeleteConfirm(false)
  }

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await updateStudent(supabase, user.id, selected.id, {
        editForm,
        currentGrade: selected.grade,
        repeatGrade,
        skipGrade,
      })
      fetchGradeHistory(selected.id)
      setRepeatGrade(false)
      setSkipGrade(false)
      setSelected(data)
      setEditing(false)
      fetchStudents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent(supabase, selected.id)
      closeProfile()
      fetchStudents()
    } catch (err) {
      setError(err.message)
    }
  }

  const graduateToAlumni = async () => {
    setGraduating(true)
    setError(null)
    try {
      await graduateStudentToAlumni(supabase, user.id, selected, {
        graduationYear: graduateForm.graduation_year,
        gradeCompleted: graduateForm.grade_completed,
      })
      closeProfile()
      fetchStudents()
    } catch (err) {
      setError(err.message)
    } finally {
      setGraduating(false)
    }
  }

  // ─── Parent change ──────────────────────────────────────────────────────────

  const searchParentChange = async (q) => {
    setParentChangeSearch(q)
    const data = await searchParents(supabase, user.id, q)
    setParentChangeResults(data)
  }

  const selectParentChange = (p) => {
    setEditForm(prev => ({ ...prev, parent_id: p.id }))
    setEditParent(p)
    setChangingParent(false)
    setParentChangeSearch('')
    setParentChangeResults([])
  }

  // ─── Incidents ──────────────────────────────────────────────────────────────

  const submitIncident = async () => {
    if (!incidentForm.description) return
    setSavingIncident(true)
    try {
      await logIncident(supabase, user.id, {
        ...incidentForm,
        studentId: selected.id,
        studentName: `${selected.first_name} ${selected.last_name}`,
        studentGrade: selected.grade || null,
      })
      setShowIncidentForm(false)
      setIncidentForm(BLANK_INCIDENT())
      fetchIncidents(selected.id)
    } finally {
      setSavingIncident(false)
    }
  }

  const handleStaffSearch = async (q) => {
    setStaffSearch(q)
    const data = await searchStaff(supabase, user.id, q)
    setStaffResults(data)
  }

  const handleEditStaffSearch = async (q) => {
    setEditStaffSearch(q)
    const data = await searchStaff(supabase, user.id, q)
    setEditStaffResults(data)
  }

  const handleResolveIncident = async (incidentId) => {
    await resolveIncident(supabase, incidentId)
    fetchIncidents(selected.id)
  }

  const saveIncidentEdit = async () => {
    setSavingIncident(true)
    await updateIncident(supabase, editingIncident, incidentEditForm)
    setEditingIncident(null)
    setIncidentEditForm({})
    setSavingIncident(false)
    fetchIncidents(selected.id)
  }

  const cancelIncidentEdit = () => {
    setEditingIncident(null)
    setIncidentEditForm({})
    setEditStaffSearch('')
    setEditStaffResults([])
  }

  // ─── Health ─────────────────────────────────────────────────────────────────

  const handleSaveHealthProfile = async () => {
    setSavingHealthProfile(true)
    await saveHealthProfile(supabase, selected.id, user.id, {
      existingProfileId: healthProfile?.id,
      profileData: healthProfileForm,
    })
    setSavingHealthProfile(false)
    setShowHealthProfileEdit(false)
    fetchHealth(selected.id)
  }

  const handleDeleteHealthProfile = async () => {
    await deleteHealthProfile(supabase, healthProfile.id)
    setShowHealthProfileEdit(false)
    fetchHealth(selected.id)
  }

  const saveHealthEntry = async () => {
    if (!healthEntryForm.name.trim()) return
    setSavingHealthEntry(true)
    await addHealthEntry(supabase, selected.id, user.id, healthEntryForm)
    setSavingHealthEntry(false)
    setShowHealthEntryForm(false)
    setHealthEntryForm({ ...BLANK_HEALTH_ENTRY })
    fetchHealth(selected.id)
  }

  const handleDeleteHealthEntry = async (entryId) => {
    await deleteHealthEntry(supabase, entryId)
    fetchHealth(selected.id)
  }

  const handleUpdateHealthEntry = async () => {
    setSavingHealthEntryEdit(true)
    await updateHealthEntry(supabase, editingHealthEntry, healthEntryEditForm)
    setSavingHealthEntryEdit(false)
    setEditingHealthEntry(null)
    fetchHealth(selected.id)
  }

  const openHealthEntryEdit = (entry) => {
    setEditingHealthEntry(entry.id)
    setHealthEntryEditForm({
      category: entry.category,
      name: entry.name,
      detail: entry.detail || '',
      date: entry.date || '',
      expiration_date: entry.expiration_date || '',
      notes: entry.notes || '',
    })
  }

  const toggleHealthProfileEdit = () => {
    setShowHealthProfileEdit(v => !v)
    setHealthProfileForm({ ...BLANK_HEALTH_PROFILE, ...healthProfile })
  }

  // ─── Filter & clear ──────────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('')
    setFilterGrade('')
    setFilterStatus('')
    setFilterDivision('')
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const filtered    = filterStudents(students, { search, filterGrade, filterStatus, filterDivision }, school?.divisions)
  const gradeOptions = getGradeOptions(students)
  const stats        = calcStudentStats(students)
  const hasFilters   = !!(search || filterGrade || filterStatus || filterDivision)

  return {
    // config
    configuredGrades,
    // roster
    students, loading, filtered, gradeOptions, stats, hasFilters,
    search, setSearch,
    filterGrade, setFilterGrade,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
    // profile drawer
    selected, openProfile, closeProfile,
    gradeHistory, reportCardCount,
    editing, setEditing,
    editForm, setEditForm, handleEditChange,
    editParent, setEditParent,
    saving, error,
    repeatGrade, setRepeatGrade,
    skipGrade, setSkipGrade,
    saveEdit, startEdit,
    deleteConfirm, setDeleteConfirm,
    handleDeleteStudent,
    graduateConfirm, setGraduateConfirm,
    graduateForm, setGraduateForm,
    graduating, graduateToAlumni,
    // parent change
    changingParent, setChangingParent,
    parentChangeSearch, parentChangeResults,
    searchParentChange, selectParentChange,
    // incidents
    incidents,
    showIncidentForm, setShowIncidentForm,
    incidentForm, setIncidentForm,
    savingIncident,
    editingIncident, setEditingIncident,
    incidentEditForm, setIncidentEditForm,
    submitIncident,
    handleStaffSearch, staffSearch, staffResults, setStaffSearch, setStaffResults,
    handleEditStaffSearch, editStaffSearch, editStaffResults,
    handleResolveIncident,
    saveIncidentEdit, cancelIncidentEdit,
    // health
    healthProfile, healthEntries,
    showHealthEntryForm, setShowHealthEntryForm,
    healthEntryForm, setHealthEntryForm,
    savingHealthEntry, saveHealthEntry,
    showHealthProfileEdit, toggleHealthProfileEdit,
    healthProfileForm, setHealthProfileForm,
    savingHealthProfile, handleSaveHealthProfile, handleDeleteHealthProfile,
    editingHealthEntry, setEditingHealthEntry,
    healthEntryEditForm, setHealthEntryEditForm,
    savingHealthEntryEdit, handleUpdateHealthEntry, openHealthEntryEdit,
    handleDeleteHealthEntry,
  }
}
