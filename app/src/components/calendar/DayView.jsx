import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import {
  addDays, sameDay, onDay, fmtDayShort, fmtTime, layoutOverlaps, itemColor, tintOver, pad, startOfDay,
  KIND_META, typeMeta, calendarName, sourceLine,
} from '../../lib/calendar/model'
import { EventRow } from './Parts'

const HOUR_H = 60
const GUTTER = 44

// A free stretch of at least two hours between 12:00 and 18:00, on a day that
// already has something in it. Real gaps only.
export function freeWindow(dayEvents, day) {
  const timed = dayEvents.filter(e => !e.allDay && !e.quiet)
  if (!timed.length) return null
  const d0 = startOfDay(day).getTime()
  const lo = d0 + 12 * 3600000
  const hi = d0 + 18 * 3600000
  const now = Date.now()
  let cursor = Math.max(lo, sameDay(day, new Date()) ? now : lo)
  const busy = timed.map(e => [e.start.getTime(), e.end.getTime()]).sort((a, b) => a[0] - b[0])
  let best = null
  const consider = (a, b) => { if (b - a >= 2 * 3600000 && (!best || b - a > best[1] - best[0])) best = [a, b] }
  for (const [a, b] of busy) {
    if (b <= cursor) continue
    if (a >= hi) break
    consider(cursor, Math.min(a, hi))
    cursor = Math.max(cursor, b)
  }
  if (cursor < hi) consider(cursor, hi)
  return best ? { start: new Date(best[0]), end: new Date(best[1]) } : null
}

