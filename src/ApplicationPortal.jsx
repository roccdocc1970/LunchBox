import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ALL_GRADES = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade']
const SOURCES = ['Web', 'Referral', 'Word of Mouth', 'Social Media', 'Tour', 'Other']

const today = () => new Date().toISOString().split('T')[0]

const BLANK = {
  parent_first_name: '', parent_last_name: '', email: '', phone: '',
  student_first_name: '', student_last_name: '', grade_applying_for: '',
  source: '', notes: '',
  _honeypot: '',
}

const labelCls = 'block text-[0.8rem] font-semibold text-gray-700 mb-1'
const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.9rem] outline-none'
const SectionHead = ({ text }) => (
  <div className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest mb-3.5 mt-1">{text}</div>
)

export default function ApplicationPortal({ schoolId }) {
  const [school, setSchool] = useState(null)
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchSchool = async () => {
      const { data } = await supabase.from('schools').select('name, logo_url, primary_color, motto, divisions')
        .eq('user_id', schoolId).maybeSingle()
      if (data) setSchool(data)
      else setNotFound(true)
      setLoadingSchool(false)
    }
    if (schoolId) fetchSchool()
    else { setNotFound(true); setLoadingSchool(false) }
  }, [schoolId])

  const availableGrades = (() => {
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
  })()

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form._honeypot) return

    if (!form.parent_first_name.trim() || !form.parent_last_name.trim()) {
      setError('Parent name is required.')
      return
    }
    if (!form.student_first_name.trim() || !form.student_last_name.trim()) {
      setError('Student name is required.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Please provide at least one contact method (email or phone).')
      return
    }

    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('inquiries').insert([{
      school_id: schoolId,
      parent_first_name: form.parent_first_name.trim(),
      parent_last_name: form.parent_last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      student_first_name: form.student_first_name.trim(),
      student_last_name: form.student_last_name.trim(),
      grade_applying_for: form.grade_applying_for || null,
      source: form.source || 'Web',
      notes: form.notes.trim() || null,
      status: 'New Inquiry',
      inquiry_date: today(),
    }])
    setSaving(false)
    if (err) setError('Something went wrong. Please try again.')
    else setSubmitted(true)
  }

  const primaryColor = school?.primary_color || '#f97316'

  if (loadingSchool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-base">Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-[3rem] mb-4">🍱</div>
          <h2 className="text-gray-800 mb-2">Application Not Found</h2>
          <p>This application link may be invalid or expired. Please contact the school directly.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-[1.25rem] shadow-xl p-12 max-w-[480px] w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[2rem]">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mt-0 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Thank you for your interest in <strong>{school?.name}</strong>. The admissions team will be in touch soon.
          </p>
          <div className="border-t border-gray-100 pt-6">
            <div className="text-[2rem] mb-1">🍱</div>
            <div className="text-[0.8rem] text-gray-400">Powered by LunchBox</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center gap-3.5 px-8 py-5" style={{ background: primaryColor }}>
        {school?.logo_url
          ? <img src={school.logo_url} alt="School logo" className="h-8 rounded object-contain" onError={e => e.target.style.display = 'none'} />
          : <span className="text-[1.75rem]">🍱</span>
        }
        <div>
          <div className="text-white font-bold text-[1.15rem] leading-tight">{school?.name}</div>
          {school?.motto && <div className="text-white/75 text-xs">{school.motto}</div>}
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-[600px] mx-auto mt-10 mb-8 px-4">
        <div className="bg-white rounded-[1.25rem] shadow-lg p-8">
          <h2 className="text-[1.4rem] font-bold text-gray-800 mt-0 mb-1">Admissions Inquiry</h2>
          <p className="text-gray-500 text-[0.9rem] mt-0 mb-7 leading-relaxed">
            Fill out the form below and our admissions team will reach out shortly.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Honeypot — hidden from humans */}
            <input
              type="text"
              name="website"
              value={form._honeypot}
              onChange={e => set('_honeypot', e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <SectionHead text="Parent / Guardian Information" />
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input className={fieldCls} value={form.parent_first_name} onChange={e => set('parent_first_name', e.target.value)} placeholder="Jane" />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input className={fieldCls} value={form.parent_last_name} onChange={e => set('parent_last_name', e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={fieldCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" className={fieldCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>

            <SectionHead text="Student Information" />
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input className={fieldCls} value={form.student_first_name} onChange={e => set('student_first_name', e.target.value)} placeholder="Alex" />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input className={fieldCls} value={form.student_last_name} onChange={e => set('student_last_name', e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="mb-6">
              <label className={labelCls}>Grade Applying For</label>
              <select className={`${fieldCls} cursor-pointer`} value={form.grade_applying_for} onChange={e => set('grade_applying_for', e.target.value)}>
                <option value="">Select a grade...</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <SectionHead text="Additional Information" />
            <div className="mb-3.5">
              <label className={labelCls}>How did you hear about us?</label>
              <select className={`${fieldCls} cursor-pointer`} value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">Select one...</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-7">
              <label className={labelCls}>Any questions or notes?</label>
              <textarea
                className={`${fieldCls} resize-y min-h-[80px]`}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Anything you'd like us to know..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-500 text-sm mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full text-white border-0 rounded-xl py-3 font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: primaryColor }}
            >
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4 mb-0">
              Your information is kept private and will only be used by {school?.name} admissions staff.
            </p>
          </form>
        </div>

        <div className="text-center mt-6 mb-8">
          <span className="text-[0.8rem] text-gray-400">Powered by </span>
          <span className="text-[0.8rem] text-gray-400 font-semibold">🍱 LunchBox</span>
        </div>
      </div>
    </div>
  )
}
