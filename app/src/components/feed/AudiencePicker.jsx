import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Check, ChevronDown, Users } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { AUDIENCES, PILLARS } from '../../constants/pillars'

// Where a post goes. Campus Connect, Course Connect and Friends only, taken
// from AUDIENCES so labels never drift. Used as three stacked rows on the Post
// sheet (AudiencePicker) and as a small tappable chip in the compose step
// (AudienceChip).

export const AUDIENCE_ORDER = ['campus', 'course', 'friends']

// "People you follow back" is the honest wording for mutual follows; the
// shared constant is shorter.
export function audienceBlurb(key) {
  return key === 'friends' ? 'People you follow back' : AUDIENCES[key].blurb
}

// The audience's own icon in its own colour: the pillar's for campus and
// course (building, Irish flag), a users icon for Friends only.
export function AudienceGlyph({ audience, size = 20, color }) {
  const { colors } = useTheme()
  const a = AUDIENCES[audience] || AUDIENCES.campus
  if (a.pillar) {
    const { Icon, color: pillarColor } = PILLARS[a.pillar]
    return <Icon size={size} color={color || pillarColor} strokeWidth={1.8} />
  }
  return <Users size={size} color={color || colors.textPrimary} strokeWidth={1.8} />
}

function glyphWash(audience, colors) {
  const a = AUDIENCES[audience]
  const pillar = a?.pillar && PILLARS[a.pillar]
  // 8-digit hex: pillar colour at about 14% opacity.
  return pillar && audience === 'campus' ? pillar.color + '24' : colors.tabFill
}

export default function AudiencePicker({ value, onChange }) {
  const { colors } = useTheme()
  const s = styles(colors)
  return (
    <View style={s.list} accessibilityRole="radiogroup">
      {AUDIENCE_ORDER.map(key => {
        const selected = key === value
        return (
          <TouchableOpacity
            key={key}
            style={[s.row, selected && s.rowSelected]}
            onPress={() => onChange(key)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${AUDIENCES[key].label}, ${audienceBlurb(key)}`}
          >
            <View style={[s.glyph, { backgroundColor: glyphWash(key, colors) }]}>
              <AudienceGlyph audience={key} size={20} />
            </View>
            <View style={s.text}>
              <Text style={s.label}>{AUDIENCES[key].label}</Text>
              <Text style={s.blurb}>{audienceBlurb(key)}</Text>
            </View>
            <View style={[s.radio, selected && s.radioOn]}>
              {selected && <Check size={13} color={colors.accentFg} strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function AudienceChip({ value, onPress }) {
  const { colors } = useTheme()
  const s = styles(colors)
  const a = AUDIENCES[value] || AUDIENCES.campus
  return (
    <TouchableOpacity
      style={s.chip}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Posting to ${a.label}. Change`}
    >
      <AudienceGlyph audience={value} size={14} />
      <Text style={s.chipText} numberOfLines={1}>{a.label}</Text>
      <ChevronDown size={14} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>
  )
}

function styles(colors) {
  return StyleSheet.create({
    list: { gap: 12 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14, paddingHorizontal: 16,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowSelected: { borderColor: colors.accentBg, borderWidth: 1.5, backgroundColor: colors.background },
    glyph: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1, gap: 2 },
    label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.textPrimary },
    blurb: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary },
    radio: {
      width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    radioOn: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },

    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
      paddingVertical: 7, paddingLeft: 11, paddingRight: 9, borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary },
  })
}
