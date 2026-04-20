export default function Landing({ onGetStarted }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#1f2937' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🍱</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937' }}>LunchBox</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="#features" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.95rem' }}>Features</a>
          <a href="#how-it-works" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.95rem' }}>How It Works</a>
          <button
            onClick={onGetStarted}
            style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#f97316', color: 'white', borderRadius: '9999px', padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Now available for K-12 schools
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', color: '#1f2937', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Run Your Entire School From One Place
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            LunchBox replaces the pile of disconnected tools your school relies on. Enrollment, parent communication, reporting — all in one beautiful platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.875rem 2rem', fontWeight: '700', cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
            >
              Get Started Free
            </button>
            
              <a href="#how-it-works"
              style={{ background: 'white', color: '#374151', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.875rem 2rem', fontWeight: '600', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none' }}
            >
              See How It Works
            </a>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>No credit card required · Free to get started</p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section style={{ background: 'white', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>TRUSTED BY SCHOOLS ACROSS THE COUNTRY</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {['Riverside Academy', 'Northside Prep', 'Sunview Charter', 'Hillcrest K-8', 'Oakwood Private'].map((school) => (
            <span key={school} style={{ color: '#9ca3af', fontWeight: '600', fontSize: '0.95rem' }}>{school}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>Everything Your School Needs</h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Stop juggling spreadsheets and disconnected apps. LunchBox brings it all together.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '📋', title: 'Smart Enrollment', desc: 'Manage student applications, track enrollment status, handle waitlists, and collect all the information you need digitally in one place.' },
              { icon: '✉️', title: 'Parent Communication', desc: 'Send announcements, newsletters, and individual messages to parents instantly. Keep every family informed and engaged.' },
              { icon: '📊', title: 'Powerful Reporting', desc: 'Get instant insights into enrollment trends, attendance, and school performance. Make data-driven decisions with ease.' },
              { icon: '💰', title: 'Billing and Payments', desc: 'Collect tuition, fees, and donations online. Automated reminders and receipts save your admin team hours every week.' },
              { icon: '👩‍🏫', title: 'Staff Management', desc: 'Manage schedules, roles, and communications for your entire staff from one central dashboard.' },
              { icon: '🔒', title: 'Secure and Compliant', desc: 'Built with security first. Your school data is encrypted, backed up, and only accessible to the right people.' },
            ].map((feature) => (
              <div key={feature.title} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem' }}>{feature.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '6rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>Up and Running in Minutes</h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '4rem' }}>No IT department needed. No lengthy onboarding. Just sign up and go.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { step: '1', title: 'Create Your Account', desc: 'Sign up free in under 60 seconds. No credit card required.' },
              { step: '2', title: 'Set Up Your School', desc: 'Add your school details, staff, and customize your settings.' },
              { step: '3', title: 'Start Enrolling', desc: 'Begin accepting students and communicating with parents right away.' },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white', fontWeight: '800', fontSize: '1.25rem' }}>{item.step}</div>
                <h3 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '6rem 2rem', background: '#fff7ed' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1f2937', textAlign: 'center', marginBottom: '4rem' }}>Schools Love LunchBox</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { quote: 'LunchBox cut our enrollment paperwork in half. What used to take weeks now takes days.', name: 'Sarah M.', role: 'Principal, Riverside Academy' },
              { quote: 'Finally a platform that was designed for schools, not just adapted for them. Our parents love it.', name: 'James T.', role: 'Administrator, Northside Prep' },
              { quote: 'The parent communication tools alone are worth it. We have never been more connected with our families.', name: 'Linda K.', role: 'Director, Sunview Charter' },
            ].map((t) => (
              <div key={t.name} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ color: '#374151', lineHeight: 1.7, fontSize: '1rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontWeight: '700', color: '#1f2937' }}>{t.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#f97316', padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>Ready to Transform Your School?</h2>
          <p style={{ color: '#fff7ed', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Join schools already using LunchBox to run smarter operations.</p>
          <button
            onClick={onGetStarted}
            style={{ background: 'white', color: '#f97316', border: 'none', borderRadius: '0.75rem', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
          >
            Get Started Free
          </button>
          <p style={{ color: '#fed7aa', fontSize: '0.875rem', marginTop: '1rem' }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1f2937', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🍱</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>LunchBox</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>2026 LunchBox. All rights reserved.</p>
      </footer>

    </div>
  )
}