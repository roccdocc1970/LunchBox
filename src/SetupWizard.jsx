import { GraduationCap, School, BookOpen, FileText, Palette, Check, AlertTriangle } from 'lucide-react'
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

const STEP_ICONS = [GraduationCap, School, BookOpen, FileText, Palette]

const STEPS = [
  { title: 'Grade Levels', subtitle: 'Which grades does your school serve?' },
  { title: 'School Divisions', subtitle: 'Group grades into named divisions like Lower School or Upper School. Totally optional.' },
  { title: 'Subjects Offered', subtitle: 'These will appear as rows on every report card.' },
  { title: 'Grading Configuration', subtitle: 'How your school grades students and structures the academic year.' },
  { title: 'Brand & Appearance', subtitle: 'Give LunchBox your school\'s look and feel.' },
]

const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5'
const fieldCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-[0.95rem]'
const hintCls = 'text-[0.8rem] text-gray-400 mt-1.5'

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

  const currentStep = STEPS[step - 1]

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="mb-5">
            <div className="text-[0.8rem] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Quick Setup — Step {step} of {TOTAL_STEPS}
            </div>
            <h2 className="text-[1.4rem] font-extrabold text-gray-800 m-0 flex items-center gap-2">
              {(() => { const Icon = STEP_ICONS[step - 1]; return Icon ? <Icon size={22} style={{ color: primaryColor }} /> : null })()}
              {currentStep.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 mb-0">{currentStep.subtitle}</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                style={{ background: i < step ? primaryColor : '#e5e7eb' }} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">

          {/* Step 1 — Grades */}
          {step === 1 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">{grades.length} selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setGrades([...ALL_GRADES])} className="bg-transparent border border-gray-300 rounded px-2.5 py-0.5 text-[0.8rem] cursor-pointer text-gray-500 hover:bg-gray-50">Select All</button>
                  <button onClick={() => setGrades([])} className="bg-transparent border border-gray-300 rounded px-2.5 py-0.5 text-[0.8rem] cursor-pointer text-gray-500 hover:bg-gray-50">Clear</button>
                </div>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {ALL_GRADES.map(grade => {
                  const checked = grades.includes(grade)
                  return (
                    <div
                      key={grade}
                      onClick={() => toggleGrade(grade)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all"
                      style={{ borderColor: checked ? primaryColor : '#e5e7eb', background: checked ? primaryColor + '12' : 'white' }}
                    >
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{ border: `2px solid ${checked ? primaryColor : '#d1d5db'}`, background: checked ? primaryColor : 'white' }}>
                        {checked && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm" style={{ color: checked ? primaryColor : '#374151', fontWeight: checked ? '600' : '400' }}>{grade}</span>
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
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                  <div className="mb-2 flex justify-center"><AlertTriangle size={32} className="text-amber-400" /></div>
                  <p className="text-gray-500 m-0">No grades selected yet. Go back to Step 1 and select grade levels first, or skip this step and configure divisions in Settings later.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {divisions.map((div, i) => {
                    const color = DIVISION_COLORS[i % DIVISION_COLORS.length]
                    const sorted = [...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
                    return (
                      <div key={i} className="rounded-xl p-4" style={{ border: `2px solid ${color}20`, background: `${color}06` }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <input
                            value={div.name}
                            onChange={e => updateDivisionName(i, e.target.value)}
                            className="flex-1 rounded-lg px-3 py-1.5 outline-none font-semibold text-[0.95rem] bg-white"
                            style={{ border: `1px solid ${color}40`, color }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sorted.map(grade => {
                            const inThis = div.grades.includes(grade)
                            const inOther = !inThis && divisions.some((d, j) => j !== i && d.grades.includes(grade))
                            return (
                              <button
                                key={grade}
                                onClick={() => !inOther && toggleGradeInDiv(i, grade)}
                                disabled={inOther}
                                className="px-2.5 py-0.5 rounded-full text-[0.8rem] border-[1.5px] cursor-pointer transition-all disabled:cursor-not-allowed"
                                style={{
                                  fontWeight: inThis ? '600' : '400',
                                  borderColor: inThis ? color : '#d1d5db',
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
                        <p className="text-xs text-gray-400 mt-2 mb-0">
                          {div.grades.length === 0 ? 'No grades assigned' : `${div.grades.length} grade${div.grades.length !== 1 ? 's' : ''} assigned`}
                        </p>
                      </div>
                    )
                  })}
                  <p className={hintCls}>You can add, remove, and rename divisions anytime in Settings → Academic Config.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Subjects */}
          {step === 3 && (
            <div>
              <label className={labelCls}>Subjects (one per line)</label>
              <textarea
                value={subjects}
                onChange={e => setSubjects(e.target.value)}
                rows={10}
                className={`${fieldCls} resize-y leading-relaxed`}
                style={{ fontFamily: 'inherit' }}
                placeholder="One subject per line..."
              />
              <p className={hintCls}>These appear as rows on every report card. Edit anytime in Settings → Academic Config.</p>
            </div>
          )}

          {/* Step 4 — Grading Config */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelCls}>Grading Scale</label>
                {[
                  { value: 'Letter', label: 'Letter Grades', desc: 'A, B, C, D, F' },
                  { value: 'Standards', label: 'Standards-Based', desc: '4 — Exceeds, 3 — Meets, 2 — Approaching, 1 — Below' },
                  { value: 'Satisfactory', label: 'Satisfactory / Needs Improvement', desc: 'E — Excellent, S — Satisfactory, N — Needs Improvement' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setGradingScale(opt.value)}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer mb-2 select-none transition-all"
                    style={{ borderColor: gradingScale === opt.value ? primaryColor : '#e5e7eb', background: gradingScale === opt.value ? primaryColor + '08' : 'white' }}
                  >
                    <div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ borderColor: gradingScale === opt.value ? primaryColor : '#d1d5db', background: gradingScale === opt.value ? primaryColor : 'white' }}>
                      {gradingScale === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-[0.9rem]">{opt.label}</div>
                      <div className="text-gray-500 text-[0.8rem] mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className={labelCls}>Grading Periods</label>
                <select value={gradingPeriod} onChange={e => setGradingPeriod(e.target.value)} className={fieldCls}>
                  {['Quarters', 'Trimesters', 'Semesters', 'Annual'].map(g => <option key={g}>{g}</option>)}
                </select>
                <p className={hintCls}>Drives the term options on report cards (Q1–Q4, T1–T3, S1–S2, or Annual).</p>
              </div>
            </div>
          )}

          {/* Step 5 — Appearance */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className={labelCls}>Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 p-0.5 cursor-pointer bg-white" />
                  <input type="text" value={primaryColor}
                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value) }}
                    className="w-[120px] border border-gray-300 rounded-lg px-3 py-2 outline-none text-[0.95rem] font-mono" />
                  <span className="text-sm text-gray-500">Used across the nav, buttons, and highlights.</span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {['#f97316', '#6366f1', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444', '#1f2937'].map(c => (
                    <button key={c} onClick={() => setPrimaryColor(c)}
                      className="w-7 h-7 rounded-full cursor-pointer outline-none border-2 transition-all"
                      style={{ background: c, borderColor: primaryColor === c ? '#1f2937' : 'transparent' }}
                      title={c} />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>School Motto / Tagline <span className="font-normal text-gray-400">(optional)</span></label>
                <input value={motto} onChange={e => setMotto(e.target.value)} placeholder="e.g. Inspiring Minds, Building Futures" className={fieldCls} />
                <p className={hintCls}>Shown under your school name in the top nav.</p>
              </div>
              <div>
                <label className={labelCls}>School Logo URL <span className="font-normal text-gray-400">(optional)</span></label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://yourschool.com/logo.png" className={fieldCls} />
                <p className={hintCls}>Direct link to your logo image. Shown in the top nav.</p>
                {logoUrl && <img src={logoUrl} alt="Logo preview" onError={e => e.target.style.display = 'none'} className="mt-3 max-h-14 rounded border border-gray-200 p-1" />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center gap-4">
          <div className="flex gap-3 items-center">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="bg-transparent border border-gray-200 rounded-lg px-4 py-2 cursor-pointer text-gray-500 text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
            )}
            <button onClick={skip} className="bg-transparent border-0 cursor-pointer text-gray-400 text-sm px-1 py-2 hover:text-gray-600">
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
            className="text-white border-0 rounded-lg px-6 py-2.5 font-bold cursor-pointer text-[0.95rem] disabled:opacity-70 hover:opacity-90 transition-opacity"
            style={{ background: primaryColor }}
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Finish Setup 🎉' : 'Save & Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}
