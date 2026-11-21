import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { fonts, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Contextual share prompt, shown right after a moment worth sharing
// (a Foundation output completed, a coach enquiry sent, etc).
// Copy is platform-authored by default; a coach/partner's own
// share_prompt_text (set in their Studio profile settings) overrides it
// when one has been provided, falling back to `fallbackText` otherwise.
//
// `onShare` is handed the composer prefill it should navigate with:
// { initialTab, initialText, initialMood }.
// Colours come from the theme so it reads in light and dark.

const DEFAULT_PROMPT = "That's one more Blueprint sorted, fancy sharing it?"

export default function SharePrompt({
  visible,
  text,
  fallbackText = DEFAULT_PROMPT,
  prefill,
  onShare,
  onDismiss,
}) {
  const { colors } = useTheme()
  if (!visible) return null
  const copy = (text || '').trim() || fallbackText

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.iconWrap, { backgroundColor: colors.tabFill }]}>
        <Sparkles size={16} color={colors.textPrimary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.text, { color: colors.textPrimary }]}>{copy}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: colors.accentBg }]} activeOpacity={0.85} onPress={() => onShare(prefill)}>
            <Text style={[s.shareBtnText, { color: colors.accentFg }]}>Share it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dismissBtn} activeOpacity={0.7} onPress={onDismiss}>
            <Text style={[s.dismissBtnText, { color: colors.textSecondary }]}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: radius.card, borderWidth: 1,
    padding: spacing.md, marginTop: spacing.md,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  text: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  shareBtn: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  shareBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  dismissBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  dismissBtnText: { fontFamily: fonts.sansMedium, fontSize: 13 },
})
