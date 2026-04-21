# LunchBox — Claude Code Project Briefing

## What Is LunchBox?

LunchBox is a **K-12 School Operations SaaS Platform** that replaces the pile of disconnected tools schools use by providing enrollment, parent communication, reporting, billing, and staff management in one place.

**Target Customer:** Small-to-mid size private and charter K-12 schools currently juggling 6–10 disconnected tools.

**Business Model:** Per-school monthly SaaS subscription, tiered by student enrollment size.

---

## Live URLs & Accounts

| Resource | URL / Details |
|---|---|
| GitHub Repo | https://github.com/roccdocc1970/LunchBox |
| Supabase Project | https://supabase.com/dashboard/project/omroxjrlhqeovnskzyok |
| Vercel Dashboard | https://vercel.com |
| Resend Dashboard | https://resend.com |

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Scaffolded with `npm create vite@latest` |
| Styling | Tailwind CSS + inline styles | Tailwind via `@tailwindcss/vite` plugin |
| Database | Supabase (PostgreSQL) | Free tier |
| Auth | Supabase Auth | Email/password |
| Hosting | Vercel | Auto-deploys from GitHub on push |
| Version Control | GitHub | repo: `roccdocc1970/LunchBox` |
| Email | Resend | Free tier, 3K emails/month |

---

## Environment Variables

Stored in `.env.local` (never committed to GitHub). Also added to Vercel environment variables for production.

```
VITE_SUPABASE_URL=https://omroxjrlhqeovnskzyok.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yc2d1xNiGddeKcx5erg_iQ_pUE-HANS
VITE_RESEND_API_KEY=re_your_key_here
```

---

## Project File Structure

| File | Purpose |
|---|---|
| `src/App.jsx` | Main app — auth, routing, dashboard, nav |
| `src/Enrollment.jsx` | Enrollment module |
| `src/Messages.jsx` | Parent communication module |
| `src/Landing.jsx` | Public marketing/landing page |
| `src/Onboarding.jsx` | First-time school setup flow |
| `src/Settings.jsx` | School settings page |
| `src/Staff.jsx` | Staff directory and management |
| `src/Students.jsx` | Student roster and profile management |
| `src/Alumni.jsx` | Alumni directory, engagement tracking, donor status |
| `src/Reports.jsx` | Enrollment reports and analytics |
| `src/ReportCards.jsx` | Student report cards by term |
| `src/supabase.js` | Supabase client initialization |
| `src/index.css` | Tailwind import |
| `src/main.jsx` | React entry point |
| `.env.local` | Environment variables (NOT in GitHub) |
| `vite.config.js` | Vite + Tailwind config |

---

## Database Schema

### Table: `students`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| first_name | TEXT | Required |
| last_name | TEXT | Required |
| grade | TEXT | e.g. "3rd Grade" |
| date_of_birth | DATE | Optional |
| parent_name | TEXT | Required |
| parent_email | TEXT | Required |
| parent_phone | TEXT | Optional |
| address | TEXT | Optional |
| status | TEXT | Default: Applied. Options: Applied, Enrolled, Waitlisted |
| notes | TEXT | Optional |
| school_id | UUID | References auth.users(id) — links student to school admin |

> RLS Policy: Users can only read/write their own school's students.

### Table: `messages`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| subject | TEXT | Required |
| body | TEXT | Required |
| recipient_count | INTEGER | Number of parents messaged |
| status | TEXT | Default: Sent |
| school_id | UUID | References auth.users(id) |

> RLS Policy: Users can only read/write their own school's messages.

### Table: `schools`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| name | TEXT | Required |
| address | TEXT | Optional |
| city | TEXT | Optional |
| state | TEXT | Optional |
| zip | TEXT | Optional |
| phone | TEXT | Optional |
| website | TEXT | Optional |
| principal_name | TEXT | Optional |
| student_capacity | INTEGER | Optional |
| school_type | TEXT | Default: Private. Options: Private, Charter, Public, Montessori, Religious, Other |
| logo_url | TEXT | URL to school logo — shown in top nav |
| user_id | UUID | References auth.users(id), UNIQUE |
| grading_scale | TEXT | Default: Letter. Options: Letter, Standards, Satisfactory |
| subjects_offered | JSONB | Array of subject name strings. Drives report card rows. |
| primary_color | TEXT | Hex color for brand theming across the app |
| motto | TEXT | School tagline — shown under name in top nav |
| divisions | JSONB | Array of `{ name, grades[] }` — school subdivisions. Max 6. Grades sorted in grade order. |

