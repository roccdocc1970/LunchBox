import { useState } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const DEFAULT_DIVISIONS = [
  { name: 'Early Childhood', grades: [] },
  { name: 'Lower School', grades: [] },
  { name: 'Intermediate School', grades: [] },
  { name: 'Upper School', grades: [] },
]

const DEFAULT_SUBJECTS = 'Reading / ELA\nWriting\nMathematics\nScience\nSocial Studies\nArt\nMusic\nPhysical Education\nSocial-Emotional Learning'

const parseGrades = (val) => {
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

const parseDivisions = (val) => {
  if (!val) return DEFAULT_DIVISIONS.map(d => ({ ...d }))
  try {
    const d = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(d) && d.length > 0) return d
  } catch {}
  return DEFAULT_DIVISIONS.map(d => ({ ...d }))
}

const parseSubjects = (val) => {
  if (!val) return DEFAULT_SUBJECTS
  try {
    const s = JSON.parse(val)
    if (Array.isArray(s) && s.length > 0) return s.join('\n')
  } catch {}
  return DEFAULT_SUBJECTS
}

const TOTAL_STEPS = 5

const STEPS = [
  { title: 'Grade Levels', subtitle: 'Which grades does your school serve?', icon: '🎓' },
  { title: 'School Divisions', subtitle: 'Group grades into named divisions like Lower School or Upper School. Totally optional.', icon: '🏫' },
  { title: 'Subjects Offered', subtitle: 'These will appear as rows on every report card.', icon: '📚' },
  { title: 'Grading Configuration', subtitle: 'How your school grades students and structures the academic year.', icon: '📝' },
  { title: 'Brand & Appearance', subtitle: 'Give LunchBox your school\'s look and feel.', icon: '🎨' },
]

