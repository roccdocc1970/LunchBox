import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUSES = ['Present', 'Absent', 'Tardy', 'Excused']
const STATUS_COLORS = {
  Present: '#10b981',
  Absent: '#ef4444',
  Tardy: '#f59e0b',
  Excused: '#6b7280',
}

const ALL_GRADES = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade']

const todayStr = () => new Date().toISOString().split('T')[0]

const parseGrades = (school) => {
  if (school?.divisions) {
    try {
      const divs = typeof school.divisions === 'string' ? JSON.parse(school.divisions) : school.divisions
      if (Array.isArray(divs)) {
        const grades = divs.flatMap(d => d.grades || [])
        const unique = [...new Set(grades)]
        return unique.sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
      }
    } catch {}
  }
  return ALL_GRADES
}

export default function Attendance({ user, school, schoolId: schoolIdProp = null, gradeFilter = null }) {
  const primaryColor = school?.primary_color || '#f97316'
  const schoolId = schoolIdProp || user.id
  const [activeTab, setActiveTab] = useState('take')

  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [selectedGrade, setSelectedGrade] = useState(gradeFilter || '')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyDate, setHistoryDate] = useState('')
  const [historyGrade, setHistoryGrade] = useState('')
  const [historyStatus, setHistoryStatus] = useState('')

  const availableGrades = parseGrades(school)

  useEffect(() => {
    if (gradeFilter) setSelectedGrade(gradeFilter)
  }, [gradeFilter])

  useEffect(() => {
    if (selectedGrade && selectedDate) fetchStudentsAndAttendance()
  }, [selectedGrade, selectedDate])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, historyDate, historyGrade, historyStatus])

  const fetchStudentsAndAttendance = async () => {
    setLoadingStudents(true)
    const isAll = selectedGrade === '__all__'
    let studQ = supabase.from('students').select('id, first_name, last_name, grade')
      .eq('school_id', schoolId).eq('status', 'Enrolled').order('grade').order('last_name')
    if (!isAll) studQ = studQ.eq('grade', selectedGrade)

    let attQ = supabase.from('attendance').select('*').eq('school_id', schoolId).eq('date', selectedDate)
    if (!isAll) attQ = attQ.eq('student_grade', selectedGrade)

    const [{ data: studs }, { data: existing }] = await Promise.all([studQ, attQ])
    if (studs) setStudents(studs)
    const map = {}
    if (existing) existing.forEach(r => { map[r.student_id] = { status: r.status, notes: r.notes || '' } })
    if (studs) studs.forEach(s => { if (!map[s.id]) map[s.id] = { status: 'Present', notes: '' } })
    setAttendance(map)
    setLoadingStudents(false)
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    let q = supabase.from('attendance').select('*').eq('school_id', schoolId)
      .order('date', { ascending: false }).order('student_name', { ascending: true }).limit(500)
    if (historyDate) q = q.eq('date', historyDate)
    if (historyGrade) q = q.eq('student_grade', historyGrade)
    if (historyStatus) q = q.eq('status', historyStatus)
    const { data } = await q
    if (data) setHistory(data)
    setLoadingHistory(false)
  }

  const handleSave = async () => {
    if (!selectedGrade || !selectedDate || students.length === 0) return
    setSaving(true)
    setSaveMessage('')
    const rows = students.map(s => ({
      school_id: schoolId,
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      student_grade: s.grade,
      date: selectedDate,
      status: attendance[s.id]?.status || 'Present',
      notes: attendance[s.id]?.notes || null,
    }))
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'school_id,student_id,date' })
    setSaving(false)
    if (error) setSaveMessage('Error saving: ' + error.message)
    else { setSaveMessage('Attendance saved!'); setTimeout(() => setSaveMessage(''), 3000) }
  }

  const setStudentStatus = (id, status) => setAttendance(prev => ({ ...prev, [id]: { ...prev[id], status } }))
  const setStudentNotes = (id, notes) => setAttendance(prev => ({ ...prev, [id]: { ...prev[id], notes } }))

  const presentCount = students.filter(s => attendance[s.id]?.status === 'Present').length
  const absentCount = students.filter(s => attendance[s.id]?.status === 'Absent').length
  const tardyCount = students.filter(s => attendance[s.id]?.status === 'Tardy').length
  const excusedCount = students.filter(s => attendance[s.id]?.status === 'Excused').length

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Attendance</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>Daily attendance tracking</p>
      </div>

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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
                disabled={!!gradeFilter}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: gradeFilter ? 'default' : 'pointer', minWidth: '160px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Present', count: presentCount, color: '#10b981' },
                  { label: 'Absent', count: absentCount, color: '#ef4444' },
                  { label: 'Tardy', count: tardyCount, color: '#f59e0b' },
                  { label: 'Excused', count: excusedCount, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{s.count}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

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
                                  background: rec.status === status ? STATUS_COLORS[status] : STATUS_COLORS[status] + '18',
                                  color: rec.status === status ? 'white' : STATUS_COLORS[status],
                                }}>{status}</button>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input
                              type="text"
                              value={rec.notes}
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
                <button onClick={handleSave} disabled={saving} style={{
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
              <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade</label>
              <select value={historyGrade} onChange={e => setHistoryGrade(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', minWidth: '160px' }}>
                <option value="">All Grades</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
              <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(historyDate || historyGrade || historyStatus) && (
              <button onClick={() => { setHistoryDate(''); setHistoryGrade(''); setHistoryStatus('') }}
                style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer', color: '#6b7280' }}>
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
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '0.625rem 1rem', color: '#374151', whiteSpace: 'nowrap' }}>{r.date}</td>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{r.student_name}</td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{r.student_grade}</td>
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: STATUS_COLORS[r.status], background: STATUS_COLORS[r.status] + '18', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
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
