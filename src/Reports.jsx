import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUS_COLORS = {
  Enrolled: '#10b981',
  Applied: '#3b82f6',
  Waitlisted: '#f59e0b',
}

export default function Reports({ user, school }) {
  const [students, setStudents] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: studs }, { data: msgs }] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: true }),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
    ])
    if (studs) setStudents(studs)
    if (msgs) setMessages(msgs)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading reports...</div>

  // --- Derived stats ---
  const total = students.length
  const enrolled = students.filter(s => s.status === 'Enrolled').length
  const applied = students.filter(s => s.status === 'Applied').length
  const waitlisted = students.filter(s => s.status === 'Waitlisted').length
  const capacity = school?.student_capacity || 0
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null

  const totalParentsReached = messages.reduce((sum, m) => sum + (m.recipient_count || 0), 0)

  // Grade breakdown
  const gradeCounts = {}
  students.forEach(s => {
    const g = s.grade || 'Unknown'
    gradeCounts[g] = (gradeCounts[g] || 0) + 1
  })
  const gradeEntries = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])
  const maxGradeCount = gradeEntries.length > 0 ? gradeEntries[0][1] : 1

  // Monthly enrollment trend (last 6 months)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    }
  })
  const monthCounts = months.map(m => ({
    ...m,
    count: students.filter(s => {
      const d = new Date(s.created_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).length,
  }))
  const maxMonthCount = Math.max(...monthCounts.map(m => m.count), 1)

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Reports</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Enrollment trends and school activity overview</p>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Students', value: total, icon: '🎒', color: '#f97316' },
          { label: 'Enrolled', value: enrolled, icon: '✅', color: '#10b981' },
          { label: 'Applied', value: applied, icon: '📋', color: '#3b82f6' },
          { label: 'Waitlisted', value: waitlisted, icon: '⏳', color: '#f59e0b' },
          { label: 'Messages Sent', value: messages.length, icon: '✉️', color: '#8b5cf6' },
          { label: 'Parents Reached', value: totalParentsReached, icon: '👪', color: '#ec4899' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${stat.color}` }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Status Breakdown */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.25rem' }}>Enrollment Status</h3>
          {total === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No students yet.</p>
          ) : (
            <>
              {/* Stacked bar */}
              <div style={{ display: 'flex', height: '20px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                  const count = students.filter(s => s.status === status).length
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return pct > 0 ? (
                    <div key={status} style={{ width: `${pct}%`, background: STATUS_COLORS[status], transition: 'width 0.4s' }} title={`${status}: ${count}`} />
                  ) : null
                })}
              </div>
              {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                const count = students.filter(s => s.status === status).length
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{count}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Capacity Utilization */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.25rem' }}>Capacity Utilization</h3>
          {capacityPct === null ? (
            <div>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>No capacity set. Add your student capacity in Settings.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>{enrolled}</div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>enrolled students</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#10b981' }}>{capacityPct}%</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>full</span>
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{enrolled} / {capacity} seats</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${capacityPct}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.4s',
                  background: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#10b981'
                }} />
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                {capacity - enrolled} seat{capacity - enrolled !== 1 ? 's' : ''} remaining
              </p>
            </>
          )}
        </div>
      </div>

      {/* Monthly Enrollment Trend */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>New Students — Last 6 Months</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '140px' }}>
          {monthCounts.map((m) => {
            const barHeight = maxMonthCount > 0 ? Math.max((m.count / maxMonthCount) * 100, m.count > 0 ? 8 : 0) : 0
            return (
              <div key={m.label + m.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>{m.count > 0 ? m.count : ''}</span>
                <div style={{ width: '100%', background: m.count > 0 ? '#f97316' : '#f3f4f6', borderRadius: '0.375rem 0.375rem 0 0', height: `${barHeight}%`, minHeight: '4px', transition: 'height 0.4s' }} />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grade Breakdown */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.25rem' }}>Students by Grade</h3>
        {gradeEntries.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No grade data yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gradeEntries.map(([grade, count]) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{grade}</span>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / maxGradeCount) * 100}%`, height: '100%', background: '#f97316', borderRadius: '9999px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
