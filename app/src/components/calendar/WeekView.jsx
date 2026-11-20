import { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import {
  DAY_LETTERS, addDays, sameDay, onDay, fmtWeekRange, layoutOverlaps, itemColor, withAlpha, tintOver, pad, startOfDay, typeMeta, fmtTime,
} from '../../lib/calendar/model'

const SHORT = { exam: 'Exam', goal: 'Goal', reminder: 'Remind', ticket: 'Ticket', room: 'Room', phone: 'Phone' }
// Columns are narrow, so a block shows the short type ("Class", "Exam") and the
// time. The full title opens when it is tapped, and in Day view.
function shortLabel(e) {
  if (e.kind === 'member' || e.kind === 'ics') return e.type === 'personal' ? 'Me' : typeMeta(e.type).label
  return SHORT[e.kind] || 'Event'
}

const HOUR_H = 46
const GUTTER = 34

// Week: seven columns with the date at the top, a strip for all day things
// (a Priority ticket, a goal date), and a time grid. Each block has a colour
// edge and a soft wash of its calendar colour.
export default function WeekView({ weekStart, selected, events = [], customCalendars, onWeek, onPickDay, onOpen }) {
  const { colors, isDark } = useTheme()
  const [width, setWidth] = useState(0)
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const today = new Date()
  const colW = width > 0 ? (width - GUTTER) / 7 : 0

  const visible = useMemo(() => events.filter(e => !e.quiet), [events])
  const perDay = useMemo(() => days.map(d => visible.filter(e => onDay(e, d))), [days, visible])

  // Hours shown: 07:00 to 22:00, stretched if something falls outside.
  const { startH, endH } = useMemo(() => {
    let a = 7, b = 22
    perDay.forEach((list, i) => list.filter(e => !e.allDay).forEach(e => {
      const d0 = startOfDay(days[i])
      const sh = e.start < d0 ? 0 : e.start.getHours()
      const eh = e.end > addDays(d0, 1) ? 24 : Math.ceil(e.end.getHours() + e.end.getMinutes() / 60)
      a = Math.min(a, sh); b = Math.max(b, eh)
    }))
    return { startH: a, endH: Math.min(24, b) }
  }, [perDay, days])
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i)
  const gridH = (endH - startH) * HOUR_H

  const allDayPerDay = perDay.map(list => list.filter(e => e.allDay))
  const maxAllDay = Math.min(2, Math.max(0, ...allDayPerDay.map(l => l.length)))

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onLayout={e => setWidth(e.nativeEvent.layout.width - 16)}>
      <View style={s.head}>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>{fmtWeekRange(weekStart)}</Text>
        <View style={s.nav}>
          <TouchableOpacity onPress={() => onWeek(-1)} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Previous week">
            <ChevronLeft size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onWeek(1)} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Next week">
            <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {colW > 0 && (
        <View style={{ paddingHorizontal: 8 }}>
          {/* date row */}
          <View style={s.dateRow}>
            <View style={{ width: GUTTER }} />
            {days.map((d, i) => {
              const isToday = sameDay(d, today)
              const isSel = selected && sameDay(d, selected)
              return (
                <TouchableOpacity key={i} style={[s.dateCell, { width: colW }]} onPress={() => onPickDay(d)} accessibilityRole="button" accessibilityLabel={`Open ${d.getDate()}`}>
                  <Text style={[s.letter, { color: colors.textSecondary }]}>{DAY_LETTERS[i]}</Text>
                  <View style={[s.dateNum, isToday && { backgroundColor: colors.accentBg }, !isToday && isSel && { borderWidth: 1.5, borderColor: colors.textPrimary }]}>
                    <Text style={[s.dateText, { color: isToday ? colors.accentFg : colors.textPrimary }]}>{d.getDate()}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* all day strip */}
          {maxAllDay > 0 && (
            <View style={[s.allDayRow, { borderColor: colors.border }]}>
              <View style={{ width: GUTTER, justifyContent: 'center' }}>
                <Text style={[s.allDayLabel, { color: colors.textSecondary }]} numberOfLines={2}>All day</Text>
              </View>
              {allDayPerDay.map((list, i) => (
                <View key={i} style={{ width: colW, paddingHorizontal: 1, gap: 2 }}>
                  {list.slice(0, 2).map(e => {
                    const c = itemColor(e, customCalendars, isDark)
                    return (
                      <TouchableOpacity key={e.id} onPress={() => onOpen(e)} accessibilityRole="button" accessibilityLabel={`${e.title}, all day`}
                        style={[s.pill, { backgroundColor: withAlpha(c, isDark ? 0.4 : 0.2), borderColor: c }]}>
                        <Text style={[s.pillText, { color: colors.textPrimary }]} numberOfLines={1}>{e.title}</Text>
                      </TouchableOpacity>
                    )
                  })}
                  {list.length > 2 ? <Text style={[s.pillText, { color: colors.textSecondary, textAlign: 'center' }]}>+{list.length - 2}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {/* grid */}
          <View style={{ height: gridH, marginTop: 6 }}>
            {hours.map((h, i) => (
              <View key={h} style={[s.hourRow, { top: i * HOUR_H, height: HOUR_H }]} pointerEvents="none">
                <Text style={[s.hourLabel, { color: colors.textSecondary, width: GUTTER }]}>{pad(h)}</Text>
                <View style={[s.hourLine, { backgroundColor: colors.border }]} />
              </View>
            ))}
            {days.map((d, i) => {
              const timed = perDay[i].filter(e => !e.allDay)
              const d0 = startOfDay(d).getTime()
              const clipped = timed.map(e => ({
                ...e,
                start: new Date(Math.max(e.start.getTime(), d0)),
                end: new Date(Math.min(Math.max(e.end.getTime(), e.start.getTime() + 20 * 60000), d0 + 86400000)),
                _orig: e,
              }))
              const laid = layoutOverlaps(clipped)
              const isToday = sameDay(d, today)
              return (
                <View key={i} style={{ position: 'absolute', left: GUTTER + i * colW, width: colW, top: 0, height: gridH }}>
                  {i > 0 && <View style={[s.colLine, { backgroundColor: colors.border }]} pointerEvents="none" />}
                  {laid.map(({ ev, col, cols }) => {
                    const topMin = (ev.start.getTime() - d0) / 60000 - startH * 60
                    const durMin = (ev.end.getTime() - ev.start.getTime()) / 60000
                    const c = itemColor(ev._orig, customCalendars, isDark)
                    const w = (colW - 2) / cols
                    return (
                      <TouchableOpacity
                        key={ev.id}
                        onPress={() => onOpen(ev._orig)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`${ev.title}, ${fmtTime(ev._orig.start)}`}
                        style={[s.block, {
                          top: (topMin / 60) * HOUR_H + 1,
                          height: Math.max(22, (durMin / 60) * HOUR_H - 2),
                          left: 1 + col * w, width: w - 1,
                          backgroundColor: tintOver(c, colors.surface, isDark ? 0.42 : 0.2),
                          borderLeftColor: c,
                        }]}
                      >
                        <Text style={[s.blockText, { color: colors.textPrimary }]} numberOfLines={1}>{shortLabel(ev._orig)}</Text>
                        {ev.end - ev.start >= 50 * 60000 ? <Text style={[s.blockTime, { color: colors.textSecondary }]} numberOfLines={1}>{fmtTime(ev._orig.start)}</Text> : null}
                      </TouchableOpacity>
                    )
                  })}
                  {isToday && today.getHours() >= startH && today.getHours() < endH && (
                    <View style={[s.now, { top: ((today.getHours() * 60 + today.getMinutes()) / 60 - startH) * HOUR_H }]} pointerEvents="none" />
                  )}
                </View>
              )
            })}
          </View>
        </View>
      )}
      <View style={{ height: 8 }} />
    </View>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 24, paddingTop: 16, borderWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontFamily: fonts.serif, fontSize: 22, flexShrink: 1 },
  nav: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', paddingBottom: 8 },
  dateCell: { alignItems: 'center', gap: 4 },
  letter: { fontFamily: fonts.sansSemiBold, fontSize: 11.5 },
  dateNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontFamily: fonts.sansBold, fontSize: 14 },
  allDayRow: { flexDirection: 'row', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  allDayLabel: { fontFamily: fonts.sansMedium, fontSize: 9.5 },
  pill: { borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 3, paddingVertical: 3, minHeight: 20, justifyContent: 'center' },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 9.5 },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  hourLabel: { fontFamily: fonts.sans, fontSize: 10.5, marginTop: -6 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth },
  colLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  block: { position: 'absolute', borderRadius: 7, borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 3, overflow: 'hidden' },
  blockText: { fontFamily: fonts.sansBold, fontSize: 10.5, lineHeight: 13 },
  blockTime: { fontFamily: fonts.sans, fontSize: 10, lineHeight: 12 },
  now: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#E5484D', borderRadius: 1 },
})
