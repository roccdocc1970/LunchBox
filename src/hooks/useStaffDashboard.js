/**
 * useStaffDashboard Hook
 *
 * Manages all state and behavior for the Staff Portal module.
 * Coordinates between domain (role logic, filters) and services (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getStudentsWithParents, getSchoolIncidents, getIncidents, logIncident, getStudentHealth } from '../services/students'
import { getReportCards, createReportCard, updateReportCard, setReportCardPublished } from '../services/reportCards'
import { getStaff } from '../services/staff'
import { getWorkOrders, createWorkOrder } from '../services/facilities'
import { parseGradeAssignments } from '../domain/staff'
import { parseSubjects, buildGradeOptions } from '../domain/reportCards'
import { getTerms } from '../domain/reportCards'
import {
  isTeacherRole, isPrincipalAdminRole, canViewFullHealth, canViewLimitedHealth,
  buildBlankIncident, buildNewCardForm,
  filterStudents, filterIncidents, filterCards, filterWorkOrders,
  calcIncidentStats, BLANK_WO_FORM,
} from '../domain/staffDashboard'

export function useStaffDashboard(staffMember, school) {
  const schoolId       = staffMember.school_id
  const role           = staffMember.role
  const isTeacher      = isTeacherRole(role)
  const isPrincipalAdmin = isPrincipalAdminRole(role)
  const gradeAssignments = parseGradeAssignments(staffMember)
  const subjects       = parseSubjects(school?.subjects_offered)
  const gradingScale   = school?.grading_scale || 'Letter'
  const gradeOptions   = buildGradeOptions(gradingScale)
  const termOptions    = getTerms(school?.grading_period || 'Quarters')
  const academicYear   = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

  const [activePage, setActivePage] = useState('students')

  // Students
  const [students,        setStudents]        = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentSearch,   setStudentSearch]   = useState('')

  // Student incidents (in drawer)
  const [studentIncidents, setStudentIncidents] = useState([])
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [incidentForm,     setIncidentForm]     = useState(buildBlankIncident(staffMember))
  const [savingIncident,   setSavingIncident]   = useState(false)

  // School-wide incidents
  const [allIncidents,   setAllIncidents]   = useState([])
  const [incidentFilter, setIncidentFilter] = useState('Open')

  // Health
  const [studentHealthProfile, setStudentHealthProfile] = useState(null)
  const [studentHealthEntries, setStudentHealthEntries] = useState([])

  // Report cards
  const [reportCards, setReportCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [cardForm,    setCardForm]    = useState(null)
  const [savingCard,  setSavingCard]  = useState(false)
  const [rcSearch,    setRcSearch]    = useState('')

  // Staff directory
  const [staffList, setStaffList] = useState([])

  // Work orders
  const [workOrders,   setWorkOrders]   = useState([])
  const [woFilter,     setWoFilter]     = useState('All')
  const [showWoForm,   setShowWoForm]   = useState(false)
  const [woForm,       setWoForm]       = useState({ ...BLANK_WO_FORM })
  const [savingWo,     setSavingWo]     = useState(false)
  const [woFormError,  setWoFormError]  = useState('')

  useEffect(() => {
    loadStudents()
    loadAllIncidents()
    loadWorkOrders()
    if (isTeacher || isPrincipalAdmin) loadReportCards()
    if (isPrincipalAdmin) loadStaff()
  }, [])

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const loadStudents = async () => {
    setLoadingStudents(true)
    const gradeFilter = isTeacher && gradeAssignments.length > 0 ? gradeAssignments : []
    const data = await getStudentsWithParents(supabase, schoolId, gradeFilter)
    setStudents(data)
    setLoadingStudents(false)
  }

  const loadAllIncidents = async () => {
    const data = await getSchoolIncidents(supabase, schoolId)
    setAllIncidents(data)
  }

  const loadStudentIncidents = async (studentId) => {
    const data = await getIncidents(supabase, studentId)
    setStudentIncidents(data)
  }

  const loadStudentHealth = async (studentId) => {
    const { profile, entries } = await getStudentHealth(supabase, studentId)
    setStudentHealthProfile(profile)
    setStudentHealthEntries(entries)
  }

  const loadReportCards = async () => {
    const data = await getReportCards(supabase, schoolId)
    setReportCards(data)
  }

  const loadStaff = async () => {
    const data = await getStaff(supabase, schoolId)
    setStaffList(data)
  }

  const loadWorkOrders = async () => {
    const data = await getWorkOrders(supabase, schoolId)
    setWorkOrders(data)
  }

  // ─── Student drawer ────────────────────────────────────────────────────────

  const openStudentProfile = (student) => {
    setSelectedStudent(student)
    setStudentIncidents([])
    setShowIncidentForm(false)
    setIncidentForm(buildBlankIncident(staffMember))
    setStudentHealthProfile(null)
    setStudentHealthEntries([])
    loadStudentIncidents(student.id)
    if (canViewFullHealth(role) || canViewLimitedHealth(role)) loadStudentHealth(student.id)
  }

  const closeStudentProfile = () => setSelectedStudent(null)

  // ─── Incident logging (from student drawer) ────────────────────────────────

  const submitIncident = async () => {
    if (!incidentForm.description) return
    setSavingIncident(true)
    await logIncident(supabase, schoolId, {
      studentId:   selectedStudent.id,
      studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
      type:        incidentForm.type,
      description: incidentForm.description,
      reported_by: incidentForm.reported_by,
      resolution:  incidentForm.resolution,
      status:      incidentForm.status,
    })
    setSavingIncident(false)
    setShowIncidentForm(false)
    setIncidentForm(buildBlankIncident(staffMember))
    loadStudentIncidents(selectedStudent.id)
    loadAllIncidents()
  }

  // ─── Report cards ──────────────────────────────────────────────────────────

  const startNewCard = () => {
    const blankForm = {
      student_id: '', student_name: '', student_grade: '',
      academic_year: academicYear,
      term: termOptions[0],
      grades: subjects.map(s => ({ subject: s, grade: '', comment: '' })),
      teacher_notes: '',
      published: false,
    }
    setCardForm(blankForm)
    setEditingCard('new')
  }

  const openExistingCard = (card) => {
    setCardForm({ ...card, grades: card.grades || subjects.map(s => ({ subject: s, grade: '', comment: '' })) })
    setEditingCard(card.id)
  }

  const saveCard = async () => {
    if (!cardForm.student_id) return
    setSavingCard(true)
    if (editingCard === 'new') {
      await createReportCard(supabase, schoolId, cardForm)
    } else {
      await updateReportCard(supabase, editingCard, cardForm)
    }
    setSavingCard(false)
    setEditingCard(null)
    setCardForm(null)
    loadReportCards()
  }

  const cancelCard = () => {
    setEditingCard(null)
    setCardForm(null)
  }

  const togglePublish = async (card) => {
    await setReportCardPublished(supabase, card.id, !card.published)
    loadReportCards()
  }

  // ─── Work orders ───────────────────────────────────────────────────────────

  const submitWorkOrder = async () => {
    if (!woForm.title.trim()) { setWoFormError('Title is required.'); return }
    setWoFormError('')
    setSavingWo(true)
    await createWorkOrder(supabase, schoolId, {
      ...woForm,
      submitted_by: `${staffMember.first_name} ${staffMember.last_name}`,
      status: 'Open',
    })
    setSavingWo(false)
    setWoForm({ ...BLANK_WO_FORM })
    setShowWoForm(false)
    loadWorkOrders()
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filteredStudents  = filterStudents(students, studentSearch)
  const filteredIncidents = filterIncidents(allIncidents, incidentFilter)
  const filteredCards     = filterCards(reportCards, rcSearch)
  const filteredWorkOrders = filterWorkOrders(workOrders, woFilter)
  const incidentStats     = calcIncidentStats(allIncidents)

  return {
    // role / config
    role, isTeacher, isPrincipalAdmin, gradeAssignments,
    subjects, gradeOptions, termOptions, academicYear,
    // pages
    activePage, setActivePage,
    // students
    students, loadingStudents, filteredStudents,
    selectedStudent, studentSearch, setStudentSearch,
    openStudentProfile, closeStudentProfile,
    // health
    studentHealthProfile, studentHealthEntries,
    // student incidents
    studentIncidents, showIncidentForm, setShowIncidentForm,
    incidentForm, setIncidentForm, savingIncident, submitIncident,
    // school incidents
    allIncidents, filteredIncidents, incidentFilter, setIncidentFilter, incidentStats,
    // report cards
    reportCards, filteredCards, rcSearch, setRcSearch,
    editingCard, cardForm, setCardForm, savingCard,
    startNewCard, openExistingCard, saveCard, cancelCard, togglePublish,
    // staff
    staffList,
    // work orders
    workOrders, filteredWorkOrders, woFilter, setWoFilter,
    showWoForm, setShowWoForm, woForm, setWoForm,
    savingWo, woFormError, submitWorkOrder,
  }
}
