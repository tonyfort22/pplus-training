import { BarChart3, CalendarDays, Dumbbell, MessageCircle, User, Users } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoPphtGreenSvg } from '../assets/logo-ppht-green.js';
import { getAppScreenViewModel } from './shell-view-models.js';

function tintSvg(svg, color) {
  return svg.replace(/fill="#000000"/g, `fill="${color}"`)
}

function renderProfileHeaderIcon(styles) {
  return <User color="#ffffff" size={24} strokeWidth={2.2} />
}

function renderUtilityHeaderIcon(styles) {
  return <CalendarDays color="#ffffff" size={24} strokeWidth={2.1} />
}

function BottomNavIcon({ tabKey, styles, isActive }) {
  const iconColor = isActive ? '#ffffff' : '#f8fafc'

  if (tabKey === 'train') {
    return <Dumbbell color={iconColor} size={22} strokeWidth={2.2} />
  }

  if (tabKey === 'progress') {
    return <BarChart3 color={iconColor} size={22} strokeWidth={2.2} />
  }

  if (tabKey === 'team') {
    return <Users color={iconColor} size={22} strokeWidth={2.2} />
  }

  return <MessageCircle color={iconColor} size={22} strokeWidth={2.2} />
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
  trainRenderModel,
  sessionRenderModel,
  onTabPress,
  onUtilityHeaderPress,
  renderTrainSurface,
  renderGenericSections,
}) {
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
            <Pressable style={styles.brandIconButton} onPress={onUtilityHeaderPress}>{renderUtilityHeaderIcon(styles)}</Pressable>
          </View>
        </View>
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
