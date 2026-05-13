import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getTrainingCalendarModel } from '../apps/mobile/src/train/training-calendar-models.js'

test('mobile app shell opens a dedicated training calendar screen from the top-right header icon', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

  assert.match(appSource, /const \[isTrainingCalendarOpen, setIsTrainingCalendarOpen\] = useState\(false\);/)
  assert.match(appSource, /const trainingCalendarModel = useMemo\(/)
  assert.match(appSource, /<TrainingCalendarSheet[\s\S]*isVisible=\{isTrainingCalendarOpen\}/)
  assert.match(shellSource, /onUtilityHeaderPress/)
  assert.match(shellSource, /<Pressable style=\{styles\.brandIconButton\} onPress=\{onUtilityHeaderPress\}>/)
})

test('getTrainingCalendarModel hydrates real weeks and workout states from the assigned program tree', () => {
  const model = getTrainingCalendarModel({
    program: {
      weeks: [
        {
          id: 'week-1',
          weekIndex: 1,
          startDate: '2026-04-05',
          endDate: '2026-04-11',
          days: [
            { id: 'day-sun', date: '2026-04-05', name: 'Rest Day', workouts: [] },
            { id: 'day-mon', date: '2026-04-06', workouts: [{ id: 'pw-mon', nameSnapshot: 'Lower A', status: 'completed' }] },
            { id: 'day-tue', date: '2026-04-07', workouts: [{ id: 'pw-tue', nameSnapshot: 'Upper B', status: 'missed' }] },
            { id: 'day-wed', date: '2026-04-08', workouts: [{ id: 'pw-wed', nameSnapshot: 'Lower B', status: 'scheduled' }] },
            { id: 'day-thu', date: '2026-04-09', workouts: [] },
            { id: 'day-fri', date: '2026-04-10', workouts: [] },
            { id: 'day-sat', date: '2026-04-11', workouts: [] },
          ],
        },
      ],
    },
  })

  assert.equal(model.title, 'Training Calendar')
  assert.equal(model.loadMoreLabel, 'Load more')
  assert.equal(model.weeks.length, 1)
  assert.equal(model.weeks[0].dateRangeLabel, 'Apr 5 - Apr 11')
  assert.equal(model.weeks[0].weekLabel, 'Week 1')
  assert.equal(model.weeks[0].days[0].type, 'rest')
  assert.equal(model.weeks[0].days[1].workoutLabel, 'Lower A')
  assert.equal(model.weeks[0].days[1].status, 'done')
  assert.equal(model.weeks[0].days[2].status, 'missed')
  assert.equal(model.weeks[0].days[3].status, 'upcoming')
})

test('mobile training calendar screen matches the calendar reference structure', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/training-calendar-sheet.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/training-calendar-models.js'), 'utf8')

  assert.match(sheetSource, /Training Calendar/)
  assert.match(sheetSource, /Load more/)
  assert.match(sheetSource, /WeekBadge/)
  assert.match(sheetSource, /TrainingCalendarDayRow/)
  assert.match(sheetSource, /Rest Day/)
  assert.match(sheetSource, /Check/)
  assert.match(sheetSource, /X/)
  assert.match(sheetSource, /Modal/)
  assert.doesNotMatch(sheetSource, /AppSheetHeader/)
  assert.match(sheetSource, /onPress=\{onClose\}/)
  assert.match(sheetSource, /containerClassName="h-10 w-10 rounded-\[14px\] overflow-hidden"/)
  assert.match(sheetSource, /text-\[34px\] font-bold/)
  assert.match(sheetSource, /Schedule/)
  assert.match(sheetSource, /rounded-3xl overflow-hidden/)
  assert.match(sheetSource, /contentClassName="gap-3\.5 px-\[18px\] py-\[18px\]"/)
  assert.match(sheetSource, /text-2xl font-bold/)
  assert.match(sheetSource, /w-12 shrink-0 pr-2/)
  assert.match(sheetSource, /h-px flex-1/)
  assert.match(sheetSource, /AppStatusIconBadge/)
  assert.match(sheetSource, /useSafeAreaInsets/)
  assert.match(sheetSource, /SafeAreaProvider/)
  assert.match(sheetSource, /function TrainingCalendarSheetContent\(\{ onClose, model, theme \}\)/)
  assert.match(sheetSource, /const insets = useSafeAreaInsets\(\)/)
  assert.match(sheetSource, /paddingTop: Math\.max\(insets\.top, 16\)/)
  assert.match(sheetSource, /export function TrainingCalendarSheet\(\{ isVisible, onClose, model, theme \}\)/)
  assert.match(sheetSource, /from '\.\.\/theme\/app-theme\.js'/)
  assert.match(sheetSource, /from '\.\.\/ui\/primitives\.js'/)
  assert.match(sheetSource, /getAppTheme\('dark'\)/)
  assert.match(sheetSource, /AppSurfaceCard/)
  assert.match(sheetSource, /SafeAreaView className="flex-1" style=\{\{ backgroundColor: resolvedTheme\.background \}\}/)
  assert.doesNotMatch(sheetSource, /#34D399|#243041|#111827|text-white|text-slate-400|text-slate-300|bg-\[#1f1f2b\]/)
  assert.doesNotMatch(sheetSource, /bg-\[#2c2e3a\]/)
  assert.doesNotMatch(sheetSource, /bg-\[#2a2c37\]/)

  assert.match(modelSource, /getTrainingCalendarModel/)
  assert.match(modelSource, /trainState\?\.program\?\.weeks/)
  assert.match(modelSource, /formatWeekRangeLabel/)
  assert.match(modelSource, /mapWorkoutStatusToCalendarStatus/)
  assert.match(modelSource, /type: 'rest'/)
  assert.match(modelSource, /type: 'workout'/)
})
