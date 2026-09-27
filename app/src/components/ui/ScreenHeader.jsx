import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ArrowLeftRight } from 'lucide-react-native'
import { colors, fonts, spacing } from '../../constants/theme'

// One shared header for every screen that used to hand-roll its own
// back-button row (audit L5: at least six different styles — "‹ Home",
// "‹ Back", a circular chevron on auth screens, a bare chevron on TopBar,
// "< Back" with no accessibility label, and the portal "My Blueprint" exit
// link). Two things every one of those got wrong, fixed here once:
//   1. The back label was hard-coded to wherever the designer assumed the
//      user came from ("Coaches", "Profile", "Home"...), which reads wrong
//      the moment someone arrives from anywhere else. This defaults to the
//      neutral "Back" — pass `backLabel` only when the destination is truly
//      fixed (e.g. a confirmation screen that always returns to one place).
//   2. The tap target was whatever the chevron glyph measured (about 32pt).
//      `hitSlop` below brings every back control to a real 44×44pt target
//      without changing the visual size of the icon/label.
//
// Two header shapes cover the two patterns actually used across the app:
//   - `onBack` → a top-left chevron + label ("‹ Back"), optionally with
//     `rightAccessory` in the same row. This is the CoachBooking/About/FAQs/
//     Help/PrivacyData/MyOutputs/etc. shape.
//   - `exitTo` (no `onBack`) → an eyebrow on the left and a text-only exit
//     link on the right, no chevron. This is the Founder/Operations/Partner
//     portal shape ("FOUNDER DASHBOARD" … "My Blueprint").
// `eyebrow`, `title` and `subtitle` render underneath either row. `children`
// renders after the subtitle, inside the same header block, for screens that
// need extra content in the hero (an avatar, a stat row, a search field).
export default function ScreenHeader({
  variant = 'navy',
  eyebrow,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  exitTo,
  rightAccessory,
  icon,
  logoCenter,
  children,
  style,
  titleStyle,
  subtitleStyle,
  bottomInset = true,
  compact = false,
  topInset = true,
}) {
  const insets = useSafeAreaInsets()
  const topPad = topInset ? insets.top : 0
  const dark = variant === 'navy'
  const fg = dark ? colors.cream : colors.navy
  const fgMuted = dark ? 'rgba(245,240,232,0.6)' : colors.muted

  // Compact mode: a single slim bar (back chevron, a centred title/subtitle,
  // an optional right icon) — the shape ChatRoom, BoardDetail and
  // Notifications need instead of the tall hero block About/FAQs/Pricing use.
  if (compact) {
    return (
      <View
        style={[
          styles.compactHeader,
          { backgroundColor: dark ? colors.navy : colors.cream, paddingTop: topPad + 8 },
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.compactSide}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Go back${backLabel && backLabel !== 'Back' ? ` to ${backLabel}` : ''}`}
        >
          <ChevronLeft size={20} color={fg} strokeWidth={2} />
          {!!backLabel && <Text style={[styles.backBtnText, { color: fg }]}>{backLabel}</Text>}
        </TouchableOpacity>
        <View style={styles.compactCenter}>
          {!!title && <Text style={[styles.compactTitle, { color: fg }, titleStyle]} numberOfLines={1} accessibilityRole="header">{title}</Text>}
          {!!subtitle && <Text style={[styles.compactSubtitle, { color: fgMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={[styles.compactSide, styles.compactSideRight]}>{rightAccessory}</View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: dark ? colors.navy : colors.cream, paddingTop: topPad + 12 },
        !bottomInset && { paddingBottom: 0 },
        style,
      ]}
    >
      {onBack ? (
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.backBtn, logoCenter && { minWidth: 70 }]}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Go back${backLabel && backLabel !== 'Back' ? ` to ${backLabel}` : ''}`}
          >
            <ChevronLeft size={20} color={fg} strokeWidth={2} />
            <Text style={[styles.backBtnText, { color: fg }]}>{backLabel}</Text>
          </TouchableOpacity>
          {!!logoCenter && <View style={styles.logoCenterSlot}>{logoCenter}</View>}
          {!!rightAccessory ? (
            <View style={styles.rightSlot}>{rightAccessory}</View>
          ) : (
            !!logoCenter && <View style={{ minWidth: 70 }} />
          )}
        </View>
      ) : exitTo ? (
        <View style={styles.topRow}>
          {!!eyebrow && <Text style={[styles.eyebrow, { color: fgMuted }]}>{eyebrow}</Text>}
          <TouchableOpacity
            style={styles.exitLink}
            activeOpacity={0.75}
            onPress={exitTo.onPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={exitTo.label}
          >
            <ArrowLeftRight size={12} color={fgMuted} strokeWidth={2} />
            <Text style={[styles.exitLinkText, { color: fgMuted }]}>{exitTo.label}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        !!rightAccessory && (
          <View style={[styles.topRow, { justifyContent: 'flex-end' }]}>{rightAccessory}</View>
        )
      )}

      {!!icon && <View style={styles.iconSlot}>{icon}</View>}
      {!!eyebrow && !exitTo && (
        <Text style={[styles.eyebrow, { color: fgMuted, marginTop: onBack ? 14 : 0 }]}>{eyebrow}</Text>
      )}
      {!!title && (
        <Text style={[styles.title, { color: fg }, titleStyle]} accessibilityRole="header">
          {title}
        </Text>
      )}
      {!!subtitle && <Text style={[styles.subtitle, { color: fgMuted }, subtitleStyle]}>{subtitle}</Text>}
      {children}
    </View>
  )
}

// Shared 44×44pt icon-button used inside ScreenHeader's rightAccessory slot,
// and standalone by the tab-root screens (Home/Ad Board/Messages/Directory/
// Profile menu, bell and avatar buttons — audit L6) so every icon control in
// the app shares one real tap target instead of each screen picking its own
// 28–36pt box.
export function HeaderIconButton({ icon: Icon, onPress, color, size = 20, badge, accessibilityLabel, style }) {
  return (
    <TouchableOpacity
      style={[styles.iconBtn, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={size} color={color || colors.navy} />
      {!!badge && <View style={styles.iconBadge} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
  },
  compactSide: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    minWidth: 60, minHeight: 44, paddingVertical: 10, paddingHorizontal: 8,
  },
  compactSideRight: { justifyContent: 'flex-end' },
  compactCenter: { flex: 1, alignItems: 'center' },
  compactTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  compactSubtitle: { fontFamily: fonts.sans, fontSize: 11, marginTop: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconSlot: { marginTop: 4, marginBottom: 2 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 44, paddingVertical: 12, marginLeft: -8, paddingLeft: 8, paddingRight: 8,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  rightSlot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoCenterSlot: { flex: 1, alignItems: 'center' },
  exitLink: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingVertical: 12 },
  exitLinkText: { fontFamily: fonts.sansMedium, fontSize: 12 },
  eyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  title: { fontFamily: fonts.serif, fontSize: 26, marginTop: 2 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 6 },
  iconBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
  },
  iconBadge: {
    position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.destructive,
  },
})
