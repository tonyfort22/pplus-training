export const statusStyles = {
  not_started: { backgroundColor: '#1d4ed8' },
  active: { backgroundColor: '#7c3aed' },
  completed: { backgroundColor: '#059669' },
  skipped: { backgroundColor: '#b45309' },
}

export const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  appShell: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 110,
  },
  trainTabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  trainTabButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  trainTabButtonActive: {
    backgroundColor: '#2563eb',
  },
  trainTabLabel: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  trainTabLabelActive: {
    color: '#ffffff',
  },
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: '#93c5fd',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  finishButtonDone: {
    backgroundColor: '#059669',
  },
  finishButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  summary: {
    color: '#d1d5db',
    fontSize: 18,
    fontWeight: '600',
  },
  timer: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  restCard: {
    backgroundColor: '#172554',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  restHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restEyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  restTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  dismissText: {
    color: '#bfdbfe',
    fontWeight: '700',
  },
  restClock: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '700',
  },
  restActions: {
    flexDirection: 'row',
    gap: 12,
  },
  restActionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  restActionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionBody: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: '#1f2937',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  exerciseTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseMeta: {
    color: '#9ca3af',
    fontSize: 14,
  },
  exerciseStatusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  exerciseStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  setRow: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12,
  },
  setRowCompleted: {
    backgroundColor: '#064e3b',
  },
  setCopy: {
    flex: 1,
  },
  setControlsColumn: {
    minWidth: 120,
    gap: 8,
    alignItems: 'stretch',
  },
  setTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  setMeta: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 2,
  },
  actualControl: {
    gap: 4,
  },
  actualControlLabel: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '700',
  },
  actualControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  actualValue: {
    color: '#ffffff',
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  badgeDone: {
    backgroundColor: '#10b981',
  },
  badgeTodo: {
    backgroundColor: '#2563eb',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  listRow: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  listRowTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  listRowBody: {
    color: '#cbd5e1',
    marginTop: 4,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  metricLabel: {
    color: '#93c5fd',
    fontWeight: '700',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  metricDetail: {
    color: '#cbd5e1',
    lineHeight: 20,
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
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
  },
  tabLabel: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
}
