import { Children, cloneElement, isValidElement, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react-native'

export function AppSurfaceCard({ theme, children, onPress, accent = false, style, contentClassName = 'gap-3 px-6 py-5', containerClassName = 'rounded-[24px] overflow-hidden' }) {
  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper
      className={containerClassName}
      style={[
        {
          borderWidth: 1,
          borderColor: accent ? theme.accentBorder : theme.border,
          backgroundColor: theme.surface,
        },
        style,
      ]}
      onPress={onPress}
    >
      {accent ? <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: theme.accent }} /> : null}
      <View className={contentClassName}>{children}</View>
    </Wrapper>
  )
}

export function AppButton({ theme, label, onPress, tone = 'primary', disabled = false, leftIcon = null, style }) {
  const toneStyle = tone === 'danger'
    ? {
        backgroundColor: theme.dangerSurface,
        borderColor: theme.dangerBorder,
        textColor: theme.dangerText,
      }
    : tone === 'ghost'
      ? {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          textColor: theme.text,
        }
      : {
          backgroundColor: disabled ? theme.surfaceMuted : theme.accentSurface,
          borderColor: disabled ? theme.border : theme.accentBorder,
          textColor: disabled ? theme.textSoft : theme.accentText,
        }

  return (
    <Pressable
      className="flex-row items-center justify-center gap-2 rounded-[20px] px-5 py-3.5"
      style={[
        {
          borderWidth: 1,
          backgroundColor: toneStyle.backgroundColor,
          borderColor: toneStyle.borderColor,
        },
        style,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {leftIcon}
      <Text className="text-[15px] font-semibold" style={{ color: toneStyle.textColor }}>{label}</Text>
    </Pressable>
  )
}

export function AppOutlinedActionButton({ theme, label, onPress, leftIcon = null, style }) {
  return (
    <Pressable
      className="flex-row items-center justify-center gap-2 rounded-[24px] border px-5 py-4"
      onPress={onPress}
      style={[
        {
          borderColor: theme.accentBorder,
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      {leftIcon}
      <Text className="text-[17px] font-semibold" style={{ color: theme.accentText }}>{label}</Text>
    </Pressable>
  )
}

export function AppDangerPillButton({ theme, label, onPress, leftIcon = null, style }) {
  return (
    <Pressable
      className="self-center rounded-full px-5 py-3"
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.dangerSurface,
        },
        style,
      ]}
    >
      <View className="flex-row items-center gap-2">
        {leftIcon}
        <Text className="text-[15px] font-semibold" style={{ color: theme.dangerText }}>{label}</Text>
      </View>
    </Pressable>
  )
}

export function AppSheetHeader({ theme, title, onBack, rightAction = null, leftIcon = null }) {
  return (
    <View className="mb-7 flex-row items-center justify-between">
      <Pressable
        className="h-11 w-11 items-center justify-center rounded-[18px]"
        style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}
        onPress={onBack}
      >
        {leftIcon || <ChevronLeft color={theme.icon} size={20} strokeWidth={2.6} />}
      </Pressable>
      <Text className="flex-1 text-center text-[24px] font-bold" style={{ color: theme.text }}>{title}</Text>
      <View className="min-w-[44px] items-end">{rightAction}</View>
    </View>
  )
}

export function AppSegmentedControl({ theme, options, activeId, onChange }) {
  return (
    <View className="flex-row rounded-[20px] p-1" style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }}>
      {options.map((option) => {
        const isSelected = option.id === activeId
        return (
          <Pressable
            key={option.id}
            className="flex-1 items-center justify-center rounded-[16px] px-4 py-3.5"
            style={isSelected ? { backgroundColor: theme.accentSurface, borderWidth: 1, borderColor: theme.accentBorder } : null}
            onPress={() => onChange?.(option.id)}
          >
            <Text className="text-[14px] font-semibold" style={{ color: isSelected ? theme.accentText : theme.textSoft }}>{option.label}</Text>
          </Pressable>
        )}
      )}
    </View>
  )
}

export function AppListRow({ theme, title, body = '', onPress = null, leading = null, trailing = null, bordered = true }) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper className="flex-row items-center gap-3 py-3" style={bordered ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null} onPress={onPress}>
      {leading}
      <View className="flex-1 gap-1">
        <Text className="text-[17px] font-semibold" style={{ color: theme.text }}>{title}</Text>
        {body ? <Text className="text-[14px]" style={{ color: theme.textSoft }}>{body}</Text> : null}
      </View>
      {trailing || (onPress ? <ChevronRight color={theme.iconMuted} size={18} strokeWidth={2.4} /> : null)}
    </Wrapper>
  )
}

function renderFocusableInputChildren(children, setIsFocused) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child

    return cloneElement(child, {
      onFocus: (event) => {
        setIsFocused(true)
        child.props.onFocus?.(event)
      },
      onBlur: (event) => {
        setIsFocused(false)
        child.props.onBlur?.(event)
      },
    })
  })
}

