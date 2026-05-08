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

  const filterInputStyle = { border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }
  const filterLabelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Attendance</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>Daily attendance tracking</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {[{ id: 'take', label: 'Take Attendance' }, { id: 'history', label: 'History' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: activeTab === tab.id ? '600' : '400',
            background: activeTab === tab.id ? primaryColor : 'transparent',
            color: activeTab === tab.id ? 'white' : '#6b7280',
            boxShadow: activeTab === tab.id ? `0 1px 3px ${primaryColor}40` : 'none',
            transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Take Attendance ── */}
      {activeTab === 'take' && (
        <>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={filterLabelStyle}>Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={filterInputStyle} />
            </div>
            <div>
              <label style={filterLabelStyle}>Grade</label>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                disabled={!!gradeFilter}
                style={{ ...filterInputStyle, cursor: gradeFilter ? 'default' : 'pointer', minWidth: '160px' }}
              >
                <option value="">Select a grade...</option>
                {!gradeFilter && <option value="__all__">All Grades</option>}
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {!selectedGrade && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
              <p style={{ margin: 0, fontSize: '1rem' }}>Select a grade to take attendance</p>
            </div>
          )}

          {selectedGrade && loadingStudents && (
            <div style={{ padding: '2rem', color: '#6b7280' }}>Loading students...</div>
          )}

          {selectedGrade && !loadingStudents && students.length === 0 && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎒</div>
              <p style={{ margin: 0 }}>No enrolled students{selectedGrade === '__all__' ? '' : ` in ${selectedGrade}`}</p>
            </div>
          )}

          {selectedGrade && !loadingStudents && students.length > 0 && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Present', count: summary.present, color: '#10b981' },
                  { label: 'Absent',  count: summary.absent,  color: '#ef4444' },
                  { label: 'Tardy',   count: summary.tardy,   color: '#f59e0b' },
                  { label: 'Excused', count: summary.excused, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{s.count}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Student table */}
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Student</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const rec = attendance[s.id] || { status: 'Present', notes: '' }
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>
                            {s.first_name} {s.last_name}
                            {selectedGrade === '__all__' && s.grade && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>{s.grade}</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                              {STATUSES.map(status => (
                                <button key={status} onClick={() => setStudentStatus(s.id, status)} style={{
                                  padding: '0.3rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                                  fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.1s',
                                  background: rec.status === status ? ATTENDANCE_STATUS_COLORS[status] : ATTENDANCE_STATUS_COLORS[status] + '18',
                                  color: rec.status === status ? 'white' : ATTENDANCE_STATUS_COLORS[status],
                                }}>{status}</button>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input
                              type="text"
                              value={rec.notes || ''}
                              onChange={e => setStudentNotes(s.id, e.target.value)}
                              placeholder="Optional note"
                              style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.375rem 0.625rem', fontSize: '0.85rem', outline: 'none', width: '200px', boxSizing: 'border-box' }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={save} disabled={saving} style={{
                  background: primaryColor, color: 'white', border: 'none', borderRadius: '0.625rem',
                  padding: '0.625rem 1.5rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'Saving...' : 'Save Attendance'}</button>
                {saveMessage && (
                  <span style={{ fontSize: '0.9rem', color: saveMessage.startsWith('Error') ? '#ef4444' : '#10b981', fontWeight: '500' }}>
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
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={filterLabelStyle}>Date</label>
              <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} style={filterInputStyle} />
            </div>
            <div>
              <label style={filterLabelStyle}>Grade</label>
              <select value={historyGrade} onChange={e => setHistoryGrade(e.target.value)} style={{ ...filterInputStyle, minWidth: '160px' }}>
                <option value="">All Grades</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={filterLabelStyle}>Status</label>
              <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)} style={filterInputStyle}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(historyDate || historyGrade || historyStatus) && (
              <button onClick={clearHistoryFilters} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer', color: '#6b7280' }}>
                Clear
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>
          ) : history.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <p style={{ margin: 0 }}>No attendance records found</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                      {['Date', 'Student', 'Grade', 'Status', 'Notes'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '0.625rem 1rem', color: '#374151', whiteSpace: 'nowrap' }}>{r.date}</td>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{r.student_name}</td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{r.student_grade}</td>
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: ATTENDANCE_STATUS_COLORS[r.status], background: ATTENDANCE_STATUS_COLORS[r.status] + '18', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6', fontSize: '0.8rem', color: '#9ca3af' }}>
                {history.length} record{history.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
