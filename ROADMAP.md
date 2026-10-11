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
Top nav with school logo/motto/color. Sidebar nav (collapsible groups) with live count badges on every item (batch COUNT queries via `navCounts` service, refreshed on each dashboard visit). Live stat cards (Total Students, Pending Enrollment, Messages Sent, Active Staff). Quick action buttons. Getting Started checklist widget: 7 setup steps with progress bar, dismissable (persisted to localStorage per user), re-openable via button at dashboard top-right, turns muted green with "(Completed)" label when all steps done.

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

### Campus Module (`Settings.jsx` → Campus tab)
Unified building + room hierarchy in Settings → Campus tab. Buildings are the primary entity — click to expand and see all rooms inside. Each building shows its room count badge, floor chips, and notes. Inline room add/edit form appears within the building card. Building delete is blocked when it has rooms ("Remove rooms first"). `rooms.building_id` FK references `buildings(id) ON DELETE RESTRICT` — referential integrity enforced at DB level. Room form pre-fills building from context. `rooms` table: name, type, building_id (FK required), building (denormalized), floor, capacity, divisions (JSONB), notes. `buildings` table: name, type, floors (JSONB), notes.

### Bell Schedule (`Settings.jsx` → Bell Schedule tab)
Define school day periods in Settings → Bell Schedule tab. Each period has name, type (Class, Break, Lunch, Assembly, Advisory, Study Hall, Other), start/end time, and days of week. Color-coded by type. `periods` table: name, type, start_time, end_time, days_of_week, sort_order.

### Classes Module (`Classes.jsx`)
CRUD for school classes. Card grid with division color bar, subject + division chips, teacher and room shown inline. Dropdowns pull from live subjects (school config), divisions, active staff, and rooms. Teacher name and room name denormalized at save time. Filters: search (name/teacher/subject), division, status. Default filter: Active. `class_size` field sets the manual enrollment cap — drives capacity conflict badges on cards and in the edit form, enforced hard in the hook (blocks enrollment at cap). **Class Enrollment** tab: two-panel UI — left = available students (filterable pills, click to enroll); right = enrolled students (green pills, ✕ to remove). Cohort assignment section below: assign a cohort → all members auto-enrolled immediately; removing a cohort link unenrolls its members. Capacity progress bar turns red at cap with lock banner. `classes` table: name, subject, division, teacher_id + teacher_name, room_id + room_name, class_size, description, notes, status. `class_enrollments` table: class_id + student_id, UNIQUE per student per class.

### Cohorts Module (`Cohorts.jsx`)
Group students into named cohorts (homerooms, tracks, grade cohorts). Card grid view with stat cards by status and division. Click a cohort card → full-screen detail with three tabs: **Cohort Info** (name, division, academic year, description, status), **Members** (two-panel pill UI — available students left, cohort members right), **Classes** (assign classes to cohort — auto-enrolls all members on assignment, unenrolls on removal). Division color coding matches school divisions config. `cohorts` table: name, division, academic_year, description, status. `cohort_students`: cohort_id + student_id. `cohort_classes`: cohort_id + class_id + auto_enroll (always true in current UI).

### Schedule Module (`Scheduling.jsx`)
Visual timetable grid + building browser for assigning classes to periods by term. Two views: Grid (period rows as drop targets — drag class cards to schedule) and Buildings (buildings → floors → rooms showing assigned classes per term). Term selector derived from school's grading_period setting. Auto-scheduler: greedy constraint solver — most-constrained first (teacher + room both set), respects teacher/room conflicts and room capacity vs class_size, preview before commit. Inline pickers on every class card: click teacher line → staff dropdown, click room line → room dropdown — both run pre-save conflict detection (blocks double-booking before any DB write, keeps original assignment on conflict). ↗ button on each card navigates directly to that class's edit form in the Classes module. Clear button resets term. `class_sections` table: class_id + period_id + term + academic_year, UNIQUE per class per term.

### Reports Module (`Reports.jsx`)
6 tabs: Enrollment · Student Incidents · Communications · Staff · Fundraising · Facilities. Each tab has stat cards, bar charts, and data tables. Facilities tab includes cost summary, assignee workload, overdue list.

### Health Records (`Students.jsx` + `StaffDashboard.jsx`)
Two tables: `student_health` (one profile per student) + `student_health_entries` (many facts). Admin can add/edit/delete from student profile drawer. Categories: Allergy, Medication, Immunization, Condition, Injury, Other. Expiration date flagging. Role-gated in StaffDashboard.

