# Hermes Workspace Rebuild Plan

> **For Hermes:** Execute this with the multi-agent team. Use the `workspace-ops-worker` for path audit and rebuild work. Use the `qa-runtime-verifier` for service and browser smoke checks. Keep PPLUS product work out of this lane unless explicitly required.

**Goal:** Rebuild Hermes Workspace from scratch in a clean, controlled way without damaging the PPLUS repo, the Hermes memory layer, or any existing notes/vault content that still matters.

**Architecture:** Separate three things that got mixed together before: the real Hermes Workspace app, the Hermes runtime and memory layer, and any optional Obsidian-style vault layer. Preserve first, rebuild second, verify third.

**Tech Stack:** Hermes Agent local install, Hermes gateway, Hermes dashboard if required, Hermes Workspace app repo, optional Obsidian vault layer, local browser verification.

---

## 1. Non-negotiable rebuild rules

1. Do not substitute Mission Control.
2. Do not overwrite any existing `hermes-workspace` path before auditing it.
3. Do not assume a notes vault and the app repo are the same thing.
4. Preserve ambiguous or legacy content before rebuilding.
5. Confirm the PPLUS repo remains untouched after every major rebuild step.
6. Verify backend health before blaming the frontend.

---

## 2. Rebuild target model

At the end of the rebuild we want:

### A. Hermes runtime layer
- Hermes itself still lives under the normal Hermes home
- live memory remains under `~/.hermes/memories/`
- gateway and dashboard are verifiably healthy

### B. Hermes Workspace app layer
- real Hermes Workspace app lives in its own clean repo folder
- app env points at the correct local Hermes backend URLs
- app boots and shows Hermes Workspace, not some unrelated dashboard

### C. Optional vault layer
- if Anthony wants an Obsidian-style workspace, it is explicit and separate
- vault notes do not masquerade as the app repo
- app repo does not become a dumping ground for vault notes

---

## 3. Team assignments

## Orchestrator
- owns sequencing
- decides when the rebuild can move to the next phase
- blocks any accidental overlap with PPLUS product work

## Workspace / Ops Worker
- audits paths
- preserves old content
- sets up the fresh workspace app
- verifies service wiring

## QA / Runtime Verifier
- checks service health
- checks browser title and onboarding
- confirms the app is really reachable
- confirms we did not silently break unrelated repos

## Reviewer / Judge
- optional if the rebuild involves script/config edits beyond straightforward setup

---

## 4. Phase A: Audit before touching anything

**Objective:** Figure out what exists right now and separate app, vault, and junk.

### Step A1: Inspect candidate paths
Check:
- current Hermes home
- any existing `~/hermes-workspace` path
- any existing vault-style folders
- any old OpenClaw-era workspace folders that could confuse the rebuild

### Step A2: Classify each path
For each candidate, determine:
- real app repo
- notes/vault content
- archived reference material
- broken partial install

### Step A3: Record the audit
Create a small audit note with:
- path
- type
- keep / move / archive decision
- risk level

**Exit condition:** no path remains ambiguous.

---

## 5. Phase B: Preserve first

**Objective:** Make sure we can rebuild without losing anything useful.

### Step B1: Preserve non-app content
If `hermes-workspace` is actually a notes/vault folder or mixed junk:
- move it to a clearly labeled backup or archive path
- do not delete first

### Step B2: Preserve any meaningful workspace docs
If there are useful setup notes or operating docs, archive them separately from the new app repo.

### Step B3: Verify PPLUS repo still untouched
Check git status and path integrity for:
- `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training`

**Exit condition:** backups exist and unrelated repos are still cleanly accounted for.

---

## 6. Phase C: Fresh Hermes Workspace app install

**Objective:** Stand up the real app in a clean folder.

### Step C1: Create clean app location
Use a dedicated repo path for the real Hermes Workspace app.

### Step C2: Install dependencies
- clone or reset the real app repo
- install dependencies
- copy env example if needed

### Step C3: Wire backend URLs
At minimum verify:
- `HERMES_API_URL=http://127.0.0.1:8642`
- dashboard URL if the app expects one

### Step C4: Verify Hermes backend health
Check the gateway or API health endpoint before judging UI behavior.

### Step C5: Start required services only
- Hermes gateway if needed
- Hermes dashboard if needed
- Hermes Workspace app

**Exit condition:** services are running and reachable locally.

---

## 7. Phase D: Optional vault layer repair

**Objective:** Reattach the notes layer only if Anthony still wants it.

### Step D1: Keep Hermes memory canonical
Hermes-managed memory stays in:
- `~/.hermes/memories/MEMORY.md`
- `~/.hermes/memories/USER.md`

### Step D2: Keep optional daily-note layer explicit
If using the Obsidian-style layer:
- daily notes folder stays explicit
- templates stay explicit
- vault config stays separate from the app repo

### Step D3: Repair links and config
Only if the vault is intentionally part of the setup:
- repair daily note config
- repair template config
- ensure no broken OpenClaw-only assumptions remain

**Exit condition:** app layer and vault layer are no longer confused with each other.

---

## 8. Phase E: Browser and runtime smoke test

**Objective:** Prove the rebuild is real and not fake-good.

### Step E1: Browser verification
Confirm:
- the title and onboarding belong to Hermes Workspace
- it is not Mission Control
- backend connection path is correct

### Step E2: Local access verification
Confirm the local app URL responds correctly.

### Step E3: Optional phone access verification
If Anthony wants mobile access again, verify LAN or Tailscale reachability after local success.

### Step E4: Final unrelated-repo verification
Re-check that PPLUS and other unrelated project folders remain untouched.

**Exit condition:** app is visibly correct, reachable, and connected to the right backend.

---

## 9. Failure handling

If the rebuild hits trouble:

### Case 1: backend unhealthy
- stop UI debugging
- fix gateway/dashboard health first

### Case 2: path confusion
- stop install work
- finish classification and preservation first

### Case 3: UI opens but looks wrong
- verify repo and app identity
- verify env wiring
- verify we did not launch the wrong local project

### Case 4: PPLUS repo touched unexpectedly
- stop rebuild work immediately
- inspect changes
- restore intended boundaries before continuing

---

## 10. Deliverables from the rebuild

At completion, report back with:
- preserved old path(s)
- final app repo path
- final local URL
- backend URLs used
- whether optional vault layer was reattached
- confirmation that PPLUS repo was not modified as part of the rebuild

---

## 11. Immediate execution order once rebuild starts

1. audit current workspace-related paths
2. classify app vs vault vs archive
3. preserve ambiguous content
4. verify PPLUS repo untouched
5. install fresh Hermes Workspace app
6. verify Hermes backend health
7. launch app
8. browser smoke test
9. optional vault reattachment
10. final verification and report

---

## 12. Recommendation

Do the rebuild in one controlled lane with the new team model.
No side quests, no mixed product fixes, no freestyle dashboard swapping.

That is how we avoid ending up back in the same mess.