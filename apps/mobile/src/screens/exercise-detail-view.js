import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ChevronDown } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { getAppTheme } from '../theme/app-theme.js';
import { AppSegmentedControl } from '../ui/primitives.js';

function trimDisplayDecimalNoise(value) {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return normalizedValue
  return normalizedValue.replace(/(\d+)\.0(?!\d)/g, '$1')
}

function formatHistoryCellDisplay(header, cell) {
  const normalizedHeader = String(header || '').trim().toUpperCase()
  if (normalizedHeader === 'WEIGHT (LB)' || normalizedHeader === 'EST 1RM (LB)' || normalizedHeader === 'LOAD') {
    return trimDisplayDecimalNoise(cell)
  }
  return cell
}

function ExerciseProgressChart({ model, theme }) {
  const values = model.progressPoints.map((point) => point.value)
  const latestProgressPoint = model.progressPoints[model.progressPoints.length - 1] || null
  const latestProgressPointDisplayValue = latestProgressPoint?.displayValue || latestProgressPoint?.value || '--'
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(maxValue - minValue, 1)
  const chartWidth = 320
  const chartHeight = 220
  const valueLabelY = 30
  const plotTop = 86
  const plotBottom = 170
  const dateLabelY = 198
  const horizontalPadding = 28
  const drawableWidth = chartWidth - horizontalPadding * 2
  const drawableHeight = plotBottom - plotTop
  const xStep = model.progressPoints.length > 1 ? drawableWidth / (model.progressPoints.length - 1) : 0
  const isSinglePointChart = model.progressPoints.length === 1
  const points = model.progressPoints.map((point, index) => {
    const x = isSinglePointChart ? chartWidth / 2 : horizontalPadding + index * xStep
    const y = plotBottom - ((point.value - minValue) / range) * drawableHeight
    return { ...point, x, y }
  })
  const pathD = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <View className="gap-4">
      <Text className="text-[22px] font-semibold" style={{ color: theme.text }}>{model.progressTitle || 'Progress'}</Text>
      <View
        className="overflow-hidden rounded-[28px] border px-4 py-4"
        style={{ borderColor: theme.border, backgroundColor: theme.surface }}
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px]" style={{ color: theme.textSoft }}>
              {model.progressYAxisLabel || 'VALUE'}
            </Text>
            <Text className="text-[34px] font-bold leading-[38px]" style={{ color: theme.text }}>
              {latestProgressPointDisplayValue}
            </Text>
          </View>
          <View
            className="rounded-full border px-3 py-2"
            style={{ borderColor: theme.borderStrong, backgroundColor: theme.overlay }}
          >
            <Text className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: theme.accentText }}>
              CURRENT BEST
            </Text>
          </View>
        </View>

        <Text className="mt-2 text-[13px]" style={{ color: theme.textSoft }}>
          {latestProgressPoint?.dateLabel || model.progressXAxisLabel || 'DATE'}
        </Text>

        <View
          className="mt-5 overflow-hidden rounded-[22px] border px-2 py-3"
          style={{ borderColor: theme.border, backgroundColor: theme.background }}
        >
          <View className="h-[220px]">
            <Svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
              {[plotTop, (plotTop + plotBottom) / 2, plotBottom].map((y, index) => (
                <Line
                  key={`row-guide-${index}`}
                  x1={horizontalPadding}
                  y1={y}
                  x2={chartWidth - horizontalPadding}
                  y2={y}
                  stroke={theme.border}
                  strokeWidth="1"
                />
              ))}
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
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {point.displayValue || point.value}
                </SvgText>
              ))}
              {points.length > 1 ? (
                <Path d={pathD} fill="none" stroke={theme.accentText} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
              {points.map((point) => (
                <Circle key={`${point.id}-halo`} cx={point.x} cy={point.y} r={isSinglePointChart ? '12' : '8'} fill={theme.accentText} opacity={isSinglePointChart ? '0.18' : '0.12'} />
              ))}
              {points.map((point) => (
                <Circle key={point.id} cx={point.x} cy={point.y} r={isSinglePointChart ? '6' : '4.5'} fill={theme.accentText} />
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
        </View>

        <Text className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>
          {model.progressXAxisLabel || 'DATE'}
        </Text>
      </View>
    </View>
  )
}

function getHistoryColumnClassName(index) {
  return index === 0 ? 'w-28' : 'flex-1'
}

function getHistoryCellClassName(index) {
  return index === 0 ? 'text-left' : 'text-center'
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
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-4 px-5">
        <Text className="text-[22px] font-semibold" style={{ color: theme.text }}>{model.historyTitle || 'History'}</Text>
        <View className="w-[188px] rounded-[18px] border p-1" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
          <AppSegmentedControl theme={theme} options={historyModes} activeId={historyMode} onChange={onHistoryModeChange} />
        </View>
      </View>

      <View className="mx-5 gap-3 rounded-[28px] border px-4 py-4" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
        <View className="flex-row items-center px-1 pb-2">
          {model.historyHeaders.map((header, index) => (
            <Text
              key={`${header}-${index}`}
              className={`${getHistoryColumnClassName(index)} ${index === 0 ? 'text-left' : 'text-center'} text-[11px] font-semibold uppercase tracking-[1px]`}
              style={{ color: theme.textSoft }}
            >
              {header}
            </Text>
          ))}
        </View>

        {hasHistoryRows ? (
          <View className="gap-2">
            {historyRows.map((row) => (
              <View
                key={row.id}
                className="min-h-[56px] flex-row items-center rounded-[18px] border px-3 py-3"
                style={{ borderColor: theme.border, backgroundColor: theme.background }}
              >
                {row.cells.map((cell, index) => (
                  <Text
                    key={`${row.id}-${index}`}
                    className={`${getHistoryColumnClassName(index)} ${getHistoryCellClassName(index)} text-[15px] ${index === 0 ? 'font-medium' : ''}`}
                    style={{ color: theme.text }}
                  >
                    {formatHistoryCellDisplay(model.historyHeaders[index], cell)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View className="min-h-[132px] items-center justify-center rounded-[20px] border px-5" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
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

  if (!model) return null

  const hasProgressData = Array.isArray(model.progressPoints) && model.progressPoints.length > 0

  return (
    <SafeAreaView edges={['bottom']} className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View>
            <View className="relative overflow-hidden" style={{ backgroundColor: resolvedTheme.surface }}>
              <VideoView
                allowsFullscreen
                contentFit="cover"
                nativeControls
                player={player}
                style={{ width: '100%', aspectRatio: 1 }}
              />
              <View className="absolute inset-x-0 bottom-0 h-24" style={{ backgroundColor: 'rgba(10, 14, 20, 0.28)' }} />
              <Pressable
                className="absolute left-5 h-10 w-10 items-center justify-center rounded-[14px]"
                onPress={onClose}
                style={{ top: Math.max(insets.top, 16), borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.overlay }}
              >
                <ChevronDown color={resolvedTheme.icon} size={20} strokeWidth={2.6} />
              </Pressable>
            </View>

            <View className="-mt-7 rounded-t-[32px] border-x border-t px-5 pt-6" style={{ borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.background }}>
              <View className="gap-6">
                <Text className="text-[30px] font-bold leading-[36px]" style={{ color: resolvedTheme.text }}>{model.title}</Text>
                {model.prCallout ? (
                  <View className="gap-2 rounded-[22px] border px-4 py-4" style={{ borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                    <Text className="text-[12px] font-bold uppercase tracking-[1px]" style={{ color: resolvedTheme.accentText }}>{model.prCallout.title}</Text>
                    <Text className="text-[15px] leading-[22px]" style={{ color: resolvedTheme.textSoft }}>{model.prCallout.body}</Text>
                  </View>
                ) : null}
                {hasProgressData ? (
                  <ExerciseProgressChart model={model} theme={resolvedTheme} />
                ) : (
                  <View className="gap-4">
                    <Text className="text-[22px] font-semibold" style={{ color: resolvedTheme.text }}>{model.progressTitle || 'Progress'}</Text>
                    <View className="overflow-hidden rounded-[28px] border px-4 py-4" style={{ borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
                      <View className="flex-row items-start justify-between gap-4">
                        <View className="flex-1 gap-2">
                          <Text className="text-[11px] font-semibold uppercase tracking-[1.4px]" style={{ color: resolvedTheme.textSoft }}>
                            {model.progressYAxisLabel || 'VALUE'}
                          </Text>
                          <Text className="text-[34px] font-bold leading-[38px]" style={{ color: resolvedTheme.text }}>
                            --
                          </Text>
                        </View>
                        <View className="rounded-full border px-3 py-2" style={{ borderColor: resolvedTheme.borderStrong, backgroundColor: resolvedTheme.overlay }}>
                          <Text className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: resolvedTheme.accentText }}>
                            CURRENT BEST
                          </Text>
                        </View>
                      </View>
                      <View className="mt-5 min-h-[160px] items-center justify-center rounded-[22px] border px-5 py-5" style={{ borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.background }}>
                        <Text className="text-center text-[15px] leading-[22px]" style={{ color: resolvedTheme.textSoft }}>
                          {model.emptyProgressMessage || 'No data available for this exercise'}
                        </Text>
                      </View>
                      <Text className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: resolvedTheme.textSoft }}>
                        {model.progressXAxisLabel || 'DATE'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="mt-8">
              <ExerciseHistoryTable model={model} historyMode={historyMode} onHistoryModeChange={setHistoryMode} theme={resolvedTheme} />
            </View>
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
