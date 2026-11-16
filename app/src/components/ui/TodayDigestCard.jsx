import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, radius, shadows, sheen } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

/**
 * TodayDigestCard — the glanceable "today" object at the top of the Home
 * feed. Implements the wallet-pass / widget direction (08) from the Today's
 * Digest design review: a header band (eyebrow date + one-line serif
 * summary), a perforated divider, and a hairline-ruled stat grid. It reads
 * as a system object rather than a feed post, and its grid takes however
 * many real facts the app has for the student that day.
 *
 * Compact on purpose: it sits above the story rail and composer entry bar,
 * so up to 3 stats share one row rather than stacking into a 2x2 block.
 *
 * Data-honest: pass only stats that are real right now (no placeholder
 * facts). A stat with `onPress` becomes a tappable cell.
 *
 * Colours come from useTheme(), so it follows light/dark mode. No gold:
 * gold is reserved for money contexts, and this is a general summary.
 *
 * Props:
 *  - eyebrow:  short uppercase label, e.g. "Today · Mon 16 Nov"
 *  - title:    serif one-line summary, e.g. "3 unread · 2 deals live"
 *  - stats:    [{ key, label, value, Icon, onPress?, accessibilityLabel? }]
 */
export default function TodayDigestCard({ eyebrow, title, stats = [] }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)

  const visibleStats = (stats || []).filter(
    (s) => s && s.value !== null && s.value !== undefined && s.value !== ''
  )

  // Up to 3 stats fit one row; 4 lay out as 2x2 like the mockup.
  const perRow = visibleStats.length <= 3 ? Math.max(visibleStats.length, 1) : 2
  const rows = []
  for (let i = 0; i < visibleStats.length; i += perRow) {
    rows.push(visibleStats.slice(i, i + perRow))
  }

  return (
    <View style={styles.card}>
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? sheen.dark : sheen.light}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.sheen}
      />

      <View style={styles.top}>
        <View style={styles.topHeader}>
          <View style={styles.livePulse} />
          {!!eyebrow && (
            <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      {rows.length > 0 && (
        <>
          <View style={styles.perforation} />
          {rows.map((row, ri) => (
            <View
              key={ri}
              style={[styles.gridRow, ri < rows.length - 1 && styles.gridRowBorder]}
            >
              {row.map((stat, ci) => {
                const cellStyle = [styles.cell, ci < row.length - 1 && styles.cellBorderRight]
                const content = (
                  <>
                    <View style={styles.cellHead}>
                      {!!stat.Icon && (
                        <stat.Icon size={12} color={colors.textSecondary} strokeWidth={1.9} />
                      )}
                      <Text style={styles.cellLabel} numberOfLines={1}>{stat.label}</Text>
                    </View>
                    <Text style={styles.cellValue} numberOfLines={1}>{stat.value}</Text>
                  </>
                )
                return stat.onPress ? (
                  <TouchableOpacity
                    key={stat.key}
                    style={cellStyle}
                    onPress={stat.onPress}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={stat.accessibilityLabel || `${stat.value} ${stat.label}`}
                  >
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View
                    key={stat.key}
                    style={cellStyle}
                    accessible
                    accessibilityLabel={stat.accessibilityLabel || `${stat.value} ${stat.label}`}
                  >
                    {content}
                  </View>
                )
              })}
            </View>
          ))}
        </>
      )}
    </View>
  )
}

function getStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: 'hidden',
      ...(isDark ? shadows.glowDark : shadows.glow),
    },
    sheen: {
      position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    },
    top: {
      paddingHorizontal: 14,
      paddingTop: 11,
      paddingBottom: 10,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    livePulse: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    eyebrow: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 10,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 17,
      color: colors.textPrimary,
    },
    perforation: {
      marginHorizontal: 14,
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderTopColor: colors.divider,
    },
    gridRow: {
      flexDirection: 'row',
    },
    gridRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    cell: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    cellBorderRight: {
      borderRightWidth: 1,
      borderRightColor: colors.divider,
    },
    cellHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    cellLabel: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 9,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      flexShrink: 1,
    },
    cellValue: {
      fontFamily: fonts.serif,
      fontSize: 18,
      color: colors.textPrimary,
    },
  })
}
