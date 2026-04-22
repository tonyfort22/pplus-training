import { Pressable, ScrollView, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoPphtGreenSvg } from '../assets/logo-ppht-green.js';
import { pphtBarbellSvg, pphtCalendarDotsSvg, pphtChartBarSvg, pphtUserSvg, pphtUsersSvg } from '../assets/ppht-icons.js';
import { getAppScreenViewModel } from './shell-view-models.js';

function tintSvg(svg, color) {
  return svg.replace(/fill="#000000"/g, `fill="${color}"`)
}

function renderProfileHeaderIcon(styles) {
  return <SvgXml xml={tintSvg(pphtUserSvg, '#ffffff')} width="26" height="26" />
}

function renderUtilityHeaderIcon(styles) {
  return <SvgXml xml={tintSvg(pphtCalendarDotsSvg, '#ffffff')} width="24" height="24" />
}

function BottomNavIcon({ tabKey, styles, isActive }) {
  const iconColor = isActive ? '#ffffff' : '#f8fafc'

  if (tabKey === 'train') {
    return <SvgXml xml={tintSvg(pphtBarbellSvg, iconColor)} width="22" height="22" />
  }

  if (tabKey === 'progress') {
    return <SvgXml xml={tintSvg(pphtChartBarSvg, iconColor)} width="22" height="22" />
  }

  if (tabKey === 'team') {
    return <SvgXml xml={tintSvg(pphtUsersSvg, iconColor)} width="22" height="22" />
  }

  return (
    <View style={styles.bottomNavIconCanvas}>
      <View style={[styles.bottomNavIconChatBubble, styles.bottomNavIconStroke, isActive && styles.bottomNavIconStrokeActive]} />
      <View style={[styles.bottomNavIconChatTail, styles.bottomNavIconStroke, isActive && styles.bottomNavIconStrokeActive]} />
    </View>
  )
}

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
  const tabViewItems = bottomTabs

  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNavMainPill}>
        {tabViewItems.primaryTabs.map((tab) => (
          <Pressable key={tab.key} style={[styles.bottomNavTab, tab.isActive && styles.bottomNavTabActive]} onPress={() => onTabPress(tab.key)}>
            <BottomNavIcon tabKey={tab.key} styles={styles} isActive={tab.isActive} />
          </Pressable>
        ))}
      </View>

      {tabViewItems.utilityTab ? (
        <Pressable
          style={[styles.bottomNavUtilityButton, tabViewItems.utilityTab.isActive && styles.bottomNavUtilityButtonActive]}
          onPress={() => onTabPress(tabViewItems.utilityTab.key)}
        >
          <BottomNavIcon tabKey={tabViewItems.utilityTab.key} styles={styles} isActive={tabViewItems.utilityTab.isActive} />
        </Pressable>
      ) : null}
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
  const activePreviewState = previewStates?.find((state) => state.isActive) || null

  return (
    <View style={styles.appShell}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandHeader}>
          <View style={styles.brandHeaderSide}>
            <Pressable style={styles.brandIconButton}>{renderProfileHeaderIcon(styles)}</Pressable>
          </View>
          <View style={styles.brandHeaderCenter}>
            <View style={styles.brandLogoWrap}>
              <SvgXml xml={logoPphtGreenSvg} width="110" height="36" />
            </View>
          </View>
          <View style={[styles.brandHeaderSide, styles.brandHeaderSideRight]}>
            <Pressable style={styles.brandIconButton}>{renderUtilityHeaderIcon(styles)}</Pressable>
          </View>
        </View>
        {previewStates?.length ? (
          <View style={styles.topHeader}>
            <View style={styles.previewBar}>
              <View style={styles.previewHeaderTopRow}>
                <Text style={styles.previewBarLabel}>Preview state</Text>
                {activePreviewState ? <Text style={styles.previewHeaderActiveLabel}>{activePreviewState.label}</Text> : null}
              </View>
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
