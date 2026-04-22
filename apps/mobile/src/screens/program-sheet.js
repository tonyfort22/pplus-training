import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { pphtBarbellSvg, pphtCalendarDotsSvg, pphtCheckSvg } from '../assets/ppht-icons.js';

function tintSvg(svg, color) {
  return svg.replace(/fill="#000000"/g, `fill="${color}"`)
}

function ProgramSheetStatIcon({ icon }) {
  if (icon === 'calendar') {
    return <SvgXml xml={tintSvg(pphtCalendarDotsSvg, '#8b5cf6')} width="18" height="18" />
  }

  return <SvgXml xml={tintSvg(pphtBarbellSvg, '#8b5cf6')} width="18" height="18" />
}

function ProgramSheetStatusBadge({ status, styles }) {
  if (status === 'done') {
    return (
      <View style={[styles.programSheetStatusBadge, styles.programSheetStatusBadgeDone]}>
        <SvgXml xml={tintSvg(pphtCheckSvg, '#22c55e')} width="14" height="14" />
      </View>
    )
  }

  return (
    <View style={[styles.programSheetStatusBadge, styles.programSheetStatusBadgeMissed]}>
      <Text style={styles.programSheetStatusBadgeMissedText}>×</Text>
    </View>
  )
}

export function renderProgramSheet({ isVisible, onClose, model, styles }) {
  if (!model) {
    return null
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.programSheetBackdrop}>
        <Pressable style={styles.programSheetBackdropPressable} onPress={onClose} />
        <View style={styles.programSheetPanel}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.programSheetScrollContent}>
            <View style={styles.programSheetHeaderRow}>
              <Pressable style={styles.programSheetBackButton} onPress={onClose}>
                <Text style={styles.programSheetBackButtonText}>‹</Text>
              </Pressable>
              <Pressable onPress={() => {}}>
                <Text style={styles.programSheetEditText}>{model.editLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.programSheetIntro}>
              <Text style={styles.programSheetTitle}>{model.title}</Text>
              <Text style={styles.programSheetDateRange}>{model.dateRangeLabel}</Text>
            </View>

            <View style={styles.programSheetProgressTrack}>
              <View style={styles.programSheetProgressRow}>
                {model.progressSegments.map((segment) => (
                  <View
                    key={segment.id}
                    style={[
                      styles.programSheetProgressSegment,
                      segment.isComplete && styles.programSheetProgressSegmentComplete,
                      segment.isCurrent && styles.programSheetProgressSegmentCurrent,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.programSheetStatsList}>
              {model.stats.map((stat) => (
                <View key={stat.id} style={styles.programSheetStatRow}>
                  <ProgramSheetStatIcon icon={stat.icon} />
                  <Text style={styles.programSheetStatText}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.programSheetSection}>
              <Text style={styles.programSheetSectionTitle}>Routines</Text>
              <View style={styles.programSheetRoutineGrid}>
                {model.routines.map((routine) => (
                  <View key={routine.id} style={styles.programSheetRoutineChip}>
                    <Text style={styles.programSheetRoutineChipText}>{routine.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.programSheetSection}>
              <Text style={styles.programSheetSectionTitle}>Schedule</Text>
              <View style={styles.programSheetWeeksList}>
                {model.weeks.map((week) => (
                  <View key={week.id} style={styles.programSheetWeekCard}>
                    <Text style={styles.programSheetWeekDateRange}>{week.dateRangeLabel}</Text>
                    <Text style={styles.programSheetWeekTitle}>{week.title}</Text>

                    <View style={styles.programSheetDividerRow}>
                      <View style={styles.programSheetDividerLine} />
                      <Text style={styles.programSheetDividerText}>{week.topDividerLabel}</Text>
                      <View style={styles.programSheetDividerLine} />
                    </View>

                    <View style={styles.programSheetWorkoutList}>
                      {week.entries.map((entry) => (
                        <View key={entry.id} style={styles.programSheetWorkoutRow}>
                          <Text style={styles.programSheetWorkoutDay}>{entry.dayLabel}</Text>
                          <Text style={styles.programSheetWorkoutLabel}>{entry.workoutLabel}</Text>
                          <Text style={styles.programSheetWorkoutDuration}>{entry.durationLabel}</Text>
                          <ProgramSheetStatusBadge status={entry.status} styles={styles} />
                        </View>
                      ))}
                    </View>

                    <View style={styles.programSheetDividerRow}>
                      <View style={styles.programSheetDividerLine} />
                      <Text style={styles.programSheetDividerText}>{week.bottomDividerLabel}</Text>
                      <View style={styles.programSheetDividerLine} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
