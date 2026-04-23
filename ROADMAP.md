# LunchBox — Roadmap & Module Reference

---

## Modules Already Built

### Landing Page (`Landing.jsx`)
Sticky nav with Log In + Sign Up Free. Hero, social proof bar, 6-feature grid, how-it-works, testimonials, CTA footer. `onGetStarted` / `onLogin` props set `showLanding = false`.

### Authentication (`App.jsx`)
Email/password sign up + sign in via Supabase Auth. Email confirmation flow. Session detection on load + `onAuthStateChange` listener.

### School Onboarding (`Onboarding.jsx`)
2-step form (school info → address). Saves to `schools` table. Calls `onComplete(schoolData)` to update parent state. Auto-shown to new users with no school record.

### Setup Wizard (`SetupWizard.jsx`)
5-step modal: Grades Offered → Divisions → Subjects → Grading Scale/Period → Brand Color/Logo. Each step saves to Supabase. Completion tracked in `localStorage` key `wizard_complete_{userId}`. Accessible via ⚙️ top-nav gear menu.

### Dashboard (`App.jsx`)
Top nav with school logo/motto/color. Sidebar nav (collapsible groups). Live stat cards (Total Students, Pending Enrollment, Messages Sent, Active Staff — parallel count queries). Quick action buttons.

### Students Module (`Students.jsx`)
Roster table with division badge, parent, contact, status. Filters: search, grade, status, division. Summary counts. Grade progression (Enrolled-only, forward-only, repeat/skip checkboxes). Profile drawer: grade history timeline, report card count, health records, incident log, Graduate to Alumni flow. Config nudge banner if grades not configured.

### Staff Module (`Staff.jsx`)
Staff grid cards with role color, division badge. Roles: Principal, Teacher, Assistant Teacher, Substitute Teacher, Administrator, Counselor, Support Staff, Facilities, Maintenance. Multi-grade assignment via JSONB. Orphaned grade greying with ⚠. Portal Access section: linked/unlinked status, Copy Invite Link. Filters: search, role, status, division.

### Staff Portal (`StaffDashboard.jsx`)
Role-filtered nav. Students page (grade-filtered for teachers). Health records in drawer (role-gated — see CLAUDE.md). Report Cards create/edit/publish. Incidents full list + log new. Facilities submit + view. Staff Directory (principal/admin only).

### Parents Module (`Parents.jsx`)
Queries `parents` table with students join. One parent → many students (siblings). Table: name, email, phone, linked student chips. Profile drawer: contact details + linked students. Edit contact inline. ✉ Message button routes to Messages via `onCompose` prop.

### Enrollment Module (`Enrollment.jsx`)
New Student form. Student list with status badges. Inline status dropdown. Saves to `students` table.

### Admissions Module (`Admissions.jsx`)
Pipeline: New Inquiry → Toured → Applied → Withdrawn. Sources: Web, Tour, Referral, Word of Mouth, Social Media, Other. Clickable stat bar + source pill bar. Profile drawer with edit. Convert to Student: dedupes parent by email → creates parent + student → marks Applied.

### Report Cards (`ReportCards.jsx`)
Per-student per-term cards. Grade options from grading scale. Subjects from `subjects_offered` config. Per-subject grade + comment. Teacher notes. Draft → Published toggle. Filters: name, term, published, division.

### Alumni Module (`Alumni.jsx`)
Directory with profile drawer. Relationship + donor status tracking. Employment/college fields. Giving History section: fetches donations where `donor_id = alumni.id AND donor_type = 'Alumni'`.

### Messages Module (`Messages.jsx`)
Compose to All Parents. Fetches parent emails from students table. Saves to `messages` table. Message history list. (Live email requires verified Resend domain.)

### Fundraising Module (`Fundraising.jsx`)
4 tabs: Campaigns, Donations, Events, Donors. Campaign cards with progress bars. Donation log with live donor search (alumni + parents) or external entry. LYBUNT analysis. Alumni Prospects table. `fmt(n)` formats `$1,234`.

### Facilities Module (`Facilities.jsx`)
Work order management. Stat cards: Open, In Progress, Urgent, Completed This Month. Create form with category, priority, assignee (Facilities/Maintenance roles + External Vendor). Status flow: Open → In Progress → On Hold → Completed/Cancelled. `completed_date` auto-set on Completed.

### Reports Module (`Reports.jsx`)
6 tabs: Enrollment · Student Incidents · Communications · Staff · Fundraising · Facilities. Each tab has stat cards, bar charts, and data tables. Facilities tab includes cost summary, assignee workload, overdue list.

### Health Records (`Students.jsx` + `StaffDashboard.jsx`)
Two tables: `student_health` (one profile per student) + `student_health_entries` (many facts). Admin can add/edit/delete from student profile drawer. Categories: Allergy, Medication, Immunization, Condition, Injury, Other. Expiration date flagging. Role-gated in StaffDashboard.

---

## Capability Roadmap

### Already Shipped

| Capability | Coverage |
|---|---|
| Student Recruitment | ✅ Admissions — inquiry pipeline, source tracking, convert to student |
| Student Admission | ✅ Enrollment — applications, waitlist, status workflow |
| Student Enrollment & Registration | ✅ Enrollment + grade assignment + onboarding |
| Student Assessment | ✅ Report Cards — grades, subjects, terms, draft/publish |
| Completion & Advancement | ✅ Grade progression, Graduate to Alumni |
| Student Health Records | ✅ student_health + student_health_entries, role-gated in Staff Portal |
| Student Incident / Behavior Log | ✅ Incident log in Students + Staff Portal |
| Advancement & Fundraising | ✅ Campaigns, donations, events, LYBUNT, alumni giving |
| Information & Records Management | ✅ Student records, grade history, alumni records |
| Staff Logins / Portal | ✅ StaffDashboard with role-based nav + invite flow |
| Admissions Pipeline | ✅ Inquiry → Toured → Applied flow |
| Human Resource Management | Partial — staff directory, multi-grade, divisions, portal; no PD log or reviews |
| Facilities & Operations | Partial — Work Orders built; preventive maintenance, asset registry, room booking not yet built |
| Financial Management | Partial — pricing tiers defined; Stripe not integrated |
| Marketing & Community Engagement | Partial — Messages module; no scheduling or targeting |

