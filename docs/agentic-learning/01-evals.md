# 1 — Evals

*Built and measured 2026-10-11. Full explanation: [Architecture Guide, Item 1](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** Answers from an AI agent vary from run to run and can be wrong. Without a repeatable measurement there is no way to tell whether a change to the prompt, the model or the tools made the agent better or worse (the cohort miscount, 32 instead of 33, was found by luck).

**How it works:** `npm run evals` signs in as a school admin, builds questions from live data, and computes the right answers directly from the database. Phase 1 (free, no model) runs each chat tool directly and checks its output against a plain database count. Phase 2 (opt-in, costs tokens) sends each question through the real chat handler and scores the reply: numbers must appear in the reply, writes must produce a confirm card for the right student and change nothing in the database, navigation requests must open the right screen, and out-of-scope requests must be declined. Each question can be repeated, results are grouped by behavior category with pass targets, and every failing reply is printed in full.

**Components touched:** `scripts/run-evals.mjs`, `scripts/evals/hard-cases.mjs`, `scripts/evals/shared.mjs`, `api/chat/index.js` (token usage returned on every response; system prompt edited), `package.json` (`npm run evals`).

**Trust boundaries & invariants:** The right answer comes from the database, never from the agent's own tools, so tools and model are tested independently. The model phase is opt-in because it spends a prepaid balance. Credentialed runs are executed by the account owner. A "proposed" write must leave the database unchanged.

**Prediction vs result:** *Predicted:* the agent would stumble on counting and ambiguous requests. *Result:* it was strong on counts, multi-step lookups, paraphrases, confirm-gated writes and declines (57 of 58 on the full suite), and weak in one place nobody predicted: asked to move a class it asked a clarifying question (or promised to open the screen without calling the tool) about 1 time in 5.

**What broke / what was learned:**
- A perfect score on the first 12 simple questions meant the set was too easy, not that the agent was perfect.
- One failure on one run and a clean sweep on five were both too few runs; about 20 repeats were needed to see the true rate (~80%).
- The first prompt fix was based on a wrong guess and made things no better (about 63%). **Reading the failing replies** showed the real cause; the targeted second fix went to 20/20.
- A "failure" in the regression run was a correct refusal that the keyword grader did not recognize. Graders can be wrong too; the widened detector is a stopgap until a model-based grader (item 22).

**Tradeoffs:** Exact checks wherever possible (numbers, actions, database state); a keyword heuristic only for declines. Opt-in model runs and small repeat counts over exhaustive runs, to protect a $5 balance. Pass targets by severity: safety-critical behaviors (writes, declines) 100%, the rest 90%.

**What I'd change at scale / in production:** Hundreds of cases curated from real conversations and user feedback (item 22); a model-based grader calibrated against human grades; a small "smoke" set on every change and the full set nightly; per-run cost and token logging attributed by case (item 2); staff-login cases to test role-restricted behavior; multiple fixture schools with edge cases (empty tables, ties, name collisions).

**How I know it works:** `npm run evals` (free tool checks); `npm run evals -- --set=all --model --repeats=2` (57/58 correct with the keyword-grader miss; targets met); `npm run evals -- --set=hard --model --only=nav_scheduling --repeats=20` (20/20 after the fix, 16/20 before).

**Baseline vs target:** see Architecture Guide, Item 1, section 1.14.
