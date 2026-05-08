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

### Rooms Module (`Rooms.jsx`)
Card grid of classrooms and spaces. Type filter, search, division assignment (pill toggles), capacity tracking. Stat bar: total rooms, capacity, by-type breakdown. Building and floor dropdowns reference the Buildings config. `rooms` table: type, building, floor, capacity, divisions (JSONB), notes.

### Buildings Module (`Settings.jsx` → Campus tab)
Physical campus configuration in Settings → Campus tab. Buildings have name, type (Academic, Administrative, Athletic, Arts, Science, Support, Residential, Other), and an ordered floor list (add/remove/reorder with ↑↓). Floor and building data feeds Rooms dropdowns. `buildings` table: name, type, floors (JSONB), notes.

### Bell Schedule (`Settings.jsx` → Bell Schedule tab)
Define school day periods in Settings → Bell Schedule tab. Each period has name, type (Class, Break, Lunch, Assembly, Advisory, Study Hall, Other), start/end time, and days of week. Color-coded by type. `periods` table: name, type, start_time, end_time, days_of_week, sort_order.

### Classes Module (`Classes.jsx`)
CRUD for school classes. Card grid with division color bar, subject + division chips, teacher and room shown inline. Dropdowns pull from live subjects (school config), divisions, active staff, and rooms. Teacher name and room name denormalized at save time. Filters: search (name/teacher/subject), division, status. Default filter: Active. `classes` table: name, subject, division, teacher_id + teacher_name, room_id + room_name, description, notes, status.

### Reports Module (`Reports.jsx`)
6 tabs: Enrollment · Student Incidents · Communications · Staff · Fundraising · Facilities. Each tab has stat cards, bar charts, and data tables. Facilities tab includes cost summary, assignee workload, overdue list.

### Health Records (`Students.jsx` + `StaffDashboard.jsx`)
Two tables: `student_health` (one profile per student) + `student_health_entries` (many facts). Admin can add/edit/delete from student profile drawer. Categories: Allergy, Medication, Immunization, Condition, Injury, Other. Expiration date flagging. Role-gated in StaffDashboard.

### Attendance Module (`Attendance.jsx`)
Two tabs: Take Attendance (date + grade picker, per-student Present/Absent/Tardy/Excused buttons, notes, upsert on save) and History (filterable by date/grade/status). "All Grades" option loads entire school at once with grade label per student. Staff Portal: teachers and principals have Attendance in nav; single-grade teachers get their grade pre-selected. Reports tab: present rate, 6-month absence trend, status breakdown, chronic absentees table (>10% non-present, min 5 days). New `attendance` table with unique constraint on (school_id, student_id, date).

### Application Portal (`ApplicationPortal.jsx`)
Public-facing admissions form at `?apply=<school_uuid>`. Pulls school branding (name, logo, color). Fields: parent name/contact, student name, grade applying for, source, notes. Honeypot field for bot rejection. Validates required fields + at least one contact method. Inserts into `inquiries` as New Inquiry via anon Supabase policy. Branded success screen. Invalid ID shows graceful not-found page. Admissions module has "🔗 Copy Application Link" button that generates the shareable URL.

### Service Layer (`src/services/`)
All Supabase business logic extracted from React components into pure JS modules. 7 service files covering all domains. Dependency-injected Supabase client — same functions used by both UI (anon client, RLS enforced) and MCP server (service-role client, RLS bypassed). No code duplication. `getAcademicYear()` defined once in `enrollment.js`, imported everywhere. Cross-service imports use explicit `.js` extensions (Node ESM requirement).

### MCP Server (`mcp_server/`)
Local stdio MCP server built with `@modelcontextprotocol/sdk`. 27 tools registered with Zod schemas across 7 domains: Enrollment, Attendance, Students, Incidents, Admissions, Report Cards, Staff, Facilities. Connected to Claude Desktop via `claude_desktop_config.json`. Service-role Supabase client bypasses RLS for admin-level agent operations. `.env.local` parsed manually (dotenv prints to stdout, breaking the MCP stdio protocol). All 27 tools verified against live Emerson School data.

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
| Attendance Tracking | ✅ Daily + all-grades attendance, history, chronic absenteeism in Reports, Staff Portal access |
| Online Application Portal | ✅ Public `?apply=<id>` form — branded, honeypot protected, feeds Admissions pipeline |
| Advancement & Fundraising | ✅ Campaigns, donations, events, LYBUNT, alumni giving |
| Information & Records Management | ✅ Student records, grade history, alumni records |
| Staff Logins / Portal | ✅ StaffDashboard with role-based nav + invite flow |
| Admissions Pipeline | ✅ Inquiry → Toured → Applied flow |
| Service Layer Architecture | ✅ All business logic in `src/services/` — decoupled from UI, shared with AI agents |
| MCP Server / AI Agent Integration | ✅ 27-tool stdio server connected to Claude Desktop — reads/writes live school data |
| Human Resource Management | Partial — staff directory, multi-grade, divisions, portal; no PD log or reviews |
| Facilities & Operations | Partial — Work Orders built; preventive maintenance, asset registry, room booking not yet built |
| Financial Management | Partial — pricing tiers defined; Stripe not integrated |
| Marketing & Community Engagement | Partial — Messages module; no scheduling or targeting |

