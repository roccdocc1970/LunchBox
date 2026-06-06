import {
  School, BookOpen, Bell, Building2, Mail, Palette,
  Check, X, ChevronUp, ChevronDown, AlertTriangle, Users,
} from 'lucide-react'
import { useSettings } from './hooks/useSettings'
import { useSchedule } from './hooks/useSchedule'
import { useBuildings } from './hooks/useBuildings'
import { useRooms } from './hooks/useRooms'
import { MONTHS, SCHOOL_TYPES } from './domain/settings'
import { ALL_GRADES } from './domain/enrollment'
import { DIVISION_COLORS, parseDivisions } from './domain/school'
import { PERIOD_TYPES, DAYS_OPTIONS, PERIOD_TYPE_COLORS, fmt12 } from './domain/schedule'
import { BUILDING_TYPES, BUILDING_TYPE_COLORS } from './domain/buildings'
import { ROOM_TYPES, ROOM_TYPE_COLORS, parseRoomDivisions } from './domain/rooms'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
const cardCls  = 'bg-white rounded-2xl shadow-sm p-8'

export default function Settings({ user, school, onUpdate }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    activeTab, switchTab,
    saving, success, error,
    profile, setProfile,
    academic, setAcademic,
    communication, setCommunication,
    appearance, setAppearance,
    saveProfile, saveAcademic, saveCommunication, saveAppearance,
    toggleGrade, selectAllGrades, clearAllGrades,
    toggleGradeInDiv, updateDivisionName, removeDivision, addDivision,
  } = useSettings(user, school, onUpdate)

  const sc  = useSchedule(user.id)
  const bld = useBuildings(user.id)
  const rm  = useRooms(user, school)

  const divisions = parseDivisions(school?.divisions)
    .map((d, i) => ({ ...d, color: DIVISION_COLORS[i % DIVISION_COLORS.length] }))
    .filter(d => d.grades?.length > 0)

  const SETTINGS_TAB_ICONS = { profile: School, academic: BookOpen, schedule: Bell, campus: Building2, communication: Mail, appearance: Palette }

  const tabs = [
    { id: 'profile',       label: 'School Profile',  },
    { id: 'academic',      label: 'Academic Config',  },
    { id: 'schedule',      label: 'Bell Schedule',    },
    { id: 'campus',        label: 'Campus',           },
    { id: 'communication', label: 'Communication',    },
    { id: 'appearance',    label: 'Appearance',       },
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 m-0">Settings</h2>
        <p className="text-gray-500 mt-1">Configure your school profile and platform preferences</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="flex-1 min-w-28 px-4 py-2.5 border-0 rounded-lg cursor-pointer text-sm flex items-center justify-center gap-1.5 transition-all"
            style={{
              fontWeight:  activeTab === tab.id ? '600' : '400',
              background:  activeTab === tab.id ? primaryColor : 'transparent',
              color:       activeTab === tab.id ? 'white' : '#6b7280',
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── School Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className={cardCls}>
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">School Information</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {[
              { label: 'School Name',               name: 'name',            type: 'text', required: true, placeholder: 'e.g. Riverside Academy' },
              { label: 'Principal / Director Name', name: 'principal_name',  type: 'text', placeholder: 'e.g. Dr. Jane Smith' },
              { label: 'Phone',                     name: 'phone',           type: 'tel',  placeholder: '(555) 123-4567' },
              { label: 'Street Address',            name: 'address',         type: 'text', placeholder: '123 Main Street' },
              { label: 'City',                      name: 'city',            type: 'text', placeholder: 'City' },
              { label: 'State',                     name: 'state',           type: 'text', placeholder: 'MI' },
              { label: 'ZIP',                       name: 'zip',             type: 'text', placeholder: '48146' },
              { label: 'Website',                   name: 'website',         type: 'text', placeholder: 'www.yourschool.com' },
            ].map(f => (
              <div key={f.name}>
                <label className={labelCls}>{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                <input type={f.type} value={profile[f.name]} onChange={e => setProfile({ ...profile, [f.name]: e.target.value })} placeholder={f.placeholder} className={fieldCls} />
              </div>
            ))}
            <div>
              <label className={labelCls}>School Type</label>
              <select value={profile.school_type} onChange={e => setProfile({ ...profile, school_type: e.target.value })} className={fieldCls}>
                {SCHOOL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Total Student Capacity</label>
              <input type="number" value={profile.student_capacity} onChange={e => setProfile({ ...profile, student_capacity: e.target.value })} placeholder="e.g. 250" className={fieldCls} />
            </div>
          </div>

          <Divider />

          <h3 className="text-base font-semibold text-gray-800 mb-4">Account</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-semibold text-gray-800">Admin Email</div>
              <div className="text-gray-500 text-sm">{user.email}</div>
            </div>
            <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">Active</span>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveProfile} />
        </div>
      )}

      {/* ── Academic Config ─────────────────────────────────────────────────── */}
      {activeTab === 'academic' && (
        <div className={cardCls}>
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">Academic Configuration</h3>

          {/* Grade Levels */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">Grade Levels Offered</label>
              <div className="flex gap-2">
                <button onClick={() => selectAllGrades(ALL_GRADES)} className="bg-transparent border border-gray-300 rounded-md px-2.5 py-1 text-xs cursor-pointer text-gray-500 hover:bg-gray-50">Select All</button>
                <button onClick={clearAllGrades}                      className="bg-transparent border border-gray-300 rounded-md px-2.5 py-1 text-xs cursor-pointer text-gray-500 hover:bg-gray-50">Clear</button>
              </div>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {ALL_GRADES.map(grade => {
                const checked = academic.grades_offered.includes(grade)
                return (
                  <div key={grade} onClick={() => toggleGrade(grade)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all"
                    style={{ borderColor: checked ? primaryColor : '#e5e7eb', background: checked ? primaryColor + '12' : 'white' }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
                      style={{ borderColor: checked ? primaryColor : '#d1d5db', background: checked ? primaryColor : 'white' }}>
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: checked ? primaryColor : '#374151', fontWeight: checked ? '600' : '400' }}>{grade}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">{academic.grades_offered.length} grade{academic.grades_offered.length !== 1 ? 's' : ''} selected</p>
          </div>

          <Divider />

          <div className="grid gap-4 mb-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div><label className={labelCls}>Academic Year</label><input value={academic.academic_year} onChange={e => setAcademic({ ...academic, academic_year: e.target.value })} placeholder="e.g. 2024-2025" className={fieldCls} /></div>
            <div><label className={labelCls}>School Year Start</label><select value={academic.school_year_start} onChange={e => setAcademic({ ...academic, school_year_start: e.target.value })} className={fieldCls}>{MONTHS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className={labelCls}>School Year End</label>  <select value={academic.school_year_end}   onChange={e => setAcademic({ ...academic, school_year_end:   e.target.value })} className={fieldCls}>{MONTHS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className={labelCls}>Grading Periods</label>  <select value={academic.grading_period}    onChange={e => setAcademic({ ...academic, grading_period:    e.target.value })} className={fieldCls}>{['Quarters','Trimesters','Semesters','Annual'].map(g => <option key={g}>{g}</option>)}</select></div>
            <div><label className={labelCls}>Default Enrollment Status</label><select value={academic.default_enrollment_status} onChange={e => setAcademic({ ...academic, default_enrollment_status: e.target.value })} className={fieldCls}><option>Applied</option><option>Enrolled</option></select></div>
          </div>

          <Divider />

          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label className={labelCls}>Grading Scale</label>
              <select value={academic.grading_scale} onChange={e => setAcademic({ ...academic, grading_scale: e.target.value })} className={fieldCls}>
                <option value="Letter">Letter Grades (A, B, C…)</option>
                <option value="Standards">Standards-Based (4, 3, 2, 1)</option>
                <option value="Satisfactory">Satisfactory (E, S, N)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Used on report cards across all grades.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className={labelCls}>Subjects Offered</label>
            <textarea value={academic.subjects_offered} onChange={e => setAcademic({ ...academic, subjects_offered: e.target.value })} rows={9} className={`${fieldCls} resize-y font-[inherit]`} placeholder="One subject per line..." />
            <p className="text-xs text-gray-400 mt-1">One subject per line. These appear as rows on every report card.</p>
          </div>

          <Divider />

          {/* Divisions */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-semibold text-gray-800 m-0">School Divisions</h4>
                <p className="text-xs text-gray-400 mt-1">Group your grades into named divisions (e.g. Lower School, Upper School). Each grade can only belong to one division.</p>
              </div>
              {academic.divisions.length < 6 && (
                <button onClick={addDivision} className="border rounded-lg px-3.5 py-1.5 font-semibold cursor-pointer text-sm whitespace-nowrap hover:opacity-80 transition-opacity" style={{ background: 'transparent', borderColor: primaryColor, color: primaryColor }}>
                  + Add Division
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {academic.divisions.map((div, i) => {
                const color = DIVISION_COLORS[i % DIVISION_COLORS.length]
                return (
                  <div key={i} className="border-2 rounded-xl p-4" style={{ borderColor: color + '20', background: color + '08' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                      <input value={div.name} onChange={e => updateDivisionName(i, e.target.value)}
                        className="flex-1 rounded-lg px-3 py-2 outline-none text-sm font-semibold"
                        style={{ border: `1px solid ${color}40`, color, background: 'white' }} />
                      <button onClick={() => removeDivision(i)} className="bg-transparent border border-gray-200 rounded-md px-2 py-1 cursor-pointer text-gray-400 hover:border-gray-400 flex items-center"><X size={14} /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {academic.grades_offered.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Select grade levels above to assign them to divisions.</span>
                      )}
                      {[...academic.grades_offered].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b)).map(grade => {
                        const inThis  = div.grades.includes(grade)
                        const inOther = !inThis && academic.divisions.some((d, j) => j !== i && d.grades.includes(grade))
                        return (
                          <button key={grade} onClick={() => !inOther && toggleGradeInDiv(i, grade)} disabled={inOther}
                            className="px-2.5 py-1 rounded-full text-xs border-2 transition-all"
                            style={{
                              fontWeight: inThis ? '600' : '400',
                              cursor:     inOther ? 'not-allowed' : 'pointer',
                              borderColor: inThis ? color : '#d1d5db',
                              background: inThis ? color : inOther ? '#f3f4f6' : 'white',
                              color:      inThis ? 'white' : inOther ? '#d1d5db' : '#374151',
                              opacity:    inOther ? 0.5 : 1,
                            }}>
                            {grade}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 mb-0">
                      {div.grades.length === 0 ? 'No grades assigned' : `${div.grades.length} grade${div.grades.length !== 1 ? 's' : ''}: ${div.grades.join(', ')}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveAcademic} />
        </div>
      )}

      {/* ── Communication ───────────────────────────────────────────────────── */}
      {activeTab === 'communication' && (
        <div className={cardCls}>
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-2">Communication Defaults</h3>
          <p className="text-gray-500 text-sm mb-6">These settings apply to all parent messages sent from LunchBox.</p>
          <div className="grid gap-5">
            <div>
              <label className={labelCls}>Reply-To Email Address</label>
              <input type="email" value={communication.reply_to_email} onChange={e => setCommunication({ ...communication, reply_to_email: e.target.value })} placeholder="e.g. admin@yourschool.com" className={fieldCls} />
              <p className="text-xs text-gray-400 mt-1">Parents who reply to messages will reach this address.</p>
            </div>
            <div>
              <label className={labelCls}>Email Signature / Footer</label>
              <textarea value={communication.email_signature} onChange={e => setCommunication({ ...communication, email_signature: e.target.value })} rows={5}
                placeholder={`e.g.\n\nWarm regards,\nRiverside Academy\n(555) 123-4567`}
                className={`${fieldCls} resize-y`} />
              <p className="text-xs text-gray-400 mt-1">Appended to the bottom of every parent message.</p>
            </div>
          </div>
          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveCommunication} />
        </div>
      )}

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div className={cardCls}>
          <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-6">Appearance & Branding</h3>
          <div className="grid gap-5">
            <div>
              <label className={labelCls}>School Logo URL</label>
              <input value={appearance.logo_url} onChange={e => setAppearance({ ...appearance, logo_url: e.target.value })} placeholder="https://yourschool.com/logo.png" className={fieldCls} />
              <p className="text-xs text-gray-400 mt-1">Paste a direct link to your school logo image.</p>
              {appearance.logo_url && (
                <img src={appearance.logo_url} alt="Logo preview" onError={e => e.target.style.display = 'none'}
                  className="mt-3 max-h-16 rounded-lg border border-gray-200 p-1" />
              )}
            </div>
            <div>
              <label className={labelCls}>School Motto / Tagline</label>
              <input value={appearance.motto} onChange={e => setAppearance({ ...appearance, motto: e.target.value })} placeholder="e.g. Inspiring Minds, Building Futures" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Brand Color</label>
              <div className="flex items-center gap-4">
                <input type="color" value={appearance.primary_color} onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg p-0.5 cursor-pointer" />
                <input value={appearance.primary_color} onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })} placeholder="#f97316" className={`${fieldCls} w-36`} />
                <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ background: appearance.primary_color }} />
                <span className="text-xs text-gray-400">Preview</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used for accent colors and branding throughout the platform.</p>
            </div>
          </div>
          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveAppearance} />
        </div>
      )}

      {/* ── Campus ──────────────────────────────────────────────────────────── */}
      {activeTab === 'campus' && (
        <div className={cardCls}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 m-0">Campus</h3>
              <p className="text-gray-500 text-sm mt-1">Buildings contain rooms. Expand a building to manage its spaces.</p>
            </div>
            {!bld.showForm && (
              <button onClick={bld.openAdd} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                + Add Building
              </button>
            )}
          </div>

          {/* Feedback */}
          {bld.success && <p className="text-green-700 text-sm mb-4 font-medium flex items-center gap-1"><Check size={14} />{bld.success}</p>}
          {rm.success  && <p className="text-green-700 text-sm mb-4 font-medium flex items-center gap-1"><Check size={14} />{rm.success}</p>}
          {bld.error && !bld.showForm && <p className="text-red-500 text-sm mb-4">{bld.error}</p>}

          {/* Building add/edit form */}
          {bld.showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {bld.editingId ? 'Edit Building' : 'New Building'}
              </div>
              {bld.error && <p className="text-red-500 text-sm mb-3">{bld.error}</p>}
              <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div><label className={labelCls}>Building Name *</label><input value={bld.form.name} onChange={e => bld.setForm({ ...bld.form, name: e.target.value })} placeholder="e.g. Main Hall" className={fieldCls} /></div>
                <div><label className={labelCls}>Type</label><select value={bld.form.type} onChange={e => bld.setForm({ ...bld.form, type: e.target.value })} className={fieldCls}>{BUILDING_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="col-span-full"><label className={labelCls}>Notes</label><input value={bld.form.notes || ''} onChange={e => bld.setForm({ ...bld.form, notes: e.target.value })} placeholder="Optional notes" className={fieldCls} /></div>
              </div>
              {/* Floor editor */}
              <div className="mb-4">
                <label className={labelCls}>Floors</label>
                <div className="flex gap-2 mb-2">
                  <input value={bld.newFloor} onChange={e => bld.setNewFloor(e.target.value)} onKeyDown={e => e.key === 'Enter' && bld.addFloor()} placeholder="e.g. Ground Floor" className={`${fieldCls} flex-1`} />
                  <button onClick={bld.addFloor} className="border rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm whitespace-nowrap hover:opacity-80" style={{ background: primaryColor + '18', color: primaryColor, borderColor: primaryColor + '40' }}>+ Add</button>
                </div>
                {bld.form.floors.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {bld.form.floors.map((floor, i) => (
                      <div key={floor} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                        <span className="flex-1 text-sm text-gray-700">{floor}</span>
                        <button onClick={() => bld.moveFloor(floor, -1)} disabled={i === 0} className={`border border-gray-200 rounded px-1.5 py-0.5 flex items-center ${i === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 cursor-pointer hover:bg-gray-50'}`}><ChevronUp size={12} /></button>
                        <button onClick={() => bld.moveFloor(floor, 1)} disabled={i === bld.form.floors.length - 1} className={`border border-gray-200 rounded px-1.5 py-0.5 flex items-center ${i === bld.form.floors.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 cursor-pointer hover:bg-gray-50'}`}><ChevronDown size={12} /></button>
                        <button onClick={() => bld.removeFloor(floor)} className="border border-red-200 rounded px-1.5 py-0.5 text-red-400 cursor-pointer hover:bg-red-50 flex items-center"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic m-0">No floors added yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={bld.handleSave} disabled={bld.saving} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                  {bld.saving ? 'Saving…' : bld.editingId ? 'Update Building' : 'Add Building'}
                </button>
                <button onClick={bld.cancelForm} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {/* Buildings list with nested rooms */}
          {bld.loading || rm.loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : bld.buildings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="mb-3 flex justify-center"><Building2 size={40} className="text-gray-300" /></div>
              <p className="m-0">No buildings yet. Add your first building to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bld.buildings.map(building => {
                const bldColor     = BUILDING_TYPE_COLORS[building.type] || '#6b7280'
                const floors       = Array.isArray(building.floors) ? building.floors : []
                const isExpanded   = bld.expandedId === building.id
                const isDeleting   = bld.deleteId === building.id
                const roomsHere    = rm.rooms.filter(r => r.building_id === building.id)
                const hasRooms     = roomsHere.length > 0
                const showRoomForm = rm.editing && rm.form.building_id === building.id

                return (
                  <div key={building.id} className="rounded-xl overflow-hidden border-l-4"
                    style={{ border: `1px solid ${bldColor}25`, borderLeft: `4px solid ${bldColor}`, background: isDeleting ? '#fef2f2' : isExpanded ? '#fafafa' : 'white' }}>

                    {/* Building header */}
                    <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                      onClick={() => { bld.setExpandedId(isExpanded ? null : building.id); rm.cancelEdit() }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{building.name}</span>
                          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ color: bldColor, background: bldColor + '15' }}>{building.type}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{roomsHere.length} room{roomsHere.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {floors.length > 0 ? `${floors.length} floor${floors.length !== 1 ? 's' : ''}: ${floors.join(', ')}` : 'No floors configured'}
                        </div>
                      </div>

                      {isDeleting ? (
                        <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-red-700">{hasRooms ? 'Remove rooms first' : 'Delete?'}</span>
                          {!hasRooms && <button onClick={() => bld.handleDelete(building.id)} className="bg-red-500 text-white border-0 rounded-md px-2.5 py-1 cursor-pointer text-xs font-semibold hover:bg-red-600">Yes</button>}
                          <button onClick={() => bld.setDeleteId(null)} className="bg-white text-gray-500 border border-gray-300 rounded-md px-2.5 py-1 cursor-pointer text-xs hover:bg-gray-50">{hasRooms ? 'OK' : 'No'}</button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 items-center">
                          <button onClick={e => { e.stopPropagation(); bld.openEdit(building) }} className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>Edit</button>
                          <button onClick={e => { e.stopPropagation(); bld.setDeleteId(building.id) }} className="text-gray-400 bg-transparent border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:border-gray-400 flex items-center"><X size={12} /></button>
                          <span className="text-gray-300 flex items-center">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4">
                        {/* Floor chips */}
                        {floors.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mb-4">
                            {floors.map(f => (
                              <span key={f} className="text-xs font-semibold rounded-full px-2.5 py-1 border" style={{ color: bldColor, background: bldColor + '15', borderColor: bldColor + '30' }}>{f}</span>
                            ))}
                          </div>
                        )}
                        {building.notes && <p className="text-xs text-gray-500 mb-3.5">{building.notes}</p>}

                        {/* Inline room form */}
                        {showRoomForm && (
                          <div className="bg-white border rounded-xl p-4 mb-4" style={{ borderColor: primaryColor + '30' }}>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">
                              {rm.selected ? 'Edit Room' : `New Room · ${building.name}`}
                            </div>
                            {rm.error && <p className="text-red-500 text-xs mb-2">{rm.error}</p>}
                            <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                              <div><label className={labelCls}>Room Name *</label><input value={rm.form.name} onChange={e => rm.setForm({ ...rm.form, name: e.target.value })} placeholder="e.g. Room 204" className={fieldCls} autoFocus /></div>
                              <div><label className={labelCls}>Type</label><select value={rm.form.type} onChange={e => rm.setForm({ ...rm.form, type: e.target.value })} className={fieldCls}>{ROOM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                              <div>
                                <label className={labelCls}>Floor</label>
                                {floors.length > 0
                                  ? <select value={rm.form.floor || ''} onChange={e => rm.setForm({ ...rm.form, floor: e.target.value })} className={fieldCls}><option value="">— None —</option>{floors.map(f => <option key={f} value={f}>{f}</option>)}</select>
                                  : <input value={rm.form.floor || ''} onChange={e => rm.setForm({ ...rm.form, floor: e.target.value })} placeholder="e.g. 2nd Floor" className={fieldCls} />
                                }
                              </div>
                              <div><label className={labelCls}>Capacity</label><input type="number" min="1" value={rm.form.capacity} onChange={e => rm.setForm({ ...rm.form, capacity: e.target.value })} placeholder="Max students" className={fieldCls} /></div>
                            </div>
                            {divisions.length > 0 && (
                              <div className="mb-3.5">
                                <label className={labelCls}>Divisions</label>
                                <div className="flex gap-2 flex-wrap mt-1">
                                  {divisions.map(div => {
                                    const isSel = (rm.form.divisions || []).includes(div.name)
                                    return (
                                      <button key={div.name} type="button" onClick={() => rm.toggleDivision(div.name)}
                                        className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-2 transition-all"
                                        style={{ background: isSel ? div.color : 'white', color: isSel ? 'white' : div.color, borderColor: div.color }}>
                                        {div.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="mb-3.5"><label className={labelCls}>Notes</label><textarea value={rm.form.notes || ''} onChange={e => rm.setForm({ ...rm.form, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} placeholder="AV equipment, accessibility notes…" /></div>
                            <div className="flex gap-2">
                              <button onClick={rm.handleSave} disabled={rm.saving} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                                {rm.saving ? 'Saving…' : rm.selected ? 'Update Room' : 'Add Room'}
                              </button>
                              <button onClick={rm.cancelEdit} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Rooms list */}
                        {roomsHere.length === 0 && !showRoomForm ? (
                          <p className="text-xs text-gray-400 italic mb-3.5">No rooms yet in this building.</p>
                        ) : (
                          <div className="flex flex-col gap-1.5 mb-3.5">
                            {roomsHere.map(room => {
                              const rc        = ROOM_TYPE_COLORS[room.type] || '#6b7280'
                              const roomDivs  = parseRoomDivisions(room.divisions)
                              const isOpen    = rm.selected?.id === room.id && !rm.editing
                              const overCap   = room.capacity ? rm.classes.filter(c => c.room_id === room.id && c.class_size && c.class_size > room.capacity) : []
                              return (
                                <div key={room.id}
                                  className="rounded-lg px-3.5 py-2.5 cursor-pointer transition-colors border"
                                  style={{ background: isOpen ? '#fafafa' : 'white', borderColor: isOpen ? primaryColor + '40' : '#f0f0f0' }}
                                  onClick={() => isOpen ? rm.closeRoom() : rm.openRoom(room)}>
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-gray-800 text-sm">{room.name}</span>
                                      <span className="text-[0.68rem] font-bold rounded-full px-2 py-0.5" style={{ color: rc, background: rc + '15' }}>{room.type}</span>
                                      {room.floor    && <span className="text-[0.68rem] text-gray-400">{room.floor}</span>}
                                      {room.capacity && <span className="text-[0.68rem] text-gray-400 flex items-center gap-0.5"><Users size={10} /> {room.capacity}</span>}
                                      {roomDivs.map(d => {
                                        const dv = divisions.find(x => x.name === d)
                                        const dc = dv?.color || '#6b7280'
                                        return <span key={d} className="text-[0.65rem] font-semibold rounded-full px-1.5 py-0.5" style={{ color: dc, background: dc + '15' }}>{d}</span>
                                      })}
                                    </div>
                                    <span className="text-gray-300 flex items-center">{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
                                  </div>
                                  {overCap.length > 0 && <div className="text-[0.7rem] text-amber-800 mt-0.5 flex items-center gap-0.5"><AlertTriangle size={10} /> Over capacity: {overCap.map(c => c.name).join(', ')}</div>}
                                  {isOpen && (
                                    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                                      <button onClick={e => { e.stopPropagation(); rm.startEdit(room); bld.setExpandedId(building.id) }} className="text-white border-0 rounded-md px-3.5 py-1.5 font-semibold cursor-pointer text-xs hover:opacity-90" style={{ background: primaryColor }}>Edit</button>
                                      {rm.deleteId === room.id ? (
                                        <>
                                          <button onClick={e => { e.stopPropagation(); rm.handleDelete(room.id) }} className="bg-red-500 text-white border-0 rounded-md px-3.5 py-1.5 font-semibold cursor-pointer text-xs hover:bg-red-600">Confirm</button>
                                          <button onClick={e => { e.stopPropagation(); rm.setDeleteId(null) }} className="bg-white text-gray-500 border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer text-xs hover:bg-gray-50">Cancel</button>
                                        </>
                                      ) : (
                                        <button onClick={e => { e.stopPropagation(); rm.setDeleteId(room.id) }} className="bg-white text-red-500 border border-red-300 rounded-md px-3 py-1.5 cursor-pointer text-xs hover:bg-red-50">Delete</button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Add room button */}
                        {!showRoomForm && (
                          <button onClick={e => { e.stopPropagation(); rm.startAdd(building) }}
                            className="w-full border rounded-lg py-2 cursor-pointer text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ background: 'transparent', color: primaryColor, borderColor: primaryColor + '60', borderStyle: 'dashed' }}>
                            + Add Room to {building.name}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bell Schedule ───────────────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className={cardCls}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 m-0">Bell Schedule</h3>
              <p className="text-gray-500 text-sm mt-1">Define the periods that make up your school day.</p>
            </div>
            {!sc.showForm && (
              <button onClick={sc.openAdd} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                + Add Period
              </button>
            )}
          </div>

          {sc.success && <p className="text-green-700 text-sm mb-4 font-medium flex items-center gap-1"><Check size={14} />{sc.success}</p>}
          {sc.error && !sc.showForm && <p className="text-red-500 text-sm mb-4">{sc.error}</p>}

          {/* Period add/edit form */}
          {sc.showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {sc.editingId ? 'Edit Period' : 'New Period'}
              </div>
              {sc.error && <p className="text-red-500 text-sm mb-3">{sc.error}</p>}
              <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div><label className={labelCls}>Name *</label><input value={sc.form.name} onChange={e => sc.setForm({ ...sc.form, name: e.target.value })} placeholder="e.g. Period 1" className={fieldCls} /></div>
                <div><label className={labelCls}>Type</label><select value={sc.form.type} onChange={e => sc.setForm({ ...sc.form, type: e.target.value })} className={fieldCls}>{PERIOD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className={labelCls}>Start Time *</label><input type="time" value={sc.form.start_time} onChange={e => sc.setForm({ ...sc.form, start_time: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>End Time *</label>  <input type="time" value={sc.form.end_time}   onChange={e => sc.setForm({ ...sc.form, end_time:   e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>Days</label><select value={sc.form.days_of_week} onChange={e => sc.setForm({ ...sc.form, days_of_week: e.target.value })} className={fieldCls}>{DAYS_OPTIONS.map(d => <option key={d}>{d}</option>)}</select></div>
              </div>
              <div className="flex gap-2">
                <button onClick={sc.handleSave} disabled={sc.saving} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                  {sc.saving ? 'Saving…' : sc.editingId ? 'Update Period' : 'Add Period'}
                </button>
                <button onClick={sc.cancelForm} className="bg-white text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {/* Periods list */}
          {sc.loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : sc.periods.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="mb-3 flex justify-center"><Bell size={40} className="text-gray-300" /></div>
              <p className="m-0">No periods yet. Add your first period to build your bell schedule.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sc.periods.map(period => {
                const color      = PERIOD_TYPE_COLORS[period.type] || '#6b7280'
                const isDeleting = sc.deleteId === period.id
                return (
                  <div key={period.id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border-l-4"
                    style={{ border: `1px solid ${color}25`, borderLeft: `4px solid ${color}`, background: isDeleting ? '#fef2f2' : '#fafafa' }}>
                    <div className="flex-1 grid gap-2 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{period.name}</div>
                        <div className="text-xs font-semibold mt-0.5" style={{ color }}>{period.type}</div>
                      </div>
                      <div className="text-sm text-gray-700">{fmt12(period.start_time)} – {fmt12(period.end_time)}</div>
                      <div className="text-xs text-gray-500">{period.days_of_week}</div>
                    </div>
                    {isDeleting ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-red-700">Delete?</span>
                        <button onClick={() => sc.handleDelete(period.id)} className="bg-red-500 text-white border-0 rounded-md px-2.5 py-1 cursor-pointer text-xs font-semibold hover:bg-red-600">Yes</button>
                        <button onClick={() => sc.setDeleteId(null)} className="bg-white text-gray-500 border border-gray-300 rounded-md px-2.5 py-1 cursor-pointer text-xs hover:bg-gray-50">No</button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button onClick={() => sc.openEdit(period)} className="text-xs font-semibold border rounded-md px-2.5 py-1 cursor-pointer hover:opacity-80" style={{ color: primaryColor, borderColor: primaryColor, background: 'none' }}>Edit</button>
                        <button onClick={() => sc.setDeleteId(period.id)} className="text-gray-400 bg-transparent border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:border-gray-400 flex items-center"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 my-6" />
}

function SaveBar({ saving, success, error, onSave, primaryColor = '#f97316' }) {
  return (
    <div className="mt-8 flex items-center gap-4 flex-wrap">
      <button onClick={onSave} disabled={saving}
        className="text-white border-0 rounded-lg px-8 py-3 font-bold cursor-pointer text-base disabled:opacity-70 hover:opacity-90 transition-opacity"
        style={{ background: primaryColor }}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      {success && <span className="text-green-700 text-sm font-medium flex items-center gap-1"><Check size={14} />{success}</span>}
      {error   && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
