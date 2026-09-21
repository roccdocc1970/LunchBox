# LunchBox — Claude Code Project Briefing

## MCP Agent Data Convention

**When creating any data via MCP tools, always prefix user-visible text fields (names, titles, notes, descriptions) with the ⚡ icon.** This lets the user instantly identify agent-created records in the UI versus human-entered data. Apply this to: student names, staff names, inquiry names, work order titles, report card notes, incident descriptions — any field that appears in a list or detail view.

---

LunchBox is a **K-12 School Operations SaaS Platform** — enrollment, communication, reporting, billing, and staff management in one place. Target customer: small-to-mid size private and charter K-12 schools. Business model: per-school monthly SaaS subscription tiered by enrollment size.

> **ROADMAP.md** lives at `C:\Users\Daniel Rocco\Desktop\lunchbox\ROADMAP.md`.
> Read it when: (1) planning or scoping a new feature, (2) the user asks what's been built or what's next, (3) discussing the capability roadmap or build priorities, (4) referencing deferred work (custom roles, dark mode, config enforcement), or (5) checking pricing tiers. Do NOT load it for routine coding sessions — it's not needed to write or fix code.

> **Tailwind CSS refactor is complete.** All 22 `.jsx` files have been migrated. All static `style={{}}` have been replaced with Tailwind classes. Inline `style={{}}` is now used only for runtime-dynamic values (primaryColor, division colors, status/type color maps).

> **Lucide icon migration is complete.** All emoji icons have been replaced with Lucide React components across every page and domain file. The 🍱 LunchBox brand logo is intentionally preserved (no Lucide equivalent). Friendly inline text decorators (e.g. "Great attendance! 🎉") are also preserved.

