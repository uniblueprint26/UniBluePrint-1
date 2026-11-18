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
 * Calm on purpose: stats sit three to a row, in at most two rows. A short
 * last row is padded with empty cells so the columns still line up.
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
 *  - stats:    [{ key, label, value, Icon, caption?, onPress?, accessibilityLabel? }]
 *              Up to 6, three to a row. `caption` is a small quiet line under the value.
 */
export default function TodayDigestCard({ eyebrow, title, stats = [] }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)

  const visibleStats = (stats || []).filter(
    (s) => s && s.value !== null && s.value !== undefined && s.value !== ''
  )

  // Three to a row, at most two rows. A short row is padded so columns align.
  const PER_ROW = 3
  const shown = visibleStats.slice(0, PER_ROW * 2)
  const perRow = shown.length > PER_ROW ? PER_ROW : Math.max(shown.length, 1)
  const rows = []
  for (let i = 0; i < shown.length; i += perRow) {
    const row = shown.slice(i, i + perRow)
    while (row.length < perRow) row.push({ key: `pad-${i}-${row.length}`, pad: true })
    rows.push(row)
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
                if (stat.pad) return <View key={stat.key} style={styles.cell} />
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
                    {!!stat.caption && <Text style={styles.cellCaption} numberOfLines={1}>{stat.caption}</Text>}
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
      paddingTop: 14,
      paddingBottom: 14,
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
      paddingVertical: 14,
      paddingHorizontal: 14,
      minHeight: 62,
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
    cellCaption: {
      fontFamily: fonts.sans,
      fontSize: 10.5,
      color: colors.textSecondary,
      marginTop: 2,
    },
  })
}
