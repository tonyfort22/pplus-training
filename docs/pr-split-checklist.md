# PR Split Checklist

Use this before opening a branch, before the first big commit, and again before opening a PR.

## 1. One-sentence purpose
Finish this sentence cleanly:

> This PR changes ___ so that ___.

If you need "and" more than once, split the work.

## 2. Pick one lane only
Choose the main lane for the branch:

- [ ] Shell/orchestration refactor
- [ ] Product surface behavior
- [ ] Data/repository layer
- [ ] CI/quality gates
- [ ] Docs/schema/sql/reference artifacts

If files from 3 or more lanes start showing up, stop and split.

## 3. Check file families before the first commit
Ask which family the branch is really about:

- `apps/mobile/App.js` + `apps/mobile/src/train/*`
- `apps/mobile/src/screens/*`
- `packages/data/*`
- `.github/*`, `semgrep.yml`, `sonar-project.properties`
- `docs/*`, `infra/*`

If the answer is "a bit of everything," the branch is drifting.

## 4. Keep runtime code and docs separate by default
Do not bundle these together unless absolutely necessary:

- runtime product code
- CI config
- schema/sql
- planning docs
- extracted references

## 5. Decide the source of truth for behavior
Before coding, decide what owns the truth:

- [ ] Shell wiring test
- [ ] Seam/helper test
- [ ] Repository/data test
- [ ] Runtime proof
- [ ] DB proof

This keeps shell tests from over-pinning implementation details.

## 6. Define verification scope up front
Write down the checks you expect to run:

- Focused tests:
- Adjacent tests:
- Full suite:
- Runtime verification:
- DB verification:

If you are only doing focused tests, keep the PR narrow enough to match that claim.

## 7. Use size guardrails
Pause and reassess when the branch gets large:

- ~25 files: review scope
- ~40 files: probably split
- ~75+ files: almost certainly too broad unless it is a deliberate migration or consolidation

## 8. Watch for hard split triggers
Open a new branch/PR if any of these happen:

- "while I’m here"
- adding CI files to a product fix
- adding docs/reference dumps to runtime work
- touching auth + analytics + data + tests in one pass
- changing branch purpose mid-stream

## 9. Ask the reviewer question
Would one reviewer reasonably answer one of these?

- Is this shell refactor safe?
- Is this analytics behavior correct?
- Is this CI setup right?
- Is this schema update valid?

If the reviewer would need to answer all of them, split the work.

## 10. PR body honesty check
Before opening the PR:

- [ ] Does the title match the real diff?
- [ ] Does the summary admit the real breadth?
- [ ] Does verification match the actual changed surface?

If not, fix the branch or fix the PR story.

---

## Related

- [Branch and PR Workflow](./branch-pr-workflow.md)

## Quick reusable template

```md
PR split check

1. One sentence purpose:
   This PR changes ___ so that ___.

2. Lane:
   [ ] shell/orchestration
   [ ] product surface
   [ ] data/repository
   [ ] CI/quality
   [ ] docs/schema/sql

3. Source of truth:
   [ ] shell test
   [ ] seam/helper test
   [ ] repository test
   [ ] runtime proof
   [ ] DB proof

4. Verification plan:
   - focused:
   - adjacent:
   - full suite:
   - runtime:
   - DB:

5. Stop and split if:
   [ ] >25 files and still growing
   [ ] touching 3+ file families
   [ ] bundling docs + runtime + CI
   [ ] PR title no longer matches actual diff
```
