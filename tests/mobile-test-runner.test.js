import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  FULL_MOBILE_SOURCE_TESTS,
  MOBILE_RUNNABLE_TEST_GROUPS,
} from '../apps/mobile/testing/mobile-surface-manifest.js'
import {
  MOBILE_TEST_RUNNER_DEFAULT_GROUP_ID,
  MOBILE_TEST_RUNNER_METRO_PORT,
  MOBILE_TEST_RUNNER_RECORDED_OUTPUT_PATH,
  assertNoLingeringMobileRuntimeProcesses,
  buildMobileSourceTestRunPlan,
  buildNodeTestArgs,
  getLingeringMobileRuntimeProcesses,
  getMobileSourceTestFinalReport,
  getMobileSourceTestRunnerSummary,
  isLingeringMobileRuntimeProcessLine,
  parseMobileSourceTestRunTotals,
  runMobileSourceTests,
  validateMobileSourceTestFiles,
} from '../apps/mobile/testing/run-mobile-tests.js'

test('mobile source test runner defaults to the full mobile source test group', () => {
  assert.equal(MOBILE_TEST_RUNNER_DEFAULT_GROUP_ID, 'FULL_MOBILE_SOURCE_TESTS')

  const plan = buildMobileSourceTestRunPlan()

  assert.equal(plan.groupId, 'FULL_MOBILE_SOURCE_TESTS')
  assert.equal(plan.label, FULL_MOBILE_SOURCE_TESTS.label)
  assert.equal(plan.layer, FULL_MOBILE_SOURCE_TESTS.layer)
  assert.equal(MOBILE_RUNNABLE_TEST_GROUPS[plan.groupId], FULL_MOBILE_SOURCE_TESTS)
  assert.equal(plan.command, `node --test ${FULL_MOBILE_SOURCE_TESTS.testFiles.join(' ')}`)
  assert.deepEqual(plan.testFiles, FULL_MOBILE_SOURCE_TESTS.testFiles)
  assert.deepEqual(plan.expectedOutput, Object.freeze({
    tests: 691,
    pass: 691,
    fail: 0,
    testFiles: FULL_MOBILE_SOURCE_TESTS.testFiles.length,
  }))
})

test('mobile source test runner builds node --test args from manifest command metadata', () => {
  const args = buildNodeTestArgs(FULL_MOBILE_SOURCE_TESTS.testFiles)

  assert.deepEqual(args, ['--test', ...FULL_MOBILE_SOURCE_TESTS.testFiles])
})

test('mobile source test runner validates every test file before spawning node', () => {
  const plan = buildMobileSourceTestRunPlan()

  assert.deepEqual(validateMobileSourceTestFiles(plan.testFiles), Object.freeze([]))

  for (const testFile of plan.testFiles) {
    assert.ok(testFile.startsWith('tests/mobile-'), `Expected mobile test file: ${testFile}`)
    assert.equal(existsSync(resolve(process.cwd(), testFile)), true, `Expected runner test file to exist: ${testFile}`)
  }
})

test('mobile source test runner fails before spawn when a listed test file is missing', () => {
  assert.throws(
    () => validateMobileSourceTestFiles(['tests/mobile-auth-gate.test.js', 'tests/mobile-missing-file.test.js']),
    /Missing mobile source test files:\n- tests\/mobile-missing-file\.test\.js/,
  )

  let didSpawn = false
  const status = runMobileSourceTests({
    testFiles: ['tests/mobile-missing-file.test.js'],
    spawn: () => {
      didSpawn = true
      return { status: 0, stdout: '', stderr: '' }
    },
    log: () => {},
    writeStdout: () => {},
    writeStderr: () => {},
  })

  assert.equal(status, 1)
  assert.equal(didSpawn, false)
})

test('mobile source test runner prints command, file count, and expected result summary before spawning node', () => {
  const printedLines = []
  let spawnedArgs = null

  const status = runMobileSourceTests({
    spawn: (_nodePath, args) => {
      spawnedArgs = args
      return { status: 0, stdout: '', stderr: '' }
    },
    log: (message) => printedLines.push(message),
    writeStdout: () => {},
    writeStderr: () => {},
    recordOutput: () => {},
  })

  const output = printedLines.join('\n')

  assert.equal(status, 0)
  assert.deepEqual(spawnedArgs, ['--test', ...FULL_MOBILE_SOURCE_TESTS.testFiles])
  assert.match(output, /Files: 77/)
  assert.match(output, /Expected: 691 tests, 691 pass, 0 fail across 77 files/)
  assert.match(output, new RegExp(`Command: node --test ${FULL_MOBILE_SOURCE_TESTS.testFiles[0]}`))
})

