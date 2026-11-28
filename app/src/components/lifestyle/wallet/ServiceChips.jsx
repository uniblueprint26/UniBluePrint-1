import { View, Text, StyleSheet } from 'react-native'
import { fonts } from '../../../constants/theme'
import { useTheme } from '../../../context/ThemeContext'

// Up to three small chips naming what a partner does, then an optional short about
// line (two lines at most). Both come from getCardConfig (cfg.serviceChips, cfg.about).
// Plain text only, light and dark through the theme tokens, no images and no effects.
export default function ServiceChips({ chips, about, style }) {
  const { colors } = useTheme()
  const list = Array.isArray(chips) ? chips.slice(0, 3) : []
  if (list.length === 0 && !about) return null
  return (
    <View style={[styles.wrap, style]}>
      {list.length > 0 && (
        <View style={styles.row} accessible accessibilityLabel={`What they do: ${list.join(', ')}`}>
          {list.map(c => (
            <View key={c} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textPrimary }} numberOfLines={1}>{c}</Text>
            </View>
          ))}
        </View>
      )}
      {!!about && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.textSecondary }} numberOfLines={2}>{about}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
})
