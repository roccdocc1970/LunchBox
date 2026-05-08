/**
 * useReportCards Hook
 *
 * Manages all state and behavior for the Report Cards module.
 * Coordinates between the domain (terms, subjects, filtering) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getReportCards,
  getEnrolledStudents,
  createReportCard,
  setReportCardPublished,
  deleteReportCard,
} from '../services/reportCards'
import { getAcademicYear } from '../services/enrollment'
import {
  getTerms,
  buildGradeOptions,
  parseSubjects,
  filterReportCards,
  calcReportCardStats,
} from '../domain/reportCards'

export function useReportCards(userId, school) {
  const terms = getTerms(school?.grading_period)
  const gradeOptions = buildGradeOptions(school?.grading_scale)
  const subjects = parseSubjects(school?.subjects_offered)

  const makeEmptyForm = () => ({
    student_id: '',
    student_name: '',
    student_grade: '',
    academic_year: school?.academic_year || getAcademicYear(),
    term: terms[0],
    grades: subjects.map(s => ({ subject: s, grade: '', comment: '' })),
    teacher_notes: '',
  })

  const [reportCards, setReportCards] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(makeEmptyForm())

  // Filters
  const [search, setSearch] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDivision, setFilterDivision] = useState('')

  useEffect(() => {
    load()
    loadStudents()
  }, [])

  const load = async () => {
    setLoading(true)
    const data = await getReportCards(supabase, userId)
    setReportCards(data)
    setLoading(false)
  }

  const loadStudents = async () => {
    const data = await getEnrolledStudents(supabase, userId)
    setStudents(data)
  }

  const handleStudentSelect = (studentId) => {
    const s = students.find(st => st.id === studentId)
    setForm(prev => ({
      ...prev,
      student_id: studentId,
      student_name: s ? `${s.first_name} ${s.last_name}` : '',
      student_grade: s?.grade || '',
    }))
  }

  const handleGradeChange = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.grades]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, grades: updated }
    })
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await createReportCard(supabase, userId, form)
      setForm(makeEmptyForm())
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (rc) => {
    const next = !rc.published
    await setReportCardPublished(supabase, rc.id, next)
    setSelected(prev => prev ? { ...prev, published: next } : null)
    setReportCards(prev => prev.map(r => r.id === rc.id ? { ...r, published: next } : r))
  }

  const remove = async (id) => {
    await deleteReportCard(supabase, id)
    setSelected(null)
    load()
  }

  const openForm = () => {
    setShowForm(true)
    setError(null)
    setForm(makeEmptyForm())
  }

  const closeForm = () => {
    setShowForm(false)
    setError(null)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterTerm('')
    setFilterStatus('')
    setFilterDivision('')
  }

  const filtered = filterReportCards(
    reportCards,
    { search, filterTerm, filterStatus, filterDivision },
    school?.divisions
  )
  const stats = calcReportCardStats(reportCards)

  return {
    // data
    reportCards, students, loading, filtered, stats,
    // form
    showForm, openForm, closeForm,
    form, setForm, saving, error,
    handleStudentSelect, handleGradeChange, submit,
    // drawer
    selected, setSelected,
    togglePublished, remove,
    // filters
    search, setSearch,
    filterTerm, setFilterTerm,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
    // derived config
    terms, gradeOptions, subjects,
  }
}
