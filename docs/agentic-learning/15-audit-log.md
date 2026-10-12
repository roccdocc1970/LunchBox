# 15 — Audit log and guardrails

*Built 2026-10-11. Full explanation: [Architecture Guide, Item 15](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** There was no durable answer to "who changed this record, when, and did a human approve what the agent proposed?" Traces are metadata for engineers and are deletable; they never see the approval click or the before/after values.

**How it works:** Two layers. (B) Database triggers on eight sensitive tables record every insert, update and delete — from any path (screens, chat, MCP server, SQL editor) — with the signed-in user, the owning school, and for updates the old and new value of each changed column. (A) When a human confirms an agent-proposed change, the confirm endpoint calls `record_agent_approval()`, which records the approver (taken from their own login, not from the request) and the tool, with only ids and enum values. The log is append-only: a trigger blocks update, delete and truncate even for the table owner; no API role can write to it; only the school's admin can read it.

**Components touched:** `db/migrations/004_audit_log.sql`, `api/chat/execute.js`, `scripts/audit.mjs`, `scripts/audit-test.mjs`, `scripts/isolation-test.mjs`, `package.json`.

**Trust boundaries & invariants:** (1) Every change to an audited table produces an entry, regardless of path. (2) Nobody can add, edit or delete entries through the API; the owner cannot either (append-only trigger). (3) An entry's actor and school come from the caller's login, never from caller-supplied values. (4) One school never reads another's log. (5) Deleting a user or school does not delete history (no foreign keys).

**Prediction vs result:** *Predicted:* the hard part would be the triggers. *Result:* all 13 audit checks passed on the first run; the real design work was deciding what *not* to do — which tables to audit, why reads are out of scope for now, and keeping free text out of the approval summary.

**What broke / what was learned:** Nothing failed, but writing it exposed limits worth recording: the trigger copies whole rows on insert and delete (including free text such as incident descriptions), so the log is itself sensitive data; it fails closed, so a trigger bug would block writes; reads are not audited (F17); retention is undefined (F15).

**Tradeoffs:** Two layers (database triggers for completeness plus an approval record for the "why") rather than only the easy chat-level log, which would miss every change made on screen. Eight risk-chosen tables rather than all 25 (volume, noise, performance, and not duplicating the whole database). Append-only enforced in the database (lowest layer) rather than relying on application care.

**What I'd change at scale / in production:** a defined retention procedure; audit reads of health records; alert on audit failures; an auditor role separate from the admin; export or hash-chain the log to protect against a database owner; link each approval to the trace of the request that proposed it; review the audited-table list regularly.

**How I know it works:** `npm run test:audit` (13 of 13: insert/update/delete recorded with correct actor and values, cross-school read refused, direct writes refused, approvals attributed to the caller) and `npm run test:isolation` (92 passed, 0 failed, 1 vacuous), plus `npm run audit` after a real edit on screen.

**Baseline vs target:** see Architecture Guide, Item 15, section 15.7.
