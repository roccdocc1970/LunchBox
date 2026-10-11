# Agentic Learning Track — design notes

One short note per roadmap item, written when the item is finished (`NN-name.md`, e.g. `00-isolation-test.md`). The goal is architectural understanding, not syntax: each note should let you explain the item to a skeptical engineer for ten minutes, including how it fails.

Before building any item, read its primer in [concepts.md](concepts.md) and answer its explain-back question to Claude in your own words. Concept first, then build. The full explanation from each concept session (with your answers and the corrections) is preserved as a chapter in [../architecture/ARCHITECTURE_GUIDE.md](../architecture/ARCHITECTURE_GUIDE.md), with a short "In brief" summary that also goes into the Guide's Quick summaries cheat sheet at the top.

Keep each note to one page, using this template:

```
# <Item number> — <name>

**Problem:** what this solves, in a sentence or two.
**How it works:** the flow in plain English — who calls what, what data crosses which boundary, who is authenticated at each hop. (A sequence diagram or ArchiMate view is welcome.)
**Components touched:** files/tables/services, one line each.
**Trust boundaries & invariants:** what must always be true, and what enforces it.
**Prediction vs result:** what I expected before running it, what actually happened.
**What broke:** failures and surprises found while building or testing.
**Tradeoffs:** what I chose, what I rejected, why.
**What I'd change at scale / in production:**
**How I know it works:** the test or eval, and how to run it.
```
