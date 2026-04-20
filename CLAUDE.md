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
| logo_url | TEXT | Optional |
| user_id | UUID | References auth.users(id), UNIQUE |

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
| role | TEXT | Principal, Teacher, Assistant Teacher, Administrator, Counselor, Support Staff |
| grade_assignment | TEXT | Optional — grade level they teach |
| hire_date | DATE | Optional |
| status | TEXT | Default: Active. Options: Active, Inactive |
| notes | TEXT | Optional |
| school_id | UUID | References auth.users(id) |

> RLS Policy: Users can only read/write their own school's staff.

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

- **Dashboard** — home screen with stats and quick actions
- **Enrollment** — `Enrollment.jsx`
- **Messages** — `Messages.jsx`
- **Students** — Coming soon
- **Reports** — Coming soon
- **Settings** — `Settings.jsx`

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
- Top orange nav bar with logo, user email, sign out button
- Left sidebar with nav items
- Stats cards: Total Students, Pending Enrollment, Messages Sent, Staff Members
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
- Editable form pre-populated with existing school data
- Fields: school name, principal name, phone, address, city, state, ZIP, website, school type, student capacity
- Account card showing admin email and active status
- Save button updates `schools` table and calls `onUpdate()` to refresh parent state
- Success/error feedback messages

---

## Modules To Build Next

| Module | Priority | Notes |
|---|---|---|
| Students Module | High | Full student profiles, search, filter by grade/status |
| Stripe Integration | High | Monthly subscription billing for schools |
| Reports Module | Medium | Enrollment trends, stats, charts |
| Custom Domain | Medium | Buy getlunchbox.com or lunchbox.app |
| Resend Domain Verification | Medium | Enable live email sending to parents |
| Staff Management | Low | Add/manage staff members |
| Billing Module | Low | Track tuition payments per student |

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