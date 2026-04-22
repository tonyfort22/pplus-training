import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  adjustRestTimer,
  clearRestTimer,
  completeWorkoutSessionSet,
  findSessionSet,
  finishWorkoutSession,
  formatClock,
  formatWorkoutTimer,
  getSessionProgress,
  updateSessionSetActuals,
} from '@pplus/core';
import {
  createTrainDemoState,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
  mobileTabs,
  trainTabs,
} from './src/train/index.js';
import { getPlaceholderSurfaceModel, getProgressSurfaceModel } from './src/progress/index.js';

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
  const teamPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Team', 'This surface will hold coach context, team relationships, and collaboration later.'),
    []
  );
  const inboxPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication, reminders, and support flows later.'),
    []
  );
  const [activeTab, setActiveTab] = useState('train');
  const [activeTrainTab, setActiveTrainTab] = useState('today');
  const [session, setSession] = useState(() => demoTrainState.session);
  const [elapsedSeconds] = useState(35);

  const progress = useMemo(() => getSessionProgress(session), [session]);
  const selectedSet = session.activeRestTimer
    ? findSessionSet(session, session.activeRestTimer.exerciseId, session.activeRestTimer.setId)
    : null;

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

    const currentSet = findSessionSet(session, exerciseId, setId);
    if (!currentSet) return;

    const currentValue = Number(currentSet[field] ?? currentSet[`prescribed${field.slice(6)}`] ?? 0);
    const nextValue = Math.max(0, currentValue + delta);

    setSession((currentSession) =>
      updateSessionSetActuals(currentSession, exerciseId, setId, {
        [field]: nextValue
      })
    );
  }

  function renderSessionSurface() {
    return (
      <>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.eyebrow}>Train / Session</Text>
              <Text style={styles.title}>{session.name}</Text>
            </View>
            <Pressable
              onPress={handleFinishWorkout}
              style={[styles.finishButton, session.status === 'completed' && styles.finishButtonDone]}
            >
              <Text style={styles.finishButtonText}>
                {session.status === 'completed' ? 'Completed' : 'Finish'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.summary}>{formatWorkoutTimer(elapsedSeconds)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.completionPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {progress.completedSets}/{progress.totalSets} sets, {progress.completedExercises}/{progress.totalExercises} exercises
          </Text>
        </View>

        {session.activeRestTimer ? (
          <View style={styles.restCard}>
            <View style={styles.restHeaderRow}>
              <View>
                <Text style={styles.restEyebrow}>Rest timer</Text>
                <Text style={styles.restTitle}>{selectedSet ? 'Between completed sets' : 'Active rest block'}</Text>
              </View>
              <Pressable onPress={() => setSession((currentSession) => clearRestTimer(currentSession))}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
            <Text style={styles.restClock}>{formatClock(session.activeRestTimer.remainingSeconds)}</Text>
            <View style={styles.restActions}>
              <Pressable style={styles.restActionButton} onPress={() => setSession((currentSession) => adjustRestTimer(currentSession, -15))}>
                <Text style={styles.restActionText}>-15s</Text>
              </Pressable>
              <Pressable style={styles.restActionButton} onPress={() => setSession((currentSession) => adjustRestTimer(currentSession, 15))}>
                <Text style={styles.restActionText}>+15s</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active workout session</Text>
          {session.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseTitle}>{exercise.nameSnapshot || exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>Rest {Math.floor(exercise.defaultRestSeconds / 60)}:{String(exercise.defaultRestSeconds % 60).padStart(2, '0')}</Text>
                </View>
                <View style={[styles.exerciseStatusBadge, statusStyles[exercise.status]]}>
                  <Text style={styles.exerciseStatusText}>{exercise.status.replace('_', ' ')}</Text>
                </View>
              </View>

              {exercise.sets.map((set, index) => (
                <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}>
                  <Pressable style={styles.setCopy} onPress={() => handleCompleteSet(exercise.id, set.id)}>
                    <Text style={styles.setTitle}>Set {index + 1}</Text>
                    <Text style={styles.setMeta}>
                      Prescribed: {set.prescribedLoad ?? '-'} lb x {set.prescribedReps ?? '-'} reps, RPE {set.prescribedRpe ?? '-'}
                    </Text>
                    <Text style={styles.setMeta}>
                      Actual: {set.actualLoad ?? '-'} lb x {set.actualReps ?? '-'} reps, RPE {set.actualRpe ?? '-'}
                    </Text>
                  </Pressable>

                  <View style={styles.setControlsColumn}>
                    <View style={styles.actualControl}>
                      <Text style={styles.actualControlLabel}>Load</Text>
                      <View style={styles.actualControlButtons}>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualLoad', -5)}>
                          <Text style={styles.stepButtonText}>-</Text>
                        </Pressable>
                        <Text style={styles.actualValue}>{set.actualLoad ?? set.prescribedLoad ?? 0}</Text>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualLoad', 5)}>
                          <Text style={styles.stepButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.actualControl}>
                      <Text style={styles.actualControlLabel}>Reps</Text>
                      <View style={styles.actualControlButtons}>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualReps', -1)}>
                          <Text style={styles.stepButtonText}>-</Text>
                        </Pressable>
                        <Text style={styles.actualValue}>{set.actualReps ?? set.prescribedReps ?? 0}</Text>
                        <Pressable style={styles.stepButton} onPress={() => handleQuickActualUpdate(exercise.id, set.id, 'actualReps', 1)}>
                          <Text style={styles.stepButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={[styles.badge, set.isCompleted ? styles.badgeDone : styles.badgeTodo]}>
                      <Text style={styles.badgeText}>{set.isCompleted ? 'Done' : 'Tap left side to complete'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderTrainSurface() {
    return (
      <>
        <View style={styles.trainTabsRow}>
          {trainTabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.trainTabButton, activeTrainTab === tab.key && styles.trainTabButtonActive]}
              onPress={() => setActiveTrainTab(tab.key)}
            >
              <Text style={[styles.trainTabLabel, activeTrainTab === tab.key && styles.trainTabLabelActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {activeTrainTab === 'today' && (
          <>
            <SurfaceCard
              title={todayModel.heroTitle}
              body={`You have ${todayModel.workoutName} ${todayModel.scheduledLabel.toLowerCase()}. ${todayModel.quickSummary}`}
              actionLabel={todayModel.primaryActionLabel}
              onAction={() => setActiveTrainTab('workout')}
            />
            <SurfaceCard
              title="Program snapshot"
              body={`${todayModel.programName}, ${todayModel.programWeekLabel}. ${todayModel.completionLabel}.`}
              actionLabel="View program"
              onAction={() => setActiveTrainTab('program')}
            />
          </>
        )}

        {activeTrainTab === 'program' && (
          <SurfaceCard
            title="Program overview"
            body={`${todayModel.programName} is currently in ${todayModel.programWeekLabel}. ${todayModel.completionLabel}. This area should hold the weekly structure, training calendar, and scheduled workout progression.`}
            actionLabel="See today’s workout"
            onAction={() => setActiveTrainTab('workout')}
          />
        )}

        {activeTrainTab === 'workout' && (
          <>
            <SurfaceCard
              title="Workout detail"
              body={`${workoutModel.workoutName} contains ${workoutModel.exerciseCount} exercises in this scaffold, with prescribed sets, loads, reps, and planned rest. This is the preview before starting or continuing the session.`}
              actionLabel="Go to session"
              onAction={() => setActiveTrainTab('session')}
            />
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Planned exercises</Text>
              {workoutModel.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.listRow}>
                  <View>
                    <Text style={styles.listRowTitle}>{exercise.name}</Text>
                    <Text style={styles.listRowBody}>{exercise.setCount} sets, default rest {exercise.defaultRestLabel}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTrainTab === 'session' && renderSessionSurface()}
      </>
    );
  }

  function renderProgressSurface() {
    return (
      <>
        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>{progressModel.header.eyebrow}</Text>
          <Text style={styles.title}>{progressModel.header.title}</Text>
          <Text style={styles.sectionBody}>
            {progressModel.header.body}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {progressModel.metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{progressModel.trainingLoad.title}</Text>
          <Text style={styles.sectionBody}>
            {progressModel.trainingLoad.body}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{progressModel.muscleFatigue.title}</Text>
          <Text style={styles.sectionBody}>
            {progressModel.muscleFatigue.body}
          </Text>
          {progressModel.muscleFatigue.rows.map((row) => (
            <View key={row.title} style={styles.listRow}>
              <Text style={styles.listRowTitle}>{row.title}</Text>
              <Text style={styles.listRowBody}>{row.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{progressModel.performanceSnapshots.title}</Text>
          <Text style={styles.sectionBody}>
            {progressModel.performanceSnapshots.body}
          </Text>
        </View>
      </>
    );
  }

  function renderPlaceholderSurface(model) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{model.title}</Text>
        <Text style={styles.sectionBody}>{model.body}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'train' && renderTrainSurface()}
          {activeTab === 'progress' && renderProgressSurface()}
          {activeTab === 'team' && renderPlaceholderSurface(teamPlaceholder)}
          {activeTab === 'inbox' && renderPlaceholderSurface(inboxPlaceholder)}
        </ScrollView>

        <View style={styles.tabBar}>
          {mobileTabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
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
