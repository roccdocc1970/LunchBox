import { Lock, Backpack } from 'lucide-react'
import { useStudents } from './hooks/useStudents'
import { getDivision } from './domain/school'
import { statusColor, parentDisplayName } from './domain/students'
import StudentProfile from './StudentProfile'

export default function Students({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const h = useStudents(user, school)

  if (h.selected) {
    return <StudentProfile student={h.selected} school={school} h={h} />
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 m-0">Students</h2>
        <p className="text-gray-500 mt-1">View and manage your student roster</p>
      </div>

      {/* Config nudge */}
      {!h.configuredGrades && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <Lock size={18} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-800"><strong>Grade editing is locked.</strong> Complete your Academic Configuration in <strong>Settings → Academic Config</strong> before assigning grades to students.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, parent, or email…"
          value={h.search}
          onChange={e => h.setSearch(e.target.value)}
          className="flex-1 min-w-56 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
        />
        <select value={h.filterGrade} onChange={e => h.setFilterGrade(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-36">
          <option value="">All Grades</option>
          {h.gradeOptions.map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={h.filterStatus} onChange={e => h.setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-36">
          <option value="">All Statuses</option>
          <option>Applied</option>
          <option>Enrolled</option>
          <option>Waitlisted</option>
        </select>
        {(() => {
          try {
            const divs = school?.divisions ? (typeof school.divisions === 'string' ? JSON.parse(school.divisions) : school.divisions) : []
            const named = Array.isArray(divs) ? divs.filter(d => d.grades?.length > 0) : []
            if (named.length === 0) return null
            return (
              <select value={h.filterDivision} onChange={e => h.setFilterDivision(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-40">
                <option value="">All Divisions</option>
                {named.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            )
          } catch { return null }
        })()}
        {h.hasFilters && (
          <button onClick={h.clearFilters} className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">Clear</button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {['Enrolled', 'Applied', 'Waitlisted'].map(s => (
          <div key={s} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusColor(s) }} />
            <span className="font-semibold text-gray-800">{h.stats[s.toLowerCase()]}</span>
            <span className="text-gray-500 text-sm">{s}</span>
          </div>
        ))}
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <span className="font-semibold text-gray-800">{h.stats.total}</span>
          <span className="text-gray-500 text-sm">Total</span>
        </div>
      </div>

      {/* Roster table */}
      {h.loading ? (
        <p className="text-gray-500">Loading students…</p>
      ) : h.filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 flex justify-center"><Backpack size={48} className="text-gray-300" /></div>
          <p className="text-gray-500 text-lg">
            {h.students.length === 0 ? 'No students yet. Add students via Enrollment.' : 'No students match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Student', 'Grade', 'Parent / Guardian', 'Contact', 'Status'].map(hd => (
                  <th key={hd} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{hd}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {h.filtered.map(student => (
                <tr key={student.id} onClick={() => h.openProfile(student)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{student.first_name} {student.last_name}</div>
                    {student.date_of_birth && <div className="text-xs text-gray-400">DOB: {student.date_of_birth}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{student.grade || '—'}</div>
                    {(() => {
                      const div = getDivision(student.grade, school?.divisions)
                      if (!div) return null
                      return <span className="text-xs font-semibold rounded-full px-2 py-0.5 inline-block mt-0.5" style={{ color: div.color, background: div.color + '15' }}>{div.name}</span>
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{parentDisplayName(student.parents)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{student.parents?.email || '—'}</div>
                    <div className="text-xs text-gray-500">{student.parents?.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: statusColor(student.status) + '20', color: statusColor(student.status) }}>
                      {student.status || 'Applied'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Showing {h.filtered.length} of {h.students.length} students — click a row to view profile
          </div>
        </div>
      )}
    </div>
  )
}
