import { useState } from 'react'
import { Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarDays, Camera, ChevronLeft, Eye, EyeOff } from 'lucide-react-native'
import { getAppTheme } from '../theme/app-theme.js'
import { AppButton, AppFieldShell } from '../ui/primitives.js'

const GENDER_OPTIONS = ['Male', 'Female']
const POSITION_OPTIONS = ['Forward', 'Defense', 'Goalie']
const WEIGHT_INPUT_MAX_LENGTH_BY_UNIT = {
  lb: 5,
  kg: 5,
}
const HEIGHT_INPUT_MAX_LENGTH_BY_UNIT = {
  ft: 4,
  cm: 3,
}

function normalizeWeightInput(nextValue, maxLength = 5) {
  const sanitizedWeightValue = String(nextValue || '').replace(/[^0-9.]/g, '')
  const hasTrailingDecimal = sanitizedWeightValue.endsWith('.')
  const [weightWholePart = '', ...weightDecimalParts] = sanitizedWeightValue.split('.')
  const weightDecimalPart = weightDecimalParts.join('').slice(0, 1)
  const normalizedWeightValue = hasTrailingDecimal ? `${weightWholePart}.` : weightDecimalPart.length > 0 ? `${weightWholePart}.${weightDecimalPart}` : weightWholePart
  return normalizedWeightValue.slice(0, maxLength)
}

function OnboardingBackgroundWord({ topOffset = 0, theme }) {
  return (
    <Text
      className="absolute left-[-18px] text-[108px] font-semibold tracking-[8px]"
      style={{
        top: topOffset,
        color: 'transparent',
        opacity: 0.14,
        includeFontPadding: false,
        textShadowColor: theme.borderStrong,
        textShadowRadius: 0,
      }}
    >
      PPLUS
    </Text>
  )
}

function StepProgress({ currentStep = 0, theme }) {
  return (
    <View className="flex-row gap-2 self-center">
      {Array.from({ length: 6 }, (_, index) => {
        const isComplete = index <= currentStep
        return (
          <View
            key={`invite-onboarding-step-${index}`}
            className="h-[6px] w-11 rounded-full"
            style={{ backgroundColor: isComplete ? theme.accent : 'rgba(255,255,255,0.88)' }}
          />
        )
      })}
    </View>
  )
}

function OnboardingField({ label, fieldId, value = '', placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize = 'none', onChangeField = () => {}, theme, testID }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = fieldId === 'password' || fieldId === 'confirmPassword'
  const isSecureEntryEnabled = secureTextEntry && !isPasswordVisible
  const trailing = isPasswordField ? (
    <Pressable
      className="ml-3 h-8 w-8 items-center justify-center rounded-[12px]"
      hitSlop={10}
      onPress={() => setIsPasswordVisible((current) => !current)}
    >
      {isPasswordVisible ? <EyeOff color={theme.iconMuted} size={18} strokeWidth={2.2} /> : <Eye color={theme.iconMuted} size={18} strokeWidth={2.2} />}
    </Pressable>
  ) : null

  return (
    <View className="gap-2.5">
      <Text className="pl-1 text-[12px] font-semibold tracking-[1.2px]" style={{ color: theme.text }}>{label}</Text>
      <AppFieldShell theme={theme} trailing={trailing} className="min-h-[54px] rounded-[18px] px-4 py-0">
        <TextInput
          testID={testID}
          className="px-0 py-0 text-[16px]"
          style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: theme.textMuted, textAlign: 'left', letterSpacing: 0 }}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.textSoft}
          keyboardType={keyboardType}
          secureTextEntry={isSecureEntryEnabled}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onChangeText={(nextValue) => onChangeField(fieldId, nextValue)}
        />
      </AppFieldShell>
    </View>
  )
}

function ChoiceButton({ label, selected = false, onPress = () => {}, theme }) {
  return (
    <Pressable
      className="min-h-[56px] items-center justify-center rounded-[18px] px-5"
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.border,
        backgroundColor: theme.surface,
      }}
    >
      <Text className="text-[19px] font-semibold" style={{ color: selected ? theme.accentText : theme.text }}>{label}</Text>
    </Pressable>
  )
}

