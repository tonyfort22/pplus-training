export const staleNextPreviewRecoveryProcedure = Object.freeze({
  trigger: 'local preview serves broken _next chunks or module errors',
  failureSignals: Object.freeze([
    'ChunkLoadError or Loading chunk failed in served HTML/browser output',
    'Cannot find module from .next/server, app-page, chunks, vendor-chunks, or webpack-runtime',
    'CSS or JS under /_next/static returns 400, 404, or 500 while the route HTML still loads',
  ]),
  resetSteps: Object.freeze([
    'confirm the preview port owner with lsof before killing anything',
    'kill the stale next dev/start listener for the preview port',
    'remove apps/web/.next completely',
    'rebuild with pnpm --dir apps/web build',
    'restart the preview from the current repo/app state',
    'verify the route and referenced /_next/static assets over HTTP before trusting the browser',
  ]),
  commands: Object.freeze([
    'lsof -iTCP:<port> -sTCP:LISTEN -n -P',
    'kill <pid>',
    'rm -rf apps/web/.next',
    'pnpm --dir apps/web build',
    'pnpm --dir apps/web exec next start -H 127.0.0.1 -p <port>',
  ]),
})
