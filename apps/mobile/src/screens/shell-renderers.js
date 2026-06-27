import { BarChart3, CalendarDays, ChevronUp, Contact, Dumbbell, Play, User, Users } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoPphtGreenSvg } from '../assets/logo-ppht-green.js';
import { AppButton } from '../ui/primitives.js';
import { getAppScreenViewModel } from './shell-view-models.js';

function tintSvg(svg, color) {
  return svg.replace(/fill="#000000"/g, `fill="${color}"`)
}

function renderProfileHeaderIcon(styles) {
  return <User color={styles.theme.iconMuted} size={24} strokeWidth={2.2} />
}

function renderUtilityHeaderIcon(styles) {
  return <CalendarDays color={styles.theme.iconMuted} size={24} strokeWidth={2.1} />
}

function BottomNavIcon({ tabKey, styles, isActive }) {
  const iconColor = isActive ? styles.theme.text : styles.theme.iconMuted

  if (tabKey === 'train') {
    return <Dumbbell color={iconColor} size={22} strokeWidth={2.2} />
  }

  if (tabKey === 'progress') {
    return <BarChart3 color={iconColor} size={22} strokeWidth={2.2} />
  }

  if (tabKey === 'team') {
    return <Users color={iconColor} size={22} strokeWidth={2.2} />
  }

  if (tabKey === 'inbox') {
    return <Contact color={iconColor} size={22} strokeWidth={2.2} />
  }

  return <User color={iconColor} size={22} strokeWidth={2.2} />
}

export function renderAppScreen({ screen, trainRenderModel, sessionRenderModel, styles, onActionTarget, renderTrainSurface, renderAnalyticsView, renderAuthView, renderLoadingView, renderGenericSections }) {
  const screenViewModel = getAppScreenViewModel({ screen })

  if (screenViewModel.type === 'train-surface') {
    return renderTrainSurface({
      trainRenderModel,
      sessionRenderModel,
      styles,
    })
  }

  if (screenViewModel.type === 'analytics-surface') {
    return renderAnalyticsView(screenViewModel)
  }

  if (screenViewModel.type === 'auth-surface') {
    return renderAuthView(screenViewModel)
  }

  if (screenViewModel.type === 'loading-surface') {
    return renderLoadingView(screenViewModel)
  }

  return renderGenericSections({
    sections: screenViewModel.sections,
    styles,
    onActionTarget,
  })
}

export function renderBottomTabBar({ bottomTabs, styles, onTabPress }) {
  const tabViewItems = bottomTabs

  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNavMainPill}>
        {tabViewItems.tabs.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={`Open ${tab.label}`}
            testID={`bottom-tab-${tab.key}`}
            style={[styles.bottomNavTab, tab.isActive && styles.bottomNavTabActive]}
            onPress={() => onTabPress(tab.key)}
          >
            <BottomNavIcon tabKey={tab.key} styles={styles} isActive={tab.isActive} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function renderAppShell({
  styles,
  screen,
  bottomTabs,
  activeAthleteSummary = null,
  floatingStartWorkoutButton = null,
  trainRenderModel,
  sessionRenderModel,
  onTabPress,
  onProfileHeaderPress,
  onUtilityHeaderPress,
  onActionTarget,
  renderTrainSurface,
  renderAnalyticsView,
  renderAuthView,
  renderLoadingView,
  renderGenericSections,
}) {
  const screenViewModel = getAppScreenViewModel({ screen })

  if (screenViewModel.type === 'loading-surface') {
    return renderLoadingView(screenViewModel)
  }

  return (
    <View style={styles.appShell}>
      <ScrollView style={styles.shellScrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandHeader}>
          <View style={styles.brandHeaderSide}>
            <Pressable accessibilityRole="button" accessibilityLabel="Open Profile" testID="header-profile-button" style={styles.brandIconButton} onPress={onProfileHeaderPress}>{renderProfileHeaderIcon(styles)}</Pressable>
          </View>
          <View style={styles.brandHeaderCenter}>
            <View style={styles.brandLogoWrap}>
              <SvgXml xml={logoPphtGreenSvg} width="110" height="36" />
            </View>
          </View>
          <View style={[styles.brandHeaderSide, styles.brandHeaderSideRight]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Open Training Calendar" testID="header-calendar-button" style={styles.brandIconButton} onPress={onUtilityHeaderPress}>{renderUtilityHeaderIcon(styles)}</Pressable>
          </View>
        </View>
        {activeAthleteSummary ? (
          <View style={styles.activeAthleteBanner}>
            <View style={styles.activeAthleteBannerRow}>
              {activeAthleteSummary.avatarUrl ? (
                <Image
                  source={{ uri: activeAthleteSummary.avatarUrl }}
                  style={styles.activeAthleteAvatar}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.activeAthleteIdentity}>
                <Text className="text-[16px] font-medium" style={{ color: styles.theme.accentText }}>
                  {[activeAthleteSummary.firstName, activeAthleteSummary.lastName].filter(Boolean).join(' ')}
                </Text>
              </View>
              <View style={styles.activeAthleteLabelWrap}>
                <Text className="text-[14px] font-medium" style={{ color: styles.theme.accentText }}>Viewing athlete</Text>
              </View>
            </View>
          </View>
        ) : null}
        {renderAppScreen({
          screen,
          trainRenderModel,
          sessionRenderModel,
          styles,
          onActionTarget,
          renderTrainSurface,
          renderAnalyticsView,
          renderAuthView,
          renderLoadingView,
          renderGenericSections,
        })}
      </ScrollView>

      {floatingStartWorkoutButton ? (
        <View
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: 96,
          }}
        >
          {floatingStartWorkoutButton.kind === 'in-progress' ? (
            <Pressable
              accessibilityLabel="Open active workout"
              accessibilityRole="button"
              testID="floating-active-workout-button"
              onPress={() => onActionTarget?.(floatingStartWorkoutButton.targetKey, floatingStartWorkoutButton.actionPayload)}
              style={{
                minHeight: 52,
                borderRadius: 999,
                backgroundColor: styles.theme.accentSurface,
                borderWidth: 1,
                borderColor: styles.theme.accentBorder,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: styles.theme.cardShadow,
                shadowOpacity: 0.18,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 }}>
                <ChevronUp color={styles.theme.accentText} size={18} strokeWidth={2.4} />
                <Text numberOfLines={1} className="text-[15px] font-semibold" style={{ color: styles.theme.accentText, flexShrink: 1 }}>
                  {floatingStartWorkoutButton.label}
                </Text>
              </View>
              <Text className="text-[14px] font-semibold" style={{ color: styles.theme.accentText, marginLeft: 12 }}>
                {floatingStartWorkoutButton.elapsedLabel}
              </Text>
            </Pressable>
          ) : (
            <AppButton
              theme={styles.theme}
              label={floatingStartWorkoutButton.label}
              accessibilityLabel="Start workout"
              testID="floating-start-workout-button"
              leftIcon={<Play color={styles.theme.accentText} size={18} strokeWidth={2.4} fill={styles.theme.accentText} />}
              onPress={() => onActionTarget?.(floatingStartWorkoutButton.targetKey, floatingStartWorkoutButton.actionPayload)}
              style={{
                minHeight: 60,
                borderRadius: 999,
                shadowColor: styles.theme.cardShadow,
                shadowOpacity: 0.18,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
              }}
            />
          )}
        </View>
      ) : null}

      {bottomTabs ? renderBottomTabBar({
        bottomTabs,
        styles,
        onTabPress,
      }) : null}
    </View>
  )
}
