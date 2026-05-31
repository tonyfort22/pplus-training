import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const paths = {
  dialog: resolve(repoRoot, 'apps/web/components/ui/dialog.jsx'),
  dropdownMenu: resolve(repoRoot, 'apps/web/components/ui/dropdown-menu.jsx'),
  select: resolve(repoRoot, 'apps/web/components/ui/select.jsx'),
  sheet: resolve(repoRoot, 'apps/web/components/ui/sheet.jsx'),
  popover: resolve(repoRoot, 'apps/web/components/ui/popover.jsx'),
  multiCombobox: resolve(repoRoot, 'apps/web/components/ui/multi-combobox.jsx'),
  compactFileUpload: resolve(repoRoot, 'apps/web/components/ui/compact-file-upload.jsx'),
  avatarFileUpload: resolve(repoRoot, 'apps/web/components/ui/avatar-file-upload.jsx'),
  exerciseEditorDialog: resolve(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx'),
  athletesDataTable: resolve(repoRoot, 'apps/web/components/admin/athletes-data-table.jsx'),
  globalsCss: resolve(repoRoot, 'apps/web/app/globals.css'),
}

function read(path) {
  return readFileSync(path, 'utf8')
}

test('shared admin overlay shells use admin theme tokens instead of dark-only shell colors', () => {
  const overlaySources = [
    ['dialog', read(paths.dialog)],
    ['dropdownMenu', read(paths.dropdownMenu)],
    ['select', read(paths.select)],
    ['sheet', read(paths.sheet)],
    ['popover', read(paths.popover)],
    ['multiCombobox', read(paths.multiCombobox)],
  ]

  for (const [name, source] of overlaySources) {
    assert.match(source, /var\(--admin-shell-surface\)|var\(--admin-dashboard-card-bg\)/, `${name} should use an admin surface token`)
    assert.match(source, /var\(--admin-shell-border\)|var\(--admin-dashboard-card-border\)/, `${name} should use an admin border token`)
    assert.match(source, /var\(--admin-shell-text\)|var\(--admin-dashboard-card-text\)/, `${name} should use an admin text token`)
    assert.doesNotMatch(source, /border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]/, `${name} should not hard-code dark shell colors`)
  }
})

test('shared admin overlay controls keep green tokenized selected and focus states', () => {
  const interactiveSources = [
    ['dropdownMenu', read(paths.dropdownMenu)],
    ['select', read(paths.select)],
    ['multiCombobox', read(paths.multiCombobox)],
  ]

  for (const [name, source] of interactiveSources) {
    assert.match(source, /var\(--admin-shell-nav-active-bg\)/, `${name} should use the admin selected background token`)
    assert.match(source, /var\(--admin-shell-nav-active-text\)|var\(--admin-shell-accent\)/, `${name} should use admin green selected text/accent token`)
  }
})

test('sheet primitive close control uses admin overlay tokens', () => {
  const source = read(paths.sheet)

  assert.match(source, /SheetPrimitive\.Close[\s\S]*?border-\[color:var\(--admin-shell-border\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?bg-\[var\(--admin-shell-surface-muted\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?text-\[var\(--admin-shell-muted\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?focus:ring-\[var\(--admin-input-focus\)\]/)
})

test('compact file upload uses admin control tokens for dialog upload fields', () => {
  const source = read(paths.compactFileUpload)

  assert.match(source, /var\(--admin-dashboard-control-bg\)|var\(--admin-shell-control-bg\)/)
  assert.match(source, /var\(--admin-dashboard-card-border\)|var\(--admin-shell-control-border\)/)
  assert.match(source, /var\(--admin-dashboard-card-text\)|var\(--admin-shell-text\)/)
  assert.doesNotMatch(source, /border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]/)
})

test('exercise editor tabs and thumbnail uploader use light-mode admin tokens', () => {
  const dialogSource = read(paths.exerciseEditorDialog)
  const avatarUploadSource = read(paths.avatarFileUpload)

  assert.match(dialogSource, /<TabsList className="admin-shell-exercise-dialog-tabs-list">/)
  assert.match(dialogSource, /<TabsTrigger value="details" className="admin-shell-exercise-dialog-tabs-trigger">Details<\/TabsTrigger>/)
  assert.match(dialogSource, /<TabsTrigger value="muscles" className="admin-shell-exercise-dialog-tabs-trigger">Muscles<\/TabsTrigger>/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-control-bg\)|var\(--admin-shell-control-bg\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-border\)|var\(--admin-shell-control-border\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-text\)|var\(--admin-shell-text\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-muted\)|var\(--admin-shell-muted\)/)
  assert.doesNotMatch(avatarUploadSource, /border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]|text-\[#8EA0BC\]/)
})

test('athlete dialogs do not override shared dialog tokens with dark-only shell colors', () => {
  const source = read(paths.athletesDataTable)
  const cssSource = read(paths.globalsCss)

  assert.match(source, /DialogContent[\s\S]*?var\(--admin-dashboard-card-bg\)/)
  assert.match(source, /DialogContent[\s\S]*?var\(--admin-dashboard-card-border\)/)
  assert.match(source, /DialogContent[\s\S]*?var\(--admin-dashboard-card-text\)/)
  assert.doesNotMatch(source, /admin-shell-athletes-invite-dialog[^"`]*?(?:border-\[#24334A\]|!border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\])/, 'athlete dialog shells should use admin light-mode tokens')
  assert.doesNotMatch(source, /create-athlete-[^"`]*?(?:!border-\[#24334A\]|bg-\[#111D30\]|text-\[#DCE6F8\]|placeholder:text-\[#70809E\])/, 'athlete dialog form controls should use admin dashboard control tokens')
  assert.match(cssSource, /\.admin-shell-athletes-invite-dialog\s*\{[^}]*border:\s*1px solid var\(--admin-dashboard-card-border\);[^}]*background:\s*var\(--admin-dashboard-card-bg\);/)
  assert.match(cssSource, /\.admin-shell-athletes-invite-dialog \.ui-dialog-title\s*\{[^}]*color:\s*var\(--admin-dashboard-card-text\);/)
  assert.match(cssSource, /\.admin-shell-athletes-invite-dialog-copy\s*\{[^}]*color:\s*var\(--admin-dashboard-card-muted\);/)
})
