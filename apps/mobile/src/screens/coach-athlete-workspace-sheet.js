import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppSheetHeader, AppSurfaceCard } from '../ui/primitives.js'

function WorkspaceCard({ title, body, eyebrow = null, theme }) {
  return (
    <AppSurfaceCard theme={theme} contentClassName="px-5 py-5">
      {eyebrow ? <Text className="mb-2 text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: theme.accentText }}>{eyebrow}</Text> : null}
      <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{title}</Text>
      <Text className="mt-2 text-[15px] leading-[22px]" style={{ color: theme.textMuted }}>{body}</Text>
    </AppSurfaceCard>
  )
}

function CoachAthleteWorkspaceSheetContent({ onClose, selectedAthlete, readinessDraft = { percent: '', note: '' }, workspaceFormVersion = 0, onChangeReadinessDraft = () => {}, onSaveReadinessMetric, isSavingMetric = false, saveNotice = '', saveErrorMessage = '', theme }) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')
  const athleteName = selectedAthlete?.name ?? 'No athlete selected'
  const readiness = selectedAthlete?.readinessLabel ?? 'No readiness state yet'
  const latestCheckIn = selectedAthlete?.checkInLabel ?? 'Latest check-in unavailable'
  const nextAction = selectedAthlete?.nextActionLabel ?? 'No next coaching action yet'
  const hasBackendAthleteLink = Boolean(selectedAthlete?.athleteProfileId)
  const isSaveDisabled = !hasBackendAthleteLink || isSavingMetric || readinessDraft.percent === ''

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="px-5 pb-4" style={{ paddingTop: Math.max(insets.top, 16), borderBottomWidth: 1, borderBottomColor: resolvedTheme.border }}>
        <AppSheetHeader theme={resolvedTheme} title={athleteName} onBack={onClose} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <WorkspaceCard
          theme={resolvedTheme}
          eyebrow="Coach workflow"
          title={athleteName}
          body={`${readiness} • ${latestCheckIn} • ${nextAction}`}
        />
        <WorkspaceCard
          theme={resolvedTheme}
          title="Assessment capture"
          body="Enter the athlete's current readiness and the next follow-up note here before saving the real coach-side snapshot."
        />
        <AppSurfaceCard key={`${workspaceFormVersion}-readiness-form`} theme={resolvedTheme} contentClassName="gap-4 px-5 py-5">
          <Text className="text-[20px] font-bold" style={{ color: resolvedTheme.text }}>Readiness snapshot</Text>
          <Text className="text-[15px] leading-[22px]" style={{ color: resolvedTheme.textMuted }}>
            Capture the selected athlete's current readiness percentage and the next coaching action before saving.
          </Text>
          <View className="gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.accentText }}>Readiness percentage</Text>
            <View className="rounded-[18px] px-4 py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }}>
              <TextInput
                className="text-[17px] font-semibold"
                style={{ color: resolvedTheme.text, backgroundColor: 'transparent', outlineStyle: 'none' }}
                value={readinessDraft.percent}
                onChangeText={(nextValue) => onChangeReadinessDraft?.((current) => ({ ...current, percent: nextValue.replace(/[^0-9]/g, '').slice(0, 3) }))}
                placeholder="82"
                placeholderTextColor={resolvedTheme.textSoft}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.accentText }}>Next coach action</Text>
            <View className="rounded-[18px] px-4 py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surfaceMuted }}>
              <TextInput
                className="min-h-[88px] text-[16px]"
                style={{ color: resolvedTheme.text, backgroundColor: 'transparent', outlineStyle: 'none', textAlignVertical: 'top' }}
                value={readinessDraft.note}
                onChangeText={(nextValue) => onChangeReadinessDraft?.((current) => ({ ...current, note: nextValue }))}
                placeholder="What should happen next for this athlete?"
                placeholderTextColor={resolvedTheme.textSoft}
                multiline
              />
            </View>
          </View>
        </AppSurfaceCard>
        <WorkspaceCard
          theme={resolvedTheme}
          title="Session notes and follow-up"
          body="Keep red flags, coaching notes, and the next action visible so the coach can move straight into the next database-backed workflow."
        />
        <WorkspaceCard
          theme={resolvedTheme}
          title="Database write"
          body={hasBackendAthleteLink
            ? 'Save the current readiness snapshot through the real coach-side write seam.'
            : 'Backend athlete link required before this save can go live.'}
        />
        <AppButton
          theme={resolvedTheme}
          label={isSavingMetric ? 'Saving readiness…' : 'Save readiness snapshot'}
          disabled={isSaveDisabled}
          onPress={onSaveReadinessMetric}
        />
        {saveNotice ? <Text className="text-[14px] font-medium" style={{ color: resolvedTheme.accentText }}>{saveNotice}</Text> : null}
        {saveErrorMessage ? <Text className="text-[14px] font-medium" style={{ color: resolvedTheme.dangerText }}>{saveErrorMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

export function CoachAthleteWorkspaceSheet({ isVisible, onClose, selectedAthlete, readinessDraft = { percent: '', note: '' }, workspaceFormVersion = 0, onChangeReadinessDraft = () => {}, onSaveReadinessMetric, isSavingMetric = false, saveNotice = '', saveErrorMessage = '', theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <CoachAthleteWorkspaceSheetContent
        onClose={onClose}
        selectedAthlete={selectedAthlete}
        readinessDraft={readinessDraft}
        workspaceFormVersion={workspaceFormVersion}
        onChangeReadinessDraft={onChangeReadinessDraft}
        onSaveReadinessMetric={onSaveReadinessMetric}
        isSavingMetric={isSavingMetric}
        saveNotice={saveNotice}
        saveErrorMessage={saveErrorMessage}
        theme={theme}
      />
    </Modal>
  )
}
