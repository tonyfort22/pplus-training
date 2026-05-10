# PPLUS Multi-Agent Orchestration Plan

> **For Hermes:** Use `subagent-driven-development` when executing implementation tasks from this plan. The orchestrator stays in the main thread. Fresh subagents handle focused work with explicit context and review gates.

**Goal:** Build a practical multi-agent operating model for the PPLUS Training project so work is faster, cleaner, and less scattered, then use that model to rebuild the Hermes Workspace from scratch in a controlled way.

**Architecture:** One main Hermes acts as the coordinator and owner-facing interface. Specialized workers handle scoped tasks with isolated context, strict tool access, and handoff artifacts. This follows the direction from Hermes issue #344: specialized roles, dependency-aware workflows, result passing, and resilient review loops, while staying within the tools available today.

**Tech Stack:** Hermes Agent, `delegate_task`, Telegram DM as owner channel, git worktree mode where helpful, repo docs under `docs/plans/`, Hermes memory + skills, PPLUS repo at `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training`.

---

## 1. Why we are doing this

The current failure mode is simple:
- one agent is holding product memory, bug context, UI state, schema changes, setup work, and workspace surgery all at once
- that causes context bleed, duplicate fixes, stale assumptions, and too much App.js-era chaos getting mixed with real architecture work

The plan is not "more agents because it sounds cool."
The plan is:
- keep Anthony talking to one orchestrator
- split execution into named roles
- force each role to produce clean outputs
- make review and synthesis mandatory
- keep rebuild work separate from product work

---

## 2. What issue #344 changes for us

The useful ideas from the Hermes issue are:

1. **Specialized roles**
   Not every task should hit the same general-purpose agent.

2. **Structured workflows**
   We should use dependency-aware sequences, not random parallel thrashing.

3. **Result passing**
   Workers should return small, durable artifacts that the orchestrator can pass forward.

4. **Resilient execution**
   If a worker fails, the orchestrator retries, replans, or narrows scope.

5. **Single owner-facing coordinator**
   Anthony should not manage a swarm directly. One orchestrator does that.

We do **not** need the full future Hermes multi-agent architecture before getting value. We can simulate the good parts now using:
- `delegate_task`
- strict role definitions
- plan docs
- review passes
- explicit artifacts

---

## 3. Proposed team for PPLUS

## A. Orchestrator
**Owner:** main Hermes in DM with Anthony

**Job:**
- intake from Anthony
- decide single-agent vs multi-agent
- create/maintain plan docs
- dispatch workers
- collect outputs
- resolve conflicts
- decide when to stop, retry, or escalate
- maintain durable memory and skills

**Tool access:** full

**Rules:**
- never do large coding/debugging work directly if it can be delegated cleanly
- never let two workers edit the same file family at the same time
- always define acceptance criteria before dispatch
- always synthesize results back into one clean update

---

## B. Product Planner
**Job:** turn vague product asks into scoped execution plans.

**Good for:**
- feature breakdowns
- schema change planning
- screen flow planning
- workspace rebuild sequencing

**Toolset:** file, terminal, skills

**Outputs:**
- plan markdown
- task list with file paths
- dependency notes
- risks

---

## C. Mobile UI Worker
**Job:** Expo / React Native surface work.

**Good for:**
- screen components
- view models
- styling passes
- navigation / sheet flows
- screenshot-driven fixes

**Toolset:** file, terminal

**Allowed areas:**
- `apps/mobile/src/screens/*`
- `apps/mobile/src/train/*`
- `apps/mobile/src/ui/*`
- relevant tests

**Must return:**
- files changed
- test commands run
- any runtime risks

---

## D. Session/Data Worker
**Job:** session engine, Supabase repository logic, workout state truth.

**Good for:**
- session lifecycle
- repository fixes
- status derivation
- analytics seams
- schema-to-runtime alignment

**Toolset:** file, terminal

**Allowed areas:**
- `packages/data/*`
- `packages/core/*`
- `infra/supabase/*`
- data-facing tests

**Must return:**
- data contract changed or not
- migration impact
- tests run

