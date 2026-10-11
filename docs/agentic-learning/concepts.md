# Concept primers — read before building each item

For every roadmap item: **what** it is, **why** it exists (the problem), **when** you need it, **where** it sits in the architecture and in LunchBox, an **analogy** from classic enterprise work, **how it fails**, and an **explain-back** question. Rule: answer the explain-back question in your own words (to Claude, out loud or in writing) before building the item. Order follows the build order in ROADMAP.md.

A guiding principle across all of them: **use plain code wherever code does the job perfectly; use the model only where judgment or language is needed.** Most items below are ways of surrounding a model with the engineering a normal system already has.

---

## Tier 1 — Foundations

### 0 — Two-school isolation test
- **What:** A test proving that one customer cannot read or change another customer's data.
- **Why:** In multi-tenant software a cross-tenant leak is the worst failure, and with student records it is also a legal event (FERPA). A model adds a new risk: it chooses tool arguments, so it could be steered into asking for another school's id. The design says database row-level security (RLS) blocks that, but a design is not proof.
- **When:** Before a second customer exists, and again whenever tables or endpoints are added.
- **Where:** Data layer (Postgres RLS) and the tool layer. LunchBox: `supabaseFromRequest.js`, `getSchoolContext.js`, every table's policies.
- **Analogy:** A separation test, like proving system separability in a divestiture — you demonstrate the boundary, you don't assume it.
- **How it fails:** A table with RLS missing; a policy too broad; a `SECURITY DEFINER` function that bypasses policies.
- **Explain-back:** Why does the chat backend forward the user's own token instead of using a powerful key, and what would break if it didn't?

### 1 — Evals
- **What:** A set of questions with known-correct answers, run automatically and scored.
- **Why:** Model output is non-deterministic, so you can't judge quality by eyeballing a few chats — especially as prompts, tools and models change. The cohort miscount (32 vs 33) was found by luck.
- **When:** As soon as there is behavior you care about, and before every prompt, model or routing change.
- **Where:** A runner that calls the chat endpoint against seed data. LunchBox: `api/chat/index.js`.
- **Analogy:** A regression test suite / QA test plan, except scored as a pass rate over repeated runs.
- **How it fails:** No evals → silent regressions. Weak evals (too easy, or the answers leak into the prompt) → false confidence.
- **Explain-back:** Why can't one passing run prove the agent works?

### 2 — Tracing
- **What:** Recording every step of a request: model calls, tool calls with inputs and outputs, latency, tokens, cost, errors.
- **Why:** When an answer is wrong you need to see which step went wrong; costs need attribution.
- **When:** Before you have users; essential once you debug a session you didn't watch.
- **Where:** Observability layer wrapped around the loop. LunchBox: `index.js` + a traces table.
- **Analogy:** Application performance monitoring / distributed tracing.
- **How it fails:** Black box ("it gave a wrong answer," no way to find out why). Also traces contain student data, so the traces table itself needs RLS.
- **Explain-back:** What would you look at to learn why one answer was slow and expensive?

### 15 — Audit log & guardrails
- **What:** A permanent record of what the agent did or proposed and who approved it, plus rules that constrain the agent (limits, minimal data exposure, undo, loop detection).
- **Why:** Accountability. A school must be able to answer "who changed this student's status and why." Different from tracing: tracing is for debugging, an audit log is for accountability — minimal, tamper-resistant, retained.
- **When:** Before any write capability reaches real users.
- **Where:** Governance layer around writes. LunchBox: `api/chat/execute.js`.
- **Analogy:** ITGC/SOX audit trail and change management. The AI policy you co-authored at Dana is the policy; this is its implementation.
- **How it fails:** Unexplained data changes; no proof a human approved.
- **Explain-back:** How does an audit log differ from a trace, and who reads each?

### 3 — Prompt-injection red-team
- **What:** Attacking your own agent by planting instructions in the data it reads.
- **Why:** The model cannot reliably tell data from instructions. Anything it reads — an incident note, a parent message, an uploaded document — can try to give it orders. A confirm gate limits the damage; it doesn't remove the attack. In LunchBox the public application form writes free text (`notes`) into student records the agent later reads, so outsiders can reach the model's context.
- **When:** Before the agent reads any text outsiders can influence, and before RAG documents.
- **Where:** The boundary between stored data and model context.
- **Analogy:** SQL injection (data interpreted as commands) — but there is no parameterized-query equivalent, so you defend in layers.
- **How it fails:** The agent proposes a harmful action, leaks data in a reply, or misleads the user. Defenses: least privilege, confirm gates, treat tool output as untrusted, avoid giving the model ways to send data out.
- **Explain-back:** Why does the public application form matter for this attack?

---

## Tier 2 — Capabilities

### 12 — Model routing
- **What:** Sending each request to the cheapest model that can handle it.
- **Why:** Cost and speed. A simple lookup doesn't need the biggest model — but misrouting a hard question quietly lowers quality.
- **When:** After evals exist (to prove quality held) and volume makes cost matter.
- **Where:** The front of the loop. LunchBox: `api/chat/index.js`.
- **Analogy:** Support tiers (L1 vs L3) or tiered storage.
- **How it fails:** Hard question routed to a weak model; the router costs more to build and maintain than it saves.
- **Explain-back:** How would you know routing didn't make answers worse?