test('root package exposes pnpm test:mobile from the repo root for the mobile source runner', () => {
  const rootPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
  const mobileTestScript = rootPackage.scripts['test:mobile']

  assert.match(rootPackage.packageManager, /^pnpm@/)
  assert.equal(mobileTestScript, 'node apps/mobile/testing/run-mobile-tests.js')
  assert.doesNotMatch(mobileTestScript, /(^|\s)(cd|--dir)\s/)
  assert.equal(existsSync(resolve(process.cwd(), 'apps/mobile/testing/run-mobile-tests.js')), true)
})

test('Phase 8 Expo runtime proof keeps mobile package scripts stable on canonical ports', () => {
  const rootPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
  const mobilePackage = JSON.parse(readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8'))

  assert.deepEqual(mobilePackage.scripts, {
    dev: 'expo start --lan --port 8084 --clear',
    'dev:warm': 'expo start --lan --port 8084',
    'dev:home': 'expo start --lan --port 8084 --clear',
    'dev:home:warm': 'expo start --lan --port 8084',
    'dev:phone': 'expo start --tunnel --port 8085 --clear',
    'dev:phone:warm': 'expo start --tunnel --port 8085',
    android: 'expo start --android --lan --port 8084 --clear',
    ios: 'expo start --ios --lan --port 8084 --clear',
    web: 'expo start --web --port 8084 --clear',
    lint: "echo 'No lint configured yet for @pplus/mobile'",
  })

  assert.equal(rootPackage.scripts['dev:mobile'], 'pnpm --dir apps/mobile dev')
  assert.equal(rootPackage.scripts['dev:mobile:warm'], 'pnpm --dir apps/mobile dev:warm')
  assert.equal(rootPackage.scripts['dev:mobile:home'], 'pnpm --dir apps/mobile dev:home')
  assert.equal(rootPackage.scripts['dev:mobile:home:warm'], 'pnpm --dir apps/mobile dev:home:warm')
  assert.equal(rootPackage.scripts['dev:mobile:phone'], 'pnpm --dir apps/mobile dev:phone')
  assert.equal(rootPackage.scripts['dev:mobile:phone:warm'], 'pnpm --dir apps/mobile dev:phone:warm')
})

test('Phase 8 runner notes document the explicit Expo runtime startup proof command', () => {
  const mobilePackage = JSON.parse(readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8'))
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')
  const explicitStartupCommand = 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear'

  assert.match(runnerNotes, /# Mobile runner notes/)
  assert.match(runnerNotes, /## Expo runtime\/startup proof/)
  assert.match(runnerNotes, new RegExp(explicitStartupCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(runnerNotes, /Source tests are not Expo runtime proof\./)
  assert.match(runnerNotes, /Metro waiting on exp:\/\/\.\.\.:8084/)
  assert.match(runnerNotes, /startup readiness only, not simulator or UI proof/)
  assert.equal(mobilePackage.scripts.dev, 'expo start --lan --port 8084 --clear')
})

test('Phase 8 runner notes require Metro startup through a tracked process', () => {
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')

  assert.match(runnerNotes, /tracked process manager/)
  assert.match(runnerNotes, /terminal\(background=true, pty=true\)/)
  assert.match(runnerNotes, /session_id/)
  assert.match(runnerNotes, /can be polled/)
  assert.match(runnerNotes, /killed cleanly after proof/)
  assert.match(runnerNotes, /Do not use `&`, `nohup`, `disown`/)
  assert.match(runnerNotes, /short-lived foreground shell/)
  assert.match(runnerNotes, /dead `exp:\/\/\.\.\.:8084` target/)
})

test('Phase 8 runner notes require a real Expo Metro readiness probe after startup', () => {
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')

  assert.match(runnerNotes, /real Expo\/Metro probe/)
  assert.match(runnerNotes, /lsof -nP -iTCP:8084 -sTCP:LISTEN/)
  assert.match(runnerNotes, /curl -I http:\/\/127\.0\.0\.1:8084/)
  assert.match(runnerNotes, /apps\/mobile\/index\.bundle\?platform=ios/)
  assert.match(runnerNotes, /transform\.engine=hermes/)
  assert.match(runnerNotes, /HTTP `200`/)
  assert.match(runnerNotes, /var __BUNDLE_START_TIME__/)
  assert.match(runnerNotes, /Do not count a QR code or `Metro waiting on \.\.\.` alone as the real probe/)
})

test('Phase 8 runner notes report Metro readiness separately from UI proof', () => {
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')

  assert.match(runnerNotes, /## Proof boundaries/)
  assert.match(runnerNotes, /Report Metro readiness separately from UI proof/)
  assert.match(runnerNotes, /Metro readiness means the tracked Expo\/Metro process is alive/)
  assert.match(runnerNotes, /`8084` listener responds/)
  assert.match(runnerNotes, /iOS bundle probe returns Metro JavaScript/)
  assert.match(runnerNotes, /L3 runtime\/startup proof only/)
  assert.match(runnerNotes, /UI proof means a separate simulator, phone, screenshot, or Maestro flow/)
  assert.match(runnerNotes, /verified a named screen or workflow/)
  assert.match(runnerNotes, /Do not describe Metro ready, QR ready, or bundle ready as UI proof/)
  assert.match(runnerNotes, /report them as separate bullets/)
  assert.match(runnerNotes, /## Maestro simulator\/device proof/)
  assert.match(runnerNotes, /MAESTRO_DEVICE_NAME="iPhone 17 Pro"/)
  assert.match(runnerNotes, /xcrun simctl list devices booted/)
  assert.match(runnerNotes, /test -n "\$MAESTRO_DEVICE_UDID"/)
  assert.match(runnerNotes, /maestro test --device "\$MAESTRO_DEVICE_UDID" --format JUNIT/)
  assert.match(runnerNotes, /apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-junit\.xml/)
  assert.match(runnerNotes, /apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-console\.log/)
  assert.match(runnerNotes, /apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/maestro-debug\//)
  assert.match(runnerNotes, /apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded\/screenshot\.png/)
  assert.match(runnerNotes, /xcrun simctl io "\$MAESTRO_DEVICE_UDID" screenshot/)
  assert.match(runnerNotes, /friendly device name and resolved UDID/)
  assert.match(runnerNotes, /Do not report simulator proof green until the JUnit, console log, debug folder, and screenshot exist/)
  assert.match(runnerNotes, /Artifact retention policy: clean passing smoke artifacts after proof is recorded/)
  assert.match(runnerNotes, /retain failure artifacts and report the retained scenario path/)
  assert.match(runnerNotes, /rm -rf apps\/mobile\/testing\/artifacts\/bottom_tab_navigation_seeded/)
  assert.match(runnerNotes, /Artifacts cleaned: <scenario path>/)
  assert.match(runnerNotes, /Failure artifacts retained: <scenario path>/)
})

test('Phase 8 runner notes require stopping Metro after verification', () => {
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')

  assert.match(runnerNotes, /After the readiness probe and any separate UI proof are complete/)
  assert.match(runnerNotes, /stop the tracked Expo\/Metro process/)
  assert.match(runnerNotes, /process\(action='kill', session_id='<session_id>'\)/)
  assert.match(runnerNotes, /process\(action='poll', session_id='<session_id>'\)/)
  assert.match(runnerNotes, /lsof -nP -iTCP:8084 -sTCP:LISTEN \|\| true/)
  assert.match(runnerNotes, /Do not leave Metro\/Expo running after verification/)
  assert.match(runnerNotes, /unless the user explicitly asks for a live dev server/)
})


test('Phase 8 runner notes document stale cache recovery with clear-cache Metro startup', () => {
  const runnerNotes = readFileSync(resolve(process.cwd(), 'docs/mobile-runner-notes.md'), 'utf8')
  const clearCacheCommand = 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear'

  assert.match(runnerNotes, /## Stale cache recovery/)
  assert.match(runnerNotes, /stale UI/)
  assert.match(runnerNotes, /stale red screen/)
  assert.match(runnerNotes, /old bundle behavior/)
  assert.match(runnerNotes, /resolver\/runtime error that does not match the current source/)
  assert.match(runnerNotes, new RegExp(clearCacheCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(runnerNotes, /same tracked-process rule for stale cache recovery/)
  assert.match(runnerNotes, /terminal\(background=true, pty=true\)/)
  assert.match(runnerNotes, /keep the `session_id`/)
  assert.match(runnerNotes, /rerun the real Expo\/Metro readiness probe/)
  assert.match(runnerNotes, /Do not use the warm path for stale cache recovery/)
})

test('Phase 8 Expo runtime proof keeps mobile app config valid', () => {
  const mobilePackage = JSON.parse(readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8'))
  const mobileAppConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'apps/mobile/app.json'), 'utf8'))

  assert.deepEqual(mobileAppConfig, {
    expo: {
      name: 'PPLUS Training',
      slug: 'pplus-training',
      version: '0.1.0',
      orientation: 'portrait',
      platforms: ['ios', 'android', 'web'],
      userInterfaceStyle: 'automatic',
      plugins: [
        'expo-video',
        '@react-native-community/datetimepicker',
        'expo-secure-store',
      ],
    },
  })

  for (const pluginName of mobileAppConfig.expo.plugins) {
    assert.ok(
      mobilePackage.dependencies[pluginName] ?? mobilePackage.devDependencies[pluginName],
      `Expected Expo config plugin dependency to be installed: ${pluginName}`,
    )
  }

  const expoConfigResult = spawnSync('pnpm', ['--dir', 'apps/mobile', 'exec', 'expo', 'config', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  assert.equal(expoConfigResult.status, 0, expoConfigResult.stderr)

  const resolvedExpoConfig = JSON.parse(expoConfigResult.stdout)

  assert.equal(resolvedExpoConfig.name, mobileAppConfig.expo.name)
  assert.equal(resolvedExpoConfig.slug, mobileAppConfig.expo.slug)
  assert.equal(resolvedExpoConfig.version, mobileAppConfig.expo.version)
  assert.equal(resolvedExpoConfig.orientation, mobileAppConfig.expo.orientation)
  assert.deepEqual(resolvedExpoConfig.platforms, mobileAppConfig.expo.platforms)
  assert.equal(resolvedExpoConfig.userInterfaceStyle, mobileAppConfig.expo.userInterfaceStyle)
  assert.deepEqual(resolvedExpoConfig.plugins, mobileAppConfig.expo.plugins)
  assert.equal(resolvedExpoConfig.sdkVersion, '54.0.0')
  assert.equal(resolvedExpoConfig._internal.staticConfigPath.endsWith('/apps/mobile/app.json'), true)
})

test('mobile source test runner summary is copy-pasteable and layer-scoped', () => {
  const summary = getMobileSourceTestRunnerSummary()

  assert.match(summary, /Running Full mobile source model test suite/)
  assert.match(summary, /Layer: L7_MOBILE_GATE/)
  assert.match(summary, /Files: 77/)
  assert.match(summary, /Expected: 691 tests, 691 pass, 0 fail across 77 files/)
  assert.match(summary, /Cleanup: asserts no Expo\/Metro listener remains on port 8084/)
  assert.match(summary, /Cleanup: asserts no unsafe live mobile test records are left behind/)
  assert.match(summary, /Artifacts: asserts test artifacts are cleaned or listed as retained proof/)
})

test('mobile source test runner detects lingering Expo or Metro runtime processes without counting Expo Go', () => {
  const psOutput = [
    'anthony 100 0.0 0.0 node /repo/node_modules/.bin/expo start --lan --port 8084 --clear',
    'anthony 101 0.0 0.0 /Applications/Expo Go.app/host.exp.Exponent.app/Expo Go',
    'anthony 102 0.0 0.0 Adobe Creative Cloud UI Helper Renderer',
  ].join('\n')

  assert.equal(MOBILE_TEST_RUNNER_METRO_PORT, 8084)
  assert.equal(isLingeringMobileRuntimeProcessLine(psOutput.split('\n')[0]), true)
  assert.equal(isLingeringMobileRuntimeProcessLine(psOutput.split('\n')[1]), false)

  const lingering = getLingeringMobileRuntimeProcesses({
    spawn: (command) => {
      if (command === 'lsof') {
        return {
          status: 0,
          stdout: 'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME\nnode 100 anthony 23u IPv4 0x1 0t0 TCP *:8084 (LISTEN)\n',
          stderr: '',
        }
      }

      return { status: 0, stdout: psOutput, stderr: '' }
    },
  })

  assert.deepEqual(lingering.portListeners, Object.freeze([
    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
    'node 100 anthony 23u IPv4 0x1 0t0 TCP *:8084 (LISTEN)',
  ]))
  assert.deepEqual(lingering.processLines, Object.freeze([
    psOutput.split('\n')[0],
  ]))
  assert.throws(
    () => assertNoLingeringMobileRuntimeProcesses({
      spawn: (command) => (command === 'lsof'
        ? { status: 0, stdout: 'node 100 anthony TCP *:8084 (LISTEN)\n', stderr: '' }
        : { status: 0, stdout: psOutput, stderr: '' }),
    }),
    /Lingering Expo\/Metro runtime detected after mobile test run on port 8084/,
  )
})

test('mobile source test runner fails the gate when Expo or Metro is still running after tests', () => {
  let recordedOutput = null
  let stdout = ''

  const status = runMobileSourceTests({
    spawn: () => ({ status: 0, stdout: 'ℹ tests 691\nℹ pass 691\nℹ fail 0\n', stderr: '' }),
    log: () => {},
    writeStdout: (output) => {
      stdout += output
    },
    writeStderr: () => {},
    recordOutput: (output) => {
      recordedOutput = output
    },
    assertNoLingeringRuntime: () => {
      throw new Error('Lingering Expo/Metro runtime detected after mobile test run on port 8084.\nport: node TCP *:8084 (LISTEN)')
    },
  })

  assert.equal(status, 1)
  assert.match(stdout, /Lingering Expo\/Metro runtime detected/)
  assert.match(recordedOutput, /Lingering Expo\/Metro runtime detected/)
})

test('mobile source test runner fails the gate when unsafe live test records may be left behind', () => {
  let recordedOutput = null
  let stdout = ''

  const status = runMobileSourceTests({
    spawn: () => ({ status: 0, stdout: 'ℹ tests 691\nℹ pass 691\nℹ fail 0\n', stderr: '' }),
    log: () => {},
    writeStdout: (output) => {
      stdout += output
    },
    writeStderr: () => {},
    recordOutput: (output) => {
      recordedOutput = output
    },
    assertNoLingeringRuntime: () => ({
      metroPort: 8084,
      portListeners: Object.freeze([]),
      processLines: Object.freeze([]),
    }),
    assertNoUnsafeLiveRecords: () => {
      throw new Error('Unsafe live mobile test record residue risk detected.\n- unsafe_live_write: cleanup_required scenarios must declare cleanupCommand, affected tables, and test record id markers')
    },
  })

  assert.equal(status, 1)
  assert.match(stdout, /Unsafe live mobile test record residue risk detected/)
  assert.match(recordedOutput, /Unsafe live mobile test record residue risk detected/)
})

test('mobile source test runner fails the gate when unlisted test artifacts remain', () => {
  let recordedOutput = null
  let stdout = ''

  const status = runMobileSourceTests({
    spawn: () => ({ status: 0, stdout: 'ℹ tests 691\nℹ pass 691\nℹ fail 0\n', stderr: '' }),
    log: () => {},
    writeStdout: (output) => {
      stdout += output
    },
    writeStderr: () => {},
    recordOutput: (output) => {
      recordedOutput = output
    },
    assertNoLingeringRuntime: () => ({
      metroPort: 8084,
      portListeners: Object.freeze([]),
      processLines: Object.freeze([]),
    }),
    assertNoUnsafeLiveRecords: () => Object.freeze({ unsafeScenarios: Object.freeze([]) }),
    assertArtifactsCleanedOrListed: () => {
      throw new Error('Unlisted mobile test artifacts remain after mobile test run.\n- apps/mobile/testing/artifacts/stale_debug/maestro-console.log')
    },
  })

  assert.equal(status, 1)
  assert.match(stdout, /Unlisted mobile test artifacts remain after mobile test run/)
  assert.match(recordedOutput, /apps\/mobile\/testing\/artifacts\/stale_debug\/maestro-console\.log/)
})

test('mobile source test runner final report includes exact commands and real pass/fail totals', () => {
  const result = {
    status: 0,
    stdout: [
      '✔ real suite passed',
      '# tests 691',
      '# pass 691',
      '# fail 0',
    ].join('\n'),
    stderr: '',
  }
  const totals = parseMobileSourceTestRunTotals(result.stdout)
  const report = getMobileSourceTestFinalReport({
    result,
    cleanupLines: [
      'Cleanup: no Expo/Metro listener remains on port 8084',
      'Artifacts: listed retained proof under apps/mobile/testing/artifacts',
    ],
  })

  assert.deepEqual(totals, Object.freeze({ tests: 691, pass: 691, fail: 0 }))
  assert.match(report, /Final report:/)
  assert.match(report, /Commands run:/)
  assert.match(report, /^- pnpm test:mobile$/m)
  assert.match(report, /^- node apps\/mobile\/testing\/run-mobile-tests\.js$/m)
  assert.match(report, new RegExp(`^- node --test ${FULL_MOBILE_SOURCE_TESTS.testFiles[0]}`, 'm'))
  assert.match(report, /Real totals: 691 tests, 691 pass, 0 fail/)
  assert.match(report, /Exit status: 0/)
  assert.match(report, /Cleanup: no Expo\/Metro listener remains on port 8084/)
  assert.match(report, /Artifacts: listed retained proof under apps\/mobile\/testing\/artifacts/)
})

test('mobile source test runner records the real pnpm test:mobile output artifact after the child suite exits', () => {
  let recordedOutput = null

  const status = runMobileSourceTests({
    spawn: () => ({
      status: 0,
      stdout: [
        '✔ mobile source test runner summary is copy-pasteable and layer-scoped (0.131167ms)',
        'ℹ tests 691',
        'ℹ suites 0',
        'ℹ pass 691',
        'ℹ fail 0',
        'ℹ cancelled 0',
        'ℹ skipped 0',
        'ℹ todo 0',
        'ℹ duration_ms 728.828458',
      ].join('\n'),
      stderr: '',
    }),
    log: () => {},
    writeStdout: () => {},
    writeStderr: () => {},
    recordOutput: (output) => {
      recordedOutput = output
    },
    assertNoLingeringRuntime: () => ({
      metroPort: 8084,
      portListeners: Object.freeze([]),
      processLines: Object.freeze([]),
    }),
  })

  assert.equal(status, 0)
  assert.equal(MOBILE_TEST_RUNNER_RECORDED_OUTPUT_PATH, 'apps/mobile/testing/pnpm-test-mobile-output.txt')
  assert.match(recordedOutput, /> pnpm test:mobile/)
  assert.match(recordedOutput, /> node apps\/mobile\/testing\/run-mobile-tests\.js/)
  assert.match(recordedOutput, /Running Full mobile source model test suite/)
  assert.match(recordedOutput, /Layer: L7_MOBILE_GATE/)
  assert.match(recordedOutput, /Files: 77/)
  assert.match(recordedOutput, /Expected: 691 tests, 691 pass, 0 fail across 77 files/)
  assert.match(recordedOutput, /Command: node --test tests\/mobile-auth-gate\.test\.js/)
  assert.match(recordedOutput, /✔ mobile source test runner summary is copy-pasteable and layer-scoped/)
  assert.match(recordedOutput, /(?:ℹ|#) tests 691/)
  assert.match(recordedOutput, /(?:ℹ|#) pass 691/)
  assert.match(recordedOutput, /(?:ℹ|#) fail 0/)
  assert.match(recordedOutput, /(?:ℹ|#) duration_ms \d+(?:\.\d+)?/)
  assert.match(recordedOutput, /Final report:/)
  assert.match(recordedOutput, /Commands run:/)
  assert.match(recordedOutput, /^- pnpm test:mobile$/m)
  assert.match(recordedOutput, /^- node apps\/mobile\/testing\/run-mobile-tests\.js$/m)
  assert.match(recordedOutput, /^- node --test tests\/mobile-auth-gate\.test\.js/m)
  assert.match(recordedOutput, /Real totals: 691 tests, 691 pass, 0 fail/)
  assert.match(recordedOutput, /Exit status: 0/)
  assert.doesNotMatch(recordedOutput, /OUTPUT TRUNCATED|omitted out of|\[truncated\]/i)
})