> RLS Policy: Users can only read/write their own school record.

### Table: `staff`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| first_name | TEXT | Required |
| last_name | TEXT | Required |
| email | TEXT | Optional |
| phone | TEXT | Optional |
| role | TEXT | Principal, Teacher, Assistant Teacher, Substitute Teacher, Administrator, Counselor, Support Staff |
| grade_assignment | TEXT | Legacy single-grade field — superseded by grade_assignments |
| grade_assignments | JSONB | Array of grade strings — multi-grade assignment. Parsed by `parseGradeAssignments()` which falls back to legacy `grade_assignment` |
| hire_date | DATE | Optional |
| status | TEXT | Default: Active. Options: Active, Inactive |
| notes | TEXT | Optional |
| school_id | UUID | References auth.users(id) |

> RLS Policy: Users can only read/write their own school's staff.

### Table: `alumni`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| first_name | TEXT | Required |
| last_name | TEXT | Required |
| graduation_year | INTEGER | Optional |
| grade_completed | TEXT | Last grade they completed |
| email | TEXT | Optional |
| phone | TEXT | Optional |
| address | TEXT | Optional |
| city | TEXT | Optional |
| state | TEXT | Optional |
| zip | TEXT | Optional |
| opt_in | BOOLEAN | Default: true. Consent to be contacted |
| preferred_contact | TEXT | Email, Phone, or Mail |
| last_contacted_date | DATE | Optional |
| relationship | TEXT | None, Donor, Volunteer, Mentor, Ambassador |
| donor_status | TEXT | Never, Prospect, Active Donor, Lapsed |
| employer | TEXT | Optional |
| college | TEXT | Optional |
| notes | TEXT | Optional |
| school_id | UUID | References auth.users(id) |

> RLS Policy: Users can only read/write their own school's alumni.
> Students are moved to alumni via "Graduate to Alumni" button in Students module — record is inserted into alumni and deleted from students.

### Table: `report_cards`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| created_at | TIMESTAMP | Auto-set |
| student_id | UUID | No FK constraint — survives student graduation/deletion |
| student_name | TEXT | Denormalized at creation time |
| student_grade | TEXT | Denormalized at creation time |
| school_id | UUID | References auth.users(id) |
| academic_year | TEXT | e.g. "2025-2026" |
| term | TEXT | Q1/Q2/Q3/Q4, T1/T2/T3, S1/S2, or Annual — driven by school grading_period |
| grades | JSONB | Array of {subject, grade, comment} |
| teacher_notes | TEXT | Overall teacher comment for the term |
| published | BOOLEAN | Default: false. True = visible/finalized |

> RLS Policy: Users can only read/write their own school's report cards.
> student_name and student_grade are stored at creation time so cards survive graduation.

---

## App Architecture & Routing

LunchBox uses **state-based routing** (no React Router) inside `App.jsx`.

### Key State Variables

- `showLanding` — controls whether to show Landing page or app
- `session` — Supabase auth session. If null = show login. If set = show dashboard.
- `school` — school profile fetched from `schools` table after login
- `checkingSchool` — loading flag while fetching school profile
- `activePage` — controls which module is shown in the dashboard

### Page States

| State | What Shows |
|---|---|
| `showLanding = true`, no session | `Landing.jsx` (marketing page) |
| `showLanding = false`, no session | Login form |
| session exists, no school record | `Onboarding.jsx` (first-time setup) |
| session exists, school record exists | Dashboard with sidebar nav |

### Sidebar Nav Items

