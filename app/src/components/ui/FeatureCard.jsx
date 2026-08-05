/**
 * FeatureCard — shared between CampusConnectScreen and CourseConnectScreen
 *
 * Handles light (default) and dark (navy bg) variants via the `dark` prop.
 * Dark variant is used by the Cross-Ireland section in CourseConnectScreen.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'

export default function FeatureCard({ feature, dark = false }) {
  const cardBg    = dark ? 'rgba(245,240,232,0.08)' : colors.white
  const labelClr  = dark ? 'rgba(245,240,232,0.5)'  : colors.muted
  const titleClr  = dark ? colors.cream              : colors.navy
  const subClr    = dark ? 'rgba(245,240,232,0.65)'  : colors.muted
  const countClr  = dark ? 'rgba(245,240,232,0.55)'  : colors.navy
  const previewBg = dark ? 'rgba(245,240,232,0.06)'  : colors.cream
  const previewTx = dark ? 'rgba(245,240,232,0.85)'  : colors.navy
  const previewMt = dark ? 'rgba(245,240,232,0.45)'  : colors.muted
  const ctaBg     = dark ? colors.cream              : colors.navy
  const ctaTx     = dark ? colors.navy               : colors.cream
  const pillBg    = dark ? 'rgba(245,240,232,0.12)'  : 'rgba(30,58,95,0.08)'
  const pillTx    = dark ? 'rgba(245,240,232,0.6)'   : colors.muted
  const newBg     = dark ? '#A78BFA'                 : '#7C3AED'
  const borderClr = dark ? 'rgba(245,240,232,0.1)'  : 'transparent'

  return (
    <View style={[s.card, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: dark ? 1 : 0 }]}>
      {/* Top row */}
      <View style={s.topRow}>
        <View style={[s.iconBox, { backgroundColor: feature.color }]}>
          <feature.Icon size={20} color={dark ? colors.cream : colors.navy} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.label, { color: labelClr }]}>{feature.label}</Text>
          <View style={s.meta}>
            {feature.coming ? (
              <View style={[s.comingSoonPill, { backgroundColor: pillBg }]}>
                <Text style={[s.comingSoonText, { color: pillTx }]}>Coming Soon</Text>
              </View>
            ) : (
              <Text style={[s.count, { color: countClr }]}>{feature.count}</Text>
            )}
            {feature.isNew && (
              <View style={[s.newBadge, { backgroundColor: newBg }]}>
                <Text style={s.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Headline + sub */}
      <Text style={[s.headline, { color: titleClr }]}>{feature.headline}</Text>
      <Text style={[s.sub,      { color: subClr   }]}>{feature.sub}</Text>

      {/* Mini preview */}
      {feature.preview && (
        <View style={[s.preview, { backgroundColor: previewBg }]}>
          {feature.preview.map((post, i) => (
            <View
              key={i}
              style={[
                s.previewPost,
                i < feature.preview.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: dark ? 'rgba(245,240,232,0.07)' : 'rgba(30,58,95,0.07)',
                },
              ]}
            >
              <Text style={[s.previewText, { color: previewTx }]} numberOfLines={1}>{post.text}</Text>
              <Text style={[s.previewMeta, { color: previewMt }]}>{post.meta}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      {!feature.coming && (
        <TouchableOpacity style={[s.cta, { backgroundColor: ctaBg }]} activeOpacity={0.8}>
          <Text style={[s.ctaText, { color: ctaTx }]}>Open</Text>
          <ChevronRight size={13} color={ctaTx} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    borderRadius: 12, padding: 16,
    ...shadows.card,
  },
  topRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:   { fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count:   { fontFamily: fonts.sansSemiBold, fontSize: 12, opacity: 0.65 },

  comingSoonPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText: { fontFamily: fonts.sansMedium, fontSize: 10 },
  newBadge:       { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText:   { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  headline: { fontFamily: fonts.serif, fontSize: 20, marginTop: 12, lineHeight: 27 },
  sub:      { fontFamily: fonts.sans, fontSize: 13, marginTop: 5, lineHeight: 19 },

  preview:     { borderRadius: 8, marginTop: 14, overflow: 'hidden' },
  previewPost: { paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  previewText: { fontFamily: fonts.sans, fontSize: 12, flex: 1 },
  previewMeta: { fontFamily: fonts.sansMedium, fontSize: 11, flexShrink: 0 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9,
    alignSelf: 'flex-end', marginTop: 14,
  },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
})
