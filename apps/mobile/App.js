import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  adjustRestTimer,
  clearRestTimer,
  completeWorkoutSessionSet,
  findSessionSet,
  finishWorkoutSession,
  updateSessionSetActuals,
} from '@pplus/core';
import {
  createTrainDemoState,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
  mobileTabs,
  trainTabs,
} from './src/train/index.js';
import { getActiveSessionSurfaceModel } from './src/train/active-session-models.js';
import { getTrainRenderModel } from './src/train/train-render-models.js';
import { getTrainSurfaceModel } from './src/train/train-screen-models.js';
import { getQuickActualUpdatePayload } from './src/train/session-actions.js';
import { getPlaceholderSurfaceModel, getProgressSurfaceModel } from './src/progress/index.js';
import { getAppRenderModel } from './src/screens/app-render-models.js';
import { getPlaceholderSections, getProgressSections } from './src/screens/surface-sections.js';
import { getGenericSectionRenderPlan, getSessionSectionRenderPlan } from './src/screens/render-plans.js';
import { getSessionRenderModel } from './src/screens/session-render-models.js';
import { getSessionSections } from './src/screens/session-sections.js';
import { getTabButtonModels } from './src/ui/tab-models.js';

function SurfaceCard({ title, body, actionLabel, onAction }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
      {actionLabel ? (
        <Pressable style={styles.primaryAction} onPress={onAction}>
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export default function App() {
  const demoTrainState = useMemo(() => createTrainDemoState(), []);
  const todayModel = useMemo(() => getTodaySurfaceModel(demoTrainState), [demoTrainState]);
  const workoutModel = useMemo(() => getWorkoutSurfaceModel(demoTrainState), [demoTrainState]);
  const progressModel = useMemo(() => getProgressSurfaceModel(), []);
  const progressSections = useMemo(() => getProgressSections(progressModel), [progressModel]);
  const progressRenderPlan = useMemo(() => getGenericSectionRenderPlan(progressSections), [progressSections]);
  const teamPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Team', 'This surface will hold coach context, team relationships, and collaboration later.'),
    []
  );
  const teamSections = useMemo(() => getPlaceholderSections(teamPlaceholder), [teamPlaceholder]);
  const teamRenderPlan = useMemo(() => getGenericSectionRenderPlan(teamSections), [teamSections]);
  const inboxPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication, reminders, and support flows later.'),
    []
  );
  const inboxSections = useMemo(() => getPlaceholderSections(inboxPlaceholder), [inboxPlaceholder]);
  const inboxRenderPlan = useMemo(() => getGenericSectionRenderPlan(inboxSections), [inboxSections]);
  const [activeTab, setActiveTab] = useState('train');
  const [activeTrainTab, setActiveTrainTab] = useState('today');
  const bottomTabModels = useMemo(() => getTabButtonModels({ tabs: mobileTabs, activeKey: activeTab }), [activeTab]);
  const [session, setSession] = useState(() => demoTrainState.session);
  const [elapsedSeconds] = useState(35);

  const selectedSet = session.activeRestTimer
    ? findSessionSet(session, session.activeRestTimer.exerciseId, session.activeRestTimer.setId)
    : null;
  const activeSessionModel = useMemo(
    () => getActiveSessionSurfaceModel(session, elapsedSeconds, selectedSet),
    [elapsedSeconds, selectedSet, session]
  );
  const sessionSections = useMemo(() => getSessionSections(activeSessionModel), [activeSessionModel]);
  const sessionRenderPlan = useMemo(() => getSessionSectionRenderPlan(sessionSections), [sessionSections]);
  const sessionRenderModel = useMemo(
    () => getSessionRenderModel({ sessionRenderPlan, sessionStatus: session.status }),
    [session.status, sessionRenderPlan]
  );
  const trainSurfaceModel = useMemo(
    () =>
      getTrainSurfaceModel({
        trainTabs,
        activeTrainTab,
        todayModel,
        workoutModel,
        activeSessionModel,
      }),
    [activeSessionModel, activeTrainTab, todayModel, workoutModel]
  );
  const trainRenderModel = useMemo(
    () => getTrainRenderModel({ trainSurfaceModel, sessionSections: sessionRenderPlan }),
    [sessionRenderPlan, trainSurfaceModel]
  );
  const appRenderModel = useMemo(
    () =>
      getAppRenderModel({
        activeTab,
        bottomTabModels,
        trainRenderModel,
        progressSections: progressRenderPlan,
        teamSections: teamRenderPlan,
        inboxSections: inboxRenderPlan,
      }),
    [activeTab, bottomTabModels, inboxRenderPlan, progressRenderPlan, teamRenderPlan, trainRenderModel]
  );

  function handleCompleteSet(exerciseId, setId) {
    if (session.status === 'completed') return;
    setSession((currentSession) => completeWorkoutSessionSet(currentSession, exerciseId, setId));
  }

  function handleFinishWorkout() {
    if (session.status === 'completed') return;
    setSession((currentSession) => finishWorkoutSession(currentSession));
  }

  function handleQuickActualUpdate(exerciseId, setId, field, delta) {
    if (session.status === 'completed') return;

    const payload = getQuickActualUpdatePayload({
      session,
      exerciseId,
      setId,
      field,
      delta,
    });
    if (!payload) return;

    setSession((currentSession) => updateSessionSetActuals(currentSession, exerciseId, setId, payload));
  }

  function renderSessionSections(sections) {
    return sections.map((section) => {
      if (section.type === 'session-header-card') {
        return (
          <View key={section.title} style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.eyebrow}>{section.eyebrow}</Text>
                <Text style={styles.title}>{section.title}</Text>
              </View>
              <Pressable
                onPress={handleFinishWorkout}
                style={[styles.finishButton, section.isCompleted && styles.finishButtonDone]}
              >
                <Text style={styles.finishButtonText}>{section.finishLabel}</Text>
              </Pressable>
            </View>

            <Text style={styles.summary}>{section.workoutTimerLabel}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${section.progressPercent}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{section.progressLabel}</Text>
          </View>
        );
      }

      if (section.type === 'rest-timer-card') {
        return (
          <View key="rest-timer" style={styles.restCard}>
            <View style={styles.restHeaderRow}>
              <View>
                <Text style={styles.restEyebrow}>{section.eyebrow}</Text>
                <Text style={styles.restTitle}>{section.title}</Text>
              </View>
              <Pressable onPress={() => setSession((currentSession) => clearRestTimer(currentSession))}>
                <Text style={styles.dismissText}>{section.dismissLabel}</Text>
              </Pressable>
            </View>
            <Text style={styles.restClock}>{section.clockLabel}</Text>
            <View style={styles.restActions}>
              <Pressable style={styles.restActionButton} onPress={() => setSession((currentSession) => adjustRestTimer(currentSession, -15))}>
                <Text style={styles.restActionText}>{section.minusLabel}</Text>
              </Pressable>
              <Pressable style={styles.restActionButton} onPress={() => setSession((currentSession) => adjustRestTimer(currentSession, 15))}>
                <Text style={styles.restActionText}>{section.plusLabel}</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      return (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseMeta}>Rest {exercise.restLabel}</Text>
                </View>
                <View style={[styles.exerciseStatusBadge, statusStyles[exercise.status]]}>
                  <Text style={styles.exerciseStatusText}>{exercise.status.replace('_', ' ')}</Text>
                </View>
              </View>

              {exercise.sets.map((set) => (
                <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}>
                  <Pressable style={styles.setCopy} onPress={() => handleCompleteSet(exercise.id, set.id)}>
                    <Text style={styles.setTitle}>{set.title}</Text>
                    <Text style={styles.setMeta}>{set.prescribedLabel}</Text>
                    <Text style={styles.setMeta}>{set.actualLabel}</Text>
                  </Pressable>

                  <View style={styles.setControlsColumn}>
                    <View style={styles.actualControl}>
                      <Text style={styles.actualControlLabel}>{set.loadControl.label}</Text>
                      <View style={styles.actualControlButtons}>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualLoad', -5)}>
                          <Text style={styles.stepButtonText}>{set.loadControl.decrementLabel}</Text>
                        </Pressable>
                        <Text style={styles.actualValue}>{set.loadControl.value}</Text>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualLoad', 5)}>
                          <Text style={styles.stepButtonText}>{set.loadControl.incrementLabel}</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.actualControl}>
                      <Text style={styles.actualControlLabel}>{set.repsControl.label}</Text>
                      <View style={styles.actualControlButtons}>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualReps', -1)}>
                          <Text style={styles.stepButtonText}>{set.repsControl.decrementLabel}</Text>
                        </Pressable>
                        <Text style={styles.actualValue}>{set.repsControl.value}</Text>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualReps', 1)}>
                          <Text style={styles.stepButtonText}>{set.repsControl.incrementLabel}</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={[styles.badge, set.completionTone === 'done' ? styles.badgeDone : styles.badgeTodo]}>
                      <Text style={styles.badgeText}>{set.completionLabel}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    });
  }

  function renderTrainSurface() {
    return (
      <>
        <View style={styles.trainTabsRow}>
          {trainRenderModel.tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.trainTabButton, tab.isActive && styles.trainTabButtonActive]}
              onPress={() => setActiveTrainTab(tab.key)}
            >
              <Text style={[styles.trainTabLabel, tab.isActive && styles.trainTabLabelActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {trainRenderModel.content.type === 'sections' && renderSections(trainRenderModel.content.sections, setActiveTrainTab)}
        {trainRenderModel.content.type === 'session-sections' && renderSessionSections(sessionRenderModel)}
      </>
    );
  }

  function renderSections(sections, onActionTarget) {
    return sections.map((section) => {
      if (section.type === 'action-card') {
        return (
          <SurfaceCard
            key={section.title}
            title={section.title}
            body={section.body}
            actionLabel={section.actionLabel}
            onAction={onActionTarget ? () => onActionTarget(section.targetKey) : undefined}
          />
        );
      }

      if (section.type === 'header-card') {
        return (
          <View key={section.title} style={styles.headerCard}>
            <Text style={styles.eyebrow}>{section.eyebrow}</Text>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        );
      }

      if (section.type === 'body-list') {
        return (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.rows.map((row) => (
              <View key={row.id || row.title} style={styles.listRow}>
                <View>
                  <Text style={styles.listRowTitle}>{row.title}</Text>
                  <Text style={styles.listRowBody}>{row.body}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (section.type === 'metrics-grid') {
        return (
          <View key="metrics-grid" style={styles.metricsGrid}>
            {section.items.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
            ))}
          </View>
        );
      }

      return (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
          {section.rows?.map((row) => (
            <View key={row.title} style={styles.listRow}>
              <Text style={styles.listRowTitle}>{row.title}</Text>
              <Text style={styles.listRowBody}>{row.body}</Text>
            </View>
          ))}
        </View>
      );
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {appRenderModel.screen.type === 'train' && renderTrainSurface()}
          {appRenderModel.screen.type === 'progress' && renderSections(appRenderModel.screen.sections, null)}
          {appRenderModel.screen.type === 'team' && renderSections(appRenderModel.screen.sections, null)}
          {appRenderModel.screen.type === 'inbox' && renderSections(appRenderModel.screen.sections, null)}
        </ScrollView>

        <View style={styles.tabBar}>
          {appRenderModel.bottomTabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, tab.isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, tab.isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const statusStyles = StyleSheet.create({
  not_started: { backgroundColor: '#1d4ed8' },
  active: { backgroundColor: '#7c3aed' },
  completed: { backgroundColor: '#059669' },
  skipped: { backgroundColor: '#b45309' }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220'
  },
  appShell: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 110
  },
  trainTabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  trainTabButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999
  },
  trainTabButtonActive: {
    backgroundColor: '#2563eb'
  },
  trainTabLabel: {
    color: '#94a3b8',
    fontWeight: '700'
  },
  trainTabLabelActive: {
    color: '#ffffff'
  },
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8
  },
  eyebrow: {
    color: '#93c5fd',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700'
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  finishButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  finishButtonDone: {
    backgroundColor: '#059669'
  },
  finishButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  summary: {
    color: '#d1d5db',
    fontSize: 18,
    fontWeight: '600'
  },
  timer: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '700'
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6'
  },
  progressLabel: {
    color: '#9ca3af',
    fontSize: 13
  },
  restCard: {
    backgroundColor: '#172554',
    borderRadius: 20,
    padding: 20,
    gap: 14
  },
  restHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  restEyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1
  },
  restTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  dismissText: {
    color: '#bfdbfe',
    fontWeight: '700'
  },
  restClock: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '700'
  },
  restActions: {
    flexDirection: 'row',
    gap: 12
  },
  restActionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  restActionText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700'
  },
  sectionBody: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22
  },
  primaryAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  exerciseCard: {
    backgroundColor: '#1f2937',
    borderRadius: 18,
    padding: 14,
    gap: 12
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  exerciseTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  exerciseMeta: {
    color: '#9ca3af',
    fontSize: 14
  },
  exerciseStatusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999
  },
  exerciseStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  setRow: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12
  },
  setRowCompleted: {
    backgroundColor: '#064e3b'
  },
  setCopy: {
    flex: 1
  },
  setControlsColumn: {
    minWidth: 120,
    gap: 8,
    alignItems: 'stretch'
  },
  setTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  setMeta: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 2
  },
  actualControl: {
    gap: 4
  },
  actualControlLabel: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '700'
  },
  actualControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  stepButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  actualValue: {
    color: '#ffffff',
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center'
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999
  },
  badgeDone: {
    backgroundColor: '#10b981'
  },
  badgeTodo: {
    backgroundColor: '#2563eb'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  listRow: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    marginTop: 10
  },
  listRowTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16
  },
  listRowBody: {
    color: '#cbd5e1',
    marginTop: 4
  },
  metricsGrid: {
    gap: 12
  },
  metricCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    gap: 6
  },
  metricLabel: {
    color: '#93c5fd',
    fontWeight: '700'
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700'
  },
  metricDetail: {
    color: '#cbd5e1',
    lineHeight: 20
  },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 8,
    flexDirection: 'row',
    gap: 8
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  tabButtonActive: {
    backgroundColor: '#2563eb'
  },
  tabLabel: {
    color: '#94a3b8',
    fontWeight: '700'
  },
  tabLabelActive: {
    color: '#ffffff'
  }
});