- **Dashboard** — home screen with live stats and quick actions
- **Enrollment** — `Enrollment.jsx`
- **Messages** — `Messages.jsx`
- **Students** — `Students.jsx`
- **Staff** — `Staff.jsx`
- **Alumni** — `Alumni.jsx`
- **Report Cards** — `ReportCards.jsx`
- **Reports** — `Reports.jsx`
- **School Settings** — `Settings.jsx`

---

## Shared Patterns & Helpers

These constants and helpers appear across multiple modules — keep them in sync if logic changes.

### Brand Color
Every module derives `primaryColor` from the school prop:
```js
const primaryColor = school?.primary_color || '#f97316'
```

### Division Colors
```js
const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
```
Used in Settings, Students, Staff, Reports, ReportCards. Color is assigned by division index (0–5).

### getDivision(grade, divisionsRaw)
Returns `{ name, color }` for the division a grade belongs to, or `null` if unassigned.
Used in Students, Staff, Reports, ReportCards.

### Grade Order
Always sort grade arrays by `ALL_GRADES` index:
```js
[...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))
```

---

## Modules Already Built

### Landing Page (`Landing.jsx`)
- Sticky nav with logo and Sign Up Free button
- Hero section with orange gradient background
- Social proof bar with placeholder school names
- 6-feature grid: Enrollment, Communication, Reporting, Billing, Staff, Security
- How it works section (3 steps)
- Testimonials (3 placeholder quotes)
- Bottom CTA section and footer
- All CTAs call `onGetStarted` prop which sets `showLanding = false`

### Authentication (`App.jsx`)
- Email/password sign up and sign in via Supabase Auth
- Email confirmation flow
- Session detection on load via `supabase.auth.getSession()`
- Auth state listener via `supabase.auth.onAuthStateChange()`
- Sign out button in top nav

### School Onboarding (`Onboarding.jsx`)
- Shown automatically to new users with no school record
- 2-step flow with orange progress bar
- Step 1: School name, principal name, school type, student capacity, phone
- Step 2: Street address, city, state, ZIP, website
- Saves to `schools` table on completion
- On complete calls `onComplete(schoolData)` to update parent state

### Dashboard (`App.jsx`)
- Top nav bar using `school.primary_color` with logo, motto, user email, sign out
- Left sidebar with nav items, active state uses `primaryColor`
- Live stats cards (parallel Supabase count queries on login): Total Students, Pending Enrollment, Messages Sent, Active Staff
- Quick action buttons linking to modules
- Welcome message: `Welcome, {school.name}`

### Enrollment Module (`Enrollment.jsx`)
- `+ New Student` button toggles enrollment form
- Form fields: first name, last name, grade, DOB, parent name, parent email, parent phone, address, notes
- Saves to `students` table with `school_id` = logged-in user's id
- Student list table: Student, Grade, Parent, Contact, Status, Actions columns
- Status badge color coding: Applied=blue, Enrolled=green, Waitlisted=amber
- Inline status dropdown to update student status

### Messages Module (`Messages.jsx`)
- `+ New Message` button toggles compose form
- Fields: Recipients (All Parents), Subject, Message body
- On send: fetches all parent emails from `students` table, saves message to `messages` table
- Message history list: subject, recipient count, date, status badge
- Note: Live email sending requires verified domain in Resend

### Settings Module (`Settings.jsx`)
- 4 tabs: School Profile, Academic Config, Communication, Appearance
- **Academic Config:**
  - Grade level checkboxes (Select All / Clear)
  - Academic year, school year start/end months, grading period (Quarters/Trimesters/Semesters/Annual)
  - Grading scale: Letter / Standards-Based / Satisfactory — drives report card grade options
  - Subjects offered (textarea, one per line) — drives report card rows
  - **School Divisions:** up to 6 color-coded division cards, 4 defaults (Early Childhood, Lower School, Intermediate School, Upper School). Assign grades via pill toggles — grade can only belong to one division. Pills always render in grade order. Add/Remove division controls (max 6).
- **Appearance:** brand color picker + hex input (applied globally), logo URL, school motto
- Brand color and logo applied across all modules via `school.primary_color` and `school.logo_url`
- Save button per tab; updates `schools` table and calls `onUpdate()` to refresh parent state