export default function DayView({ day, events = [], customCalendars, onDay: setDay, onOpen, onAdd, recommendation, onDismissRec }) {
  const { colors, isDark } = useTheme()
  const today = new Date()
  const list = useMemo(() => events.filter(e => onDay(e, day)), [events, day])
  const allDay = list.filter(e => e.allDay)
  const reminders = list.filter(e => !e.allDay && e.quiet)
  const timed = list.filter(e => !e.allDay && !e.quiet)

  const { startH, endH } = useMemo(() => {
    let a = 8, b = 19
    const d0 = startOfDay(day).getTime()
    timed.forEach(e => {
      a = Math.min(a, e.start.getTime() < d0 ? 0 : e.start.getHours())
      b = Math.max(b, e.end.getTime() > d0 + 86400000 ? 24 : Math.ceil(e.end.getHours() + e.end.getMinutes() / 60))
    })
    return { startH: a, endH: Math.min(24, b) }
  }, [timed, day])
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i)
  const gridH = (endH - startH) * HOUR_H
  const d0 = startOfDay(day).getTime()
  const laid = layoutOverlaps(timed.map(e => ({
    ...e,
    start: new Date(Math.max(e.start.getTime(), d0)),
    end: new Date(Math.min(Math.max(e.end.getTime(), e.start.getTime() + 30 * 60000), d0 + 86400000)),
    _orig: e,
  })))
  const isToday = sameDay(day, today)

  return (
    <View>
      <View style={s.head}>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>{fmtDayShort(day)}</Text>
        <View style={s.nav}>
          <TouchableOpacity onPress={() => setDay(addDays(day, -1))} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Previous day">
            <ChevronLeft size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDay(addDays(day, 1))} style={[s.navBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Next day">
            <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {recommendation ? (
        <View style={[s.rec, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.recIcon, { backgroundColor: colors.tabFill }]}><Sparkles size={18} color={colors.textPrimary} strokeWidth={1.8} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.recTitle, { color: colors.textPrimary }]}>{`Free from ${fmtTime(recommendation.start)} to ${fmtTime(recommendation.end)}`}</Text>
            <TouchableOpacity onPress={() => onAdd(recommendation.start)} accessibilityRole="button" accessibilityLabel="Plan something in this free time">
              <Text style={[s.recLink, { color: colors.textPrimary }]}>Plan something</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onDismissRec} style={s.recClose} accessibilityRole="button" accessibilityLabel="Dismiss suggestion">
            <X size={16} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ) : null}

      {(allDay.length > 0 || reminders.length > 0) && (
        <View style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[...allDay, ...reminders].map((e, i, arr) => (
            <View key={e.id}>
              <EventRow ev={e} customCalendars={customCalendars} onPress={() => onOpen(e)} />
              {i < arr.length - 1 && <View style={[s.div, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>
      )}

      {timed.length === 0 && allDay.length === 0 && reminders.length === 0 ? (
        <Text style={[s.empty, { color: colors.textSecondary }]}>Nothing on this day.</Text>
      ) : null}

      <View style={[s.grid, { backgroundColor: colors.surface, borderColor: colors.border, height: gridH + 28 }]}>
        <View style={{ height: gridH, marginTop: 14 }}>
          {hours.map((h, i) => (
            <View key={h} style={[s.hourRow, { top: i * HOUR_H }]} pointerEvents="none">
              <Text style={[s.hourLabel, { color: colors.textSecondary, width: GUTTER }]}>{`${pad(h)}:00`}</Text>
              <View style={[s.hourLine, { backgroundColor: colors.border }]} />
            </View>
          ))}
          <View style={{ position: 'absolute', left: GUTTER, right: 12, top: 0, height: gridH }}>
            {laid.map(({ ev, col, cols }) => {
              const o = ev._orig
              const top = ((ev.start.getTime() - d0) / 60000 - startH * 60) / 60 * HOUR_H
              const h = Math.max(44, (ev.end.getTime() - ev.start.getTime()) / 3600000 * HOUR_H - 3)
              const c = itemColor(o, customCalendars, isDark)
              const meta = o.kind === 'member' || o.kind === 'ics' ? typeMeta(o.type) : null
              const Icon = meta ? meta.Icon : KIND_META[o.kind]?.Icon
              const sub = meta ? `${calendarName(o.calendar, customCalendars)} · ${meta.label}` : sourceLine(o)
              return (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => onOpen(o)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${ev.title}, ${fmtTime(o.start)} to ${fmtTime(o.end)}. ${sub}`}
                  style={[s.block, {
                    top: top + 1, height: h,
                    left: `${(col / cols) * 100}%`, width: `${100 / cols - 1}%`,
                    backgroundColor: tintOver(c, colors.surface, isDark ? 0.4 : 0.17),
                    borderLeftColor: c,
                  }]}
                >
                  <View style={s.blockTop}>
                    {Icon ? <Icon size={14} color={colors.textPrimary} strokeWidth={1.9} /> : null}
                    <Text style={[s.blockTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ev.title}</Text>
                  </View>
                  <Text style={[s.blockSub, { color: colors.textSecondary }]} numberOfLines={1}>{sub}</Text>
                </TouchableOpacity>
              )
            })}
            {isToday && today.getHours() >= startH && today.getHours() < endH && (
              <View style={[s.now, { top: ((today.getHours() * 60 + today.getMinutes()) / 60 - startH) * HOUR_H }]} pointerEvents="none">
                <View style={s.nowDot} />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  title: { fontFamily: fonts.serif, fontSize: 26, flexShrink: 1 },
  nav: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rec: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  recIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  recLink: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, textDecorationLine: 'underline', marginTop: 4 },
  recClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, marginBottom: 12 },
  div: { height: StyleSheet.hairlineWidth },
  empty: { fontFamily: fonts.sans, fontSize: 14.5, paddingHorizontal: 4, marginBottom: 12 },
  grid: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingLeft: 12 },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
  hourLabel: { fontFamily: fonts.sans, fontSize: 11.5, marginTop: -7 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth },
  block: { position: 'absolute', borderRadius: 12, borderLeftWidth: 4, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden', justifyContent: 'center' },
  blockTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blockTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, flexShrink: 1 },
  blockSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
  now: { position: 'absolute', left: -4, right: 0, height: 2, backgroundColor: '#E5484D' },
  nowDot: { position: 'absolute', left: -2, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5484D' },
})
