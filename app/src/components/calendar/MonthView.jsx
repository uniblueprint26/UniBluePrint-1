import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { DAY_LETTERS, monthMatrix, fmtMonth, sameDay, onDay, ymd, itemColor, withAlpha } from '../../lib/calendar/model'

// Month: a rounded card with one soft tile per day. A day with events is washed
// in the colour of its main calendar and shows up to three colour dots.
// With `picker` set it is a plain month used to choose a date.
export default function MonthView({ month, selected, events = [], customCalendars, onSelect, onMonth, onToday, picker = false }) {
  const { colors, isDark } = useTheme()
  const rows = useMemo(() => monthMatrix(month), [month])
  const today = new Date()

  const byDay = useMemo(() => {
    const map = {}
    if (picker) return map
    rows.flat().forEach(d => {
      const list = events.filter(e => !e.quiet && onDay(e, d))
      if (list.length) map[ymd(d)] = list
    })
    return map
  }, [rows, events, picker])

  return (
    <View style={[s.card, { backgroundColor: picker ? 'transparent' : colors.surface, borderColor: colors.border }, !picker && s.cardBorder]}>
      <View style={s.head}>
        <Text style={[picker ? s.pickTitle : s.title, { color: colors.textPrimary }]} numberOfLines={1}>{fmtMonth(month)}</Text>
        <View style={s.nav}>
          {!picker && onToday ? (
            <TouchableOpacity onPress={onToday} style={[s.todayBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Go to today">
              <Text style={[s.todayText, { color: colors.textPrimary }]}>Today</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => onMonth(-1)} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Previous month">
            <ChevronLeft size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onMonth(1)} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Next month">
            <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.weekRow}>
        {DAY_LETTERS.map((l, i) => (
          <Text key={i} style={[s.weekLetter, { color: colors.textSecondary }]}>{l}</Text>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={s.weekRow}>
          {row.map(d => {
            const inMonth = d.getMonth() === month.getMonth()
            const isToday = sameDay(d, today)
            const isSel = selected && sameDay(d, selected)
            const list = byDay[ymd(d)] || []
            const colours = []
            list.forEach(e => { const c = itemColor(e, customCalendars, isDark); if (!colours.includes(c)) colours.push(c) })
            const wash = colours.length ? withAlpha(colours[0], isDark ? 0.24 : 0.13) : 'transparent'
            return (
              <TouchableOpacity
                key={ymd(d)}
                style={s.cellWrap}
                onPress={() => onSelect(d)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: !!isSel }}
                accessibilityLabel={`${d.getDate()} ${fmtMonth(d)}${isToday ? ', today' : ''}${list.length ? `, ${list.length} ${list.length === 1 ? 'event' : 'events'}` : ''}`}
              >
                <View style={[
                  s.cell,
                  picker ? { height: 42 } : null,
                  { backgroundColor: wash },
                  isSel && { borderColor: colors.textPrimary, borderWidth: 1.5 },
                  !inMonth && { opacity: 0.38 },
                ]}>
                  <View style={[s.num, isToday && { backgroundColor: colors.accentBg }]}>
                    <Text style={[s.numText, { color: isToday ? colors.accentFg : colors.textPrimary, fontFamily: isToday || isSel ? fonts.sansBold : fonts.sansMedium }]}>{d.getDate()}</Text>
                  </View>
                  {!picker && (
                    <View style={s.dots}>
                      {colours.slice(0, 3).map((c, i) => <View key={i} style={[s.dot, { backgroundColor: c }]} />)}
                      {list.length > 3 ? <Text style={[s.more, { color: colors.textSecondary }]}>+</Text> : null}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 10 },
  cardBorder: { borderWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 12 },
  title: { fontFamily: fonts.serif, fontSize: 22, flexShrink: 1, paddingRight: 8 },
  pickTitle: { fontFamily: fonts.serif, fontSize: 18, flexShrink: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  todayBtn: { height: 36, paddingHorizontal: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
  weekRow: { flexDirection: 'row' },
  weekLetter: { flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 12, paddingBottom: 8 },
  cellWrap: { flex: 1, padding: 2 },
  cell: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 14.5 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 7, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { fontFamily: fonts.sansBold, fontSize: 10, lineHeight: 10 },
})
