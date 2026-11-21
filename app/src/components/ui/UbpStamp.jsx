import { View, Text, StyleSheet } from 'react-native'
import { Stamp } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The small stamp that marks content UBP wrote itself ("From UBP", "Posted by
// UBP") and the "Example" mark on seeded examples. A double rule, a stamp
// glyph and spaced capitals, tilted a touch like a real ink stamp. Ink colour
// follows the theme: navy on light, cream on dark.
export default function UbpStamp({ label = 'From UBP', example = false, style }) {
  const { colors, isDark } = useTheme()
  const ink = isDark ? '#E9E2D0' : '#1E3A5F'
  const words = example ? 'Example' : label
  return (
    <View
      style={[s.outer, { borderColor: ink, transform: [{ rotate: '-3deg' }] }, style]}
      accessible
      accessibilityLabel={example ? 'Example, stamped by UBP' : label}
    >
      <View style={[s.inner, { borderColor: ink, backgroundColor: isDark ? 'rgba(233,226,208,0.06)' : 'rgba(30,58,95,0.05)' }]}>
        <Stamp size={11} color={ink} strokeWidth={2} />
        <Text style={[s.text, { color: ink }]} numberOfLines={1}>{words.toUpperCase()}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  outer: { borderWidth: 1.5, borderRadius: 7, padding: 2, flexShrink: 0, alignSelf: 'flex-start' },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2,
  },
  text: { fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1.1 },
})
