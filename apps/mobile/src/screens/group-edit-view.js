import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Trash2, Users } from 'lucide-react-native'
import { getAppTheme } from '../theme/app-theme.js'
import { AppDangerPillButton, AppOutlinedActionButton } from '../ui/primitives.js'
import { AthleteMultiSelectView, AthleteSelectionRow } from './athlete-multi-select-view.js'

function createDraftFromModel(model) {
  return {
    groupName: model.title || '',
    athletes: Array.isArray(model.athletes) ? model.athletes : [],
    athleteIds: Array.isArray(model.selectedAthleteIds) ? model.selectedAthleteIds : [],
  }
}

function GroupEditViewContent({
  model,
  onClose,
  onSave,
  onAddAthletes,
  onDeleteGroup,
  theme,
}) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const [draft, setDraft] = useState(() => (model ? createDraftFromModel(model) : null))
  const [isAddAthletesViewOpen, setIsAddAthletesViewOpen] = useState(false)
  const [selectedAddAthleteIds, setSelectedAddAthleteIds] = useState([])
  const [addAthleteSearchQuery, setAddAthleteSearchQuery] = useState('')

  useEffect(() => {
    setDraft(model ? createDraftFromModel(model) : null)
    setSelectedAddAthleteIds(model?.selectedAthleteIds || [])
  }, [model])

  if (!model || !draft) return null

  function handleToggleAddAthlete(athleteId) {
    setSelectedAddAthleteIds((currentValue) => currentValue.includes(athleteId)
      ? currentValue.filter((id) => id !== athleteId)
      : [...currentValue, athleteId])
  }

  function handleOpenAddAthletes() {
    setIsAddAthletesViewOpen(true)
    onAddAthletes?.()
  }

  function handleCloseAddAthletes() {
    setIsAddAthletesViewOpen(false)
    setSelectedAddAthleteIds(model?.selectedAthleteIds || [])
    setAddAthleteSearchQuery('')
  }

  function handleConfirmAddAthletes() {
    setDraft((currentDraft) => ({
      ...currentDraft,
      athleteIds: selectedAddAthleteIds,
      athletes: (model.addAthleteSheet?.athletes || []).filter((athlete) => selectedAddAthleteIds.includes(athlete.id)),
    }))
    setIsAddAthletesViewOpen(false)
    setAddAthleteSearchQuery('')
  }

  function handleRemoveDraftAthlete(athleteId) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      athleteIds: currentDraft.athleteIds?.filter((id) => id !== athleteId) || [],
      athletes: currentDraft.athletes.filter((athlete) => athlete.id !== athleteId),
    }))
    setSelectedAddAthleteIds((currentValue) => currentValue.filter((id) => id !== athleteId))
  }

  if (isAddAthletesViewOpen) {
    return (
      <AthleteMultiSelectView
        isVisible={isAddAthletesViewOpen}
        presentation="inline"
        theme={resolvedTheme}
        sheet={model.addAthleteSheet}
        selectedAthleteIds={selectedAddAthleteIds}
        onToggleAthlete={handleToggleAddAthlete}
        searchQuery={addAthleteSearchQuery}
        onSearchChange={setAddAthleteSearchQuery}
        onAddAthletes={handleConfirmAddAthletes}
        onClose={handleCloseAddAthletes}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }}>
        <View className="mb-7 flex-row items-center justify-between">
          <Pressable className="px-1 py-2" onPress={onClose}>
            <Text className="text-[17px]" style={{ color: resolvedTheme.textMuted }}>{model.cancelLabel || 'Cancel'}</Text>
          </Pressable>
          <Pressable className="px-1 py-2" onPress={() => onSave?.(draft)}>
            <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accentText }}>{model.saveLabel || 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
          <View className="gap-9">
            <TextInput
              className="px-0 py-1 text-[28px] font-bold leading-[32px]"
              onChangeText={(nextValue) => setDraft((currentDraft) => ({ ...currentDraft, groupName: nextValue }))}
              placeholder={model.namePlaceholder || 'Group name'}
              placeholderTextColor={resolvedTheme.textSoft}
              style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: resolvedTheme.text }}
              value={draft.groupName}
            />

            <View className="gap-9">
              <AppOutlinedActionButton
                theme={resolvedTheme}
                label={model.addAthletesLabel || 'Add Athletes'}
                onPress={handleOpenAddAthletes}
                leftIcon={<Users color={resolvedTheme.accentText} size={18} strokeWidth={2.2} />}
              />

              {draft.athletes.length > 0 ? (
                <View>
                  {draft.athletes.map((athlete) => (
                    <AthleteSelectionRow
                      key={athlete.id}
                      theme={resolvedTheme}
                      athlete={athlete}
                      rightAction={
                        <Trash2 color={resolvedTheme.textMuted} size={18} strokeWidth={2.2} />
                      }
                      onRightActionPress={() => handleRemoveDraftAthlete(athlete.id)}
                    />
                  ))}
                </View>
              ) : null}

              <AppDangerPillButton
                theme={resolvedTheme}
                label={model.deleteLabel || 'Delete Group'}
                onPress={onDeleteGroup}
                leftIcon={<Trash2 color={resolvedTheme.dangerText} size={16} strokeWidth={2.2} />}
                style={{ marginTop: 20 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export function GroupEditView({ isVisible, model, onClose, onSave, onAddAthletes, onDeleteGroup, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <GroupEditViewContent
          model={model}
          onClose={onClose}
          onSave={onSave}
          onAddAthletes={onAddAthletes}
          onDeleteGroup={onDeleteGroup}
          theme={theme}
        />
      </SafeAreaProvider>
    </Modal>
  )
}
