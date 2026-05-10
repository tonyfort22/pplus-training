# PPLUS live stack audit

Audit time: 2026-05-01 02:49 to 02:50 EDT
Scope: inspection only. This audit preserved existing services and connections. No repair, restart, recreate, reset, wipe, or schema/content mutation was performed.
Workdir: `/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training`

## Executive summary

Current live reachability is mixed:
- Workspace `http://127.0.0.1:3000` was **not reachable** during this audit. Probe result was connection refused, and `lsof` showed no listener on port 3000.
- Hermes dashboard `http://127.0.0.1:9119` was **not reachable** during this audit. Probe result was connection refused, and `lsof` showed no listener on port 9119.
- Hermes gateway `http://127.0.0.1:8642` is **partially reachable as designed**. The root path returned HTTP 404, while `http://127.0.0.1:8642/health` returned HTTP 200 with `{"status": "ok", "platform": "hermes-agent"}`. `lsof` showed a live Python listener on `127.0.0.1:8642`.
- Metabase `http://127.0.0.1:3002` is **healthy**. `/` returned HTTP 200 HTML, `/api/health` returned HTTP 200 JSON, and the response headers exposed Metabase version `v0.60.3.1`.

Docker state is simple and currently limited to a single running `metabase` container using image `metabase/metabase:latest`, bound to host port `3002`, with named volume `metabase-data` mounted at `/metabase-data`. The volume is the current Metabase application metadata store and was preserved untouched.

## Read-only Metabase metadata findings

A read-only inspection of a copied Metabase app DB snapshot showed that the current Metabase state is **not empty**. It already contains PPLUS-specific content, but it does **not** match the visible source-of-truth restore manifest.

Live content found in metadata:
- collections: `5`
- cards: `49`
- dashboards: `3`
- users: `2`
- databases: `2`
- database `2` is named `postgres` and is fully synced
- schema `reporting` is present with `10` synced reporting objects

Current PPLUS content actually present:
- collection: `PPLUS Reporting`
- dashboards:
  - `PPLUS Workflow Monitor v2`
  - `PPLUS Session Anomalies`
- saved questions in `PPLUS Reporting`:
  - `Open Sessions Count`
  - `Session Status Counts`
  - `Session Starts Last 24 Hours`
  - `Coach Workflow Pressure`
  - `Athletes With Open Sessions`
  - `Recent Session Outcomes`
  - `Discarded Sessions Count`
  - `Stale In-Progress Sessions`
  - `Discards By Workout`
  - `Recent Discards Readable`

Current PPLUS dashboard layouts are also present in metadata. The `PPLUS Workflow Monitor v2` dashboard has 6 dashcards laid out across three rows. The `PPLUS Session Anomalies` dashboard has 4 dashcards laid out across two rows. So the live Metabase state already contains PPLUS collections, saved questions, dashboards, and dashboard layout data.

## Comparison to the visible restore target

The visible Conductor-chain source of truth at `dispatch-audit-source-of-truth/restore_manifest.json` expects a broader reporting structure:
- root collection `PPLUS Reporting`
- child collections `Sessions`, `Performance`, `Workload & Fatigue`, and `Ops`
- 10 source-aligned saved questions mapped directly to reporting views such as `Completed Sessions`, `Exercise Performance History`, `Session Load History`, `Muscle Fatigue Summary`, and `Coach Activity Summary`
- 4 dashboards named:
  - `PPLUS Reporting - Session Overview`
  - `PPLUS Reporting - Performance & PRs`
  - `PPLUS Reporting - Workload & Fatigue`
  - `PPLUS Reporting - Adherence & Coach Ops`

What is missing relative to that manifest:
- the 4 expected child collections are missing
- all 10 manifest-named saved questions are missing
- all 4 manifest-named dashboards are missing
- the manifest-target layouts are therefore also missing

Conclusion: the current Metabase state is partially rebuilt, not blank. It preserves the Supabase-backed `postgres` connection and reporting schema visibility, and it also already includes an ops-oriented `PPLUS Reporting` collection with 10 saved questions and 2 dashboards. However, the manifest-defined reporting structure for sessions, performance, workload/fatigue, and adherence/ops is still missing or incomplete.

## Preservation constraints

The following were preserved during this audit and should remain preserved during follow-up work unless explicitly overridden by the parent task:
- preserved: do not restart, recreate, or reconfigure the current Hermes gateway on `8642`
- preserved: do not recreate or reset the Metabase container while auditing state
- preserved: do not remove, replace, or wipe Docker volume `metabase-data`
- preserved: do not overwrite the existing Metabase app DB
- preserved: do not remove or recreate the current `postgres` database connection inside Metabase
- preserved: do not mutate the current Supabase connection or its synced `reporting` schema during audit work
- preserved: do not touch whatever process or port ownership may later restore Workspace `3000` or Hermes dashboard `9119`; this audit only observed that they were unreachable at audit time

