# Branch and PR Workflow

Use this as the default operating flow for new app work now that CI, Semgrep, SonarQube Cloud, and branch protection are live.

## Goal

Keep every change:
- narrow enough to review honestly
- verified at the right seam
- small enough for the GitHub gates to mean something

## Default response shape for new work

Before coding, define the work in this order:

1. **Rule**
2. **Scope**
3. **Files likely touched**
4. **Verification plan**
5. **Implementation**

If any of those are fuzzy, tighten them before the branch grows.

---

## 1. Rule

State the product or architecture rule first.

Examples:
- Strength rows should only reflect real metric-capable data.
- Coach train hydration must use the selected athlete, not demo fallback state.
- Shell tests should verify delegation, not pin inline handler body shape.

If the rule is unclear, stop there first.

---

## 2. Scope

Write a one-sentence branch purpose:

> This branch changes ___ so that ___.

If that sentence needs multiple unrelated clauses, split the work.

### Good
- This branch changes workout-open orchestration so App.js delegates to a shared helper seam.
- This branch changes exercise detail metric profiles so non-strength exercises render the right progress model.

### Bad
- This branch fixes analytics and auth and the schema and CI while cleaning up some tests.

---

## 3. Pick one lane

Choose the primary lane before editing files.

### Lane A: shell / orchestration
Typical files:
- `apps/mobile/App.js`
- `apps/mobile/src/train/*`
- shell wiring tests

### Lane B: product surface
Typical files:
- `apps/mobile/src/screens/*`
- `apps/mobile/src/progress/*`
- surface-level tests

### Lane C: data / repository
Typical files:
- `packages/data/*`
- `packages/core/*`
- repository / adapter tests

### Lane D: CI / quality gates
Typical files:
- `.github/*`
- `semgrep.yml`
- `sonar-project.properties`

### Lane E: docs / schema / sql
Typical files:
- `docs/*`
- `infra/*`

If the branch starts spanning 3 or more lanes, split it.

---

## 4. Branch naming

Use names that match the reviewer question.

### Recommended patterns
- `fix/<specific-behavior>`
- `feat/<specific-surface>`
- `refactor/<specific-seam>`
- `test/<specific-regression>`
- `ci/<specific-gate-change>`
- `docs/<specific-topic>`

### Examples
- `fix/coach-train-hydration`
- `refactor/workout-open-seam`
- `feat/exercise-detail-metric-profiles`
- `ci/update-actions-runtime`

Avoid vague branch names like:
- `cleanup`
- `wip`
- `foundation`
- `misc-fixes`

---

## 5. Verification plan

Decide the proof standard before implementation.

### Use the smallest proof that is still honest

#### Seam-level behavior
Run:
- focused helper/model tests
- adjacent shell tests only if the shell owns the contract

#### User-facing screen behavior
Run:
- focused screen tests
- adjacent shell/surface tests
- runtime verification if the change is visible and important

#### Data / DB-sensitive behavior
Run:
- repository / adapter tests
- real DB verification when the task is about live truth

### Standard verification checklist
- Focused tests:
- Adjacent tests:
- Full suite, if warranted:
- Runtime verification, if warranted:
- DB verification, if warranted:

If only focused tests are being run, keep the branch narrow enough to justify that.

---

## 6. Implementation rules

### During the branch
Keep asking:
- Is this still the same branch purpose?
- Is this still the same lane?
- Am I drifting into "while I’m here" work?

### Do not bundle by default
Do not casually combine:
- app runtime changes
- CI changes
- schema/sql changes
- docs/reference dumps

### Prefer seam ownership
- shell tests own shell wiring
- seam tests own seam behavior
- repository tests own persistence behavior
- runtime verification proves real visible behavior

---

## 7. Size guardrails

Use these as default limits:

- **10 to 25 files**: ideal
- **under 40 files**: acceptable
- **40+ files**: pause and justify
- **75+ files**: split unless it is a deliberate migration or consolidation

If a branch gets too large, create follow-up PRs before opening review.

---

## 8. PR opening checklist

Before opening the PR, confirm:

- [ ] The title matches the real scope.
- [ ] The body admits the real breadth.
- [ ] The verification section matches the actual proof.
- [ ] The diff still answers one reviewer question.
- [ ] The branch has not drifted into multiple lanes.

Also run the repo checklist in [[pr-split-checklist]] or the repo copy at `docs/pr-split-checklist.md`.

---

## 9. Merge expectations under the new setup

A normal app PR should now expect:
- CI passes
- Semgrep passes
- SonarQube Cloud passes
- one approval
- resolved review conversations

That means every PR should be shaped to survive those gates, not just local intuition.

---

## 10. Reusable working template

```md
Rule
- 

Scope
- This branch changes ___ so that ___.

Lane
- [ ] shell/orchestration
- [ ] product surface
- [ ] data/repository
- [ ] CI/quality
- [ ] docs/schema/sql

Files likely touched
- 

Verification plan
- focused:
- adjacent:
- full suite:
- runtime:
- DB:

Stop and split if
- [ ] another lane appears
- [ ] the reviewer question changes
- [ ] the branch grows past ~25 files without a clear reason
- [ ] docs/CI/schema work starts piggybacking on runtime work
```

## Related
- [PR Split Checklist](./pr-split-checklist.md)
- Repo checklist: `docs/pr-split-checklist.md`
