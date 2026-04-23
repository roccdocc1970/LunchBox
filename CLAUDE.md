# LunchBox — Claude Code Project Briefing

LunchBox is a **K-12 School Operations SaaS Platform** — enrollment, communication, reporting, billing, and staff management in one place. Target customer: small-to-mid size private and charter K-12 schools. Business model: per-school monthly SaaS subscription tiered by enrollment size.

> **ROADMAP.md** lives at `C:\Users\Daniel Rocco\Desktop\lunchbox\ROADMAP.md`.
> Read it when: (1) planning or scoping a new feature, (2) the user asks what's been built or what's next, (3) discussing the capability roadmap or build priorities, (4) referencing deferred work (custom roles, dark mode, config enforcement), or (5) checking pricing tiers. Do NOT load it for routine coding sessions — it's not needed to write or fix code.

---

## Live URLs & Accounts

| Resource | URL |
|---|---|
| GitHub Repo | https://github.com/roccdocc1970/LunchBox |
| Supabase Project | https://supabase.com/dashboard/project/omroxjrlhqeovnskzyok |
| Vercel Dashboard | https://vercel.com |
| Resend Dashboard | https://resend.com |
| Local Dev | http://localhost:5173 (`npm run dev`) |

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | `npm create vite@latest` |
| Styling | Tailwind CSS + inline styles | `@tailwindcss/vite` plugin |
| Database | Supabase (PostgreSQL) | Free tier |
| Auth | Supabase Auth | Email/password |
| Hosting | Vercel | Auto-deploys from GitHub on push |
| Email | Resend | Free tier, 3K emails/month |

---

## Environment Variables

Stored in `.env.local` (never committed). Also set in Vercel for production.

```
VITE_SUPABASE_URL=https://omroxjrlhqeovnskzyok.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yc2d1xNiGddeKcx5erg_iQ_pUE-HANS
VITE_RESEND_API_KEY=re_your_key_here
```

---

## Project File Structure

| File | Purpose |
|---|---|
| `src/App.jsx` | Main app — auth, routing, dashboard, nav. Detects admin vs staff on login. |
| `src/Landing.jsx` | Public marketing/landing page |
| `src/Onboarding.jsx` | First-time school setup flow |
| `src/Settings.jsx` | School settings — profile, academic config, appearance |
| `src/Students.jsx` | Student roster, profile drawer, health records, incidents, grade progression |
| `src/Enrollment.jsx` | Enrollment module |
| `src/Admissions.jsx` | Admissions pipeline — inquiry tracking, convert to student, Copy Application Link |
| `src/Attendance.jsx` | Daily attendance — take by grade or all grades, history, upsert per student/date |
| `src/ApplicationPortal.jsx` | Public-facing application form at `?apply=<school_uuid>` — no auth, feeds inquiries |
| `src/Parents.jsx` | Parent directory — linked students, edit contact, message |
| `src/Staff.jsx` | Staff directory, portal access / invite |
| `src/StaffDashboard.jsx` | Staff-facing app — role-filtered nav, students, report cards, incidents, facilities |
| `src/Alumni.jsx` | Alumni directory, donor status, giving history |
| `src/ReportCards.jsx` | Student report cards by term |
| `src/Fundraising.jsx` | Campaigns, donations, events, LYBUNT donor analysis |
| `src/Facilities.jsx` | Work order / ticket management |
| `src/Reports.jsx` | 7-tab reports — Enrollment, Attendance, Incidents, Communications, Staff, Fundraising, Facilities |
| `src/Messages.jsx` | Parent communication module |
| `src/supabase.js` | Supabase client initialization |
| `src/index.css` | Tailwind import |
| `src/main.jsx` | React entry point |
| `vite.config.js` | Vite + Tailwind config |

---

## Database Schema