### Attendance Module (`Attendance.jsx`)
Two tabs: Take Attendance (date + grade picker, per-student Present/Absent/Tardy/Excused buttons, notes, upsert on save) and History (filterable by date/grade/status). "All Grades" option loads entire school at once with grade label per student. Staff Portal: teachers and principals have Attendance in nav; single-grade teachers get their grade pre-selected. Reports tab: present rate, 6-month absence trend, status breakdown, chronic absentees table (>10% non-present, min 5 days). New `attendance` table with unique constraint on (school_id, student_id, date).

### Application Portal (`ApplicationPortal.jsx`)
Public-facing admissions form at `?apply=<school_uuid>`. Pulls school branding (name, logo, color). Fields: parent name/contact, student name, grade applying for, source, notes. Honeypot field for bot rejection. Validates required fields + at least one contact method. Inserts into `inquiries` as New Inquiry via anon Supabase policy. Branded success screen. Invalid ID shows graceful not-found page. Admissions module has "🔗 Copy Application Link" button that generates the shareable URL.

### UI Design System (completed 2026-06-04)
Full visual consistency pass across all pages:
- **Lucide icon migration** — all emoji UI icons replaced with lucide-react components across every `.jsx` file and domain file. 🍱 brand logo preserved. Icon name strings stored in domain files; component lookup maps render them. See CLAUDE.md → Icon System.
- **Page header convention** — every landing page now shows the matching left-nav Lucide icon (in `primaryColor`) to the left of the page title. Pattern documented in CLAUDE.md.
- **Stat card convention** — all summary cards standardized to compact pill style (`rounded-xl px-5 py-3`, colored dot, count, label). Tall `border-t-4` cards removed from all pages. Stat cards appear above search/filter bars on every page.
- **Nav label updates** — "Parents" → "Parent Directory"; "Facilities" → "Facility Requests" (matched to page headers).
- **Dashboard** — stat cards and Quick Action cards redesigned to single-line layout (icon + label + value). 🍱 logo restored to top-nav left. Grey icon tone standardized.
- **Messages** — now receives `school` prop for `primaryColor` consistency; stat card and brand-colored button added.
- **Fundraising** — New Campaign/Event button moved to top-right header; tab icons removed from Campaigns/Donations/Events/Donors tabs.
- **Settings** — tab icons removed from School Profile/Academic Config/Bell Schedule/Campus/Communication/Appearance tabs.
- **Cohorts** — stat cards split into two rows: Total Cohorts + Active on top; Archived + division cards below.
- **Page transitions** — Framer Motion installed (`framer-motion`). All landing pages fade in/out at 100ms via `AnimatePresence` keyed by `activePage` in `App.jsx`.

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

### Tier 1.5 — AI Agent Extension

