import { useReports } from './hooks/useReports'
import {
  TABS, ATTENDANCE_STATUS_COLORS, WO_CATEGORY_COLORS,
  STUDENT_STATUS_COLORS, INCIDENT_TYPES, INCIDENT_TYPE_COLORS,
  ROLE_COLORS, WO_PRIORITY_COLORS, WO_STATUS_COLORS, WO_CATEGORIES,
  CAMPAIGN_TYPE_COLORS, DIVISION_COLORS, fmt,
} from './domain/reports'

export default function Reports({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const r = useReports(user, school)

  if (r.loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading reports...</div>

  // ── Render helpers (pure JSX — stay in component) ──────────────────────────

  const card = (children, extra = {}) => (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...extra }}>
      {children}
    </div>
  )

  const cardTitle = (text) => (
    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.25rem' }}>{text}</h3>
  )

  const statCards = (stats) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>{s.value}</div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )

  const barChart = (data, maxVal, color, height = 140) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: `${height}px` }}>
      {data.map((m) => {
        const barH = m.count > 0 ? Math.max((m.count / maxVal) * 100, 8) : 0
        return (
          <div key={m.label + m.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>{m.count > 0 ? m.count : ''}</span>
            <div style={{ width: '100%', background: m.count > 0 ? color : '#f3f4f6', borderRadius: '0.375rem 0.375rem 0 0', height: `${barH}%`, minHeight: '4px', transition: 'height 0.4s' }} />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )

  const thStyle = { textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '0.625rem 0.75rem' }
  const trHover = { onMouseEnter: e => e.currentTarget.style.background = '#fafafa', onMouseLeave: e => e.currentTarget.style.background = 'white' }

  // ─────────────────────────────────────────────────────────────────────────────

  const { enrollment: en, divEnroll, enrollMonths, attendance: att, incidents: inc,
          comms, staffStats: sf, fundraising: fr, facilities: fac } = r

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Report Dashboards</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>School activity and analytics</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => r.setActiveTab(tab.id)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: r.activeTab === tab.id ? '600' : '400',
            background: r.activeTab === tab.id ? primaryColor : 'transparent',
            color: r.activeTab === tab.id ? 'white' : '#6b7280',
            boxShadow: r.activeTab === tab.id ? `0 1px 3px ${primaryColor}40` : 'none',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Enrollment ── */}
      {r.activeTab === 'enrollment' && (<>
        {statCards([
          { label: 'Total Students', value: en.total,      icon: '🎒', color: primaryColor },
          { label: 'Enrolled',       value: en.enrolled,   icon: '✅', color: '#10b981' },
          { label: 'Applied',        value: en.applied,    icon: '📋', color: '#3b82f6' },
          { label: 'Waitlisted',     value: en.waitlisted, icon: '⏳', color: '#f59e0b' },
        ])}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {card(<>
            {cardTitle('Enrollment Status')}
            {en.total === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No students yet.</p> : (<>
              <div style={{ display: 'flex', height: '20px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                  const count = r.students.filter(s => s.status === status).length
                  const pct = en.total > 0 ? (count / en.total) * 100 : 0
                  return pct > 0 ? <div key={status} style={{ width: `${pct}%`, background: STUDENT_STATUS_COLORS[status] }} title={`${status}: ${count}`} /> : null
                })}
              </div>
              {['Enrolled', 'Applied', 'Waitlisted'].map(status => {
                const count = r.students.filter(s => s.status === status).length
                const pct = en.total > 0 ? Math.round((count / en.total) * 100) : 0
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: STUDENT_STATUS_COLORS[status], display: 'inline-block' }} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{count}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </>)}
          </>)}

          {card(<>
            {cardTitle('Capacity Utilization')}
            {en.capacityPct === null ? (
              <div>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>No capacity set. Add your student capacity in Settings.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>{en.enrolled}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>enrolled students</div>
                </div>
              </div>
            ) : (<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: en.capacityPct >= 90 ? '#ef4444' : en.capacityPct >= 70 ? '#f59e0b' : '#10b981' }}>{en.capacityPct}%</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>full</span>
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{en.enrolled} / {en.capacity} seats</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${en.capacityPct}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.4s', background: en.capacityPct >= 90 ? '#ef4444' : en.capacityPct >= 70 ? '#f59e0b' : '#10b981' }} />
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                {en.capacity - en.enrolled} seat{en.capacity - en.enrolled !== 1 ? 's' : ''} remaining
              </p>
            </>)}
          </>)}
        </div>

        {card(<>
          {cardTitle('New Students — Last 6 Months')}
          {barChart(enrollMonths.counts, enrollMonths.max, primaryColor)}
        </>, { marginBottom: '1.5rem' })}

        {divEnroll && card(<>
          {cardTitle('Students by Division')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {divEnroll.stats.map(div => (
              <div key={div.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0, fontWeight: '500' }}>{div.name}</span>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${(div.count / divEnroll.maxCount) * 100}%`, height: '100%', background: div.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{div.count}</span>
                <span style={{ fontSize: '0.75rem', color: div.color, fontWeight: '500', width: '80px' }}>{div.enrolledCount} enrolled</span>
              </div>
            ))}
          </div>
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          {cardTitle('Students by Grade')}
          {en.gradeEntries.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No grade data yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {en.gradeEntries.map(([grade, count]) => (
                <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{grade}</span>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / en.maxGradeCount) * 100}%`, height: '100%', background: primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </>)}
      </>)}

      {/* ── Attendance ── */}
      {r.activeTab === 'attendance' && (<>
        {statCards([
          { label: 'Total Records',     value: att.total,                                                       icon: '📅', color: '#3b82f6' },
          { label: 'Present Rate',      value: att.presentRate !== null ? `${att.presentRate}%` : '—',          icon: '✅', color: '#10b981' },
          { label: 'Absences',          value: att.absent,                                                      icon: '❌', color: '#ef4444' },
          { label: 'Tardies',           value: att.tardy,                                                       icon: '⏰', color: '#f59e0b' },
          { label: 'Chronic Absentees', value: att.chronic.length, icon: '⚠️', color: att.chronic.length > 0 ? '#ef4444' : '#10b981' },
        ])}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Absences & Tardies — Last 6 Months')}
            {att.total === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No attendance records yet.</p> : barChart(att.absenceMonthCounts, att.maxAbsenceMonth, '#3b82f6')}
          </>)}

          {card(<>
            {cardTitle('Attendance Breakdown')}
            {att.total === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No attendance records yet.</p> : (<>
              <div style={{ display: 'flex', height: '16px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                {['Present', 'Absent', 'Tardy', 'Excused'].map(status => {
                  const count = r.students.filter ? att.total > 0 && null : null // use attendanceRecords via hook below
                  // We need raw attendance records — count directly
                  void count
                  return null
                })}
                {/* Inline calculation for stacked bar since we need raw counts */}
                {(() => {
                  const counts = { Present: att.present, Absent: att.absent, Tardy: att.tardy,
                    Excused: att.total - att.present - att.absent - att.tardy }
                  return ['Present', 'Absent', 'Tardy', 'Excused'].map(status => {
                    const c = counts[status] || 0
                    const pct = att.total > 0 ? (c / att.total) * 100 : 0
                    return pct > 0 ? <div key={status} style={{ width: `${pct}%`, background: ATTENDANCE_STATUS_COLORS[status] }} title={`${status}: ${c}`} /> : null
                  })
                })()}
              </div>
              {(() => {
                const counts = { Present: att.present, Absent: att.absent, Tardy: att.tardy,
                  Excused: att.total - att.present - att.absent - att.tardy }
                return ['Present', 'Absent', 'Tardy', 'Excused'].map(status => {
                  const c = counts[status] || 0
                  const pct = att.total > 0 ? Math.round((c / att.total) * 100) : 0
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: ATTENDANCE_STATUS_COLORS[status], display: 'inline-block' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{c}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })
              })()}
            </>)}
          </>)}
        </div>

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Chronic Absentees</h3>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Students with &gt;10% non-present rate (min. 5 days recorded)</span>
          </div>
          {att.chronic.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No chronic absentees. Great attendance! 🎉</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Student', 'Grade', 'Days Recorded', 'Non-Present', 'Rate'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {att.chronic.map((s, i) => {
                    const rate = Math.round((s.absent / s.total) * 100)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                        <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937' }}>{s.name}</td>
                        <td style={{ ...tdStyle, color: '#6b7280' }}>{s.grade || '—'}</td>
                        <td style={{ ...tdStyle, color: '#374151' }}>{s.total}</td>
                        <td style={{ ...tdStyle, color: '#ef4444', fontWeight: '600' }}>{s.absent}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: rate >= 20 ? '#ef4444' : '#f59e0b', background: rate >= 20 ? '#ef444418' : '#f59e0b18', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

      {/* ── Student Incidents ── */}
      {r.activeTab === 'incidents' && (<>
        {statCards([
          { label: 'Total Student Incidents', value: inc.total,    icon: '📋', color: '#6b7280' },
          { label: 'Open',                    value: inc.open,     icon: '🔴', color: '#ef4444' },
          { label: 'Resolved',                value: inc.resolved, icon: '✅', color: '#10b981' },
        ])}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Student Incidents by Type')}
            {inc.total === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No student incidents logged yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inc.typeCounts.map(({ type, count }) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '100px', flexShrink: 0 }}>{type}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / inc.maxTypeCount) * 100}%`, height: '100%', background: INCIDENT_TYPE_COLORS[type], borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#10b981' }}>✓ {inc.resolved} resolved</span>
                  <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>● {inc.open} open</span>
                </div>
              </div>
            )}
          </>)}

          {card(<>
            {cardTitle('Student Incidents — Last 6 Months')}
            {barChart(inc.monthCounts, inc.maxMonth, '#ef4444', 120)}
          </>)}
        </div>

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Open Student Incidents</h3>
            {inc.open > 0 && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{inc.open}</span>}
          </div>
          {inc.openList.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No open student incidents. All caught up! 🎉</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Student', 'Grade', 'Type', 'Date', 'Description', 'Reported By'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {inc.openList.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{i.student_name || '—'}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{i.student_grade || '—'}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '600', color: INCIDENT_TYPE_COLORS[i.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[i.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>{i.type}</span></td>
                      <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>{i.date || '—'}</td>
                      <td style={{ ...tdStyle, color: '#374151', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description || '—'}</td>
                      <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>{i.reported_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

      {/* ── Communications ── */}
      {r.activeTab === 'communications' && (<>
        {statCards([
          { label: 'Messages Sent',   value: r.messages.length,      icon: '✉️', color: '#8b5cf6' },
          { label: 'Parents Reached', value: comms.totalParentsReached, icon: '👪', color: '#ec4899' },
        ])}

        {card(<>
          {cardTitle('Messages Sent — Last 6 Months')}
          {r.messages.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No messages sent yet.</p> : barChart(comms.monthCounts, comms.maxMonth, '#8b5cf6')}
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          {cardTitle('Message History')}
          {r.messages.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No messages yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Subject', 'Recipients', 'Date', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[...r.messages].reverse().map(msg => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937' }}>{msg.subject}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{msg.recipient_count || 0} parents</td>
                      <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(msg.created_at).toLocaleDateString()}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', background: '#10b98118', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{msg.status || 'Sent'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

      {/* ── Staff ── */}
      {r.activeTab === 'staff' && (<>
        {statCards([
          { label: 'Total Staff', value: r.staff.length,      icon: '👩‍🏫', color: primaryColor },
          { label: 'Active',      value: sf.activeStaff.length,   icon: '✅',  color: '#10b981' },
          { label: 'Inactive',    value: sf.inactiveStaff.length, icon: '⏸️', color: '#9ca3af' },
          { label: 'Roles',       value: sf.distinctRoles,         icon: '🏷️', color: '#6366f1' },
        ])}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Active Staff by Role')}
            {sf.roleCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No active staff yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sf.roleCounts.map(({ role, count }) => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0 }}>{role}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / sf.maxRoleCount) * 100}%`, height: '100%', background: ROLE_COLORS[role] || primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {sf.divisions.length > 0 && card(<>
            {cardTitle('Staff by Division')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {sf.divisionStaffCounts.map(div => (
                <div key={div.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151', width: '140px', flexShrink: 0, fontWeight: '500' }}>{div.name}</span>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(div.count / sf.maxDivStaffCount) * 100}%`, height: '100%', background: div.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{div.count}</span>
                </div>
              ))}
            </div>
          </>)}
        </div>

        {sf.gradeCoverageEntries.length > 0 && card(<>
          {cardTitle('Staff Coverage by Grade')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sf.gradeCoverageEntries.map(([grade, count]) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{grade}</span>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / sf.maxGradeCoverage) * 100}%`, height: '100%', background: primaryColor, borderRadius: '9999px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Unassigned Active Staff</h3>
            {sf.unassignedStaff.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#f59e0b', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{sf.unassignedStaff.length}</span>}
          </div>
          {sf.unassignedStaff.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>All active staff have grade assignments. 🎉</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Name', 'Role', 'Email', 'Phone'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {sf.unassignedStaff.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{s.first_name} {s.last_name}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '600', color: ROLE_COLORS[s.role] || '#6b7280', background: (ROLE_COLORS[s.role] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>{s.role || '—'}</span></td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{s.email || '—'}</td>
                      <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>{s.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

      {/* ── Fundraising ── */}
      {r.activeTab === 'fundraising' && (<>
        {statCards([
          { label: 'Total Raised', value: fmt(fr.totalRaised),                                             icon: '💰', color: '#10b981' },
          { label: 'Campaigns',    value: r.workOrders.length > 0 ? fr.scoreboard.length : fr.scoreboard.length, icon: '🎯', color: primaryColor },
          { label: 'Goal Hit Rate', value: fr.goalHitRate !== null ? `${fr.goalHitRate}%` : '—',           icon: '🏆', color: '#f59e0b' },
          { label: 'Avg Gift',      value: fmt(fr.avgGift),                                                icon: '🎁', color: '#8b5cf6' },
        ])}

        {card(<>
          {cardTitle('Campaign Scoreboard')}
          {fr.scoreboard.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No campaigns yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {fr.scoreboard.map(c => {
                const color = CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280'
                const isCompleted = c.status === 'Completed'
                const hit    = isCompleted && c.goal > 0 && c.raised >= c.goal
                const missed = isCompleted && c.goal > 0 && c.raised < c.goal
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color, background: color + '18', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.type}</span>
                        {hit    && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981', background: '#10b98118', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>✓ Goal Hit</span>}
                        {missed && <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ef4444', background: '#ef444418', borderRadius: '9999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>✗ Missed</span>}
                        {c.status === 'Active' && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#10b981', whiteSpace: 'nowrap', flexShrink: 0 }}>● Active</span>}
                        {c.status === 'Paused' && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#f59e0b', whiteSpace: 'nowrap', flexShrink: 0 }}>⏸ Paused</span>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>{fmt(c.raised)}</span>
                        {c.goal > 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}> / {fmt(c.goal)}</span>}
                      </div>
                    </div>
                    {c.goal > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, c.pct)}%`, height: '100%', background: hit ? '#10b981' : missed ? '#ef4444' : color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', width: '36px', textAlign: 'right' }}>{c.pct}%</span>
                      </div>
                    ) : <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px' }} />}
                  </div>
                )
              })}
            </div>
          )}
        </>, { marginBottom: '1.5rem' })}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Monthly Donations — Last 12 Months')}
            {fr.donationMonthTotals.every(m => m.count === 0) ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donations yet.</p> : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '140px' }}>
                {fr.donationMonthTotals.map(m => {
                  const barH = m.count > 0 ? Math.max((m.count / fr.maxDonationMonth) * 100, 6) : 0
                  return (
                    <div key={m.label + m.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', height: '100%', justifyContent: 'flex-end' }}>
                      {m.count > 0 && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#374151' }}>{fmt(m.count)}</span>}
                      <div style={{ width: '100%', background: m.count > 0 ? '#10b981' : '#f3f4f6', borderRadius: '0.25rem 0.25rem 0 0', height: `${barH}%`, minHeight: '4px' }} />
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>)}

          {card(<>
            {cardTitle('Raised by Campaign Type')}
            {fr.typeEntries.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donation data yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {fr.typeEntries.map(([type, total]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '130px', flexShrink: 0 }}>{type}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(total / fr.maxTypeRaised) * 100}%`, height: '100%', background: CAMPAIGN_TYPE_COLORS[type] || '#6b7280', borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '72px', textAlign: 'right' }}>{fmt(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Completed Campaign History</h3>
            {fr.completedCampaigns.length > 0 && fr.goalHitRate !== null && (
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: fr.goalHitRate >= 75 ? '#10b981' : fr.goalHitRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.75rem' }}>
                {fr.hitGoal.length} of {fr.completedWithGoal.length} goals hit
              </span>
            )}
          </div>
          {fr.completedCampaigns.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No completed campaigns yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Campaign', 'Type', 'Goal', 'Raised', 'Result', 'Dates'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {fr.completedCampaigns.map(c => {
                    const raised = fr.getCampaignRaised(c.id)
                    const hit    = c.goal > 0 && raised >= c.goal
                    const pct    = c.goal > 0 ? Math.round((raised / c.goal) * 100) : null
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                        <td style={{ ...tdStyle, fontWeight: '600', color: '#1f2937' }}>{c.name}</td>
                        <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '600', color: CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280', background: (CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{c.type}</span></td>
                        <td style={{ ...tdStyle, color: '#6b7280' }}>{c.goal > 0 ? fmt(c.goal) : '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: '700', color: '#10b981' }}>{fmt(raised)}</td>
                        <td style={tdStyle}>
                          {c.goal > 0 ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: hit ? '#10b981' : '#ef4444', background: hit ? '#10b98118' : '#ef444418', borderRadius: '9999px', padding: '0.15rem 0.6rem', whiteSpace: 'nowrap' }}>
                              {hit ? `✓ Hit (${pct}%)` : `✗ ${pct}% of goal`}
                            </span>
                          ) : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No goal set</span>}
                        </td>
                        <td style={{ ...tdStyle, color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.end_date || c.start_date || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          {cardTitle('Event ROI')}
          {fr.eventROI.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No fundraising events yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Event', 'Type', 'Date', 'Gross Revenue', 'Expenses', 'Net'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {fr.eventROI.map(ev => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '600', color: '#1f2937' }}>{ev.name}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{ev.type}</td>
                      <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>{ev.date || '—'}</td>
                      <td style={{ ...tdStyle, color: '#374151', fontWeight: '500' }}>{fmt(ev.gross)}</td>
                      <td style={{ ...tdStyle, color: ev.expenses > 0 ? '#ef4444' : '#9ca3af' }}>{ev.expenses > 0 ? fmt(ev.expenses) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: ev.net >= 0 ? '#10b981' : '#ef4444' }}>{fmt(ev.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

      {/* ── Facilities ── */}
      {r.activeTab === 'facilities' && (<>
        {statCards([
          { label: 'Total Work Orders',       value: r.workOrders.length,          icon: '🔧', color: '#6b7280' },
          { label: 'Open',                    value: fac.openWOs.length,           icon: '📂', color: '#3b82f6' },
          { label: 'In Progress',             value: fac.inProgressWOs.length,     icon: '⚙️', color: '#f59e0b' },
          { label: 'Overdue',                 value: fac.overdueWOs.length,        icon: '⚠️', color: '#ef4444' },
          { label: 'Completed This Month',    value: fac.completedThisMonth.length, icon: '✅', color: '#10b981' },
          { label: 'Avg Resolution (days)',   value: fac.avgDays !== null ? fac.avgDays : '—', icon: '📅', color: '#8b5cf6' },
        ])}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Work Orders by Category')}
            {fac.catCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No work orders yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {fac.catCounts.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', width: '110px', flexShrink: 0 }}>{c.label}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(c.count / fac.maxCatCount) * 100}%`, height: '100%', background: c.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {card(<>
            {cardTitle('Work Orders by Status')}
            {fac.statusCounts.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No work orders yet.</p> : (<>
              <div style={{ display: 'flex', height: '16px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                {fac.statusCounts.map(s => {
                  const pct = r.workOrders.length > 0 ? (s.count / r.workOrders.length) * 100 : 0
                  return pct > 0 ? <div key={s.label} style={{ width: `${pct}%`, background: s.color }} title={`${s.label}: ${s.count}`} /> : null
                })}
              </div>
              {fac.statusCounts.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{s.count}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '36px', textAlign: 'right' }}>{Math.round((s.count / r.workOrders.length) * 100)}%</span>
                  </div>
                </div>
              ))}
            </>)}
          </>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {card(<>
            {cardTitle('Work Orders Opened — Last 6 Months')}
            {barChart(fac.woMonthCounts, fac.maxWoMonth, '#0ea5e9')}
          </>)}

          {card(<>
            {cardTitle('Open & In-Progress by Priority')}
            {fac.priorityCounts.every(p => p.count === 0) ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No active work orders.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {fac.priorityCounts.map(p => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: p.color, width: '70px', flexShrink: 0 }}>{p.label}</span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(p.count / fac.maxPriCount) * 100}%`, height: '100%', background: p.color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1f2937', width: '24px', textAlign: 'right' }}>{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>

        {fac.workloadEntries.length > 0 && card(<>
          {cardTitle('Active Work Orders by Assignee')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fac.workloadEntries.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', width: '160px', flexShrink: 0 }}>{name}</span>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / fac.maxWorkload) * 100}%`, height: '100%', background: '#0ea5e9', borderRadius: '9999px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', width: '24px', textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </>, { marginBottom: '1.5rem' })}

        {fac.costByCat.length > 0 && card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Cost Summary by Category</h3>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>Est: <strong style={{ color: '#374151' }}>{fmt(fac.totalEst)}</strong></span>
              <span style={{ color: '#6b7280' }}>Actual: <strong style={{ color: fac.totalActual > fac.totalEst ? '#ef4444' : '#10b981' }}>{fmt(fac.totalActual)}</strong></span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Category', 'Est. Cost', 'Actual Cost', 'Variance'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {fac.costByCat.map(c => {
                  const variance = c.actual - c.est
                  return (
                    <tr key={c.cat} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} /><span style={{ fontWeight: '500', color: '#1f2937' }}>{c.cat}</span></div></td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{c.est > 0 ? fmt(c.est) : '—'}</td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{c.actual > 0 ? fmt(c.actual) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: variance > 0 ? '#ef4444' : variance < 0 ? '#10b981' : '#9ca3af' }}>
                        {c.est > 0 && c.actual > 0 ? (variance > 0 ? `+${fmt(variance)}` : variance < 0 ? `-${fmt(Math.abs(variance))}` : '—') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Overdue Work Orders</h3>
            {fac.overdueWOs.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#ef4444', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{fac.overdueWOs.length}</span>}
          </div>
          {fac.overdueWOs.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No overdue work orders. All caught up! 🎉</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Title', 'Category', 'Location', 'Priority', 'Status', 'Due Date', 'Assigned To'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[...fac.overdueWOs].sort((a, b) => a.due_date.localeCompare(b.due_date)).map(wo => (
                    <tr key={wo.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{wo.category}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{wo.location || '—'}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '700', color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.priority}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '600', color: WO_STATUS_COLORS[wo.status], background: WO_STATUS_COLORS[wo.status] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.status}</span></td>
                      <td style={{ ...tdStyle, color: '#ef4444', fontWeight: '600', whiteSpace: 'nowrap' }}>{wo.due_date}</td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>, { marginBottom: '1.5rem' })}

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>All Open Work Orders</h3>
            {fac.openWOs.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#3b82f6', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{fac.openWOs.length}</span>}
          </div>
          {fac.openWOs.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No open work orders.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Title', 'Category', 'Location', 'Priority', 'Submitted By', 'Assigned To', 'Opened'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {fac.openWOs.map(wo => (
                    <tr key={wo.id} style={{ borderBottom: '1px solid #f9fafb' }} {...trHover}>
                      <td style={{ ...tdStyle, fontWeight: '500', color: '#1f2937', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{wo.category}</td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{wo.location || '—'}</td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: '700', color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{wo.priority}</span></td>
                      <td style={{ ...tdStyle, color: '#6b7280' }}>{wo.submitted_by || '—'}</td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{wo.assigned_to || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                      <td style={{ ...tdStyle, color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(wo.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </>)}

    </div>
  )
}
