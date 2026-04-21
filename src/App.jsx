import Landing from './Landing'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Enrollment from './Enrollment'
import Messages from './Messages'
import Onboarding from './Onboarding'
import Settings from './Settings'
import Students from './Students'
import Reports from './Reports'
import ReportCards from './ReportCards'
import Staff from './Staff'
import Alumni from './Alumni'
import SetupWizard from './SetupWizard'

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
  const [stats, setStats] = useState({ students: 0, pending: 0, messages: 0, staff: 0 })
  const [showWizard, setShowWizard] = useState(false)

 useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) { fetchSchool(session.user.id); fetchStats(session.user.id) }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { fetchSchool(session.user.id); fetchStats(session.user.id) }
    })
  }, [])

  const fetchStats = async (userId) => {
    const [{ count: students }, { count: pending }, { count: messages }, { count: staff }] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userId),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userId).eq('status', 'Applied'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('school_id', userId),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('school_id', userId).eq('status', 'Active'),
    ])
    setStats({ students: students || 0, pending: pending || 0, messages: messages || 0, staff: staff || 0 })
  }

  const fetchSchool = async (userId) => {
    setCheckingSchool(true)
    const { data } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) {
      setSchool(data)
      if (!localStorage.getItem(`wizard_complete_${userId}`)) {
        setShowWizard(true)
      }
    }
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
    { id: 'staff', label: 'Staff', icon: '👩‍🏫' },
    { id: 'alumni', label: 'Alumni', icon: '🎓' },
    { id: 'reportcards', label: 'Report Cards', icon: '📝' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'School Settings', icon: '⚙️' },
  ]
if (showLanding && !session) {
  return <Landing onGetStarted={() => setShowLanding(false)} />
}
if (session && !checkingSchool && !school) {
  return <Onboarding user={session.user} onComplete={(schoolData) => { setSchool(schoolData); setShowWizard(true) }} />
}
  if (session) {
    const primaryColor = school?.primary_color || '#f97316'
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        {showWizard && school && (
          <SetupWizard
            user={session.user}
            school={school}
            onDone={(updatedSchool) => {
              localStorage.setItem(`wizard_complete_${session.user.id}`, '1')
              setShowWizard(false)
              if (updatedSchool) setSchool(updatedSchool)
            }}
          />
        )}

        {/* Top Nav */}
        <div style={{ background: primaryColor, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {school?.logo_url
              ? <img src={school.logo_url} alt="School logo" style={{ height: '2rem', borderRadius: '0.25rem', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              : <span style={{ fontSize: '1.75rem' }}>🍱</span>
            }
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1.2 }}>{school?.name || 'LunchBox'}</div>
              {school?.motto && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>{school.motto}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white', fontSize: '0.875rem' }}>{session.user.email}</span>
            <button
              onClick={handleLogout}
              style={{ background: 'white', color: primaryColor, border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>

          {/* Sidebar */}
          <div style={{ width: '220px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1.5rem',
                  background: activePage === item.id ? primaryColor + '18' : 'transparent',
                  borderLeft: activePage === item.id ? `3px solid ${primaryColor}` : '3px solid transparent',
                  border: 'none', borderLeft: activePage === item.id ? `3px solid ${primaryColor}` : '3px solid transparent',
                  color: activePage === item.id ? primaryColor : '#374151',
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
            <div style={{ padding: '1rem', borderTop: '1px solid #fee2e2' }}>
              <button
                onClick={() => { localStorage.removeItem(`wizard_complete_${session.user.id}`); setShowWizard(true) }}
                style={{ width: '100%', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', lineHeight: '1.4' }}
              >
                Preview Setup Wizard<br />
                <span style={{ color: '#f87171', fontSize: '0.7rem' }}>(remove, for testing only to get around Supabase email confirmation feature)</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activePage === 'dashboard' && (
              <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Welcome, {school?.name || 'Your School'} 👋</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your school operations dashboard</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Total Students', value: stats.students, icon: '🎒' },
                    { label: 'Pending Enrollment', value: stats.pending, icon: '📋' },
                    { label: 'Messages Sent', value: stats.messages, icon: '✉️' },
                    { label: 'Active Staff', value: stats.staff, icon: '👩‍🏫' },
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
                    { label: 'New Enrollment', icon: '➕', color: primaryColor, page: 'enrollment' },
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

            {activePage === 'enrollment' && <Enrollment user={session.user} school={school} />}
            {activePage === 'messages' && <Messages user={session.user} />}
            {activePage === 'students' && <Students user={session.user} school={school} />}
            {activePage === 'staff' && <Staff user={session.user} school={school} />}
            {activePage === 'alumni' && <Alumni user={session.user} school={school} />}
            {activePage === 'reportcards' && <ReportCards user={session.user} school={school} />}
            {activePage === 'reports' && <Reports user={session.user} school={school} />}
            {activePage === 'settings' && <Settings user={session.user} school={school} onUpdate={(updated) => setSchool(updated)} />}
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