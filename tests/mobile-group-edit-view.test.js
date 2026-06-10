import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createEmptyGroupEditDraftModel, getGroupEditViewModel } from '../apps/mobile/src/groups/group-edit-view-models.js'

test('Create Group edit model matches the workout edit shell but removes notes', () => {
  const model = createEmptyGroupEditDraftModel()

  assert.equal(model.title, '')
  assert.equal(model.namePlaceholder, 'Group name')
  assert.equal(model.cancelLabel, 'Cancel')
  assert.equal(model.saveLabel, 'Save')
  assert.equal(model.addAthletesLabel, 'Add Athletes')
  assert.equal(model.deleteLabel, 'Delete Group')
  assert.equal(model.notesPlaceholder, undefined)
  assert.deepEqual(model.athletes, [])
  assert.deepEqual(model.selectedAthleteIds, [])
  assert.deepEqual(model.addAthleteSheet, {
    title: 'Athletes',
    searchPlaceholder: 'Search or Create Athletes',
    addButtonLabel: 'Add',
    athletes: [],
  })
})

test('Group edit model builds the Add Athletes picker from coach athletes', () => {
  const model = getGroupEditViewModel({
    group: {
      id: 'group-speed',
      name: 'Speed Group',
      athletes: [{ id: 'ath-1', name: 'Thomas' }],
    },
    availableAthletes: [
      { id: 'ath-1', firstName: 'Thomas', lastName: 'Fortugno', avatarUrl: 'https://example.test/thomas.png' },
      { id: 'ath-2', firstName: 'Marco', lastName: 'Rossi' },
    ],
  })

  assert.equal(model.addAthleteSheet.title, 'Athletes')
  assert.equal(model.addAthleteSheet.searchPlaceholder, 'Search or Create Athletes')
  assert.equal(model.addAthleteSheet.addButtonLabel, 'Add')
  assert.deepEqual(model.addAthleteSheet.athletes, [
    { id: 'ath-1', name: 'Thomas Fortugno', thumbnailUrl: 'https://example.test/thomas.png' },
    { id: 'ath-2', name: 'Marco Rossi', thumbnailUrl: null },
  ])
  assert.deepEqual(model.selectedAthleteIds, ['ath-1'])
})

test('Edit Group model hydrates an athlete_groups row and keeps the same design labels', () => {
  const model = getGroupEditViewModel({
    group: {
      id: 'group-speed',
      name: 'Speed Group',
      athleteCountLabel: '2 athletes',
      athletes: [{ id: 'ath-1', name: 'Thomas' }],
    },
  })

  assert.equal(model.groupId, 'group-speed')
  assert.equal(model.title, 'Speed Group')
  assert.equal(model.addAthletesLabel, 'Add Athletes')
  assert.equal(model.deleteLabel, 'Delete Group')
  assert.equal(model.notesPlaceholder, undefined)
  assert.deepEqual(model.athletes, [{ id: 'ath-1', name: 'Thomas' }])
})

test('Edit Group model rehydrates saved membership athleteIds from available coach athletes', () => {
  const model = getGroupEditViewModel({
    group: {
      id: 'group-speed',
      name: 'Speed Group',
      athleteIds: ['ath-1', 'ath-2'],
    },
    availableAthletes: [
      { id: 'coach-athlete-ath-1', firstName: 'Thomas', lastName: 'Thibault', avatarUrl: 'https://example.test/thomas.png' },
      { id: 'coach-athlete-ath-2', firstName: 'Tournoi', lastName: 'AAA', avatarUrl: 'https://example.test/tournoi.png' },
    ],
  })

  assert.deepEqual(model.athletes, [
    { id: 'coach-athlete-ath-1', name: 'Thomas Thibault', thumbnailUrl: 'https://example.test/thomas.png' },
    { id: 'coach-athlete-ath-2', name: 'Tournoi AAA', thumbnailUrl: 'https://example.test/tournoi.png' },
  ])
  assert.deepEqual(model.selectedAthleteIds, ['coach-athlete-ath-1', 'coach-athlete-ath-2'])
})

test('GroupEditView reuses the workout edit visual shell without rendering notes', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/group-edit-view.js'), 'utf8')

  assert.match(source, /Modal visible=\{isVisible\} animationType="slide"/)
  assert.match(source, /SafeAreaView className="flex-1"/)
  assert.match(source, /model\.cancelLabel \|\| 'Cancel'/)
  assert.match(source, /model\.saveLabel \|\| 'Save'/)
  assert.match(source, /namePlaceholder/)
  assert.match(source, /model\.addAthletesLabel \|\| 'Add Athletes'/)
  assert.match(source, /model\.deleteLabel \|\| 'Delete Group'/)
  assert.match(source, /AppOutlinedActionButton/)
  assert.match(source, /AppDangerPillButton/)
  assert.doesNotMatch(source, /Add notes|notesPlaceholder|groupNotes|workoutNotes/)
})

