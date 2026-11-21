import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native'
import { ChevronDown, ChevronUp, SlidersHorizontal, Target } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

/**
 * HomeDigest: Today's Digest, slim by default.
 *
 * Slim: one calm row (date, the one line summary, a chevron). Tap it and it
 * opens into the longer digest: a masthead (date, a rule, a serif headline,
 * and the next event when there is a real one), the grid of real numbers, then
 * the things that belong with it: Edit Home, and Your goals with add a goal
 * and goal reminders (passed in as `children`).
 *
 * Only real numbers are passed in. A stat with no value is left out.
 *
 * Props: eyebrow, title, stats [{ key, label, value, Icon, caption?, onPress? }],
 * nextUpLabel (string or null), onEditHome, children.
 */
export default function HomeDigest({ eyebrow, title, stats = [], nextUpLabel, onEditHome, children }) {
  const { colors, isDark } = useTheme()
  const s = getStyles(colors, isDark)
  const [open, setOpen] = useState(false)

  function toggle() {
    if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen(o => !o)
  }

  const shown = (stats || []).filter(x => x && x.value !== null && x.value !== undefined && x.value !== '').slice(0, 9)
  const rows = []
  for (let i = 0; i < shown.length; i += 3) {
    const row = shown.slice(i, i + 3)
    while (row.length < 3) row.push({ key: `pad-${i}-${row.length}`, pad: true })
    rows.push(row)
  }
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={open ? s.mast : s.slim}
        activeOpacity={0.8}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? "Close today's digest" : "Open today's digest"}
      >
        {open ? (
          <View style={{ flex: 1 }}>
            <View style={s.eyebrowRow}>
              <View style={s.dot} />
              <Text style={s.eyebrow}>{eyebrow}</Text>
            </View>
            <View style={s.rule} />
            <Text style={s.headline}>{title}</Text>
            {!!nextUpLabel && <Text style={s.nextUp}>{nextUpLabel}</Text>}
          </View>
        ) : (
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={s.eyebrowRow}>
              <View style={s.dot} />
              <Text style={s.eyebrow} numberOfLines={1}>{eyebrow}</Text>
            </View>
            <Text style={s.slimTitle} numberOfLines={1}>{title}</Text>
          </View>
        )}
        <View style={s.chev}>
          <Chevron size={18} color={colors.textPrimary} strokeWidth={2} />
        </View>
      </TouchableOpacity>

      {open && (
        <View>
          {rows.length > 0 && <View style={s.perforation} />}
          {rows.map((row, ri) => (
            <View key={ri} style={[s.gridRow, ri < rows.length - 1 && s.gridRowBorder]}>
              {row.map((stat, ci) => {
                if (stat.pad) return <View key={stat.key} style={s.cell} />
                const cellStyle = [s.cell, ci < row.length - 1 && s.cellBorderRight]
                const body = (
                  <>
                    <View style={s.cellHead}>
                      {!!stat.Icon && <stat.Icon size={13} color={colors.textSecondary} strokeWidth={1.9} />}
                      <Text style={s.cellLabel} numberOfLines={1}>{stat.label}</Text>
                    </View>
                    <Text style={s.cellValue} numberOfLines={1}>{stat.value}</Text>
                    {!!stat.caption && <Text style={s.cellCaption} numberOfLines={1}>{stat.caption}</Text>}
                  </>
                )
                return stat.onPress ? (
                  <TouchableOpacity key={stat.key} style={cellStyle} onPress={stat.onPress} activeOpacity={0.7}
                    accessibilityRole="button" accessibilityLabel={stat.accessibilityLabel || `${stat.value} ${stat.label}`}>
                    {body}
                  </TouchableOpacity>
                ) : (
                  <View key={stat.key} style={cellStyle} accessible accessibilityLabel={stat.accessibilityLabel || `${stat.value} ${stat.label}`}>
                    {body}
                  </View>
                )
              })}
            </View>
          ))}

          <View style={s.goalsHead}>
            <Target size={16} color={colors.textPrimary} strokeWidth={1.9} />
            <Text style={s.goalsTitle}>Your goals</Text>
            {!!onEditHome && (
              <TouchableOpacity style={s.editBtn} onPress={onEditHome} activeOpacity={0.7} hitSlop={8}
                accessibilityRole="button" accessibilityLabel="Edit Home">
                <SlidersHorizontal size={14} color={colors.textPrimary} strokeWidth={1.9} />
                <Text style={s.editText}>Edit Home</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.goalsHint}>Add a goal, and choose if and how often we remind you.</Text>
          <View style={s.goalsBody}>{children}</View>
        </View>
      )}
    </View>
  )
}

function getStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border,
    },
    slim: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    mast: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 18, paddingBottom: 18, paddingHorizontal: 16, gap: 12 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 0.9, color: colors.textSecondary, textTransform: 'uppercase' },
    slimTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, marginTop: 4 },
    rule: { height: 2, backgroundColor: colors.textPrimary, marginTop: 10, marginBottom: 12, opacity: 0.85 },
    headline: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
    nextUp: { fontFamily: fonts.sans, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },
    chev: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.tabFill, flexShrink: 0,
    },
    perforation: { marginHorizontal: 16, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.divider },
    gridRow: { flexDirection: 'row' },
    gridRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    cell: { flex: 1, paddingVertical: 16, paddingHorizontal: 14, minHeight: 78 },
    cellBorderRight: { borderRightWidth: 1, borderRightColor: colors.divider },
    cellHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    cellLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 1 },
    cellValue: { fontFamily: fonts.serif, fontSize: 21, color: colors.textPrimary },
    cellCaption: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSecondary, marginTop: 3 },
    goalsHead: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 20,
      borderTopWidth: 1, borderTopColor: colors.divider,
    },
    goalsTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, flex: 1 },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17,
      borderWidth: 1, borderColor: colors.border,
    },
    editText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
    goalsHint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.textSecondary, paddingHorizontal: 16, marginTop: 6 },
    goalsBody: { paddingBottom: 18, paddingTop: 4 },
  })
}
