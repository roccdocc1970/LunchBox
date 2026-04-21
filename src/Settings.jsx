import { useState } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
]

const parseGrades = (val) => {
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const DEFAULT_DIVISIONS = [
  { name: 'Early Childhood', grades: [] },
  { name: 'Lower School', grades: [] },
  { name: 'Intermediate School', grades: [] },
  { name: 'Upper School', grades: [] },
]

const parseDivisionsForEdit = (val) => {
  if (!val) return DEFAULT_DIVISIONS
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(d) && d.length > 0) return d
  } catch {}
  return DEFAULT_DIVISIONS
}

export default function Settings({ user, school, onUpdate }) {
  const primaryColor = school?.primary_color || '#f97316'
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const [profile, setProfile] = useState({
    name: school?.name || '',
    principal_name: school?.principal_name || '',
    phone: school?.phone || '',
    address: school?.address || '',
    city: school?.city || '',
    state: school?.state || '',
    zip: school?.zip || '',
    website: school?.website || '',
    school_type: school?.school_type || 'Private',
    student_capacity: school?.student_capacity || '',
  })

  const parseSubjects = (val) => {
    try {
      const s = JSON.parse(val)
      if (Array.isArray(s) && s.length > 0) return s.join('\n')
    } catch {}
    return 'Reading / ELA\nWriting\nMathematics\nScience\nSocial Studies\nArt\nMusic\nPhysical Education\nSocial-Emotional Learning'
  }

  const [academic, setAcademic] = useState({
    grades_offered: parseGrades(school?.grades_offered),
    academic_year: school?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    school_year_start: school?.school_year_start || 'September',
    school_year_end: school?.school_year_end || 'June',
    grading_period: school?.grading_period || 'Quarters',
    default_enrollment_status: school?.default_enrollment_status || 'Applied',
    grading_scale: school?.grading_scale || 'Letter',
    subjects_offered: parseSubjects(school?.subjects_offered),
    divisions: parseDivisionsForEdit(school?.divisions),
  })

  const [communication, setCommunication] = useState({
    reply_to_email: school?.reply_to_email || '',
    email_signature: school?.email_signature || '',
  })

  const [appearance, setAppearance] = useState({
    logo_url: school?.logo_url || '',
    primary_color: school?.primary_color || '#f97316',
    motto: school?.motto || '',
  })

  const clearFeedback = () => { setSuccess(null); setError(null) }

  const save = async (data) => {
    setSaving(true)
    clearFeedback()
    const { error } = await supabase.from('schools').update(data).eq('user_id', user.id)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Saved successfully!')
      onUpdate({ ...school, ...data })
    }
    setSaving(false)
  }

  const toggleGradeInDiv = (divIndex, grade) => {
    const updated = academic.divisions.map((div, i) => {
      if (i === divIndex) {
        const has = div.grades.includes(grade)
        return { ...div, grades: has ? div.grades.filter(g => g !== grade) : [...div.grades, grade] }
      }
      // remove from any other division that had it
      return { ...div, grades: div.grades.filter(g => g !== grade) }
    })
    setAcademic({ ...academic, divisions: updated })
  }

  const updateDivisionName = (divIndex, name) => {
    const updated = academic.divisions.map((div, i) => i === divIndex ? { ...div, name } : div)
    setAcademic({ ...academic, divisions: updated })
  }

  const removeDivision = (divIndex) => {
    setAcademic({ ...academic, divisions: academic.divisions.filter((_, i) => i !== divIndex) })
  }

  const addDivision = () => {
    if (academic.divisions.length >= 6) return
    setAcademic({ ...academic, divisions: [...academic.divisions, { name: 'New Division', grades: [] }] })
  }

  const toggleGrade = (grade) => {
    const current = academic.grades_offered
    const updated = current.includes(grade)
      ? current.filter(g => g !== grade)
      : [...current, grade]
    setAcademic({ ...academic, grades_offered: updated })
  }

  const selectAllGrades = () => setAcademic({ ...academic, grades_offered: [...ALL_GRADES] })
  const clearAllGrades = () => setAcademic({ ...academic, grades_offered: [] })

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }

  const tabs = [
    { id: 'profile', label: 'School Profile', icon: '🏫' },
    { id: 'academic', label: 'Academic Config', icon: '📚' },
    { id: 'communication', label: 'Communication', icon: '✉️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
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
            onClick={() => { setActiveTab(tab.id); clearFeedback() }}
            style={{
              flex: 1, minWidth: '120px', padding: '0.625rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400',
              background: activeTab === tab.id ? primaryColor : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s'
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
                {['Private', 'Charter', 'Public', 'Montessori', 'Religious', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Total Student Capacity</label>
              <input type="number" value={profile.student_capacity} onChange={e => setProfile({ ...profile, student_capacity: e.target.value })} placeholder="e.g. 250" style={inputStyle} />
            </div>
          </div>

          <Divider />

          {/* Account */}
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Admin Email</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{user.email}</div>
            </div>
            <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>Active</span>
          </div>

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={() => {
            if (!profile.name) { setError('School name is required.'); return }
            save(profile)
          }} />
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
                <button onClick={selectAllGrades} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Select All</button>
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

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={() => save({
            ...academic,
            grades_offered: JSON.stringify(academic.grades_offered),
            subjects_offered: JSON.stringify(
              academic.subjects_offered.split('\n').map(s => s.trim()).filter(Boolean)
            ),
            divisions: JSON.stringify(academic.divisions),
          })} />
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

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={() => save(communication)} />
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

          <SaveBar primaryColor={primaryColor} saving={saving} success={success} error={error} onSave={() => save(appearance)} />
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