| Capability | Status |
|---|---|
| **In-app AI chat ("Ask LunchBox")** | ✅ Shipped (v1), now the default post-login home screen. `api/chat/index.js` + `api/chat/execute.js` — Vercel serverless functions, **not** the originally-planned Express/Hono `mcp_server/api.js` wrapper (Vercel's zero-config `/api/*.js` convention was simpler, since hosting is already Vercel and it deploys with the same `git push`). Tool-calling loop over the existing `src/services/*` layer, split into read tools (auto-executed, freely render a generated view), write tools (confirm-gated — proposes via a `ConfirmAction` card, only executes on explicit human click), and navigate tools (deep-link into the real screen for anything scheduling/capacity-sensitive, never attempted conversationally). Prompt caching enabled on the system prompt + tool definitions. See `src/Chat.jsx`, `src/hooks/useChat.js`, `src/services/chat.js`, `src/views/*`, `api/_lib/tools.js`. |
| **⚠️ NOT YET VERIFIED — multi-tenant isolation** | The chat backend scopes every query through the *calling user's own* Supabase session (anon key + their JWT, never the service-role key) specifically so RLS enforces tenant isolation automatically — see `api/_lib/supabaseFromRequest.js` and `getSchoolContext.js`. This is correct by design, but has only ever been exercised against a single school account during dev testing. **Before this feature is ever used by more than one school, verify it with two real school accounts logged in concurrently** — confirm one school's chat session can never see, reference, or act on another school's data. This is the single most important open item on this feature. |
| **⚠️ `ANTHROPIC_API_KEY` not yet added to Vercel** | Added 2026-09-20. Only exists in local `.env.local` so far — the chat feature works locally but **will fail in production** until the same key is added under Vercel Dashboard → Settings → Environment Variables, matching the existing Supabase/Resend keys. Quick fix, just not done yet. |
| **Saved chat views (deliberately simple — not a report builder)** | Not started. Lets a user pin a generated view from "Ask LunchBox" for later, and re-run it to refresh the numbers. This is the intended replacement for endless one-off custom-report requests and for ever building a drag-and-drop report designer — **do not scope-creep this into one**. Implementation is small on purpose: a new `saved_views` table (`school_id`, `question`, `template`, `data` JSONB, `reply`, `created_at`) written when the user clicks "save" on a view already rendered by `GeneratedView`; a simple list that replays saved rows through that same component (no new rendering logic needed); a "Refresh" action that just re-sends the original `question` text through the existing `/api/chat` endpoint and overwrites `data`. Scheduled/emailed delivery (e.g. "send me this every Monday" via the existing Resend integration) is a further, separate future step — not part of this item. |
| **Deterministic counts in chat answers (low priority)** | Mitigated, not solved — see `api/chat/index.js`'s `withCounts()`. A real bug surfaced: asked "how many cohorts," the model answered 32 for an actual 33, because it was mentally tallying a long list read out of a tool result rather than being given the count. Fix shipped: every list-returning tool result now includes an explicit `count` field (`withCounts()`, one level deep — handles both a bare-array result and an object whose direct properties are arrays), plus a system-prompt instruction to use it instead of counting manually. **This reduces the error rate but is not a hard guarantee** — the model still has to notice the field, follow the instruction, and transcribe the number correctly into its reply; all three steps remain generative/probabilistic, just far more reliable than manual tallying. A truly deterministic fix would have the backend code (not the model) inject the real number directly into the rendered view — e.g., the model references *which* named count it means rather than restating literal digits, and `api/chat/index.js` substitutes the true value before the response reaches the frontend. Estimated ~1 hour, contained to the same file. Deferred because a wrong count is a display-only inaccuracy on a read-only answer — no data risk — so it's lower priority than the write-safety and multi-tenant work above. Revisit if wrong counts show up often enough in practice to undermine trust in the feature. |
| **Domain Agents** | Not started. One agent per module (Enrollment, Attendance, Facilities, etc.) — scoped tool subset + domain-specific system prompt, Haiku for simple ops / Sonnet for reasoning. |
| **Policy / Document RAG** | Not started. New `policy_documents` table with pgvector embeddings, semantic search via Supabase RPC `match_policies`. |

### Tier 2 — Important extensions

| Capability | What to Build |
|---|---|
| **Interactive Guidance** | In-app user guidance system. (1) **Product Tours** — Driver.js step-by-step walkthroughs highlighting UI elements with tooltips, ideal for onboarding staff to a new module — not started; (2) **Contextual Tooltips** — `?` badges on fields/buttons with Framer Motion popovers, zero new dependencies — not started; (3) **In-app AI Assistant** — ✅ shipped, see Tier 1.5's "Ask LunchBox". Driver.js tours remain the low-effort near-term win for pure UI onboarding, separate from the AI assistant. |
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

## Tailwind CSS Refactor Queue

All `.jsx` files are being migrated from inline `style={{}}` objects to Tailwind utility classes. Inline `style={{}}` is kept only for runtime-dynamic values (brand color, division colors, status/type color maps).

### Refactor Status

| # | File | Status |
|---|---|---|
| 1 | `App.jsx` | ✅ Done |
| 2 | `Settings.jsx` | ✅ Done |
| 3 | `Classes.jsx` | ✅ Done |
| 4 | `Scheduling.jsx` | ✅ Done |
| 5 | `Reports.jsx` | ✅ Done |
| 6 | `Cohorts.jsx` | ✅ Done |
| 7 | `StaffDashboard.jsx` | ✅ Done |
| 8 | `ApplicationPortal.jsx` | ✅ Done |
| 9 | `Onboarding.jsx` | ✅ Done |
| 10 | `Landing.jsx` | ✅ Done |
| 11 | `Rooms.jsx` | ✅ Done |
| 12 | `SetupWizard.jsx` | ✅ Done |
| 13 | `StudentProfile.jsx` | ✅ Done |
| 14 | `Fundraising.jsx` | ✅ Done |
| 15 | `Staff.jsx` | ✅ Done |
| 16 | `Admissions.jsx` | ✅ Done |
| 17 | `Alumni.jsx` | ✅ Done |
| 18 | `Facilities.jsx` | ✅ Done |
| 19 | `Parents.jsx` | ✅ Done |
| 20 | `ReportCards.jsx` | ✅ Done |
| 21 | `Attendance.jsx` | ✅ Done |
| 22 | `Enrollment.jsx` | ✅ Done |

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
| M6 | **No dependency vulnerability scan has ever been run** | `package.json` — includes `@anthropic-ai/sdk` and `express` added 2026-09-20 for the AI chat feature, never scanned | Run `npm audit` (and ideally a proper SCA tool, e.g. `npm audit` isn't exhaustive) and fix or accept-with-reason anything it surfaces. Cheap, should be routine, not a one-time event — re-run periodically as dependencies change. |

#### 🟢 Low

| # | Issue | Fix |
|---|---|---|
| L1 | No password minimum enforced in UI | Add client-side 8-char check in `useAuth.js`; raise Supabase dashboard minimum to 8. |
| L2 | Wizard completion in `localStorage` re-shows on new browser | Move `wizard_complete` flag to `schools` table column. |

#### 🔵 Planned — Full architecture & call-chain security review

The 2026-04-30 audit above and everything found during the AI chat build (the multi-tenant isolation design, the `get_student_health` role-gating bug caught mid-build) were both scoped to whatever was being actively worked on at the time — neither is a systematic pass over the *entire* system. "Ensure there are no exploitable holes anywhere" isn't a single fix, it's an ongoing practice; the concrete, actionable version of that goal is:
1. **Trace every write and every cross-tenant-sensitive read path**, end to end, from UI/API entry point through service layer to the database — not just the AI chat backend, the whole app (UI direct-to-Supabase calls, the MCP server, and the new `api/` chat backend) — checking specifically for missing `school_id` scoping, missing RLS policies, or an admin-only boundary that a staff-role account could slip past. M3 above (MCP mutation tools missing `school_id` guards) is a known example of exactly this category of gap — there are likely others not yet found precisely because no one has looked systematically.
2. **Re-verify the multi-tenant isolation test** for the AI chat feature (already tracked above under Tier 1.5) as part of this same pass, not separately.
3. **Get a professional third-party security review or penetration test** before any wider rollout beyond pilot schools — this is the point past which self-review (mine or the founder's) stops being sufficient, especially once real student PII from more than one school is in the system.

---

## Architecture Documentation (Founder To-Do)

Captured 2026-09-20, not yet started — these are understanding/documentation exercises for Daniel to work through (with Claude's help when he gets to it), separate from the bug-fix-style items above.

- **Full architecture post-mortem.** A deliberate, complete walkthrough of every feature and function built to date — not just the AI chat work from this session, the whole system (student lifecycle/unification, the evolution timeline, cohorts/classes/scheduling, the MCP server, the chat backend, RLS/auth model) — so Daniel has full, first-hand understanding of what exists and how it fits together, rather than understanding accumulated piecemeal across many sessions.
- **ArchiMate realization diagrams for the entire system.** Formal enterprise-architecture diagrams (business/application/technology layers and their realization relationships, per the ArchiMate standard) covering the full system. Useful both for Daniel's own understanding and as a credible artifact to show a school district's IT/compliance reviewers, an auditor, or an investor — this is the kind of documentation larger, more formal buyers often expect and smaller ed-tech vendors often lack.

---

## Agentic Learning Track (Founder To-Do)

Captured 2026-10-11. LunchBox is a **learning vehicle** for agentic AI engineering, not (currently) a commercial product — the goal is to use it as a sandbox for each major piece of agentic scaffolding so Daniel understands the whole space first-hand. The current chat backend is a solid foundation (hand-rolled tool loop, read/write/navigate split, human-confirmed writes, RLS-scoped via the caller's JWT, prompt caching) but is **not** a production-grade agentic system. Gaps and the order to close them:

| # | Topic | What to build in LunchBox | What it teaches |
|---|---|---|---|
| 1 | **Evals** | ~20-question eval set with known answers + a script that runs them and scores pass/fail; rerun on every prompt/model change | How to know if a change helped or hurt. Biggest gap — the 32-vs-33 cohort miscount was found by luck. |
| 2 | **Observability / tracing** | Log each request's tool calls, latency, tokens, cost, errors (start with a Supabase table; later try Langfuse or similar) | Debugging agents without reading the console |
| 3 | **Prompt-injection red-teaming** | Plant instructions in an incident description / student note and see if the agent obeys them | Tool results are untrusted input; why the confirm gate matters |
| 4 | **Policy RAG** | Already planned (pgvector, Voyage AI, `search_policies` tool, Settings → Policies upload) — add citations and a "not found in policy" fallback | Chunking, embeddings, retrieval quality, grounding |
| 5 | **Memory & conversation persistence** | Store conversations server-side; summarize long threads; try per-user long-term memory | Context management beyond one request |
| 6 | **Durable multi-step workflows** | One checkpointed workflow that can pause, wait for human approval, resume, and retry (e.g. re-enrollment outreach) | The LangGraph-style state-machine problem |
| 7 | **Streaming, retries, rate limits** | Stream replies; retry failed tools; per-user spend/rate caps | Production robustness |
| 8 | **Structured outputs & validation** | Schema-validate `render_view`; inject counts deterministically instead of relying on the model | Reliability of model output |
| 9 | **Subagents / multi-agent** | Split into domain agents (Admissions, Facilities, Academics) behind a router | When multi-agent helps vs. just adds cost |
| 10 | **Framework comparison** | Rebuild the loop once with the Claude Agent SDK / SDK tool runner and compare to the hand-rolled version | What frameworks buy you |
| 11 | **MCP both ways** | Already have an MCP server (local stdio); try exposing a remote, authenticated one and consuming an external one | Where MCP fits vs. direct tool definitions |
| 12 | **Model routing & cost tuning** | Route simple lookups to a smaller model, hard questions to a larger one; use batch for offline jobs | Cost/quality tradeoffs |
| 13 | **Proactive / event-driven agents** | A scheduled or DB-triggered job (e.g. nightly chronic-absence check) that drafts parent outreach into a human approval queue — no user prompt required | Triggers, idempotency (no duplicate alerts), alert fatigue, non-chat approval UX. LunchBox today is purely reactive. |
| 14 | **Planning, reasoning & self-verification** | Try extended thinking on hard questions; a plan-then-execute mode that shows the plan; a verify pass that checks the answer against tool results | Explicit planning vs. implicit step-by-step; reliability via a second check (also a better fix for count errors) |
| 15 | **Guardrails, audit & governance** | Audit log of every agent action (who/what/why/which tool); PII minimization before data reaches the model; output checks; loop/stuck detection; idempotent writes + undo | The policy layer around the model; what a school auditor will ask for |
| 16 | **Context engineering** | Truncate/summarize big tool results; fetch data just-in-time instead of up front; load tools dynamically (all ~20 are sent every call today) | Managing what's in the context window as tools and data grow |
| 17 | **Agentic RAG & retrieval quality** | Extend item 4: hybrid (keyword + vector) search, reranking, and letting the agent decide when/what to retrieve and re-query | Why naive RAG fails and how retrieval is improved |
| 18 | **Code-execution tool** | Let the agent write and run sandboxed code for ad-hoc analysis/charts; compare with the fixed generative-view templates | The tradeoff between flexibility and safety/predictability |
| 19 | **Multimodal / document input** | Upload a PDF or photo (application form, report card) and extract structured data into a confirm card | Document parsing and extraction with human verification |
| 20 | **Computer-use / agent-as-tester** | Point a browser/computer-use agent at the app to run QA flows and report bugs | Agents that operate UIs; plays to Daniel's QA background |
| 21 | **Agent identity & delegated auth** | Scoped, expiring tokens for agent actions; try a remote authenticated MCP server (OAuth) instead of the local service-role one | Acting on behalf of a user safely; closes the MCP M3 concern |
| 22 | **Feedback loops & LLM-as-judge** | Thumbs up/down on answers feeding the eval set; a judge model to grade free-text answers; simulated users to stress-test conversations | Scaling evals past hand-written test cases |

### Progress tracker (update as each item completes)

Every item follows the same sequence: **(1) concept briefing** — read its primer in `docs/agentic-learning/concepts.md` and answer its explain-back question to Claude in your own words *before any building*; **(2) build**; **(3) test or eval**; **(4) design note**; **(5) preserve** — the full concept explanation, including the explain-back exchange and corrections, is added as a chapter in `docs/architecture/ARCHITECTURE_GUIDE.md`, together with a 2–5 line "In brief" summary that is also added to the Quick summaries cheat sheet at the top of that Guide. An item is **done** only when it is built, has a test or eval, has its design note in `docs/agentic-learning/` (template in that folder's README), and its chapter is in the Architecture Guide. Legend: `[ ]` not started · `[~]` in progress · `[x]` done.

- [x] 0 — Two-school isolation test **DONE 2026-10-11** (88 pass / 0 fail / 1 vacuous; F8 and F9 found, fixed, re-tested; design note `docs/agentic-learning/00-isolation-test.md`; open findings carried forward: F1, F4, F5, F7, F10, F11). History: *(concept check passed 2026-10-11; first run 2026-10-11 via `npm run test:isolation`: 87 pass / 1 fail / 1 vacuous. **F9 staff-row escalation was confirmed, then fixed and retested as blocked 2026-10-11** (`db/migrations/001_fix_staff_self_update.sql`; `useSchool.js` push pending). Open: public read of `schools` (F8); re-run both tests after fixes; A→B direction; report_cards seed data; design note)*
- [ ] 1 — Evals
- [ ] 2 — Tracing
- [ ] 15 — Audit log & guardrails
- [ ] 3 — Prompt-injection red-team
- [ ] 12 — Model routing
- [ ] 4 — Policy RAG
- [ ] 17 — Agentic RAG & retrieval quality
- [ ] 8 — Structured outputs / deterministic counts
- [ ] 22 — Feedback loops & LLM-as-judge
- [ ] 13 — Proactive agents
- [ ] 14 — Planning & self-verification
- [ ] 5 — Memory & persistence
- [ ] 7 — Streaming, retries, rate limits
- [ ] 16 — Context engineering
- [ ] 9 — Subagents / multi-agent
- [ ] 10 — Framework comparison
- [ ] 6 — Durable multi-step workflows
- [ ] 11 — MCP both ways
- [ ] 21 — Agent identity & delegated auth
- [ ] 18 — Code-execution tool
- [ ] 19 — Multimodal / document input
- [ ] 20 — Computer-use / agent-as-tester

### Build order & where to apply each item (added 2026-10-11)

Rule for every item: build it once, attach an eval or test, and write a short "what broke / what I'd change" note. Only claim it on a resume after it exists, scoped as a prototype. Item numbers match the table above (0 = the existing two-school isolation test from Tier 1.5).

**Tier 1 — Foundations (~2–3 weeks).** Start here; everything later depends on it.

| # | Item | Where in LunchBox | Why there |
|---|---|---|---|
| 0 | Two-school isolation test | `api/_lib/supabaseFromRequest.js`, `getSchoolContext.js`, every table's RLS; script that calls `/api/chat` and PostgREST with two schools' JWTs | The security foundation; its two-JWT harness is reused by the eval runner; every later feature adds tables that need RLS |
| 1 | Evals | `api/chat/index.js` end-to-end, against seed data (`get_students`, `get_cohorts`, `get_student_evolution`) | Known-answer data exists; seed the set with the 32-vs-33 cohort miscount as the first regression |
| 2 | Tracing | Wrap the tool loop in `api/chat/index.js`; new `agent_traces` table (RLS-scoped) | One choke point sees every model call and tool call |
| 15 | Audit log & guardrails | `api/chat/execute.js` (confirmed writes) + proposed-vs-confirmed in `index.js`; PII review of what `tools.js` returns to the model | Writes already funnel through one file; health data is the sensitive case |
| 3 | Prompt-injection red-team | Plant payloads in an incident description, student note and work-order text; read via `get_incidents` / `get_students` | These are the free-text fields the agent reads; target is a bogus `log_incident` / `update_student_status` confirm card |

**Tier 2 — Capabilities (~3–4 weeks).**

| # | Item | Where in LunchBox | Why there |
|---|---|---|---|
| 12 | Model routing | First-turn classifier in `api/chat/index.js` (counts/lookups → small model; evolution/analysis → larger) | Needs evals (#1) to prove routing didn't hurt quality |
| 4 | Policy RAG | New `services/policies.js`, `search_policies` in `tools.js`, Settings → Policies tab, pgvector table | Already designed; fits the existing Settings + tool patterns |
| 17 | Agentic RAG & retrieval quality | Same policy corpus: hybrid search, reranking, agent re-queries | Extends #4 without new infrastructure |
| 8 | Structured outputs / deterministic counts | `render_view` in `tools.js`, `views/GeneratedView.jsx`, `withCounts` in `index.js` | Replace mitigation with server-injected counts and schema validation |
| 22 | Feedback loops & LLM-as-judge | Thumbs up/down in `Chat.jsx` feeding the eval set | Turns real usage into test cases |
| 13 | Proactive agents | Vercel cron over `attendance` (chronic-absence detection) → drafts into an approval queue | Clean data, clear trigger, natural human-approval step |
| 14 | Planning & self-verification | Hard questions on `get_student_evolution`; verify pass against tool results | Richest tool, most room for wrong summaries |
| 5 | Memory & persistence | `hooks/useChat.js` (currently client-only) → `conversations` table; `services/chat.js` | Replaces ephemeral state; adds a new RLS surface to test |
| 7 | Streaming, retries, rate limits | `api/chat/index.js` + `Chat.jsx` | Production robustness on the existing loop |
| 16 | Context engineering | Truncate big results (`get_student_evolution`, large `get_students`); dynamic tool loading (all ~20 tools sent every call) | Real payload-size and tool-count problems already exist |

**Tier 3 — Advanced (~2–3 months, after the above).**

| # | Item | Where in LunchBox | Why there |
|---|---|---|---|
| 9 | Subagents / multi-agent | Split `tools.js` into Admissions / Facilities / Academics sets behind a router | Tool groups already map to domains; measure whether it beats the single agent |
| 10 | Framework comparison | Rebuild the `api/chat/index.js` loop with the Agent SDK / tool runner on a branch | Same feature, two implementations: the best way to see what frameworks buy |
| 6 | Durable multi-step workflows | Re-enrollment outreach: pause for approval, resume, retry | Needs #13 and #5 first |
| 11 | MCP both ways | `mcp_server/server.js` → remote, authenticated HTTP; consume one external MCP server | Turns the local-only server into something real |
| 21 | Agent identity & delegated auth | Same server: replace service-role key + hardcoded `SCHOOL_ID` with scoped, per-user tokens (closes M3) | Fixes the documented gap between MCP and chat identity |
| 18 | Code-execution tool | Ad-hoc analysis over attendance/enrollment data vs the fixed `Table`/`StatRow` templates | Directly contrasts flexibility with the safe-template design |
| 19 | Multimodal / document input | `ApplicationPortal.jsx` / Admissions: scanned application → extracted fields → confirm card | Existing intake flow plus a confirm gate |
| 20 | Computer-use / agent-as-tester | Point an agent at `localhost:5173`: login, admissions → convert flow | End-to-end QA, uses the seed data |

> The field moves fast — re-check current best practices before starting each item rather than trusting this list as final.

---

## Class Scheduling Build Plan

| Phase | Description | Status |
|---|---|---|
| 1 | **Bell Schedule** — Period CRUD in Settings (name, type, start/end time, days) | ✅ Done |
| 2 | **Rooms** — Room CRUD with division assignment, capacity, building_id FK | ✅ Done |
| 2.5 | **Buildings** — Campus config (buildings + floors); rooms nested inside building cards in Settings → Campus | ✅ Done |
| 3 | **Classes** — Class CRUD (name, subject, division, teacher, room, status) | ✅ Done |
| 4 | **Class Sections** — Assign periods + terms to classes; `class_sections` table (class_id, period_id, term, academic_year) | ✅ Done |
| 5 | **Student → Class Assignment** — Roster per class; add/remove students; `class_enrollments` table (class_id, student_id) | ✅ Done |
| 5.5 | **Cohorts** — Group students; assign cohort to class → bulk-enroll all members; `cohorts`, `cohort_students`, `cohort_classes` tables | ✅ Done |
| 6 | **Conflict Detection** — Warn when teacher/room double-booked; cohort conflict detection (`detectCohortConflict`) on schedule drag-and-drop | 🔶 Partial — teacher/room/cohort conflicts on schedule assignment done; individual student period conflict not yet built |
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
