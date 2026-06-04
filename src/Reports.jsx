import {
  Backpack, CheckCircle, ClipboardList, Calendar, XCircle, Clock,
  AlertTriangle, Users, GraduationCap, PauseCircle, DollarSign,
  Target, Trophy, Gift, FolderOpen, Settings2, Wrench, Check, X, Mail, BarChart3,
} from 'lucide-react'
import { useReports } from './hooks/useReports'

const REPORT_ICON_MAP = {
  Backpack, CheckCircle, ClipboardList, Calendar, XCircle, Clock,
  AlertTriangle, Users, GraduationCap, PauseCircle, DollarSign,
  Target, Trophy, Gift, FolderOpen, Settings2, Wrench, Mail,
}
import {
  TABS, ATTENDANCE_STATUS_COLORS, STUDENT_STATUS_COLORS,
  INCIDENT_TYPE_COLORS, ROLE_COLORS, WO_PRIORITY_COLORS, WO_STATUS_COLORS,
  CAMPAIGN_TYPE_COLORS, fmt,
} from './domain/reports'

// ── Shared render helpers ─────────────────────────────────────────────────────

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm ${className}`}>{children}</div>
)
const CardTitle = ({ children }) => (
  <h3 className="text-base font-bold text-gray-800 mt-0 mb-5">{children}</h3>
)
const thCls = 'text-left px-3 py-2 text-gray-500 font-semibold text-xs whitespace-nowrap'
const tdCls = 'px-3 py-2.5'

function StatCards({ stats }) {
  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
          <span className="font-semibold text-gray-800">{s.value}</span>
          <span className="text-gray-500 text-sm">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function BarChart({ data, maxVal, color, height = 140 }) {
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map(m => {
        const barH = m.count > 0 ? Math.max((m.count / maxVal) * 100, 8) : 0
        return (
          <div key={m.label + m.year} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-semibold text-gray-700">{m.count > 0 ? m.count : ''}</span>
            <div className="w-full rounded-t-md transition-all" style={{ background: m.count > 0 ? color : '#f3f4f6', height: `${barH}%`, minHeight: 4 }} />
            <span className="text-[0.7rem] text-gray-400">{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function HBar({ count, maxCount, color }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, background: color }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Reports({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const r = useReports(user, school)

  if (r.loading) return <div className="p-8 text-gray-500">Loading reports...</div>

  const { enrollment: en, divEnroll, enrollMonths, attendance: att, incidents: inc,
          comms, staffStats: sf, fundraising: fr, facilities: fac } = r

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><BarChart3 size={22} style={{ color: primaryColor }} />Report Dashboards</h2>
        <p className="text-gray-500 mt-1 mb-0">School activity and analytics</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-7 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => r.setActiveTab(tab.id)}
            className="px-5 py-2 rounded-lg border-0 cursor-pointer text-sm transition-all"
            style={{ fontWeight: r.activeTab === tab.id ? '600' : '400', background: r.activeTab === tab.id ? primaryColor : 'transparent', color: r.activeTab === tab.id ? 'white' : '#6b7280' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Enrollment ── */}
      {r.activeTab === 'enrollment' && (<>
        <StatCards stats={[
          { label: 'Total Students', value: en.total,      icon: 'Backpack',      color: primaryColor },
          { label: 'Enrolled',       value: en.enrolled,   icon: 'CheckCircle',   color: '#10b981' },
          { label: 'Applied',        value: en.applied,    icon: 'ClipboardList', color: '#3b82f6' },
          { label: 'Waitlisted',     value: en.waitlisted, icon: '⏳', color: '#f59e0b' },
        ]} />

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Enrollment Status</CardTitle>
            {en.total === 0 ? <p className="text-gray-400 text-sm">No students yet.</p> : (<>
              <div className="flex h-5 rounded-full overflow-hidden mb-5 bg-gray-100">
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
                  <div key={status} className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: STUDENT_STATUS_COLORS[status] }} />
                      <span className="text-sm text-gray-700">{status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">{count}</span>
                      <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </>)}
          </Card>

          <Card>
            <CardTitle>Capacity Utilization</CardTitle>
            {en.capacityPct === null ? (
              <div>
                <p className="text-gray-400 text-sm mb-4">No capacity set. Add your student capacity in Settings.</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-gray-800">{en.enrolled}</div>
                  <div className="text-gray-500 text-sm">enrolled students</div>
                </div>
              </div>
            ) : (<>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <span className="text-4xl font-bold" style={{ color: en.capacityPct >= 90 ? '#ef4444' : en.capacityPct >= 70 ? '#f59e0b' : '#10b981' }}>{en.capacityPct}%</span>
                  <span className="text-gray-500 text-sm ml-2">full</span>
                </div>
                <span className="text-gray-500 text-sm">{en.enrolled} / {en.capacity} seats</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${en.capacityPct}%`, background: en.capacityPct >= 90 ? '#ef4444' : en.capacityPct >= 70 ? '#f59e0b' : '#10b981' }} />
              </div>
              <p className="text-gray-500 text-xs mt-3">{en.capacity - en.enrolled} seat{en.capacity - en.enrolled !== 1 ? 's' : ''} remaining</p>
            </>)}
          </Card>
        </div>

        <Card className="mb-6">
          <CardTitle>New Students — Last 6 Months</CardTitle>
          <BarChart data={enrollMonths.counts} maxVal={enrollMonths.max} color={primaryColor} />
        </Card>

        {divEnroll && (
          <Card className="mb-6">
            <CardTitle>Students by Division</CardTitle>
            <div className="flex flex-col gap-3.5">
              {divEnroll.stats.map(div => (
                <div key={div.name} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-36 shrink-0 font-medium">{div.name}</span>
                  <HBar count={div.count} maxCount={divEnroll.maxCount} color={div.color} />
                  <span className="text-sm font-semibold text-gray-800 w-6 text-right">{div.count}</span>
                  <span className="text-xs font-medium w-20" style={{ color: div.color }}>{div.enrolledCount} enrolled</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <CardTitle>Students by Grade</CardTitle>
          {en.gradeEntries.length === 0 ? <p className="text-gray-400 text-sm">No grade data yet.</p> : (
            <div className="flex flex-col gap-3">
              {en.gradeEntries.map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-28 shrink-0">{grade}</span>
                  <HBar count={count} maxCount={en.maxGradeCount} color={primaryColor} />
                  <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </>)}

      {/* ── Attendance ── */}
      {r.activeTab === 'attendance' && (<>
        <StatCards stats={[
          { label: 'Total Records',     value: att.total,                                                      icon: 'Calendar',      color: '#3b82f6' },
          { label: 'Present Rate',      value: att.presentRate !== null ? `${att.presentRate}%` : '—',         icon: 'CheckCircle',   color: '#10b981' },
          { label: 'Absences',          value: att.absent,                                                     icon: 'XCircle',       color: '#ef4444' },
          { label: 'Tardies',           value: att.tardy,                                                      icon: 'Clock',         color: '#f59e0b' },
          { label: 'Chronic Absentees', value: att.chronic.length, icon: 'AlertTriangle', color: att.chronic.length > 0 ? '#ef4444' : '#10b981' },
        ]} />

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Absences &amp; Tardies — Last 6 Months</CardTitle>
            {att.total === 0 ? <p className="text-gray-400 text-sm">No attendance records yet.</p> : <BarChart data={att.absenceMonthCounts} maxVal={att.maxAbsenceMonth} color="#3b82f6" />}
          </Card>
          <Card>
            <CardTitle>Attendance Breakdown</CardTitle>
            {att.total === 0 ? <p className="text-gray-400 text-sm">No attendance records yet.</p> : (() => {
              const counts = { Present: att.present, Absent: att.absent, Tardy: att.tardy, Excused: att.total - att.present - att.absent - att.tardy }
              return (<>
                <div className="flex h-4 rounded-full overflow-hidden mb-5 bg-gray-100">
                  {['Present','Absent','Tardy','Excused'].map(status => {
                    const c = counts[status] || 0
                    const pct = att.total > 0 ? (c / att.total) * 100 : 0
                    return pct > 0 ? <div key={status} style={{ width: `${pct}%`, background: ATTENDANCE_STATUS_COLORS[status] }} title={`${status}: ${c}`} /> : null
                  })}
                </div>
                {['Present','Absent','Tardy','Excused'].map(status => {
                  const c = counts[status] || 0
                  const pct = att.total > 0 ? Math.round((c / att.total) * 100) : 0
                  return (
                    <div key={status} className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ATTENDANCE_STATUS_COLORS[status] }} />
                        <span className="text-sm text-gray-700">{status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">{c}</span>
                        <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </>)
            })()}
          </Card>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">Chronic Absentees</h3>
            <span className="text-xs text-gray-500">Students with &gt;10% non-present rate (min. 5 days recorded)</span>
          </div>
          {att.chronic.length === 0 ? <p className="text-gray-400 text-sm">No chronic absentees. Great attendance! 🎉</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Student','Grade','Days Recorded','Non-Present','Rate'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {att.chronic.map((s, i) => {
                    const rate = Math.round((s.absent / s.total) * 100)
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className={`${tdCls} font-medium text-gray-800`}>{s.name}</td>
                        <td className={`${tdCls} text-gray-500`}>{s.grade || '—'}</td>
                        <td className={`${tdCls} text-gray-700`}>{s.total}</td>
                        <td className={`${tdCls} text-red-500 font-semibold`}>{s.absent}</td>
                        <td className={tdCls}><span className="text-xs font-bold rounded-full px-2.5 py-0.5" style={{ color: rate >= 20 ? '#ef4444' : '#f59e0b', background: rate >= 20 ? '#ef444418' : '#f59e0b18' }}>{rate}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

      {/* ── Incidents ── */}
      {r.activeTab === 'incidents' && (<>
        <StatCards stats={[
          { label: 'Total Student Incidents', value: inc.total,    icon: 'ClipboardList', color: '#6b7280' },
          { label: 'Open',                    value: inc.open,     icon: 'XCircle',       color: '#ef4444' },
          { label: 'Resolved',                value: inc.resolved, icon: 'CheckCircle',   color: '#10b981' },
        ]} />
        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Student Incidents by Type</CardTitle>
            {inc.total === 0 ? <p className="text-gray-400 text-sm">No student incidents logged yet.</p> : (
              <div className="flex flex-col gap-3">
                {inc.typeCounts.map(({ type, count }) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-24 shrink-0">{type}</span>
                    <HBar count={count} maxCount={inc.maxTypeCount} color={INCIDENT_TYPE_COLORS[type]} />
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 mt-1 flex gap-6">
                  <span className="text-xs text-green-600 flex items-center gap-0.5"><Check size={11} />{inc.resolved} resolved</span>
                  <span className="text-xs text-red-500 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{inc.open} open</span>
                </div>
              </div>
            )}
          </Card>
          <Card>
            <CardTitle>Student Incidents — Last 6 Months</CardTitle>
            <BarChart data={inc.monthCounts} maxVal={inc.maxMonth} color="#ef4444" height={120} />
          </Card>
        </div>
        <Card>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">Open Student Incidents</h3>
            {inc.open > 0 && <span className="text-xs font-semibold text-white bg-red-500 rounded-full px-2.5 py-0.5">{inc.open}</span>}
          </div>
          {inc.openList.length === 0 ? <p className="text-gray-400 text-sm">No open student incidents. All caught up! 🎉</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Student','Grade','Type','Date','Description','Reported By'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {inc.openList.map(i => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-medium text-gray-800 whitespace-nowrap`}>{i.student_name || '—'}</td>
                      <td className={`${tdCls} text-gray-500`}>{i.student_grade || '—'}</td>
                      <td className={tdCls}><span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ color: INCIDENT_TYPE_COLORS[i.type] || '#6b7280', background: (INCIDENT_TYPE_COLORS[i.type] || '#6b7280') + '18' }}>{i.type}</span></td>
                      <td className={`${tdCls} text-gray-500 whitespace-nowrap`}>{i.date || '—'}</td>
                      <td className={`${tdCls} text-gray-700 max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap`}>{i.description || '—'}</td>
                      <td className={`${tdCls} text-gray-500 whitespace-nowrap`}>{i.reported_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

      {/* ── Communications ── */}
      {r.activeTab === 'communications' && (<>
        <StatCards stats={[
          { label: 'Messages Sent',   value: r.messages.length,         icon: 'Mail',  color: '#8b5cf6' },
          { label: 'Parents Reached', value: comms.totalParentsReached,  icon: 'Users', color: '#ec4899' },
        ]} />
        <Card className="mb-6">
          <CardTitle>Messages Sent — Last 6 Months</CardTitle>
          {r.messages.length === 0 ? <p className="text-gray-400 text-sm">No messages sent yet.</p> : <BarChart data={comms.monthCounts} maxVal={comms.maxMonth} color="#8b5cf6" />}
        </Card>
        <Card>
          <CardTitle>Message History</CardTitle>
          {r.messages.length === 0 ? <p className="text-gray-400 text-sm">No messages yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Subject','Recipients','Date','Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {[...r.messages].reverse().map(msg => (
                    <tr key={msg.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-medium text-gray-800`}>{msg.subject}</td>
                      <td className={`${tdCls} text-gray-500`}>{msg.recipient_count || 0} parents</td>
                      <td className={`${tdCls} text-gray-500 whitespace-nowrap`}>{new Date(msg.created_at).toLocaleDateString()}</td>
                      <td className={tdCls}><span className="text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5">{msg.status || 'Sent'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

      {/* ── Staff ── */}
      {r.activeTab === 'staff' && (<>
        <StatCards stats={[
          { label: 'Total Staff', value: r.staff.length,           icon: 'GraduationCap', color: primaryColor },
          { label: 'Active',      value: sf.activeStaff.length,    icon: 'CheckCircle',   color: '#10b981' },
          { label: 'Inactive',    value: sf.inactiveStaff.length,  icon: 'PauseCircle',   color: '#9ca3af' },
          { label: 'Roles',       value: sf.distinctRoles,          icon: 'Users',  color: '#6366f1' },
        ]} />
        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Active Staff by Role</CardTitle>
            {sf.roleCounts.length === 0 ? <p className="text-gray-400 text-sm">No active staff yet.</p> : (
              <div className="flex flex-col gap-3">
                {sf.roleCounts.map(({ role, count }) => (
                  <div key={role} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-36 shrink-0">{role}</span>
                    <HBar count={count} maxCount={sf.maxRoleCount} color={ROLE_COLORS[role] || primaryColor} />
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {sf.divisions.length > 0 && (
            <Card>
              <CardTitle>Staff by Division</CardTitle>
              <div className="flex flex-col gap-3.5">
                {sf.divisionStaffCounts.map(div => (
                  <div key={div.name} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-36 shrink-0 font-medium">{div.name}</span>
                    <HBar count={div.count} maxCount={sf.maxDivStaffCount} color={div.color} />
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right">{div.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        {sf.gradeCoverageEntries.length > 0 && (
          <Card className="mb-6">
            <CardTitle>Staff Coverage by Grade</CardTitle>
            <div className="flex flex-col gap-3">
              {sf.gradeCoverageEntries.map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-28 shrink-0">{grade}</span>
                  <HBar count={count} maxCount={sf.maxGradeCoverage} color={primaryColor} />
                  <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">Unassigned Active Staff</h3>
            {sf.unassignedStaff.length > 0 && <span className="text-xs font-semibold text-white bg-amber-400 rounded-full px-2.5 py-0.5">{sf.unassignedStaff.length}</span>}
          </div>
          {sf.unassignedStaff.length === 0 ? <p className="text-gray-400 text-sm">All active staff have grade assignments. 🎉</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Name','Role','Email','Phone'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {sf.unassignedStaff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-medium text-gray-800 whitespace-nowrap`}>{s.first_name} {s.last_name}</td>
                      <td className={tdCls}><span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ color: ROLE_COLORS[s.role] || '#6b7280', background: (ROLE_COLORS[s.role] || '#6b7280') + '18' }}>{s.role || '—'}</span></td>
                      <td className={`${tdCls} text-gray-500`}>{s.email || '—'}</td>
                      <td className={`${tdCls} text-gray-500 whitespace-nowrap`}>{s.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

      {/* ── Fundraising ── */}
      {r.activeTab === 'fundraising' && (<>
        <StatCards stats={[
          { label: 'Total Raised',  value: fmt(fr.totalRaised),                                  icon: 'DollarSign', color: '#10b981' },
          { label: 'Campaigns',     value: fr.scoreboard.length,                                  icon: 'Target',     color: primaryColor },
          { label: 'Goal Hit Rate', value: fr.goalHitRate !== null ? `${fr.goalHitRate}%` : '—', icon: 'Trophy',     color: '#f59e0b' },
          { label: 'Avg Gift',      value: fmt(fr.avgGift),                                       icon: 'Gift',       color: '#8b5cf6' },
        ]} />

        <Card className="mb-6">
          <CardTitle>Campaign Scoreboard</CardTitle>
          {fr.scoreboard.length === 0 ? <p className="text-gray-400 text-sm">No campaigns yet.</p> : (
            <div className="flex flex-col gap-3.5">
              {fr.scoreboard.map(c => {
                const color = CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280'
                const isCompleted = c.status === 'Completed'
                const hit    = isCompleted && c.goal > 0 && c.raised >= c.goal
                const missed = isCompleted && c.goal > 0 && c.raised < c.goal
                return (
                  <div key={c.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate">{c.name}</span>
                        <span className="text-[0.68rem] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0" style={{ color, background: color + '18' }}>{c.type}</span>
                        {hit    && <span className="text-[0.68rem] font-bold text-green-600 bg-green-50 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 flex items-center gap-0.5"><Check size={10} />Goal Hit</span>}
                        {missed && <span className="text-[0.68rem] font-bold text-red-500 bg-red-50 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 flex items-center gap-0.5"><X size={10} />Missed</span>}
                        {c.status === 'Active' && <span className="text-[0.68rem] font-semibold text-green-600 whitespace-nowrap shrink-0 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Active</span>}
                        {c.status === 'Paused' && <span className="text-[0.68rem] font-semibold text-amber-500 whitespace-nowrap shrink-0 flex items-center gap-0.5"><PauseCircle size={10} />Paused</span>}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="text-sm font-bold text-green-600">{fmt(c.raised)}</span>
                        {c.goal > 0 && <span className="text-xs text-gray-400"> / {fmt(c.goal)}</span>}
                      </div>
                    </div>
                    {c.goal > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, c.pct)}%`, background: hit ? '#10b981' : missed ? '#ef4444' : color }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-9 text-right">{c.pct}%</span>
                      </div>
                    ) : <div className="bg-gray-100 rounded-full h-2" />}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Monthly Donations — Last 12 Months</CardTitle>
            {fr.donationMonthTotals.every(m => m.count === 0) ? <p className="text-gray-400 text-sm">No donations yet.</p> : (
              <div className="flex items-end gap-1.5 h-36">
                {fr.donationMonthTotals.map(m => {
                  const barH = m.count > 0 ? Math.max((m.count / fr.maxDonationMonth) * 100, 6) : 0
                  return (
                    <div key={m.label + m.year} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      {m.count > 0 && <span className="text-[0.65rem] font-semibold text-gray-700">{fmt(m.count)}</span>}
                      <div className="w-full rounded-t" style={{ background: m.count > 0 ? '#10b981' : '#f3f4f6', height: `${barH}%`, minHeight: 4 }} />
                      <span className="text-[0.65rem] text-gray-400">{m.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
          <Card>
            <CardTitle>Raised by Campaign Type</CardTitle>
            {fr.typeEntries.length === 0 ? <p className="text-gray-400 text-sm">No donation data yet.</p> : (
              <div className="flex flex-col gap-3">
                {fr.typeEntries.map(([type, total]) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-32 shrink-0">{type}</span>
                    <HBar count={total} maxCount={fr.maxTypeRaised} color={CAMPAIGN_TYPE_COLORS[type] || '#6b7280'} />
                    <span className="text-sm font-semibold text-gray-800 w-20 text-right">{fmt(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">Completed Campaign History</h3>
            {fr.completedCampaigns.length > 0 && fr.goalHitRate !== null && (
              <span className="text-xs font-semibold text-white rounded-full px-3 py-0.5" style={{ background: fr.goalHitRate >= 75 ? '#10b981' : fr.goalHitRate >= 50 ? '#f59e0b' : '#ef4444' }}>
                {fr.hitGoal.length} of {fr.completedWithGoal.length} goals hit
              </span>
            )}
          </div>
          {fr.completedCampaigns.length === 0 ? <p className="text-gray-400 text-sm">No completed campaigns yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Campaign','Type','Goal','Raised','Result','Dates'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {fr.completedCampaigns.map(c => {
                    const raised = fr.getCampaignRaised(c.id)
                    const hit    = c.goal > 0 && raised >= c.goal
                    const pct    = c.goal > 0 ? Math.round((raised / c.goal) * 100) : null
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className={`${tdCls} font-semibold text-gray-800`}>{c.name}</td>
                        <td className={tdCls}><span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280', background: (CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280') + '18' }}>{c.type}</span></td>
                        <td className={`${tdCls} text-gray-500`}>{c.goal > 0 ? fmt(c.goal) : '—'}</td>
                        <td className={`${tdCls} font-bold text-green-600`}>{fmt(raised)}</td>
                        <td className={tdCls}>
                          {c.goal > 0
                            ? <span className="text-xs font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap flex items-center gap-0.5" style={{ color: hit ? '#10b981' : '#ef4444', background: hit ? '#10b98118' : '#ef444418' }}>{hit ? <><Check size={11} />Hit ({pct}%)</> : <><X size={11} />{pct}% of goal</>}</span>
                            : <span className="text-xs text-gray-400">No goal set</span>}
                        </td>
                        <td className={`${tdCls} text-gray-400 text-xs whitespace-nowrap`}>{c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.end_date || c.start_date || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Event ROI</CardTitle>
          {fr.eventROI.length === 0 ? <p className="text-gray-400 text-sm">No fundraising events yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Event','Type','Date','Gross Revenue','Expenses','Net'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {fr.eventROI.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-semibold text-gray-800`}>{ev.name}</td>
                      <td className={`${tdCls} text-gray-500`}>{ev.type}</td>
                      <td className={`${tdCls} text-gray-500 whitespace-nowrap`}>{ev.date || '—'}</td>
                      <td className={`${tdCls} text-gray-700 font-medium`}>{fmt(ev.gross)}</td>
                      <td className={`${tdCls}`} style={{ color: ev.expenses > 0 ? '#ef4444' : '#9ca3af' }}>{ev.expenses > 0 ? fmt(ev.expenses) : '—'}</td>
                      <td className={`${tdCls} font-bold`} style={{ color: ev.net >= 0 ? '#10b981' : '#ef4444' }}>{fmt(ev.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

      {/* ── Facilities ── */}
      {r.activeTab === 'facilities' && (<>
        <StatCards stats={[
          { label: 'Total Work Orders',     value: r.workOrders.length,           icon: 'Wrench',       color: '#6b7280' },
          { label: 'Open',                  value: fac.openWOs.length,            icon: 'FolderOpen',   color: '#3b82f6' },
          { label: 'In Progress',           value: fac.inProgressWOs.length,      icon: 'Settings2',    color: '#f59e0b' },
          { label: 'Overdue',               value: fac.overdueWOs.length,         icon: 'AlertTriangle',color: '#ef4444' },
          { label: 'Completed This Month',  value: fac.completedThisMonth.length, icon: 'CheckCircle',  color: '#10b981' },
          { label: 'Avg Resolution (days)', value: fac.avgDays !== null ? fac.avgDays : '—', icon: 'Calendar', color: '#8b5cf6' },
        ]} />

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Work Orders by Category</CardTitle>
            {fac.catCounts.length === 0 ? <p className="text-gray-400 text-sm">No work orders yet.</p> : (
              <div className="flex flex-col gap-3">
                {fac.catCounts.map(c => (
                  <div key={c.label} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-28 shrink-0">{c.label}</span>
                    <HBar count={c.count} maxCount={fac.maxCatCount} color={c.color} />
                    <span className="text-sm font-semibold text-gray-800 w-6 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <CardTitle>Work Orders by Status</CardTitle>
            {fac.statusCounts.length === 0 ? <p className="text-gray-400 text-sm">No work orders yet.</p> : (<>
              <div className="flex h-4 rounded-full overflow-hidden mb-5 bg-gray-100">
                {fac.statusCounts.map(s => {
                  const pct = r.workOrders.length > 0 ? (s.count / r.workOrders.length) * 100 : 0
                  return pct > 0 ? <div key={s.label} style={{ width: `${pct}%`, background: s.color }} title={`${s.label}: ${s.count}`} /> : null
                })}
              </div>
              {fac.statusCounts.map(s => (
                <div key={s.label} className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-sm font-semibold text-gray-800">{s.count}</span>
                    <span className="text-xs text-gray-400 w-9 text-right">{Math.round((s.count / r.workOrders.length) * 100)}%</span>
                  </div>
                </div>
              ))}
            </>)}
          </Card>
        </div>

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          <Card>
            <CardTitle>Work Orders Opened — Last 6 Months</CardTitle>
            <BarChart data={fac.woMonthCounts} maxVal={fac.maxWoMonth} color="#0ea5e9" />
          </Card>
          <Card>
            <CardTitle>Open &amp; In-Progress by Priority</CardTitle>
            {fac.priorityCounts.every(p => p.count === 0) ? <p className="text-gray-400 text-sm">No active work orders.</p> : (
              <div className="flex flex-col gap-3.5">
                {fac.priorityCounts.map(p => (
                  <div key={p.label} className="flex items-center gap-4">
                    <span className="text-sm font-semibold w-16 shrink-0" style={{ color: p.color }}>{p.label}</span>
                    <HBar count={p.count} maxCount={fac.maxPriCount} color={p.color} />
                    <span className="text-sm font-bold text-gray-800 w-6 text-right">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {fac.workloadEntries.length > 0 && (
          <Card className="mb-6">
            <CardTitle>Active Work Orders by Assignee</CardTitle>
            <div className="flex flex-col gap-3">
              {fac.workloadEntries.map(([name, count]) => (
                <div key={name} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-40 shrink-0">{name}</span>
                  <HBar count={count} maxCount={fac.maxWorkload} color="#0ea5e9" />
                  <span className="text-sm font-semibold text-gray-800 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {fac.costByCat.length > 0 && (
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-gray-800 m-0">Cost Summary by Category</h3>
              <div className="flex gap-6 text-sm">
                <span className="text-gray-500">Est: <strong className="text-gray-700">{fmt(fac.totalEst)}</strong></span>
                <span className="text-gray-500">Actual: <strong style={{ color: fac.totalActual > fac.totalEst ? '#ef4444' : '#10b981' }}>{fmt(fac.totalActual)}</strong></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Category','Est. Cost','Actual Cost','Variance'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {fac.costByCat.map(c => {
                    const variance = c.actual - c.est
                    return (
                      <tr key={c.cat} className="hover:bg-gray-50">
                        <td className={tdCls}><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: c.color }} /><span className="font-medium text-gray-800">{c.cat}</span></div></td>
                        <td className={`${tdCls} text-gray-700`}>{c.est > 0 ? fmt(c.est) : '—'}</td>
                        <td className={`${tdCls} text-gray-700`}>{c.actual > 0 ? fmt(c.actual) : '—'}</td>
                        <td className={`${tdCls} font-semibold`} style={{ color: variance > 0 ? '#ef4444' : variance < 0 ? '#10b981' : '#9ca3af' }}>
                          {c.est > 0 && c.actual > 0 ? (variance > 0 ? `+${fmt(variance)}` : variance < 0 ? `-${fmt(Math.abs(variance))}` : '—') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">Overdue Work Orders</h3>
            {fac.overdueWOs.length > 0 && <span className="text-xs font-semibold text-white bg-red-500 rounded-full px-2.5 py-0.5">{fac.overdueWOs.length}</span>}
          </div>
          {fac.overdueWOs.length === 0 ? <p className="text-gray-400 text-sm">No overdue work orders. All caught up! 🎉</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Title','Category','Location','Priority','Status','Due Date','Assigned To'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {[...fac.overdueWOs].sort((a, b) => a.due_date.localeCompare(b.due_date)).map(wo => (
                    <tr key={wo.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-medium text-gray-800 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>{wo.title}</td>
                      <td className={`${tdCls} text-gray-500`}>{wo.category}</td>
                      <td className={`${tdCls} text-gray-500`}>{wo.location || '—'}</td>
                      <td className={tdCls}><span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18' }}>{wo.priority}</span></td>
                      <td className={tdCls}><span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: WO_STATUS_COLORS[wo.status], background: WO_STATUS_COLORS[wo.status] + '18' }}>{wo.status}</span></td>
                      <td className={`${tdCls} text-red-500 font-semibold whitespace-nowrap`}>{wo.due_date}</td>
                      <td className={`${tdCls} text-gray-700`}>{wo.assigned_to || <span className="text-gray-400">Unassigned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-800 m-0">All Open Work Orders</h3>
            {fac.openWOs.length > 0 && <span className="text-xs font-semibold text-white bg-blue-500 rounded-full px-2.5 py-0.5">{fac.openWOs.length}</span>}
          </div>
          {fac.openWOs.length === 0 ? <p className="text-gray-400 text-sm">No open work orders.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b-2 border-gray-100">{['Title','Category','Location','Priority','Submitted By','Assigned To','Opened'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {fac.openWOs.map(wo => (
                    <tr key={wo.id} className="hover:bg-gray-50">
                      <td className={`${tdCls} font-medium text-gray-800 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>{wo.title}</td>
                      <td className={`${tdCls} text-gray-500`}>{wo.category}</td>
                      <td className={`${tdCls} text-gray-500`}>{wo.location || '—'}</td>
                      <td className={tdCls}><span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: WO_PRIORITY_COLORS[wo.priority], background: WO_PRIORITY_COLORS[wo.priority] + '18' }}>{wo.priority}</span></td>
                      <td className={`${tdCls} text-gray-500`}>{wo.submitted_by || '—'}</td>
                      <td className={`${tdCls} text-gray-700`}>{wo.assigned_to || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className={`${tdCls} text-gray-400 whitespace-nowrap`}>{new Date(wo.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>)}

    </div>
  )
}
