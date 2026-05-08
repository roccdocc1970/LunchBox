/**
 * useMessages Hook
 *
 * Manages all state and behavior for the Messages module.
 * Coordinates between the domain (validation) and service (DB calls).
 * The Messages component imports this and renders whatever it returns.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getMessages, getParentEmails, saveMessage } from '../services/messages'
import { validateMessage } from '../domain/messages'

const BLANK_FORM = { subject: '', body: '', recipient_type: 'all' }

export function useMessages(userId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({ ...BLANK_FORM })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMessages(supabase, userId)
      setMessages(data)
    } catch (err) {
      // Messages failing to load is non-critical — show empty state
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    setError(null)
    setSuccess(null)

    // Validate via domain layer first — no DB calls if form is invalid
    try {
      validateMessage(form)
    } catch (err) {
      setError(err.message)
      return
    }

    setSending(true)
    try {
      const parents = await getParentEmails(supabase, userId)

      if (parents.length === 0) {
        setError('No parents found. Add students with parent emails first.')
        return
      }

      await saveMessage(supabase, userId, {
        subject: form.subject,
        body: form.body,
        recipientCount: parents.length,
      })

      setSuccess(
        `Message saved! In production this would send to ${parents.length} parent(s). ` +
        `Connect a verified domain in Resend to enable live email sending.`
      )
      setForm({ ...BLANK_FORM })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return {
    messages,
    loading,
    showForm,
    setShowForm,
    sending,
    error,
    success,
    form,
    setForm,
    send,
  }
}
