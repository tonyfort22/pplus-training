# PPLUS Agent Team

This directory defines the working agent team for the PPLUS Training project.

## Core principle
Anthony talks to one orchestrator. The orchestrator dispatches focused workers. Workers return compact artifacts. Review and runtime verification are mandatory for non-trivial changes.

## Team roster
- `orchestrator.md`
- `product-planner.md`
- `mobile-ui-worker.md`
- `session-data-worker.md`
- `qa-runtime-verifier.md`
- `reviewer-judge.md`
- `workspace-ops-worker.md`

## Global rules
1. One owner-facing voice only.
2. One file family, one worker at a time.
3. Every task needs acceptance criteria before execution.
4. Every worker returns artifacts, not essays.
5. Spec review first, quality review second.
6. Runtime truth beats test optimism.
7. Workspace work stays separate from product work.
8. No fake/demo state may masquerade as live app truth.

## Standard worker output format
- **Task:** what was assigned
- **Files changed:** exact paths
- **Commands run:** exact commands
- **Result:** what changed and current status
- **Risks:** anything unresolved
- **Handoff:** what the next agent needs to know

## Dispatch patterns
### Small direct task
Use orchestrator only.

### Single-lane implementation
Orchestrator -> one worker -> reviewer -> QA verifier

### Split implementation
Orchestrator -> parallel workers on separate file families -> reviewer -> QA verifier

### Workspace rebuild
Orchestrator -> workspace ops worker -> QA verifier
