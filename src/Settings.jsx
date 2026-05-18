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

  const sc = useSchedule(user.id)
  const bld = useBuildings(user.id)
  const rm = useRooms(user, school)

  const divisions = parseDivisions(school?.divisions)
    .map((d, i) => ({ ...d, color: DIVISION_COLORS[i % DIVISION_COLORS.length] }))
    .filter(d => d.grades?.length > 0)

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }

  const tabs = [
    { id: 'profile',      label: 'School Profile',  icon: '🏫' },
    { id: 'academic',     label: 'Academic Config',  icon: '📚' },
    { id: 'schedule',     label: 'Bell Schedule',    icon: '🔔' },
    { id: 'campus',       label: 'Campus',           icon: '🏛️' },
    { id: 'communication', label: 'Communication',   icon: '✉️' },
    { id: 'appearance',   label: 'Appearance',       icon: '🎨' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Settings</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Configure your school profile and platform preferences</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'white', borderRadius: '0.75rem', padding: '0.375rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            style={{
              flex: 1, minWidth: '120px', padding: '0.625rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? primaryColor : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s',
            }}
          >
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: School Profile */}
      {activeTab === 'profile' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>School Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'School Name', name: 'name', type: 'text', required: true, placeholder: 'e.g. Riverside Academy' },
              { label: 'Principal / Director Name', name: 'principal_name', type: 'text', placeholder: 'e.g. Dr. Jane Smith' },
              { label: 'Phone', name: 'phone', type: 'tel', placeholder: '(555) 123-4567' },
              { label: 'Street Address', name: 'address', type: 'text', placeholder: '123 Main Street' },
              { label: 'City', name: 'city', type: 'text', placeholder: 'City' },
              { label: 'State', name: 'state', type: 'text', placeholder: 'MI' },
              { label: 'ZIP', name: 'zip', type: 'text', placeholder: '48146' },
              { label: 'Website', name: 'website', type: 'text', placeholder: 'www.yourschool.com' },
            ].map(f => (
              <div key={f.name}>
                <label style={labelStyle}>{f.label}{f.required && <span style={{ color: '#ef4444' }}> *</span>}</label>
                <input type={f.type} value={profile[f.name]} onChange={e => setProfile({ ...profile, [f.name]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>School Type</label>
              <select value={profile.school_type} onChange={e => setProfile({ ...profile, school_type: e.target.value })} style={inputStyle}>
                {SCHOOL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Total Student Capacity</label>
              <input type="number" value={profile.student_capacity} onChange={e => setProfile({ ...profile, student_capacity: e.target.value })} placeholder="e.g. 250" style={inputStyle} />
            </div>
          </div>

          <Divider />

          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Admin Email</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{user.email}</div>
            </div>
            <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>Active</span>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveProfile} />
        </div>
      )}

      {/* Tab: Academic Config */}
      {activeTab === 'academic' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>Academic Configuration</h3>

          {/* Grade Levels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Grade Levels Offered</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => selectAllGrades(ALL_GRADES)} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Select All</button>
                <button onClick={clearAllGrades} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Clear</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {ALL_GRADES.map(grade => {
                const checked = academic.grades_offered.includes(grade)
                return (
                  <div
                    key={grade}
                    onClick={() => toggleGrade(grade)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `2px solid ${checked ? primaryColor : '#e5e7eb'}`, background: checked ? primaryColor + '12' : 'white', cursor: 'pointer', userSelect: 'none', transition: 'all 0.1s' }}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${checked ? primaryColor : '#d1d5db'}`, background: checked ? primaryColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: checked ? primaryColor : '#374151', fontWeight: checked ? '600' : '400' }}>{grade}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>{academic.grades_offered.length} grade{academic.grades_offered.length !== 1 ? 's' : ''} selected</p>
          </div>

          <Divider />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Academic Year</label>
              <input value={academic.academic_year} onChange={e => setAcademic({ ...academic, academic_year: e.target.value })} placeholder="e.g. 2024-2025" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>School Year Start</label>
              <select value={academic.school_year_start} onChange={e => setAcademic({ ...academic, school_year_start: e.target.value })} style={inputStyle}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>School Year End</label>
              <select value={academic.school_year_end} onChange={e => setAcademic({ ...academic, school_year_end: e.target.value })} style={inputStyle}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Grading Periods</label>
              <select value={academic.grading_period} onChange={e => setAcademic({ ...academic, grading_period: e.target.value })} style={inputStyle}>
                {['Quarters', 'Trimesters', 'Semesters', 'Annual'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Default Enrollment Status</label>
              <select value={academic.default_enrollment_status} onChange={e => setAcademic({ ...academic, default_enrollment_status: e.target.value })} style={inputStyle}>
                <option>Applied</option>
                <option>Enrolled</option>
              </select>
            </div>
          </div>

          <Divider />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Grading Scale</label>
              <select value={academic.grading_scale} onChange={e => setAcademic({ ...academic, grading_scale: e.target.value })} style={inputStyle}>
                <option value="Letter">Letter Grades (A, B, C…)</option>
                <option value="Standards">Standards-Based (4, 3, 2, 1)</option>
                <option value="Satisfactory">Satisfactory (E, S, N)</option>
              </select>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Used on report cards across all grades.</p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Subjects Offered</label>
            <textarea
              value={academic.subjects_offered}
              onChange={e => setAcademic({ ...academic, subjects_offered: e.target.value })}
              rows={9}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="One subject per line..."
            />
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>One subject per line. These appear as rows on every report card.</p>
          </div>

          <Divider />

          {/* Divisions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>School Divisions</h4>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>Group your grades into named divisions (e.g. Lower School, Upper School). Each grade can only belong to one division.</p>
              </div>
              {academic.divisions.length < 6 && (
                <button
                  onClick={addDivision}
                  style={{ background: 'transparent', border: `1px solid ${primaryColor}`, borderRadius: '0.5rem', padding: '0.375rem 0.875rem', color: primaryColor, fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                >
                  + Add Division
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {academic.divisions.map((div, i) => {
                const color = DIVISION_COLORS[i % DIVISION_COLORS.length]
                return (
                  <div key={i} style={{ border: `2px solid ${color}20`, borderRadius: '0.75rem', padding: '1rem', background: `${color}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <input
                        value={div.name}
                        onChange={e => updateDivisionName(i, e.target.value)}
                        style={{ ...inputStyle, fontWeight: '600', color, border: `1px solid ${color}40`, background: 'white', flex: 1 }}
                      />
                      <button
                        onClick={() => removeDivision(i)}
                        style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#9ca3af', fontSize: '0.875rem' }}
                        title="Remove division"
                      >✕</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {academic.grades_offered.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Select grade levels above to assign them to divisions.</span>
                      )}
                      {[...academic.grades_offered].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b)).map(grade => {
                        const inThis = div.grades.includes(grade)
                        const inOther = !inThis && academic.divisions.some((d, j) => j !== i && d.grades.includes(grade))
                        return (
                          <button
                            key={grade}
                            onClick={() => !inOther && toggleGradeInDiv(i, grade)}
                            disabled={inOther}
                            style={{
                              padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: inThis ? '600' : '400', cursor: inOther ? 'not-allowed' : 'pointer', border: `1.5px solid ${inThis ? color : '#d1d5db'}`,
                              background: inThis ? color : inOther ? '#f3f4f6' : 'white',
                              color: inThis ? 'white' : inOther ? '#d1d5db' : '#374151',
                              opacity: inOther ? 0.5 : 1,
                            }}
                          >
                            {grade}
                          </button>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>
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

      {/* Tab: Communication */}
      {activeTab === 'communication' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '0.5rem' }}>Communication Defaults</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>These settings apply to all parent messages sent from LunchBox.</p>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Reply-To Email Address</label>
              <input type="email" value={communication.reply_to_email} onChange={e => setCommunication({ ...communication, reply_to_email: e.target.value })} placeholder="e.g. admin@yourschool.com" style={inputStyle} />
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Parents who reply to messages will reach this address.</p>
            </div>
            <div>
              <label style={labelStyle}>Email Signature / Footer</label>
              <textarea
                value={communication.email_signature}
                onChange={e => setCommunication({ ...communication, email_signature: e.target.value })}
                rows={5}
                placeholder={`e.g.\n\nWarm regards,\nRiverside Academy\n(555) 123-4567\nwww.riversideacademy.edu`}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Appended to the bottom of every parent message.</p>
            </div>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveCommunication} />
        </div>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>Appearance & Branding</h3>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>School Logo URL</label>
              <input value={appearance.logo_url} onChange={e => setAppearance({ ...appearance, logo_url: e.target.value })} placeholder="https://yourschool.com/logo.png" style={inputStyle} />
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Paste a direct link to your school logo image.</p>
              {appearance.logo_url && (
                <img src={appearance.logo_url} alt="Logo preview" onError={e => e.target.style.display = 'none'}
                  style={{ marginTop: '0.75rem', maxHeight: '60px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '0.25rem' }} />
              )}
            </div>

            <div>
              <label style={labelStyle}>School Motto / Tagline</label>
              <input value={appearance.motto} onChange={e => setAppearance({ ...appearance, motto: e.target.value })} placeholder="e.g. Inspiring Minds, Building Futures" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  value={appearance.primary_color}
                  onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })}
                  style={{ width: '48px', height: '40px', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '2px', cursor: 'pointer' }}
                />
                <input
                  value={appearance.primary_color}
                  onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })}
                  placeholder="#f97316"
                  style={{ ...inputStyle, width: '140px' }}
                />
                <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: appearance.primary_color, border: '1px solid #e5e7eb' }} />
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Preview</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Used for accent colors and branding throughout the platform.</p>
            </div>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={saveAppearance} />
        </div>
      )}

      {/* ── Tab: Campus ────────────────────────────────────────────────────── */}
      {activeTab === 'campus' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Campus</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Buildings contain rooms. Expand a building to manage its spaces.</p>
            </div>
            {!bld.showForm && (
              <button onClick={bld.openAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                + Add Building
              </button>
            )}
          </div>

          {bld.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {bld.success}</p>}
          {bld.error && !bld.showForm && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{bld.error}</p>}

          {/* Add / Edit form */}
          {bld.showForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {bld.editingId ? 'Edit Building' : 'New Building'}
              </div>
              {bld.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{bld.error}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Building Name *</label>
                  <input value={bld.form.name} onChange={e => bld.setForm({ ...bld.form, name: e.target.value })} placeholder="e.g. Main Hall" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={bld.form.type} onChange={e => bld.setForm({ ...bld.form, type: e.target.value })} style={inputStyle}>
                    {BUILDING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <input value={bld.form.notes || ''} onChange={e => bld.setForm({ ...bld.form, notes: e.target.value })} placeholder="Optional notes about this building" style={inputStyle} />
                </div>
              </div>

              {/* Floor editor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Floors</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    value={bld.newFloor}
                    onChange={e => bld.setNewFloor(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && bld.addFloor()}
                    placeholder="e.g. Ground Floor"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={bld.addFloor}
                    style={{ background: primaryColor + '18', color: primaryColor, border: `1px solid ${primaryColor}40`, borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                  >+ Add</button>
                </div>
                {bld.form.floors.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {bld.form.floors.map((floor, i) => (
                      <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{floor}</span>
                        <button onClick={() => bld.moveFloor(floor, -1)} disabled={i === 0} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' }}>↑</button>
                        <button onClick={() => bld.moveFloor(floor, 1)} disabled={i === bld.form.floors.length - 1} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: i === bld.form.floors.length - 1 ? 'not-allowed' : 'pointer', color: i === bld.form.floors.length - 1 ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' }}>↓</button>
                        <button onClick={() => bld.removeFloor(floor)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No floors added yet. Floors let you organize rooms by level.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={bld.handleSave} disabled={bld.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                  {bld.saving ? 'Saving…' : bld.editingId ? 'Update Building' : 'Add Building'}
                </button>
                <button onClick={bld.cancelForm} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {bld.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {bld.success}</p>}
          {rm.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {rm.success}</p>}
          {bld.error && !bld.showForm && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{bld.error}</p>}

          {/* Building add/edit form */}
          {bld.showForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {bld.editingId ? 'Edit Building' : 'New Building'}
              </div>
              {bld.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{bld.error}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Building Name *</label>
                  <input value={bld.form.name} onChange={e => bld.setForm({ ...bld.form, name: e.target.value })} placeholder="e.g. Main Hall" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={bld.form.type} onChange={e => bld.setForm({ ...bld.form, type: e.target.value })} style={inputStyle}>
                    {BUILDING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <input value={bld.form.notes || ''} onChange={e => bld.setForm({ ...bld.form, notes: e.target.value })} placeholder="Optional notes about this building" style={inputStyle} />
                </div>
              </div>

              {/* Floor editor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Floors</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={bld.newFloor} onChange={e => bld.setNewFloor(e.target.value)} onKeyDown={e => e.key === 'Enter' && bld.addFloor()} placeholder="e.g. Ground Floor" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={bld.addFloor} style={{ background: primaryColor + '18', color: primaryColor, border: `1px solid ${primaryColor}40`, borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
                {bld.form.floors.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {bld.form.floors.map((floor, i) => (
                      <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{floor}</span>
                        <button onClick={() => bld.moveFloor(floor, -1)} disabled={i === 0} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' }}>↑</button>
                        <button onClick={() => bld.moveFloor(floor, 1)} disabled={i === bld.form.floors.length - 1} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: i === bld.form.floors.length - 1 ? 'not-allowed' : 'pointer', color: i === bld.form.floors.length - 1 ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' }}>↓</button>
                        <button onClick={() => bld.removeFloor(floor)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No floors added yet.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={bld.handleSave} disabled={bld.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                  {bld.saving ? 'Saving…' : bld.editingId ? 'Update Building' : 'Add Building'}
                </button>
                <button onClick={bld.cancelForm} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Buildings list with nested rooms */}
          {bld.loading || rm.loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>
          ) : bld.buildings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
              <p style={{ margin: 0 }}>No buildings yet. Add your first building to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bld.buildings.map(building => {
                const bldColor   = BUILDING_TYPE_COLORS[building.type] || '#6b7280'
                const floors     = Array.isArray(building.floors) ? building.floors : []
                const isExpanded = bld.expandedId === building.id
                const isDeleting = bld.deleteId === building.id
                const roomsHere  = rm.rooms.filter(r => r.building_id === building.id)
                const hasRooms   = roomsHere.length > 0
                const showRoomForm = rm.editing && rm.form.building_id === building.id

                return (
                  <div key={building.id} style={{ border: `1px solid ${bldColor}25`, borderLeft: `4px solid ${bldColor}`, borderRadius: '0.625rem', background: isDeleting ? '#fef2f2' : isExpanded ? '#fafafa' : 'white', overflow: 'hidden' }}>

                    {/* Building header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', cursor: 'pointer' }} onClick={() => { bld.setExpandedId(isExpanded ? null : building.id); rm.cancelEdit() }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{building.name}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: bldColor, background: bldColor + '15', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{building.type}</span>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', background: '#f3f4f6', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                            {roomsHere.length} room{roomsHere.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                          {floors.length > 0 ? `${floors.length} floor${floors.length !== 1 ? 's' : ''}: ${floors.join(', ')}` : 'No floors configured'}
                        </div>
                      </div>

                      {isDeleting ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{hasRooms ? 'Remove rooms first' : 'Delete?'}</span>
                          {!hasRooms && <>
                            <button onClick={() => bld.handleDelete(building.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Yes</button>
                          </>}
                          <button onClick={() => bld.setDeleteId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.8rem' }}>{hasRooms ? 'OK' : 'No'}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          <button onClick={e => { e.stopPropagation(); bld.openEdit(building) }} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                          <button onClick={e => { e.stopPropagation(); bld.setDeleteId(building.id) }} style={{ fontSize: '0.78rem', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer' }}>✕</button>
                          <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded: rooms + inline room form */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '1rem' }}>

                        {/* Floor chips */}
                        {floors.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {floors.map(f => (
                              <span key={f} style={{ background: bldColor + '15', color: bldColor, border: `1px solid ${bldColor}30`, borderRadius: '9999px', padding: '0.2rem 0.625rem', fontSize: '0.78rem', fontWeight: '600' }}>{f}</span>
                            ))}
                          </div>
                        )}
                        {building.notes && (
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.875rem' }}>{building.notes}</p>
                        )}

                        {/* Inline room form */}
                        {showRoomForm && (
                          <div style={{ background: 'white', border: `1px solid ${primaryColor}30`, borderRadius: '0.625rem', padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
                              {rm.selected ? 'Edit Room' : `New Room · ${building.name}`}
                            </div>
                            {rm.error && <p style={{ color: '#ef4444', fontSize: '0.825rem', marginBottom: '0.625rem' }}>{rm.error}</p>}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.875rem' }}>
                              <div>
                                <label style={labelStyle}>Room Name *</label>
                                <input value={rm.form.name} onChange={e => rm.setForm({ ...rm.form, name: e.target.value })} placeholder="e.g. Room 204" style={inputStyle} autoFocus />
                              </div>
                              <div>
                                <label style={labelStyle}>Type</label>
                                <select value={rm.form.type} onChange={e => rm.setForm({ ...rm.form, type: e.target.value })} style={inputStyle}>
                                  {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={labelStyle}>Floor</label>
                                {floors.length > 0 ? (
                                  <select value={rm.form.floor || ''} onChange={e => rm.setForm({ ...rm.form, floor: e.target.value })} style={inputStyle}>
                                    <option value="">— None —</option>
                                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                ) : (
                                  <input value={rm.form.floor || ''} onChange={e => rm.setForm({ ...rm.form, floor: e.target.value })} placeholder="e.g. 2nd Floor" style={inputStyle} />
                                )}
                              </div>
                              <div>
                                <label style={labelStyle}>Capacity</label>
                                <input type="number" min="1" value={rm.form.capacity} onChange={e => rm.setForm({ ...rm.form, capacity: e.target.value })} placeholder="Max students" style={inputStyle} />
                              </div>
                            </div>

                            {divisions.length > 0 && (
                              <div style={{ marginBottom: '0.875rem' }}>
                                <label style={labelStyle}>Divisions</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                  {divisions.map(div => {
                                    const isSel = (rm.form.divisions || []).includes(div.name)
                                    return (
                                      <button key={div.name} type="button" onClick={() => rm.toggleDivision(div.name)} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', background: isSel ? div.color : 'white', color: isSel ? 'white' : div.color, border: `2px solid ${div.color}` }}>
                                        {div.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div style={{ marginBottom: '0.875rem' }}>
                              <label style={labelStyle}>Notes</label>
                              <textarea value={rm.form.notes || ''} onChange={e => rm.setForm({ ...rm.form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="AV equipment, accessibility notes…" />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={rm.handleSave} disabled={rm.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                                {rm.saving ? 'Saving…' : rm.selected ? 'Update Room' : 'Add Room'}
                              </button>
                              <button onClick={rm.cancelEdit} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Rooms list */}
                        {roomsHere.length === 0 && !showRoomForm ? (
                          <p style={{ fontSize: '0.825rem', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 0.875rem' }}>No rooms yet in this building.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: roomsHere.length > 0 ? '0.875rem' : 0 }}>
                            {roomsHere.map(room => {
                              const rc = ROOM_TYPE_COLORS[room.type] || '#6b7280'
                              const roomDivs = parseRoomDivisions(room.divisions)
                              const isOpen = rm.selected?.id === room.id && !rm.editing
                              const overCapacity = room.capacity
                                ? rm.classes.filter(c => c.room_id === room.id && c.class_size && c.class_size > room.capacity)
                                : []

                              return (
                                <div key={room.id} style={{ background: isOpen ? '#fafafa' : 'white', border: isOpen ? `1px solid ${primaryColor}40` : '1px solid #f0f0f0', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', cursor: 'pointer', transition: 'background 0.1s' }}
                                  onClick={() => isOpen ? rm.closeRoom() : rm.openRoom(room)}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{room.name}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: rc, background: rc + '15', borderRadius: '9999px', padding: '0.1rem 0.45rem' }}>{room.type}</span>
                                        {room.floor && <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{room.floor}</span>}
                                        {room.capacity && <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>👥 {room.capacity}</span>}
                                        {roomDivs.map(d => {
                                          const div = divisions.find(x => x.name === d)
                                          const dc = div?.color || '#6b7280'
                                          return <span key={d} style={{ fontSize: '0.65rem', fontWeight: '600', color: dc, background: dc + '15', borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>{d}</span>
                                        })}
                                      </div>
                                      {overCapacity.length > 0 && (
                                        <div style={{ fontSize: '0.72rem', color: '#92400e', marginTop: '0.2rem' }}>⚠️ Over capacity: {overCapacity.map(c => c.name).join(', ')}</div>
                                      )}
                                    </div>
                                    <span style={{ color: '#d1d5db', fontSize: '0.7rem' }}>{isOpen ? '▲' : '▼'}</span>
                                  </div>

                                  {isOpen && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid #f0f0f0' }}>
                                      <button onClick={e => { e.stopPropagation(); rm.startEdit(room); bld.setExpandedId(building.id) }} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.3rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                                      {rm.deleteId === room.id ? (
                                        <>
                                          <button onClick={e => { e.stopPropagation(); rm.handleDelete(room.id) }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.3rem 0.875rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>Confirm</button>
                                          <button onClick={e => { e.stopPropagation(); rm.setDeleteId(null) }} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                                        </>
                                      ) : (
                                        <button onClick={e => { e.stopPropagation(); rm.setDeleteId(room.id) }} style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
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
                          <button onClick={e => { e.stopPropagation(); rm.startAdd(building) }} style={{ background: 'transparent', color: primaryColor, border: `1px dashed ${primaryColor}60`, borderRadius: '0.5rem', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.825rem', fontWeight: '600', width: '100%' }}>
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

      {/* ── Tab: Bell Schedule ─────────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Bell Schedule</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Define the periods that make up your school day.</p>
            </div>
            {!sc.showForm && (
              <button onClick={sc.openAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                + Add Period
              </button>
            )}
          </div>

          {sc.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {sc.success}</p>}
          {sc.error && !sc.showForm && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{sc.error}</p>}

          {/* Add / Edit form */}
          {sc.showForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {sc.editingId ? 'Edit Period' : 'New Period'}
              </div>
              {sc.error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{sc.error}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input value={sc.form.name} onChange={e => sc.setForm({ ...sc.form, name: e.target.value })} placeholder="e.g. Period 1" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={sc.form.type} onChange={e => sc.setForm({ ...sc.form, type: e.target.value })} style={inputStyle}>
                    {PERIOD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input type="time" value={sc.form.start_time} onChange={e => sc.setForm({ ...sc.form, start_time: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Time *</label>
                  <input type="time" value={sc.form.end_time} onChange={e => sc.setForm({ ...sc.form, end_time: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Days</label>
                  <select value={sc.form.days_of_week} onChange={e => sc.setForm({ ...sc.form, days_of_week: e.target.value })} style={inputStyle}>
                    {DAYS_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={sc.handleSave} disabled={sc.saving} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>
                  {sc.saving ? 'Saving…' : sc.editingId ? 'Update Period' : 'Add Period'}
                </button>
                <button onClick={sc.cancelForm} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Periods list */}
          {sc.loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>
          ) : sc.periods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
              <p style={{ margin: 0 }}>No periods yet. Add your first period to build your bell schedule.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sc.periods.map(period => {
                const color = PERIOD_TYPE_COLORS[period.type] || '#6b7280'
                const isDeleting = sc.deleteId === period.id
                return (
                  <div key={period.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', border: `1px solid ${color}25`, borderLeft: `4px solid ${color}`, borderRadius: '0.625rem', background: isDeleting ? '#fef2f2' : '#fafafa' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{period.name}</div>
                        <div style={{ fontSize: '0.72rem', color, fontWeight: '600', marginTop: '0.1rem' }}>{period.type}</div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {fmt12(period.start_time)} – {fmt12(period.end_time)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{period.days_of_week}</div>
                    </div>

                    {isDeleting ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Delete?</span>
                        <button onClick={() => sc.handleDelete(period.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Yes</button>
                        <button onClick={() => sc.setDeleteId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '0.8rem' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => sc.openEdit(period)} style={{ fontSize: '0.78rem', color: primaryColor, background: 'none', border: `1px solid ${primaryColor}`, borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
                        <button onClick={() => sc.setDeleteId(period.id)} style={{ fontSize: '0.78rem', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.2rem 0.625rem', cursor: 'pointer' }}>✕</button>
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
  return <div style={{ borderTop: '1px solid #f3f4f6', margin: '1.5rem 0' }} />
}

function SaveBar({ saving, success, error, onSave, primaryColor = '#f97316' }) {
  return (
    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 2rem', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      {success && <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: '500' }}>✓ {success}</span>}
      {error && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</span>}
    </div>
  )
}
