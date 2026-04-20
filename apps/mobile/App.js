import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  completeWorkoutSessionSet,
  createWorkoutSessionFromTemplate,
  finishWorkoutSession,
  formatWorkoutTimer,
  getSessionProgress
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
    },
    {
      id: 'split-squat',
      name: 'Rear Foot Elevated Split Squat',
      defaultRestSeconds: 120,
      sets: [
        { id: 'split-1', prescribedReps: 10, prescribedLoad: 35, prescribedRpe: 7 },
        { id: 'split-2', prescribedReps: 10, prescribedLoad: 35, prescribedRpe: 8 }
      ]
    }
  ]
};

export default function App() {
  const [session, setSession] = useState(() => createWorkoutSessionFromTemplate(workoutTemplate));
  const [elapsedSeconds] = useState(35);

  const progress = useMemo(() => getSessionProgress(session), [session]);

  function handleCompleteSet(exerciseId, setId) {
    if (session.status === 'completed') return;
    setSession((currentSession) => completeWorkoutSessionSet(currentSession, exerciseId, setId));
  }

  function handleFinishWorkout() {
    if (session.status === 'completed') return;
    setSession((currentSession) => finishWorkoutSession(currentSession));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.eyebrow}>Active workout</Text>
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

          <Text style={styles.summary}>
            {progress.completedSets}/{progress.totalSets} sets, {progress.completedExercises}/{progress.totalExercises} exercises
          </Text>
          <Text style={styles.timer}>{formatWorkoutTimer(elapsedSeconds)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.completionPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress.completionPercent}% complete</Text>
        </View>

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
              <Pressable
                key={set.id}
                onPress={() => handleCompleteSet(exercise.id, set.id)}
                style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}
              >
                <View style={styles.setCopy}>
                  <Text style={styles.setTitle}>Set {index + 1}</Text>
                  <Text style={styles.setMeta}>
                    Prescribed: {set.prescribedLoad ?? '-'} lb x {set.prescribedReps ?? '-'} reps, RPE {set.prescribedRpe ?? '-'}
                  </Text>
                  <Text style={styles.setMeta}>
                    Actual: {set.actualLoad ?? '-'} lb x {set.actualReps ?? '-'} reps, RPE {set.actualRpe ?? '-'}
                  </Text>
                </View>
                <View style={[styles.badge, set.isCompleted ? styles.badgeDone : styles.badgeTodo]}>
                  <Text style={styles.badgeText}>{set.isCompleted ? 'Done' : 'Tap to complete'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Session engine rules in play</Text>
          <Text style={styles.footerLine}>Prescribed values stay unchanged in the session.</Text>
          <Text style={styles.footerLine}>Actual values are filled when the set is completed.</Text>
          <Text style={styles.footerLine}>Later analytics will run from actual completed session data only.</Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    gap: 16
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
    fontSize: 16
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
  exerciseCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
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
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  setRowCompleted: {
    backgroundColor: '#064e3b'
  },
  setCopy: {
    flex: 1
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
    fontSize: 12,
    fontWeight: '700'
  },
  footerCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    marginBottom: 28
  },
  footerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  footerLine: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20
  }
});
