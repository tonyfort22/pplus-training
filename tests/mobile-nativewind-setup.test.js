import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app config wires NativeWind and Lucide React Native', () => {
  const mobilePackage = readFileSync(resolve(process.cwd(), 'apps/mobile/package.json'), 'utf8')
  const babelConfig = readFileSync(resolve(process.cwd(), 'apps/mobile/babel.config.cjs'), 'utf8')
  const metroConfig = readFileSync(resolve(process.cwd(), 'apps/mobile/metro.config.cjs'), 'utf8')
  const tailwindConfig = readFileSync(resolve(process.cwd(), 'apps/mobile/tailwind.config.cjs'), 'utf8')
  const appEntry = readFileSync(resolve(process.cwd(), 'apps/mobile/index.js'), 'utf8')

  assert.match(mobilePackage, /"nativewind"/)
  assert.match(mobilePackage, /"tailwindcss"/)
  assert.match(mobilePackage, /"lucide-react-native"/)
  assert.match(babelConfig, /presets: \['babel-preset-expo', 'nativewind\/babel'\]/)
  assert.match(metroConfig, /withNativeWind/)
  assert.match(tailwindConfig, /nativewind\/preset/)
  assert.match(tailwindConfig, /content:/)
  assert.match(appEntry, /import '\.\/global\.css';/)
})
