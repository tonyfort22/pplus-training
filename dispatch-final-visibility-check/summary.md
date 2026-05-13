# PPLUS final visibility check

## Executive conclusion
The rebuilt Metabase reporting structure is live inside the preserved Metabase instance and the visible Conductor-chain restore is largely successful. The root collection `PPLUS Reporting` is present, the four required child collections are present, the four required reporting dashboards are present, and ten new reporting questions were created against the preserved Metabase database connection `postgres` with database id `2`. The reporting schema is still visible with all ten expected reporting objects, which confirms the Supabase-backed connection survived the rebuild and remained queryable.

The final live service check also confirms that the rebuild did not disturb the surrounding stack. Metabase on `127.0.0.1:3002` is healthy and Hermes gateway on `127.0.0.1:8642/health` is healthy. Workspace on `127.0.0.1:3000` and Hermes dashboard on `127.0.0.1:9119` remain unreachable, but that is not a regression introduced by the rebuild. Both were already unhealthy during the earlier audit and were preserved by non-interference only.

## What was restored
- restored root collection: `PPLUS Reporting` (existing id `5`, preserved and reused)
- restored child collections created under the root:
  - `PPLUS Reporting / Sessions` (id `6`)
  - `PPLUS Reporting / Performance` (id `7`)
  - `PPLUS Reporting / Workload & Fatigue` (id `8`)
  - `PPLUS Reporting / Ops` (id `9`)
- restored dashboards created under `PPLUS Reporting`:
  - `PPLUS Reporting - Sessions` (id `4`)
  - `PPLUS Reporting - Performance & PRs` (id `5`)
  - `PPLUS Reporting - Workload & Fatigue` (id `6`)
  - `PPLUS Reporting - Adherence & Coach Ops` (id `7`)
- restored saved questions created against the preserved `reporting` schema:
  - `Completed Sessions` from `reporting.completed_session_summary`
  - `Discarded Sessions` from `reporting.discarded_session_summary`
  - `Exercise Completion History` from `reporting.exercise_completion_history`
  - `Exercise Performance History` from `reporting.exercise_performance_history`
  - `PR Events` from `reporting.pr_events`
  - `Session Load History` from `reporting.session_load_history`
  - `Muscle Load Event History` from `reporting.muscle_load_event_history`
  - `Muscle Fatigue Summary` from `reporting.muscle_fatigue_summary`
  - `Athlete Adherence Summary` from `reporting.athlete_adherence_summary`
  - `Coach Activity Summary` from `reporting.coach_activity_summary`

## Relative to the manifest
The collection hierarchy matches the manifest exactly at the root and child-collection level. The dashboard set also matches the manifest exactly for the four `PPLUS Reporting - ...` dashboards. At the saved-question level, eight manifest names were restored exactly. Two session questions were restored with shorter names than the manifest used:
- manifest `Completed Session Summary` became restored `Completed Sessions`
- manifest `Discarded Session Summary` became restored `Discarded Sessions`

Those two items still point at the expected source views, live in the expected `PPLUS Reporting / Sessions` collection, and execute successfully, so this is a naming mismatch rather than a missing-structure problem.

## Preserved connections and services
The preserved Metabase connection is still database id `2`, name `postgres`, engine `postgres`, host `aws-1-us-east-2.pooler.supabase.com`, SSL enabled. It still exposes the ten expected reporting objects: `completed_session_summary`, `discarded_session_summary`, `exercise_completion_history`, `exercise_performance_history`, `pr_events`, `session_load_history`, `muscle_load_event_history`, `muscle_fatigue_summary`, `athlete_adherence_summary`, and `coach_activity_summary`.

The rebuild also preserved pre-existing PPLUS operational content already living under `PPLUS Reporting`, specifically dashboards `PPLUS Workflow Monitor v2` and `PPLUS Session Anomalies`, plus the ten earlier ops-oriented saved questions. No metadata wipe, container recreation, volume replacement, or connection replacement was performed.

Current preserved service state:
- `workspace` on port 3000: still unreachable, connection refused, no listener detected
- `hermes_dashboard` on port 9119: still unreachable, connection refused, no listener detected
- `hermes_gateway` on port 8642: reachable on `/health` with HTTP 200
- `metabase` on port 3002: reachable on `/api/health` with HTTP 200, container `metabase` still running

## Remaining gaps
There is no remaining gap in the manifest-defined high-level structure for root collection, child collections, or dashboard inventory. The remaining issues are narrower:
1. Two session question names do not exactly match the manifest wording, even though their source views and placement do match.
2. The visible repo artifacts did not include a historical Metabase export, so original visualization settings, dashboard filters, and exact historical formatting are still not provable from the visible chain.
3. Workspace and Hermes dashboard remain unhealthy, but they were already unreachable before the rebuild and were preserved rather than changed.

## Verification basis
This final check used the earlier live audit, the source-of-truth manifest, the rebuild report and restore result, plus a fresh live probe that reconfirmed current health for ports 3002 and 8642 and reconfirmed the pre-existing failures on ports 3000 and 9119.