---

## E. QA / Runtime Verifier
**Job:** prove whether a fix actually works in runtime, not just in unit tests.

**Good for:**
- focused test execution
- app boot verification
- log inspection
- screenshot review
- regression passes

**Toolset:** terminal, file, browser, vision

**Must return:**
- pass/fail verdict
- exact failing surface if broken
- evidence only, not architecture opinions unless asked

---

## F. Code Reviewer / Judge
**Job:** independent acceptance gate.

**Good for:**
- spec compliance review
- code quality review
- detecting scope creep
- finding hidden regressions

**Toolset:** file, terminal

**Must return:**
- PASS or REQUEST_CHANGES
- critical issues
- important issues
- optional cleanup items

---

## G. Workspace / Ops Worker
**Job:** rebuild Hermes Workspace cleanly without touching PPLUS by accident.

**Good for:**
- path audits
- backup / move plan
- workspace repo setup
- dashboard/gateway verification
- Obsidian vault wiring

**Toolset:** file, terminal, browser

**Must stay away from:**
- product code unless explicitly needed

---

## H. Research / Reference Worker
**Job:** read external sources and distill them into usable project rules.

**Good for:**
- GitHub issues
- package docs
- third-party architecture references
- library comparisons

**Toolset:** browser, web, file

**Must return:**
- short synthesis
- direct implications for PPLUS
- no giant paste dumps

---

## 4. Default workflow patterns

## Pattern 1: Simple task
Use only the orchestrator when:
- answer is short
- no file edits
- no risk of context sprawl

Examples:
- quick planning answer
- small repo lookup
- naming decision

## Pattern 2: Single execution lane
Use one worker + one reviewer when:
- one surface is changing
- file ownership is clear

Examples:
- one workout card UI fix
- one repository query fix

Flow:
1. Orchestrator defines acceptance criteria
2. Worker implements
3. Reviewer checks spec
4. QA verifies runtime if needed
5. Orchestrator reports back

## Pattern 3: Split implementation
Use parallel workers only when file ownership is separate.

Examples:
- mobile UI worker handles render layer
- data worker handles repository layer
- planner or reviewer merges contract understanding

Flow:
1. Orchestrator writes mini plan
2. Workers run in parallel on separate file families
3. Reviewer checks both against shared acceptance criteria
4. QA verifies integrated behavior
5. Orchestrator synthesizes

## Pattern 4: Rebuild / migration
Use sequential DAG-style flow.

Examples:
- Hermes Workspace rebuild

Flow:
1. Audit current paths
2. Preserve old content
3. Stand up fresh workspace app
4. verify backend services
5. wire vault layer
6. smoke test

No parallel edits until the audit and preservation step is done.

---

## 5. Team rules that keep this from becoming a circus

1. **One owner-facing voice only**
   Anthony talks to the orchestrator, not the workers.

2. **One file family, one worker at a time**
   No concurrent edits in the same area.

3. **Every task gets acceptance criteria**
   No vague "fix this weird thing" dispatches.

4. **Every worker returns artifacts, not essays**
   Required format:
   - changed files
   - what changed
   - commands run
   - result
   - open risks

5. **Every non-trivial change gets an independent review**
   Spec first, quality second.

6. **Runtime truth beats test optimism**
   If Expo runtime disagrees with tests, runtime wins.

7. **Workspace work stays separate from product work**
   Different lane, different plan, different worker.

8. **Memory stays curated**
   Durable conventions go to memory or skills. Temporary chaos stays out.

---

## 6. The practical PPLUS team we should run first

This is the starting roster, not the final empire:

### Core Team
- **Hermes Orchestrator**
- **PPLUS Planner**
- **PPLUS Mobile UI Worker**
- **PPLUS Session/Data Worker**
- **PPLUS QA Verifier**
- **PPLUS Reviewer/Judge**
- **Workspace Rebuild Worker**

### Why this set
Because it maps to the real pain points already visible in this repo:
- mobile UI and render logic are intertwined
- session/data truth has been leaking into UI state
- runtime verification has not always matched test confidence
- workspace setup is a different problem and should stop colliding with product work

