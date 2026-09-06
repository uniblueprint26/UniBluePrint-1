import { View, Text, TouchableOpacity } from 'react-native'
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
 *
 * Pass `onPress` to make the mark tappable — every top-left nav placement
 * of this logo across the app navigates to the Home dashboard on tap, so
 * screens wire `onPress={() => goToHome(navigation)}` (see
 * navigation/helpers.js). Left out entirely (e.g. the splash screen, the
 * pre-fonts-loaded gate in App.jsx, WelcomeScreen before sign-in) the mark
 * stays plain, non-interactive branding, since there's no Home to jump to.
 */
export default function UBPLogo({ height = 32, color = '#F5F0E8', variant = 'compact', onPress }) {
  const markSize = Math.round(height * 0.70)
  const wordSize = Math.round(height * 0.26)

  const content = (
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

  if (!onPress) return content

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="UniBlueprint home"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {content}
    </TouchableOpacity>
  )
}
