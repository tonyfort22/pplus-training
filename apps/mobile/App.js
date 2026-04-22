import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  adjustRestTimer,
  clearRestTimer,
  completeWorkoutSessionSet,
  discardWorkoutSession,
  findSessionSet,
  finishWorkoutSession,
  updateSessionSetActuals,
} from '@pplus/core';
import {
  createTrainDemoState,
  demoPreviewStates,
  getCalendarSurfaceModel,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
  mobileTabs,
  trainTabs,
} from './src/train/index.js';
import { getActiveSessionSurfaceModel } from './src/train/active-session-models.js';
import { getCompletedSessionSurfaceModel } from './src/train/completed-session-models.js';
import { getDiscardedSessionSurfaceModel } from './src/train/discarded-session-models.js';
import { getTrainRenderModel } from './src/train/train-render-models.js';
import { getTrainSurfaceModel } from './src/train/train-screen-models.js';
import { getProgramSheetModel } from './src/train/program-sheet-models.js';
import { getQuickActualUpdatePayload } from './src/train/session-actions.js';
import { getPlaceholderSurfaceModel, getProgressSurfaceModel } from './src/progress/index.js';
import { getAppRenderModel } from './src/screens/app-render-models.js';
import { getPlaceholderSections, getProgressSections } from './src/screens/surface-sections.js';
import { getGenericSectionRenderPlan, getSessionSectionRenderPlan } from './src/screens/render-plans.js';
import { getSessionRenderModel } from './src/screens/session-render-models.js';
import { getSessionSections } from './src/screens/session-sections.js';
import { renderGenericSections, renderSessionSections, renderTrainSurface } from './src/screens/renderers.js';
import { renderProgramSheet } from './src/screens/program-sheet.js';
import { renderAppShell } from './src/screens/shell-renderers.js';
import { statusStyles, styles } from './src/screens/styles.js';
import { getTabButtonModels } from './src/ui/tab-models.js';
import { getPreviewStateButtonModels } from './src/ui/preview-state-models.js';

