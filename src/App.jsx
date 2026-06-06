import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, UserPlus, Users, BookOpen, UsersRound,
  CalendarDays, ClipboardCheck, FileText, Briefcase, Heart, Award,
  HeartHandshake, Wrench, MessageSquare, BarChart3, ChevronDown, Settings as SettingsIcon, LogOut,
  Backpack, Mail, GraduationCap, Check, PartyPopper, Rocket, Sparkles,
} from 'lucide-react'

const NAV_ICONS = {
  LayoutDashboard, ClipboardList, UserPlus, Users, BookOpen, UsersRound,
  CalendarDays, ClipboardCheck, FileText, Briefcase, Heart, Award,
  HeartHandshake, Wrench, MessageSquare, BarChart3,
}

const DASHBOARD_STAT_ICONS = { Backpack, ClipboardList, Mail, GraduationCap }
import { supabase } from './supabase'
import { useAuth }      from './hooks/useAuth'
import { useSchool }    from './hooks/useSchool'
import { useNavCounts } from './hooks/useNavCounts'
import { NAV_GROUPS, QUICK_ACTIONS, SETUP_STEPS } from './domain/app'

import Landing           from './Landing'
import Onboarding        from './Onboarding'
import SetupWizard       from './SetupWizard'
import ApplicationPortal from './ApplicationPortal'
import StaffDashboard    from './StaffDashboard'
import Attendance        from './Attendance'
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
import Rooms             from './Rooms'
import Classes           from './Classes'
import Cohorts           from './Cohorts'
import Scheduling        from './Scheduling'

