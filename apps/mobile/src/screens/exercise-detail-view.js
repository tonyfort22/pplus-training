import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ChevronDown } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { getAppTheme } from '../theme/app-theme.js';
import { AppSegmentedControl } from '../ui/primitives.js';

function ExerciseProgressChart({ model, theme }) {
  const values = model.progressPoints.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(maxValue - minValue, 1)
  const chartWidth = 320
  const chartHeight = 220
  const valueLabelY = 24
  const plotTop = 48
  const plotBottom = 146
  const dateLabelY = 176
  const horizontalPadding = 28
  const drawableWidth = chartWidth - horizontalPadding * 2
  const drawableHeight = plotBottom - plotTop
  const xStep = model.progressPoints.length > 1 ? drawableWidth / (model.progressPoints.length - 1) : 0
  const points = model.progressPoints.map((point, index) => {
    const x = horizontalPadding + index * xStep
    const y = plotBottom - ((point.value - minValue) / range) * drawableHeight
    return { ...point, x, y }
  })
  const pathD = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <View className="gap-4">
      <Text className="text-[22px] font-semibold" style={{ color: theme.text }}>{model.progressTitle || 'Progress'}</Text>
      <View className="rounded-[24px] px-4 py-4" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
        <Text className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{model.progressYAxisLabel || 'VALUE'}</Text>
        <View className="mt-4 h-[220px]">
          <Svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
            {points.map((point) => (
              <Line key={`${point.id}-guide`} x1={point.x} y1={plotTop} x2={point.x} y2={plotBottom} stroke={theme.borderStrong} strokeWidth="1" />
            ))}
            {points.map((point) => (
              <SvgText
                key={`${point.id}-value`}
                x={point.x}
                y={valueLabelY}
                fill={theme.textSoft}
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
              >
                {point.displayValue || point.value}
              </SvgText>
            ))}
            <Path d={pathD} fill="none" stroke={theme.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <Circle key={point.id} cx={point.x} cy={point.y} r="4" fill={theme.accentText} />
            ))}
            {points.map((point) => (
              <SvgText
                key={`${point.id}-date`}
                x={point.x}
                y={dateLabelY}
                fill={theme.textSoft}
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
              >
                {point.dateLabel}
              </SvgText>
            ))}
          </Svg>
        </View>
        <Text className="text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{model.progressXAxisLabel || 'DATE'}</Text>
      </View>
    </View>
  )
}

function getHistoryColumnClassName(index) {
  return index === 0 ? 'w-24' : 'flex-1'
}

function ExerciseHistoryTable({ model, historyMode, onHistoryModeChange, theme }) {
  const historyRows = historyMode === 'best'
    ? [...model.historyRows].sort((left, right) => Number(right.bestValue ?? 0) - Number(left.bestValue ?? 0) || right.timestamp - left.timestamp || left.id.localeCompare(right.id))
    : model.historyRows
  const historyModes = model.historyModes || [
    { id: 'recent', label: 'Recent' },
    { id: 'best', label: 'Best' },
  ]
  const hasHistoryRows = historyRows.length > 0

  return (
    <View className="gap-4 px-5">
      <View className="flex-row items-center justify-between gap-4">
        <Text className="text-[22px] font-semibold" style={{ color: theme.text }}>{model.historyTitle || 'History'}</Text>
        <View className="w-[180px]">
          <AppSegmentedControl theme={theme} options={historyModes} activeId={historyMode} onChange={onHistoryModeChange} />
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center pb-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
          {model.historyHeaders.map((header, index) => (
            <Text
              key={`${header}-${index}`}
              className={`${getHistoryColumnClassName(index)} text-center text-[11px] font-semibold uppercase tracking-[1px]`}
              style={{ color: theme.textSoft }}
            >
              {header}
            </Text>
          ))}
        </View>
        {hasHistoryRows ? (
          <View className="gap-2">
            {historyRows.map((row) => (
              <View key={row.id} className="min-h-[50px] flex-row items-center">
                {row.cells.map((cell, index) => (
                  <Text
                    key={`${row.id}-${index}`}
                    className={`${getHistoryColumnClassName(index)} text-center text-[15px]`}
                    style={{ color: theme.text }}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View className="min-h-[120px] items-center justify-center">
            <Text className="text-center text-[15px] leading-[22px]" style={{ color: theme.textSoft }}>
              {model.emptyHistoryMessage || 'No history found'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function ExerciseDetailViewContent({ model, onClose, theme }) {
  const insets = useSafeAreaInsets()
  const [historyMode, setHistoryMode] = useState(model?.historyMode || 'recent')
  const resolvedTheme = theme || getAppTheme('dark')
  const player = useVideoPlayer(model?.videoUrl || null, (videoPlayer) => {
    videoPlayer.loop = true
    videoPlayer.muted = true
    videoPlayer.play()
  })

  useEffect(() => {
    console.info('[exercise-detail-view]', {
      id: model?.id ?? null,
      title: model?.title ?? null,
      videoUrl: model?.videoUrl ?? null,
      looksLikeMp4: typeof model?.videoUrl === 'string' ? /\.mp4(\?|$)/i.test(model.videoUrl) : false,
    })
  }, [model?.id, model?.title, model?.videoUrl])

  if (!model) return null

  const hasProgressData = Array.isArray(model.progressPoints) && model.progressPoints.length > 0

  return (
    <SafeAreaView edges={['bottom']} className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-8">
            <View className="relative overflow-hidden" style={{ backgroundColor: resolvedTheme.surface }}>
              <VideoView
                allowsFullscreen
                contentFit="cover"
                nativeControls
                player={player}
                style={{ width: '100%', aspectRatio: 1 }}
              />
              <Pressable
                className="absolute left-5 h-10 w-10 items-center justify-center rounded-[14px]"
                onPress={onClose}
                style={{ top: Math.max(insets.top, 16), borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.overlay }}
              >
                <ChevronDown color={resolvedTheme.icon} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>

            <View className="gap-8 px-5">
              <Text className="text-[26px] font-bold leading-[32px]" style={{ color: resolvedTheme.text }}>{model.title}</Text>
              {model.prCallout ? (
                <View className="gap-2 rounded-[20px] border px-4 py-4" style={{ borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                  <Text className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: resolvedTheme.accentText }}>{model.prCallout.title}</Text>
                  <Text className="text-[15px] leading-[22px]" style={{ color: resolvedTheme.textSoft }}>{model.prCallout.body}</Text>
                </View>
              ) : null}
              {hasProgressData ? (
                <ExerciseProgressChart model={model} theme={resolvedTheme} />
              ) : (
                <View className="gap-4">
                  <Text className="text-[22px] font-semibold" style={{ color: resolvedTheme.text }}>{model.progressTitle || 'Progress'}</Text>
                  <View className="min-h-[220px] items-center justify-center">
                    <Text className="text-center text-[15px] leading-[22px]" style={{ color: resolvedTheme.textSoft }}>
                      {model.emptyProgressMessage || 'No data available for this exercise'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <ExerciseHistoryTable model={model} historyMode={historyMode} onHistoryModeChange={setHistoryMode} theme={resolvedTheme} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export function ExerciseDetailView({ isVisible, model, onClose, theme }) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ExerciseDetailViewContent model={model} onClose={onClose} theme={theme} />
      </SafeAreaProvider>
    </Modal>
  )
}
