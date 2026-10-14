/**
 * TabCoachMark — a one-time, lightweight callout that points at the Home
 * tab and explains the two destinations reached from it whose names don't
 * self-explain to a first-time user the way Home/Messages/Directory/Profile
 * do: Foundation Blueprint (career documents — CV, cover letters, LinkedIn,
 * etc.) and Elevation Blueprint (1:1 coaching).
 *
 * Task #84: the founder's audit concluded the tab bar's actual mix is the
 * right one and should NOT be restructured or relabelled — this coach mark
 * is the entire fix. It is a non-blocking popover, not a modal: the rest of
 * the screen (including the tab bar underneath it) stays fully interactive,
 * and it never reappears once dismissed (see navigation/index.jsx, which
 * owns the "seen" flag and the timing — shown once, right after the
 * first-launch tour finishes for a new user, or on next open for an
 * existing one, never alongside the tour itself).
 */

import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions } from 'react-native'
import { Platform } from 'react-native'
import { FileText, TrendingUp, X } from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Must track MainTabsInner's own tabBarStyle.height in navigation/index.jsx —
// duplicated here (rather than imported) because that value lives inside a
// screenOptions object, not exported. Five root tabs, Home is the leftmost.
const TAB_BAR_BASE_HEIGHT = 56
const ROOT_TAB_COUNT = 5

export default function TabCoachMark({ onDismiss }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const fade = useRef(new Animated.Value(0)).current
  const rise = useRef(new Animated.Value(10)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start()
  }, [])

  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom
  const tabWidth = width / ROOT_TAB_COUNT
  const arrowLeft = Math.max(tabWidth / 2 - 8, 20)

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.wrap,
          { bottom: tabBarHeight + 10, opacity: fade, transform: [{ translateY: rise }] },
        ]}
      >
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <X size={15} color={colors.light} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.title}>Two things worth knowing</Text>

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={15} color="#2563EB" strokeWidth={2} />
            </View>
            <Text style={styles.rowText}>
              <Text style={styles.rowLabel}>Foundation Blueprint </Text>
              is your career documents — CV, cover letters, LinkedIn, and more.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
              <TrendingUp size={15} color="#16A34A" strokeWidth={2} />
            </View>
            <Text style={styles.rowText}>
              <Text style={styles.rowLabel}>Elevation Blueprint </Text>
              is 1:1 coaching with verified coaches.
            </Text>
          </View>

          <Text style={styles.footnote}>Find both from Home.</Text>

          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onDismiss}>
            <Text style={styles.ctaBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.arrow, { left: arrowLeft }]} />
      </Animated.View>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  wrap: {
    position: 'absolute',
    left: 12,
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    paddingTop: spacing.md + 2,
    ...shadows.elevated,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(15,23,32,0.18)' } : null),
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingRight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 17,
  },
  rowLabel: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.light,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  ctaBtn: {
    backgroundColor: colors.accentBg,
    borderRadius: radius.button,
    paddingVertical: 9,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.accentFg,
  },
  arrow: {
    position: 'absolute',
    bottom: -7,
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 4px rgba(15,23,32,0.08)' } : null),
  },
  })
}