export default function App() {
  const [previewState, setPreviewState] = useState('planned');
  const demoTrainState = useMemo(() => createTrainDemoState({ previewState }), [previewState]);
  const [activeTab, setActiveTab] = useState('train');
  const [activeTrainTab, setActiveTrainTab] = useState('calendar');
  const [isProgramSheetOpen, setIsProgramSheetOpen] = useState(false);
  const [selectedCalendarDayId, setSelectedCalendarDayId] = useState(() => demoTrainState.program.selectedCalendarDayId);
  const bottomTabModels = useMemo(() => getTabButtonModels({ tabs: mobileTabs, activeKey: activeTab }), [activeTab]);
  const previewStateModels = useMemo(
    () => getPreviewStateButtonModels({ states: demoPreviewStates, activeKey: previewState }),
    [previewState]
  );
  const [session, setSession] = useState(() => demoTrainState.session);
  const [elapsedSeconds] = useState(35);

  useEffect(() => {
    setSession(demoTrainState.session)
    setSelectedCalendarDayId(demoTrainState.program.selectedCalendarDayId)
    setActiveTrainTab('calendar')
    setIsProgramSheetOpen(false)
  }, [demoTrainState])

  const trainState = useMemo(() => ({ ...demoTrainState, session }), [demoTrainState, session]);
  const programSheetModel = useMemo(() => getProgramSheetModel(trainState), [trainState]);
  const todayModel = useMemo(() => getTodaySurfaceModel(trainState), [trainState]);
  const workoutModel = useMemo(() => getWorkoutSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
  const calendarModel = useMemo(() => getCalendarSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
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

  const progressSessions = useMemo(() => {
    if (session.status === 'completed') {
      return [...trainState.completedSessions, session]
    }

    return trainState.completedSessions
  }, [session, trainState.completedSessions])
  const progressModel = useMemo(() => getProgressSurfaceModel({ sessions: progressSessions }), [progressSessions]);
  const progressSections = useMemo(() => getProgressSections(progressModel), [progressModel]);
  const progressRenderPlan = useMemo(() => getGenericSectionRenderPlan(progressSections), [progressSections]);

  const selectedSet = session.activeRestTimer
    ? findSessionSet(session, session.activeRestTimer.exerciseId, session.activeRestTimer.setId)
    : null;
  const activeSessionModel = useMemo(
    () => getActiveSessionSurfaceModel(session, elapsedSeconds, selectedSet),
    [elapsedSeconds, selectedSet, session]
  );
  const completedSessionModel = useMemo(
    () => (session.status === 'completed' ? getCompletedSessionSurfaceModel(session) : null),
    [session]
  );
  const discardedSessionModel = useMemo(
    () => (session.status === 'discarded' ? getDiscardedSessionSurfaceModel(session) : null),
    [session]
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
        calendarModel,
        workoutModel,
        activeSessionModel,
        completedSessionModel,
        discardedSessionModel,
      }),
    [
      activeSessionModel,
      activeTrainTab,
      calendarModel,
      completedSessionModel,
      discardedSessionModel,
      todayModel,
      workoutModel,
    ]
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
    if (session.status === 'completed' || session.status === 'discarded') return;
    setSession((currentSession) => completeWorkoutSessionSet(currentSession, exerciseId, setId));
  }

  function handleFinishWorkout() {
    if (session.status === 'completed' || session.status === 'discarded') return;
    setSession((currentSession) => finishWorkoutSession({ session: currentSession, elapsedSeconds }));
  }

  function handleDiscardWorkout() {
    if (session.status === 'completed' || session.status === 'discarded') return;
    setSession((currentSession) => discardWorkoutSession({ session: currentSession, discardedAt: new Date().toISOString(), elapsedSeconds }));
  }

  function handleQuickActualUpdate(exerciseId, setId, field, delta) {
    if (session.status === 'completed' || session.status === 'discarded') return;

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

  function handleDismissRestTimer() {
    setSession((currentSession) => clearRestTimer(currentSession));
  }

  function handleAdjustRestTimer(delta) {
    setSession((currentSession) => adjustRestTimer(currentSession, delta));
  }

  function handleTrainNavigation(targetKey, payload = null) {
    if (payload?.selectedDayId) {
      setSelectedCalendarDayId(payload.selectedDayId)
    }

    if (targetKey === 'program') {
      setIsProgramSheetOpen(true)
      return
    }

    if (targetKey) {
      setActiveTrainTab(targetKey)
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {renderAppShell({
          styles,
          screen: appRenderModel.screen,
          bottomTabs: appRenderModel.bottomTabs,
          trainRenderModel,
          sessionRenderModel,
          onTabPress: setActiveTab,
          renderTrainSurface: ({ trainRenderModel, sessionRenderModel, styles }) =>
            renderTrainSurface({
              trainRenderModel,
              sessionRenderModel,
              styles,
              onTrainTabPress: setActiveTrainTab,
              onActionTarget: handleTrainNavigation,
              renderSections: (sections, onActionTarget) => renderGenericSections({ sections, styles, onActionTarget }),
              renderSessionSections: (sections) =>
                renderSessionSections({
                  sections,
                  styles,
                  statusStyles,
                  onFinishWorkout: handleFinishWorkout,
                  onDiscardWorkout: handleDiscardWorkout,
                  onDismissRestTimer: handleDismissRestTimer,
                  onAdjustRestTimer: handleAdjustRestTimer,
                  onCompleteSet: handleCompleteSet,
                  onQuickActualUpdate: handleQuickActualUpdate,
                }),
            }),
          renderGenericSections: ({ sections, styles }) => renderGenericSections({ sections, styles }),
        })}
        {renderProgramSheet({
          isVisible: isProgramSheetOpen,
          onClose: () => setIsProgramSheetOpen(false),
          model: programSheetModel,
          styles,
        })}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
