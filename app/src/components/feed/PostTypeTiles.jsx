import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Smile, Image as ImageIcon, Video, Radio } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The four things you can make from the Post sheet. `type` is the composer's
// internal tab: 'thread' is the Take post type in the database (the word
// "Thread" is never shown to a user). "Mood Board" is only the mood picker that
// goes with a Take.
export const POST_TYPES = [
  { type: 'thread', label: 'Take', hint: 'Your take, with a mood', Icon: Smile },
  { type: 'post',   label: 'Post', hint: 'Share up to 6 pictures', Icon: ImageIcon },
  { type: 'clip',   label: 'Clip', hint: 'A short video',          Icon: Video },
  { type: 'live',   label: 'Live', hint: 'Camera, any time', Icon: Radio },
]

export default function PostTypeTiles({ value, onChange }) {
  const { colors } = useTheme()
  const s = styles(colors)
  return (
    <View style={s.grid} accessibilityRole="radiogroup">
      {POST_TYPES.map(({ type, label, hint, Icon }) => {
        const selected = type === value
        return (
          <TouchableOpacity
            key={type}
            style={[s.tile, selected && s.tileSelected]}
            onPress={() => onChange(type)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label}. ${hint}`}
          >
            <View style={[s.iconWrap, selected && s.iconWrapSelected]}>
              <Icon size={18} color={selected ? colors.accentFg : colors.textPrimary} strokeWidth={1.8} />
            </View>
            <View style={s.textWrap}>
              <Text style={[s.label, selected && s.labelSelected]}>{label}</Text>
              <Text style={[s.hint, selected && s.hintSelected]} numberOfLines={2}>{hint}</Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function styles(colors) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    tile: {
      width: '47.5%', flexGrow: 1, minHeight: 112,
      borderRadius: 18, padding: 12, paddingHorizontal: 14, paddingVertical: 14, gap: 18, justifyContent: 'space-between',
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    },
    tileSelected: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
    iconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center',
    },
    iconWrapSelected: { backgroundColor: colors.accentFg + '24' },
    textWrap: { gap: 3 },
    label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.textPrimary },
    labelSelected: { color: colors.accentFg },
    hint: { fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
    hintSelected: { color: colors.accentFg, opacity: 0.8 },
  })
}
