import { createWorkoutSession, discardWorkoutSession } from '../../../core/src/index.js';

function resolveInsertSession(db) {
  if (typeof db?.insertWorkoutSession === 'function') return db.insertWorkoutSession.bind(db);
  if (typeof db?.createWorkoutSession === 'function') return db.createWorkoutSession.bind(db);
  if (typeof db?.saveWorkoutSession === 'function') return db.saveWorkoutSession.bind(db);
  return null;
}

function resolveSaveSession(db) {
  if (typeof db?.saveWorkoutSession === 'function') return db.saveWorkoutSession.bind(db);
  if (typeof db?.insertWorkoutSession === 'function') return db.insertWorkoutSession.bind(db);
  if (typeof db?.createWorkoutSession === 'function') return db.createWorkoutSession.bind(db);
  return null;
}

function requireQuery(db) {
  if (typeof db?.query !== 'function') {
    throw new Error('Session DB adapter requires db.query(sql, params)');
  }
  return db.query.bind(db);
}

function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase REST session db requires fetch support');
  }
  return fetchImpl;
}

const PROGRAM_WORKOUT_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order,default_rest_seconds,auto_progress_enabled,adjust_effort_after_set';
const PROGRAM_WORKOUT_SETTINGS_LEGACY_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order';
const PROGRAM_WORKOUT_NOTES_LEGACY_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order';
const WORKOUT_SESSION_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,program_workout_id,workout_template_id,name_snapshot,status,started_at,completed_at,elapsed_seconds,notes,perceived_difficulty,default_rest_seconds,auto_progress_enabled,keep_awake,adjust_effort_after_set,total_exercises_count,completed_exercises_count,total_sets_count,completed_sets_count';
const WORKOUT_SESSION_LEGACY_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,program_workout_id,workout_template_id,name_snapshot,status,started_at,completed_at,elapsed_seconds,notes,perceived_difficulty,total_exercises_count,completed_exercises_count,total_sets_count,completed_sets_count';

function isMissingProgramWorkoutSettingsColumnError(error) {
  const message = String(error?.message || '');
  return message.includes('program_workouts.default_rest_seconds does not exist')
    || message.includes('program_workouts.auto_progress_enabled does not exist')
    || message.includes('program_workouts.adjust_effort_after_set does not exist');
}

function isMissingProgramWorkoutNotesColumnError(error) {
  const message = String(error?.message || '');
  return message.includes("Could not find the 'notes' column of 'program_workouts' in the schema cache")
    || message.includes('program_workouts.notes does not exist');
}

function isMissingWorkoutSessionSettingsColumnError(error) {
  const message = String(error?.message || '');
  return message.includes('workout_sessions.default_rest_seconds does not exist')
    || message.includes('workout_sessions.auto_progress_enabled does not exist')
    || message.includes('workout_sessions.keep_awake does not exist')
    || message.includes('workout_sessions.adjust_effort_after_set does not exist')
    || message.includes("Could not find the 'default_rest_seconds' column of 'workout_sessions'")
    || message.includes("Could not find the 'auto_progress_enabled' column of 'workout_sessions'")
    || message.includes("Could not find the 'keep_awake' column of 'workout_sessions'")
    || message.includes("Could not find the 'adjust_effort_after_set' column of 'workout_sessions'");
}

function mapProgramWorkoutRow(row) {
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    programId: row.program_id ?? null,
    programDayId: row.program_day_id ?? null,
    workoutTemplateId: row.workout_template_id ?? null,
    nameSnapshot: row.name_snapshot || '',
    notes: row.notes || '',
    status: row.status ?? null,
    sortOrder: row.sort_order ?? null,
    defaultRestSeconds: row.default_rest_seconds ?? null,
    autoProgressEnabled: row.auto_progress_enabled ?? false,
    adjustEffortAfterSet: row.adjust_effort_after_set ?? false,
  };
}

function mapProgramWorkoutExerciseRow(row) {
  return {
    id: row.id,
    programWorkoutExerciseId: row.id,
    exerciseId: row.exercise_id ?? null,
    nameSnapshot: row.name_snapshot || '',
    sortOrder: row.sort_order ?? 0,
    notes: row.notes || '',
    defaultRestSeconds: row.default_rest_seconds ?? null,
  };
}

function mapProgramWorkoutSetRow(row) {
  return {
    id: row.id,
    programWorkoutSetId: row.id,
    sortOrder: row.sort_order ?? 0,
    setType: row.set_type || 'straight',
    targetReps: row.target_reps ?? null,
    targetLoad: row.target_load ?? null,
    targetLoadUnit: row.target_load_unit ?? null,
    targetDurationSeconds: row.target_duration_seconds ?? null,
    targetDistance: row.target_distance ?? null,
    targetDistanceUnit: row.target_distance_unit ?? null,
    targetRpe: row.target_rpe ?? null,
    targetRir: row.target_rir ?? null,
    targetRestSeconds: row.target_rest_seconds ?? null,
    notes: row.notes || '',
  };
}

function mapWorkoutSessionRow(row) {
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    programId: row.program_id ?? null,
    programDayId: row.program_day_id ?? null,
    programWorkoutId: row.program_workout_id ?? null,
    workoutTemplateId: row.workout_template_id ?? null,
    nameSnapshot: row.name_snapshot || '',
    status: row.status || 'in_progress',
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    elapsedSeconds: row.elapsed_seconds ?? 0,
    notes: row.notes || '',
    perceivedDifficulty: row.perceived_difficulty ?? null,
    settings: {
      defaultRestSeconds: row.default_rest_seconds ?? null,
      autoProgressEnabled: row.auto_progress_enabled ?? false,
      keepAwake: row.keep_awake ?? false,
      adjustEffortAfterSet: row.adjust_effort_after_set ?? false,
    },
    totalExercisesCount: row.total_exercises_count ?? 0,
    completedExercisesCount: row.completed_exercises_count ?? 0,
    totalSetsCount: row.total_sets_count ?? 0,
    completedSetsCount: row.completed_sets_count ?? 0,
  };
}

function mapWorkoutSessionExerciseRow(row) {
  return {
    id: row.id,
    programWorkoutExerciseId: row.program_workout_exercise_id ?? null,
    exerciseId: row.exercise_id ?? null,
    nameSnapshot: row.name_snapshot || '',
    sortOrder: row.sort_order ?? 0,
    status: row.status || 'not_started',
    notes: row.notes || '',
    defaultRestSeconds: row.default_rest_seconds ?? null,
  };
}

