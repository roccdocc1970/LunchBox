import { ClipboardList, Mail, BarChart3, DollarSign, GraduationCap, Lock } from 'lucide-react'

const FEATURE_ICONS = { ClipboardList, Mail, BarChart3, DollarSign, GraduationCap, Lock }

export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div className="text-gray-800" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-[1.75rem]">🍱</span>
          <span className="font-bold text-xl text-gray-800">LunchBox</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-gray-500 no-underline text-[0.95rem]">Features</a>
          <a href="#how-it-works" className="text-gray-500 no-underline text-[0.95rem]">How It Works</a>
          <button onClick={onLogin} className="bg-white text-orange-500 border-2 border-orange-500 rounded-lg px-5 py-2 font-semibold cursor-pointer text-[0.95rem] hover:bg-orange-50 transition-colors">
            Log In
          </button>
          <button onClick={onGetStarted} className="bg-orange-500 text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer text-[0.95rem] hover:bg-orange-600 transition-colors">
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
        <div className="max-w-[800px] mx-auto">
          <div className="inline-block bg-orange-500 text-white rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            Now available for K-12 schools
          </div>
          <h1 className="font-extrabold text-gray-800 leading-tight mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Run Your Entire School From One Place
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            LunchBox replaces the pile of disconnected tools your school relies on. Enrollment, parent communication, reporting — all in one beautiful platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={onGetStarted} className="bg-orange-500 text-white border-0 rounded-xl px-8 py-3.5 font-bold cursor-pointer text-[1.1rem] shadow-lg hover:bg-orange-600 transition-colors" style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
              Get Started Free
            </button>
            <a href="#how-it-works" className="bg-white text-gray-700 border-2 border-gray-200 rounded-xl px-8 py-3.5 font-semibold cursor-pointer text-[1.1rem] no-underline hover:bg-gray-50 transition-colors">
              See How It Works
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-4">No credit card required · Free to get started</p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-white border-t border-b border-gray-200 px-8 py-6 text-center">
        <p className="text-gray-400 text-sm mb-4">TRUSTED BY SCHOOLS ACROSS THE COUNTRY</p>
        <div className="flex justify-center gap-12 flex-wrap">
          {['Riverside Academy', 'Northside Prep', 'Sunview Charter', 'Hillcrest K-8', 'Oakwood Private'].map(school => (
            <span key={school} className="text-gray-400 font-semibold text-[0.95rem]">{school}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-24 bg-gray-50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[2.25rem] font-extrabold text-gray-800 mb-4">Everything Your School Needs</h2>
            <p className="text-gray-500 text-[1.1rem]">Stop juggling spreadsheets and disconnected apps. LunchBox brings it all together.</p>
          </div>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {[
              { icon: 'ClipboardList', color: '#f97316', title: 'Smart Enrollment', desc: 'Manage student applications, track enrollment status, handle waitlists, and collect all the information you need digitally in one place.' },
              { icon: 'Mail',         color: '#3b82f6', title: 'Parent Communication', desc: 'Send announcements, newsletters, and individual messages to parents instantly. Keep every family informed and engaged.' },
              { icon: 'BarChart3',    color: '#10b981', title: 'Powerful Reporting', desc: 'Get instant insights into enrollment trends, attendance, and school performance. Make data-driven decisions with ease.' },
              { icon: 'DollarSign',   color: '#f59e0b', title: 'Billing and Payments', desc: 'Collect tuition, fees, and donations online. Automated reminders and receipts save your admin team hours every week.' },
              { icon: 'GraduationCap',color: '#8b5cf6', title: 'Staff Management', desc: 'Manage schedules, roles, and communications for your entire staff from one central dashboard.' },
              { icon: 'Lock',         color: '#6b7280', title: 'Secure and Compliant', desc: 'Built with security first. Your school data is encrypted, backed up, and only accessible to the right people.' },
            ].map(feature => {
              const Icon = FEATURE_ICONS[feature.icon]
              return (
                <div key={feature.title} className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="mb-4 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: feature.color + '18' }}>
                    {Icon && <Icon size={26} style={{ color: feature.color }} />}
                  </div>
                  <h3 className="text-[1.15rem] font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed m-0">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-24 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-[2.25rem] font-extrabold text-gray-800 mb-4">Up and Running in Minutes</h2>
          <p className="text-gray-500 text-[1.1rem] mb-16">No IT department needed. No lengthy onboarding. Just sign up and go.</p>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { step: '1', title: 'Create Your Account', desc: 'Sign up free in under 60 seconds. No credit card required.' },
              { step: '2', title: 'Set Up Your School', desc: 'Add your school details, staff, and customize your settings.' },
              { step: '3', title: 'Start Enrolling', desc: 'Begin accepting students and communicating with parents right away.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-xl">{item.step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 py-24 bg-orange-50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[2.25rem] font-extrabold text-gray-800 text-center mb-16">Schools Love LunchBox</h2>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {[
              { quote: 'LunchBox cut our enrollment paperwork in half. What used to take weeks now takes days.', name: 'Sarah M.', role: 'Principal, Riverside Academy' },
              { quote: 'Finally a platform that was designed for schools, not just adapted for them. Our parents love it.', name: 'James T.', role: 'Administrator, Northside Prep' },
              { quote: 'The parent communication tools alone are worth it. We have never been more connected with our families.', name: 'Linda K.', role: 'Director, Sunview Charter' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm">
                <p className="text-gray-700 leading-[1.7] text-base mb-6 italic">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-gray-800">{t.name}</div>
                  <div className="text-gray-500 text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-500 px-8 py-24 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-white mb-4">Ready to Transform Your School?</h2>
          <p className="text-orange-50 text-[1.1rem] mb-10">Join schools already using LunchBox to run smarter operations.</p>
          <button onClick={onGetStarted} className="bg-white text-orange-500 border-0 rounded-xl px-10 py-4 font-extrabold cursor-pointer text-[1.1rem] shadow-lg hover:shadow-xl transition-shadow">
            Get Started Free
          </button>
          <p className="text-orange-200 text-sm mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 px-8 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-2xl">🍱</span>
          <span className="text-white font-bold text-[1.1rem]">LunchBox</span>
        </div>
        <p className="text-gray-400 text-sm">2026 LunchBox. All rights reserved.</p>
      </footer>

    </div>
  )
}
