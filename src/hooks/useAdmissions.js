/**
 * useAdmissions Hook
 *
 * Manages all state and behavior for the Admissions module.
 * Coordinates between the domain (filtering, stats, business rules) and service (DB calls).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  getInquiries,
  createInquiry,
  updateInquiry,
  convertInquiryToStudent,
} from '../services/admissions'
import {
  makeBlankForm,
  filterInquiries,
  calcPipelineCounts,
  calcSourceCounts,
  buildApplicationLink,
  parseConfiguredGrades,
} from '../domain/admissions'
import { ALL_GRADES } from '../domain/enrollment'

export function useAdmissions(userId, school) {
  const configuredGrades = parseConfiguredGrades(school)
  const grades = configuredGrades || ALL_GRADES

  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(makeBlankForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterGrade, setFilterGrade] = useState('')

  // Drawer
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [convertConfirm, setConvertConfirm] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(false)

  // Copy link
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const data = await getInquiries(supabase, userId)
    setInquiries(data)
    setLoading(false)
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  const openForm = () => { setShowForm(true); setError(null) }
  const closeForm = () => { setShowForm(false); setForm(makeBlankForm()); setError(null) }
  const toggleForm = () => showForm ? closeForm() : openForm()

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await createInquiry(supabase, userId, form)
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Drawer ────────────────────────────────────────────────────────────────

  const openDrawer = (inq) => {
    setSelected(inq)
    setEditing(false)
    setConvertConfirm(false)
    setConvertSuccess(false)
    setError(null)
  }

  const closeDrawer = () => {
    setSelected(null)
    setEditing(false)
    setConvertConfirm(false)
    setConvertSuccess(false)
    setError(null)
  }

  const startEdit = () => {
    setEditForm({ ...selected })
    setEditing(true)
    setConvertConfirm(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await updateInquiry(supabase, selected.id, editForm)
      setSelected(data)
      setEditing(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const convertToStudent = async () => {
    setConverting(true)
    setError(null)
    try {
      await convertInquiryToStudent(supabase, userId, selected)
      setSelected(prev => ({ ...prev, status: 'Applied' }))
      setConvertConfirm(false)
      setConvertSuccess(true)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setConverting(false)
    }
  }

  // ─── Filters ───────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterSource('')
    setFilterGrade('')
  }

  const toggleStatusFilter = (status) => setFilterStatus(prev => prev === status ? '' : status)
  const toggleSourceFilter = (source) => setFilterSource(prev => prev === source ? '' : source)

  // ─── Copy link ─────────────────────────────────────────────────────────────

  const copyApplicationLink = () => {
    navigator.clipboard.writeText(buildApplicationLink(userId))
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filtered = filterInquiries(inquiries, { search, filterStatus, filterSource, filterGrade })
  const pipelineCounts = calcPipelineCounts(inquiries)
  const sourceCounts = calcSourceCounts(inquiries)

  return {
    // data
    inquiries, loading, filtered, grades,
    pipelineCounts, sourceCounts,
    // create form
    showForm, toggleForm,
    form, setForm, saving, error,
    submit,
    // drawer
    selected, openDrawer, closeDrawer,
    editing, editForm, setEditForm,
    startEdit, saveEdit,
    convertConfirm, setConvertConfirm,
    converting, convertSuccess,
    convertToStudent,
    // filters
    search, setSearch,
    filterStatus, toggleStatusFilter,
    filterSource, toggleSourceFilter,
    filterGrade, setFilterGrade,
    clearFilters,
    // link
    linkCopied, copyApplicationLink,
  }
}