> **"Ask LunchBox" AI chat is live (v1)** and is now the default post-login home screen. See the dedicated "AI Chat Backend" section below for the full architecture. ⚠️ **Known gap, must fix before a second school ever uses this**: multi-tenant data isolation for the chat feature has been designed for (every chat request is scoped through the calling user's own Supabase session, never the service-role key, so RLS enforces isolation) but has **never been tested with two different school accounts**. Do not roll this out to more than one school until that's been verified — see ROADMAP.md's Tier 1.5 for the exact test to run.

---

## Live URLs & Accounts

| Resource | URL |
|---|---|
| GitHub Repo | https://github.com/roccdocc1970/LunchBox |
| Supabase Project | https://supabase.com/dashboard/project/omroxjrlhqeovnskzyok |
| Vercel Dashboard | https://vercel.com |
| Resend Dashboard | https://resend.com |
| Anthropic Console (billing/keys for "Ask LunchBox") | https://console.anthropic.com |
| Local Dev | http://localhost:5173 (`npm run dev`) + http://localhost:3001 (`npm run dev:api`, required for the chat feature — see AI Chat Backend section) |

> **Login email for GitHub & Supabase:** `roccdocc1970@gmail.com`. GitHub username tied to the repo above is `roccdocc1970`. When signing into Supabase, use "Continue with GitHub" while signed into GitHub as `roccdocc1970` — signing into GitHub as a different account will make Supabase offer to create a new (wrong) account instead of recognizing the existing project.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | `npm create vite@latest` |
| Styling | Tailwind CSS | `@tailwindcss/vite` plugin — utility classes for all static styles; inline `style={{}}` only for runtime-dynamic values (brand color, division colors, status colors) |
| Database | Supabase (PostgreSQL) | Free tier |
| Auth | Supabase Auth | Email/password |
| Hosting | Vercel | Auto-deploys from GitHub on push |
| Email | Resend | Free tier, 3K emails/month |
| Service Layer | Pure JS modules (`src/services/`) | Dependency-injected Supabase client — shared by UI, MCP server, and the AI chat backend |
| MCP Server | Node.js stdio (`mcp_server/`) | `@modelcontextprotocol/sdk` + Zod — exposes 27 tools to AI agents (Claude Desktop, local dev only) |
| AI Chat Backend | Vercel serverless (`api/`) | `@anthropic-ai/sdk` — powers the in-app "Ask LunchBox" chat. See dedicated section below. |
| Animations | Framer Motion (`framer-motion`) | Page-level fade transitions via `AnimatePresence` + `motion.div` keyed by `activePage` in `App.jsx`. Duration: 100ms ease-out. |

---

## Environment Variables

Stored in `.env.local` (never committed). Also set in Vercel for production.

```
VITE_SUPABASE_URL=https://omroxjrlhqeovnskzyok.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yc2d1xNiGddeKcx5erg_iQ_pUE-HANS
VITE_RESEND_API_KEY=re_your_key_here
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # MCP server only — bypasses RLS
SCHOOL_ID=41beb9b7-ec0c-45f3-9a71-8f94cdd98078  # schools.user_id (NOT schools.id)
ANTHROPIC_API_KEY=sk-ant-...   # AI chat backend only (api/) — prepaid Anthropic Console credits, no auto-reload
```

> **Local dev note for the AI chat feature:** `api/**.js` are Vercel serverless functions — `vite dev` alone doesn't run them. `npm run dev:api` runs `dev-server.js`, a local Express shim that mounts the same handler files on `localhost:3001`; `vite.config.js` proxies `/api/*` to it. This file is dev-only — production deploys `api/**.js` directly as Vercel functions and never touches `dev-server.js`.

---

## Project File Structure

| File | Purpose |
|---|---|
| `src/App.jsx` | Main app — auth, routing, dashboard, nav. Detects admin vs staff on login. Getting Started checklist widget on dashboard. Live nav count badges. Default post-login page is `'chat'` (Ask LunchBox), not the dashboard. |
| `src/Chat.jsx` | "Ask LunchBox" — the AI chat home screen. Message list with inline `<GeneratedView>` (tables/stat rows/chip lists/mini-timelines) and `<ConfirmAction>` cards for proposed writes. See "AI Chat Backend" section. |
| `src/Landing.jsx` | Public marketing/landing page |
| `src/Onboarding.jsx` | First-time school setup flow |
| `src/Settings.jsx` | School settings — profile, academic config, bell schedule, campus (buildings + nested rooms), communication, appearance |
| `src/Students.jsx` | Student roster, profile drawer, health records, incidents, grade progression |
| `src/StudentTimeline.jsx` | "Student Evolution" timeline — per-year cards (grade, cohort, electives, milestones) spanning a student's full lifecycle. Rendered from both `StudentProfile.jsx` and `Alumni.jsx`'s drawer via the `useStudentTimeline` hook. Collapsed-year rows expand on click; cohort/class chips navigate to their detail page. |
| `src/Enrollment.jsx` | Enrollment module |
| `src/Admissions.jsx` | Admissions pipeline — inquiry tracking, convert to student, Copy Application Link. Pipeline stat cards use compact pill style. |
| `src/Attendance.jsx` | Daily attendance — take by grade or all grades, history, upsert per student/date |
| `src/ApplicationPortal.jsx` | Public-facing application form at `?apply=<school_uuid>` — no auth, feeds inquiries |
| `src/Parents.jsx` | Parent directory — linked students, edit contact, message |
| `src/Staff.jsx` | Staff directory, portal access / invite |
| `src/StaffDashboard.jsx` | Staff-facing app — role-filtered nav, students, report cards, incidents, facilities |
| `src/Alumni.jsx` | Alumni directory, donor status, giving history |
| `src/ReportCards.jsx` | Student report cards by term |
| `src/Fundraising.jsx` | Campaigns, donations, events, LYBUNT donor analysis |
| `src/Facilities.jsx` | Work order / ticket management |
| `src/Rooms.jsx` | Room/classroom management — still exists as standalone page but no longer in nav; managed via Settings → Campus tab |
| `src/Cohorts.jsx` | Cohort management — card grid + full-screen detail, Members tab (two-panel pill UI), Classes tab (assign classes, auto-enroll all members on assignment) |
| `src/Classes.jsx` | Class CRUD — card grid, subject/division/teacher/room assignment, class size cap, two-panel Class Enrollment (individual students + cohort assignment) |
| `src/Scheduling.jsx` | Visual schedule — timetable grid, building browser, drag-and-drop, auto-scheduler, inline teacher/room pickers with conflict pre-check, ↗ jump-to-class |
| `src/Reports.jsx` | 7-tab reports — Enrollment, Attendance, Incidents, Communications, Staff, Fundraising, Facilities |
| `src/Messages.jsx` | Parent communication module |
| `src/supabase.js` | Supabase client initialization |
| `src/index.css` | Tailwind import |
| `src/main.jsx` | React entry point |
| `vite.config.js` | Vite + Tailwind config |

### Service Layer (`src/services/`)

All Supabase business logic extracted from components. Every function takes `supabase` as first argument — anon client from UI, service-role client from MCP server.

| File | Exports |
|---|---|
| `enrollment.js` | `getAcademicYear`, `getStudents`, `searchParents`, `enrollStudent`, `updateStudentStatus` |
| `attendance.js` | `getStudentsWithAttendance`, `saveAttendance`, `getAttendanceHistory` (optional `studentId` filter, uncapped when scoped to one student) |
| `students.js` | `getStudents`, `updateStudent`, `deleteStudent`, `graduateStudentToAlumni` (status update + `student_alumni_details` upsert — no table move), `getGradeHistory`, `getReportCardCount`, `getStudentHealth`, `saveHealthProfile`, `addHealthEntry`, `updateHealthEntry`, `deleteHealthEntry`, `deleteHealthProfile`, `getIncidents`, `getSchoolIncidents`, `getStudentsWithParents`, `logIncident`, `updateIncident`, `resolveIncident`, `searchStaff` |
| `admissions.js` | `getInquiries`, `createInquiry`, `updateInquiry`, `convertInquiryToStudent` — all operate on `students` rows filtered/updated by status; maps to/from the flat inquiry-shaped fields the UI expects |
| `alumni.js` | `getAlumni`, `updateAlumnus`, `deleteAlumnus`, `reenrollAsStudent`, `getAlumnusGivingHistory` — `students` rows filtered to `status='Alumni'`, joined with `student_alumni_details` and flattened |
| `reportCards.js` | `getReportCards`, `getReportCardsForStudent`, `getEnrolledStudents`, `createReportCard`, `setReportCardPublished`, `updateReportCard`, `deleteReportCard` |
| `staff.js` | `getStaff`, `createStaffMember`, `updateStaffMember`, `deleteStaffMember` |
| `facilities.js` | `getWorkOrders`, `getFacilitiesStaff`, `createWorkOrder`, `updateWorkOrder`, `updateWorkOrderStatus` |
| `rooms.js` | `getRooms`, `saveRoom`, `deleteRoom` |
| `buildings.js` | `getBuildings`, `saveBuilding`, `deleteBuilding` |
| `schedule.js` | `getPeriods`, `savePeriod`, `deletePeriod` |
| `classes.js` | `getClasses`, `saveClass`, `deleteClass` |
| `classSections.js` | `getSections`, `saveSection`, `deleteSection`, `batchSaveSections`, `clearSections` |
| `classEnrollments.js` | `getEnrollments`, `getClassEnrollmentsForStudent`, `enrollStudent` (stamps `academic_year`), `unenrollStudent` |
| `cohorts.js` | `getCohorts`, `saveCohort`, `deleteCohort`, `getCohortStudents`, `getCohortsForStudent`, `getAllCohortStudents`, `addCohortStudent`, `removeCohortStudent`, `getCohortClasses`, `getAllCohortClasses`, `addCohortClass`, `removeCohortClass`, `bulkEnrollCohort` |
| `fundraising.js` | `getFundraisingData`, `createCampaign`, `updateCampaign`, `deleteCampaign`, `searchDonors`, `getDonationsForFamily`, `createDonation`, `toggleReceipt`, `createEvent` |
| `timeline.js` | `getStudentTimelineData` — fetches every source the student evolution timeline needs (grade history, cohorts, classes, report cards, incidents, health, attendance, donations) in parallel; aggregation happens in `domain/timeline.js` |
| `chat.js` | `sendChatMessage`, `executeConfirmedAction` — thin client for `/api/chat` and `/api/chat/execute`; forwards the current Supabase session's access token as a Bearer header |
| `navCounts.js` | `getNavCounts` — batch COUNT queries for all nav sections, returns counts keyed by page id |

### MCP Server (`mcp_server/`)

| File | Purpose |
|---|---|
| `supabase_admin.js` | Reads `.env.local` manually (no dotenv — stdout must stay clean for stdio protocol). Creates service-role Supabase client. Exports `supabaseAdmin` + `schoolId`. |
| `server.js` | stdio MCP server — 27 tools registered with Zod schemas covering all 7 service domains. Run via `npm run mcp`. |

**Run MCP server:** `npm run mcp`
**Connect to Claude Desktop:** `%APPDATA%\Claude\claude_desktop_config.json` already configured.
**SCHOOL_ID note:** Use `schools.user_id` (not `schools.id`) — all `school_id` FK columns reference `auth.users`.

### AI Chat Backend (`api/`)

Powers "Ask LunchBox", the in-app chat home screen. Deployed as Vercel serverless functions (zero-config `/api/**.js` convention — no `vercel.json` needed), **not** a standalone server. Locally, `dev-server.js` + `npm run dev:api` mounts the same handler files under Express so they're testable without the Vercel CLI (see Environment Variables section).

| File | Purpose |
|---|---|
| `api/_lib/supabaseFromRequest.js` | Builds a per-request Supabase client from the caller's own JWT (anon key, never service-role) — the entire multi-tenant safety mechanism. Every query the model triggers is RLS-scoped exactly like the browser UI. |
| `api/_lib/getSchoolContext.js` | Resolves `schoolId` **and the caller's `role`** from the authenticated user (admin via `schools.user_id`, else linked `staff.school_id`/`staff.role`) — mirrors `useSchool.js`'s `fetchSchool()` logic. The `role` is threaded into every tool call as `ctx` so tools can replicate app-level role gating that RLS alone doesn't enforce (see `get_student_health` below). |
| `api/_lib/tools.js` | Tool definitions wrapping `src/services/*` functions, split into `READ_TOOLS` (auto-executed), `WRITE_TOOLS` (confirm-gated — see below), and `NAVIGATE_TOOLS` (deep-link only, no `run()`). **Read coverage is intentionally broad — every major domain is queryable** (students, incidents, attendance, grades, health, report cards, alumni, admissions, classes, cohorts, work orders, staff, rooms, buildings, messages, parents, fundraising, school settings). **Settings is read-only in chat by design** — `get_school_settings` exists, but there is no matching write tool; any request to change configuration (grading scale, subjects, divisions, grades offered, branding, bell schedule, buildings/rooms) is routed via `navigate_to_page("settings")` instead. Settings changes are rare, foundational, and can quietly break unrelated logic if malformed (e.g. `grades_offered` already determines the alumni re-enrollment eligibility rule) — a stronger case for deep-link-only than even scheduling. Includes `get_student_evolution` (the richest tool — full lifecycle via `services/timeline.js`), `get_classes`/`get_cohorts` (for resolving a name to an id before navigating), and `RENDER_VIEW_TOOL` (the model's final-answer tool — see Generative Views below). **`get_student_health` is the one tool with role-gating logic of its own** — RLS grants all staff full DB access to health records, but the tool replicates `domain/staffDashboard.js`'s `canViewFullHealth`/`canViewLimitedHealth` tiers (full for Principal/Admin/Counselor, emergency-contact-and-allergies-only for Teacher/Asst/Sub, none for Support Staff/Facilities/Maintenance) so chat can't see more than the app itself ever shows that role. |
| `api/chat/index.js` | The tool-calling loop (max 8 turns). Read tool calls execute and the loop continues; a call to `render_view`, any `WRITE_TOOLS` entry, or any `NAVIGATE_TOOLS` entry immediately stops the loop and returns a structured response instead of continuing the conversation. System prompt + tool definitions are marked `cache_control: ephemeral` for prompt caching. |
| `api/chat/execute.js` | The **only** place a chat-originated write actually happens — called after the human clicks Confirm on a `ConfirmAction` card. `index.js` only ever proposes; this file executes. |

**Generative views (reads only, never writes):** the model never writes UI code. Its final answer is a small JSON view-spec (`{ template, data }`) that `src/views/GeneratedView.jsx` dispatches to one of four fixed, pre-built templates — `Table`, `StatRow`, `ChipList`, `MiniTimeline` (in `src/views/`) — matching this codebase's existing stat-pill and chip conventions exactly. `src/domain/icons.js`/`colors.js` provide safe-fallback name→component and value→color resolution for fields the model fills in.

**The guiding safety rule:** reads get freely-generated views; writes never do. A write tool call always produces a `ConfirmAction` card (the one and only write-facing template) and executes only on explicit human confirmation. Anything scheduling-related, multi-record, or capacity-sensitive (cohort assignment, class enrollment, schedule changes) isn't a write tool at all — the model can only respond with a navigation directive that deep-links into the real, already-guardrailed screen (reusing the `openClassId`/`navigateToClass` pattern in `App.jsx`), never attempt the change itself.

**Voice (`src/hooks/useVoice.js`):** browser-native only — no API key, no backend involvement, zero added token cost. Voice input transcribes to plain text client-side before it ever reaches `/api/chat`; voice output just reads the existing reply text aloud. Both are feature-detected, so unsupported browsers simply don't show the corresponding button rather than showing a dead control.

> **Browser support caveat (checked 2026-09-20 — re-verify if this matters months later, support shifts over time):** Voice **input** (`SpeechRecognition`/`webkitSpeechRecognition`) works well in Chrome and Edge, but Firefox does not support it and Safari's support is inconsistent/partial — on those browsers the mic button is hidden entirely (feature-detected), not broken. Voice **output** (`SpeechSynthesis`) has much broader support across all major browsers and is safe to rely on. Net effect: staff on Chromebooks or Chrome/Edge get full voice in-and-out; staff on Safari/Firefox get voice output but fall back to typing for input.

---

## Database Schema

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

**One permanent record per child, spanning the entire lifecycle — inquiry through alumni.** There is no separate `inquiries` or `alumni` table; a "New Inquiry" and a graduated alum are the same row with a different `status`. The row's `id` never changes, so `cohort_students`, `class_enrollments`, `incidents`, `report_cards`, `attendance`, and `student_grade_history` all stay attached across the student's whole history — graduating (or re-enrolling) is a plain `UPDATE students SET status = ...`, never an insert-then-delete.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto — permanent for the student's whole lifecycle |
| school_id | UUID | References auth.users(id) |
| first_name / last_name | TEXT | Required |
| grade | TEXT | e.g. "3rd Grade" |
| date_of_birth | DATE | Optional |
| parent_id | UUID | References parents(id) — set at inquiry time, before conversion |
| status | TEXT | New Inquiry, Toured, Applied, Enrolled, Waitlisted, Withdrawn, Alumni — one linear progression (see `getLifecycleStage()` in `domain/students.js` for the four broad buckets) |
| source | TEXT | Web, Tour, Referral, Word of Mouth, Social Media, Other — set at inquiry time |
| inquiry_date / tour_date | DATE | Optional, admissions-stage only |
| notes | TEXT | Optional |

> RLS: admin (`school_id = auth.uid()`) full access. Staff read via `get_staff_school_id()`, with an additional **restrictive** policy hiding `status = 'Alumni'` rows from staff (admin-only visibility, matching pre-refactor behavior).
> Query with parent join: `select('*, parents(id, first_name, last_name, email, phone, address)')`
> Public applicants never get direct table access — `ApplicationPortal.jsx` calls the `submit_public_inquiry` Postgres function (`SECURITY DEFINER`), which upserts the parent and inserts the student row server-side. `anon` only has `EXECUTE` on that function, not table grants.

### Table: `student_alumni_details`

1:1 with `students` (same pattern as `student_health`) — only populated once a student's `status` becomes `Alumni`. Holds fields that don't belong on the core roster row.

| Column | Type | Notes |
|---|---|---|
| student_id | UUID | PK, References students(id) ON DELETE CASCADE |
| school_id | UUID | References auth.users(id) |
| graduation_year | INTEGER | |
| grade_completed | TEXT | |
| donor_status | TEXT | Never, Prospect, Active Donor, Lapsed |
| relationship | TEXT | None, Donor, Volunteer, Mentor, Ambassador |
| opt_in | BOOLEAN | Default true |
| preferred_contact | TEXT | Email, Phone, Mail |
| last_contacted_date | DATE | |
| employer / college | TEXT | |
| email / phone / address / city / state / zip | TEXT | The alumnus's own adult contact info — distinct from `parents`, since a grown alum isn't reached through their childhood parent record |
| notes | TEXT | Optional |

> RLS: admin only (`school_id = auth.uid()`) — no staff policy, matching `students`' alumni-hiding restrictive policy above.
> `services/alumni.js` flattens this table's columns onto the `students` row it joins from (`getAlumni`), so UI code reads/writes them as if they were flat alumnus fields.
> `donations.donor_type = 'Alumni'` → `donor_id` references `students.id` (not a separate alumni id).

### Table: `student_grade_history`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| student_id | UUID | |
| grade | TEXT | Grade at time of record |
| academic_year | TEXT | e.g. "2025-2026" |
| recorded_at | TIMESTAMPTZ | Auto |
| is_repeat | BOOLEAN | Student repeated the grade |
| is_skip | BOOLEAN | Student skipped a grade |

> Written on enroll, grade change, and convert-inquiry-to-student. Drives grade history timeline in student drawer.

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

### Table: `incidents`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK auto |
| school_id | UUID | References auth.users(id) |
| student_id | UUID | |
| student_name | TEXT | Denormalized at log time |
| date | DATE | Incident date |
| type | TEXT | Behavioral, Academic, Medical, Safety, Other |
| description | TEXT | Required |
| resolution | TEXT | Action taken / resolution notes |
| reported_by | TEXT | Staff name (denormalized) |
| status | TEXT | Open, Resolved |

> **No `severity`, `action_taken`, or `student_grade` columns.** `resolution` = action taken. RLS: Admin + staff read/insert/update via get_staff_school_id().

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

> **SCHOOL_ID = `schools.user_id`** (not `schools.id`). All FK columns in other tables reference `auth.users(id)` which equals the admin's `auth.uid()`.

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
| donor_id | UUID | Nullable for external donors. For `Alumni`, references `students.id` (status='Alumni'); for `Parent`, references `parents.id` |
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

### Table: `rooms`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required |
| type | TEXT | Classroom, Lab, Gymnasium, Auditorium, Library, Art Room, Music Room, Office, Storage, Other |
| building_id | UUID | References buildings(id) ON DELETE RESTRICT — required, every room must belong to a building |
| building / floor | TEXT | Denormalized from building record at save time |
| capacity | INTEGER | Max students |
| divisions | JSONB | Array of division name strings |
| notes | TEXT | Optional |

> RLS: Admin full access (school_id = auth.uid()). Managed via Settings → Campus tab (nested inside building cards). `building_id` FK enforces referential integrity — cannot delete a building that has rooms.

### Table: `buildings`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required |
| type | TEXT | Academic, Administrative, Athletic, Arts, Science, Support, Residential, Other |
| floors | JSONB | Ordered array of floor name strings |
| notes | TEXT | Optional |

> Configured in Settings → Campus tab. Buildings contain rooms — expand a building card to see/add/edit its rooms. Cannot delete a building that has rooms (RESTRICT constraint). RLS: Admin full access.

### Table: `cohorts`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required — e.g. "Class of 2028", "Blue Track" |
| division | TEXT | Optional, from school.divisions |
| academic_year | TEXT | e.g. "2025-2026" |
| description | TEXT | Optional |
| status | TEXT | Active, Archived |

> RLS: Admin full access (school_id = auth.uid()).

### Table: `cohort_students`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| cohort_id | UUID | References cohorts(id) ON DELETE CASCADE |
| student_id | UUID | References students(id) ON DELETE CASCADE |

> UNIQUE on (cohort_id, student_id). RLS: Admin full access.

### Table: `cohort_classes`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| cohort_id | UUID | References cohorts(id) ON DELETE CASCADE |
| class_id | UUID | References classes(id) ON DELETE CASCADE |
| auto_enroll | BOOLEAN | Default true — when true, all cohort members are bulk-enrolled into this class on assignment |

> UNIQUE on (cohort_id, class_id). `auto_enroll = true` triggers `bulkEnrollCohort` on assignment; removing the link unenrolls cohort members from `class_enrollments`. RLS: Admin full access.

### Table: `periods`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required — e.g. "Period 1", "Lunch" |
| type | TEXT | Class, Break, Lunch, Assembly, Advisory, Study Hall, Other |
| start_time / end_time | TIME | Required |
| days_of_week | TEXT | e.g. "Mon–Fri", "Mon/Wed/Fri" |
| sort_order | INTEGER | Display order |

> Configured in Settings → Bell Schedule tab. Referenced by `class_sections` to assign classes to time slots. RLS: Admin full access.

### Table: `classes`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| name | TEXT | Required — e.g. "3rd Grade Math" |
| subject | TEXT | From school's subjects_offered config |
| division | TEXT | From school's divisions config |
| teacher_id | UUID | References staff(id) ON DELETE SET NULL |
| teacher_name | TEXT | Denormalized at save time |
| room_id | UUID | References rooms(id) ON DELETE SET NULL |
| room_name | TEXT | Denormalized at save time |
| class_size | INTEGER | Manual capacity cap — max enrolled students. Drives conflict badges and auto-scheduler capacity check. |
| description / notes | TEXT | Optional |
| status | TEXT | Active, Inactive |

> RLS: Admin full access (school_id = auth.uid()). Linked to periods via `class_sections` table (Schedule module). Enrollment managed via `class_enrollments` table.

### Table: `class_sections`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| class_id | UUID | References classes(id) ON DELETE CASCADE |
| period_id | UUID | References periods(id) ON DELETE CASCADE |
| term | TEXT | Q1–Q4, T1–T3, S1–S2, or Annual — derived from school.grading_period |
| academic_year | TEXT | e.g. "2025-2026" |

> UNIQUE on (school_id, class_id, term, academic_year) — one period per class per term. RLS: Admin full access (school_id = auth.uid()). Auto-scheduler uses greedy constraint solver: most-constrained classes (teacher + room both set) placed first; blocks teacher and room double-booking.

### Table: `class_enrollments`

| Column | Type | Notes |
|---|---|---|
| id / school_id | UUID | |
| class_id | UUID | References classes(id) ON DELETE CASCADE |
| student_id | UUID | References students(id) ON DELETE CASCADE |
| academic_year | TEXT | e.g. "2025-2026" — stamped at enroll time via `getAcademicYear()`. Named per-year (e.g. "Robotics (2025-2026)") when the same elective recurs, since the UNIQUE constraint below doesn't include this column |
| created_at | TIMESTAMPTZ | Auto |

> UNIQUE on (school_id, class_id, student_id). Enrollment hard-blocked when count ≥ class_size. RLS: Admin full access (school_id = auth.uid()).

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

Groups are collapsible (default expanded). Settings/Wizard live in ⚙️ top-nav gear dropdown. Each nav item shows a live count badge (record count from `navCounts` service, refreshed on every dashboard navigation).

- **Dashboard** — standalone. Getting Started checklist widget (7 steps, dismissable, re-openable, turns green when all done).
- **Academics** (`academics`): Admissions, School Enrollment, Students, Classes, Cohorts, Schedule, Attendance, Report Cards
- **People** (`people`): Staff, Parent Directory, Alumni
- **Operations** (`operations`): Fundraising, Facility Requests (label matches `Facilities.jsx` page header)
- **Communicate** (`communicate`): Messages, Reports

> Nav order reflects the logical data-entry sequence. Rooms is no longer in the nav — managed via Settings → Campus tab.

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

## Icon System

All icons use **lucide-react**. Never use emoji as UI icons. The 🍱 brand logo is the only permitted emoji in the UI.

### Icon import pattern
```jsx
import { Users, BookOpen, AlertTriangle } from 'lucide-react'
```

### Icon name → purpose mapping (used across the app)
| Icon | Used for |
|---|---|
| `LayoutDashboard` | Dashboard nav + page header |
| `ClipboardList` | Admissions nav + header |
| `UserPlus` | Enrollment nav + header |
| `Users` | Students nav + header; people counts |
| `BookOpen` | Classes nav + header |
| `UsersRound` | Cohorts nav + header |
| `CalendarDays` | Schedule nav + header |
| `ClipboardCheck` | Attendance nav + header |
| `FileText` | Report Cards nav + header |
| `Briefcase` | Staff nav + header |
| `Heart` | Parent Directory nav + header |
| `Award` | Alumni nav + header |
| `HeartHandshake` | Fundraising nav + header |
| `Wrench` | Facility Requests nav + header; WO category |
| `MessageSquare` | Messages nav + header |
| `BarChart3` | Report Dashboards nav + header |
| `Lock` | Grade-locked nudge banners |
| `AlertTriangle` | Warnings, errors, orphaned grades |
| `Check` / `X` | Success/dismiss actions, published status |
| `Backpack` | Student empty states |
| `GraduationCap` | Alumni empty states; Graduate to Alumni button; teacher display |
| `DoorOpen` | Room display |
| `Building2` | Buildings empty state / header |
| `Bell` | Bell Schedule empty state |
| `Sparkles` | Auto-schedule, Setup Wizard button |

### CATEGORY_ICONS pattern (Facilities & StaffDashboard)
Domain files store Lucide icon **name strings** (e.g. `'Wrench'`). Components maintain a local lookup map and render the component:
```js
// domain/facilities.js
export const CATEGORY_ICONS = { Plumbing: 'Droplets', Electrical: 'Zap', ... }

// Facilities.jsx
const CAT_ICON_COMPONENTS = { Droplets, Zap, ... }
function CatIcon({ category }) {
  const Icon = CAT_ICON_COMPONENTS[CATEGORY_ICONS[category]] || Wrench
  return <Icon size={14} />
}
```

---

## Page Header Convention

**Every landing page header must follow this pattern** — nav icon in `primaryColor` + page title on the same line:

```jsx
<h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5">
  <BookOpen size={22} style={{ color: primaryColor }} />Classes
</h2>
```

Use the **same icon** that appears in the left nav for that page (defined in `domain/app.js`). Always import the icon in the component file before using it.

---

## Stat Card Convention

**All summary stat cards across the app use the compact pill style:**

```jsx
<div className="flex gap-4 mb-6 flex-wrap">
  <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
    <span className="font-semibold text-gray-800">{value}</span>
    <span className="text-gray-500 text-sm">{label}</span>
  </div>
</div>
```

- Use `flex` + `flex-wrap`, not `grid`
- `rounded-xl px-5 py-3 shadow-sm`
- Colored dot (`w-2.5 h-2.5 rounded-full`) using the stat's accent color
- No large icons, no `border-t-4`, no tall card layout
- Stat cards go **above** search/filter bars on every page

---

## Styling Standards

**All new code must use Tailwind utility classes for static styles. Inline `style={{}}` is reserved exclusively for runtime-dynamic values.**

### The Rule
```jsx
// ✅ Correct — Tailwind for static styles, inline only for dynamic
<button
  className="text-white rounded-lg px-5 py-2 font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
  style={{ background: primaryColor }}
>
  Save
</button>

// ❌ Wrong — inline styles for static values
<button style={{ background: primaryColor, color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
  Save
</button>
```

### What stays inline (runtime-dynamic only)
- `school.primary_color` — brand color, varies per school
- Division colors — computed from `DIVISION_COLORS[index]`
- Status/type colors — looked up from color maps (e.g. `ROOM_TYPE_COLORS[room.type]`)
- Any color, size, or value computed from data at render time

### What moves to Tailwind (everything else)
- All spacing: padding, margin, gap → `p-4`, `px-5`, `py-2`, `gap-3`, `mb-4`, etc.
- All typography: font size, weight, color → `text-sm`, `font-semibold`, `text-gray-800`
- All borders: radius, color, width → `rounded-lg`, `border`, `border-gray-200`
- All layout: flex, grid, display → `flex`, `items-center`, `grid`, `grid-cols-2`
- All backgrounds (static): `bg-white`, `bg-gray-50`, `bg-red-50`
- All shadows: `shadow-sm`, `shadow-md`
- Hover/focus states: `hover:bg-gray-50`, `focus:outline-none`
- Transitions: `transition-all`, `transition-colors`

### Existing code
Existing modules use inline styles and are **not** being mass-migrated. Migrate a module to Tailwind only when doing a significant rewrite of that module. Do not mix Tailwind and inline styles in the same element — pick one per element.

### Common Tailwind equivalents for this codebase
| Inline style | Tailwind class |
|---|---|
| `fontSize: '0.875rem'` | `text-sm` |
| `fontSize: '0.75rem'` | `text-xs` |
| `fontSize: '1rem'` | `text-base` |
| `fontSize: '1.125rem'` | `text-lg` |
| `fontWeight: '600'` | `font-semibold` |
| `fontWeight: '700'` | `font-bold` |
| `color: '#1f2937'` | `text-gray-800` |
| `color: '#6b7280'` | `text-gray-500` |
| `color: '#9ca3af'` | `text-gray-400` |
| `color: '#374151'` | `text-gray-700` |
| `background: 'white'` | `bg-white` |
| `background: '#f9fafb'` | `bg-gray-50` |
| `background: '#f3f4f6'` | `bg-gray-100` |
| `borderRadius: '0.375rem'` | `rounded-md` |
| `borderRadius: '0.5rem'` | `rounded-lg` |
| `borderRadius: '0.75rem'` | `rounded-xl` |
| `borderRadius: '1rem'` | `rounded-2xl` |
| `borderRadius: '9999px'` | `rounded-full` |
| `padding: '0.5rem 1rem'` | `px-4 py-2` |
| `padding: '0.625rem 1.25rem'` | `px-5 py-2.5` |
| `boxShadow: '0 1px 4px rgba(0,0,0,0.08)'` | `shadow-sm` |
| `display: 'flex', alignItems: 'center'` | `flex items-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `gap: '0.5rem'` | `gap-2` |
| `gap: '0.75rem'` | `gap-3` |
| `gap: '1rem'` | `gap-4` |
| `cursor: 'pointer'` | `cursor-pointer` |
| `border: 'none'` | `border-0` |

---

## Feature-Sliced Design Architecture

**All new features must follow this pattern. Existing modules are being refactored to match — see ROADMAP.md for the refactor queue.**

### The Rule in One Sentence
Every `.jsx` file should only render HTML. All logic belongs in a dedicated layer below it.

### Folder Structure

```
src/
  domain/          ← Pure business logic. No React. No Supabase. Just functions.
    messages.js
    facilities.js
    students.js
    ...
  hooks/           ← Custom React hooks. UI behavior only. No DB calls.
    useMessages.js
    useFacilities.js
    ...
  services/        ← Supabase calls ONLY. Already exists. Do not move or restructure.
    enrollment.js
    students.js
    ...
  Messages.jsx     ← Thin shell. Imports from hooks + domain. Only renders JSX.
  Facilities.jsx   ← Thin shell. Imports from hooks + domain. Only renders JSX.
  ...
```

### What Goes in Each Layer

| Layer | Folder | Job | Allowed to use |
|---|---|---|---|
| **Component** | `src/*.jsx` | Render HTML only | hooks, domain constants |
| **Hook** | `src/hooks/` | UI state + behavior | React useState/useEffect, domain, services |
| **Domain** | `src/domain/` | Business rules + validation | Plain JS only — no React, no Supabase |
| **Service** | `src/services/` | Database calls | Supabase client only |

### Layer Rules — What NOT to Do

**Component (`*.jsx`):**
- ❌ No `supabase.from(...)` calls — use a service via a hook
- ❌ No complex validation logic — put it in domain
- ❌ No business calculations — put them in domain
- ✅ Only state that controls what's *visible* (drawer open, tab selected, loading spinner)

**Hook (`hooks/use*.js`):**
- ❌ No JSX/HTML
- ❌ No direct Supabase calls — call service functions
- ✅ `useState`, `useEffect`, `useCallback` are fine here
- ✅ Coordinates between domain (validate) → service (save) → state (update UI)

**Domain (`domain/*.js`):**
- ❌ No React imports
- ❌ No Supabase imports
- ❌ No side effects
- ✅ Pure functions: input → output, always the same result for the same input
- ✅ Examples: `validateWorkOrder(form)`, `isOverdue(dueDate)`, `calcNetRevenue(event)`, `formatMessageDate(dateStr)`

**Service (`services/*.js`):**
- ✅ Already correct — keep as-is
- ✅ Only change: ensure all functions accept `supabase` as first argument (DI pattern)
- ❌ Do not add validation or business logic here — that belongs in domain

### Example: What a Refactored Module Looks Like

**Before (everything mixed together):**
```jsx
// Facilities.jsx — 423 lines of mixed concerns
export default function Facilities({ user, school }) {
  // UI state, business logic, DB calls all in one place
  const isOverdue = (wo) => wo.due_date && wo.due_date < today() && wo.status !== 'Completed'
  const completedThisMonth = workOrders.filter(w => ...)
  const { data } = await supabase.from('work_orders').select(...)
}
```

**After (each layer has one job):**
```js
// domain/facilities.js — pure logic, no React, no Supabase
export const isOverdue = (wo) => wo.due_date && wo.due_date < today() && wo.status !== 'Completed'
export const calcStats = (workOrders) => ({ open: ..., urgent: ..., completedThisMonth: ... })
export const validateWorkOrder = (form) => { if (!form.title) throw new Error('Title required') }
```
```js
// hooks/useFacilities.js — UI behavior, coordinates domain + service
export function useFacilities(userId) {
  const [workOrders, setWorkOrders] = useState([])
  const load = async () => setWorkOrders(await getWorkOrders(supabase, userId))
  const submit = async (form) => { validateWorkOrder(form); await createWorkOrder(supabase, userId, form); load() }
  return { workOrders, stats: calcStats(workOrders), submit, ... }
}
```
```jsx
// Facilities.jsx — thin shell, just renders
export default function Facilities({ user, school }) {
  const { workOrders, stats, submit } = useFacilities(user.id)
  return <div>... render only ...</div>
}
```

### Naming Conventions
- Domain files: `src/domain/<feature>.js` (e.g. `facilities.js`, `students.js`)
- Hook files: `src/hooks/use<Feature>.js` (e.g. `useFacilities.js`, `useStudents.js`)
- One domain file + one hook file per module
- Domain functions are named as verbs: `validateWorkOrder`, `calcStats`, `isOverdue`, `formatDate`

---

## Service Layer Architecture

All Supabase database calls live in `src/services/` as pure JS functions. **No Supabase calls in JSX files or domain files.**

**Dependency injection pattern:**
```js
// UI (anon client — RLS enforced)
import { supabase } from './supabase'
const students = await getStudents(supabase, schoolId)

// MCP server (service-role client — RLS bypassed)
import { supabaseAdmin, schoolId } from './mcp_server/supabase_admin.js'
const students = await getStudents(supabaseAdmin, schoolId)
```

Same service function. Different client. No code duplication.

**Key rules:**
- `getAcademicYear()` lives in `services/enrollment.js` (computes "now") — import from there, never redefine. `academicYearForDate(dateStr)` lives in `domain/enrollment.js` (buckets an arbitrary past date, e.g. `incidents.date`) — a separate pure function, not a duplicate
- `nullify(obj)` in `students.js` — converts empty strings to null before Supabase inserts
- Cross-imports between services use explicit `.js` extension (Node ESM requirement)
- `.env.local` is parsed manually in `supabase_admin.js` — dotenv prints to stdout which breaks the MCP stdio protocol

---

## MCP Server / AI Agent Integration

**27 tools** registered across 7 domains. Runs as a Node.js stdio server.

| Domain | Tools |
|---|---|
| Enrollment | `get_students`, `search_parents`, `enroll_student`, `update_student_status` |
| Attendance | `get_attendance`, `save_attendance`, `get_attendance_history` |
| Students | `get_students_full`, `delete_student`, `graduate_student_to_alumni`, `get_grade_history` |
| Incidents | `get_incidents`, `log_incident`, `resolve_incident` |
| Admissions | `get_inquiries`, `create_inquiry`, `convert_inquiry_to_student` |
| Report Cards | `get_report_cards`, `create_report_card`, `set_report_card_published`, `delete_report_card` |
| Staff | `get_staff`, `create_staff_member`, `delete_staff_member` |
| Facilities | `get_work_orders`, `create_work_order`, `update_work_order_status` |

**Next steps for agent integration:**
- Phase 2: HTTP API wrapper (`mcp_server/api.js`) for web-embedded agents in the React UI
- Phase 3: Domain-scoped agents (one per module, scoped tool subset + system prompt)
- Phase 4: RAG/Policy module — pgvector on Supabase, policy document upload + semantic search

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
npm run dev:api      # second terminal — required for the "Ask LunchBox" chat feature (localhost:3001)
npm run mcp          # run MCP stdio server (connects to Claude Desktop)
git add .
git commit -m "..."
git push             # Vercel auto-deploys in ~60 seconds — api/**.js deploys as serverless functions automatically
```

Always open Claude Code from `C:\Users\Daniel Rocco\Desktop\lunchbox`.