---

## 7. When each agent gets called

## Product ask
Example: "Fix the active workout flow"
- planner if scope is unclear
- data worker for session truth
- mobile UI worker for presentation
- QA verifier for runtime proof
- reviewer/judge before close

## Research ask
Example: "Compare chart libraries for Expo"
- research worker
- maybe planner if implementation follows

## Workspace ask
Example: "Rebuild Hermes Workspace from scratch"
- workspace worker first
- planner if sequencing is complex
- QA verifier for browser/service smoke test

## Direct question
Example: "Which session is connected?"
- orchestrator only

---

## 8. Execution model we can use right now

We do not need new Hermes core features before starting. We can implement the operating model with current tools:

### Current primitives
- `delegate_task` for isolated workers
- `todo` for orchestrator task tracking
- `docs/plans/*.md` for shared durable plans
- `skill_manage` for reusable process upgrades
- `session_search` and memory for long-lived context

### Simulated L1 result passing
The orchestrator injects prior worker outputs into downstream worker context.

### Simulated DAG execution
The orchestrator runs only dependency-ready tasks and blocks downstream tasks until upstream results are reviewed.

### Simulated resilient execution
If a worker fails:
1. retry once if transient
2. replan with narrower instructions
3. split the task into smaller steps

That is enough to get 80 percent of the value without waiting on Hermes core multi-agent evolution.

---

## 9. Workspace rebuild plan after team agreement

Once Anthony approves the team model, the rebuild should happen in this order:

### Phase A: Audit and preserve
1. inspect current Hermes Workspace path
2. determine what is real app vs note vault vs legacy junk
3. back up anything ambiguous before touching it
4. verify PPLUS repo remains untouched

### Phase B: Fresh workspace app setup
1. clone or reset the real Hermes Workspace app in a clean folder
2. install dependencies
3. wire `HERMES_API_URL`
4. wire dashboard URL if needed
5. verify Hermes gateway health before opening UI

### Phase C: Vault layer repair
1. keep Hermes-managed memory in `~/.hermes/memories/`
2. keep optional Obsidian layer separate and explicit
3. repair daily note / template wiring only if wanted
4. avoid mixing app repo and vault repo again

### Phase D: Smoke test
1. confirm correct browser title and onboarding
2. confirm not Mission Control
3. confirm backend connection works
4. confirm PPLUS repo and other project dirs are unchanged

---

## 10. Immediate next steps

### Step 1
Anthony approves or tweaks the proposed team roles.

### Step 2
Create a reusable dispatch template for each role:
- role purpose
- allowed tools
- allowed file families
- output format
- review checklist

### Step 3
Set up the first operating docs:
- `docs/plans/2026-04-29-pplus-multi-agent-orchestration-plan.md`
- `docs/plans/2026-04-29-hermes-workspace-rebuild-plan.md`
- optional `docs/agents/` role cards if we want persistent local references

### Step 4
Run the workspace rebuild with the new team model, not the old freestyle mode.

---

## 11. Recommendation

Recommended default operating mode for this project:

- **single orchestrator in chat**
- **specialized delegated workers for execution**
- **mandatory independent review for non-trivial changes**
- **separate workspace lane from product lane**
- **runtime QA before claiming done**

That is the cleanest way to move faster without turning the repo into soup.

---

## 12. Approval questions for Anthony

Use these to lock the model before we rebuild:

1. Do you want the **Workspace Rebuild Worker** fully separate from PPLUS workers, yes or no?
2. Do you want every code task to require a **reviewer/judge pass**, or only bigger ones?
3. Do you want me to create persistent local **role cards** under `docs/agents/`, or keep it lighter with only plan docs?
4. For coding tasks, do you want the default split to be:
   - planner → worker → reviewer → QA
   or
   - planner → parallel workers → reviewer → QA

---

## 13. Final note

The point is not to make Hermes look impressive.
The point is to stop mixing:
- product planning
- coding
- debugging
- runtime verification
- workspace surgery
- memory maintenance

into one messy stream.

This plan fixes that.