### Table: `inquiries`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| parent_first_name / parent_last_name | TEXT | Required |
| email / phone | TEXT | Optional |
| student_first_name / student_last_name | TEXT | Required |
| grade_applying_for | TEXT | Optional |
| status | TEXT | New Inquiry, Toured, Applied, Withdrawn |
| source | TEXT | Web, Tour, Referral, Word of Mouth, Social Media, Other |
| inquiry_date / tour_date | DATE | |
| notes | TEXT | |

> RLS: school_id = auth.uid(). Convert to Student creates parent + student, marks status Applied.

### Table: `parents`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| first_name / last_name | TEXT | Required |
| email / phone / address / notes | TEXT | Optional |

> RLS: school_id = auth.uid(). One parent → many students via students.parent_id.
> Query with join: `select('*, students(id, first_name, last_name, grade, status)')`

### Table: `students`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| first_name / last_name | TEXT | Required |
| grade | TEXT | e.g. "3rd Grade" |
| date_of_birth | DATE | Optional |
| parent_id | UUID | References parents(id) |
| status | TEXT | Applied, Enrolled, Waitlisted |
| notes | TEXT | Optional |

> RLS: school_id = auth.uid() + staff layer.
> Query with parent join: `select('*, parents(id, first_name, last_name, email, phone, address)')`

### Table: `student_health`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| student_id | UUID | One row per student (no CASCADE FK) |
| school_id | UUID | References auth.users(id) |
| blood_type | TEXT | A+/A-/B+/B-/AB+/AB-/O+/O- |
| primary_physician / physician_phone | TEXT | Optional |
| insurance_provider / insurance_policy_number | TEXT | Optional |
| emergency_contact_name / phone / relationship | TEXT | Optional |
| physical_date | DATE | Last physical exam |
| notes | TEXT | Optional |

> RLS: Admin write (school_id = auth.uid()). Staff read via get_staff_school_id(). Survives graduation.

### Table: `student_health_entries`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| student_id / school_id | UUID | |
| category | TEXT | Allergy, Medication, Immunization, Condition, Injury, Other |
| name | TEXT | Required — e.g. "Peanut Allergy", "EpiPen" |
| detail / notes | TEXT | Optional |
| date / expiration_date | DATE | Optional — expiration_date < today flags Expired |

> RLS: Admin write. Staff read. Many rows per student.

### Table: `attendance`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| student_id | UUID | No FK constraint |
| student_name / student_grade | TEXT | Denormalized at save time |
| date | DATE | Required |
| status | TEXT | Present, Absent, Tardy, Excused |
| notes | TEXT | Optional |

> Unique constraint on (school_id, student_id, date) — upsert safe. RLS: Admin full access. Staff read/insert/update via get_staff_school_id(). Anon: no access.

### Table: `messages`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| subject / body | TEXT | Required |
| recipient_count | INTEGER | |
| status | TEXT | Default: Sent |

### Table: `schools`

| Column | Type | Notes |
|---|---|---|
| id / user_id | UUID | user_id references auth.users(id), UNIQUE |
| name / address / city / state / zip / phone / website | TEXT | |
| principal_name | TEXT | |
| student_capacity | INTEGER | |
| school_type | TEXT | Private, Charter, Public, Montessori, Religious, Other |
| logo_url | TEXT | Shown in top nav |
| grading_scale | TEXT | Letter, Standards, Satisfactory |
| grading_period | TEXT | Quarters, Trimesters, Semesters, Annual |
| subjects_offered | JSONB | Array of subject strings — drives report card rows |
| primary_color | TEXT | Hex — brand theming across the app |
| motto | TEXT | Shown under school name in top nav |
| divisions | JSONB | Array of `{ name, grades[] }` — max 6 |

### Table: `staff`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| first_name / last_name | TEXT | Required |
| email / phone | TEXT | Optional |
| role | TEXT | Principal, Teacher, Assistant Teacher, Substitute Teacher, Administrator, Counselor, Support Staff, Facilities, Maintenance |
| grade_assignment | TEXT | Legacy single-grade (superseded) |
| grade_assignments | JSONB | Array of grade strings — use `parseGradeAssignments()` which falls back to legacy |
| hire_date | DATE | Optional |
| status | TEXT | Active, Inactive |
| notes | TEXT | Optional |
| auth_user_id | UUID | Links staff Supabase auth account. Null = not yet linked. |

