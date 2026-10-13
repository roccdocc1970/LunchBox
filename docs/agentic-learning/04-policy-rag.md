# 4 — Policy RAG (Step 7 of 23)

*Built and measured 2026-10-12. Full explanation: [Architecture Guide, Item 4](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** The agent knew nothing about a school's own handbook and rules, and the documents are too large and changeable to paste into every prompt. Without grounding it would guess.

**How it works:** An admin's policy document is split into chunks on headings and paragraphs (each chunk starts with its section path and neighbours overlap slightly). A local embedding model turns every chunk into a 384-number vector, stored in the database with the chunk text. At question time the question is embedded the same way, the nearest chunks are found by similarity of meaning, and the model is given those passages (labelled as reference data) to answer from — naming the document and section, or saying the documents don't cover it.

**Components touched:** `db/migrations/005_policy_rag.sql`, `src/domain/policies.js` (chunker), `src/services/policies.js`, `api/_lib/embed.js`, `api/_lib/tools.js` (`search_policies`), `api/chat/index.js` (system-prompt rule), `scripts/policies-ingest.mjs`, `scripts/policies-test.mjs`, `scripts/evals/policy-cases.mjs`, sample handbooks for two schools, `scripts/isolation-test.mjs`, `scripts/run-evals.mjs`.

**Trust boundaries & invariants:** (1) The search runs with the caller's permissions (`SECURITY INVOKER`), so RLS applies and a school never retrieves another school's passages. (2) Only a school's admin can add or change policy documents; staff can read; anonymous callers get nothing. (3) Policy text is untrusted input to the model and is labelled as data. (4) Policy document changes are audited.

**Prediction vs result:** *Predicted:* retrieval with a small local model would miss some everyday phrasings. *Result:* in the smoke test and the retrieval test the right section was found in the top 3 for at least 80% of everyday-language questions (the test's gate), and the policy evals passed 16 of 16 on the cheaper model for about half a cent — including a planted instruction inside the document and a question the documents don't cover.

**What broke / what was learned:** Nothing failed in the final runs, but the design surfaced: retrieval must be tested separately from the model's answer; chunk cutting decides retrieval quality; a fixed-size vector column ties the database to one embedding model; a document is an injection channel; and installing the embedding library raised `npm audit` to 22 reported vulnerabilities (finding F21).

**Tradeoffs:** Local model (free, no key) over a hosted API (better quality, a new vendor and key). Heading-aware chunking over fixed-size splitting (keeps rules with their context, assumes structure). `SECURITY INVOKER` search over `DEFINER` (isolation over convenience). No vector index yet (fast enough at this size). Text and Markdown only (PDFs are a later step). Command-line ingestion before a screen.

**What I'd change at scale / in production:** a hosted embedding API chosen on measured retrieval quality; hybrid keyword-plus-vector search and reranking (Step 8); an admin upload screen with status, replace and delete; document owners, review dates and expiry; PDF and scan extraction with human verification (Step 22); a vector index; a larger retrieval and answer eval set built from real questions and failures; more document-borne injection cases.

**How I know it works:** `npm run test:policies` (15 passed: chunker, retrieval, isolation — free), `npm run test:isolation` (98 passed, 0 failed, 1 vacuous), and `npm run evals -- --set=policy --model --chat-model=claude-haiku-5-5 --repeats=2` (16/16, 95% range 81–100%).

**Baseline vs target:** see Architecture Guide, Item 4, section 4.6.