### 4 — Policy RAG
- **What:** Retrieval-Augmented Generation: find the relevant passages in your own documents, hand them to the model with the question, and have it answer from them (with citations).
- **Why:** The model doesn't know your handbook; all documents won't fit in the prompt; fine-tuning is a poor way to store facts that change. Grounding in retrieved text reduces made-up answers.
- **When:** When answers depend on a body of documents too large or too changeable for the prompt.
- **Where:** A retrieval tool, a vector store (pgvector in Postgres), an upload UI. LunchBox: new `services/policies.js`, `search_policies` in `tools.js`, Settings → Policies.
- **Analogy:** A research librarian who pulls the right pages before you answer.
- **How it fails:** The wrong passage is retrieved and the answer is confidently wrong; stale documents; one school's policies visible to another (RLS again).
- **Explain-back:** What is an embedding, and why does one document become many vectors?

### 17 — Agentic RAG & retrieval quality
- **What:** Improving retrieval: combining keyword and semantic search (hybrid), re-ranking results, and letting the agent rephrase, re-query, or decide whether to retrieve at all.
- **Why:** One-shot vector search misses exact terms (policy numbers, names) and returns near-misses.
- **When:** After basic RAG works and evals show retrieval misses.
- **Where:** Same corpus as #4.
- **Analogy:** Search relevance tuning.
- **How it fails:** The right document exists but never surfaces.
- **Explain-back:** Name a question where keyword search wins and one where semantic search wins.

### 8 — Structured outputs & deterministic counts
- **What:** Forcing model output to match a schema, and computing facts in code instead of asking the model.
- **Why:** Models are unreliable at counting and arithmetic; schema validation catches malformed output.
- **When:** Whenever a user or downstream code relies on exact values.
- **Where:** `render_view` and `withCounts` in the chat backend.
- **Analogy:** Input validation, and a stored procedure instead of asking a person to tally by hand.
- **How it fails:** The 32-vs-33 miscount.
- **Explain-back:** Which parts of an answer should the model never compute?

### 22 — Feedback loops & LLM-as-judge
- **What:** Turning user thumbs-up/down and failures into new test cases, and using a model to grade free-text answers against a rubric.
- **Why:** Hand-written evals don't scale or reflect real use; exact-match grading fails for prose.
- **When:** After basic evals and real usage.
- **Where:** Chat UI feeding the eval set.
- **Analogy:** Customer complaints becoming regression tests; a QA reviewer applying a rubric.
- **How it fails:** The judge model is biased or inconsistent. It must be calibrated against human grades.
- **Explain-back:** Why must you check the judge against human grades?

### 13 — Proactive agents
- **What:** Agents started by an event or schedule instead of a user prompt.
- **Why:** Much valuable work is noticing — chronic absence, overdue items — and nobody asks.
- **When:** When the trigger is clear and the action can be safely reviewed.
- **Where:** Scheduler + job + approval queue. LunchBox: cron over `attendance`.
- **Analogy:** A monitoring alert plus runbook automation.
- **How it fails:** Duplicate alerts (needs idempotency), alert fatigue, acting on stale data, a queue nobody reviews.
- **Explain-back:** What stops the same absence alert going out every night?

### 14 — Planning & self-verification
- **What:** The agent plans before acting and checks its answer against evidence before replying.
- **Why:** Complex questions need dependent steps; single-pass answers contain unsupported claims.
- **When:** Multi-step or high-stakes answers. The cost is more tokens and latency.
- **Where:** The loop. LunchBox: `get_student_evolution` questions.
- **Analogy:** Design review before build; four-eyes peer review.
- **How it fails:** The plan drifts; the verifier shares the author's blind spot; cost doubles.
- **Explain-back:** When is a verification step not worth its cost?

### 5 — Memory & persistence
- **What:** Keeping conversation history (and optionally learned preferences) beyond one page load, and managing long histories.
- **Why:** Users resume work; the context window is finite and cost grows with history.
- **When:** When sessions span time or users repeat context.
- **Where:** A conversations table. LunchBox: `useChat.js`, `services/chat.js`.
- **Analogy:** Session state vs. long-term CRM notes.
- **How it fails:** Stale remembered facts; retention and privacy problems; stored chats contain student data (needs RLS).
- **Explain-back:** What's the difference between conversation history and long-term memory?

### 7 — Streaming, retries, rate limits
- **What:** Showing the reply as it arrives, recovering from transient failures, and capping usage per user.
- **Why:** Perceived speed, reliability, and protection from runaway cost or abuse.
- **When:** Before real users.
- **Where:** Backend loop and chat UI.
- **Analogy:** Standard resilience patterns — backoff, circuit breaker, throttling.
- **How it fails:** A retry repeats a write; one user burns the budget.
- **Explain-back:** Why is retrying dangerous for a write tool but safe for a read tool?

