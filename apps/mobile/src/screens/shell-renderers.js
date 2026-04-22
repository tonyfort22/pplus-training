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

export function renderAppShell({ styles, screen, bottomTabs, trainRenderModel, sessionRenderModel, onTabPress, renderTrainSurface, renderGenericSections }) {
  return (
    <View style={styles.appShell}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