function mapWorkoutSessionSetRow(row) {
  return {
    id: row.id,
    programWorkoutSetId: row.program_workout_set_id ?? null,
    sortOrder: row.sort_order ?? 0,
    setType: row.set_type || 'straight',
    prescribedReps: row.prescribed_reps ?? null,
    prescribedLoad: row.prescribed_load ?? null,
    prescribedLoadUnit: row.prescribed_load_unit ?? null,
    prescribedDurationSeconds: row.prescribed_duration_seconds ?? null,
    prescribedDistance: row.prescribed_distance ?? null,
    prescribedDistanceUnit: row.prescribed_distance_unit ?? null,
    prescribedRpe: row.prescribed_rpe ?? null,
    prescribedRir: row.prescribed_rir ?? null,
    prescribedRestSeconds: row.prescribed_rest_seconds ?? null,
    actualReps: row.actual_reps ?? null,
    actualLoad: row.actual_load ?? null,
    actualLoadUnit: row.actual_load_unit ?? null,
    actualDurationSeconds: row.actual_duration_seconds ?? null,
    actualDistance: row.actual_distance ?? null,
    actualDistanceUnit: row.actual_distance_unit ?? null,
    actualRpe: row.actual_rpe ?? null,
    actualRir: row.actual_rir ?? null,
    actualRestSeconds: row.actual_rest_seconds ?? null,
    completedAt: row.completed_at ?? null,
    isCompleted: Boolean(row.is_completed),
    notes: row.notes || '',
  };
}

function buildProgramWorkoutFromRows(workoutRow, exerciseRows = [], setRows = []) {
  const setsByExerciseId = new Map();
  for (const row of setRows) {
    const mapped = mapProgramWorkoutSetRow(row);
    const bucket = setsByExerciseId.get(row.program_workout_exercise_id) || [];
    bucket.push(mapped);
    setsByExerciseId.set(row.program_workout_exercise_id, bucket);
  }

  const exercises = exerciseRows.map((row) => ({
    ...mapProgramWorkoutExerciseRow(row),
    sets: setsByExerciseId.get(row.id) || [],
  }));

  return {
    ...mapProgramWorkoutRow(workoutRow),
    exercises,
  };
}

function buildWorkoutSessionFromRows(sessionRow, exerciseRows = [], setRows = []) {
  const setsByExerciseId = new Map();
  for (const row of setRows) {
    const mapped = mapWorkoutSessionSetRow(row);
    const bucket = setsByExerciseId.get(row.workout_session_exercise_id) || [];
    bucket.push(mapped);
    setsByExerciseId.set(row.workout_session_exercise_id, bucket);
  }

  const exercises = exerciseRows.map((row) => ({
    ...mapWorkoutSessionExerciseRow(row),
    sets: setsByExerciseId.get(row.id) || [],
  }));

  return {
    ...mapWorkoutSessionRow(sessionRow),
    exercises,
  };
}

