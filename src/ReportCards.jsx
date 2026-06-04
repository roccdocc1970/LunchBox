import { Lightbulb, FileText, Check, X } from 'lucide-react'
import { useReportCards } from './hooks/useReportCards'
import { GRADE_COLORS, gradedCount } from './domain/reportCards'
import { parseDivisions } from './domain/school'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-gray-500 mb-1'

export default function ReportCards({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    students, loading, filtered, stats,
    showForm, openForm, closeForm,
    form, setForm, saving, error,
    handleStudentSelect, handleGradeChange, submit,
    selected, setSelected,
    togglePublished, remove,
    search, setSearch,
    filterTerm, setFilterTerm,
    filterStatus, setFilterStatus,
    filterDivision, setFilterDivision,
    clearFilters,
    terms, gradeOptions,
  } = useReportCards(user.id, school)

  const divisions = parseDivisions(school?.divisions).filter(d => d.grades?.length > 0)
  const hasFilters = search || filterTerm || filterStatus || filterDivision

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><FileText size={22} style={{ color: primaryColor }} />Report Cards</h2>
          <p className="text-gray-500 mt-1">Create and manage student report cards by term</p>
        </div>
        <button
          onClick={showForm ? closeForm : openForm}
          className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-base hover:opacity-90 transition-opacity"
          style={{ background: primaryColor }}
        >
          {showForm ? 'Cancel' : '+ New Report Card'}
        </button>
      </div>

      {/* Config nudge */}
      {!school?.grading_scale && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 mb-6 text-sm text-blue-700">
          <Lightbulb size={15} className="inline mr-1.5 text-blue-500" />Using default <strong>Letter Grade</strong> scale and standard subjects. Configure both in <strong>School Settings → Academic Config</strong>.
        </div>
      )}

      {/* New Report Card Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">New Report Card</h3>

          <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div>
              <label className={labelCls}>Student <span className="text-red-500">*</span></label>
              <select value={form.student_id} onChange={e => handleStudentSelect(e.target.value)} className={fieldCls}>
                <option value="">Select enrolled student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}{s.grade ? ` — ${s.grade}` : ''}</option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">No enrolled students found. Enroll students first.</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Term</label>
              <select value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} className={fieldCls}>
                {terms.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Academic Year</label>
              <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} className={fieldCls} placeholder="e.g. 2025-2026" />
            </div>
          </div>

          {/* Grades grid */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Subject Grades <span className="font-normal text-gray-400 text-xs">({school?.grading_scale || 'Letter'} scale)</span>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid bg-gray-50 px-4 py-2.5 border-b border-gray-200 gap-3 grid-cols-[200px_160px_1fr]">
                <span className="text-xs font-bold text-gray-500 uppercase">Subject</span>
                <span className="text-xs font-bold text-gray-500 uppercase">Grade</span>
                <span className="text-xs font-bold text-gray-500 uppercase">Teacher Comment</span>
              </div>
              {form.grades.map((g, i) => (
                <div
                  key={g.subject}
                  className={`grid px-4 py-2 gap-3 items-center grid-cols-[200px_160px_1fr] ${i < form.grades.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-sm text-gray-700 font-medium">{g.subject}</span>
                  <select
                    value={g.grade}
                    onChange={e => handleGradeChange(i, 'grade', e.target.value)}
                    className={`${fieldCls} font-semibold`}
                    style={{ color: GRADE_COLORS[g.grade] || '#374151' }}
                  >
                    <option value="">—</option>
                    {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input
                    value={g.comment}
                    onChange={e => handleGradeChange(i, 'comment', e.target.value)}
                    placeholder="Optional comment..."
                    className={fieldCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Teacher notes */}
          <div className="mb-6">
            <label className={labelCls}>Overall Teacher Notes</label>
            <textarea
              value={form.teacher_notes}
              onChange={e => setForm({ ...form, teacher_notes: e.target.value })}
              rows={3}
              placeholder="General comments about the student's progress this term..."
              className={`${fieldCls} resize-y`}
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {saving ? 'Saving...' : 'Save Report Card'}
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { label: 'Total',     count: stats.total,     color: '#6b7280' },
          { label: 'Published', count: stats.published, color: '#10b981' },
          { label: 'Draft',     count: stats.draft,     color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            <span className="font-semibold text-gray-800">{s.count}</span>
            <span className="text-gray-500 text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by student name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
        />
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white">
          <option value="">All Terms</option>
          {terms.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white">
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {divisions.length > 0 && (
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white min-w-40">
            <option value="">All Divisions</option>
            {divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={clearFilters} className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading report cards...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-4 flex justify-center"><FileText size={48} className="text-gray-300" /></div>
          <p className="text-gray-500 text-lg">
            {stats.total === 0 ? 'No report cards yet. Create your first one above.' : 'No report cards match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Student', 'Grade Level', 'Term', 'Year', 'Graded', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(rc => (
                <tr
                  key={rc.id}
                  onClick={() => setSelected(rc)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{rc.student_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{rc.student_grade || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{rc.term}</td>
                  <td className="px-4 py-3 text-gray-700">{rc.academic_year}</td>
                  <td className="px-4 py-3 text-gray-700">{gradedCount(rc.grades)}/{(rc.grades || []).length}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${rc.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {rc.published ? <><Check size={12} className="inline mr-0.5" />Published</> : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {filtered.length} report card{filtered.length !== 1 ? 's' : ''} — click a row to view
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="w-[520px] max-w-full bg-white h-full overflow-y-auto shadow-2xl">

            {/* Drawer header */}
            <div className="p-6 text-white" style={{ background: primaryColor }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xl font-bold">{selected.student_name}</div>
                  <div className="text-sm opacity-85 mt-1">
                    {selected.term} · {selected.academic_year}{selected.student_grade ? ` · ${selected.student_grade}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer text-lg hover:bg-white/30"
                ><X size={16} /></button>
              </div>
              <span className={`inline-block mt-3 rounded-full px-3 py-0.5 text-xs font-semibold ${selected.published ? 'bg-white/30' : 'bg-white/15'}`}>
                {selected.published ? <><Check size={12} className="inline mr-0.5" />Published</> : 'Draft'}
              </span>
            </div>

            <div className="p-6">

              {/* Subject grades */}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Subject Grades</div>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                {(selected.grades || []).map((g, i) => (
                  <div
                    key={g.subject}
                    className={`px-4 py-3 flex justify-between items-start gap-4 ${i < selected.grades.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-700 font-medium">{g.subject}</div>
                      {g.comment && <div className="text-xs text-gray-500 mt-0.5 leading-snug">{g.comment}</div>}
                    </div>
                    <span
                      className="font-bold text-sm min-w-20 text-right shrink-0"
                      style={{ color: GRADE_COLORS[g.grade] || (g.grade ? primaryColor : '#d1d5db') }}
                    >
                      {g.grade || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Teacher notes */}
              {selected.teacher_notes && (
                <div className="mb-6">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Teacher Notes</div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-700 leading-relaxed">
                    {selected.teacher_notes}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mb-6">
                Created {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => togglePublished(selected)}
                  className={`flex-1 border rounded-lg py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity ${selected.published ? 'bg-white text-gray-700 border-gray-300' : 'text-white border-0'}`}
                  style={selected.published ? undefined : { background: primaryColor }}
                >
                  {selected.published ? 'Revert to Draft' : <><Check size={14} className="inline mr-1" />Publish Report Card</>}
                </button>
                <button
                  onClick={() => { if (window.confirm(`Delete ${selected.student_name}'s ${selected.term} report card?`)) remove(selected.id) }}
                  className="bg-white text-red-500 border border-red-400 rounded-lg px-4 py-2.5 font-semibold cursor-pointer text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
