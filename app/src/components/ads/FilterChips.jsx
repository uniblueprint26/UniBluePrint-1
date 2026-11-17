import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// One calm row of filter chips. The selected chip is filled with the Ad Board
// accent and carries dark ink so the label stays readable.
export default function FilterChips({ kinds, value, onChange }) {
  const t = useAdTokens()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
      style={s.scroll}
      accessibilityRole="tablist"
    >
      {kinds.map(k => {
        const on = k.key === value
        return (
          <TouchableOpacity
            key={k.key}
            activeOpacity={0.8}
            onPress={() => onChange(k.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[
              s.chip,
              on
                ? { backgroundColor: t.accent, borderColor: t.accent }
                : { backgroundColor: t.colors.surface, borderColor: t.colors.border },
            ]}
          >
            <Text style={[s.text, { color: on ? t.accentInk : t.colors.textPrimary }]}>{k.label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
