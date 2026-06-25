# Running the full web gate locally

This is the local equivalent of the three web GitHub Actions jobs:

- `web-source-api-tests`
- `web-build`
- `web-browser-smoke`

Run it from the repo root.

## 0. Install exactly what CI installs

```bash
pnpm install --frozen-lockfile
```

CI runs Node 22. Local newer Node versions can print the non-blocking `MODULE_TYPELESS_PACKAGE_JSON` warning during source tests. That warning is expected until `apps/web/package.json` declares a module type.

## 1. Source/API web gate

```bash
pnpm test:web
```

This delegates to `apps/web/testing/run-web-tests.js`, which runs the `FULL_WEB_SOURCE_API_TESTS` command group from `apps/web/testing/page-test-manifest.js`.

Expected shape:

- command: `node --test ...`
- layer: `L7_CI_GATE`
- includes public, admin auth, admin shell, dashboard, athletes, groups, rankings, programs, workouts, exercises, support, and settings source/API tests

If this fails, fix the named failing test or explicitly call out stale source-test blockers. Do not treat a partial subgroup pass as the full gate.

## 1a. Route/layer coverage summary

```bash
pnpm test:web:coverage
```

This prints the manifest coverage summary generated from `getWebPageCoverageSummary()`:

- route count, layer count, route-layer mapping count, and unique route-mapped test files
- every route with area, auth state, layers, and mapped test-file count
- every layer with route count, unique mapped test-file count, and covered route list

Use `node apps/web/testing/coverage-summary.js --json` when a machine-readable artifact is needed.

## 2. Web build gate

```bash
pnpm --dir apps/web build
```

This is the same command CI runs in the `web-build` job.

Important local check:

- The build should not require `apps/web/.env.local` or GitHub-only secrets.
- If you are proving PR readiness, temporarily hide `apps/web/.env.local` and unset local Supabase/admin/Loops env before running the build.
- Do not paste or log secrets from `.env.local`.

## 3. Browser smoke gate

CI runs the browser harness as a list/discovery gate with setup and teardown around it:

```bash
pnpm test:web:browser:fixtures:setup
pnpm test:web:browser
pnpm test:web:browser:fixtures:teardown
```

`pnpm test:web:browser` currently delegates to `apps/web/testing/run-browser-tests.js --list`, so it proves Playwright harness discovery without requiring live route execution.

Always run teardown, even when setup or browser discovery fails:

```bash
pnpm test:web:browser:fixtures:teardown
```

If you run live Playwright specs instead of the CI list gate, start a dev or preview server, set `PPLUS_WEB_PREVIEW_ORIGIN` when not using `http://127.0.0.1:3000`, then clean artifacts afterward.

Failure artifacts live under:

```text
apps/web/test-results
```

Clean that directory before final handoff unless you intentionally need to preserve artifacts for debugging.

## One copy/paste local sequence

```bash
pnpm install --frozen-lockfile
pnpm test:web
pnpm --dir apps/web build
pnpm test:web:browser:fixtures:setup
pnpm test:web:browser
pnpm test:web:browser:fixtures:teardown
```

If the browser setup command fails partway through, still run:

```bash
pnpm test:web:browser:fixtures:teardown
```

## What to report

For a clean local gate, report:

- `pnpm test:web`: pass/fail totals from Node test output
- `pnpm --dir apps/web build`: build success/failure and any route/page-data blocker
- `pnpm test:web:browser`: listed test count or failing Playwright harness error
- whether `apps/web/test-results` was cleaned
- any non-blocking warnings, especially `MODULE_TYPELESS_PACKAGE_JSON`