---

## Modules To Build Next

### Tier 1 — Core gaps, high sales impact

| Capability | What to Build |
|---|---|
| **Tuition & Billing** | Per-student invoicing, online payment via Stripe, financial aid, payment plans. New `invoices` + `payments` tables. Depends on Stripe. |
| **Stripe Integration** | Monthly subscription billing for schools — required to go live. |
| **Resend Domain Verification** | Required before live parent email delivery works. |

### Tier 1.5 — AI Agent Extension (in progress)

| Capability | What to Build |
|---|---|
| **HTTP Agent API** | `mcp_server/api.js` — Express/Hono wrapper around service functions exposing `POST /agent/chat`. Enables web-embedded agents inside LunchBox UI. Same service functions, HTTP instead of stdio. |
| **Domain Agents** | One agent per module (Enrollment, Attendance, Facilities, etc.) — scoped tool subset + domain-specific system prompt. Haiku for simple ops, Sonnet for reasoning. Embedded as "Ask AI" chat panel in each module. |
| **Policy / Document RAG** | New `policy_documents` table with pgvector embeddings. Upload school policy docs (handbook, HR, safety). Semantic search via Supabase RPC `match_policies`. Policy Agent answers questions from retrieved chunks — no hallucination. |

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
| **Class Scheduling / Timetabling** | Phase 3 (Classes CRUD) ✅ done. Phases 4–8 remaining — see Class Scheduling Build Plan below. |
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

## Feature-Sliced Design Refactor Queue

All existing modules are being refactored one-by-one to follow the Feature-Sliced Design pattern documented in CLAUDE.md. Each refactor extracts business/domain logic into `src/domain/<module>.js` and UI behavior into `src/hooks/use<Module>.js`, leaving the `.jsx` file as a thin rendering shell.

**Do modules in this order. Test each one in the browser before starting the next.**

### Refactor Status

| # | Module | File | Lines | Status | What to Extract |
|---|---|---|---|---|---|
| 1 | **Messages** | `Messages.jsx` | 198 | ✅ Done | `validateMessage(form)`, `formatMessageDate(str)`, `fetchParentEmails` → service, `useMessages` hook |
| 2 | **Enrollment** | `Enrollment.jsx` | 299 | ✅ Done | `validateEnrollmentForm(form)`, `useEnrollment` hook, inline Supabase calls → service |
| 3 | **Parents** | `Parents.jsx` | 371 | ✅ Done | `formatParentDisplay(parent)`, `useParents` hook, inline Supabase calls → service |
| 4 | **Attendance** | `Attendance.jsx` | 342 | ✅ Done | `getDefaultDate()`, `summarizeAttendance(records)`, `useAttendance` hook |
| 5 | **Facilities** | `Facilities.jsx` | 423 | ✅ Done | `isOverdue(wo)`, `calcFacilitiesStats(workOrders)`, `thisMonth()`, `validateWorkOrder(form)`, `useFacilities` hook |
| 6 | **ReportCards** | `ReportCards.jsx` | 484 | ✅ Done | `buildGradeOptions(scale)`, `validateReportCard(form)`, `useReportCards` hook |
| 7 | **Settings** | `Settings.jsx` | 506 | ✅ Done | `validateSchoolSettings(form)`, `parseDivisions(raw)`, `useSettings` hook |
| 8 | **Admissions** | `Admissions.jsx` | 546 | ✅ Done | `getPipelineStats(inquiries)`, `validateInquiry(form)`, `canConvertToStudent(inquiry)`, `useAdmissions` hook |
| 9 | **Alumni** | `Alumni.jsx` | 583 | ✅ Done | `calcGivingTotal(donations)`, `getDonorStatusColor(status)`, `validateAlumni(form)`, `useAlumni` hook |
| 10 | **Staff** | `Staff.jsx` | 718 | ✅ Done | `getRoleColor(role)`, `parseGradeAssignments(member)`, `canAccessPortal(member)`, `useStaff` hook |
| 11 | **Fundraising** | `Fundraising.jsx` | 853 | ✅ Done | `calcNetRevenue(event)`, `fmt(n)`, `getLybuntDonors(donations)`, `calcCampaignProgress(campaign)`, `useFundraising` hook |
| 12 | **StaffDashboard** | `StaffDashboard.jsx` | 889 | ✅ Done | `getNavForRole(role)`, `canViewHealth(role)`, `canViewFullHealth(role)`, `useStaffDashboard` hook |
| 13 | **Students** | `Students.jsx` | 1184 | ✅ Done | `domain/students.js` (STATUS_COLORS, INCIDENT_TYPES/COLORS, HEALTH_ENTRY_CATEGORIES/COLORS/ICONS, BLANK_HEALTH_ENTRY/PROFILE, today, BLANK_INCIDENT, parentDisplayName, statusColor, isEntryExpired, isSkipGrade, calcStudentStats, filterStudents, getGradeOptions), `hooks/useStudents.js` |
| 14 | **Reports** | `Reports.jsx` | 1285 | ✅ Done | `calcEnrollmentStats(students)`, `calcAttendanceRate(records)`, `groupByMonth(records)`, `calcFacilitiesCosts(workOrders)`, `useReports` hook |
| 15 | **App.jsx** | `App.jsx` | 416 | ✅ Done | `useAuth` hook (session, login, logout, signup), `useSchool` hook (fetchSchool, fetchStats) — leaves App.jsx as pure routing shell |