### Students Module (`Students.jsx`)
- Roster table: Student, Grade (with division badge), Parent, Contact, Status
- Filters: search, grade, status, division (dropdown only shown when divisions have grades assigned)
- Summary counts: Enrolled / Applied / Waitlisted / Total
- Grade progression locked until status = Enrolled; forward-only with repeat/skip checkboxes
- Grade history timeline in profile drawer
- Report card count shown in profile drawer
- Graduate to Alumni flow: moves record to `alumni` table, deletes from `students`
- Config nudge banner if grades not configured in Settings

### Staff Module (`Staff.jsx`)
- Staff grid (cards): avatar, role color, division badge (derived from grade assignments), email, phone, status
- **Multi-grade assignment:** staff can be assigned to any number of configured school grades via pill-toggle picker
- Grade assignments stored in `grade_assignments` JSONB column; `parseGradeAssignments()` falls back to legacy `grade_assignment` text column
- **Orphaned grade handling:** if school removes a grade from config, any staff assigned to it see it greyed out with strikethrough + ⚠ warning in both view and edit mode. Not auto-deleted — admin cleans up intentionally.
- Divisions derived from grade assignments — no direct division assignment needed
- Profile drawer (view): Grade Assignments and School Divisions shown as separate labeled sections
- Filters: search, role, status, division
- Config nudge banner if grades not configured in Settings

### Alumni Module (`Alumni.jsx`)
- Alumni directory with profile drawer
- Fields: graduation year, grade completed, contact info, opt-in consent, preferred contact method, last contacted date
- Relationship tracking: None, Donor, Volunteer, Mentor, Ambassador
- Donor status: Never, Prospect, Active Donor, Lapsed
- Employment and college fields
- Grade history visible in profile drawer

### Report Cards Module (`ReportCards.jsx`)
- Create report cards per student per term with a subject-by-subject grades grid
- Grade options driven by school's grading scale (Letter, Standards-Based, Satisfactory)
- Subjects driven by school's subjects_offered config (defaults to 9 standard K-8 subjects)
- Per-subject grade dropdown + optional teacher comment
- Overall teacher notes field
- Draft → Published workflow with Publish/Revert to Draft toggle
- Filters: search by student name, filter by term, filter by published status, filter by division
- Summary bar: Total / Published / Draft counts
- Report card count shown in student profile drawer (Students module)

### Reports Module (`Reports.jsx`)
- Top stats: Total Students, Enrolled, Applied, Waitlisted, Messages Sent, Parents Reached
- Enrollment Status stacked bar chart
- Capacity Utilization bar (if student_capacity set in Settings)
- New Students — Last 6 Months bar chart (uses `primaryColor`)
- **Students by Division** breakdown (only shown when divisions have grades assigned)
- Students by Grade breakdown bar chart
- All bar colors use `school.primary_color`

---

## Capability Roadmap (HERM-Based)

Organized from the Business Capability Map shared 2026-04-20.

### Already Built

| Capability | HERM Ref | Coverage |
|---|---|---|
| Student Recruitment (landing + inquiry) | 1.3 | Partial — landing page only, no inquiry/lead tracking |
| Student Admission | 1.4 | ✅ Enrollment module: applications, waitlist, status workflow |
| Student Enrollment & Registration | 1.5 | ✅ Enrollment + grade assignment + onboarding |
| Student Assessment & Progress Tracking | 1.7 | ✅ Report Cards module: grades, subjects, terms, draft/publish |
| Completion & Advancement Management | 1.8 | ✅ Grade progression, Graduate to Alumni, re-enrollment |
| Human Resource Management | 2.2 | Partial — staff directory, multi-grade assignment, divisions; no PD log or reviews |
| Financial Management | 2.3 | Partial — pricing tiers defined, Stripe not integrated |
| Marketing & Community Engagement | 2.6 | Partial — Messages module; no newsletter types or scheduling |
| Advancement & Fundraising | 2.7 | Partial — Alumni module: donor status, relationship tracking |
| Information & Records Management | 2.8 | ✅ Student records, grade history, alumni records |

---

### Modules To Build Next (Prioritized)

**Tier 1 — Core gaps, high impact**

