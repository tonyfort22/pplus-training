import { useWindowDimensions, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { logoPphtGreenSvg } from '../assets/logo-ppht-green.js'
import { getLoadingScreenThemeBranding } from '../assets/loading-screen-backgrounds.js'
import { loadingLogoSize } from './brand-logo-sizing.js'
import { getAppTheme } from '../theme/app-theme.js'

export function LoadingView({ theme }) {
  const { width, height } = useWindowDimensions()
  const overlayWidth = width * 1.08
  const overlayHeight = height * 1.08
  const resolvedTheme = theme || getAppTheme('dark')
  const loadingScreenBranding = getLoadingScreenThemeBranding(resolvedTheme.id)

  return (
    <View className="flex-1 overflow-hidden" style={{ backgroundColor: loadingScreenBranding.backgroundColor }}>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <SvgXml xml={loadingScreenBranding.overlaySvg} width={overlayWidth} height={overlayHeight} preserveAspectRatio="xMidYMid slice" />
      </View>
      <View className="absolute inset-0 items-center justify-center">
        <SvgXml xml={logoPphtGreenSvg} width={loadingLogoSize.width} height={loadingLogoSize.height} />
      </View>
    </View>
  )
}
