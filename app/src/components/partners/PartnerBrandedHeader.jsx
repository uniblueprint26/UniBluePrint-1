import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'

// ─── Reusable partner-brand header ─────────────────────────────────────────────
// The reusable half of the "screen branded in a partner's own identity"
// pattern (see src/constants/partnerBrands.js). Pass in that partner's brand
// token object plus an eyebrow/title/sub and it renders a full-bleed header in
// THEIR colors and fonts, with a back button and credit line — not
// UniBlueprint's navy/cream. Built for CourseCompass, meant to be reused as-is
// for the next partner integration ("Priority") by passing a different brand.
export default function PartnerBrandedHeader({ brand, eyebrow, title, sub, insetTop, onBack, backLabel = 'Home' }) {
  return (
    <View style={[styles.block, { backgroundColor: brand.navy, paddingTop: insetTop + 8 }]}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityRole="button">
          <ChevronLeft size={20} color={brand.cream} strokeWidth={2} />
          <Text style={[styles.backBtnText, { color: brand.cream, fontFamily: brand.fonts.bodyMedium }]}>{backLabel}</Text>
        </TouchableOpacity>
        <View style={[styles.brandPill, { backgroundColor: brand.orange }]}>
          <Text style={[styles.brandPillText, { fontFamily: brand.fonts.bodySemiBold, color: brand.navy }]}>{brand.name}</Text>
        </View>
      </View>

      {!!eyebrow && (
        <Text style={[styles.eyebrow, { fontFamily: brand.fonts.bodySemiBold, color: brand.sky }]}>{eyebrow}</Text>
      )}
      <Text style={[styles.title, { fontFamily: brand.fonts.headingBold, color: brand.cream }]}>{title}</Text>
      {!!sub && (
        <Text style={[styles.sub, { fontFamily: brand.fonts.body, color: 'rgba(247,249,251,0.78)' }]}>{sub}</Text>
      )}

      {!!brand.creditLine && (
        <View style={styles.attrRow}>
          <View style={[styles.attrDot, { backgroundColor: brand.sky }]} />
          <Text style={[styles.attrText, { fontFamily: brand.fonts.body }]}>{brand.creditLine}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 16, paddingBottom: 32 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontSize: 14 },
  brandPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  brandPillText: { fontSize: 11, letterSpacing: 0.3 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, lineHeight: 38, marginBottom: 10 },
  sub: { fontSize: 14, lineHeight: 22 },
  attrRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(247,249,251,0.14)',
  },
  attrDot: { width: 5, height: 5, borderRadius: 99, marginTop: 5, flexShrink: 0 },
  attrText: { fontSize: 11, color: 'rgba(247,249,251,0.5)', lineHeight: 16, flex: 1 },
})
