import { useAdmissions } from './hooks/useAdmissions'
import { STATUSES, SOURCES, STATUS_COLORS, SOURCE_COLORS, canConvertToStudent } from './domain/admissions'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white'

export default function Admissions({ user, school, onNavigate }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    inquiries, loading, filtered, grades,
    pipelineCounts, sourceCounts,
    showForm, toggleForm,
    form, setForm, saving, error,
    submit,
    selected, openDrawer, closeDrawer,
    editing, editForm, setEditForm,
    startEdit, saveEdit,
    convertConfirm, setConvertConfirm,
    converting, convertSuccess,
    convertToStudent,
    search, setSearch,
    filterStatus, toggleStatusFilter,
    filterSource, toggleSourceFilter,
    filterGrade, setFilterGrade,
    clearFilters,
    linkCopied, copyApplicationLink,
  } = useAdmissions(user.id, school)

  const hasFilters = search || filterStatus || filterSource || filterGrade

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-7">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Admissions</h2>
          <p className="text-gray-500 mt-1 text-sm">Track prospective families from first contact to enrollment</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={copyApplicationLink}
            className="border-2 rounded-lg px-4 py-2.5 font-semibold cursor-pointer text-sm transition-all"
            style={{
              background: linkCopied ? '#10b981' : 'white',
              color: linkCopied ? 'white' : primaryColor,
              borderColor: linkCopied ? '#10b981' : primaryColor,
            }}
          >
            {linkCopied ? '✓ Link Copied!' : '🔗 Copy Application Link'}
          </button>
          <button
            onClick={toggleForm}
            className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {showForm ? 'Cancel' : '+ New Inquiry'}
          </button>
        </div>
      </div>

      {/* Pipeline summary cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {STATUSES.map(s => (
          <div
            key={s}
            onClick={() => toggleStatusFilter(s)}
            className="bg-white rounded-2xl px-5 py-4 shadow-sm cursor-pointer transition-colors border-l-4"
            style={{ borderLeftColor: filterStatus === s ? STATUS_COLORS[s] : '#e5e7eb' }}
          >
            <div className="text-3xl font-bold" style={{ color: STATUS_COLORS[s] }}>{pipelineCounts[s]}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {/* Source breakdown */}
      {Object.keys(sourceCounts).length > 0 && (
        <div className="bg-white rounded-2xl px-5 py-3.5 mb-6 shadow-sm flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sources</span>
          {Object.entries(sourceCounts).map(([src, n]) => (
            <span
              key={src}
              onClick={() => toggleSourceFilter(src)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border-2"
              style={{
                background: SOURCE_COLORS[src] + '15',
                color: SOURCE_COLORS[src],
                borderColor: filterSource === src ? SOURCE_COLORS[src] : 'transparent',
              }}
            >
              {src} <span className="font-extrabold">{n}</span>
            </span>
          ))}
        </div>
      )}

      {/* New Inquiry Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-gray-800 mt-0 mb-6">New Inquiry</h3>

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">Parent / Guardian</div>
          <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <FormField label="First Name" required><input value={form.parent_first_name} onChange={e => setForm({ ...form, parent_first_name: e.target.value })} className={fieldCls} /></FormField>
            <FormField label="Last Name"  required><input value={form.parent_last_name}  onChange={e => setForm({ ...form, parent_last_name:  e.target.value })} className={fieldCls} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldCls} /></FormField>
            <FormField label="Phone"><input type="tel"   value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldCls} /></FormField>
          </div>

          <hr className="border-0 border-t border-gray-100 mb-6" />

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">Student</div>
          <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <FormField label="First Name" required><input value={form.student_first_name} onChange={e => setForm({ ...form, student_first_name: e.target.value })} className={fieldCls} /></FormField>
            <FormField label="Last Name"  required><input value={form.student_last_name}  onChange={e => setForm({ ...form, student_last_name:  e.target.value })} className={fieldCls} /></FormField>
            <FormField label="Grade Applying For">
              <select value={form.grade_applying_for} onChange={e => setForm({ ...form, grade_applying_for: e.target.value })} className={fieldCls}>
                <option value="">Unknown</option>
                {grades.map(g => <option key={g}>{g}</option>)}
              </select>
            </FormField>
          </div>

          <hr className="border-0 border-t border-gray-100 mb-6" />

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">Pipeline</div>
          <div className="grid gap-4 mb-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <FormField label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={fieldCls}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="How They Found Us">
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={fieldCls}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Inquiry Date">
              <input type="date" value={form.inquiry_date} onChange={e => setForm({ ...form, inquiry_date: e.target.value })} className={fieldCls} />
            </FormField>
            <FormField label="Tour Date">
              <input type="date" value={form.tour_date} onChange={e => setForm({ ...form, tour_date: e.target.value })} className={fieldCls} />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className={`${fieldCls} resize-y`} />
          </FormField>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="mt-5 text-white border-0 rounded-lg px-6 py-2.5 font-semibold disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {saving ? 'Saving…' : 'Save Inquiry'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5">
        <input
          placeholder="Search by student or parent name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-56 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
        />
        <select value={filterStatus} onChange={e => toggleStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={e => toggleSourceFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="">All Grades</option>
          {grades.map(g => <option key={g}>{g}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer text-gray-500 bg-white hover:bg-gray-50">Clear</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">📬</div>
          <p className="text-gray-500 text-lg">
            {inquiries.length === 0 ? 'No inquiries yet. Add your first prospective family above.' : 'No inquiries match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Student', 'Grade', 'Parent', 'Contact', 'Source', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inq) => (
                <tr
                  key={inq.id}
                  onClick={() => openDrawer(inq)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{inq.student_first_name} {inq.student_last_name}</td>
                  <td className="px-4 py-3.5 text-gray-700 text-sm">{inq.grade_applying_for || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3.5 text-gray-700 text-sm">{inq.parent_first_name} {inq.parent_last_name}</td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-gray-700">{inq.email || <span className="text-gray-300">—</span>}</div>
                    <div className="text-xs text-gray-500">{inq.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{ color: SOURCE_COLORS[inq.source] || '#9ca3af', background: (SOURCE_COLORS[inq.source] || '#9ca3af') + '15' }}
                    >{inq.source}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-sm">{inq.inquiry_date || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{ color: STATUS_COLORS[inq.status], background: STATUS_COLORS[inq.status] + '18' }}
                    >{inq.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Showing {filtered.length} of {inquiries.length} inquiries — click a row to view
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-[500] flex justify-end" onClick={closeDrawer}>
          <div className="w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="p-6 text-white" style={{ background: primaryColor }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xl font-bold">{selected.student_first_name} {selected.student_last_name}</div>
                  <div className="text-sm opacity-85 mt-0.5">{selected.grade_applying_for ? `Applying for ${selected.grade_applying_for}` : 'Grade not specified'}</div>
                </div>
                <button onClick={closeDrawer} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer text-lg hover:bg-white/30">✕</button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">{selected.status}</span>
                <span className="bg-white/15 rounded-full px-3 py-0.5 text-xs">{selected.source}</span>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 px-6 py-5 flex flex-col gap-5">
              {error && <p className="text-red-500 text-sm m-0">{error}</p>}

              {convertSuccess && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                  <div className="font-semibold text-green-700 text-sm">✓ Converted to student successfully</div>
                  <p className="text-green-800 text-xs mt-1 mb-0">Parent and student records created in Enrollment.</p>
                  <button
                    onClick={() => { closeDrawer(); onNavigate && onNavigate('enrollment') }}
                    className="mt-2.5 bg-green-700 text-white border-0 rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-green-800"
                  >
                    View in Enrollment →
                  </button>
                </div>
              )}

              {!editing ? (
                <>
                  <DrawerSection title="Parent / Guardian">
                    <DrawerField label="Name"  value={`${selected.parent_first_name} ${selected.parent_last_name}`} />
                    <DrawerField label="Email" value={selected.email} />
                    <DrawerField label="Phone" value={selected.phone} />
                  </DrawerSection>

                  <DrawerSection title="Inquiry Details">
                    <DrawerField label="Status"       value={selected.status} />
                    <DrawerField label="Source"       value={selected.source} />
                    <DrawerField label="Inquiry Date" value={selected.inquiry_date} />
                    <DrawerField label="Tour Date"    value={selected.tour_date} />
                  </DrawerSection>

                  {selected.notes && (
                    <DrawerSection title="Notes">
                      <p className="text-sm text-gray-700 m-0 leading-relaxed">{selected.notes}</p>
                    </DrawerSection>
                  )}

                  {canConvertToStudent(selected) && !convertSuccess && (
                    <>
                      <button
                        onClick={() => setConvertConfirm(true)}
                        className="w-full border-2 rounded-lg py-2.5 font-bold cursor-pointer text-sm hover:opacity-90 transition-opacity bg-orange-50"
                        style={{ color: primaryColor, borderColor: primaryColor }}
                      >
                        🎒 Convert to Student
                      </button>

                      {convertConfirm && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <p className="text-orange-900 font-semibold m-0 mb-2 text-sm">Convert {selected.student_first_name} {selected.student_last_name} to a student?</p>
                          <p className="text-orange-700 text-xs leading-relaxed m-0 mb-3.5">
                            A parent record and student application will be created in Enrollment. This inquiry will be marked as Applied.
                            {selected.email && <><br />Parent email <strong>{selected.email}</strong> will be checked for duplicates.</>}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={convertToStudent}
                              disabled={converting}
                              className="text-white border-0 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity"
                              style={{ background: primaryColor }}
                            >
                              {converting ? 'Converting…' : 'Yes, Convert'}
                            </button>
                            <button onClick={() => setConvertConfirm(false)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parent / Guardian</div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="First Name"><input value={editForm.parent_first_name || ''} onChange={e => setEditForm({ ...editForm, parent_first_name: e.target.value })} className={fieldCls} /></EditField>
                    <EditField label="Last Name"> <input value={editForm.parent_last_name  || ''} onChange={e => setEditForm({ ...editForm, parent_last_name:  e.target.value })} className={fieldCls} /></EditField>
                  </div>
                  <EditField label="Email"><input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={fieldCls} /></EditField>
                  <EditField label="Phone"><input type="tel"   value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={fieldCls} /></EditField>

                  <hr className="border-0 border-t border-gray-100" />
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student</div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="First Name"><input value={editForm.student_first_name || ''} onChange={e => setEditForm({ ...editForm, student_first_name: e.target.value })} className={fieldCls} /></EditField>
                    <EditField label="Last Name"> <input value={editForm.student_last_name  || ''} onChange={e => setEditForm({ ...editForm, student_last_name:  e.target.value })} className={fieldCls} /></EditField>
                  </div>
                  <EditField label="Grade Applying For">
                    <select value={editForm.grade_applying_for || ''} onChange={e => setEditForm({ ...editForm, grade_applying_for: e.target.value })} className={fieldCls}>
                      <option value="">Unknown</option>
                      {grades.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </EditField>

                  <hr className="border-0 border-t border-gray-100" />
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pipeline</div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Status">
                      <select value={editForm.status || 'New Inquiry'} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className={fieldCls}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </EditField>
                    <EditField label="Source">
                      <select value={editForm.source || 'Other'} onChange={e => setEditForm({ ...editForm, source: e.target.value })} className={fieldCls}>
                        {SOURCES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </EditField>
                    <EditField label="Inquiry Date"><input type="date" value={editForm.inquiry_date || ''} onChange={e => setEditForm({ ...editForm, inquiry_date: e.target.value })} className={fieldCls} /></EditField>
                    <EditField label="Tour Date">   <input type="date" value={editForm.tour_date    || ''} onChange={e => setEditForm({ ...editForm, tour_date:     e.target.value })} className={fieldCls} /></EditField>
                  </div>
                  <EditField label="Notes">
                    <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className={`${fieldCls} resize-y`} />
                  </EditField>

                  {error && <p className="text-red-500 text-sm m-0">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 text-white border-0 rounded-lg py-2.5 font-bold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity"
                      style={{ background: primaryColor }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => startEdit(null)} className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!editing && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={startEdit}
                  className="w-full bg-white border rounded-xl py-2 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity"
                  style={{ color: primaryColor, borderColor: primaryColor }}
                >
                  Edit Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function EditField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function DrawerSection({ title, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function DrawerField({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[65%] ${value ? 'text-gray-800' : 'text-gray-300'}`}>{value || '—'}</span>
    </div>
  )
}