> RLS: Admin full access. Staff can read own record via auth_user_id = auth.uid() or email match.

### Table: `alumni`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | |
| first_name / last_name | TEXT | Required |
| graduation_year | INTEGER | |
| grade_completed / email / phone / address / city / state / zip | TEXT | |
| opt_in | BOOLEAN | Default true |
| preferred_contact | TEXT | Email, Phone, Mail |
| last_contacted_date | DATE | |
| relationship | TEXT | None, Donor, Volunteer, Mentor, Ambassador |
| donor_status | TEXT | Never, Prospect, Active Donor, Lapsed |
| employer / college / notes | TEXT | |

> Moved from students via "Graduate to Alumni" — inserted into alumni, deleted from students.

### Table: `report_cards`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | |
| student_id | UUID | No FK constraint — survives graduation |
| student_name / student_grade | TEXT | Denormalized at creation time |
| academic_year | TEXT | e.g. "2025-2026" |
| term | TEXT | Q1–Q4, T1–T3, S1–S2, or Annual |
| grades | JSONB | Array of `{ subject, grade, comment }` |
| teacher_notes | TEXT | |
| published | BOOLEAN | Default false |

### Table: `campaigns`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required |
| type | TEXT | Annual Fund, Capital Campaign, Event, Emergency Appeal, Grant, Scholarship, Other |
| goal | NUMERIC | |
| start_date / end_date | DATE | |
| status | TEXT | Active, Completed, Paused |
| description / notes | TEXT | |

### Table: `donations`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| campaign_id | UUID | Nullable — unlinked gift |
| donor_type | TEXT | Alumni, Parent, External |
| donor_id | UUID | Nullable for external donors |
| donor_name / donor_email | TEXT | Denormalized at log time |
| amount | NUMERIC | Required |
| date | DATE | |
| payment_method | TEXT | Check, Cash, Credit Card, Online, Stock, Wire Transfer, In-Kind, Other |
| anonymous / receipt_sent / restricted | BOOLEAN | |
| restriction_note / notes | TEXT | |

### Table: `fundraising_events`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| campaign_id | UUID | Nullable |
| name | TEXT | Required |
| type | TEXT | Gala, Auction, Walkathon, Golf Tournament, Bake Sale, Raffle, Dinner, Other |
| date | DATE | |
| venue | TEXT | |
| goal / ticket_price | NUMERIC | |
| tickets_sold | INTEGER | Default 0 |
| sponsorship_revenue / expenses | NUMERIC | Default 0 |
| notes | TEXT | |

> Net revenue = (ticket_price × tickets_sold) + sponsorship_revenue − expenses.

### Table: `work_orders`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| title | TEXT | Required |
| description / notes | TEXT | |
| category | TEXT | Plumbing, Electrical, HVAC, Carpentry, Grounds, Custodial, Safety, Technology, Other |
| location | TEXT | e.g. "Room 204", "Gym" |
| priority | TEXT | Low, Medium, High, Urgent |
| status | TEXT | Open, In Progress, On Hold, Completed, Cancelled |
| submitted_by / assigned_to | TEXT | Denormalized. Assignee filtered to Facilities/Maintenance roles + External Vendor. |
| due_date / completed_date | DATE | completed_date auto-set when status → Completed |
| estimated_cost / actual_cost | NUMERIC | |

> RLS: Admin (school_id = auth.uid()). Staff read/insert/update via get_staff_school_id().

---

## App Architecture & Routing

State-based routing in `App.jsx` — no React Router. `activePage` state controls which module renders.

### Key State Variables (`App.jsx`)

- `showLanding` — show Landing page vs app
- `session` — Supabase auth session (null = login form)
- `school` — school profile from `schools` table
- `activePage` — which module is active
- `staffMember` — set when logged-in user is staff (triggers StaffDashboard)
- `collapsedGroups` — sidebar group collapse state. Keys: `academics`, `people`, `operations`, `communicate`. Default: all false (expanded).
- `showSettingsMenu` — ⚙️ gear dropdown in top nav (School Settings + Setup Wizard)

