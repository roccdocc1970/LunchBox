import { useState } from 'react'
import { supabase } from './supabase'

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    principal_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    school_type: 'Private',
    student_capacity: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFinish = async () => {
    if (!form.name) {
      setError('School name is required.')
      return
    }
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('schools')
      .insert([{ ...form, user_id: user.id }])
    if (error) {
      setError(error.message)
    } else {
      onComplete(form)
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '3rem', width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍱</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1f2937', margin: 0 }}>Welcome to LunchBox!</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Let's get your school set up. It only takes a minute.</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '9999px', background: step >= s ? '#f97316' : '#e5e7eb', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 1 — School Info */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>Step 1 — School Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  School Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Riverside Academy"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Principal / Director Name</label>
                <input
                  type="text"
                  name="principal_name"
                  value={form.principal_name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Smith"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>School Type</label>
                  <select
                    name="school_type"
                    value={form.school_type}
                    onChange={handleChange}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                  >
                    <option>Private</option>
                    <option>Charter</option>
                    <option>Public</option>
                    <option>Montessori</option>
                    <option>Religious</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Student Capacity</label>
                  <input
                    type="number"
                    name="student_capacity"
                    value={form.student_capacity}
                    onChange={handleChange}
                    placeholder="e.g. 250"
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. (555) 123-4567"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!form.name) { setError('Please enter your school name.'); return }
                setError(null)
                setStep(2)
              }}
              style={{ marginTop: '2rem', width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
            >
              Next
            </button>
            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}
          </div>
        )}

        {/* Step 2 — Address & Details */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>Step 2 — Location & Contact</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Main Street"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="MI"
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>ZIP</label>
                  <input
                    type="text"
                    name="zip"
                    value={form.zip}
                    onChange={handleChange}
                    placeholder="48146"
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Website</label>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="e.g. www.riversideacademy.com"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, background: 'white', color: '#374151', border: '2px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{ flex: 2, background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
              >
                {saving ? 'Setting up...' : 'Launch My LunchBox'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}