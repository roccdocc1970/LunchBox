# 2 — Tracing

*Built 2026-10-11. Full explanation: [Architecture Guide, Item 2](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** When an agent answer is wrong, slow or expensive there was no way to see where. Evals say *that* something failed; nothing recorded *why*, or what each request cost.

**How it works:** The chat handler starts a trace for each request and records every model call (time, tokens, why it stopped) and every tool call (time, number of rows, size in bytes, error flag, argument names only). Just before each response it saves one row to `agent_traces` through the caller's own database client, so RLS decides who can see it. `npm run traces` lists recent requests, the slowest, and each request's steps.

**Components touched:** `api/_lib/trace.js`, `api/chat/index.js`, `db/migrations/003_agent_traces.sql`, `scripts/traces.mjs`, `scripts/isolation-test.mjs`, `package.json`.

**Trust boundaries & invariants:** (1) A school can only read its own traces; staff only their own. (2) Traces are immutable (no update privilege) and anonymous users have no privileges at all. (3) No tool results and no argument values are stored. (4) Tracing can never break a request.

**Prediction vs result:** *Predicted:* the final model call (writing the answer) would be the slow, expensive step. *Result:* the model calls were all similar (~1 s); the real difference between requests was the size of the tool result fed into the second call (8,307 bytes for 33 cohort rows vs 1,719 for 4 work orders, giving 4,447 vs 958 fresh input tokens), and the tools themselves took only ~100 ms.

**What broke / what was learned:** (a) I said traces keep student data out, but the stored question text can contain a student's name; added `TRACE_STORE_QUESTION=false` and documented it. (b) The first trace revealed a cost problem the evals never showed: "how many" questions receive every row (F12). (c) Cache behavior became visible: cold on the first call, ~3,800 tokens read from cache afterward.

**Tradeoffs:** Metadata over payloads (less debugging detail, much less privacy risk). Store the question truncated rather than not at all (easier debugging; names possible). Write the trace before responding (a few ms of latency, but it survives a serverless function being frozen after the response). Admins may delete traces rather than the table being fully append-only (allows retention).

**What I'd change at scale / in production:** automatic retention; store dollar cost per request from a price table; redact names from question text or default it off; trace every entry point including auth failures; a dashboard with trends and alerts; link traces to eval runs and user feedback; sampling for very high traffic.

**How I know it works:** two eval questions produced two traces whose steps match what the code does (`npm run traces -- --steps`); `npm run test:isolation` passes 90 of 91 checks including the new table (school B sees none of A's traces; anonymous is denied).

**Baseline vs target:** see Architecture Guide, Item 2, section 2.5.