### Refactor Rules (repeat for every module)
1. Read the full `.jsx` file
2. Identify all non-render logic (calculations, validation, date formatting, business rules)
3. Create `src/domain/<module>.js` — move pure logic there as named exports
4. Create `src/hooks/use<Module>.js` — move state + data loading there, call domain + service functions
5. Rewrite the `.jsx` file to import from hook + domain, render only
6. Run `npm run dev` and test every feature of that module before moving to the next
7. Update this table: change ⬜ Todo → ✅ Done

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

### Security Hardening (Audit 2026-04-30)

Full audit found no critical vulnerabilities. Service role key is correctly server-only. No XSS/injection surface. Items below are deferred for pre-launch hardening.

#### 🔴 High — Fix before public launch

| # | Issue | Location | Fix |
|---|---|---|---|
| H1 | **Staff account hijack via email signup** | `src/hooks/useSchool.js` lines 67–79 | Require Supabase email confirmation before writing `auth_user_id` link. Or switch to admin-issued invite tokens. |
| H2 | **Auth error messages leak email existence** | `src/hooks/useAuth.js` lines 21–22 | Replace `error.message` with generic "Invalid email or password" for login failures. |
| H3 | **No rate limiting on public application form** | `src/ApplicationPortal.jsx` | Add hCaptcha or Cloudflare Turnstile. Minimum: `vercel.json` rate-limit rule on `?apply=` path. |
| H4 | **School metadata oracle via `?apply=` URL** | `src/ApplicationPortal.jsx` | Add `public_application_enabled` boolean to `schools` table; refuse to serve when false. |

#### 🟡 Medium — Fix before scale

| # | Issue | Location | Fix |
|---|---|---|---|
| M1 | **DB write before validation in `updateStudent`** | `src/services/students.js` lines 57–82 | Move grade-change validation above the `.update()` call, or wrap in a Supabase RPC transaction. |
| M2 | **MCP `log_incident` trusts caller-supplied student name** | `mcp_server/server.js` lines 214–226 | Look up canonical name from DB by `studentId`; ignore caller-supplied `studentName`. |
| M3 | **MCP mutation tools lack `school_id` guard** | `mcp_server/server.js` — `delete_student`, `update_student_status`, `resolve_incident`, `delete_staff_member`, `delete_report_card`, `update_work_order_status` | Add `.eq('school_id', schoolId)` to each destructive service function when called with the service-role client. |
| M4 | **No security headers (CSP, X-Frame-Options, etc.)** | Missing `vercel.json` | Create `vercel.json` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a `Content-Security-Policy` header. |
| M5 | **Messages logged as "Sent" before Resend is wired up** | `src/hooks/useMessages.js` | Set status to `'Draft'` or `'Pending'` until actual email delivery is confirmed. Address when Resend domain is verified. |

#### 🟢 Low

| # | Issue | Fix |
|---|---|---|
| L1 | No password minimum enforced in UI | Add client-side 8-char check in `useAuth.js`; raise Supabase dashboard minimum to 8. |
| L2 | Wizard completion in `localStorage` re-shows on new browser | Move `wizard_complete` flag to `schools` table column. |

---

## Class Scheduling Build Plan

| Phase | Description | Status |
|---|---|---|
| 1 | **Bell Schedule** — Period CRUD in Settings (name, type, start/end time, days) | ✅ Done |
| 2 | **Rooms** — Room CRUD with division assignment, capacity | ✅ Done |
| 2.5 | **Buildings** — Campus config (buildings + floors) feeding Rooms dropdowns | ✅ Done |
| 3 | **Classes** — Class CRUD (name, subject, division, teacher, room, status) | ✅ Done |
| 4 | **Class Sections** — Assign periods + terms to classes; `class_sections` table (class_id, period_id, term, academic_year) | ⬜ Next |
| 5 | **Student → Class Assignment** — Roster per class; add/remove students; `class_enrollments` table (class_id, student_id) | ⬜ Todo |
| 6 | **Conflict Detection** — Warn when student or teacher is double-booked in same period | ⬜ Todo |
| 7 | **Teacher Schedule View** — Read-only schedule grid in Staff Portal showing teacher's assigned classes by period | ⬜ Todo |
| 8 | **Report Card Hookup** — Pre-populate report card subjects from student's enrolled classes | ⬜ Todo |

---

## Pricing Tiers

| Tier | Limit | Price |
|---|---|---|
| Starter | Up to 100 students | ~$99/month |
| Growth | Up to 300 students | ~$199/month |
| Pro | Unlimited students | ~$399/month |

Payment via Stripe (not yet integrated).
