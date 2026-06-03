import { useEnrollment } from './hooks/useEnrollment'
import { statusColor } from './domain/enrollment'

export default function Enrollment({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    students, loading, grades, configuredGrades,
    showForm, toggleForm, saving, error,
    parentSearch, parentResults, selectedParent,
    setSelectedParent, setParentSearch, setParentResults,
    parentForm, setParentForm,
    studentForm, setStudentForm,
    submit, updateStatus, handleParentSearch,
  } = useEnrollment(user.id, school)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Config nudge */}
      {!configuredGrades && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="text-sm text-red-800">
            <strong>Grade selection is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Enrollment</h2>
          <p className="text-gray-500 mt-1">Manage student applications and enrollment</p>
        </div>
        <button
          onClick={toggleForm}
          className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-base transition-opacity hover:opacity-90"
          style={{ background: primaryColor }}
        >
          {showForm ? 'Cancel' : '+ New Student'}
        </button>
      </div>

      {/* Enrollment Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">New Student Enrollment</h3>

          {/* Parent / Guardian */}
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Parent / Guardian</div>

            {selectedParent ? (
              <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{selectedParent.first_name} {selectedParent.last_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[selectedParent.email, selectedParent.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedParent(null); setParentSearch('') }}
                  className="bg-transparent border-0 text-gray-400 cursor-pointer text-xl leading-none hover:text-gray-600"
                >×</button>
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <input
                    placeholder="Search existing parent by name or email…"
                    value={parentSearch}
                    onChange={e => handleParentSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 outline-none text-sm bg-gray-50"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  {parentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10 max-h-48 overflow-y-auto">
                      {parentResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedParent(p); setParentSearch(''); setParentResults([]) }}
                          className="px-4 py-2.5 cursor-pointer border-b border-gray-100 text-sm hover:bg-gray-50 last:border-b-0"
                        >
                          <span className="font-semibold">{p.first_name} {p.last_name}</span>
                          {p.email && <span className="text-gray-500"> · {p.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                  {[
                    { label: 'First Name', key: 'first_name', required: true },
                    { label: 'Last Name',  key: 'last_name',  required: true },
                    { label: 'Email',      key: 'email',      type: 'email', required: true },
                    { label: 'Phone',      key: 'phone',      type: 'tel' },
                    { label: 'Address',    key: 'address' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        value={parentForm[f.key]}
                        onChange={e => setParentForm({ ...parentForm, [f.key]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-0 border-t border-gray-100 my-6" />

          {/* Student Details */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Student Details</div>
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input value={studentForm.first_name} onChange={e => setStudentForm({ ...studentForm, first_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input value={studentForm.last_name} onChange={e => setStudentForm({ ...studentForm, last_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={studentForm.date_of_birth} onChange={e => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={studentForm.grade}
                  onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })}
                  disabled={!configuredGrades}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm ${!configuredGrades ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white cursor-pointer text-gray-800'}`}
                >
                  <option value="">{configuredGrades ? 'Select grade' : 'Configure grades in Settings first'}</option>
                  {grades.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={studentForm.notes}
                onChange={e => setStudentForm({ ...studentForm, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm resize-y"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="mt-6 text-white border-0 rounded-lg px-6 py-2.5 font-semibold text-base disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {saving ? 'Saving…' : 'Save Student'}
          </button>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <p className="text-gray-500">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎒</div>
          <p className="text-gray-500 text-lg">No students yet. Add your first student above!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Student', 'Grade', 'Parent', 'Contact', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{student.first_name} {student.last_name}</div>
                    {student.date_of_birth && <div className="text-xs text-gray-500">{student.date_of_birth}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.grade || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {student.parents
                      ? `${student.parents.first_name} ${student.parents.last_name}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{student.parents?.email || <span className="text-gray-300">—</span>}</div>
                    <div className="text-xs text-gray-500">{student.parents?.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: statusColor(student.status) + '20', color: statusColor(student.status) }}
                    >
                      {student.status || 'Applied'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={student.status || 'Applied'}
                      onChange={e => updateStatus(student.id, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer outline-none"
                    >
                      <option>Applied</option>
                      <option>Enrolled</option>
                      <option>Waitlisted</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