function App() {
  const [session,         setSession]         = useState(null)
  const [showLanding,     setShowLanding]     = useState(true)
  const [activePage,      setActivePage]      = useState('dashboard')
  const [collapsedGroups, setCollapsedGroups] = useState({ academics: false, people: false, operations: false, communicate: false })
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [openClassId,     setOpenClassId]     = useState(null)

  const navigateToClass = (classId) => { setOpenClassId(classId); setActivePage('classes') }

  const auth = useAuth()
  const sc   = useSchool()
  const { counts, refresh } = useNavCounts(session?.user?.id)

  const [setupDismissed, setSetupDismissed] = useState(false)
  const dismissSetup = () => {
    if (session?.user?.id) localStorage.setItem(`lb_setup_${session.user.id}`, '1')
    setSetupDismissed(true)
  }
  const restoreSetup = () => {
    if (session?.user?.id) localStorage.removeItem(`lb_setup_${session.user.id}`)
    setSetupDismissed(false)
    setActivePage('dashboard')
  }

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    if (session?.user?.id) setSetupDismissed(!!localStorage.getItem(`lb_setup_${session.user.id}`))
  }, [session?.user?.id])

  useEffect(() => {
    if (activePage === 'dashboard' && session?.user?.id) refresh()
  }, [activePage])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) { sc.fetchSchool(session.user.id, session.user.email); sc.fetchStats(session.user.id) }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { sc.fetchSchool(session.user.id, session.user.email); sc.fetchStats(session.user.id) }
    })
  }, [])

  // ── Public routes ────────────────────────────────────────────────────────────
  const applyParam = new URLSearchParams(window.location.search).get('apply')
  if (applyParam) return <ApplicationPortal schoolId={applyParam} />
  if (showLanding && !session) return <Landing onGetStarted={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} />

  // ── Auth-gated routing ───────────────────────────────────────────────────────
  if (session && !sc.checkingSchool && sc.staffMember)
    return <StaffDashboard user={session.user} staffMember={sc.staffMember} school={sc.school} onLogout={auth.handleLogout} />
  if (session && !sc.checkingSchool && !sc.school)
    return <Onboarding user={session.user} onComplete={(schoolData) => { sc.setSchool(schoolData); sc.setShowWizard(true) }} />

  // ── Admin shell ──────────────────────────────────────────────────────────────
  if (session) {
    const primaryColor = sc.school?.primary_color || '#f97316'

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {sc.showWizard && sc.school && (
          <SetupWizard user={session.user} school={sc.school}
            onDone={(updatedSchool) => { sc.completeWizard(session.user.id, updatedSchool); setActivePage('dashboard') }} />
        )}

        {/* Top Nav */}
        <div className="px-6 py-3 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[1.6rem] leading-none">🍱</span>
            {sc.school?.logo_url
              ? <img src={sc.school.logo_url} alt="School logo" className="h-8 rounded object-contain" onError={e => e.target.style.display = 'none'} />
              : null
            }
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">{sc.school?.name || 'LunchBox'}</div>
              {sc.school?.motto && <div className="text-gray-400 text-xs">{sc.school.motto}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm hidden md:block">{session.user.email}</span>
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(m => !m)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border-0 text-gray-600 rounded-lg px-3 py-1.5 cursor-pointer text-sm transition-colors"
                title="Settings"
              ><SettingsIcon size={14} /><span className="hidden md:inline">Settings</span></button>
              {showSettingsMenu && (
                <>
                  <div onClick={() => setShowSettingsMenu(false)} className="fixed inset-0 z-40" />
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white rounded-xl shadow-2xl min-w-48 z-50 overflow-hidden border border-gray-100">
                    <button onClick={() => { setActivePage('settings'); setShowSettingsMenu(false) }}
                      className="w-full text-left px-4 py-3 bg-transparent border-0 cursor-pointer text-sm text-gray-700 flex items-center gap-2.5 hover:bg-gray-50">
                      <SettingsIcon size={14} /> School Settings
                    </button>
                    <button onClick={() => { sc.setShowWizard(true); setShowSettingsMenu(false) }}
                      className="w-full text-left px-4 py-3 bg-transparent border-0 cursor-pointer text-sm text-gray-700 flex items-center gap-2.5 hover:bg-gray-50">
                      <Sparkles size={14} /> Setup Wizard
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={auth.handleLogout} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border-0 text-gray-600 rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors">
              <LogOut size={14} /><span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1">

          {/* Sidebar */}
          <div className="w-[240px] bg-white border-r border-gray-100 py-5 flex flex-col shrink-0">
            {/* Dashboard button */}
            <div className="px-3 mb-1">
              <button
                onClick={() => setActivePage('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg border-0 cursor-pointer text-sm flex items-center gap-2.5 transition-all ${activePage === 'dashboard' ? 'text-white font-semibold shadow-sm' : 'text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-900'}`}
                style={activePage === 'dashboard' ? { background: primaryColor } : {}}
              >
                <LayoutDashboard size={15} className="shrink-0" />
                <span>Dashboard</span>
              </button>
            </div>

            {NAV_GROUPS.map(group => (
              <div key={group.key} className="mt-4">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full text-left px-6 py-1 bg-transparent border-0 cursor-pointer flex items-center justify-between mb-1"
                >
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">{group.label}</span>
                  <ChevronDown size={11} className={`text-gray-400 transition-transform ${collapsedGroups[group.key] ? '-rotate-90' : ''}`} />
                </button>
                {!collapsedGroups[group.key] && (
                  <div className="px-3 flex flex-col gap-0.5">
                    {group.items.map(item => {
                      const isActive = activePage === item.id
                      const count    = counts[item.id]
                      const Icon     = NAV_ICONS[item.icon]
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActivePage(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-0 cursor-pointer text-sm flex items-center gap-2.5 transition-all ${isActive ? 'text-white font-semibold shadow-sm' : 'text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-900'}`}
                          style={isActive ? { background: primaryColor } : {}}
                        >
                          {Icon && <Icon size={15} className="shrink-0" />}
                          <span className="flex-1">{item.label}</span>
                          {count > 0 && (
                            <span className={`text-[0.65rem] rounded-full px-1.5 py-0.5 min-w-5 text-center leading-none shrink-0 font-semibold ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              {count > 999 ? '999+' : count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                {activePage === 'dashboard' && (
                  <div className="p-8 max-w-6xl mx-auto">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2.5"><LayoutDashboard size={22} style={{ color: primaryColor }} />Welcome, {sc.school?.name || 'Your School'}</h2>
                        <p className="text-gray-500 m-0">Your school operations dashboard</p>
                      </div>
                      {setupDismissed && (() => {
                        const allDone = SETUP_STEPS.every(s => s.done(counts, sc.school))
                        return (
                          <button
                            onClick={restoreSetup}
                            className="border rounded-lg px-3.5 py-1.5 text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors hover:border-gray-400"
                            style={{
                              background:   allDone ? '#f0fdf4' : 'white',
                              borderColor:  allDone ? '#86efac' : '#e5e7eb',
                              color:        allDone ? '#15803d' : '#6b7280',
                            }}
                          >
                            {allDone ? <><Check size={14} className="inline mr-1" />Getting Started Checklist (Completed)</> : <><Rocket size={14} className="inline mr-1" />Getting Started Checklist</>}
                          </button>
                        )
                      })()}
                    </div>

                    {!setupDismissed && (
                      <GettingStarted counts={counts} school={sc.school} primaryColor={primaryColor} onNavigate={setActivePage} onDismiss={dismissSetup} />
                    )}

                    {/* Stat cards */}
                    <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {[
                        { label: 'Total Students',     value: sc.stats.students, icon: 'Backpack',      color: primaryColor },
                        { label: 'Pending Enrollment', value: sc.stats.pending,  icon: 'ClipboardList', color: '#3b82f6' },
                        { label: 'Messages Sent',      value: sc.stats.messages, icon: 'Mail',          color: '#8b5cf6' },
                        { label: 'Active Staff',        value: sc.stats.staff,    icon: 'GraduationCap', color: '#10b981' },
                      ].map(stat => {
                        const Icon = DASHBOARD_STAT_ICONS[stat.icon]
                        return (
                        <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center gap-3">
                            {Icon && <Icon size={22} className="text-gray-300 shrink-0" />}
                            <div className="text-gray-500 text-sm">{stat.label}</div>
                            <div className="text-3xl font-bold text-gray-800 ml-auto">{stat.value}</div>
                          </div>
                        </div>
                      )})}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {QUICK_ACTIONS.map(action => {
                        const color = action.colorKey === 'primary' ? primaryColor : action.color
                        return (
                          <button key={action.label} onClick={() => setActivePage(action.page)}
                            className="bg-white rounded-2xl p-6 cursor-pointer text-left shadow-sm hover:shadow-md transition-shadow border-0">
                            <div className="flex items-center gap-3">
                              {NAV_ICONS[action.icon] && (() => { const Icon = NAV_ICONS[action.icon]; return <Icon size={22} className="text-gray-300 shrink-0" /> })()}
                              <div className="font-semibold text-gray-800">{action.label}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {activePage === 'attendance'  && <Attendance  user={session.user} school={sc.school} />}
                {activePage === 'admissions'  && <Admissions  user={session.user} school={sc.school} onNavigate={setActivePage} />}
                {activePage === 'enrollment'  && <Enrollment  user={session.user} school={sc.school} />}
                {activePage === 'messages'    && <Messages    user={session.user} school={sc.school} />}
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
                {activePage === 'cohorts'     && <Cohorts      user={session.user} school={sc.school} />}
                {activePage === 'schedule'    && <Scheduling   user={session.user} school={sc.school} onNavigateToClass={navigateToClass} />}
                {activePage === 'settings'    && <Settings    user={session.user} school={sc.school} onUpdate={sc.setSchool} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // ── Login form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl">🍱</div>
          <h1 className="text-3xl font-bold text-gray-800 mt-2 mb-0">LunchBox</h1>
          <p className="text-gray-500 mt-1">School Operations Platform</p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={auth.email} onChange={e => auth.setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm"
              placeholder="admin@yourschool.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={auth.password} onChange={e => auth.setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none text-sm"
              placeholder="••••••••" />
          </div>
          {auth.error   && <p className="text-red-500 text-sm">{auth.error}</p>}
          {auth.message && <p className="text-green-500 text-sm">{auth.message}</p>}
          <button onClick={auth.handleLogin} disabled={auth.loading}
            className="w-full bg-orange-500 text-white font-semibold py-2.5 rounded-lg border-0 cursor-pointer text-base disabled:opacity-70 hover:bg-orange-600 transition-colors">
            {auth.loading ? 'Loading...' : 'Sign In'}
          </button>
          <button onClick={auth.handleSignUp} disabled={auth.loading}
            className="w-full bg-white text-orange-500 font-semibold py-2.5 rounded-lg border-2 border-orange-500 cursor-pointer text-base disabled:opacity-70 hover:bg-orange-50 transition-colors">
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

function GettingStarted({ counts, school, primaryColor, onNavigate, onDismiss }) {
  const steps     = SETUP_STEPS.map(s => ({ ...s, complete: s.done(counts, school) }))
  const doneCount = steps.filter(s => s.complete).length
  const allDone   = doneCount === steps.length
  const pct       = Math.round(doneCount / steps.length * 100)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span>{allDone ? <PartyPopper size={20} className="text-green-600" /> : <Rocket size={20} className="text-gray-500" />}</span>
          <div>
            <div className="font-bold text-gray-800">{allDone ? "You're all set up!" : 'Getting Started'}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {allDone ? 'All setup steps complete.' : `${doneCount} of ${steps.length} steps complete`}
            </div>
          </div>
        </div>
        <button onClick={onDismiss} className="bg-transparent border border-gray-200 rounded-lg px-3 py-1 text-gray-400 text-xs cursor-pointer hover:text-gray-600 hover:border-gray-400 transition-colors">
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: allDone ? '#10b981' : primaryColor }} />
      </div>

      {/* Steps */}
      {!allDone && (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => !step.complete && onNavigate(step.page)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all"
              style={{
                background:   step.complete ? '#f0fdf4' : 'white',
                borderColor:  step.complete ? '#86efac' : '#e5e7eb',
                cursor:       step.complete ? 'default' : 'pointer',
                opacity:      step.complete ? 0.65 : 1,
              }}
              onMouseEnter={e => { if (!step.complete) e.currentTarget.style.borderColor = primaryColor }}
              onMouseLeave={e => { if (!step.complete) e.currentTarget.style.borderColor = '#e5e7eb' }}
            >
              <span className="w-4.5 h-4.5 rounded-full shrink-0 flex items-center justify-center text-[0.6rem] font-bold text-white border-2 transition-colors"
                style={{ width: 18, height: 18, background: step.complete ? '#10b981' : 'white', borderColor: step.complete ? '#10b981' : '#d1d5db', color: 'white' }}>
                {step.complete ? <Check size={10} /> : ''}
              </span>
              <span className="text-sm flex-1" style={{ fontWeight: step.complete ? '400' : '500', color: step.complete ? '#6b7280' : '#1f2937' }}>
                {step.label}
              </span>
              {!step.complete && <span className="text-xs text-gray-400 shrink-0">→</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
