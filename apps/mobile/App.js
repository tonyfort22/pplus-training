import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  adjustRestTimer,
  clearRestTimer,
  completeWorkoutSessionSet,
  createWorkoutSessionFromTemplate,
  finishWorkoutSession,
  findSessionSet,
  formatClock,
  formatWorkoutTimer,
  getSessionProgress,
  updateSessionSetActuals
} from '@pplus/core';

const workoutTemplate = {
  id: 'lower-a',
  name: 'Lower A',
  exercises: [
    {
      id: 'squat',
      name: 'Barbell Back Squat',
      defaultRestSeconds: 180,
      sets: [
        { id: 'squat-1', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 6 },
        { id: 'squat-2', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 7 },
        { id: 'squat-3', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 8 },
        { id: 'squat-4', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 9 }
      ]
    },
    {
      id: 'rdl',
      name: 'Barbell Romanian Deadlift',
      defaultRestSeconds: 150,
      sets: [
        { id: 'rdl-1', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 6 },
        { id: 'rdl-2', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 7 },
        { id: 'rdl-3', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 8 }
      ]
    }
  ]
};

const mobileTabs = [
  { key: 'train', label: 'Train' },
  { key: 'progress', label: 'Progress' },
  { key: 'team', label: 'Team' },
  { key: 'inbox', label: 'Inbox' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('train');
  const [session, setSession] = useState(() => createWorkoutSessionFromTemplate(workoutTemplate));
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

  function renderTrainSurface() {
    return (
      <>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.eyebrow}>Train</Text>
              <Text style={styles.title}>Today</Text>
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

          <Text style={styles.summary}>{session.name}</Text>
          <Text style={styles.timer}>{formatWorkoutTimer(elapsedSeconds)}</Text>

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
          <Text style={styles.sectionTitle}>Program snapshot</Text>
          <Text style={styles.sectionBody}>Spring Hypertrophy, week 3 of 8. Lower A is scheduled for today.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active workout session</Text>
          {session.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
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

  function renderPlaceholderSurface(title, copy) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionBody}>{copy}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'train' && renderTrainSurface()}
          {activeTab === 'progress' && renderPlaceholderSurface('Progress', 'This surface will hold performance snapshots, training load, and fatigue/recovery views.')}
          {activeTab === 'team' && renderPlaceholderSurface('Team', 'This surface will hold coach context, team relationships, and collaboration later.')}
          {activeTab === 'inbox' && renderPlaceholderSurface('Inbox', 'This surface will hold communication, reminders, and support flows later.')}
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
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