function normalizeContributionPercent(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function buildExerciseAnalyticsMetadataLookup({
  exerciseDetailRows = [],
  muscleMapRows = [],
  subMuscleMapRows = [],
} = {}) {
  const detailByExerciseId = new Map(
    exerciseDetailRows
      .filter((row) => row?.id)
      .map((row) => [row.id, row])
  );
  const muscleMapsByExerciseId = new Map();
  const muscleMapById = new Map();

  for (const row of muscleMapRows) {
    if (!row?.id || !row?.exercise_id) continue;
    muscleMapById.set(row.id, row);
    const bucket = muscleMapsByExerciseId.get(row.exercise_id) || [];
    bucket.push(row);
    muscleMapsByExerciseId.set(row.exercise_id, bucket);
  }

  const subMuscleMapsByExerciseId = new Map();
  const subMuscleMapsByParentMapId = new Map();
  for (const row of subMuscleMapRows) {
    if (!row?.exercise_id || !row?.sub_muscle_id) continue;
    const exerciseBucket = subMuscleMapsByExerciseId.get(row.exercise_id) || [];
    exerciseBucket.push(row);
    subMuscleMapsByExerciseId.set(row.exercise_id, exerciseBucket);
    if (row.exercise_muscle_map_id) {
      const parentBucket = subMuscleMapsByParentMapId.get(row.exercise_muscle_map_id) || [];
      parentBucket.push(row);
      subMuscleMapsByParentMapId.set(row.exercise_muscle_map_id, parentBucket);
    }
  }

  const exerciseIds = new Set([
    ...detailByExerciseId.keys(),
    ...muscleMapsByExerciseId.keys(),
    ...subMuscleMapsByExerciseId.keys(),
  ]);

  const metadataByExerciseId = new Map();
  for (const exerciseId of exerciseIds) {
    const detailRow = detailByExerciseId.get(exerciseId) || null;
    const muscleTargets = [];

    for (const row of muscleMapsByExerciseId.get(exerciseId) || []) {
      const childSubMuscleRows = subMuscleMapsByParentMapId.get(row.id) || [];
      if (childSubMuscleRows.length) continue;
      if (!row.muscle_id) continue;
      muscleTargets.push({
        muscleId: row.muscle_id,
        subMuscleId: null,
        percent: normalizeContributionPercent(row.contribution_percent),
      });
    }

    for (const row of subMuscleMapsByExerciseId.get(exerciseId) || []) {
      const parentMap = row.exercise_muscle_map_id ? muscleMapById.get(row.exercise_muscle_map_id) : null;
      muscleTargets.push({
        muscleId: parentMap?.muscle_id ?? null,
        subMuscleId: row.sub_muscle_id,
        percent: normalizeContributionPercent(row.contribution_percent),
      });
    }

    metadataByExerciseId.set(exerciseId, {
      bodyRegion: detailRow?.body_region ?? null,
      stimulusType: detailRow?.stimulus_type ?? null,
      movementPattern: detailRow?.movement_pattern ?? null,
      muscleTargets,
    });
  }

  return metadataByExerciseId;
}

function mergeExerciseAnalyticsMetadata(exercises = [], { sourceExercises = [], metadataByExerciseId = new Map() } = {}) {
  return exercises.map((exercise) => {
    const sourceExercise = sourceExercises.find((candidate) => (
      (candidate?.id && candidate.id === exercise.id)
      || (candidate?.programWorkoutExerciseId && candidate.programWorkoutExerciseId === exercise.programWorkoutExerciseId)
      || (candidate?.exerciseId && candidate.exerciseId === exercise.exerciseId)
    )) || null;
    const liveMetadata = exercise?.exerciseId ? metadataByExerciseId.get(exercise.exerciseId) || null : null;
    const exerciseMuscleTargets = Array.isArray(exercise?.muscleTargets) ? exercise.muscleTargets : [];
    const sourceMuscleTargets = Array.isArray(sourceExercise?.muscleTargets) ? sourceExercise.muscleTargets : [];
    const liveMuscleTargets = Array.isArray(liveMetadata?.muscleTargets) ? liveMetadata.muscleTargets : [];

    return {
      ...exercise,
      fatigueMultiplier: exercise?.fatigueMultiplier ?? sourceExercise?.fatigueMultiplier ?? null,
      axialFatigueMultiplier: exercise?.axialFatigueMultiplier ?? sourceExercise?.axialFatigueMultiplier ?? null,
      skillFatigueMultiplier: exercise?.skillFatigueMultiplier ?? sourceExercise?.skillFatigueMultiplier ?? null,
      bodyRegion: exercise?.bodyRegion ?? sourceExercise?.bodyRegion ?? liveMetadata?.bodyRegion ?? null,
      stimulusType: exercise?.stimulusType ?? sourceExercise?.stimulusType ?? liveMetadata?.stimulusType ?? null,
      movementPattern: exercise?.movementPattern ?? sourceExercise?.movementPattern ?? liveMetadata?.movementPattern ?? null,
      muscleTargets: exerciseMuscleTargets.length
        ? exerciseMuscleTargets.map((target) => ({ ...target }))
        : sourceMuscleTargets.length
          ? sourceMuscleTargets.map((target) => ({ ...target }))
          : liveMuscleTargets.map((target) => ({ ...target })),
    };
  });
}

function toSessionRowInput(session) {
  return {
    athlete_id: session.athleteId ?? null,
    coach_id: session.coachId ?? null,
    program_id: session.programId ?? null,
    program_day_id: session.programDayId ?? null,
    program_workout_id: session.programWorkoutId ?? null,
    workout_template_id: session.workoutTemplateId ?? null,
    name_snapshot: session.nameSnapshot || '',
    status: session.status,
    started_at: session.startedAt ?? null,
    completed_at: session.completedAt ?? null,
    elapsed_seconds: session.elapsedSeconds ?? 0,
    notes: session.notes || '',
    perceived_difficulty: session.perceivedDifficulty ?? null,
    default_rest_seconds: session.settings?.defaultRestSeconds ?? null,
    auto_progress_enabled: session.settings?.autoProgressEnabled ?? false,
    keep_awake: session.settings?.keepAwake ?? false,
    adjust_effort_after_set: session.settings?.adjustEffortAfterSet ?? false,
    total_exercises_count: session.totalExercisesCount ?? 0,
    completed_exercises_count: session.completedExercisesCount ?? 0,
    total_sets_count: session.totalSetsCount ?? 0,
    completed_sets_count: session.completedSetsCount ?? 0,
  };
}

function toLegacySessionRowInput(session) {
  return {
    athlete_id: session.athleteId ?? null,
    coach_id: session.coachId ?? null,
    program_id: session.programId ?? null,
    program_day_id: session.programDayId ?? null,
    program_workout_id: session.programWorkoutId ?? null,
    workout_template_id: session.workoutTemplateId ?? null,
    name_snapshot: session.nameSnapshot || '',
    status: session.status,
    started_at: session.startedAt ?? null,
    completed_at: session.completedAt ?? null,
    elapsed_seconds: session.elapsedSeconds ?? 0,
    notes: session.notes || '',
    perceived_difficulty: session.perceivedDifficulty ?? null,
    total_exercises_count: session.totalExercisesCount ?? 0,
    completed_exercises_count: session.completedExercisesCount ?? 0,
    total_sets_count: session.totalSetsCount ?? 0,
    completed_sets_count: session.completedSetsCount ?? 0,
  };
}

function toSessionExerciseRowInput(sessionId, exercise) {
  return {
    workout_session_id: sessionId,
    program_workout_exercise_id: exercise.programWorkoutExerciseId ?? null,
    exercise_id: exercise.exerciseId ?? null,
    name_snapshot: exercise.nameSnapshot || '',
    sort_order: exercise.sortOrder ?? 0,
    status: exercise.status || 'not_started',
    notes: exercise.notes || '',
    default_rest_seconds: exercise.defaultRestSeconds ?? null,
  };
}

function toSessionSetRowInput(workoutSessionExerciseId, set) {
  return {
    workout_session_exercise_id: workoutSessionExerciseId,
    program_workout_set_id: set.programWorkoutSetId ?? null,
    sort_order: set.sortOrder ?? 0,
    set_type: set.setType || 'straight',
    prescribed_reps: set.prescribedReps ?? null,
    prescribed_load: set.prescribedLoad ?? null,
    prescribed_load_unit: set.prescribedLoadUnit ?? null,
    prescribed_duration_seconds: set.prescribedDurationSeconds ?? null,
    prescribed_distance: set.prescribedDistance ?? null,
    prescribed_distance_unit: set.prescribedDistanceUnit ?? null,
    prescribed_rpe: set.prescribedRpe ?? null,
    prescribed_rir: set.prescribedRir ?? null,
    prescribed_rest_seconds: set.prescribedRestSeconds ?? null,
    actual_reps: set.actualReps ?? null,
    actual_load: set.actualLoad ?? null,
    actual_load_unit: set.actualLoadUnit ?? null,
    actual_duration_seconds: set.actualDurationSeconds ?? null,
    actual_distance: set.actualDistance ?? null,
    actual_distance_unit: set.actualDistanceUnit ?? null,
    actual_rpe: set.actualRpe ?? null,
    actual_rir: set.actualRir ?? null,
    actual_rest_seconds: set.actualRestSeconds ?? null,
    completed_at: set.completedAt ?? null,
    is_completed: set.isCompleted ?? false,
    notes: set.notes || '',
  };
}

function isLocalSessionEntityId(value) {
  return typeof value === 'string' && value.startsWith('local-session-')
}

function createSupabaseSessionRequest(config) {
  const baseUrl = config?.url;
  const anonKey = config?.anonKey;
  const accessToken = config?.accessToken || null;
  const refreshAccessToken = typeof config?.refreshAccessToken === 'function'
    ? config.refreshAccessToken
    : null;
  const schema = config?.schema || 'public';
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch);

  if (!baseUrl) {
    throw new Error('Supabase REST session db requires a url');
  }

  if (!anonKey) {
    throw new Error('Supabase REST session db requires an anonKey');
  }

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken;
  }

  function isRetryableAuthError(response, payload) {
    const message = String(payload?.message || '')
    return response?.status === 401 || /jwt expired/i.test(message)
  }

  return async function request({
    method = 'GET',
    table,
    query = {},
    body,
    prefer = 'return=representation',
  }) {
    const url = new URL(`/rest/v1/${table}`, baseUrl);
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, value);
    }

    async function sendRequest(tokenOverride = undefined) {
      const bearerToken = tokenOverride === undefined ? resolveAccessToken() : tokenOverride;
      const response = await fetchImpl(url.toString(), {
        method,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${bearerToken || anonKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Prefer: prefer,
          'Accept-Profile': schema,
          'Content-Profile': schema,
          ...(config?.headers || {}),
        },
        body: body == null ? undefined : JSON.stringify(body),
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      return { response, payload };
    }

    let { response, payload } = await sendRequest();

    if (!response.ok && refreshAccessToken && isRetryableAuthError(response, payload)) {
      const refreshedToken = await refreshAccessToken();
      ({ response, payload } = await sendRequest(refreshedToken));
    }

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Unknown Supabase REST error';
      throw new Error(`Supabase REST ${method} ${table} failed: ${message}`);
    }

    return payload;
  };
}

