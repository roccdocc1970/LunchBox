import Landing from './Landing'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Enrollment from './Enrollment'
import Messages from './Messages'
import Onboarding from './Onboarding'
import Settings from './Settings'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [session, setSession] = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [showLanding, setShowLanding] = useState(true)
  const [school, setSchool] = useState(null)
  const [checkingSchool, setCheckingSchool] = useState(false)

 useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchSchool(session.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchSchool(session.user.id)
    })
  }, [])

  const fetchSchool = async (userId) => {
    setCheckingSchool(true)
    const { data } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) setSchool(data)
    setCheckingSchool(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

 const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'enrollment', label: 'Enrollment', icon: '📋' },
    { id: 'messages', label: 'Messages', icon: '✉️' },
    { id: 'students', label: 'Students', icon: '🎒' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]
if (showLanding && !session) {
  return <Landing onGetStarted={() => setShowLanding(false)} />
}
if (session && !checkingSchool && !school) {
  return <Onboarding user={session.user} onComplete={(schoolData) => setSchool(schoolData)} />
}
  if (session) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

        {/* Top Nav */}
        <div style={{ background: '#f97316', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🍱</span>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>LunchBox</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white', fontSize: '0.875rem' }}>{session.user.email}</span>
            <button
              onClick={handleLogout}
              style={{ background: 'white', color: '#f97316', border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>

          {/* Sidebar */}
          <div style={{ width: '220px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '1.5rem 0' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1.5rem',
                  background: activePage === item.id ? '#fff7ed' : 'transparent',
                  borderLeft: activePage === item.id ? '3px solid #f97316' : '3px solid transparent',
                  border: 'none', borderLeft: activePage === item.id ? '3px solid #f97316' : '3px solid transparent',
                  color: activePage === item.id ? '#f97316' : '#374151',
                  fontWeight: activePage === item.id ? '600' : '400',
                  cursor: 'pointer', fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activePage === 'dashboard' && (
              <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Welcome, {school?.name || 'Your School'} 👋</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your school operations dashboard</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Total Students', value: '0', icon: '🎒' },
                    { label: 'Pending Enrollment', value: '0', icon: '📋' },
                    { label: 'Messages Sent', value: '0', icon: '✉️' },
                    { label: 'Staff Members', value: '0', icon: '👩‍🏫' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'New Enrollment', icon: '➕', color: '#f97316', page: 'enrollment' },
                    { label: 'Send Message', icon: '✉️', color: '#3b82f6', page: 'messages' },
                    { label: 'View Students', icon: '🎒', color: '#8b5cf6', page: 'students' },
                    { label: 'Reports', icon: '📊', color: '#10b981', page: 'reports' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => setActivePage(action.page)}
                      style={{ background: 'white', border: `2px solid ${action.color}`, borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{action.icon}</div>
                      <div style={{ fontWeight: '600', color: action.color }}>{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePage === 'enrollment' && <Enrollment user={session.user} />}
            {activePage === 'messages' && <Messages user={session.user} />}
            {activePage === 'settings' && <Settings user={session.user} school={school} onUpdate={(updated) => setSchool(updated)} />}

            {['students', 'reports'].includes(activePage) && (
              <div style={{ padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
                <h3 style={{ color: '#1f2937', fontSize: '1.25rem' }}>Coming Soon</h3>
                <p style={{ color: '#6b7280' }}>This module is under construction. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FBBF24, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '2rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🍱</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0.5rem 0 0' }}>LunchBox</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>School Operations Platform</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="admin@yourschool.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
          {message && <p style={{ color: '#22c55e', fontSize: '0.875rem' }}>{message}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', background: '#f97316', color: 'white', fontWeight: '600', padding: '0.625rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{ width: '100%', background: 'white', color: '#f97316', fontWeight: '600', padding: '0.625rem', borderRadius: '0.5rem', border: '2px solid #f97316', cursor: 'pointer', fontSize: '1rem' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default App