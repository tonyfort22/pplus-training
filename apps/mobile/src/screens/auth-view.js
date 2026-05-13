import { useMemo, useState } from 'react'
import { useWindowDimensions, Pressable, Text, TextInput, View } from 'react-native'
import { ChevronRight, Eye, EyeOff } from 'lucide-react-native'
import { SvgXml } from 'react-native-svg'
import { getLoadingScreenThemeBranding } from '../assets/loading-screen-backgrounds.js'
import { getAuthScreenModel } from '../auth/auth-screen-models.js'
import { getAppTheme } from '../theme/app-theme.js'
import { AppFieldShell } from '../ui/primitives.js'

function AuthRoleButton({ option, isSelected, onPress, theme }) {
  return (
    <Pressable
      className="flex-1 rounded-[16px] px-4 py-3"
      style={{
        borderWidth: isSelected ? 1 : 0,
        borderColor: isSelected ? theme.accentBorder : 'transparent',
        backgroundColor: isSelected ? theme.accentSurface : theme.surface,
      }}
      onPress={() => onPress(option.id)}
      disabled={option.isDisabled}
    >
      <Text className="text-center text-[15px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.textSoft }}>{option.label}</Text>
    </Pressable>
  )
}

function AuthField({ field, onChange, theme }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = field.id === 'password' || field.id === 'confirmPassword'
  const isSecureEntryEnabled = field.secureTextEntry && !isPasswordVisible
  const trailing = isPasswordField ? (
    <Pressable
      className="ml-3 h-8 w-8 items-center justify-center rounded-[12px]"
      hitSlop={10}
      onPress={() => setIsPasswordVisible((current) => !current)}
      disabled={field.isDisabled}
    >
      {isPasswordVisible ? <EyeOff color={theme.iconMuted} size={18} strokeWidth={2.2} /> : <Eye color={theme.iconMuted} size={18} strokeWidth={2.2} />}
    </Pressable>
  ) : null

  return (
    <View className="gap-2">
      <Text className="text-[12px] font-semibold uppercase tracking-[1px]" style={{ color: theme.textSoft }}>{field.label}</Text>
      <AppFieldShell theme={theme} trailing={trailing} className="h-14 py-0">
        <TextInput
          className="px-0 py-0 text-[16px]"
          style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: theme.text, textAlign: 'left', letterSpacing: 0 }}
          value={field.value}
          placeholder={field.placeholder}
          placeholderTextColor={theme.textSoft}
          keyboardType={field.keyboardType}
          secureTextEntry={isSecureEntryEnabled}
          autoCapitalize={field.autoCapitalize}
          autoCorrect={false}
          editable={!field.isDisabled}
          onChangeText={(nextValue) => onChange(field.id, nextValue)}
        />
      </AppFieldShell>
    </View>
  )
}

export function AuthView({
  mode = 'sign_in',
  onModeChange,
  onSubmit,
  onForgotPassword,
  onInvitationCodePress,
  isSubmitting = false,
  errorMessage = '',
  noticeMessage = '',
  theme,
}) {
  const { width, height } = useWindowDimensions()
  const overlayWidth = width * 1.08
  const overlayHeight = height * 1.08
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    coachEmail: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'athlete',
  })

  const model = useMemo(() => getAuthScreenModel({ mode, isSubmitting, errorMessage, noticeMessage, values }), [mode, isSubmitting, errorMessage, noticeMessage, values])
  const resolvedTheme = theme || getAppTheme('dark')
  const authScreenBranding = getLoadingScreenThemeBranding(resolvedTheme.id)

  function handleChange(fieldId, nextValue) {
    setValues((current) => ({ ...current, [fieldId]: nextValue }))
  }

  function handleRoleChange(nextRoleId) {
    setValues((current) => ({ ...current, role: nextRoleId }))
  }

  return (
    <View className="flex-1 overflow-hidden" style={{ backgroundColor: authScreenBranding.backgroundColor }}>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <SvgXml xml={authScreenBranding.overlaySvg} width={overlayWidth} height={overlayHeight} preserveAspectRatio="xMidYMid slice" />
      </View>
      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="w-full max-w-[420px] gap-5">
            <View className="rounded-[22px] p-2" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.id === 'light' ? resolvedTheme.surface : resolvedTheme.surfaceMuted }}>
              <View className="flex-row gap-3">
                {model.roleOptions.map((option) => (
                  <AuthRoleButton key={option.id} option={option} isSelected={model.selectedRoleId === option.id} onPress={handleRoleChange} theme={resolvedTheme} />
                ))}
              </View>
            </View>

            <View className="gap-4 rounded-[28px] px-5 py-5" style={{ borderWidth: 1, borderColor: resolvedTheme.border, backgroundColor: resolvedTheme.surface }}>
              {model.fields.map((field) => (
                <AuthField key={field.id} field={field} onChange={handleChange} theme={resolvedTheme} />
              ))}

              {model.errorMessage ? (
                <View className="rounded-[18px] px-4 py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.dangerBorder, backgroundColor: resolvedTheme.dangerSurface }}>
                  <Text className="text-[14px] leading-[20px]" style={{ color: resolvedTheme.dangerText }}>{model.errorMessage}</Text>
                </View>
              ) : null}

              {model.noticeMessage ? (
                <View className="rounded-[18px] px-4 py-3" style={{ borderWidth: 1, borderColor: resolvedTheme.accentBorder, backgroundColor: resolvedTheme.accentSurface }}>
                  <Text className="text-[14px] leading-[20px]" style={{ color: resolvedTheme.accentText }}>{model.noticeMessage}</Text>
                </View>
              ) : null}

              <Pressable
                className="flex-row items-center justify-center rounded-[20px] px-4 py-4"
                style={{ borderWidth: 1, borderColor: resolvedTheme.accentBorder, backgroundColor: resolvedTheme.accentSurface }}
                onPress={() => onSubmit?.({ mode, values })}
                disabled={model.submitDisabled}
              >
                <Text className="text-[17px] font-semibold" style={{ color: resolvedTheme.accentText }}>{model.submitLabel}</Text>
                <ChevronRight color={resolvedTheme.accentText} size={18} strokeWidth={2.5} />
              </Pressable>

              {model.secondaryActionLabel ? (
                <Pressable className="items-center py-1" onPress={() => onForgotPassword?.(values.email || '')} disabled={model.secondaryActionDisabled}>
                  <Text className="text-[14px] font-medium" style={{ color: resolvedTheme.accentText }}>{model.secondaryActionLabel}</Text>
                </Pressable>
              ) : null}

              {mode === 'sign_in' && values.role === 'athlete' && onInvitationCodePress ? (
                <Pressable className="items-center py-1" onPress={() => onInvitationCodePress?.()} disabled={isSubmitting}>
                  <Text className="text-[14px] font-medium" style={{ color: resolvedTheme.accentText }}>Sign up with invitation code</Text>
                </Pressable>
              ) : null}

              <Pressable className="items-center py-2" onPress={() => onModeChange?.(mode === 'sign_up' ? 'sign_in' : 'sign_up')} disabled={model.helperDisabled}>
                <Text className="text-[14px] font-medium" style={{ color: resolvedTheme.textSoft }}>{model.helperLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