| Capability | HERM Ref | What to Build | Priority |
|---|---|---|---|
| Stripe Integration | 2.3 | Monthly subscription billing for schools | High |
| Admissions Pipeline | 1.3 | Pre-application inquiry tracking; add "Inquiry" status before Applied; source tracking (tour, referral, web) | High |
| Resend Domain Verification | 2.6 | Enable live email delivery to parents | Medium |
| Incident / Behavior Log | 1.6 | Per-student incident log (date, type, notes, resolution) inside student profile drawer | Medium |

**Tier 2 — Extend existing modules**

| Capability | HERM Ref | What to Build | Priority |
|---|---|---|---|
| Staff PD & Performance | 2.2 | Professional development log (date, hours, topic) + annual review notes in staff profile | Medium |
| Enhanced Messaging | 2.6 | Message types (Newsletter, Alert, Event), scheduled sends, open tracking via Resend | Medium |
| Student Billing / Tuition Ledger | 2.3 | Per-student charges, payments, balance ledger; ties to enrollment | Low |
| School Health Dashboard | 2.10 | Extend Reports with KPI trendlines: enrollment rate, retention, tuition collection % | Low |
| Staff Logins | 2.5 | Staff-specific portal access with limited permissions | Low |

**Tier 3 — Infrastructure**

| Item | Notes |
|---|---|
| Custom Domain | Buy getlunchbox.com or lunchbox.app |
| Email Verification (Resend) | Required before live parent email sending works |

**Out of scope (better served by dedicated tools)**

| Capability | HERM Ref | Reason |
|---|---|---|
| Curriculum Management & Delivery | 1.1 / 1.2 | LMS territory — Google Classroom, Seesaw, Canvas own this |
| Governance, Risk & Compliance | 2.1 | Policy docs belong in Drive/Notion; compliance is specialized |
| Facilities & Operations | 2.4 | Different buyer persona; physical/operational tooling |
| IT & Systems | 2.5 | LunchBox *is* this capability for its customers |
| Legal & Risk Services | 2.9 | Outside counsel; not SaaS territory |

---

## Deferred Work (Planned, Not Yet Built)

### Config-Driven Platform Rules — Phase 2
- **What:** Hard enforcement of grade rules across modules — e.g. block saving a student in a grade the school doesn't offer, warn when staff have orphaned grade assignments that need cleanup.
- **Why deferred:** Phase 1 ships nudge banners and config-aware pickers. Staff orphaned-grade greying is already done. Phase 2 adds hard blocking.
- **Where to change:** `src/Students.jsx`, `src/Enrollment.jsx`, `src/Alumni.jsx`

### Dark Mode
- **What:** App-wide dark mode toggle in Settings → Appearance. Saves preference to `schools` table (new `dark_mode` boolean column). Renders black/dark backgrounds instead of white across all modules.
- **Why deferred:** All modules use hardcoded inline styles — requires introducing CSS custom properties (`--bg`, `--surface`, `--text`, etc.) and swapping them via a `data-theme="dark"` attribute on the root element. Significant refactor touching every module.
- **Approach:** (1) Add CSS vars to `index.css`, (2) migrate inline styles across all JSX files to use vars, (3) add toggle in Settings → Appearance, (4) persist to DB and apply on login.

---

## Pricing Tiers

| Tier | Limit | Price |
|---|---|---|
| Starter | Up to 100 students | ~$99/month |
| Growth | Up to 300 students | ~$199/month |
| Pro | Unlimited students | ~$399/month |

Payment processing via Stripe (not yet integrated).

---

## Development Workflow

1. Edit code in VS Code
2. Preview locally at `http://localhost:5173` — run `npm run dev` in terminal
3. When ready to deploy:

```bash
git add .
git commit -m "description of changes"
git push
```

4. Vercel auto-detects the push and deploys to production in ~60 seconds.

---

## How To Start a Session

When opening Claude Code, navigate to the project root first so this file is auto-loaded. Then tell Claude what you want to work on:

> "I'd like to work on [MODULE NAME] today."

Claude Code will have full context of the architecture, stack, database schema, and what has been built so far.