---

## Modules To Build Next

### Tier 1 — Core gaps, high sales impact

| Capability | What to Build |
|---|---|
| **Attendance Tracking** | Daily + period attendance. New `attendance` table (student_id, date, period, status: Present/Absent/Tardy/Excused, notes). Chronic absenteeism alerts. Parent notification on absence. High-frequency daily use — biggest SIS gap. |
| **Online Application Portal** | Public-facing URL for families to self-submit inquiries/applications. Feeds into `inquiries`. Requires unauthenticated Supabase insert policy. |
| **Tuition & Billing** | Per-student invoicing, online payment via Stripe, financial aid, payment plans. New `invoices` + `payments` tables. Depends on Stripe. |
| **Stripe Integration** | Monthly subscription billing for schools — required to go live. |
| **Resend Domain Verification** | Required before live parent email delivery works. |

### Tier 2 — Important extensions

| Capability | What to Build |
|---|---|
| **Digital Enrollment Contracts** | E-signature on tuition agreements. DocuSign/HelloSign API or PDF + manual sign flow. |
| **Lottery Management** | Charter-critical: weighted lottery (siblings, staff children, geographic zones). Draws from inquiries/applications pool. Generates ranked waitlist. |
| **Live Gradebook** | Assignment-level daily grades beyond term report cards. New `assignments` + `grades` tables. Rolls up to Report Cards. |
| **Multi-Channel Notifications** | SMS (Twilio) + push alongside email. Per-grade and per-student targeting. |
| **Compliance Reporting** | State/accreditation exports — enrollment counts, attendance rates, incident summaries. PDF/CSV export from Reports module. |
| **Inventory & Asset Tracking** | Laptops, textbooks, lab equipment. New `assets` table. Links to Facilities work orders for repairs. |
| **Fund Accounting** | Per-pupil revenue, grants (Title I, IDEA), restricted vs. unrestricted funds. Charter-critical for authorizer transparency. |
| **Staff PD & Performance** | PD log (date, hours, topic) + annual review notes in staff profile drawer. |
| **Enhanced Messaging** | Message types (Newsletter, Alert, Event), scheduled sends, open tracking via Resend. |
| **Parent Portal** | Parent-facing login to view report cards and messages. Requires separate auth role + per-student RLS. Depends on Stripe + Resend first. |
| **Multiple Guardians per Student** | Two contacts for divorced/blended families. `guardians` JSONB on students or separate table. |

### Tier 3 — Specialized / Lower priority

| Capability | Notes |
|---|---|
| **Class Scheduling / Timetabling** | Complex constraint-solver — teacher availability, room capacity, block/rotation scheduling. High build effort. |
| **Student Portal** | Student-facing grades/schedule/assignments. Depends on Live Gradebook + Parent Portal. |
| **Payroll & HR** | Very complex — likely better to integrate Gusto or ADP. |
| **Preventive Maintenance** | Recurring scheduled maintenance tasks. New `maintenance_schedules` table. Part of Facilities expansion. |
| **Room / Space Booking** | Reserve gym, auditoriums, classrooms. Part of Facilities expansion. |
| **Transport Management** | Bus GPS, route optimization, pickup notifications. Needs third-party integration. |
| **Library Management** | Book catalog, checkout, late fees. Niche — most schools use a standalone system. |

### Tier 4 — Infrastructure

| Item | Notes |
|---|---|
| Custom Domain | Buy getlunchbox.com or lunchbox.app |
| Resend Domain Verification | Required for live parent email |

### Out of Scope

| Capability | Reason |
|---|---|
| Curriculum / LMS | Google Classroom, Seesaw, Canvas territory |
| Governance & Risk | Policy docs belong in Drive/Notion |
| Legal & Risk Services | Outside counsel; not SaaS territory |

---

## Deferred Work (Planned, Not Yet Built)

### Config-Driven Platform Rules — Phase 2
Hard enforcement of grade rules: block saving a student in a grade not offered, warn on orphaned staff grade assignments. Phase 1 ships nudge banners only.
- **Files:** `src/Students.jsx`, `src/Enrollment.jsx`, `src/Alumni.jsx`

### Custom Staff Roles
Admin-defined roles stored as JSONB on `schools` table. Role dropdowns in Staff.jsx + StaffDashboard.jsx merge hardcoded + custom roles. Custom roles need a permission tier mapping for StaffDashboard nav gating.
- **Why deferred:** Hardcoded roles cover common case. Facilities + Maintenance added as short-term fix (2026-04-22).
- **Files:** `src/Settings.jsx`, `src/Staff.jsx`, `src/StaffDashboard.jsx`, `src/Facilities.jsx`

### Dark Mode
App-wide toggle saved to `schools.dark_mode`. Requires CSS custom properties (`--bg`, `--surface`, `--text`) replacing inline styles across all modules — significant refactor.
- **Approach:** (1) CSS vars in index.css, (2) migrate all JSX inline styles, (3) toggle in Settings → Appearance, (4) persist to DB.

---

## Pricing Tiers

| Tier | Limit | Price |
|---|---|---|
| Starter | Up to 100 students | ~$99/month |
| Growth | Up to 300 students | ~$199/month |
| Pro | Unlimited students | ~$399/month |

Payment via Stripe (not yet integrated).