export function AppSearchInput({ theme, value, onChangeText, placeholder = 'Search', onFocus, onBlur }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  return (
    <View className="flex-row items-center rounded-[24px] px-5 py-3.5" style={{ borderWidth: 1, borderColor: isSearchFocused ? theme.inputFocusBorder : theme.border, backgroundColor: theme.surface }}>
      <Search color={theme.iconMuted} size={18} strokeWidth={2.2} />
      <TextInput
        className="ml-3 min-w-0 flex-1 px-0 py-0 text-[16px]"
        style={{ backgroundColor: 'transparent', outlineStyle: 'none', color: theme.text, lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' }}
        placeholder={placeholder}
        placeholderTextColor={theme.textSoft}
        value={value}
        numberOfLines={1}
        autoCorrect={false}
        autoCapitalize="none"
        onChangeText={onChangeText}
        onFocus={(event) => {
          setIsSearchFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setIsSearchFocused(false)
          onBlur?.(event)
        }}
      />
    </View>
  )
}

export function AppStatusBadge({ theme, label, tone = 'neutral' }) {
  const toneStyle = tone === 'danger'
    ? { backgroundColor: theme.dangerSurface, borderColor: theme.dangerBorder, textColor: theme.dangerText }
    : tone === 'accent'
      ? { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder, textColor: theme.accentText }
      : { backgroundColor: theme.surfaceMuted, borderColor: theme.border, textColor: theme.textMuted }

  return (
    <View className="rounded-full px-3 py-1.5" style={{ borderWidth: 1, borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor }}>
      <Text className="text-[12px] font-semibold" style={{ color: toneStyle.textColor }}>{label}</Text>
    </View>
  )
}

export function AppStatusIconBadge({ theme, status, size = 'md' }) {
  const sizeClassName = size === 'xs'
    ? 'h-6 w-6 rounded-[8px]'
    : size === 'sm'
      ? 'h-8 w-8 rounded-[10px]'
      : 'h-10 w-10 rounded-[12px]'

  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 15 : 18
  const toneStyle = status === 'done'
    ? { borderColor: theme.accentBorder, backgroundColor: theme.accentSurface, iconColor: theme.accentText, Icon: Check }
    : status === 'upcoming'
      ? { borderColor: theme.borderStrong, backgroundColor: theme.surface, iconColor: theme.textSoft, Icon: Check }
      : { borderColor: theme.dangerBorder, backgroundColor: theme.dangerSurface, iconColor: theme.dangerText, Icon: X }

  const IconComponent = toneStyle.Icon

  return (
    <View className={`${sizeClassName} items-center justify-center`} style={{ borderWidth: 1, borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor }}>
      <IconComponent color={toneStyle.iconColor} size={iconSize} strokeWidth={2.6} />
    </View>
  )
}

export function AppSelectionIndicator({ theme, selected = false }) {
  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{
        borderWidth: 1,
        borderColor: selected ? theme.accentBorder : theme.border,
        backgroundColor: selected ? theme.accentSurface : theme.surface,
      }}
    >
      {selected ? <Check color={theme.accentText} size={16} strokeWidth={2.4} /> : null}
    </View>
  )
}

export function AppNoticeCard({ theme, title = '', body = '', tone = 'neutral', centered = false }) {
  const toneStyle = tone === 'danger'
    ? { backgroundColor: theme.dangerSurface, borderColor: theme.dangerBorder, titleColor: theme.dangerText, bodyColor: theme.dangerText }
    : tone === 'accent'
      ? { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder, titleColor: theme.accentText, bodyColor: theme.accentText }
      : { backgroundColor: theme.surface, borderColor: theme.border, titleColor: theme.text, bodyColor: theme.textSoft }

  return (
    <View className={`rounded-[20px] px-5 py-5 ${centered ? 'items-center' : ''}`.trim()} style={{ borderWidth: 1, borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor }}>
      {title ? <Text className={`text-[16px] ${centered ? 'text-center' : ''}`} style={{ color: toneStyle.titleColor }}>{title}</Text> : null}
      {body ? <Text className={`${title ? 'mt-1' : ''} text-[15px] ${centered ? 'text-center' : ''}`.trim()} style={{ color: toneStyle.bodyColor }}>{body}</Text> : null}
    </View>
  )
}

export function AppFieldShell({ theme, children, onPress = null, trailing = null, className = '' }) {
  const [isFieldFocused, setIsFieldFocused] = useState(false)
  const Wrapper = onPress ? Pressable : View
  const shellClassName = `flex-row items-center rounded-[20px] px-5 py-4 ${className}`.trim()
  return (
    <Wrapper
      className={shellClassName}
      style={{ borderWidth: 1, borderColor: isFieldFocused ? theme.inputFocusBorder : theme.border, backgroundColor: theme.surface }}
      onPress={onPress}
    >
      <View className="flex-1 justify-center">{renderFocusableInputChildren(children, setIsFieldFocused)}</View>
      {trailing}
    </Wrapper>
  )
}