async function saveSupabaseSessionChildren({ request, sessionId, exercises = [] }) {
  const savedExerciseRows = [];
  const savedSetRows = [];

  for (const exercise of exercises) {
    const exerciseInput = toSessionExerciseRowInput(sessionId, exercise);
    let savedExerciseRow;

    if (exercise.id && !isLocalSessionEntityId(exercise.id)) {
      const exerciseRows = await request({
        method: 'PATCH',
        table: 'workout_session_exercises',
        query: {
          id: `eq.${exercise.id}`,
          select: '*',
        },
        body: exerciseInput,
      });
      savedExerciseRow = exerciseRows?.[0] || null;
      if (!savedExerciseRow) {
        const insertedExerciseRows = await request({
          method: 'POST',
          table: 'workout_session_exercises',
          query: { select: '*' },
          body: exerciseInput,
        });
        savedExerciseRow = insertedExerciseRows?.[0] || null;
      }
    } else {
      const exerciseRows = await request({
        method: 'POST',
        table: 'workout_session_exercises',
        query: { select: '*' },
        body: exerciseInput,
      });
      savedExerciseRow = exerciseRows?.[0] || null;
    }

    if (!savedExerciseRow?.id) {
      throw new Error('Supabase REST session db failed to persist workout_session_exercises row');
    }

    savedExerciseRows.push(savedExerciseRow);

    for (const set of exercise.sets || []) {
      const setInput = toSessionSetRowInput(savedExerciseRow.id, set);
      let savedSetRow;

      if (set.id && !isLocalSessionEntityId(set.id)) {
        const setRows = await request({
          method: 'PATCH',
          table: 'workout_session_sets',
          query: {
            id: `eq.${set.id}`,
            select: '*',
          },
          body: setInput,
        });
        savedSetRow = setRows?.[0] || null;
        if (!savedSetRow) {
          const insertedSetRows = await request({
            method: 'POST',
            table: 'workout_session_sets',
            query: { select: '*' },
            body: setInput,
          });
          savedSetRow = insertedSetRows?.[0] || null;
        }
      } else {
        const setRows = await request({
          method: 'POST',
          table: 'workout_session_sets',
          query: { select: '*' },
          body: setInput,
        });
        savedSetRow = setRows?.[0] || null;
      }

      if (!savedSetRow?.id) {
        throw new Error('Supabase REST session db failed to persist workout_session_sets row');
      }

      savedSetRows.push(savedSetRow);
    }
  }

  return {
    exerciseRows: savedExerciseRows,
    setRows: savedSetRows,
  };
}

