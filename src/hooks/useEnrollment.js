/**
 * useEnrollment Hook
 *
 * Manages all state and behavior for the Enrollment module.
 * Coordinates between the domain (grade parsing) and service (DB calls).
 * The Enrollment component imports this and renders whatever it returns.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getStudents,
  searchParents,
  enrollStudent,
  updateStudentStatus,
} from '../services/enrollment'
import { parseGrades, ALL_GRADES } from '../domain/enrollment'

const BLANK_PARENT = { first_name: '', last_name: '', email: '', phone: '', address: '' }
const BLANK_STUDENT = { first_name: '', last_name: '', grade: '', date_of_birth: '', notes: '' }

export function useEnrollment(userId, school) {
  const configuredGrades = parseGrades(school)
  const grades = configuredGrades || ALL_GRADES

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState([])
  const [selectedParent, setSelectedParent] = useState(null)
  const [parentForm, setParentForm] = useState({ ...BLANK_PARENT })
  const [studentForm, setStudentForm] = useState({ ...BLANK_STUDENT })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const data = await getStudents(supabase, userId)
    setStudents(data)
    setLoading(false)
  }

  const handleParentSearch = async (q) => {
    setParentSearch(q)
    const results = await searchParents(supabase, userId, q)
    setParentResults(results)
  }

  const resetForm = () => {
    setParentSearch('')
    setParentResults([])
    setSelectedParent(null)
    setParentForm({ ...BLANK_PARENT })
    setStudentForm({ ...BLANK_STUDENT })
    setError(null)
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await enrollStudent(supabase, userId, {
        parentId: selectedParent?.id,
        parentData: parentForm,
        studentData: studentForm,
      })
      resetForm()
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id, status) => {
    await updateStudentStatus(supabase, id, status)
    load()
  }

  const toggleForm = () => {
    if (showForm) resetForm()
    setShowForm(f => !f)
  }

  return {
    // data
    students,
    loading,
    grades,
    configuredGrades,
    // form state
    showForm,
    toggleForm,
    saving,
    error,
    // parent search
    parentSearch,
    parentResults,
    selectedParent,
    setSelectedParent,
    setParentSearch,
    setParentResults,
    parentForm,
    setParentForm,
    // student form
    studentForm,
    setStudentForm,
    // actions
    submit,
    updateStatus,
    handleParentSearch,
  }
}
