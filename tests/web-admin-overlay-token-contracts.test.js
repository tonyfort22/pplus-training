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
  const dropdownMenuSource = read(paths.dropdownMenu)
  const selectSource = read(paths.select)
  const multiComboboxSource = read(paths.multiCombobox)

  assert.match(dropdownMenuSource, /var\(--admin-shell-nav-active-bg\)/)
  assert.match(dropdownMenuSource, /var\(--admin-shell-nav-active-text\)|var\(--admin-shell-accent\)/)

  assert.match(selectSource, /hover:bg-transparent/)
  assert.match(selectSource, /focus:bg-transparent/)
  assert.match(selectSource, /data-\[highlighted\]:bg-transparent/)
  assert.match(selectSource, /data-\[state=checked\]:text-\[var\(--admin-shell-accent\)\]/)
  assert.doesNotMatch(selectSource, /hover:bg-\[var\(--admin-shell-nav-active-bg\)\]/)

  assert.match(multiComboboxSource, /hover:bg-transparent/)
  assert.match(multiComboboxSource, /focus:bg-transparent/)
  assert.match(multiComboboxSource, /text-\[var\(--admin-shell-accent\)\]/)
  assert.doesNotMatch(multiComboboxSource, /hover:bg-\[var\(--admin-shell-nav-active-bg\)\]/)
})

test('sheet primitive close control uses admin overlay tokens', () => {
  const source = read(paths.sheet)

  assert.match(source, /SheetPrimitive\.Close[\s\S]*?border-\[color:var\(--admin-shell-border\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?bg-\[var\(--admin-shell-surface-muted\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?text-\[var\(--admin-shell-muted\)\]/)
  assert.match(source, /SheetPrimitive\.Close[\s\S]*?focus:ring-\[var\(--admin-input-focus\)\]/)
})

test('compact file upload uses admin control tokens and truncates long file links', () => {
  const source = read(paths.compactFileUpload)

  assert.match(source, /var\(--admin-dashboard-control-bg\)|var\(--admin-shell-control-bg\)/)
  assert.match(source, /var\(--admin-dashboard-card-border\)|var\(--admin-shell-control-border\)/)
  assert.match(source, /var\(--admin-dashboard-card-text\)|var\(--admin-shell-text\)/)
  assert.match(source, /min-w-0/)
  assert.match(source, /truncate/)
  assert.doesNotMatch(source, /border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]/)
})

test('exercise editor sheet has no tabs and uses styled dropdowns plus truncating uploaders', () => {
  const dialogSource = read(paths.exerciseEditorDialog)
  const avatarUploadSource = read(paths.avatarFileUpload)

  assert.doesNotMatch(dialogSource, /TabsList|TabsTrigger|TabsContent/)
  assert.match(dialogSource, /admin-shell-exercise-select-trigger admin-shell-athletes-example-columns-button admin-shell-athletes-create-select-trigger w-full/)
  assert.match(dialogSource, /admin-shell-athletes-example-columns-icon/)
  assert.match(dialogSource, /className="admin-shell-exercise-combobox"/)
  assert.match(read(paths.multiCombobox), /multi-combobox-trigger/)
  assert.match(read(paths.multiCombobox), /multi-combobox-selected-values/)
  assert.match(read(paths.multiCombobox), /multi-combobox-badge[\s\S]*truncate/)
  assert.match(read(paths.globalsCss), /\.admin-shell-exercise-combobox \.multi-combobox-selected-values\s*\{[^}]*flex-wrap:\s*nowrap;[^}]*overflow:\s*hidden;/)
  assert.match(read(paths.globalsCss), /\.admin-shell-exercise-combobox \.multi-combobox-badge\s*\{[^}]*max-width:\s*calc\(100% - 2rem\);/)
  assert.doesNotMatch(dialogSource, /UnsupportedFieldNote/)
  assert.doesNotMatch(dialogSource, /htmlFor="exercise-status"[\s\S]{0,700}<UnsupportedFieldNote \/>/)
  assert.match(dialogSource, /DropdownMenuContent align="start" className="min-w-\[var\(--radix-dropdown-menu-trigger-width\)\]"/)
  assert.match(dialogSource, /DropdownMenuItem[\s\S]*text-\[var\(--admin-shell-accent\)\]/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-control-bg\)|var\(--admin-shell-control-bg\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-border\)|var\(--admin-shell-control-border\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-text\)|var\(--admin-shell-text\)/)
  assert.match(avatarUploadSource, /var\(--admin-dashboard-card-muted\)|var\(--admin-shell-muted\)/)
  assert.match(avatarUploadSource, /min-w-0/)
  assert.match(avatarUploadSource, /truncate/)
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