export function createSupabaseRestSessionDb(config) {
  const request = createSupabaseSessionRequest(config);

  async function requestExerciseAnalyticsMetadata(exerciseIds = []) {
    const normalizedExerciseIds = [...new Set(exerciseIds.filter(Boolean))]
    if (!normalizedExerciseIds.length) return new Map()

    const inFilter = `in.(${normalizedExerciseIds.join(',')})`

    try {
      const [exerciseDetailRows, muscleMapRows, subMuscleMapRows] = await Promise.all([
        request({
          table: 'exercises',
          query: {
            id: inFilter,
            select: 'id,body_region,stimulus_type,movement_pattern',
          },
        }),
        request({
          table: 'exercise_muscle_maps',
          query: {
            exercise_id: inFilter,
            select: 'id,exercise_id,muscle_id,contribution_percent,sort_order',
            order: 'sort_order.asc',
          },
        }),
        request({
          table: 'exercise_sub_muscle_maps',
          query: {
            exercise_id: inFilter,
            select: 'id,exercise_id,exercise_muscle_map_id,sub_muscle_id,contribution_percent,sort_order',
            order: 'sort_order.asc',
          },
        }),
      ])

      return buildExerciseAnalyticsMetadataLookup({
        exerciseDetailRows,
        muscleMapRows,
        subMuscleMapRows,
      })
    } catch {
      return new Map()
    }
  }

  async function requestProgramWorkoutRows(query = {}) {
    try {
      return await request({
        table: 'program_workouts',
        query: {
          ...query,
          select: PROGRAM_WORKOUT_SELECT,
        },
      });
    } catch (error) {
      if (isMissingProgramWorkoutNotesColumnError(error)) {
        return request({
          table: 'program_workouts',
          query: {
            ...query,
            select: PROGRAM_WORKOUT_NOTES_LEGACY_SELECT,
          },
        });
      }

      if (!isMissingProgramWorkoutSettingsColumnError(error)) {
        throw error;
      }

      try {
        return await request({
          table: 'program_workouts',
          query: {
            ...query,
            select: PROGRAM_WORKOUT_SETTINGS_LEGACY_SELECT,
          },
        });
      } catch (legacyError) {
        if (!isMissingProgramWorkoutNotesColumnError(legacyError)) {
          throw legacyError;
        }

        return request({
          table: 'program_workouts',
          query: {
            ...query,
            select: PROGRAM_WORKOUT_NOTES_LEGACY_SELECT,
          },
        });
      }
    }
  }

  async function requestWorkoutSessionRows(query = {}) {
    try {
      return await request({
        table: 'workout_sessions',
        query: {
          ...query,
          select: WORKOUT_SESSION_SELECT,
        },
      });
    } catch (error) {
      if (!isMissingWorkoutSessionSettingsColumnError(error)) {
        throw error;
      }

      return request({
        table: 'workout_sessions',
        query: {
          ...query,
          select: WORKOUT_SESSION_LEGACY_SELECT,
        },
      });
    }
  }

  async function persistWorkoutSessionRow({ method, session, sessionId = null }) {
    const fullBody = toSessionRowInput(session);
    try {
      return await request({
        method,
        table: 'workout_sessions',
        query: {
          ...(sessionId ? { id: `eq.${sessionId}` } : {}),
          select: '*',
        },
        body: fullBody,
      });
    } catch (error) {
      if (!isMissingWorkoutSessionSettingsColumnError(error)) {
        throw error;
      }

      return request({
        method,
        table: 'workout_sessions',
        query: {
          ...(sessionId ? { id: `eq.${sessionId}` } : {}),
          select: '*',
        },
        body: toLegacySessionRowInput(session),
      });
    }
  }

  return {
    async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
      if (!programWorkoutId) return null;

      const sessionRows = await requestWorkoutSessionRows({
        program_workout_id: `eq.${programWorkoutId}`,
        status: 'eq.in_progress',
        order: 'started_at.desc',
        limit: '1',
      });
      const sessionRow = sessionRows?.[0];
      if (!sessionRow?.id) return null;
      return this.getWorkoutSessionById(sessionRow.id);
    },
    async getInProgressSessionByAthleteId(athleteId) {
      if (!athleteId) return null;

      const sessionRows = await requestWorkoutSessionRows({
        athlete_id: `eq.${athleteId}`,
        status: 'eq.in_progress',
        order: 'started_at.desc',
        limit: '1',
      });
      const sessionRow = sessionRows?.[0];
      if (!sessionRow?.id) return null;
      return this.getWorkoutSessionById(sessionRow.id);
    },
    async getCompletedSessionsByAthleteId(athleteId, { limit = 50 } = {}) {
      if (!athleteId) return [];

      const sessionRows = await requestWorkoutSessionRows({
        athlete_id: `eq.${athleteId}`,
        status: 'eq.completed',
        order: 'completed_at.desc,started_at.desc',
        limit: String(limit),
      });
      if (!sessionRows?.length) return [];
      const hydratedSessions = await Promise.all(sessionRows.map((row) => this.getWorkoutSessionById(row.id)));
      return hydratedSessions.filter(Boolean);
    },
    async deleteWorkoutSessionSet({ workoutSessionSetId } = {}) {
      if (!workoutSessionSetId) {
        throw new Error('deleteWorkoutSessionSet requires workoutSessionSetId')
      }

      await request({
        method: 'DELETE',
        table: 'workout_session_sets',
        query: {
          id: `eq.${workoutSessionSetId}`,
        },
      })

      return { success: true, workoutSessionSetId }
    },
    async deleteWorkoutSessionExercise({ workoutSessionExerciseId } = {}) {
      if (!workoutSessionExerciseId) {
        throw new Error('deleteWorkoutSessionExercise requires workoutSessionExerciseId')
      }

      await request({
        method: 'DELETE',
        table: 'workout_session_exercises',
        query: {
          id: `eq.${workoutSessionExerciseId}`,
        },
      })

      return { success: true, workoutSessionExerciseId }
    },
    async listProgramWorkoutsForAthlete(athleteId, { onDate = null } = {}) {
      if (!athleteId) return [];

      let dayIds = null;
      if (onDate) {
        const dayRows = await request({
          table: 'program_days',
          query: {
            date: `eq.${onDate}`,
            select: 'id,date',
          },
        });
        dayIds = dayRows.map((row) => row.id).filter(Boolean);
        if (dayIds.length === 0) return [];
      }

      const workoutRows = await requestProgramWorkoutRows({
        athlete_id: `eq.${athleteId}`,
        ...(dayIds ? { program_day_id: `in.(${dayIds.join(',')})` } : {}),
        order: 'sort_order.asc',
      });

      return workoutRows.map((row) => mapProgramWorkoutRow(row));
    },

    async getTodaysProgramWorkoutForAthlete(athleteId, { onDate } = {}) {
      const workoutRows = await this.listProgramWorkoutsForAthlete(athleteId, { onDate });
      const firstWorkout = workoutRows[0];
      if (!firstWorkout?.id) return null;
      return this.getProgramWorkoutById(firstWorkout.id);
    },

    async getProgramWorkoutById(programWorkoutId) {
      const workoutRows = await requestProgramWorkoutRows({
        id: `eq.${programWorkoutId}`,
      });
      const workoutRow = workoutRows?.[0];
      if (!workoutRow) return null;

      const exerciseRows = await request({
        table: 'program_workout_exercises',
        query: {
          program_workout_id: `eq.${programWorkoutId}`,
          select: 'id,program_workout_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds',
          order: 'sort_order.asc',
        },
      });

      const exerciseIds = exerciseRows.map((row) => row.id).filter(Boolean);
      const setRows = exerciseIds.length > 0
        ? await request({
            table: 'program_workout_sets',
            query: {
              program_workout_exercise_id: `in.(${exerciseIds.join(',')})`,
              select: 'id,program_workout_exercise_id,sort_order,set_type,target_reps,target_load,target_load_unit,target_duration_seconds,target_distance,target_distance_unit,target_rpe,target_rir,target_rest_seconds,notes',
              order: 'sort_order.asc',
            },
          })
        : [];
      const metadataByExerciseId = await requestExerciseAnalyticsMetadata(exerciseRows.map((row) => row.exercise_id));
      const workout = buildProgramWorkoutFromRows(workoutRow, exerciseRows, setRows);
      return {
        ...workout,
        exercises: mergeExerciseAnalyticsMetadata(workout.exercises, { metadataByExerciseId }),
      };
    },

    async insertWorkoutSession(session) {
      const sessionRows = await persistWorkoutSessionRow({
        method: 'POST',
        session,
      });
      const sessionRow = sessionRows?.[0];
      if (!sessionRow?.id) {
        throw new Error('Supabase REST session db failed to persist workout_sessions row');
      }

      const children = await saveSupabaseSessionChildren({
        request,
        sessionId: sessionRow.id,
        exercises: session.exercises || [],
      });

      const persistedSession = buildWorkoutSessionFromRows(sessionRow, children.exerciseRows, children.setRows);
      return {
        ...persistedSession,
        exercises: mergeExerciseAnalyticsMetadata(persistedSession.exercises, {
          sourceExercises: session.exercises || [],
        }),
      };
    },

    async saveWorkoutSession(session) {
      if (!session?.id) {
        return this.insertWorkoutSession(session);
      }

      const sessionRows = await persistWorkoutSessionRow({
        method: 'PATCH',
        session,
        sessionId: session.id,
      });
      const sessionRow = sessionRows?.[0] || { ...toLegacySessionRowInput(session), ...toSessionRowInput(session), id: session.id };

      const children = await saveSupabaseSessionChildren({
        request,
        sessionId: sessionRow.id,
        exercises: session.exercises || [],
      });

      const persistedSession = buildWorkoutSessionFromRows(sessionRow, children.exerciseRows, children.setRows);
      return {
        ...persistedSession,
        exercises: mergeExerciseAnalyticsMetadata(persistedSession.exercises, {
          sourceExercises: session.exercises || [],
        }),
      };
    },

    async saveSessionLoadSummary(summary) {
      const rows = await request({
        method: 'POST',
        table: 'session_load_summaries',
        query: { select: '*' },
        body: {
          athlete_id: summary?.athleteId ?? null,
          workout_session_id: summary?.workoutSessionId ?? null,
          completed_sets: summary?.completedSets ?? null,
          completed_reps: summary?.completedReps ?? null,
          volume_load: summary?.volumeLoad ?? null,
          effort_adjusted_load: summary?.effortAdjustedLoad ?? null,
          session_difficulty: summary?.sessionDifficulty ?? null,
          log_date: summary?.logDate ?? null,
        },
      });
      const row = rows?.[0] || null;
      return {
        athleteId: row?.athlete_id ?? summary?.athleteId ?? null,
        workoutSessionId: row?.workout_session_id ?? summary?.workoutSessionId ?? null,
        completedSets: row?.completed_sets ?? summary?.completedSets ?? 0,
        completedReps: row?.completed_reps ?? summary?.completedReps ?? 0,
        volumeLoad: row?.volume_load ?? summary?.volumeLoad ?? null,
        effortAdjustedLoad: row?.effort_adjusted_load ?? summary?.effortAdjustedLoad ?? null,
        sessionDifficulty: row?.session_difficulty ?? summary?.sessionDifficulty ?? null,
        logDate: row?.log_date ?? summary?.logDate ?? null,
      };
    },

    async saveExercisePerformanceSnapshots(rows = []) {
      if (!rows.length) return [];
      const insertedRows = await request({
        method: 'POST',
        table: 'exercise_performance_snapshots',
        query: { select: '*' },
        body: rows.map((row) => ({
          athlete_id: row.athleteId ?? null,
          exercise_id: row.exerciseId ?? null,
          workout_session_id: row.workoutSessionId ?? null,
          workout_session_exercise_id: row.workoutSessionExerciseId ?? null,
          metric_type: row.metricType ?? null,
          load: row.load ?? null,
          reps: row.reps ?? null,
          sets: row.sets ?? null,
          duration_seconds: row.durationSeconds ?? null,
          distance: row.distance ?? null,
          unit: row.unit ?? null,
          body_region: row.bodyRegion ?? null,
          log_date: row.logDate ?? null,
          estimated_one_rep_max: row.estimatedOneRepMax ?? null,
          notes: row.notes ?? '',
        })),
      });

      return (insertedRows || []).map((row) => ({
        athleteId: row.athlete_id ?? null,
        exerciseId: row.exercise_id ?? null,
        workoutSessionId: row.workout_session_id ?? null,
        workoutSessionExerciseId: row.workout_session_exercise_id ?? null,
        metricType: row.metric_type ?? null,
        load: row.load ?? null,
        reps: row.reps ?? null,
        sets: row.sets ?? null,
        durationSeconds: row.duration_seconds ?? null,
        distance: row.distance ?? null,
        unit: row.unit ?? null,
        bodyRegion: row.body_region ?? null,
        logDate: row.log_date ?? null,
        estimatedOneRepMax: row.estimated_one_rep_max ?? null,
        notes: row.notes ?? '',
      }));
    },

    async saveMuscleLoadEvents(rows = []) {
      if (!rows.length) return [];
      const insertedRows = await request({
        method: 'POST',
        table: 'muscle_load_events',
        query: { select: '*' },
        body: rows.map((row) => ({
          athlete_id: row.athleteId ?? null,
          workout_session_id: row.workoutSessionId ?? null,
          workout_session_exercise_id: row.workoutSessionExerciseId ?? null,
          workout_session_set_id: row.workoutSessionSetId ?? null,
          exercise_id: row.exerciseId ?? null,
          muscle_id: row.muscleId ?? null,
          sub_muscle_id: row.subMuscleId ?? null,
          is_sub_muscle: row.isSubMuscle ?? false,
          event_date: row.eventDate ?? null,
          percent: row.percent ?? null,
          score: row.score ?? null,
        })),
      });

      return (insertedRows || []).map((row) => ({
        athleteId: row.athlete_id ?? null,
        workoutSessionId: row.workout_session_id ?? null,
        workoutSessionExerciseId: row.workout_session_exercise_id ?? null,
        workoutSessionSetId: row.workout_session_set_id ?? null,
        exerciseId: row.exercise_id ?? null,
        muscleId: row.muscle_id ?? null,
        subMuscleId: row.sub_muscle_id ?? null,
        isSubMuscle: Boolean(row.is_sub_muscle),
        eventDate: row.event_date ?? null,
        percent: row.percent ?? null,
        score: row.score ?? null,
      }));
    },

    async getWorkoutSessionById(sessionId) {
      const sessionRows = await requestWorkoutSessionRows({
        id: `eq.${sessionId}`,
      });
      const sessionRow = sessionRows?.[0];
      if (!sessionRow) return null;

      const exerciseRows = await request({
        table: 'workout_session_exercises',
        query: {
          workout_session_id: `eq.${sessionId}`,
          select: 'id,workout_session_id,program_workout_exercise_id,exercise_id,name_snapshot,sort_order,status,notes,default_rest_seconds',
          order: 'sort_order.asc',
        },
      });

      const exerciseIds = exerciseRows.map((row) => row.id).filter(Boolean);
      const setRows = exerciseIds.length > 0
        ? await request({
            table: 'workout_session_sets',
            query: {
              workout_session_exercise_id: `in.(${exerciseIds.join(',')})`,
              select: 'id,workout_session_exercise_id,program_workout_set_id,sort_order,set_type,prescribed_reps,prescribed_load,prescribed_load_unit,prescribed_duration_seconds,prescribed_distance,prescribed_distance_unit,prescribed_rpe,prescribed_rir,prescribed_rest_seconds,actual_reps,actual_load,actual_load_unit,actual_duration_seconds,actual_distance,actual_distance_unit,actual_rpe,actual_rir,actual_rest_seconds,completed_at,is_completed,notes',
              order: 'sort_order.asc',
            },
          })
        : [];
      const metadataByExerciseId = await requestExerciseAnalyticsMetadata(exerciseRows.map((row) => row.exercise_id));
      const session = buildWorkoutSessionFromRows(sessionRow, exerciseRows, setRows);
      return {
        ...session,
        exercises: mergeExerciseAnalyticsMetadata(session.exercises, { metadataByExerciseId }),
      };
    },
  };
}

