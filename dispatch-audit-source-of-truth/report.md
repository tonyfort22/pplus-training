# PPLUS Reporting source-of-truth audit

## Scope
This audit uses repo-visible artifacts only. It does not rely on live Metabase state, browser storage, local machine config outside the repo, or memory of prior UI state.

## Executive summary
The strongest recoverable source of truth for the lost **PPLUS Reporting** structure is the SQL reporting layer in `docs/sql/apply-metabase-reporting-layer.sql`, backed by the narrower earlier slice in `docs/sql/apply-metabase-analytics-views.sql`. Those files prove the reporting schema name, the exact reporting-view inventory, the lineage tables, the intended read-only Metabase access pattern, and the fact that most workload and muscle reporting is intentionally limited to completed sessions.

Repo-visible Conductor-chain artifacts add the strongest available naming evidence for the Metabase content layer. `dispatch-rebuild-metabase-reporting/restore_metabase_reporting.py` and `dispatch-rebuild-metabase-reporting/report.md` prove the root collection name `PPLUS Reporting`, confirm use of Metabase database id `2`, and show one prior restore path under that collection. `dispatch-repo-audit/repo-audit.md` is the strongest repo-visible consolidation for the missing workload and fatigue content names. It records the target child collections `PPLUS Reporting / Sessions`, `PPLUS Reporting / Performance`, `PPLUS Reporting / Workload & Fatigue`, and `PPLUS Reporting / Ops`, plus the workload saved questions `Session Load History`, `Muscle Load Event History`, and `Muscle Fatigue Summary`, and the dashboard reference `PPLUS Reporting - Workload & Fatigue`.

There is still one major gap: no repo-visible Metabase export, dashboard serialization, or app-metadata dump proves the exact original card visualization settings, filter widgets, dashcard positions, or every historical question name. Because of that, this audit separates hard facts from inferred restore targets.

## Hard facts recovered from repo-visible artifacts

### 1) Canonical reporting SQL
Primary file: `docs/sql/apply-metabase-reporting-layer.sql`

What it proves:
- the schema is `reporting`
- the purpose is a read-optimized reporting layer for Metabase and internal analytics dashboards
- the file is meant to be safe to rerun with `create schema if not exists` and `create or replace view`
- the intended Metabase reader role is `metabase_reader`
- Metabase should prefer Supabase Session pooler connectivity unless direct connection is specifically needed

### 2) Exact reporting-view inventory
The primary SQL file explicitly defines these ten views:
1. `reporting.completed_session_summary`
2. `reporting.discarded_session_summary`
3. `reporting.exercise_completion_history`
4. `reporting.exercise_performance_history`
5. `reporting.pr_events`
6. `reporting.session_load_history`
7. `reporting.muscle_load_event_history`
8. `reporting.muscle_fatigue_summary`
9. `reporting.athlete_adherence_summary`
10. `reporting.coach_activity_summary`

The earlier file `docs/sql/apply-metabase-analytics-views.sql` independently confirms the workload-and-fatigue subset:
- `reporting.session_load_history`
- `reporting.muscle_load_event_history`
- `reporting.muscle_fatigue_summary`

That makes the workload and fatigue slice the best-proven part of the lost reporting structure.

### 3) Required source tables and semantics
The SQL files show that the reporting layer depends on tables including:
- `public.workout_sessions`
- `public.workout_session_exercises`
- `public.workout_session_sets`
- `public.session_load_summaries`
- `public.exercise_performance_snapshots`
- `public.muscle_load_events`
- `public.muscles`
- `public.sub_muscles`
- `public.program_workouts`
- `public.program_workout_exercises`
- `public.program_workout_sets`
- `public.program_workout_display_states`

The SQL logic also shows a stable semantic rule: the session, workload, and muscle views mostly filter to completed sessions with `ws.status = 'completed'`. That behavior is part of the source of truth and should survive any rebuild.

### 4) Repo-visible Metabase naming evidence
`dispatch-rebuild-metabase-reporting/restore_metabase_reporting.py` proves:
- Metabase base URL assumption: `http://127.0.0.1:3002`
- preserved database id assumption: `2`
- root collection name: `PPLUS Reporting`

`dispatch-rebuild-metabase-reporting/report.md` proves that `PPLUS Reporting` was used as the restore collection name in a repo-visible restore flow.

`dispatch-repo-audit/repo-audit.md` is the strongest repo-visible consolidation for the missing workload-and-fatigue presentation layer. It records these restore targets:
- child collections: `PPLUS Reporting / Sessions`, `PPLUS Reporting / Performance`, `PPLUS Reporting / Workload & Fatigue`, `PPLUS Reporting / Ops`
- saved questions: `Session Load History`, `Muscle Load Event History`, `Muscle Fatigue Summary`
- dashboard reference: `PPLUS Reporting - Workload & Fatigue`

## Inferred restore targets
These are not proven by a Metabase export. They are the safest restore targets implied by the repo-visible chain.

### Collections
- Known: `PPLUS Reporting`
- Strong inference: domain child collections for Sessions, Performance, Workload & Fatigue, and Ops

### Saved questions
- High confidence for workload/fatigue names because they are explicitly preserved in `dispatch-repo-audit/repo-audit.md`
- Medium confidence for a one-question-per-view pattern across all ten reporting views, because the SQL inventory is complete but exact historical question names are not fully exported

### Dashboards
- Known from repo-visible restore evidence: `PPLUS Workflow Monitor v2` and `PPLUS Session Anomalies` existed under `PPLUS Reporting`, but those are operational dashboards and not the best source of truth for the lost workload/fatigue structure
- Strong inference for the analytics restore target: `PPLUS Reporting - Workload & Fatigue`
- Medium inference for the broader dashboard family: session, performance/PR, workload/fatigue, and ops/adherence splits that mirror the ten-view SQL inventory

### Layout guidance
No repo-visible dashcard serialization was recovered. Layout can only be restored at intent level:
- summary views belong above drilldown tables
- workload trends should sit above raw muscle-load event history
- performance and PR summaries should lead performance dashboards
- adherence and coach activity naturally pair side by side

## Recommended restore posture
Treat `docs/sql/apply-metabase-reporting-layer.sql` as the canonical schema source of truth. Use `docs/sql/apply-metabase-analytics-views.sql` as a backup proof for the workload-and-fatigue slice. Preserve `PPLUS Reporting` as the root collection. Restore the workload-and-fatigue naming exactly where repo-visible evidence is strongest: `PPLUS Reporting / Workload & Fatigue`, `Session Load History`, `Muscle Load Event History`, `Muscle Fatigue Summary`, and `PPLUS Reporting - Workload & Fatigue`.

For the rest of the Metabase structure, restore by direct mapping from the ten reporting views unless a stronger export or metadata snapshot appears later. That keeps known facts separate from inferred rebuild choices while preserving the clearest repo-visible source of truth.