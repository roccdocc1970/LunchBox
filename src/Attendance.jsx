import { Calendar, Backpack, ClipboardList, ClipboardCheck } from 'lucide-react'
import { useAttendance } from './hooks/useAttendance'
import { STATUSES, ATTENDANCE_STATUS_COLORS } from './domain/attendance'

export default function Attendance({ user, school, schoolId: schoolIdProp = null, gradeFilter = null }) {
  const primaryColor = school?.primary_color || '#f97316'
  const schoolId = schoolIdProp || user.id

  const {
    availableGrades,
    activeTab, setActiveTab,
    selectedDate, setSelectedDate,
    selectedGrade, setSelectedGrade,
    students, attendance,
    loadingStudents, saving, saveMessage,
    summary,
    setStudentStatus, setStudentNotes,
    save,
    history, loadingHistory,
    historyDate, setHistoryDate,
    historyGrade, setHistoryGrade,
    historyStatus, setHistoryStatus,
    clearHistoryFilters,
  } = useAttendance(schoolId, school, gradeFilter)

  const filterCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer bg-white'

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><ClipboardCheck size={22} style={{ color: primaryColor }} />Attendance</h2>
        <p className="text-gray-500 mt-1 mb-0">Daily attendance tracking</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-7 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ id: 'take', label: 'Take Attendance' }, { id: 'history', label: 'History' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2 rounded-lg border-0 cursor-pointer text-sm transition-all"
            style={{
              fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? primaryColor : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ── Take Attendance ── */}
      {activeTab === 'take' && (
        <>
          {/* Filter bar */}
          <div className="bg-white rounded-2xl px-6 py-5 shadow-sm mb-6 flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={filterCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grade</label>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                disabled={!!gradeFilter}
                className={`${filterCls} min-w-40 ${gradeFilter ? 'cursor-default' : ''}`}
              >
                <option value="">Select a grade...</option>
                {!gradeFilter && <option value="__all__">All Grades</option>}
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* No grade selected */}
          {!selectedGrade && (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              <div className="mb-3 flex justify-center"><Calendar size={40} className="text-gray-300" /></div>
              <p className="m-0 text-base">Select a grade to take attendance</p>
            </div>
          )}

          {selectedGrade && loadingStudents && (
            <div className="p-8 text-gray-500">Loading students...</div>
          )}

          {selectedGrade && !loadingStudents && students.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              <div className="mb-2 flex justify-center"><Backpack size={32} className="text-gray-300" /></div>
              <p className="m-0">No enrolled students{selectedGrade === '__all__' ? '' : ` in ${selectedGrade}`}</p>
            </div>
          )}

          {selectedGrade && !loadingStudents && students.length > 0 && (
            <>
              {/* Summary cards */}
              <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                {[
                  { label: 'Present', count: summary.present, color: '#10b981' },
                  { label: 'Absent',  count: summary.absent,  color: '#ef4444' },
                  { label: 'Tardy',   count: summary.tardy,   color: '#f59e0b' },
                  { label: 'Excused', count: summary.excused, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border-t-4" style={{ borderTopColor: s.color }}>
                    <div className="text-3xl font-bold text-gray-800">{s.count}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Student table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">Student</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const rec = attendance[s.id] || { status: 'Present', notes: '' }
                      return (
                        <tr key={s.id} className="border-b border-gray-50" style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                            {s.first_name} {s.last_name}
                            {selectedGrade === '__all__' && s.grade && (
                              <span className="ml-2 text-xs text-gray-400 font-normal">{s.grade}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                              {STATUSES.map(status => (
                                <button
                                  key={status}
                                  onClick={() => setStudentStatus(s.id, status)}
                                  className="px-3 py-1 rounded-full border-0 cursor-pointer text-xs font-semibold transition-all"
                                  style={{
                                    background: rec.status === status ? ATTENDANCE_STATUS_COLORS[status] : ATTENDANCE_STATUS_COLORS[status] + '18',
                                    color: rec.status === status ? 'white' : ATTENDANCE_STATUS_COLORS[status],
                                  }}
                                >{status}</button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={rec.notes || ''}
                              onChange={e => setStudentNotes(s.id, e.target.value)}
                              placeholder="Optional note"
                              className="border border-gray-200 rounded-md px-2.5 py-1.5 text-sm outline-none w-48"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save row */}
              <div className="flex items-center gap-4">
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-white border-0 rounded-xl px-6 py-2.5 font-semibold disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  style={{ background: primaryColor }}
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
                {saveMessage && (
                  <span className={`text-sm font-medium ${saveMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <>
          {/* Filter bar */}
          <div className="bg-white rounded-2xl px-6 py-5 shadow-sm mb-6 flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} className={filterCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grade</label>
              <select value={historyGrade} onChange={e => setHistoryGrade(e.target.value)} className={`${filterCls} min-w-40`}>
                <option value="">All Grades</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)} className={filterCls}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(historyDate || historyGrade || historyStatus) && (
              <button onClick={clearHistoryFilters} className="border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer text-gray-500 bg-transparent hover:bg-gray-50">
                Clear
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="p-8 text-gray-500">Loading...</div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              <div className="mb-2 flex justify-center"><ClipboardList size={32} className="text-gray-300" /></div>
              <p className="m-0">No attendance records found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      {['Date', 'Student', 'Grade', 'Status', 'Notes'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{r.date}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{r.student_name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.student_grade}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                            style={{ color: ATTENDANCE_STATUS_COLORS[r.status], background: ATTENDANCE_STATUS_COLORS[r.status] + '18' }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {history.length} record{history.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
