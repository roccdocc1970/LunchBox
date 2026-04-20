import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Messages({ user }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    subject: '',
    body: '',
    recipient_type: 'all'
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setMessages(data)
    setLoading(false)
  }

  const fetchParentEmails = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('parent_email, parent_name')
      .eq('school_id', user.id)
    if (error) return []
    const unique = [...new Map(data.map(s => [s.parent_email, s])).values()]
    return unique
  }

  const handleSend = async () => {
    if (!form.subject || !form.body) {
      setError('Please fill in subject and message.')
      return
    }
    setSending(true)
    setError(null)
    setSuccess(null)

    const parents = await fetchParentEmails()

    if (parents.length === 0) {
      setError('No parents found. Add students with parent emails first.')
      setSending(false)
      return
    }

    // Save message to database
    const { error: dbError } = await supabase
      .from('messages')
      .insert([{
        subject: form.subject,
        body: form.body,
        recipient_count: parents.length,
        school_id: user.id,
        status: 'Sent'
      }])

    if (dbError) {
      setError(dbError.message)
      setSending(false)
      return
    }

    setSuccess(`Message saved! In production this would send to ${parents.length} parent(s). Connect a verified domain in Resend to enable live email sending.`)
    setForm({ subject: '', body: '', recipient_type: 'all' })
    setShowForm(false)
    fetchMessages()
    setSending(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Messages</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Send announcements and messages to parents</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          {showForm ? 'Cancel' : '+ New Message'}
        </button>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: '#15803d' }}>
          {success}
        </div>
      )}

      {/* Compose Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>Compose Message</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                Recipients
              </label>
              <select
                value={form.recipient_type}
                onChange={(e) => setForm({ ...form, recipient_type: e.target.value })}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
              >
                <option value="all">All Parents</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Important School Announcement"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                placeholder="Type your message to parents here..."
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

            <button
              onClick={handleSend}
              disabled={sending}
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', alignSelf: 'flex-start' }}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading messages...</p>
      ) : messages.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No messages yet. Send your first announcement above!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontWeight: '700', color: '#1f2937', margin: 0, fontSize: '1rem' }}>{msg.subject}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Sent to {msg.recipient_count} parent(s) · {formatDate(msg.created_at)}
                  </p>
                </div>
                <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>
                  {msg.status}
                </span>
              </div>
              <p style={{ color: '#374151', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{msg.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}