import { Pressable, ScrollView, Text, View } from 'react-native';
import { getAppScreenViewModel, getBottomTabViewItems } from './shell-view-models.js';

export function renderAppScreen({ screen, trainRenderModel, sessionRenderModel, styles, renderTrainSurface, renderGenericSections }) {
  const screenViewModel = getAppScreenViewModel({ screen })

  if (screenViewModel.type === 'train-surface') {
    return renderTrainSurface({
      trainRenderModel,
      sessionRenderModel,
      styles,
    })
  }

  return renderGenericSections({
    sections: screenViewModel.sections,
    styles,
  })
}

export function renderBottomTabBar({ bottomTabs, styles, onTabPress }) {
  const tabViewItems = getBottomTabViewItems(bottomTabs)

  return (
    <View style={styles.tabBar}>
      {tabViewItems.map((tab) => (
        <Pressable key={tab.key} style={[styles.tabButton, tab.isActive && styles.tabButtonActive]} onPress={() => onTabPress(tab.key)}>
          <Text style={[styles.tabLabel, tab.isActive && styles.tabLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function renderAppShell({
  styles,
  screen,
  bottomTabs,
  previewStates,
  trainRenderModel,
  sessionRenderModel,
  onTabPress,
  onPreviewStatePress,
  renderTrainSurface,
  renderGenericSections,
}) {
  return (
    <View style={styles.appShell}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {previewStates?.length ? (
          <View style={styles.previewBar}>
            <Text style={styles.previewBarLabel}>Preview state</Text>
            <View style={styles.previewButtonRow}>
              {previewStates.map((state) => (
                <Pressable
                  key={state.key}
                  style={[styles.previewButton, state.isActive && styles.previewButtonActive]}
                  onPress={() => onPreviewStatePress?.(state.key)}
                >
                  <Text style={[styles.previewButtonText, state.isActive && styles.previewButtonTextActive]}>{state.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {renderAppScreen({
          screen,
          trainRenderModel,
          sessionRenderModel,
          styles,
          renderTrainSurface,
          renderGenericSections,
        })}
      </ScrollView>

      {renderBottomTabBar({
        bottomTabs,
        styles,
        onTabPress,
      })}
    </View>
  )
}