function UnitToggle({ options, activeValue, onChange = () => {}, theme }) {
  return (
    <View className="mt-8 self-center rounded-full p-1" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: '#101A2A' }}>
      <View className="flex-row gap-1">
        {options.map((option) => {
          const isSelected = option.value === activeValue
          return (
            <Pressable
              key={option.value}
              className="min-w-[78px] items-center justify-center rounded-full px-5 py-3"
              onPress={() => onChange(option.value)}
              style={isSelected ? { backgroundColor: theme.accentSurface, borderWidth: 1, borderColor: theme.accentBorder } : null}
            >
              <Text className="text-[16px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.text }}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function MeasureCard({ value, labels, unitLabel, onSelect = () => {}, theme }) {
  return (
    <View
      className="rounded-[24px] px-5 pb-5 pt-6"
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: '#101A2A',
      }}
    >
      <Text className="text-center text-[44px] font-semibold" style={{ color: theme.text }}>{value}</Text>
      <View className="mt-5 px-2">
        <View className="flex-row items-end justify-between">
          {labels.map((label) => {
            const isSelected = String(label) === String(value)
            return (
              <Pressable key={label} className="items-center" onPress={() => onSelect(label)}>
                <Text className="text-[14px] font-medium" style={{ color: isSelected ? theme.text : theme.textSoft }}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
        <View className="mt-4 h-[26px] justify-center">
          <View className="h-[1px]" style={{ backgroundColor: theme.borderStrong }} />
          <View className="absolute left-1/2 ml-[-1px] h-[26px] w-[2px] rounded-full" style={{ backgroundColor: theme.text }} />
        </View>
      </View>
      <Text className="mt-3 text-center text-[18px] font-medium lowercase" style={{ color: theme.text }}>{unitLabel}</Text>
    </View>
  )
}

function InputValueCard({ value = '', suffix = '', placeholder = '', keyboardType = 'number-pad', onChangeText = () => {}, theme }) {
  return (
    <View
      className="mt-8 self-center w-full max-w-[336px] rounded-[24px] px-5 py-4"
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: '#101A2A',
      }}
    >
      <View className="flex-row items-center justify-between gap-4">
        <TextInput
          className="flex-1 text-[24px] font-semibold"
          style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: theme.text, textAlign: 'left', letterSpacing: 0 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSoft}
          keyboardType={keyboardType}
          autoCorrect={false}
        />
        <Text className="text-[20px] font-semibold lowercase" style={{ color: theme.textSoft }}>{suffix}</Text>
      </View>
    </View>
  )
}

function DetailsStep({ values, onChangeField, onAvatarPress, theme }) {
  const hasAvatar = Boolean(values.avatarUrl)

  return (
    <>
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>Enter your details</Text>

      <Pressable className="mt-8 self-center" onPress={onAvatarPress}>
        <View
          className="h-28 w-28 items-center justify-center overflow-hidden rounded-full"
          style={{
            backgroundColor: '#101A2A',
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          {hasAvatar ? (
            <Image source={{ uri: values.avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Camera color={theme.text} size={28} strokeWidth={2.2} />
          )}
        </View>
      </Pressable>

      <View
        className="mt-8 rounded-[24px] px-4 py-5"
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: '#101A2A',
        }}
      >
        <View className="gap-4">
          <OnboardingField label="FIRST NAME" fieldId="firstName" value={values.firstName || ''} placeholder="Thomas" autoCapitalize="words" onChangeField={onChangeField} theme={theme} />
          <OnboardingField label="LAST NAME" fieldId="lastName" value={values.lastName || ''} placeholder="Thibault" autoCapitalize="words" onChangeField={onChangeField} theme={theme} />
          <OnboardingField label="PASSWORD" fieldId="password" value={values.password || ''} placeholder="Create a strong password" secureTextEntry autoCapitalize="none" onChangeField={onChangeField} theme={theme} />
          <OnboardingField label="CONFIRM PASSWORD" fieldId="confirmPassword" value={values.confirmPassword || ''} placeholder="Confirm your password" secureTextEntry autoCapitalize="none" onChangeField={onChangeField} theme={theme} />
        </View>
      </View>
    </>
  )
}

function formatDateOfBirthLabel(value) {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return ''
  }

  const parsedDate = new Date(`${normalizedValue}T12:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseDateOfBirthValue(value) {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return new Date()
  }

  const parsedDate = new Date(`${normalizedValue}T12:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
}

function DateOfBirthStep({ values, onChangeField, theme }) {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [datePickerValue, setDatePickerValue] = useState(() => parseDateOfBirthValue(values.dateOfBirth))
  const selectedDateLabel = formatDateOfBirthLabel(values.dateOfBirth)

  function handleOpenDatePicker() {
    setDatePickerValue(parseDateOfBirthValue(values.dateOfBirth))
    setIsDatePickerVisible(true)
  }

  function handleDateChange(_event, selectedDate) {
    const nextDate = selectedDate || datePickerValue
    setDatePickerValue(nextDate)
    onChangeField('dateOfBirth', nextDate.toISOString().slice(0, 10))

    if (Platform.OS !== 'ios') {
      setIsDatePickerVisible(false)
    }
  }

  return (
    <View className="flex-1 justify-center pb-10">
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>What is your date of birth?</Text>

      <Pressable
        className="mt-8 self-center w-full max-w-[336px] rounded-[24px] px-5 py-4"
        onPress={handleOpenDatePicker}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: '#101A2A',
        }}
      >
        <View className="flex-row items-center justify-between gap-4">
          <Text className="flex-1 text-[24px] font-semibold" style={{ color: selectedDateLabel ? theme.text : theme.textSoft }}>
            {selectedDateLabel || 'Select date'}
          </Text>
          <View className="h-11 w-11 items-center justify-center rounded-[16px]" style={{ borderWidth: 1, borderColor: theme.borderStrong, backgroundColor: '#0D1524' }}>
            <CalendarDays color={theme.textSoft} size={20} strokeWidth={2.1} />
          </View>
        </View>
      </Pressable>

      <Modal transparent visible={isDatePickerVisible} animationType="fade" onRequestClose={() => setIsDatePickerVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: theme.overlay }}>
          <Pressable className="flex-1" onPress={() => setIsDatePickerVisible(false)} />
          <View className="rounded-t-[28px] px-3 pb-8 pt-5" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
            <View className="mb-5 h-1.5 w-14 self-center rounded-full" style={{ backgroundColor: theme.border }} />
            <DateTimePicker value={datePickerValue} mode="date" display="spinner" textColor={theme.text} themeVariant={theme.id} onChange={handleDateChange} maximumDate={new Date()} />
            {Platform.OS === 'ios' ? (
              <Pressable className="mt-3 items-center rounded-[14px] py-3" style={{ borderWidth: 1, borderColor: theme.accentBorder, backgroundColor: theme.accentSurface }} onPress={() => setIsDatePickerVisible(false)}>
                <Text className="text-[15px] font-semibold" style={{ color: theme.accentText }}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  )
}

function GenderStep({ values, onChangeField, theme }) {
  return (
    <View className="flex-1 justify-center pb-16">
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>What is your gender?</Text>
      <View className="mt-12 gap-5 px-2">
        {GENDER_OPTIONS.map((option) => (
          <ChoiceButton
            key={option}
            label={option}
            selected={String(values.gender || '').toLowerCase() === option.toLowerCase()}
            onPress={() => onChangeField('gender', option)}
            theme={theme}
          />
        ))}
      </View>
    </View>
  )
}

function PositionStep({ values, onChangeField, theme }) {
  return (
    <View className="flex-1 justify-center pb-12">
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>What is your position?</Text>
      <View className="mt-12 gap-5 px-2">
        {POSITION_OPTIONS.map((option) => (
          <ChoiceButton
            key={option}
            label={option}
            selected={String(values.position || '').toLowerCase() === option.toLowerCase()}
            onPress={() => onChangeField('position', option)}
            theme={theme}
          />
        ))}
      </View>
    </View>
  )
}

function WeightStep({ values, onChangeField, theme }) {
  const weightUnit = values.weightUnit || 'lb'
  const normalizedWeightValue = String(values.weight || '')
  const weightInputSuffix = weightUnit === 'kg' ? 'kg' : 'lb'

  function handleWeightUnitChange(nextUnit) {
    if (nextUnit === weightUnit) {
      return
    }

    const nextValue = Number(values.weight || 0)
    const convertedWeight = nextUnit === 'kg'
      ? Math.round(nextValue * 0.45359237)
      : Math.round(nextValue / 0.45359237)

    onChangeField('weightUnit', nextUnit)
    onChangeField('weight', normalizeWeightInput(String(convertedWeight || ''), WEIGHT_INPUT_MAX_LENGTH_BY_UNIT[nextUnit] || 5))
  }

  return (
    <View className="flex-1 justify-center pb-8">
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>What is your weight?</Text>
      <UnitToggle
        options={[{ label: 'Lb', value: 'lb' }, { label: 'kg', value: 'kg' }]}
        activeValue={weightUnit}
        onChange={(nextUnit) => handleWeightUnitChange(nextUnit)}
        theme={theme}
      />
      <InputValueCard
        value={normalizedWeightValue}
        suffix={weightInputSuffix}
        placeholder="170"
        keyboardType="decimal-pad"
        onChangeText={(nextValue) => onChangeField('weight', normalizeWeightInput(nextValue, WEIGHT_INPUT_MAX_LENGTH_BY_UNIT[weightUnit] || 5))}
        theme={theme}
      />
    </View>
  )
}

function HeightStep({ values, onChangeField, theme }) {
  const heightUnit = values.heightUnit || 'ft'
  const normalizedHeightValue = heightUnit === 'cm' ? String(values.heightCm || '') : `${String(values.heightFeet || '')}'${String(values.heightInches || '')}`
  const heightInputSuffix = heightUnit === 'cm' ? 'cm' : 'ft'

  function handleHeightUnitChange(nextUnit) {
    if (nextUnit === heightUnit) {
      return
    }

    onChangeField('heightUnit', nextUnit)
  }

  function handleHeightChange(nextValue) {
    const digitsOnly = String(nextValue || '').replace(/[^0-9]/g, '')

    if (heightUnit === 'cm') {
      onChangeField('heightCm', digitsOnly.slice(0, HEIGHT_INPUT_MAX_LENGTH_BY_UNIT.cm))
      return
    }

    const nextFeet = digitsOnly.slice(0, 1)
    const nextInches = digitsOnly.slice(1, 3)
    onChangeField('heightFeet', nextFeet)
    onChangeField('heightInches', nextInches)
  }

  return (
    <View className="flex-1 justify-center pb-4">
      <Text className="text-center text-[31px] font-semibold" style={{ color: theme.text }}>What is your height?</Text>
      <UnitToggle
        options={[{ label: 'ft', value: 'ft' }, { label: 'cm', value: 'cm' }]}
        activeValue={heightUnit}
        onChange={(nextUnit) => handleHeightUnitChange(nextUnit)}
        theme={theme}
      />
      <InputValueCard
        value={normalizedHeightValue}
        suffix={heightInputSuffix}
        placeholder={heightUnit === 'cm' ? '180' : "5'09"}
        keyboardType="number-pad"
        onChangeText={handleHeightChange}
        theme={theme}
      />
    </View>
  )
}

function AthleteInviteOnboardingViewContent({
  currentStep = 0,
  values = {},
  onChangeField = () => {},
  onAvatarPress = () => {},
  onNext = () => {},
  onPrevious = () => {},
  onClose = () => {},
  isSubmitting = false,
  errorMessage = '',
  noticeMessage = '',
  theme,
}) {
  const insets = useSafeAreaInsets()
  const resolvedTheme = theme || getAppTheme('dark')

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: resolvedTheme.background }}>
      <View className="flex-1 overflow-hidden" style={{ backgroundColor: resolvedTheme.background, paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 18) }}>
        <OnboardingBackgroundWord topOffset={56} theme={resolvedTheme} />
        <OnboardingBackgroundWord topOffset={238} theme={resolvedTheme} />
        <OnboardingBackgroundWord topOffset={420} theme={resolvedTheme} />
        <OnboardingBackgroundWord topOffset={602} theme={resolvedTheme} />

        <View className="px-5">
          <StepProgress currentStep={currentStep} theme={resolvedTheme} />
        </View>

        <View className="absolute left-5 top-2">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-[18px]"
            onPress={onClose}
            style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: '#101A2A' }}
          >
            <ChevronLeft color={resolvedTheme.icon} size={20} strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView className="mt-8 flex-1 px-5" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {currentStep === 0 ? <DetailsStep values={values} onChangeField={onChangeField} onAvatarPress={onAvatarPress} theme={resolvedTheme} /> : null}
          {currentStep === 1 ? <DateOfBirthStep values={values} onChangeField={onChangeField} theme={resolvedTheme} /> : null}
          {currentStep === 2 ? <GenderStep values={values} onChangeField={onChangeField} theme={resolvedTheme} /> : null}
          {currentStep === 3 ? <PositionStep values={values} onChangeField={onChangeField} theme={resolvedTheme} /> : null}
          {currentStep === 4 ? <WeightStep values={values} onChangeField={onChangeField} theme={resolvedTheme} /> : null}
          {currentStep === 5 ? <HeightStep values={values} onChangeField={onChangeField} theme={resolvedTheme} /> : null}

          {errorMessage ? <Text className="mt-5 text-center text-[14px] leading-6" style={{ color: resolvedTheme.dangerText }}>{errorMessage}</Text> : null}
          {noticeMessage ? <Text className="mt-5 text-center text-[14px] leading-6" style={{ color: resolvedTheme.accentText }}>{noticeMessage}</Text> : null}
        </ScrollView>

        <View className="px-6">
          {currentStep > 0 ? (
            <View className="flex-row gap-3">
              <AppButton
                theme={resolvedTheme}
                label="Previous"
                tone="ghost"
                onPress={onPrevious}
                disabled={isSubmitting}
                style={{ minHeight: 56, flex: 1, borderRadius: 999, borderColor: resolvedTheme.accentBorder }}
              />
              <AppButton
                theme={resolvedTheme}
                label={isSubmitting && currentStep === 5 ? 'Getting started...' : currentStep === 5 ? 'Get started' : 'Next'}
                onPress={onNext}
                disabled={isSubmitting}
                style={{ minHeight: 56, flex: 1, borderRadius: 999 }}
              />
            </View>
          ) : (
            <AppButton
              theme={resolvedTheme}
              label={isSubmitting && currentStep === 4 ? 'Getting started...' : currentStep === 4 ? 'Get started' : 'Next'}
              onPress={onNext}
              disabled={isSubmitting}
              style={{ minHeight: 56, borderRadius: 999 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

export function AthleteInviteOnboardingView({ isVisible, invitationCode, currentStep = 0, values, onChangeField, onAvatarPress, onNext, onPrevious, onClose, isSubmitting = false, errorMessage = '', noticeMessage = '', theme }) {
  void invitationCode

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <AthleteInviteOnboardingViewContent
        currentStep={currentStep}
        values={values}
        onChangeField={onChangeField}
        onAvatarPress={onAvatarPress}
        onNext={onNext}
        onPrevious={onPrevious}
        onClose={onClose}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        noticeMessage={noticeMessage}
        theme={theme}
      />
    </Modal>
  )
}
