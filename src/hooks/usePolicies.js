/**
 * usePolicies Hook
 *
 * UI state and behavior for the Settings → Policies tab: list the school's policy documents,
 * read a chosen file or pasted text, validate it (domain), upload it (service → server endpoint,
 * which chunks and embeds), and delete a document. No database calls here beyond the services.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { listPolicies, deletePolicy } from '../services/policies'
import { uploadPolicy } from '../services/policyUpload'
import { validatePolicyInput, titleFromFilename } from '../domain/policies'

export function usePolicies(user) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [filename, setFilename] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDocuments(await listPolicies(supabase))
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /** A file was chosen: check its type, read its text, and suggest a title. */
  const chooseFile = async (file) => {
    setError(null)
    setSuccess(null)
    if (!file) return
    const problem = validatePolicyInput({ title: 'x', text: 'x', filename: file.name })
    if (problem) { setError(problem); return }
    setText(await file.text())
    setFilename(file.name)
    if (!title.trim()) setTitle(titleFromFilename(file.name))
  }

  const submit = async () => {
    setError(null)
    setSuccess(null)
    const problem = validatePolicyInput({ title, text, filename })
    if (problem) { setError(problem); return }
    setUploading(true)
    try {
      const result = await uploadPolicy({ title: title.trim(), text, filename: filename || null })
      setSuccess(`Stored "${title.trim()}" — ${result.chunks} sections are now searchable${result.replaced ? ' (replaced the earlier version)' : ''}.`)
      setTitle(''); setText(''); setFilename('')
      await load()
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
  }

  const remove = async (doc) => {
    setError(null)
    setSuccess(null)
    try {
      await deletePolicy(supabase, user.id, doc.title)
      setSuccess(`Removed "${doc.title}".`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    documents, loading, uploading, error, success,
    title, setTitle, text, setText, filename,
    chooseFile, submit, remove,
  }
}