test('GroupEditView opens an inline Add Athletes picker based on the Add Exercises picker pattern', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/group-edit-view.js'), 'utf8')

  assert.match(source, /import \{ AthleteMultiSelectView, AthleteSelectionRow \} from '\.\/athlete-multi-select-view\.js'/)
  assert.match(source, /const \[isAddAthletesViewOpen, setIsAddAthletesViewOpen\] = useState\(false\)/)
  assert.match(source, /const \[selectedAddAthleteIds, setSelectedAddAthleteIds\] = useState\(\[\]\)/)
  assert.match(source, /function handleToggleAddAthlete\(athleteId\)/)
  assert.match(source, /function handleOpenAddAthletes\(\)[\s\S]*setIsAddAthletesViewOpen\(true\)[\s\S]*onAddAthletes\?\.\(\)/)
  assert.match(source, /function handleConfirmAddAthletes\(\)[\s\S]*athletes: \(model\.addAthleteSheet\?\.athletes \|\| \[\]\)\.filter\(\(athlete\) => selectedAddAthleteIds\.includes\(athlete\.id\)\)/)
  assert.match(source, /if \(isAddAthletesViewOpen\) \{[\s\S]*<AthleteMultiSelectView[\s\S]*presentation="inline"[\s\S]*sheet=\{model\.addAthleteSheet\}[\s\S]*selectedAthleteIds=\{selectedAddAthleteIds\}[\s\S]*onToggleAthlete=\{handleToggleAddAthlete\}/)
  assert.match(source, /model\.addAthletesLabel \|\| 'Add Athletes'[\s\S]*onPress=\{handleOpenAddAthletes\}/)
  assert.match(source, /function handleRemoveDraftAthlete\(athleteId\)/)
  assert.match(source, /athleteIds: currentDraft\.athleteIds\?\.filter\(\(id\) => id !== athleteId\) \|\| \[\]/)
  assert.match(source, /athletes: currentDraft\.athletes\.filter\(\(athlete\) => athlete\.id !== athleteId\)/)
  assert.match(source, /\{draft\.athletes\.length > 0 \? \([\s\S]*draft\.athletes\.map\(\(athlete\) => \([\s\S]*<AthleteSelectionRow[\s\S]*key=\{athlete\.id\}[\s\S]*athlete=\{athlete\}[\s\S]*rightAction=\{[\s\S]*<Trash2 color=\{resolvedTheme\.textMuted\} size=\{18\} strokeWidth=\{2\.2\} \/>[\s\S]*onRightActionPress=\{\(\) => handleRemoveDraftAthlete\(athlete\.id\)\}/)
})

test('AthleteMultiSelectView mirrors the exercise picker labels and selected-count add button', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/athlete-multi-select-view.js'), 'utf8')

  assert.match(source, /export function AthleteSelectionRow\(\{ theme, athlete, selected = false, onPress = null, rightAction = null, onRightActionPress = null \}\)/)
  assert.match(source, /const trailingAction = rightAction \|\| \(/)
  assert.match(source, /\{rightAction \? \([\s\S]*<Pressable[\s\S]*onPress=\{onRightActionPress\}[\s\S]*\{rightAction\}[\s\S]*\) : trailingAction\}/)
  assert.match(source, /<AthleteSelectionRow[\s\S]*athlete=\{athlete\}[\s\S]*selected=\{selectedAthleteIds\.includes\(athlete\.id\)\}[\s\S]*onPress=\{\(\) => onToggleAthlete\?\.\(athlete\.id\)\}/)
  assert.match(source, /export function AthleteMultiSelectView\(/)
  assert.match(source, /AppSheetHeader theme=\{resolvedTheme\} title=\{sheet\.title\}/)
  assert.match(source, /\(sheet\?\.athletes \|\| \[\]\)\.filter/)
  assert.match(source, /placeholder=\{sheet\.searchPlaceholder\}/)
  assert.match(source, /label=\{`\$\{sheet\.addButtonLabel\} \$\{selectedAthleteIds\.length\}`\}/)
  assert.match(source, /disabled=\{selectedAthleteIds\.length === 0\}/)
  assert.match(source, /AppSelectionIndicator/)
  assert.match(source, /import \{ Image, Keyboard, Modal, Platform, Pressable, ScrollView, Text, View \} from 'react-native'/)
  assert.match(source, /import \{ Info, UserCircle2 \} from 'lucide-react-native'/)
  assert.match(source, /UserCircle2 color=\{theme\.iconMuted\} size=\{34\} strokeWidth=\{1\.8\}/)
  assert.match(source, /const \[isSearchFocused, setIsSearchFocused\] = useState\(false\)/)
  assert.match(source, /const \[keyboardHeight, setKeyboardHeight\] = useState\(0\)/)
  assert.match(source, /Platform\.OS === 'ios' \? 'keyboardWillChangeFrame' : 'keyboardDidShow'/)
  assert.match(source, /const keyboardBottomOffset = Math\.max\(keyboardHeight - insets\.bottom, 0\)/)
  assert.match(source, /const scrollBottomPadding = bottomControlsHeight \+ safeBottom \+ keyboardBottomOffset/)
  assert.match(source, /style=\{\{ bottom: keyboardBottomOffset, paddingBottom: safeBottom, backgroundColor: resolvedTheme\.background \}\}/)
  assert.match(source, /<View className="flex-row items-center gap-3 py-3"/)
  assert.match(source, /onFocus=\{\(\) => setIsSearchFocused\(true\)\}/)
  assert.match(source, /onBlur=\{\(\) => setIsSearchFocused\(false\)\}/)
  assert.doesNotMatch(source, /bottom-0/)
  assert.doesNotMatch(source, /paddingBottom: 112/)
  assert.doesNotMatch(source, /👤/)
  assert.doesNotMatch(source, /Exercise|exercise/)
})

test('mobile app passes coach athletes into the Create/Edit Group view model', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')

  assert.match(appSource, /import \{ GroupEditView \} from '\.\/src\/screens\/group-edit-view\.js';/)
  assert.match(appSource, /import \{ createEmptyGroupEditDraftModel, getGroupEditViewModel \} from '\.\/src\/groups\/group-edit-view-models\.js';/)
  assert.match(appSource, /const \[isGroupEditViewOpen, setIsGroupEditViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const \[groupEditDraftModel, setGroupEditDraftModel\] = useState\(null\);/)
  assert.match(appSource, /const groupEditClient = useMemo\(\(\) => createMobileGroupsClient\(\{ accessToken: authSession\?\.accessToken \}\), \[authSession\?\.accessToken\]\);/)
  assert.match(appSource, /const groupEditViewModel = useMemo\(\(\) => getGroupEditViewModel\(\{ group: selectedGroupEditModel, groupDraftModel: groupEditDraftModel, availableAthletes: coachAthletesList \}\), \[coachAthletesList, groupEditDraftModel, selectedGroupEditModel\]\);/)
  assert.match(appSource, /if \(targetKey === 'create-group'\) \{[\s\S]*setGroupEditDraftModel\(createEmptyGroupEditDraftModel\(\)\);[\s\S]*setIsGroupEditViewOpen\(true\);[\s\S]*return;/)
  assert.match(appSource, /if \(targetKey === 'group'\) \{[\s\S]*payload\?\.groupId[\s\S]*setSelectedGroupEditModel\([\s\S]*setIsGroupEditViewOpen\(true\);[\s\S]*return;/)
  assert.match(appSource, /async function handleSaveGroupEdit\(draft = \{\}\)/)
  assert.match(appSource, /const athleteIds = \(draft\.athleteIds \|\| draft\.athletes\?\.map\(\(athlete\) => athlete\.id\) \|\| \[\]\)\.map\(normalizeGroupAthleteIdForPersistence\)\.filter\(Boolean\);/)
  assert.match(appSource, /if \(selectedGroupEditModel\?\.id \|\| draft\.groupId\) \{[\s\S]*await groupEditClient\.updateGroup\(\{[\s\S]*groupId: selectedGroupEditModel\?\.id \|\| draft\.groupId,[\s\S]*name: draft\.groupName,[\s\S]*athleteIds,[\s\S]*\}\)[\s\S]*\} else \{[\s\S]*await groupEditClient\.createGroup\(\{[\s\S]*coachId: effectiveBootstrapState\.coachProfile\?\.id,[\s\S]*name: draft\.groupName,[\s\S]*athleteIds,[\s\S]*\}\)/)
  assert.match(appSource, /await refreshAuthSession\(\);[\s\S]*handleCloseGroupEditView\(\);/)
  assert.match(appSource, /<GroupEditView[\s\S]*isVisible=\{isGroupEditViewOpen\}[\s\S]*model=\{groupEditViewModel\}/)
})
