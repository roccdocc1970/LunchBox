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
    if (form._honeypot) return // silent bot reject

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
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9ca3af', fontSize: '1rem' }}>Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍱</div>
          <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Application Not Found</h2>
          <p>This application link may be invalid or expired. Please contact the school directly.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', padding: '3rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#10b98118', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.75rem' }}>Application Submitted!</h2>
          <p style={{ color: '#6b7280', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Thank you for your interest in <strong>{school?.name}</strong>. The admissions team will be in touch soon.
          </p>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍱</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Powered by LunchBox</div>
          </div>
        </div>
      </div>
    )
  }

  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }
  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }
  const sectionHead = (text) => (
    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', marginTop: '0.25rem' }}>{text}</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Header */}
      <div style={{ background: primaryColor, padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {school?.logo_url
          ? <img src={school.logo_url} alt="School logo" style={{ height: '2rem', borderRadius: '0.25rem', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          : <span style={{ fontSize: '1.75rem' }}>🍱</span>
        }
        <div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.15rem', lineHeight: 1.2 }}>{school?.name}</div>
          {school?.motto && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>{school.motto}</div>}
        </div>
      </div>

      {/* Form card */}
      <div style={{ maxWidth: '600px', margin: '2.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.375rem' }}>Admissions Inquiry</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
            Fill out the form below and our admissions team will reach out shortly.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Honeypot — hidden from humans */}
            <input
              type="text"
              name="website"
              value={form._honeypot}
              onChange={e => set('_honeypot', e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {sectionHead('Parent / Guardian Information')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={form.parent_first_name} onChange={e => set('parent_first_name', e.target.value)} placeholder="Jane" />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={form.parent_last_name} onChange={e => set('parent_last_name', e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="tel" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>

            {sectionHead('Student Information')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={form.student_first_name} onChange={e => set('student_first_name', e.target.value)} placeholder="Alex" />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={form.student_last_name} onChange={e => set('student_last_name', e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Grade Applying For</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.grade_applying_for} onChange={e => set('grade_applying_for', e.target.value)}>
                <option value="">Select a grade...</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {sectionHead('Additional Information')}
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={labelStyle}>How did you hear about us?</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">Select one...</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={labelStyle}>Any questions or notes?</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Anything you'd like us to know..."
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ width: '100%', background: primaryColor, color: 'white', border: 'none', borderRadius: '0.625rem', padding: '0.75rem', fontWeight: '700', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem', marginBottom: 0 }}>
              Your information is kept private and will only be used by {school?.name} admissions staff.
            </p>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Powered by </span>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '600' }}>🍱 LunchBox</span>
        </div>
      </div>
    </div>
  )
}
