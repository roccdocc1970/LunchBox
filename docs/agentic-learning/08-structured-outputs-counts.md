# 08 — Structured outputs & deterministic counts (Step 9 of 23)

*Built and checked 2026-10-13. Full explanation: [Architecture Guide, Item 8](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** A language model is unreliable at counting and arithmetic (a cohort count once came out 32 instead of 33). The chat already guarded one case: `withCounts` attaches an exact `count` next to every list a tool returns. But an audit showed the chat skipped the app's own deterministic calculators (`calcFacilitiesStats`, `calcFundraisingStats`, `calcStudentStats` … about 25 pure functions the screens already use). So for "how many open work orders?" the model received every work order, and `withCounts` counted *all* of them; filtering to "open" and counting that subset was still the model's job.

**How it works:** A new chat tool, `get_school_stats`, fetches rows with the existing service (the caller's own RLS-scoped client), computes with the same domain calculator the screen uses, and returns finished numbers. Topic filters (grade, status, priority, category, incident type) reuse the screens' own filter functions. A filter a topic does not support is reported back, never silently dropped. The model's job shrinks to choosing the tool and presenting the result. A school-wide incident list tool (`get_school_incidents`) fills a gap.

**Components touched:** `api/_lib/schoolStats.js` (new: `computeStats` pure, `getSchoolStats` fetch + role check), `api/_lib/tools.js` (two tools added), `scripts/stats-test.mjs` (`npm run test:stats`, 31 offline checks, optional `--live`), `package.json`.

**Trust boundaries & invariants:** Runs with the caller's permissions (RLS applies, same as every chat tool). Staff roles are limited to topics their own screens show (students, incidents, report cards, facilities, classes, rooms; the staff directory for Principal/Administrator), because RLS hides some tables from staff and an empty result would read as a misleading "0". A list that reaches the database's 1000-row default cap carries a warning, since a count over a capped list is silently low.

**Prediction vs result:** *Predicted:* the model would pick the new tool from its description alone. *Result:* in a manual check on the school A test account, "how many students are enrolled in 3rd grade?" returned 3 and "how many open work orders?" returned 1, both matching the screens, and the traces show `get_school_stats` with the right filters for both (results of 168 and 153 bytes instead of full lists). No prompt rule was needed for those two questions.

**What broke / what was learned:**
1. A first chat attempt answered "no students on file" because the browser was signed in to an account with no students. The answer was correct, but a result of 0 cannot be told from a bug unless you know the right answer in advance. The `--live` check proves the tool runs, not that its numbers are right; a known-data check is still missing.
2. The incident-type list in CLAUDE.md's schema notes ("Medical") is stale; the app's real types are Behavioral, Academic, Attendance, Safety, Other. It was copied into two tool descriptions and corrected before use.
3. `filterWorkOrders` treats "no filter" as the text `'All'`; passing nothing matches no rows. The wrapper passes `'All'` and a test covers it.
4. "Open" means status exactly Open (as on the Facilities card), not "not finished yet"; the two readings give different numbers.
5. There is no severity field on incidents, so "open serious incidents" has no direct meaning; the tool description says so.

**Tradeoffs:** Wrap existing calculators (no new arithmetic, matches the screens) over writing chat-specific totals. One tool with a topic parameter over one tool per topic (smaller tool list; the model must pick the topic). Role limits kept conservative (fewer topics for staff).

**Not done (recorded, not hidden):**
- The existing eval suite was **not** re-run after this change, so regressions elsewhere are unchecked.
- The incidents question was not tried in the chat.
- The final-answer check (validating the `render_view` shape on the server and flagging a number in a view that no tool returned) is **not built**; `render_view` still forwards the model's `data` unvalidated, and the model can still type a wrong number into a card.
- The MCP server (Claude Desktop path) returns raw rows with no counts; unchanged.
- Other list tools still return every row; only counts moved to code.

**What I'd change at scale / in production:** server-side validation of the final view; a provenance check (every displayed number must appear in a tool result); known-data tests against a seeded school; stats for attendance; counts for the MCP server; pagination or aggregate queries in the database (`count(*)`) instead of fetching rows to count them.

**How I know it works:** `npm run test:stats` (31 offline checks with hand-written expected numbers), `npm run test:stats -- --live` (wiring against the real database, reported passing), and the manual chat check above with traces.

**Baseline vs target:** see Architecture Guide, Item 8, section 8.6.
