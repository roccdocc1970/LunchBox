import { useState } from 'react'
import { supabase } from './supabase'

export default function Settings({ user, school, onUpdate }) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: school?.name || '',
    principal_name: school?.principal_name || '',
    phone: school?.phone || '',
    address: school?.address || '',
    city: school?.city || '',
    state: school?.state || '',
    zip: school?.zip || '',
    website: school?.website || '',
    school_type: school?.school_type || 'Private',
    student_capacity: school?.student_capacity || ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    if (!form.name) {
      setError('School name is required.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase
      .from('schools')
      .update({ ...form })
      .eq('user_id', user.id)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Settings saved successfully!')
      onUpdate(form)
    }
    setSaving(false)
  }

  const fields = [
    { label: 'School Name', name: 'name', type: 'text', required: true, placeholder: 'e.g. Riverside Academy' },
    { label: 'Principal / Director Name', name: 'principal_name', type: 'text', placeholder: 'e.g. Dr. Jane Smith' },
    { label: 'Phone', name: 'phone', type: 'tel', placeholder: 'e.g. (555) 123-4567' },
    { label: 'Street Address', name: 'address', type: 'text', placeholder: 'e.g. 123 Main Street' },
    { label: 'City', name: 'city', type: 'text', placeholder: 'City' },
    { label: 'State', name: 'state', type: 'text', placeholder: 'MI' },
    { label: 'ZIP', name: 'zip', type: 'text', placeholder: '48146' },
    { label: 'Website', name: 'website', type: 'text', placeholder: 'www.yourschool.com' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>School Settings</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Update your school information and preferences</p>
      </div>

      {/* School Info Card */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1.5rem' }}>School Information</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {fields.map((field) => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.625rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }}
              />
            </div>
          ))}

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
      </div>

      {/* Account Card */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '1rem' }}>Account</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>Admin Email</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{user.email}</div>
          </div>
          <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}>Active</span>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem' }}>{success}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 2rem', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

    </div>
  )
}