## Exact commands used

```bash
python3 - <<'PY'
import urllib.request, json
probes = [
    ('workspace_root','http://127.0.0.1:3000'),
    ('hermes_dashboard_root','http://127.0.0.1:9119'),
    ('hermes_gateway_root','http://127.0.0.1:8642'),
    ('hermes_gateway_health','http://127.0.0.1:8642/health'),
    ('metabase_root','http://127.0.0.1:3002'),
    ('metabase_health','http://127.0.0.1:3002/api/health'),
]
for name, url in probes:
    result = {'probe': name, 'url': url}
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            body = r.read(240).decode('utf-8', 'replace')
            result.update(status=r.status, headers=dict(r.headers), body_preview=body)
    except Exception as e:
        result['error'] = str(e)
    print(json.dumps(result))
PY

lsof -nP -iTCP:3000 -iTCP:3002 -iTCP:8642 -iTCP:9119 -sTCP:LISTEN || true

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker inspect metabase --format '{{json .}}'
docker volume inspect metabase-data

docker exec metabase sh -lc 'ls -lah /metabase-data && find /metabase-data -maxdepth 3 -type f | sort'
docker logs --tail 120 metabase 2>&1

rm -rf dispatch-audit-live-state/metabase-db-copy && mkdir -p dispatch-audit-live-state

docker cp metabase:/metabase-data/metabase.db dispatch-audit-live-state/metabase-db-copy

rm -rf /tmp/metabase-db-copy-audit && mkdir -p /tmp/metabase-db-copy-audit
cp -R dispatch-audit-live-state/metabase-db-copy/. /tmp/metabase-db-copy-audit/
docker cp /tmp/metabase-db-copy-audit/. metabase:/tmp/metabase-db-copy-audit

docker exec metabase /opt/java/openjdk/bin/java -cp /app/metabase.jar \
  org.h2.tools.Shell \
  -url 'jdbc:h2:/tmp/metabase-db-copy-audit/metabase.db;ACCESS_MODE_DATA=r' \
  -user '' -password '' \
  -sql "SELECT COUNT(*) AS databases FROM METABASE_DATABASE; \
        SELECT COUNT(*) AS collections FROM COLLECTION; \
        SELECT COUNT(*) AS cards FROM REPORT_CARD; \
        SELECT COUNT(*) AS dashboards FROM REPORT_DASHBOARD; \
        SELECT COUNT(*) AS dashboard_cards FROM REPORT_DASHBOARDCARD; \
        SELECT COUNT(*) AS users FROM CORE_USER; \
        SELECT ID, NAME, ENGINE, IS_FULL_SYNC, IS_ON_DEMAND FROM METABASE_DATABASE ORDER BY ID; \
        SELECT ID, NAME, PERSONAL_OWNER_ID, LOCATION FROM COLLECTION ORDER BY ID; \
        SELECT ID, NAME, DESCRIPTION, COLLECTION_ID, ARCHIVED FROM REPORT_DASHBOARD ORDER BY ID; \
        SELECT ID, NAME, COLLECTION_ID, ARCHIVED, TYPE FROM REPORT_CARD ORDER BY ID; \
        SELECT SCHEMA, COUNT(*) AS table_count FROM METABASE_TABLE WHERE DB_ID=2 GROUP BY SCHEMA ORDER BY SCHEMA; \
        SELECT NAME, DISPLAY_NAME, SCHEMA FROM METABASE_TABLE WHERE DB_ID=2 AND SCHEMA='reporting' ORDER BY NAME; \
        SELECT ID, EMAIL, IS_SUPERUSER, DATE_JOINED FROM CORE_USER ORDER BY ID;"

docker exec metabase /opt/java/openjdk/bin/java -cp /app/metabase.jar \
  org.h2.tools.Shell \
  -url 'jdbc:h2:/tmp/metabase-db-copy-audit/metabase.db;ACCESS_MODE_DATA=r' \
  -user '' -password '' \
  -sql "SELECT d.ID AS dashboard_id, d.NAME AS dashboard_name, dc.ID AS dashcard_id, c.NAME AS card_name, dc.COL, dc.\"ROW\", dc.SIZE_X, dc.SIZE_Y FROM REPORT_DASHBOARDCARD dc JOIN REPORT_DASHBOARD d ON d.ID = dc.DASHBOARD_ID LEFT JOIN REPORT_CARD c ON c.ID = dc.CARD_ID ORDER BY d.ID, dc.\"ROW\", dc.COL, dc.ID;"
```

## Verification

This audit wrote fresh artifacts to:
- `dispatch-audit-live-state/report.md`
- `dispatch-audit-live-state/state.json`

The temporary copied Metabase DB snapshot used for read-only inspection was removed after extraction so the durable audit artifacts remain the report and state JSON only.

No healthy Metabase connection or Docker persistence layer was modified.
