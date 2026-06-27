# Mobile runner notes

## Source/model gate

Run the full mobile source/model gate from the repo root:

```bash
pnpm test:mobile
```

The runner writes the real recorded output artifact to:

```text
apps/mobile/testing/pnpm-test-mobile-output.txt
```

## Expo runtime/startup proof

Source tests are not Expo runtime proof. For Phase 8 runtime/startup verification, start Expo from the repo root with the canonical clear-cache LAN command:

```bash
pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear
```

Run that command through a tracked process manager, not a loose shell background command. In Hermes, start it with `terminal(background=true, pty=true)` so the Expo/Metro session has a `session_id`, can be polled, and can be killed cleanly after proof. Do not use `&`, `nohup`, `disown`, or a short-lived foreground shell that exits and leaves Expo Go pointing at a dead `exp://...:8084` target.

Use the tracked process output as the explicit startup proof when checking that Metro can boot the mobile app on the expected home/simulator lane. Treat `Metro waiting on exp://...:8084` as startup readiness only, not simulator or UI proof.

After the tracked process prints the ready line, prove readiness with a real Expo/Metro probe. Check the listener, HTTP root, and served iOS bundle:

```bash
lsof -nP -iTCP:8084 -sTCP:LISTEN
curl -I http://127.0.0.1:8084
python3 - <<'PY'
from urllib.request import urlopen
url='http://127.0.0.1:8084/apps/mobile/index.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable'
with urlopen(url, timeout=45) as r:
    print(r.status)
    print(r.read(180).decode('utf-8','ignore'))
PY
```

A valid probe shows port `8084` listening, HTTP `200`, and bundle text that starts with Metro JavaScript such as `var __BUNDLE_START_TIME__`. Do not count a QR code or `Metro waiting on ...` alone as the real probe.

After the readiness probe and any separate UI proof are complete, stop the tracked Expo/Metro process. In Hermes, use `process(action='kill', session_id='<session_id>')`, then verify cleanup with `process(action='poll', session_id='<session_id>')` and `lsof -nP -iTCP:8084 -sTCP:LISTEN || true`. Do not leave Metro/Expo running after verification unless the user explicitly asks for a live dev server.

## Proof boundaries

Report Metro readiness separately from UI proof.

Metro readiness means the tracked Expo/Metro process is alive, the `8084` listener responds, and the iOS bundle probe returns Metro JavaScript. It is L3 runtime/startup proof only.

UI proof means a separate simulator, phone, screenshot, or Maestro flow actually opened the app and verified a named screen or workflow. Do not describe Metro ready, QR ready, or bundle ready as UI proof. When both are present, report them as separate bullets.

## Maestro simulator/device proof

Run Maestro against a named simulator/device by resolving the booted device name to its UDID first. Maestro's `--device` / `--udid` flag expects an ID, not a friendly simulator name.

For the default local simulator lane, use `iPhone 17 Pro`:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"
MAESTRO_DEVICE_NAME="iPhone 17 Pro"
MAESTRO_DEVICE_UDID="$(xcrun simctl list devices booted | awk -v name="$MAESTRO_DEVICE_NAME" '$0 ~ name && $0 ~ /Booted/ { match($0, /\([0-9A-F-]+\)/); if (RSTART) { print substr($0, RSTART + 1, RLENGTH - 2); exit } }')"
test -n "$MAESTRO_DEVICE_UDID"
mkdir -p apps/mobile/testing/artifacts/bottom_tab_navigation_seeded
maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-junit.xml --debug-output apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-debug maestro/bottom-tab-navigation-smoke.yaml 2>&1 | tee apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-console.log
xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/screenshot.png
```

Save Maestro proof under the known scenario artifact path:

```text
apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/
```

Required files for a completed smoke:

```text
apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-junit.xml
apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-console.log
apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/maestro-debug/
apps/mobile/testing/artifacts/bottom_tab_navigation_seeded/screenshot.png
```

Report both the friendly device name and resolved UDID in the proof. If multiple simulators are booted, keep the named-device resolution explicit instead of letting Maestro pick whichever target happens to be first. Do not report simulator proof green until the JUnit, console log, debug folder, and screenshot exist under the known artifact path.

Artifact retention policy: clean passing smoke artifacts after proof is recorded, but retain failure artifacts and report the retained scenario path. If a smoke fails, leave `apps/mobile/testing/artifacts/<scenario_id>/` in place with JUnit, console log, debug output, and any screenshot that was captured. If a smoke passes, remove the scenario folder before the final report:

```bash
rm -rf apps/mobile/testing/artifacts/bottom_tab_navigation_seeded
```

The final report must say either `Artifacts cleaned: <scenario path>` or `Failure artifacts retained: <scenario path>`.

## Stale cache recovery

When Expo Go shows stale UI, a stale red screen, old bundle behavior, or a resolver/runtime error that does not match the current source, recover the Metro lane with the canonical clear-cache command:

```bash
pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear
```

Use the same tracked-process rule for stale cache recovery: start it with Hermes `terminal(background=true, pty=true)`, keep the `session_id`, and rerun the real Expo/Metro readiness probe before sending the app back to a phone or simulator. Do not use the warm path for stale cache recovery.

If you intentionally want the faster warm path after the clear-cache proof has already passed and there is no stale-cache symptom, use:

```bash
pnpm --dir apps/mobile dev:warm
```

Do not replace the explicit startup proof or stale-cache recovery path with the warm path in Phase 8 notes.
