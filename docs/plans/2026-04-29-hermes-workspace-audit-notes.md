# Hermes Workspace Audit Notes

**Date:** 2026-04-29
**Context:** pre-rebuild audit after failed workspace customization and chat sync issues

---

## Executive summary

The current Hermes Workspace situation is split across multiple layers and at least two divergent app directories.

The most likely causes of the "chats not synchronized" problem are:

1. **two separate workspace app repos exist**
2. **both repos have large uncommitted divergences**
3. **session APIs explicitly merge gateway sessions with local sessions**
4. **session history can resolve from a local in-memory/local store before gateway truth**
5. **workspace path selection can come from stale localStorage**
6. **the Hermes gateway is healthy, but the dashboard service is not running**

This means the bad behavior is probably not one bug. It is a stacked-state problem.

---

## Path audit

### 1. Hermes runtime layer
- `~/.hermes` exists
- gateway health endpoint is live at `http://127.0.0.1:8642/health`
- Hermes memories live under `~/.hermes/memories/`
- Hermes source repo also exists under `~/.hermes/hermes-agent`

### 2. Workspace app repo A
- path: `~/hermes-workspace`
- git branch: `branding/white-label-v1`
- remote: `https://github.com/outsourc-e/hermes-workspace.git`
- state: heavily modified, with branding and UI changes plus untracked files

### 3. Workspace app repo B
- path: `~/hermes-workspace-app`
- git branch: `main`
- remote: `https://github.com/outsourc-e/hermes-workspace.git`
- state: also heavily modified, with major feature and UI divergence

### 4. Legacy/archive layer
- `.openclaw.pre-migration/workspace` exists
- should remain reference only

---

## Service audit

### Healthy
- Hermes gateway/API: `127.0.0.1:8642`
  - response: `{"status": "ok", "platform": "hermes-agent"}`

### Not healthy / not running
- Hermes dashboard expected at `127.0.0.1:9119`
  - connection failed

### Unexpected listener
- port `3000` is occupied by Docker Desktop, not confirmed to be Hermes Workspace

This matters because it increases the chance that the wrong local app was being opened or tested.

---

## Evidence for sync/state confusion

### A. Session list merges two sources
In `~/hermes-workspace/src/routes/api/sessions.ts`:
- gateway sessions are loaded first
- then `listLocalSessions()` is merged in
- local sessions are added when their ids are not already in gateway results

That means the UI session list is not pure gateway truth.
It is a hybrid of:
- Hermes gateway sessions
- local portable sessions

This alone can make the app feel out of sync.

### B. Session history can prefer local store
In `~/hermes-workspace/src/routes/api/session-history.ts`:
- the route checks `getLocalSession(key)` first
- if found, it returns local messages immediately
- only otherwise does it ask the gateway for session messages

That means the conversation content can come from a local store instead of the live Hermes gateway session history.

### C. Workspace path can come from localStorage
In `~/hermes-workspace/src/routes/api/workspace.ts`:
- saved path from localStorage has top priority
- only after that does it fall back to env/default detection

That means a stale saved workspace path can steer the UI to the wrong folder even when the underlying Hermes setup is correct.

### D. Last active session is also stored client-side
The app stores and restores `hermes-last-session` in localStorage.
That is not automatically bad, but in a mixed-state setup it adds another place where stale client state can override the expected current session.

---

## Main diagnosis

The workspace is not just "badly styled".
It has **state-boundary corruption**.

The core problem looks like this:

- two divergent frontend repos
- local UI persistence
- local session store fallback
- gateway session source
- missing dashboard service
- likely inconsistent launch target

All of that makes it easy for the UI to show:
- the wrong session list
- the wrong conversation history
- stale workspace path
- stale selected session
- a frontend that looks customized but is not grounded on one clean backend path

---

## Rebuild recommendation

Do **not** try to repair this in place first.

Recommended path:

1. preserve both current app directories as reference states
2. pick one clean target path for the rebuilt real Hermes Workspace app
3. do not let localStorage-selected workspace paths drive the rebuild assumptions
4. stand up the real app against the healthy gateway first
5. only add dashboard wiring if the app truly needs it and the dashboard is actually running
6. disable or at least scrutinize hybrid local-session merging during rebuild validation
7. validate chat/session behavior against gateway truth before reapplying any branding or UI changes

---

## Suggested preservation model

- keep `~/hermes-workspace` as archived branded attempt
- keep `~/hermes-workspace-app` as archived alternate branch/app attempt
- build the fresh workspace into a new clean target path after explicit confirmation

Possible naming pattern:
- `~/hermes-workspace-archive-branding-2026-04-29`
- `~/hermes-workspace-app-archive-2026-04-29`
- fresh install into one canonical path only

---

## What should happen next

### Phase 1
Preserve both current workspace app folders.

### Phase 2
Choose one canonical fresh app path.

### Phase 3
Install the real Hermes Workspace app cleanly.

### Phase 4
Verify:
- correct app identity
- correct backend URL
- sessions list from expected source
- session history from expected source
- no stale local path hijacking

### Phase 5
Only after sync is proven, re-apply any branding or UI customization.

---

## Bottom line

Yes, the workspace is messed up.
But the good news is the runtime foundation is not totally dead.

The Hermes gateway is alive.
The mess is mostly in the workspace app layer and how it is mixing sources of truth.

That means a clean rebuild is the right move, not more patching on top of this pile.