export default function SetupWizard({ user, school, onDone }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [localSchool, setLocalSchool] = useState(school)

  const [grades, setGrades] = useState(() => parseGrades(school?.grades_offered))
  const [divisions, setDivisions] = useState(() => parseDivisions(school?.divisions))
  const [subjects, setSubjects] = useState(() => parseSubjects(school?.subjects_offered))
  const [gradingScale, setGradingScale] = useState(school?.grading_scale || 'Letter')
  const [gradingPeriod, setGradingPeriod] = useState(school?.grading_period || 'Quarters')
  const [primaryColor, setPrimaryColor] = useState(school?.primary_color || '#f97316')
  const [logoUrl, setLogoUrl] = useState(school?.logo_url || '')
  const [motto, setMotto] = useState(school?.motto || '')

  const advance = (updated) => {
    if (step === TOTAL_STEPS) {
      onDone(updated || localSchool)
    } else {
      setStep(s => s + 1)
    }
  }

  const saveAndNext = async (data) => {
    setSaving(true)
    const { error } = await supabase.from('schools').update(data).eq('user_id', user.id)
    if (!error) {
      const updated = { ...localSchool, ...data }
      setLocalSchool(updated)
      advance(updated)
    }
    setSaving(false)
  }

  const skip = () => advance(null)

  const toggleGrade = (grade) => {
    setGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])
  }

  const toggleGradeInDiv = (divIndex, grade) => {
    setDivisions(prev => prev.map((div, i) => {
      if (i === divIndex) {
        const has = div.grades.includes(grade)
        return { ...div, grades: has ? div.grades.filter(g => g !== grade) : [...div.grades, grade] }
      }
      return { ...div, grades: div.grades.filter(g => g !== grade) }
    }))
  }

  const updateDivisionName = (divIndex, name) => {
    setDivisions(prev => prev.map((div, i) => i === divIndex ? { ...div, name } : div))
  }

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }

  const currentStep = STEPS[step - 1]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Quick Setup — Step {step} of {TOTAL_STEPS}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>
                {currentStep.icon} {currentStep.title}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.375rem 0 0' }}>{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} style={{ flex: 1, height: '4px', borderRadius: '9999px', background: i < step ? primaryColor : '#e5e7eb', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>

          {/* Step 1 — Grades */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{grades.length} selected</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setGrades([...ALL_GRADES])} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Select All</button>
                  <button onClick={() => setGrades([])} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#6b7280' }}>Clear</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {ALL_GRADES.map(grade => {
                  const checked = grades.includes(grade)
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
            </div>
          )}

          {/* Step 2 — Divisions */}
          {step === 2 && (
            <div>
              {grades.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                  <p style={{ color: '#6b7280', margin: 0 }}>No grades selected yet. Go back to Step 1 and select grade levels first, or skip this step and configure divisions in Settings later.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {divisions.map((div, i) => {
                    const color = DIVISION_COLORS[i % DIVISION_COLORS.length]
                    const sorted = [...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
                    return (
                      <div key={i} style={{ border: `2px solid ${color}20`, borderRadius: '0.75rem', padding: '1rem', background: `${color}06` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <input
                            value={div.name}
                            onChange={e => updateDivisionName(i, e.target.value)}
                            style={{ ...inputStyle, fontWeight: '600', color, border: `1px solid ${color}40`, background: 'white', flex: 1, padding: '0.4rem 0.75rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {sorted.map(grade => {
                            const inThis = div.grades.includes(grade)
                            const inOther = !inThis && divisions.some((d, j) => j !== i && d.grades.includes(grade))
                            return (
                              <button
                                key={grade}
                                onClick={() => !inOther && toggleGradeInDiv(i, grade)}
                                disabled={inOther}
                                style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: inThis ? '600' : '400', cursor: inOther ? 'not-allowed' : 'pointer', border: `1.5px solid ${inThis ? color : '#d1d5db'}`, background: inThis ? color : inOther ? '#f3f4f6' : 'white', color: inThis ? 'white' : inOther ? '#d1d5db' : '#374151', opacity: inOther ? 0.5 : 1 }}
                              >
                                {grade}
                              </button>
                            )
                          })}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>
                          {div.grades.length === 0 ? 'No grades assigned' : `${div.grades.length} grade${div.grades.length !== 1 ? 's' : ''} assigned`}
                        </p>
                      </div>
                    )
                  })}
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>You can add, remove, and rename divisions anytime in Settings → Academic Config.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Subjects */}
          {step === 3 && (
            <div>
              <label style={labelStyle}>Subjects (one per line)</label>
              <textarea
                value={subjects}
                onChange={e => setSubjects(e.target.value)}
                rows={10}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                placeholder="One subject per line..."
              />
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>These appear as rows on every report card. Edit anytime in Settings → Academic Config.</p>
            </div>
          )}

          {/* Step 4 — Grading Config */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Grading Scale</label>
                {[
                  { value: 'Letter', label: 'Letter Grades', desc: 'A, B, C, D, F' },
                  { value: 'Standards', label: 'Standards-Based', desc: '4 — Exceeds, 3 — Meets, 2 — Approaching, 1 — Below' },
                  { value: 'Satisfactory', label: 'Satisfactory / Needs Improvement', desc: 'E — Excellent, S — Satisfactory, N — Needs Improvement' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setGradingScale(opt.value)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '0.625rem', border: `2px solid ${gradingScale === opt.value ? primaryColor : '#e5e7eb'}`, background: gradingScale === opt.value ? primaryColor + '08' : 'white', cursor: 'pointer', marginBottom: '0.5rem', userSelect: 'none' }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${gradingScale === opt.value ? primaryColor : '#d1d5db'}`, background: gradingScale === opt.value ? primaryColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      {gradingScale === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{opt.label}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.1rem' }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Grading Periods</label>
                <select value={gradingPeriod} onChange={e => setGradingPeriod(e.target.value)} style={inputStyle}>
                  {['Quarters', 'Trimesters', 'Semesters', 'Annual'].map(g => <option key={g}>{g}</option>)}
                </select>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Drives the term options on report cards (Q1–Q4, T1–T3, S1–S2, or Annual).</p>
              </div>
            </div>
          )}

          {/* Step 5 — Appearance */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Brand Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '48px', height: '40px', borderRadius: '0.375rem', border: '1px solid #d1d5db', padding: '0.15rem', cursor: 'pointer', background: 'white' }} />
                  <input type="text" value={primaryColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value) }} style={{ ...inputStyle, width: '120px', fontFamily: 'monospace' }} />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Used across the nav, buttons, and highlights.</span>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['#f97316', '#6366f1', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444', '#1f2937'].map(c => (
                    <button key={c} onClick={() => setPrimaryColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: primaryColor === c ? '3px solid #1f2937' : '2px solid transparent', cursor: 'pointer', outline: 'none' }} title={c} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>School Motto / Tagline <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></label>
                <input value={motto} onChange={e => setMotto(e.target.value)} placeholder="e.g. Inspiring Minds, Building Futures" style={inputStyle} />
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Shown under your school name in the top nav.</p>
              </div>
              <div>
                <label style={labelStyle}>School Logo URL <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://yourschool.com/logo.png" style={inputStyle} />
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>Direct link to your logo image. Shown in the top nav.</p>
                {logoUrl && <img src={logoUrl} alt="Logo preview" onError={e => e.target.style.display = 'none'} style={{ marginTop: '0.75rem', maxHeight: '56px', borderRadius: '0.375rem', border: '1px solid #e5e7eb', padding: '0.25rem' }} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>
                ← Back
              </button>
            )}
            <button onClick={skip} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0.25rem' }}>
              {step === TOTAL_STEPS ? 'Skip & go to dashboard' : 'Skip for now'}
            </button>
          </div>
          <button
            onClick={() => {
              if (step === 1) saveAndNext({ grades_offered: JSON.stringify(grades) })
              else if (step === 2) saveAndNext({ divisions: JSON.stringify(divisions) })
              else if (step === 3) saveAndNext({ subjects_offered: JSON.stringify(subjects.split('\n').map(s => s.trim()).filter(Boolean)) })
              else if (step === 4) saveAndNext({ grading_scale: gradingScale, grading_period: gradingPeriod })
              else if (step === 5) saveAndNext({ primary_color: primaryColor, logo_url: logoUrl, motto })
            }}
            disabled={saving}
            style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Finish Setup 🎉' : 'Save & Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}
