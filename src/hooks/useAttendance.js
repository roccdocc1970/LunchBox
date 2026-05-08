/**
 * useAttendance Hook
 *
 * Manages all state and behavior for the Attendance module.
 * Coordinates between the domain (date helpers, summaries) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getStudentsWithAttendance,
  saveAttendance,
  getAttendanceHistory,
} from '../services/attendance'
import { todayStr, summarizeAttendance } from '../domain/attendance'
import { getAvailableGrades } from '../domain/school'

export function useAttendance(schoolId, school, gradeFilter = null) {
  const availableGrades = getAvailableGrades(school)

  const [activeTab, setActiveTab] = useState('take')

  // Take attendance tab
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [selectedGrade, setSelectedGrade] = useState(gradeFilter || '')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // History tab
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyDate, setHistoryDate] = useState('')
  const [historyGrade, setHistoryGrade] = useState('')
  const [historyStatus, setHistoryStatus] = useState('')

  // Sync grade filter prop (used by StaffDashboard to pre-select a teacher's grade)
  useEffect(() => {
    if (gradeFilter) setSelectedGrade(gradeFilter)
  }, [gradeFilter])

  // Reload students whenever date or grade changes
  useEffect(() => {
    if (selectedGrade && selectedDate) fetchStudentsAndAttendance()
  }, [selectedGrade, selectedDate])

  // Reload history whenever tab switches to history or any filter changes
  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, historyDate, historyGrade, historyStatus])

  const fetchStudentsAndAttendance = async () => {
    setLoadingStudents(true)
    try {
      const { students: studs, attendanceMap } = await getStudentsWithAttendance(
        supabase, schoolId, { date: selectedDate, grade: selectedGrade }
      )
      setStudents(studs)
      setAttendance(attendanceMap)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await getAttendanceHistory(supabase, schoolId, {
        date: historyDate,
        grade: historyGrade,
        status: historyStatus,
      })
      setHistory(data)
    } finally {
      setLoadingHistory(false)
    }
  }

  const save = async () => {
    if (!selectedGrade || !selectedDate || students.length === 0) return
    setSaving(true)
    setSaveMessage('')
    try {
      await saveAttendance(supabase, schoolId, { students, attendanceMap: attendance, date: selectedDate })
      setSaveMessage('Attendance saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setSaveMessage('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const setStudentStatus = (id, status) =>
    setAttendance(prev => ({ ...prev, [id]: { ...prev[id], status } }))

  const setStudentNotes = (id, notes) =>
    setAttendance(prev => ({ ...prev, [id]: { ...prev[id], notes } }))

  const clearHistoryFilters = () => {
    setHistoryDate('')
    setHistoryGrade('')
    setHistoryStatus('')
  }

  const summary = summarizeAttendance(students, attendance)

  return {
    // config
    availableGrades,
    gradeFilter,
    // tabs
    activeTab, setActiveTab,
    // take attendance
    selectedDate, setSelectedDate,
    selectedGrade, setSelectedGrade,
    students, attendance,
    loadingStudents, saving, saveMessage,
    summary,
    setStudentStatus, setStudentNotes,
    save,
    // history
    history, loadingHistory,
    historyDate, setHistoryDate,
    historyGrade, setHistoryGrade,
    historyStatus, setHistoryStatus,
    clearHistoryFilters,
  }
}
