import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'

// Contextual share prompt — shown right after a moment worth sharing
// (a Foundation Blueprint output completed, a coach enquiry sent, etc).
// Copy is platform-authored by default; a coach/partner's own
// share_prompt_text (set in their Studio profile settings) overrides it
// when one has been provided, falling back to `fallbackText` otherwise.
//
// `onShare` is handed the composer prefill it should navigate with:
// { initialTab, initialText, initialMood }.

const DEFAULT_PROMPT = "That's one more Blueprint sorted — fancy sharing it?"

export default function SharePrompt({
  visible,
  text,
  fallbackText = DEFAULT_PROMPT,
  prefill,
  onShare,
  onDismiss,
}) {
  if (!visible) return null
  const copy = (text || '').trim() || fallbackText

  return (
    <View style={s.card}>
      <View style={s.iconWrap}>
        <Sparkles size={16} color="#A5813B" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.text}>{copy}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={s.shareBtn} activeOpacity={0.85} onPress={() => onShare(prefill)}>
            <Text style={s.shareBtnText}>Share it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dismissBtn} activeOpacity={0.7} onPress={onDismiss}>
            <Text style={s.dismissBtnText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(165,129,59,0.1)', borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(165,129,59,0.25)',
    padding: spacing.md, marginTop: spacing.md,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
    ...shadows.card,
  },
  text: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.navy, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  shareBtn: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  shareBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.cream },
  dismissBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  dismissBtnText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.muted },
})
