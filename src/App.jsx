import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth }   from './hooks/useAuth'
import { useSchool } from './hooks/useSchool'
import { NAV_GROUPS, QUICK_ACTIONS } from './domain/app'

import Landing           from './Landing'
import Onboarding        from './Onboarding'
import SetupWizard       from './SetupWizard'
import ApplicationPortal from './ApplicationPortal'
import StaffDashboard    from './StaffDashboard'
import Enrollment        from './Enrollment'
import Messages          from './Messages'
import Settings          from './Settings'
import Students          from './Students'
import Reports           from './Reports'
import ReportCards       from './ReportCards'
import Staff             from './Staff'
import Alumni            from './Alumni'
import Parents           from './Parents'
import Admissions        from './Admissions'
import Fundraising       from './Fundraising'
import Facilities        from './Facilities'
import Attendance        from './Attendance'
import Rooms            from './Rooms'
import Classes          from './Classes'
import Scheduling       from './Scheduling'

function App() {
  const [session,        setSession]        = useState(null)
  const [showLanding,    setShowLanding]    = useState(true)
  const [activePage,     setActivePage]     = useState('dashboard')
  const [collapsedGroups, setCollapsedGroups] = useState({ academics: false, people: false, operations: false, communicate: false })
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [openClassId,    setOpenClassId]    = useState(null)

  const navigateToClass = (classId) => {
    setOpenClassId(classId)
    setActivePage('classes')
  }

  const auth   = useAuth()
  const sc     = useSchool()

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        sc.fetchSchool(session.user.id, session.user.email)
        sc.fetchStats(session.user.id)
      }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        sc.fetchSchool(session.user.id, session.user.email)
        sc.fetchStats(session.user.id)
      }
    })
  }, [])

  // ── Public routes ───────────────────────────────────────────────────────────
  const applyParam = new URLSearchParams(window.location.search).get('apply')
  if (applyParam) return <ApplicationPortal schoolId={applyParam} />
  if (showLanding && !session) return <Landing onGetStarted={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} />

  // ── Auth-gated routing ──────────────────────────────────────────────────────
  if (session && !sc.checkingSchool && sc.staffMember) {
    return <StaffDashboard user={session.user} staffMember={sc.staffMember} school={sc.school} onLogout={auth.handleLogout} />
  }
  if (session && !sc.checkingSchool && !sc.school) {
    return <Onboarding user={session.user} onComplete={(schoolData) => { sc.setSchool(schoolData); sc.setShowWizard(true) }} />
  }

  // ── Admin shell ─────────────────────────────────────────────────────────────
  if (session) {
    const primaryColor = sc.school?.primary_color || '#f97316'

    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

        {sc.showWizard && sc.school && (
          <SetupWizard
            user={session.user}
            school={sc.school}
            onDone={(updatedSchool) => {
              sc.completeWizard(session.user.id, updatedSchool)
              setActivePage('dashboard')
            }}
          />
        )}

        {/* Top Nav */}
        <div style={{ background: primaryColor, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {sc.school?.logo_url
              ? <img src={sc.school.logo_url} alt="School logo" style={{ height: '2rem', borderRadius: '0.25rem', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              : <span style={{ fontSize: '1.75rem' }}>🍱</span>
            }
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1.2 }}>{sc.school?.name || 'LunchBox'}</div>
              {sc.school?.motto && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>{sc.school.motto}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'white', fontSize: '0.875rem' }}>{session.user.email}</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSettingsMenu(m => !m)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.375rem 0.625rem', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                title="Settings"
              >⚙️</button>
              {showSettingsMenu && (
                <>
                  <div onClick={() => setShowSettingsMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', background: 'white', borderRadius: '0.625rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 50, overflow: 'hidden' }}>
                    <button onClick={() => { setActivePage('settings'); setShowSettingsMenu(false) }}
                      style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >⚙️ School Settings</button>
                    <button onClick={() => { sc.setShowWizard(true); setShowSettingsMenu(false) }}
                      style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >🪄 Setup Wizard</button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={auth.handleLogout}
              style={{ background: 'white', color: primaryColor, border: 'none', borderRadius: '0.5rem', padding: '0.375rem 1rem', fontWeight: '600', cursor: 'pointer' }}
            >Sign Out</button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>

          {/* Sidebar */}
          <div style={{ width: '220px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '1rem 0', display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => setActivePage('dashboard')}
              style={{
                width: '100%', textAlign: 'left', padding: '0.625rem 1.25rem',
                background: activePage === 'dashboard' ? primaryColor + '18' : 'transparent',
                border: 'none', borderLeft: activePage === 'dashboard' ? `3px solid ${primaryColor}` : '3px solid transparent',
                color: activePage === 'dashboard' ? primaryColor : '#374151',
                fontWeight: activePage === 'dashboard' ? '600' : '400',
                cursor: 'pointer', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                marginBottom: '0.5rem',
              }}
            ><span>🏠</span><span>Dashboard</span></button>

            {NAV_GROUPS.map(group => (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.375rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.label}</span>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af', transform: collapsedGroups[group.key] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▼</span>
                </button>
                {!collapsedGroups[group.key] && group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.5rem 1.25rem 0.5rem 1.75rem',
                      background: activePage === item.id ? primaryColor + '18' : 'transparent',
                      border: 'none', borderLeft: activePage === item.id ? `3px solid ${primaryColor}` : '3px solid transparent',
                      color: activePage === item.id ? primaryColor : '#374151',
                      fontWeight: activePage === item.id ? '600' : '400',
                      cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                <div style={{ height: '0.5rem' }} />
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activePage === 'dashboard' && (
              <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Welcome, {sc.school?.name || 'Your School'} 👋</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your school operations dashboard</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Total Students',     value: sc.stats.students, icon: '🎒' },
                    { label: 'Pending Enrollment', value: sc.stats.pending,  icon: '📋' },
                    { label: 'Messages Sent',      value: sc.stats.messages, icon: '✉️' },
                    { label: 'Active Staff',        value: sc.stats.staff,    icon: '👩‍🏫' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {QUICK_ACTIONS.map(action => {
                    const color = action.colorKey === 'primary' ? primaryColor : action.color
                    return (
                      <button
                        key={action.label}
                        onClick={() => setActivePage(action.page)}
                        style={{ background: 'white', border: `2px solid ${color}`, borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                      >
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{action.icon}</div>
                        <div style={{ fontWeight: '600', color }}>{action.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {activePage === 'attendance'  && <Attendance  user={session.user} school={sc.school} />}
            {activePage === 'admissions'  && <Admissions  user={session.user} school={sc.school} onNavigate={setActivePage} />}
            {activePage === 'enrollment'  && <Enrollment  user={session.user} school={sc.school} />}
            {activePage === 'messages'    && <Messages    user={session.user} />}
            {activePage === 'students'    && <Students    user={session.user} school={sc.school} />}
            {activePage === 'staff'       && <Staff       user={session.user} school={sc.school} />}
            {activePage === 'alumni'      && <Alumni      user={session.user} school={sc.school} />}
            {activePage === 'reportcards' && <ReportCards user={session.user} school={sc.school} />}
            {activePage === 'reports'     && <Reports     user={session.user} school={sc.school} />}
            {activePage === 'parents'     && <Parents     user={session.user} school={sc.school} onCompose={() => setActivePage('messages')} />}
            {activePage === 'fundraising' && <Fundraising user={session.user} school={sc.school} />}
            {activePage === 'facilities'  && <Facilities  user={session.user} school={sc.school} />}
            {activePage === 'rooms'       && <Rooms       user={session.user} school={sc.school} />}
            {activePage === 'classes'     && <Classes      user={session.user} school={sc.school} openClassId={openClassId} onClearOpenClass={() => setOpenClassId(null)} />}
            {activePage === 'schedule'    && <Scheduling   user={session.user} school={sc.school} onNavigateToClass={navigateToClass} />}
            {activePage === 'settings'    && <Settings    user={session.user} school={sc.school} onUpdate={sc.setSchool} />}
          </div>
        </div>
      </div>
    )
  }

  // ── Login form ──────────────────────────────────────────────────────────────
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
              value={auth.email}
              onChange={e => auth.setEmail(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="admin@yourschool.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Password</label>
            <input
              type="password"
              value={auth.password}
              onChange={e => auth.setPassword(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>
          {auth.error   && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{auth.error}</p>}
          {auth.message && <p style={{ color: '#22c55e', fontSize: '0.875rem' }}>{auth.message}</p>}
          <button
            onClick={auth.handleLogin}
            disabled={auth.loading}
            style={{ width: '100%', background: '#f97316', color: 'white', fontWeight: '600', padding: '0.625rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >{auth.loading ? 'Loading...' : 'Sign In'}</button>
          <button
            onClick={auth.handleSignUp}
            disabled={auth.loading}
            style={{ width: '100%', background: 'white', color: '#f97316', fontWeight: '600', padding: '0.625rem', borderRadius: '0.5rem', border: '2px solid #f97316', cursor: 'pointer', fontSize: '1rem' }}
          >Create Account</button>
        </div>
      </div>
    </div>
  )
}

export default App
