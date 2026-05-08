/**
 * useSettings Hook
 *
 * Manages all state and behavior for the Settings module.
 * Coordinates between the domain (parsing, validation, serialization) and Supabase.
 */

import { useState } from 'react'
import { supabase } from '../supabase'
import {
  parseGradesOffered,
  parseSubjectsForEdit,
  parseDivisionsForEdit,
  serializeSubjects,
  validateProfile,
} from '../domain/settings'

export function useSettings(user, school, onUpdate) {
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const [profile, setProfile] = useState({
    name: school?.name || '',
    principal_name: school?.principal_name || '',
    phone: school?.phone || '',
    address: school?.address || '',
    city: school?.city || '',
    state: school?.state || '',
    zip: school?.zip || '',
    website: school?.website || '',
    school_type: school?.school_type || 'Private',
    student_capacity: school?.student_capacity || '',
  })

  const [academic, setAcademic] = useState({
    grades_offered: parseGradesOffered(school?.grades_offered),
    academic_year: school?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    school_year_start: school?.school_year_start || 'September',
    school_year_end: school?.school_year_end || 'June',
    grading_period: school?.grading_period || 'Quarters',
    default_enrollment_status: school?.default_enrollment_status || 'Applied',
    grading_scale: school?.grading_scale || 'Letter',
    subjects_offered: parseSubjectsForEdit(school?.subjects_offered),
    divisions: parseDivisionsForEdit(school?.divisions),
  })

  const [communication, setCommunication] = useState({
    reply_to_email: school?.reply_to_email || '',
    email_signature: school?.email_signature || '',
  })

  const [appearance, setAppearance] = useState({
    logo_url: school?.logo_url || '',
    primary_color: school?.primary_color || '#f97316',
    motto: school?.motto || '',
  })

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const clearFeedback = () => { setSuccess(null); setError(null) }

  const switchTab = (tab) => { setActiveTab(tab); clearFeedback() }

  // ─── Save ─────────────────────────────────────────────────────────────────

  const save = async (data) => {
    setSaving(true)
    clearFeedback()
    const { error: dbError } = await supabase.from('schools').update(data).eq('user_id', user.id)
    if (dbError) {
      setError(dbError.message)
    } else {
      setSuccess('Saved successfully!')
      onUpdate({ ...school, ...data })
    }
    setSaving(false)
  }

  const saveProfile = () => {
    try {
      validateProfile(profile)
      save(profile)
    } catch (err) {
      setError(err.message)
    }
  }

  const saveAcademic = () => save({
    ...academic,
    grades_offered: JSON.stringify(academic.grades_offered),
    subjects_offered: serializeSubjects(academic.subjects_offered),
    divisions: JSON.stringify(academic.divisions),
  })

  const saveCommunication = () => save(communication)

  const saveAppearance = () => save(appearance)

  // ─── Grade toggles ────────────────────────────────────────────────────────

  const toggleGrade = (grade) => {
    setAcademic(prev => {
      const updated = prev.grades_offered.includes(grade)
        ? prev.grades_offered.filter(g => g !== grade)
        : [...prev.grades_offered, grade]
      return { ...prev, grades_offered: updated }
    })
  }

  const selectAllGrades = (allGrades) => setAcademic(prev => ({ ...prev, grades_offered: [...allGrades] }))
  const clearAllGrades = () => setAcademic(prev => ({ ...prev, grades_offered: [] }))

  // ─── Division management ──────────────────────────────────────────────────

  const toggleGradeInDiv = (divIndex, grade) => {
    setAcademic(prev => {
      const updated = prev.divisions.map((div, i) => {
        if (i === divIndex) {
          const has = div.grades.includes(grade)
          return { ...div, grades: has ? div.grades.filter(g => g !== grade) : [...div.grades, grade] }
        }
        return { ...div, grades: div.grades.filter(g => g !== grade) }
      })
      return { ...prev, divisions: updated }
    })
  }

  const updateDivisionName = (divIndex, name) => {
    setAcademic(prev => ({
      ...prev,
      divisions: prev.divisions.map((div, i) => i === divIndex ? { ...div, name } : div),
    }))
  }

  const removeDivision = (divIndex) => {
    setAcademic(prev => ({
      ...prev,
      divisions: prev.divisions.filter((_, i) => i !== divIndex),
    }))
  }

  const addDivision = () => {
    setAcademic(prev => {
      if (prev.divisions.length >= 6) return prev
      return { ...prev, divisions: [...prev.divisions, { name: 'New Division', grades: [] }] }
    })
  }

  return {
    // tab
    activeTab, switchTab,
    // feedback
    saving, success, error,
    // form state
    profile, setProfile,
    academic, setAcademic,
    communication, setCommunication,
    appearance, setAppearance,
    // save handlers
    saveProfile, saveAcademic, saveCommunication, saveAppearance,
    // grade toggles
    toggleGrade, selectAllGrades, clearAllGrades,
    // division management
    toggleGradeInDiv, updateDivisionName, removeDivision, addDivision,
  }
}
