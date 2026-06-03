import { useState } from 'react'
import { supabase } from './supabase'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-[0.95rem]'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

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
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-[600px]">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[3rem] mb-2">🍱</div>
          <h1 className="text-[1.75rem] font-extrabold text-gray-800 m-0">Welcome to LunchBox!</h1>
          <p className="text-gray-500 mt-2">Let's get your school set up. It only takes a minute.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-colors duration-300" style={{ background: step >= s ? '#f97316' : '#e5e7eb' }} />
          ))}
        </div>

        {/* Step 1 — School Info */}
        {step === 1 && (
          <div>
            <h2 className="text-[1.15rem] font-bold text-gray-800 mt-0 mb-6">Step 1 — School Information</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>School Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Riverside Academy" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Principal / Director Name</label>
                <input type="text" name="principal_name" value={form.principal_name} onChange={handleChange} placeholder="e.g. Dr. Jane Smith" className={fieldCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>School Type</label>
                  <select name="school_type" value={form.school_type} onChange={handleChange} className={fieldCls}>
                    <option>Private</option>
                    <option>Charter</option>
                    <option>Public</option>
                    <option>Montessori</option>
                    <option>Religious</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Student Capacity</label>
                  <input type="number" name="student_capacity" value={form.student_capacity} onChange={handleChange} placeholder="e.g. 250" className={fieldCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. (555) 123-4567" className={fieldCls} />
              </div>
            </div>
            <button
              onClick={() => {
                if (!form.name) { setError('Please enter your school name.'); return }
                setError(null)
                setStep(2)
              }}
              className="mt-8 w-full bg-orange-500 text-white border-0 rounded-lg py-3 font-bold cursor-pointer text-base hover:bg-orange-600 transition-colors"
            >
              Next
            </button>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        )}

        {/* Step 2 — Address & Details */}
        {step === 2 && (
          <div>
            <h2 className="text-[1.15rem] font-bold text-gray-800 mt-0 mb-6">Step 2 — Location & Contact</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="e.g. 123 Main Street" className={fieldCls} />
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="MI" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>ZIP</label>
                  <input type="text" name="zip" value={form.zip} onChange={handleChange} placeholder="48146" className={fieldCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="text" name="website" value={form.website} onChange={handleChange} placeholder="e.g. www.riversideacademy.com" className={fieldCls} />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-200 rounded-lg py-3 font-semibold cursor-pointer text-base hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-[2] bg-orange-500 text-white border-0 rounded-lg py-3 font-bold cursor-pointer text-base disabled:opacity-70 hover:bg-orange-600 transition-colors"
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
