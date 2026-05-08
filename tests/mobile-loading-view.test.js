import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app shell uses a dedicated themed full-screen loading view while bootstrap data is loading', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const shellRendererSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')
  const shellViewModelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-view-models.js'), 'utf8')
  const loadingViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/loading-view.js'), 'utf8')
  const loadingBackgroundSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/assets/loading-screen-backgrounds.js'), 'utf8')

  assert.match(appSource, /loading-view\.js/)
  assert.match(appSource, /effectiveBootstrapState\.status === 'loading'/)
  assert.match(appSource, /type:\s*'loading'/)
  assert.match(appSource, /const expectedAuthenticatedTrainHomeSession = effectiveSessionStore\?\.getCurrentSession\(\) \|\| effectiveRemoteTrainState\?\.session \|\| null;/)
  assert.match(appSource, /const isAuthenticatedTrainHomeReadinessPending = activeTab === 'train'[\s\S]*effectiveBootstrapState\.status === 'authenticated'[\s\S]*sessionLineageId !== expectedSessionLineageId/)
  assert.doesNotMatch(appSource, /selectedCalendarDayId !== effectiveRemoteTrainState\.program\.selectedCalendarDayId/)
  assert.match(appSource, /const isFullscreenLoading = appRenderModel\.screen\.type === 'loading' && !isProfileViewOpen/)
  assert.doesNotMatch(appSource, /const isFullscreenLoading = activeTab === 'train' && \(effectiveBootstrapState\.status === 'loading' \|\| isAuthenticatedTrainHomeReadinessPending\)/)

  const fullscreenLoadingBlock = appSource.match(/if \(isFullscreenLoading\) \{([\s\S]*?)\n  \}\n\n  return \(/)?.[1] || ''

  assert.match(fullscreenLoadingBlock, /<SafeAreaProvider>/)
  assert.match(fullscreenLoadingBlock, /<SafeAreaView edges=\{\['top', 'left', 'right'\]\} style=\{styles\.container\}>/)
  assert.match(fullscreenLoadingBlock, /<LoadingView theme=\{appTheme\} \/>/)
  assert.match(fullscreenLoadingBlock, /<StatusBar style=\{appThemePreference === 'light' \? 'dark' : 'light'\} \/>/)
  assert.doesNotMatch(fullscreenLoadingBlock, /renderAppShell\(/)
  assert.doesNotMatch(fullscreenLoadingBlock, /renderProgramSheet\(/)

  assert.match(appSource, /renderLoadingView:\s*\(\)\s*=>\s*<LoadingView[\s\S]*theme=\{appTheme\}/)

  assert.match(shellViewModelSource, /if \(screen\.type === 'loading'\)/)
  assert.match(shellViewModelSource, /type:\s*'loading-surface'/)

  assert.match(shellRendererSource, /export function renderAppShell\([\s\S]*const screenViewModel = getAppScreenViewModel\(\{ screen \}\)/)
  assert.match(shellRendererSource, /export function renderAppShell\([\s\S]*if \(screenViewModel\.type === 'loading-surface'\) \{\s*return renderLoadingView\(screenViewModel\)\s*\}[\s\S]*return \(\s*<View style=\{styles\.appShell\}>/)
  assert.doesNotMatch(shellRendererSource, /export function renderAppShell\([\s\S]*if \(screenViewModel\.type === 'loading-surface'\) \{[\s\S]*brandHeader[\s\S]*bottomNavWrap/)

  assert.match(loadingViewSource, /logoPphtGreenSvg/)
  assert.match(loadingViewSource, /SvgXml/)
  assert.match(loadingViewSource, /getLoadingScreenThemeBranding/)
  assert.match(loadingBackgroundSource, /export const loadingScreenBgDarkSvg = /)
  assert.match(loadingBackgroundSource, /export const loadingScreenBgLightSvg = /)
  assert.match(loadingBackgroundSource, /backgroundColor: '#0A1221'/)
  assert.match(loadingBackgroundSource, /backgroundColor: '#F5F7FD'/)
  assert.match(loadingBackgroundSource, /themeId === 'light' \? loadingScreenThemeBranding\.light : loadingScreenThemeBranding\.dark/)
  assert.match(loadingViewSource, /import \{ useWindowDimensions, View \} from 'react-native'/)
  assert.match(loadingViewSource, /import \{ loadingLogoSize \} from '\.\/brand-logo-sizing\.js'/)
  assert.match(loadingViewSource, /const \{ width, height \} = useWindowDimensions\(\)/)
  assert.match(loadingViewSource, /const overlayWidth = width \* 1\.08/)
  assert.match(loadingViewSource, /const overlayHeight = height \* 1\.08/)
  assert.match(loadingViewSource, /const resolvedTheme = theme \|\| getAppTheme\('dark'\)/)
  assert.match(loadingViewSource, /const loadingScreenBranding = getLoadingScreenThemeBranding\(resolvedTheme\.id\)/)
  assert.match(loadingViewSource, /<View className="flex-1 overflow-hidden" style=\{\{ backgroundColor: loadingScreenBranding\.backgroundColor \}\}>/)
  assert.match(loadingViewSource, /<View pointerEvents="none" className="absolute inset-0 items-center justify-center">/)
  assert.match(loadingViewSource, /<SvgXml xml=\{loadingScreenBranding\.overlaySvg\} width=\{overlayWidth\} height=\{overlayHeight\} preserveAspectRatio="xMidYMid slice" \/>/)
  assert.match(loadingViewSource, /<View className="absolute inset-0 items-center justify-center">/)
  assert.match(loadingViewSource, /<SvgXml xml=\{logoPphtGreenSvg\} width=\{loadingLogoSize\.width\} height=\{loadingLogoSize\.height\} \/>/)
  assert.doesNotMatch(loadingViewSource, /px-6/)
  assert.doesNotMatch(loadingViewSource, /backgroundColor: resolvedTheme\.background/)
  assert.doesNotMatch(loadingViewSource, /ActivityIndicator/)
  assert.doesNotMatch(loadingViewSource, /AppSurfaceCard/)
  assert.doesNotMatch(loadingViewSource, /Loading your workspace/)
  assert.doesNotMatch(loadingViewSource, /Syncing profile, training state, and today's session\./)
  assert.doesNotMatch(loadingViewSource, /<Text/)
})

test('mobile coach train home stays in loading while an athlete is already selected but coach train state is still hydrating', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /const \[coachTrainBridgeState, setCoachTrainBridgeState\] = useState\(\{ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false \}\);/)
  assert.match(appSource, /setCoachTrainBridgeState\(\{ trainState: null, sessionStore: null, isHydrating: true, hasResolved: false \}\)/)
  assert.match(appSource, /const isCoachTrainHomeReadinessPending = activeTab === 'train'[\s\S]*isCoachBootstrapState[\s\S]*activeCoachAthleteProfile\?\.id[\s\S]*coachTrainBridgeState\.isHydrating/)
  assert.match(appSource, /overrideScreen: effectiveBootstrapState\.status === 'signed_out' \|\| \(isAuthPreviewEnabled && \(authPreviewState === 'sign_in' \|\| authPreviewState === 'sign_up'\)\)[\s\S]*: isCoachBootstrapState && isCoachTrainHomeReadinessPending[\s\S]*\? \{ type: 'loading' \}/)
  assert.doesNotMatch(appSource, /EXPO_PUBLIC_PPLUS_RUNTIME_FORCE_LOADING/)
  assert.doesNotMatch(appSource, /const coachNoWorkoutPlaceholderModel = useMemo\(\(\) => \{[\s\S]*'No workout scheduled'[\s\S]*Once a coach-assigned workout exists, Train can load it here\./)
  assert.doesNotMatch(appSource, /: isCoachBootstrapState && coachNoWorkoutPlaceholderModel[\s\S]*\? \{ type: 'train-bootstrap', sections: getPlaceholderSections\(coachNoWorkoutPlaceholderModel\) \}/)

  const coachOverrideBlock = appSource.match(/const coachOverrideScreen = useMemo\(\(\) => \{([\s\S]*?)\n  \}, \[activeTab, coachPlaceholderModel, isCoachBootstrapState\]\);/)?.[1] || ''

  assert.match(coachOverrideBlock, /if \(activeTab === 'train'\) \{\s*return null;\s*\}/)
  assert.doesNotMatch(coachOverrideBlock, /if \(activeTab === 'train' && !effectiveRemoteTrainState\) \{[\s\S]*Coach workspace/)
})
