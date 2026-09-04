import { View, Text } from 'react-native'
import { fonts } from '../../constants/theme'

/**
 * UBPLogo — brand mark component.
 *
 * variant="compact"  (default)
 *   "UBP" in DM Serif Display + single underline.
 *   Used in TopBar and all persistent in-app screen headers.
 *
 * variant="wordmark"
 *   "UBP" mark + underline + "UniBlueprint" wordmark below.
 *   Used on the splash screen, WelcomeScreen, and any first-impression
 *   or trust-building context where the full brand name should appear.
 */
export default function UBPLogo({ height = 32, color = '#F5F0E8', variant = 'compact' }) {
  const markSize = Math.round(height * 0.70)
  const wordSize = Math.round(height * 0.26)

  return (
    <View style={{ alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.serif, fontSize: markSize, color, includeFontPadding: false }}>
        UBP
      </Text>
      <View style={{ height: 2, backgroundColor: color, marginTop: 4 }} />
      {variant === 'wordmark' && (
        <Text style={{
          fontFamily: fonts.sansMedium,
          fontSize: wordSize,
          color,
          letterSpacing: 1.4,
          marginTop: 7,
          includeFontPadding: false,
        }}>
          UniBlueprint
        </Text>
      )}
    </View>
  )
}
