# 12 — Model routing (Step 6 of 23)

*Built and measured 2026-10-12. Full explanation: [Architecture Guide, Item 12](../architecture/ARCHITECTURE_GUIDE.md).*

**Problem:** Every question went to the larger, pricier model, though most are routine counts and lookups. Cost grows with usage, and nothing showed whether a cheaper model could do the job safely.

**How it works:** The suite was first run on the cheaper model alone (Haiku 5.5), category by category, against the same pass targets as the current model (Sonnet 5). Because it passed nearly everything, a small rule-based router was built: routine lookups and counts go to Haiku; analysis-style questions, write or destructive intent, bulk scope and long questions go to Sonnet; when unsure it picks Sonnet. The model is chosen once per request, the route and its reason are recorded as a trace step, and routing is off by default.

**Components touched:** `api/_lib/router.js`, `api/chat/index.js` (model choice, system-prompt rule for delete and bulk requests, model returned in the response), `api/_lib/trace.js`, `scripts/run-evals.mjs` (`--chat-model`, `--routing`, price table, per-model cost), `scripts/evals/hard-cases.mjs` (analysis and bulk-decline cases), `scripts/router-test.mjs`, `scripts/traces.mjs`.

**Trust boundaries & invariants:** (1) Safety categories (writes and declines) must reach 100% on whichever model they are routed to. (2) A request uses one model for its whole loop. (3) The router reads only the user's last message and defaults upward when unsure. (4) An explicit `CHAT_MODEL` beats routing; routing off means the default model.

**Prediction vs result:** *Predicted:* the cheap model would fail some categories, justifying a router. *Result:* Haiku passed nearly everything, with one real miss (opened a page when asked to delete all students), fixed by a prompt rule. The router is therefore a hedge for the unmeasured part (open-ended analysis) and for risky requests, not a response to a measured failure.

**What broke / what was learned:** (a) Two more grader errors (a refusal phrased unexpectedly; a non-breaking hyphen in a correct answer) — found by reading the failing replies. (b) The router's reason column revealed a rule over-matching the word "drop" even though the test passed. (c) Cost per task differs from price per token: 20× cheaper per token, but about 9× on one set because the cheaper model made more calls and used more output tokens, and about 20× on another.

**Tradeoffs:** Rules over a classifier (deterministic, free, easy to test, but crude). Default-upward over default-downward (a misroute up costs cents; a misroute down can cost quality or safety). Routing off by default because production chat is not live and the open-ended quality gap is unmeasured. One model per request because thinking blocks are bound to the model that wrote them.

**What I'd change at scale / in production:** a cheap classifier or a cascade tuned on real traffic; model-graded evals for open-ended quality (Step 10); dashboards and alerts on escalation rate and pass-rate drops; a scheduled canary on both models; pin exact model versions and track deprecations; revisit the rules whenever traces show misroutes.

**How I know it works:** `npm run test:router` (20 checks, offline); the whole suite routed (`npm run evals -- --set=all --routing --model`): 33/33, every category at or above target, 24 requests to Haiku and 9 to Sonnet, about $0.135 versus an estimated $0.50 on Sonnet alone; each route and its reason is in the trace.

**Baseline vs target:** see Architecture Guide, Item 12, section 12.8.
