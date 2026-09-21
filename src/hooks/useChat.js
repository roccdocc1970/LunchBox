/**
 * useChat Hook
 *
 * Manages chat message history, sending, and the confirm/cancel flow for
 * any proposed write action. Conversation history sent to the backend is
 * reconstructed from the plain-text reply of each turn (not the full
 * internal tool-call trace) — a v1 simplification that keeps state simple
 * at the cost of the model not re-seeing its own prior tool calls verbatim.
 */

import { useState } from 'react'
import { sendChatMessage, executeConfirmedAction } from '../services/chat'

export function useChat(onNavigate) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmingIndex, setConfirmingIndex] = useState(null)
  const [confirmError, setConfirmError] = useState(null)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.text }))
      const data = await sendChatMessage(apiMessages)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.reply,
        view: data.view || null,
        pendingAction: data.pendingAction || null,
      }])
      if (data.navigate) onNavigate?.(data.navigate)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Something went wrong: ${err.message}` }])
    } finally {
      setSending(false)
    }
  }

  const confirmAction = async (index) => {
    const msg = messages[index]
    if (!msg?.pendingAction) return
    setConfirmingIndex(index)
    setConfirmError(null)
    try {
      await executeConfirmedAction(msg.pendingAction.tool, msg.pendingAction.input)
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, pendingAction: null, confirmed: true } : m))
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setConfirmingIndex(null)
    }
  }

  const cancelAction = (index) => {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, pendingAction: null, cancelled: true } : m))
  }

  return { messages, input, setInput, sending, send, confirmAction, cancelAction, confirmingIndex, confirmError }
}
