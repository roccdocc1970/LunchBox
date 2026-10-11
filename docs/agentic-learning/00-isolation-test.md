# 0 — Two-school isolation test

*Completed 2026-10-11. Full explanation: [Architecture Guide, Item 0](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** Prove that one school can never read or change another school's data — a promise that had been designed for but never tested.

**How it works:** Two real school admin accounts log in. The script builds the same database client the chat backend builds (public key + the caller's own token, never the master key) and tries to cross the boundary: read every table as the other school, read as an anonymous visitor, run every chat read tool with the other school's ids, and try to edit, delete and forge records. A second script reproduces one specific attack (a staff record redirected to another school). The database, not the application, is what refuses.

**Components touched:** `scripts/isolation-test.mjs`, `scripts/staff-escalation-test.mjs`, `api/_lib/supabaseFromRequest.js`, `api/_lib/getSchoolContext.js`, RLS policies on 25 tables, `get_staff_school_id()`, `submit_public_inquiry()`, `db/migrations/001` and `002`, `src/hooks/useSchool.js`, `src/ApplicationPortal.jsx`.

**Trust boundaries & invariants:** (1) Any query's results depend only on the caller's token, enforced inside the database. (2) A staff record's school can never change. (3) The public can reach school data only through one function that returns five display fields. (4) The master key never runs in an internet-facing process.

**Prediction vs result:** *Predicted:* the design would hold, with perhaps a gap or two in the tools. *Result:* 87 of 89 checks passed on the first run, but the failed one led to a policy review that exposed a far more serious hole the test hadn't covered.

**What broke:** (a) The public could read every column of every school's record (F8) — a deliberate convenience for the public application form that exposed more than intended. (b) A staff member (or any customer admin who gave themselves a staff row) could rewrite their own staff record to point at another school and then read that school's students (F9). The policy allowed editing any column of one's own record, and a database function trusted that record to decide which school someone belongs to. Both fixed and re-tested (88 passed, 0 failed, 1 vacuous).

**Tradeoffs:** Kept the current "admin's login id is the school id" model rather than migrating to a memberships table (deferred; finding F7). Fixed F9 with a narrow database function, a trigger and a policy removal instead of rewriting the staff model. Used database-level fixes rather than application-code filters, per the principle of enforcing rules at the lowest layer.

**What I'd change at scale / in production:** Move every database change into versioned migrations (started with `db/migrations/`); run both tests automatically on every change; add staff-account and A-looks-at-B tests; push role tiers (health data) into database rules; add rate limiting to the public inquiry function; restrict policies to logged-in users instead of "all roles"; add a pinned `search_path` to `get_staff_school_id()`.

**How I know it works:** `npm run test:isolation` (88 passed, 0 failed, 1 vacuous — `report_cards` has no seed rows) and `npm run test:staff-escalation` (blocked).

**Baseline vs target:** see Architecture Guide section 0.14. Open items carried forward: F1 (role tiers only in screens/code), F10 (policies granted to all roles), F11 (staff can read campaigns), F5 (public inquiry function has no rate limit), F7 (memberships redesign), F4 (rest of the schema not yet in migrations).
