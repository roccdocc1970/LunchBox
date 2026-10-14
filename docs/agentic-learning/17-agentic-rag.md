# 17 — Agentic RAG & retrieval quality (Step 8 of 23)

*Built and measured 2026-10-13. Full explanation: [Architecture Guide, Item 17](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** Step 7's search finds passages by meaning only. That is weak on exact codes, form numbers and phone extensions, which a parent often asks for by name ("Form PU-7", "extension 4471"). We also had no way to say whether a change to search made it better.

**How it works:** *Hybrid search* runs two searches over the same chunks and merges them. The *meaning* search ranks chunks by vector similarity (Step 7). The *keyword* search uses Postgres full-text search (a stemmed, English word index over each chunk's heading and text). The two ranked lists are merged by *reciprocal rank fusion*: a chunk scores 1/(60 + rank) in each list it appears in, and the scores are added. A *retrieval eval* (`npm run eval:retrieval`) measures how often the right passage comes back, per kind of question, without calling any chat model.

**Components touched:** `db/migrations/006_hybrid_search.sql` (keyword index and `match_policy_chunks_hybrid`), `db/migrations/007_hybrid_all_terms_first.sql` (written, **not applied or verified**), `src/services/policies.js` (`searchPoliciesHybrid`), `scripts/retrieval-eval.mjs`, `scripts/evals/retrieval-questions.mjs` (21 questions: the 17 that were run — 8 exact-term, 5 paraphrase, 2 multi-fact, 2 "not covered" — plus 4 held-out exact-term questions not yet run), three sample documents under `scripts/evals/fixtures/policies/`.

**Trust boundaries & invariants:** The hybrid function is `SECURITY INVOKER` like the Step 7 search, so RLS applies and a school never retrieves another school's passages. Migration 006 only adds objects (a generated column, an index, one function); the Step 7 search keeps working unchanged. **The chat tool `search_policies` still uses the Step 7 vector-only search; hybrid is not wired into the chat.**

**Prediction vs result:**
- *Predicted (before building):* meaning-only search would miss some exact codes and extensions; hybrid would fix them.
- *First quiz (2 documents, 9 single-answer questions):* meaning search scored 8/9 first-place — too easy to show anything. The corpus was about 15 chunks, so even a fuzzy search found exact codes.
- *Harder quiz (3 documents with look-alike codes, 13 single-answer questions):* meaning-only: first-place 9/13, MRR 0.83; exact-term questions 5/8. Hybrid (006): first-place 10/13, MRR 0.87; exact-term 6/8. The multi-fact questions improved from 1/2 to 2/2 within the top 3.
- *My prediction for hybrid was half wrong:* "Form PU-7" moved to first place as expected, but both extension questions (4471, 4407) stayed second.

**What broke / what was learned:**
1. **A quiz that is too easy proves nothing.** The first quiz needed a bigger corpus with look-alike codes before the weakness appeared.
2. **My first explanation was wrong, and printing the data showed it.** I guessed the two lists were tied. A new column showing each result's position in each list showed the *keyword list itself* put "Who to call" above "Athletics contacts" (the one holding 4471). Fusion cannot repair an order both lists agree on.
3. **Likely cause (inferred, not directly proven):** Postgres keyword ranking counts how often words occur but does not weigh them by rarity, so a common word repeated five times ("extension") outweighs one rare number (4471). Search engines use inverse document frequency (BM25) for this.
4. **Proposed fix (migration 007):** within the keyword list, rank chunks containing *all* the question's words first. Because it was tuned after seeing failures, four new *held-out* questions were written **before** the fix to judge it.
5. **Status: 007 is written, committed, and not applied or measured. The held-out questions have not been run.** The decision (2026-10-13) was to move on with that recorded honestly, not to chase the last points on a small quiz.

**Tradeoffs:** Postgres full-text search (already in the database; no new service) over a dedicated search engine or BM25 library. Rank-based fusion (no tuning of incompatible score scales) at the cost of ignoring how strong a match was. A 20-chunk test corpus (fast and free, but small).

**What I'd change at scale / in production:** wire hybrid into the chat tool once verified; add a reranker and measure it; add agent re-query for weak results; a larger question set drawn from real parent questions; test with documents that have tables and PDF extraction (Step 22); consider BM25 scoring; a "not covered" similarity threshold; tune the fusion constant.

**How I know it works:** `npm run eval:retrieval` (vector baseline) and `npm run eval:retrieval -- --mode=hybrid`, both free. Small question set: differences of one or two questions are noise.

**Baseline vs target:** see Architecture Guide, Item 17, section 17.6.
