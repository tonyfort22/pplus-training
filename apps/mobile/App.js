import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { completeSessionSet, formatWorkoutTimer } from '@pplus/core';

const initialExercises = [
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    restSeconds: 180,
    sets: [
      { id: 'squat-1', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 6, isCompleted: false },
      { id: 'squat-2', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 7, isCompleted: false },
      { id: 'squat-3', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 8, isCompleted: false },
      { id: 'squat-4', prescribedReps: 8, prescribedLoad: 120, prescribedRpe: 9, isCompleted: false }
    ]
  },
  {
    id: 'rdl',
    name: 'Barbell Romanian Deadlift',
    restSeconds: 150,
    sets: [
      { id: 'rdl-1', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 6, isCompleted: false },
      { id: 'rdl-2', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 7, isCompleted: false },
      { id: 'rdl-3', prescribedReps: 8, prescribedLoad: 95, prescribedRpe: 8, isCompleted: false }
    ]
  }
];

export default function App() {
  const [elapsedSeconds] = useState(35);
  const [sessionName] = useState('Lower A');
  const [exercises, setExercises] = useState(initialExercises);

  const totalSets = useMemo(
    () => exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
    [exercises]
  );

  const completedSets = useMemo(
    () => exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.isCompleted).length,
      0
    ),
    [exercises]
  );

  function handleCompleteSet(exerciseId, setId) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id !== setId || set.isCompleted) return set;
            return completeSessionSet(set);
          })
        };
      })
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>Active workout</Text>
          <Text style={styles.title}>{sessionName}</Text>
          <Text style={styles.summary}>{completedSets}/{totalSets} sets completed</Text>
          <Text style={styles.timer}>{formatWorkoutTimer(elapsedSeconds)}</Text>
        </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>Default rest {Math.floor(exercise.restSeconds / 60)}:{String(exercise.restSeconds % 60).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.exerciseMeta}>{exercise.sets.filter((set) => set.isCompleted).length}/{exercise.sets.length}</Text>
            </View>

            {exercise.sets.map((set, index) => (
              <Pressable
                key={set.id}
                onPress={() => handleCompleteSet(exercise.id, set.id)}
                style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}
              >
                <View>
                  <Text style={styles.setTitle}>Set {index + 1}</Text>
                  <Text style={styles.setMeta}>
                    {set.prescribedLoad} lb x {set.prescribedReps} reps, RPE {set.prescribedRpe}
                  </Text>
                  <Text style={styles.setMeta}>
                    Actual: {set.actualLoad ?? '-'} lb x {set.actualReps ?? '-'} reps
                  </Text>
                </View>
                <View style={[styles.badge, set.isCompleted ? styles.badgeDone : styles.badgeTodo]}>
                  <Text style={styles.badgeText}>{set.isCompleted ? 'Done' : 'Tap to complete'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

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
    gap: 6
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
  summary: {
    color: '#d1d5db',
    fontSize: 16
  },
  timer: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8
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
    alignItems: 'center'
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
  }
});
