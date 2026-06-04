import { Mail, MessageSquare } from 'lucide-react'
import { useMessages } from './hooks/useMessages'
import { formatMessageDate } from './domain/messages'

export default function Messages({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const {
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
  } = useMessages(user.id)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><MessageSquare size={22} style={{ color: primaryColor }} />Messages</h2>
          <p className="text-gray-500 mt-1">Send announcements and messages to parents</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-base hover:opacity-90 transition-opacity"
          style={{ background: primaryColor }}
        >
          {showForm ? 'Cancel' : '+ New Message'}
        </button>
      </div>

      {/* Stat card */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: primaryColor }} />
          <span className="font-semibold text-gray-800">{messages.length}</span>
          <span className="text-gray-500 text-sm">Messages Sent</span>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 text-green-700">
          {success}
        </div>
      )}

      {/* Compose Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">Compose Message</h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <select
                value={form.recipient_type}
                onChange={(e) => setForm({ ...form, recipient_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm bg-white"
              >
                <option value="all">All Parents</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Important School Announcement"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                placeholder="Type your message to parents here..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm resize-y"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={send}
              disabled={sending}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer text-base self-start transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      {loading ? (
        <p className="text-gray-500">Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 flex justify-center"><Mail size={48} className="text-gray-300" /></div>
          <p className="text-gray-500 text-lg">No messages yet. Send your first announcement above!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 m-0 text-base">{msg.subject}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Sent to {msg.recipient_count} parent(s) · {formatMessageDate(msg.created_at)}
                  </p>
                </div>
                <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
                  {msg.status}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed m-0 text-sm">{msg.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