### Page States

| Condition | What Shows |
|---|---|
| showLanding = true, no session | Landing.jsx |
| showLanding = false, no session | Login form |
| session + staffMember set | StaffDashboard.jsx |
| session + no school record | Onboarding.jsx |
| session + school record | Admin dashboard |

### Login Detection Flow (`fetchSchool`)
1. Check `schools` table for `user_id = auth.uid()` → admin
2. Check `staff` for `auth_user_id = auth.uid()` → returning staff
3. Check `staff` for `email = auth.email() AND auth_user_id IS NULL` → first-time staff, links auth_user_id
4. Neither → Onboarding

### Sidebar Nav Structure

Groups are collapsible (default expanded). Settings/Wizard live in ⚙️ top-nav gear dropdown.

- **Dashboard** — standalone
- **Academics** (`academics`): Students, Admissions, Enrollment, Report Cards, Parents
- **People** (`people`): Staff, Alumni
- **Operations** (`operations`): Fundraising, Facilities
- **Communicate** (`communicate`): Messages, Reports

### Staff Portal (`StaffDashboard.jsx`) — Role Gating

| Role | Nav Access |
|---|---|
| Teacher / Asst / Sub | My Students (grade-filtered), Attendance (grade pre-filled), Report Cards, Incidents, Facilities |
| Principal / Administrator | All Students, Attendance (all grades), Report Cards, Incidents, Facilities, Staff Directory |
| Counselor / Support Staff | All Students, Incidents, Facilities |

**Health records in student drawer:**
- `canViewFullHealth` (Principal, Admin, Counselor): full profile + all entries
- `canViewLimitedHealth` (Teacher, Asst, Sub): emergency contact + allergies only
- Support Staff / Facilities / Maintenance: no health access

### Staff Invitation Flow
1. Admin opens staff drawer → **Portal Access** shows linked/unlinked status
2. Admin clicks **Copy Invite Link** → copies app URL with instructions
3. Staff signs up at app URL with their work email
4. First login: `fetchSchool` matches by email, writes `auth_user_id`, routes to StaffDashboard
5. Subsequent logins: matched by `auth_user_id`

### Supabase RLS — Staff Layer
All staff-accessible tables have two policy layers:
- **Admin:** `school_id = auth.uid()`
- **Staff:** `school_id = get_staff_school_id()` — SECURITY DEFINER function that looks up school_id from staff table

Tables with staff policies: `schools` (read), `students` (read), `parents` (read), `incidents` (read/insert/update), `report_cards` (read/insert/update), `staff` (read own + update auth_user_id), `work_orders` (read/insert/update), `student_health` (read), `student_health_entries` (read)

---

## Shared Patterns & Helpers

These appear across multiple modules — keep in sync.

```js
// Brand color — every module
const primaryColor = school?.primary_color || '#f97316'

// Division colors — assigned by index (0–5)
const DIVISION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

// getDivision(grade, divisionsRaw) → { name, color } or null
// Used in Students, Staff, Reports, ReportCards

// Grade sort order — always use ALL_GRADES index
[...grades].sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b))

// parseGradeAssignments(member) — reads grade_assignments JSONB, falls back to grade_assignment text
// nullify(obj) — converts empty strings to null before Supabase inserts (prevents DATE column errors)
```

**Report chart colors by tab:** Enrollment/Staff = primaryColor · Incidents = `#ef4444` · Communications = `#8b5cf6` · Fundraising = `#10b981` · Facilities = `#0ea5e9`

---

## Development Workflow

```bash
npm run dev          # local dev at http://localhost:5173
git add .
git commit -m "..."
git push             # Vercel auto-deploys in ~60 seconds
```

Always open Claude Code from `C:\Users\Daniel Rocco\Desktop\lunchbox`.
