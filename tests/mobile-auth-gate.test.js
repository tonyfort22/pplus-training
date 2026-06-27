import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile auth gate bypasses the normal app shell chrome when signed out', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /const isFullscreenAuthGate = appRenderModel\.screen\.type === 'auth';/)

  const authGateBlock = appSource.match(/if \(isFullscreenAuthGate\) \{([\s\S]*?)\n  \}\n\n  if \(isFullscreenLoading\)/)?.[1] || ''

  assert.match(authGateBlock, /<SafeAreaProvider>/)
  assert.match(authGateBlock, /<SafeAreaView edges=\{\['top', 'left', 'right'\]\} style=\{styles\.container\}>/)
  assert.match(authGateBlock, /<AuthView[\s\S]*theme=\{appTheme\}/)
  assert.match(authGateBlock, /<StatusBar style=\{appThemePreference === 'light' \? 'dark' : 'light'\} \/>/)
  assert.doesNotMatch(authGateBlock, /renderAppShell\(/)
  assert.doesNotMatch(authGateBlock, /renderProgramSheet\(/)
  assert.doesNotMatch(authGateBlock, /brandHeader/)
  assert.doesNotMatch(authGateBlock, /bottomNavWrap/)
})

test('mobile auth gate uses the loading-screen background treatment, keeps only athlete-coach role tabs, and keeps mode switching on the helper link', () => {
  const authSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/auth-view.js'), 'utf8')
  const backgroundSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/assets/loading-screen-backgrounds.js'), 'utf8')
  const primitivesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/primitives.js'), 'utf8')

  assert.match(authSource, /import \{ KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions \} from 'react-native'/)
  assert.match(authSource, /import \{ SvgXml \} from 'react-native-svg'/)
  assert.match(authSource, /import \{ getLoadingScreenThemeBranding \} from '\.\.\/assets\/loading-screen-backgrounds\.js'/)
  assert.match(backgroundSource, /backgroundColor: '#0A1221'/)
  assert.match(backgroundSource, /backgroundColor: '#F5F7FD'/)
  assert.match(authSource, /const \{ width, height \} = useWindowDimensions\(\)/)
  assert.match(authSource, /const overlayWidth = width \* 1\.08/)
  assert.match(authSource, /const overlayHeight = height \* 1\.08/)
  assert.match(authSource, /const authScreenBranding = getLoadingScreenThemeBranding\(resolvedTheme\.id\)/)
  assert.match(authSource, /<View className="flex-1 overflow-hidden" style=\{\{ backgroundColor: authScreenBranding\.backgroundColor \}\}>/)
  assert.match(authSource, /<View pointerEvents="none" className="absolute inset-0 items-center justify-center">/)
  assert.match(authSource, /<SvgXml xml=\{authScreenBranding\.overlaySvg\} width=\{overlayWidth\} height=\{overlayHeight\} preserveAspectRatio="xMidYMid slice" \/>/)
  assert.doesNotMatch(authSource, /logoPphtGreenSvg/)
  assert.doesNotMatch(authSource, /authLogoSize/)
  assert.doesNotMatch(authSource, /<SvgXml xml=\{logoPphtGreenSvg\}/)
  assert.match(authSource, /model\.roleOptions\.map\(\(option\) => \(/)
  assert.match(authSource, /backgroundColor: isSelected \? theme\.accentSurface : theme\.surface/)
  assert.match(authSource, /<AuthRoleButton key=\{option\.id\} option=\{option\} isSelected=\{model\.selectedRoleId === option\.id\} onPress=\{handleRoleChange\} theme=\{resolvedTheme\} \/>/)
  assert.match(authSource, /backgroundColor: resolvedTheme\.id === 'light' \? resolvedTheme\.surface : resolvedTheme\.surfaceMuted/)
  assert.doesNotMatch(authSource, /AuthTabButton/)
  assert.doesNotMatch(authSource, /model\.tabs\.map\(/)
  assert.match(authSource, /onPress=\{\(\) => onModeChange\?\.\(mode === 'sign_up' \? 'sign_in' : 'sign_up'\)\}/)
  assert.match(authSource, /const \[isPasswordVisible, setIsPasswordVisible\] = useState\(false\)/)
  assert.match(authSource, /const isPasswordField = field\.id === 'password' \|\| field\.id === 'confirmPassword'/)
  assert.match(authSource, /const isSecureEntryEnabled = field\.secureTextEntry && !isPasswordVisible/)
  assert.match(authSource, /<AppFieldShell theme=\{theme\} trailing=\{trailing\} className="h-14 py-0">/)
  assert.match(authSource, /<Text className="text-\[12px\] font-semibold uppercase tracking-\[1px\]" style=\{\{ color: theme\.textSoft \}\}>\{field\.label\}<\/Text>/)
  assert.match(authSource, /className="px-0 py-0 text-\[16px\]"/)
  assert.match(authSource, /className="ml-3 h-8 w-8 items-center justify-center rounded-\[12px\]"/)
  assert.match(primitivesSource, /const shellClassName = `flex-row items-center rounded-\[20px\] px-5 py-4 \$\{className\}`\.trim\(\)/)
  assert.match(authSource, /onPress=\{\(\) => setIsPasswordVisible\(\(current\) => !current\)\}/)
  assert.match(authSource, /isPasswordVisible \? <EyeOff color=\{theme\.iconMuted\} size=\{18\} strokeWidth=\{2\.2\} \/> : <Eye color=\{theme\.iconMuted\} size=\{18\} strokeWidth=\{2\.2\} \/>/)
  assert.match(authSource, /secureTextEntry=\{isSecureEntryEnabled\}/)
  assert.doesNotMatch(authSource, /model\.header\.eyebrow/)
  assert.doesNotMatch(authSource, /model\.header\.title/)
  assert.doesNotMatch(authSource, /model\.header\.body/)
})

test('mobile auth gate keeps the submit button in the normal flex foreground layer so the auth form is not mounted inside an absolute interaction wrapper', () => {
  const authSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/auth-view.js'), 'utf8')

  assert.match(authSource, /<ScrollView[\s\S]*className="flex-1 px-6"/)
  assert.doesNotMatch(authSource, /<View className="absolute inset-0 px-6">/)
  assert.match(authSource, /<Pressable[\s\S]*onPress=\{\(\) => onSubmit\?\.\(\{ mode, values \}\)\}/)
})

test('mobile auth gate uses the loading-screen background treatment and vertically centers the auth content stack instead of pinning it high near the top', () => {
  const authSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/auth-view.js'), 'utf8')

  assert.match(authSource, /<View pointerEvents="none" className="absolute inset-0 items-center justify-center">/)
  assert.match(authSource, /<ScrollView[\s\S]*className="flex-1 px-6"/)
  assert.match(authSource, /<View className="items-center justify-center">/)
  assert.match(authSource, /<View className="w-full max-w-\[420px\] gap-5">/)
  assert.doesNotMatch(authSource, /<View className="absolute inset-0 px-6">/)
})

test('mobile auth login form is keyboard-safe and safe-area padded so primary actions stay reachable', () => {
  const authSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/auth-view.js'), 'utf8')

  assert.match(authSource, /import \{ KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions \} from 'react-native'/)
  assert.match(authSource, /import \{ useSafeAreaInsets \} from 'react-native-safe-area-context'/)
  assert.match(authSource, /const insets = useSafeAreaInsets\(\)/)
  assert.match(authSource, /<KeyboardAvoidingView[\s\S]*behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}[\s\S]*keyboardVerticalOffset=\{0\}/)
  assert.match(authSource, /<ScrollView[\s\S]*keyboardShouldPersistTaps="handled"[\s\S]*showsVerticalScrollIndicator=\{false\}/)
  assert.match(authSource, /contentContainerStyle=\{\{[\s\S]*flexGrow: 1,[\s\S]*justifyContent: 'center',[\s\S]*paddingTop: Math\.max\(insets\.top, 24\),[\s\S]*paddingBottom: Math\.max\(insets\.bottom, 24\),[\s\S]*\}\}/)
  assert.match(authSource, /<Pressable[\s\S]*onPress=\{\(\) => onSubmit\?\.\(\{ mode, values \}\)\}/)
  assert.match(authSource, /Sign up with invitation code/)
})
