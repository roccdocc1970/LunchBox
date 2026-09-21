import { useEffect, useRef } from 'react'
import { Send, Sparkles, Mic, Volume2, VolumeX } from 'lucide-react'
import { useChat } from './hooks/useChat'
import { useVoice } from './hooks/useVoice'
import GeneratedView from './views/GeneratedView'
import ConfirmAction from './views/ConfirmAction'

const NAVIGATE_HANDLERS = {
  navigate_to_cohort: (input, h) => h.onNavigateToCohort?.(input.cohortId),
  navigate_to_class: (input, h) => h.onNavigateToClass?.(input.classId),
  navigate_to_scheduling: (_input, h) => h.onNavigate?.('schedule'),
  navigate_to_page: (input, h) => h.onNavigate?.(input.page),
}

export default function Chat({ school, onNavigateToCohort, onNavigateToClass, onNavigate }) {
  const primaryColor = school?.primary_color || '#f97316'
  const navHandlers = { onNavigateToCohort, onNavigateToClass, onNavigate }

  const onNavigateDirective = (navigate) => {
    const handler = NAVIGATE_HANDLERS[navigate.tool]
    handler?.(navigate.input || {}, navHandlers)
  }

  const c = useChat(onNavigateDirective)
  const v = useVoice()

  const submit = (e) => {
    e.preventDefault()
    c.send()
  }

  const lastSpokenIndex = useRef(-1)
  useEffect(() => {
    const lastIndex = c.messages.length - 1
    const last = c.messages[lastIndex]
    if (last?.role === 'assistant' && last.text && lastIndex !== lastSpokenIndex.current) {
      lastSpokenIndex.current = lastIndex
      v.speak(last.text)
    }
  }, [c.messages, v])

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5">
            <Sparkles size={22} style={{ color: primaryColor }} />Ask LunchBox
          </h2>
          <p className="text-gray-500 mt-1">Ask about any student, or tell me what you need to change.</p>
        </div>
        {v.supportsOutput && (
          <button
            onClick={() => v.setSpeakEnabled(e => !e)}
            title={v.speakEnabled ? 'Voice replies on' : 'Voice replies off'}
            className={`border rounded-lg p-2 cursor-pointer ${v.speakEnabled ? 'text-white' : 'bg-white text-gray-400 border-gray-300 hover:text-gray-600'}`}
            style={v.speakEnabled ? { background: primaryColor, borderColor: primaryColor } : undefined}
          >
            {v.speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4 mb-6">
        {c.messages.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-sm text-gray-400">
            Try: "How is Marcus Johnson doing this year?" or "Log an incident for Sofia Delgado."
          </div>
        )}
        {c.messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'text-white' : 'bg-white shadow-sm text-gray-800'}`}
              style={m.role === 'user' ? { background: primaryColor } : undefined}
            >
              {m.text}
            </div>
            {m.view && <div className="mt-2"><GeneratedView view={m.view} /></div>}
            {m.pendingAction && (
              <div className="mt-2">
                <ConfirmAction
                  pendingAction={m.pendingAction}
                  confirming={c.confirmingIndex === i}
                  error={c.confirmingIndex === i ? c.confirmError : null}
                  onConfirm={() => c.confirmAction(i)}
                  onCancel={() => c.cancelAction(i)}
                />
              </div>
            )}
            {m.confirmed && <p className="text-xs text-green-600 mt-1 mb-0">Done.</p>}
            {m.cancelled && <p className="text-xs text-gray-400 mt-1 mb-0">Cancelled.</p>}
          </div>
        ))}
        {c.sending && <div className="self-start bg-white rounded-2xl px-4 py-2.5 shadow-sm text-sm text-gray-400">Thinking…</div>}
      </div>

      <form onSubmit={submit} className="flex gap-2 sticky bottom-8">
        <input
          value={c.input}
          onChange={e => c.setInput(e.target.value)}
          placeholder={v.listening ? 'Listening…' : 'Ask a question or describe what you need…'}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none text-sm bg-white shadow-sm"
        />
        {v.supportsInput && (
          <button
            type="button"
            onClick={() => v.listening ? v.stopListening() : v.startListening(text => c.setInput(text))}
            title={v.listening ? 'Stop listening' : 'Speak your question'}
            className={`border rounded-xl px-4 py-3 cursor-pointer flex items-center ${v.listening ? 'text-white border-red-500 bg-red-500' : 'bg-white text-gray-500 border-gray-300 hover:text-gray-700'}`}
          ><Mic size={16} /></button>
        )}
        <button
          type="submit"
          disabled={c.sending || !c.input.trim()}
          className="text-white border-0 rounded-xl px-5 py-3 font-semibold cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1.5"
          style={{ background: primaryColor }}
        ><Send size={16} />Send</button>
      </form>
    </div>
  )
}