export function createSessionDbAdapter(db) {
  const query = requireQuery(db);

  async function queryExerciseAnalyticsMetadata(exerciseIds = []) {
    const normalizedExerciseIds = [...new Set((exerciseIds || []).filter(Boolean))]
    if (!normalizedExerciseIds.length) return new Map()

    try {
      const [exerciseDetailRows, muscleMapRows, subMuscleMapRows] = await Promise.all([
        query(
          `select id, body_region, stimulus_type, movement_pattern
           from exercises
           where id = any($1)`,
          [normalizedExerciseIds]
        ),
        query(
          `select id, exercise_id, muscle_id, contribution_percent, sort_order
           from exercise_muscle_maps
           where exercise_id = any($1)
           order by sort_order asc nulls last, id asc`,
          [normalizedExerciseIds]
        ),
        query(
          `select id, exercise_id, exercise_muscle_map_id, sub_muscle_id, contribution_percent, sort_order
           from exercise_sub_muscle_maps
           where exercise_id = any($1)
           order by sort_order asc nulls last, id asc`,
          [normalizedExerciseIds]
        ),
      ])

      return buildExerciseAnalyticsMetadataLookup({
        exerciseDetailRows,
        muscleMapRows,
        subMuscleMapRows,
      })
    } catch {
      return new Map()
    }
  }

  return {
    db,
    async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
      const sessionRows = await query(
        `select id, athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id,
                name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty,
                total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count
         from workout_sessions
         where program_workout_id = $1
           and status = 'in_progress'
         order by started_at desc nulls last, id desc
         limit 1`,
        [programWorkoutId]
      );
      const sessionRow = sessionRows[0];
      if (!sessionRow?.id) return null;
      return this.getWorkoutSessionById(sessionRow.id);
    },
    async getInProgressSessionByAthleteId(athleteId) {
      const sessionRows = await query(
        `select id, athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id,
                name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty,
                total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count
         from workout_sessions
         where athlete_id = $1
           and status = 'in_progress'
         order by started_at desc nulls last, id desc
         limit 1`,
        [athleteId]
      );
      const sessionRow = sessionRows[0];
      if (!sessionRow?.id) return null;
      return this.getWorkoutSessionById(sessionRow.id);
    },
    async getCompletedSessionsByAthleteId(athleteId, { limit = 50 } = {}) {
      const sessionRows = await query(
        `select id
         from workout_sessions
         where athlete_id = $1
           and status = 'completed'
         order by completed_at desc nulls last, started_at desc nulls last, id desc
         limit $2`,
        [athleteId, limit]
      );
      if (!sessionRows.length) return [];
      const hydratedSessions = await Promise.all(sessionRows.map((row) => this.getWorkoutSessionById(row.id)));
      return hydratedSessions.filter(Boolean);
    },
    async getProgramWorkoutById(programWorkoutId) {
      const workoutRows = await query(
        `select id, athlete_id, coach_id, program_id, program_day_id, workout_template_id, name_snapshot, status, sort_order
         from program_workouts
         where id = $1`,
        [programWorkoutId]
      );
      const workoutRow = workoutRows[0];
      if (!workoutRow) return null;

      const exerciseRows = await query(
        `select id, program_workout_id, exercise_id, name_snapshot, sort_order, notes, default_rest_seconds
         from program_workout_exercises
         where program_workout_id = $1
         order by sort_order asc`,
        [programWorkoutId]
      );

      const setRows = await query(
        `select id, program_workout_exercise_id, sort_order, set_type, target_reps, target_load, target_load_unit,
                target_duration_seconds, target_distance, target_distance_unit, target_rpe, target_rir,
                target_rest_seconds, notes
         from program_workout_sets
         where program_workout_exercise_id = any($1)
         order by sort_order asc`,
        [exerciseRows.map((row) => row.id)]
      );
      const metadataByExerciseId = await queryExerciseAnalyticsMetadata(exerciseRows.map((row) => row.exercise_id));
      const workout = buildProgramWorkoutFromRows(workoutRow, exerciseRows, setRows);
      return {
        ...workout,
        exercises: mergeExerciseAnalyticsMetadata(workout.exercises, { metadataByExerciseId }),
      };
    },

    async insertWorkoutSession(session) {
      const sessionRows = await query(
        `insert into workout_sessions (
            athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id,
            name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty,
            total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count
         ) values (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17
         ) returning id`,
        [
          session.athleteId ?? null,
          session.coachId ?? null,
          session.programId ?? null,
          session.programDayId ?? null,
          session.programWorkoutId ?? null,
          session.workoutTemplateId ?? null,
          session.nameSnapshot || '',
          session.status,
          session.startedAt ?? null,
          session.completedAt ?? null,
          session.elapsedSeconds ?? 0,
          session.notes || '',
          session.perceivedDifficulty ?? null,
          session.totalExercisesCount ?? 0,
          session.completedExercisesCount ?? 0,
          session.totalSetsCount ?? 0,
          session.completedSetsCount ?? 0,
        ]
      );

      const sessionId = sessionRows[0]?.id;
      const exercises = [];
      for (const exercise of session.exercises || []) {
        const exerciseRows = await query(
          `insert into workout_session_exercises (
              workout_session_id, program_workout_exercise_id, exercise_id, name_snapshot, sort_order,
              status, notes, default_rest_seconds
           ) values ($1, $2, $3, $4, $5, $6, $7, $8)
           returning id`,
          [
            sessionId,
            exercise.programWorkoutExerciseId ?? null,
            exercise.exerciseId ?? null,
            exercise.nameSnapshot || '',
            exercise.sortOrder ?? 0,
            exercise.status || 'not_started',
            exercise.notes || '',
            exercise.defaultRestSeconds ?? null,
          ]
        );
        const workoutSessionExerciseId = exerciseRows[0]?.id;

        const sets = [];
        for (const set of exercise.sets || []) {
          const setRows = await query(
            `insert into workout_session_sets (
                workout_session_exercise_id, program_workout_set_id, sort_order, set_type,
                prescribed_reps, prescribed_load, prescribed_load_unit, prescribed_duration_seconds,
                prescribed_distance, prescribed_distance_unit, prescribed_rpe, prescribed_rir,
                prescribed_rest_seconds, actual_reps, actual_load, actual_load_unit,
                actual_duration_seconds, actual_distance, actual_distance_unit, actual_rpe,
                actual_rir, actual_rest_seconds, completed_at, is_completed, notes
             ) values (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22, $23, $24, $25
             ) returning id`,
            [
              workoutSessionExerciseId,
              set.programWorkoutSetId ?? null,
              set.sortOrder ?? 0,
              set.setType || 'straight',
              set.prescribedReps ?? null,
              set.prescribedLoad ?? null,
              set.prescribedLoadUnit ?? null,
              set.prescribedDurationSeconds ?? null,
              set.prescribedDistance ?? null,
              set.prescribedDistanceUnit ?? null,
              set.prescribedRpe ?? null,
              set.prescribedRir ?? null,
              set.prescribedRestSeconds ?? null,
              set.actualReps ?? null,
              set.actualLoad ?? null,
              set.actualLoadUnit ?? null,
              set.actualDurationSeconds ?? null,
              set.actualDistance ?? null,
              set.actualDistanceUnit ?? null,
              set.actualRpe ?? null,
              set.actualRir ?? null,
              set.actualRestSeconds ?? null,
              set.completedAt ?? null,
              set.isCompleted ?? false,
              set.notes || '',
            ]
          );
          sets.push({
            ...set,
            id: setRows[0]?.id ?? set.id,
          });
        }

        exercises.push({
          ...exercise,
          id: workoutSessionExerciseId ?? exercise.id,
          sets,
        });
      }

      return {
        ...session,
        id: sessionId ?? session.id,
        exercises,
      };
    },

    async getWorkoutSessionById(sessionId) {
      const sessionRows = await query(
        `select id, athlete_id, coach_id, program_id, program_day_id, program_workout_id, workout_template_id,
                name_snapshot, status, started_at, completed_at, elapsed_seconds, notes, perceived_difficulty,
                total_exercises_count, completed_exercises_count, total_sets_count, completed_sets_count
         from workout_sessions
         where id = $1`,
        [sessionId]
      );
      const sessionRow = sessionRows[0];
      if (!sessionRow) return null;

      const exerciseRows = await query(
        `select id, workout_session_id, program_workout_exercise_id, exercise_id, name_snapshot, sort_order,
                status, notes, default_rest_seconds
         from workout_session_exercises
         where workout_session_id = $1
         order by sort_order asc`,
        [sessionId]
      );

      const setRows = await query(
        `select id, workout_session_exercise_id, program_workout_set_id, sort_order, set_type,
                prescribed_reps, prescribed_load, prescribed_load_unit, prescribed_duration_seconds,
                prescribed_distance, prescribed_distance_unit, prescribed_rpe, prescribed_rir,
                prescribed_rest_seconds, actual_reps, actual_load, actual_load_unit,
                actual_duration_seconds, actual_distance, actual_distance_unit, actual_rpe,
                actual_rir, actual_rest_seconds, completed_at, is_completed, notes
         from workout_session_sets
         where workout_session_exercise_id = any($1)
         order by sort_order asc`,
        [exerciseRows.map((row) => row.id)]
      );
      const metadataByExerciseId = await queryExerciseAnalyticsMetadata(exerciseRows.map((row) => row.exercise_id));
      const session = buildWorkoutSessionFromRows(sessionRow, exerciseRows, setRows);
      return {
        ...session,
        exercises: mergeExerciseAnalyticsMetadata(session.exercises, { metadataByExerciseId }),
      };
    },
  };
}

