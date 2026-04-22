import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const mobileSrcDir = path.join(process.cwd(), 'apps/mobile/src')

function getMobileSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getMobileSourceFiles(fullPath)
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      return [fullPath]
    }

    return []
  })
}

test('mobile text nodes use NativeWind className instead of legacy style props', () => {
  const sourceFiles = getMobileSourceFiles(mobileSrcDir)
  const textStyleUsages = sourceFiles.flatMap((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8')
    const matches = [...source.matchAll(/<Text\s+style=\{/g)]

    return matches.map(() => path.relative(process.cwd(), filePath))
  })

  assert.deepEqual(textStyleUsages, [])
})