### 16 — Context engineering
- **What:** Deciding exactly what goes into the model's context each turn — trimming, summarizing, loading tools and data only when needed.
- **Why:** Context is limited and costly, and more of it can dilute focus. Large tool results crowd out instructions.
- **When:** When payloads or tool counts grow (LunchBox already sends ~20 tools every call).
- **Where:** Tool results, the tool list, the system prompt.
- **Analogy:** Briefing an executive: what do they actually need to decide?
- **How it fails:** Truncation drops the key fact; irrelevant detail distracts.
- **Explain-back:** What would you cut from the context first, and why?

---

## Tier 3 — Advanced

### 9 — Subagents / multi-agent
- **What:** Splitting work across specialized agents, each with its own tools and prompt, coordinated by a router.
- **Why:** Smaller toolsets and focused prompts can improve accuracy and isolate permissions.
- **When:** When one agent's tool list or prompt gets unwieldy, or domains need different permissions — not by default.
- **Where:** `tools.js` split by domain.
- **Analogy:** Microservices vs. monolith, or departments behind a receptionist — same coordination overhead.
- **How it fails:** Handoff errors, multiplied cost, harder debugging.
- **Explain-back:** Name a case where one agent beats several.

### 10 — Framework comparison
- **What:** Building the same loop with an official SDK or framework to see what it handles for you.
- **Why:** Build-vs-buy judgment.
- **When:** After you understand the hand-rolled version.
- **Where:** A branch of `index.js`.
- **Analogy:** A build-vs-buy evaluation.
- **How it fails:** Abstractions hide behavior; lock-in.
- **Explain-back:** What does the framework do that you currently hand-roll?

### 6 — Durable multi-step workflows
- **What:** Processes whose state is saved so they can pause for hours or days (waiting for approval), resume, and retry.
- **Why:** Real business processes span time; one request/response can't wait for a human.
- **When:** When a task needs waiting or several approvals.
- **Where:** A state store plus a job runner.
- **Analogy:** Business process (BPM) engines; the saga pattern.
- **How it fails:** Orphaned runs, double execution on resume, state version drift.
- **Explain-back:** What state must be saved at each pause point?

### 11 — MCP both ways
- **What:** MCP is a standard protocol for exposing tools to AI clients. "Both ways" means serving your tools remotely and consuming other people's.
- **Why:** Interoperability — any MCP-capable client can use your tools without a custom integration.
- **When:** When tools must be shared across clients or you need outside capabilities.
- **Where:** `mcp_server/` over a remote transport.
- **Analogy:** An API standard, like ODBC for agent tools.
- **How it fails:** Auth gaps; trusting a third-party server's output (injection); tool sprawl.
- **Explain-back:** How does a local stdio MCP server differ in trust from a remote one?

### 21 — Agent identity & delegated auth
- **What:** Making sure the agent acts as, and only as, the user it works for, with limited, expiring credentials.
- **Why:** The MCP server's service-role key bypasses every protection. An agent with such credentials is one injection away from a breach.
- **When:** Before any agent is reachable beyond your own machine.
- **Where:** `mcp_server/` and token issuance.
- **Analogy:** OAuth on-behalf-of and least privilege — the identity work from your health-system role.
- **How it fails:** A "confused deputy": the agent uses its own power to serve a request it shouldn't.
- **Explain-back:** What is a confused-deputy attack in this system?

### 18 — Code-execution tool
- **What:** Letting the model write code and run it in a sandbox to analyze data.
- **Why:** Models are poor calculators; code gives exact, flexible analysis beyond fixed templates.
- **When:** Ad-hoc analysis that fixed views can't cover, and only with a sandbox.
- **Where:** A sandboxed runner receiving read-only data.
- **Analogy:** Giving an analyst a spreadsheet instead of a printout.
- **How it fails:** Sandbox escape, data exfiltration, runaway compute, wrong code that looks right.
- **Explain-back:** Why is this riskier than the fixed view templates, and what contains it?

### 19 — Multimodal / document input
- **What:** Having the model read PDFs, photos and scans and extract structured data.
- **Why:** Schools run on paper; this automates data entry.
- **When:** When inputs are documents — always with human verification.
- **Where:** Admissions intake. LunchBox: `ApplicationPortal.jsx` / Admissions.
- **Analogy:** OCR plus a data-entry clerk, with supervisor sign-off.
- **How it fails:** Misread digits; instructions hidden inside documents.
- **Explain-back:** Why must extraction end at a confirm card?

### 20 — Computer-use / agent-as-tester
- **What:** An agent that operates a UI by looking at the screen and clicking and typing.
- **Why:** Automates end-to-end QA, and reaches systems that have no API.
- **When:** No API exists, or for exploratory UI testing.
- **Where:** The app on `localhost:5173`, with test data only.
- **Analogy:** An adaptive UI test script, or a junior tester following a checklist.
- **How it fails:** Slow, flaky, expensive; can take unintended actions.
- **Explain-back:** When would you use this instead of an API?