export function createSessionRepository(db) {
  const sqlAdapter = typeof db?.query === 'function' ? createSessionDbAdapter(db) : null;
  const getProgramWorkoutById = typeof db?.getProgramWorkoutById === 'function'
    ? db.getProgramWorkoutById.bind(db)
    : sqlAdapter?.getProgramWorkoutById?.bind(sqlAdapter);
  const getInProgressSessionByProgramWorkoutId = typeof db?.getInProgressSessionByProgramWorkoutId === 'function'
    ? db.getInProgressSessionByProgramWorkoutId.bind(db)
    : sqlAdapter?.getInProgressSessionByProgramWorkoutId?.bind(sqlAdapter)
      || null;
  const getInProgressSessionByAthleteId = typeof db?.getInProgressSessionByAthleteId === 'function'
    ? db.getInProgressSessionByAthleteId.bind(db)
    : sqlAdapter?.getInProgressSessionByAthleteId?.bind(sqlAdapter)
      || null;
  const getCompletedSessionsByAthleteId = typeof db?.getCompletedSessionsByAthleteId === 'function'
    ? db.getCompletedSessionsByAthleteId.bind(db)
    : sqlAdapter?.getCompletedSessionsByAthleteId?.bind(sqlAdapter)
      || null;
  const insertSession = resolveInsertSession(db)
    || sqlAdapter?.insertWorkoutSession?.bind(sqlAdapter)
    || null;
  const saveSession = resolveSaveSession(db)
    || sqlAdapter?.saveWorkoutSession?.bind(sqlAdapter)
    || null;
  const getWorkoutSessionById = typeof db?.getWorkoutSessionById === 'function'
    ? db.getWorkoutSessionById.bind(db)
    : sqlAdapter?.getWorkoutSessionById?.bind(sqlAdapter)
      || (typeof db?.getSessionById === 'function' ? db.getSessionById.bind(db) : null);

  return {
    db,
    async createSessionFromProgramWorkout(programWorkoutId, options = {}) {
      if (!getProgramWorkoutById) {
        throw new Error('Session repository requires db.getProgramWorkoutById(programWorkoutId)');
      }

      const programWorkout = await getProgramWorkoutById(programWorkoutId);
      if (!programWorkout) {
        throw new Error(`Missing program workout: ${programWorkoutId}`);
      }

      if (getInProgressSessionByProgramWorkoutId) {
        const existingSession = await getInProgressSessionByProgramWorkoutId(programWorkoutId);
        if (existingSession?.id) {
          if (!options.forceNewSession) {
            return {
              programWorkoutId,
              sessionId: existingSession.id,
              session: existingSession,
            };
          }

          if (saveSession) {
            await saveSession(discardWorkoutSession({
              session: existingSession,
              discardedAt: options.startedAt || new Date().toISOString(),
              elapsedSeconds: existingSession.elapsedSeconds ?? 0,
            }));
          }
        }
      }

      if (getInProgressSessionByAthleteId && saveSession && programWorkout?.athleteId) {
        const conflictingSession = await getInProgressSessionByAthleteId(programWorkout.athleteId);
        if (conflictingSession?.id && conflictingSession.programWorkoutId !== programWorkoutId) {
          await saveSession(discardWorkoutSession({
            session: conflictingSession,
            discardedAt: options.startedAt || new Date().toISOString(),
            elapsedSeconds: conflictingSession.elapsedSeconds ?? 0,
          }));
        }
      }

      const session = createWorkoutSession({
        programWorkout,
        startedAt: options.startedAt,
      });

      const persistedSession = insertSession ? await insertSession(session) : session;
      const sessionId = persistedSession?.id ?? session.id ?? null;

      return {
        programWorkoutId,
        sessionId,
        session: persistedSession,
      };
    },
    async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
      if (!getInProgressSessionByProgramWorkoutId) {
        return null;
      }
      return getInProgressSessionByProgramWorkoutId(programWorkoutId);
    },
    async getInProgressSessionByAthleteId(athleteId) {
      if (!getInProgressSessionByAthleteId) {
        return null;
      }
      return getInProgressSessionByAthleteId(athleteId);
    },
    async getCompletedSessionsByAthleteId(athleteId, options = {}) {
      if (!getCompletedSessionsByAthleteId) {
        return [];
      }
      return getCompletedSessionsByAthleteId(athleteId, options);
    },
    async getSessionById(sessionId) {
      if (getWorkoutSessionById) {
        return getWorkoutSessionById(sessionId);
      }
      return {
        sessionId,
        exercises: []
      };
    }
  };
}
