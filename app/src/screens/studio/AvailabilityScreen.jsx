import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  ChevronLeft, ChevronRight, Minus, Plus, Sunrise, AlertTriangle, Phone,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useHandlerShift } from '../../hooks/useHandlerShift'
import { useHandlerTickets } from '../../hooks/useHandlerTickets'

// Set true locally to preview the Ghost Handler welfare-check state.
// This stays off by default, it's a conditional state driven by missed
// check-in data once that tracking exists server-side, not something to
// show every Handler by default.
const DEMO_SHOW_GHOST_WARNING = false

// Platform is closed Sunday, so the weekly template only covers Monday to
// Saturday.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// public.handler_availability.weekday: 1=Mon .. 6=Sat (platform closed Sunday).
const WEEKDAY_NUMBER = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }

// 30-minute increments from 7am through 9pm.
function buildTimeSlots() {
  const slots = []
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) continue
      const period = h < 12 ? 'AM' : 'PM'
      const hour12 = h % 12 === 0 ? 12 : h % 12
      slots.push(`${hour12}:${m === 0 ? '00' : '30'} ${period}`)
    }
  }
  return slots
}
const TIME_SLOTS = buildTimeSlots()

function makeDefaultDayState() {
  return { available: false, startIdx: 4, finishIdx: 22, maxTickets: 3 } // 9:00 AM – 5:00 PM
}

// TIME_SLOTS[idx] is always exactly 7:00 AM + idx*30min (see buildTimeSlots
// above), so the mapping to/from a Postgres `time` value is just arithmetic
// — no need to search the array.
function idxToTimeSql(idx) {
  const totalMinutes = idx * 30
  const hour = 7 + Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}
function timeSqlToIdx(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number)
  const idx = Math.round(((h - 7) * 60 + m) / 30)
  return Math.min(TIME_SLOTS.length - 1, Math.max(0, idx))
}

function TimeStepper({ label, valueIdx, onChange }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  function step(dir) {
    const next = Math.min(TIME_SLOTS.length - 1, Math.max(0, valueIdx + dir))
    onChange(next)
  }
  return (
    <View style={styles.timeStepper}>
      <Text style={styles.timeStepperLabel}>{label}</Text>
      <View style={styles.timeStepperRow}>
        <TouchableOpacity
          style={styles.timeArrowBtn}
          activeOpacity={0.7}
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label} time`}
        >
          <ChevronLeft size={14} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.timeValue}>{TIME_SLOTS[valueIdx]}</Text>
        <TouchableOpacity
          style={styles.timeArrowBtn}
          activeOpacity={0.7}
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label} time`}
        >
          <ChevronRight size={14} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function DayRow({ day, state, onChange }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  function update(patch) { onChange({ ...state, ...patch }) }

  return (
    <Card style={styles.dayCard}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day}</Text>
        <TouchableOpacity
          style={[styles.toggle, state.available && styles.toggleOn]}
          activeOpacity={0.8}
          onPress={() => update({ available: !state.available })}
          accessibilityRole="button"
          accessibilityLabel={`${state.available ? 'Turn off' : 'Turn on'} availability for ${day}`}
          accessibilityState={{ selected: state.available }}
        >
          <View style={[styles.toggleKnob, state.available && styles.toggleKnobOn]} />
        </TouchableOpacity>
      </View>

      {state.available && (
        <View style={styles.dayDetails}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TimeStepper
              label="Start"
              valueIdx={state.startIdx}
              onChange={idx => update({ startIdx: Math.min(idx, state.finishIdx - 1) })}
            />
            <TimeStepper
              label="Finish"
              valueIdx={state.finishIdx}
              onChange={idx => update({ finishIdx: Math.max(idx, state.startIdx + 1) })}
            />
          </View>

          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Max tickets per session</Text>
            <View style={styles.stepperControl}>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => update({ maxTickets: Math.max(1, state.maxTickets - 1) })}
                accessibilityRole="button"
                accessibilityLabel="Decrease max tickets per session"
              >
                <Minus size={13} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{state.maxTickets}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => update({ maxTickets: Math.min(12, state.maxTickets + 1) })}
                accessibilityRole="button"
                accessibilityLabel="Increase max tickets per session"
              >
                <Plus size={13} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Card>
  )
}

// Loads this Handler's handler_availability rows into the weekTemplate/
// rotaOptIn shape the UI below works with, and exposes the write paths
// (upsert on availability change, update on rota opt-in) used by the
// handlers below. A day's "available" state is not itself a column — a
// handler_availability row existing for that weekday IS "available"; there
// is nothing to flip for an absent day beyond creating or deleting the row.
function useHandlerAvailability(userId) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [weekTemplate, setWeekTemplate] = useState(() =>
    Object.fromEntries(DAYS.map(d => [d, makeDefaultDayState()])))
  const [rotaOptIn, setRotaOptIn] = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoadError(false)
    try {
      const { data, error } = await supabase
        .from('handler_availability')
        .select('weekday, start_time, finish_time, max_tickets, rota_opt_in')
        .eq('handler_id', userId)
      if (error) throw error

      const byWeekday = Object.fromEntries((data || []).map(row => [row.weekday, row]))
      setWeekTemplate(Object.fromEntries(DAYS.map(day => {
        const row = byWeekday[WEEKDAY_NUMBER[day]]
        if (!row) return [day, makeDefaultDayState()]
        return [day, {
          available: true,
          startIdx: timeSqlToIdx(row.start_time),
          finishIdx: timeSqlToIdx(row.finish_time),
          maxTickets: row.max_tickets,
        }]
      })))
      setRotaOptIn(!!byWeekday[WEEKDAY_NUMBER.Monday]?.rota_opt_in)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  // Persists one day's row. `rotaOptIn` is only meaningful on Monday's row
  // (sunday_queue_cap() only reads weekday = 1) — every other day writes
  // rota_opt_in = false, matching the column's default.
  async function saveDay(day, state, currentRotaOptIn) {
    if (!userId) return { error: new Error('Not signed in') }
    if (!state.available) {
      return supabase.from('handler_availability').delete()
        .eq('handler_id', userId).eq('weekday', WEEKDAY_NUMBER[day])
    }
    return supabase.from('handler_availability').upsert({
      handler_id: userId,
      weekday: WEEKDAY_NUMBER[day],
      start_time: idxToTimeSql(state.startIdx),
      finish_time: idxToTimeSql(state.finishIdx),
      max_tickets: state.maxTickets,
      rota_opt_in: day === 'Monday' ? currentRotaOptIn : false,
    }, { onConflict: 'handler_id,weekday' })
  }

  async function updateDay(day, next) {
    setWeekTemplate(prev => ({ ...prev, [day]: next }))
    if (day === 'Monday' && !next.available && rotaOptIn) setRotaOptIn(false)
    const { error } = await saveDay(day, next, day === 'Monday' && !next.available ? false : rotaOptIn)
    if (error) Alert.alert('Couldn’t save', 'That change couldn’t be saved. Pull to refresh and try again.')
  }

  async function updateRotaOptIn(next) {
    if (next && !weekTemplate.Monday.available) {
      Alert.alert('Set Monday availability first', 'Turn on availability for Monday before opting into the Monday rota.')
      return
    }
    setRotaOptIn(next)
    const { error } = await saveDay('Monday', weekTemplate.Monday, next)
    if (error) { setRotaOptIn(!next); Alert.alert('Couldn’t save', 'That change couldn’t be saved. Pull to refresh and try again.') }
  }

  return { loading, loadError, weekTemplate, rotaOptIn, updateDay, updateRotaOptIn, reload: load }
}

export default function AvailabilityScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const {
    loading, loadError, weekTemplate, rotaOptIn, updateDay, updateRotaOptIn, reload: reloadAvailability,
  } = useHandlerAvailability(user?.id)
  const { clockedIn, busy, clockIn, clockOut, reload: reloadShift } = useHandlerShift(user?.id)
  const { tickets, reload: reloadTickets } = useHandlerTickets(user?.id)
  const activeTicketCount = tickets.length

  useFocusEffect(useCallback(() => {
    reloadAvailability(); reloadShift(); reloadTickets()
  }, [reloadAvailability, reloadShift, reloadTickets]))

  async function handleClockToggle() {
    if (clockedIn && activeTicketCount > 0) {
      Alert.alert(
        'Clock Out',
        `You have ${activeTicketCount} active ticket${activeTicketCount !== 1 ? 's' : ''}. They'll stay assigned to you until you clock back in. Are you sure you want to clock out?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', style: 'destructive', onPress: () => clockOut() },
        ],
      )
      return
    }
    const { error } = clockedIn ? await clockOut() : await clockIn()
    if (error) Alert.alert('Something went wrong', 'Could not update your clock-in status. Please try again.')
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>THE BLUEPRINT STUDIO</Text>
        <Text style={styles.headerTitle}>Availability</Text>
        <Text style={styles.headerSub}>
          Set your weekly working template and manage your clock in status.
        </Text>

        <StudioTabBar navigation={navigation} active="Availability" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {loading && (
          <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={colors.textPrimary} />
          </Card>
        )}

        {!loading && loadError && (
          <Card>
            <Text style={styles.editUnlinkedText}>
              Couldn't load your availability right now. Pull to refresh or check back shortly.
            </Text>
          </Card>
        )}

        {/* Ghost Handler welfare-check indicator, conditional, hidden by default */}
        {DEMO_SHOW_GHOST_WARNING && (
          <Card style={styles.ghostCard}>
            <View style={styles.ghostIconWrap}>
              <AlertTriangle size={16} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ghostText}>
                We noticed you've missed a few check-ins. Everything okay? Tap to contact Operations.
              </Text>
              <TouchableOpacity
                style={styles.ghostBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                onPress={() => Linking.openURL(
                  'mailto:uniblueprintoperations@gmail.com?subject=Check-in%20follow-up'
                ).catch(() => Alert.alert(
                  'Contact Operations',
                  'Email uniblueprintoperations@gmail.com directly.',
                ))}
              >
                <Phone size={12} color={colors.textPrimary} />
                <Text style={styles.ghostBtnText}>Contact Operations</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Clock In / Clock Out */}
        <Text style={styles.sectionEyebrow}>CLOCK IN / CLOCK OUT</Text>
        <Card style={styles.clockCard}>
          <TouchableOpacity
            style={[styles.clockBtn, clockedIn ? styles.clockBtnOn : styles.clockBtnOff, busy && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleClockToggle}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ selected: clockedIn }}
          >
            <View style={[styles.clockDot, { backgroundColor: clockedIn ? '#16A34A' : colors.light }]} />
            <Text style={[styles.clockBtnText, clockedIn && styles.clockBtnTextOn]}>
              {clockedIn ? 'Clocked In' : 'Clocked Out'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.clockHint}>
            {clockedIn
              ? `You are visible to the queue. ${activeTicketCount} active ticket${activeTicketCount !== 1 ? 's' : ''}.`
              : 'Clock in to start receiving tickets from the queue.'}
          </Text>
        </Card>

        {/* Monday Morning Rota */}
        <Text style={styles.sectionEyebrow}>MONDAY MORNING ROTA</Text>
        <Card style={styles.rotaCard}>
          <View style={styles.rotaTopRow}>
            <View style={styles.rotaIconWrap}>
              <Sunrise size={16} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rotaTitle}>Opt in to the Monday rota</Text>
              <Text style={styles.rotaCopy}>
                Mandatory 8am check-in for rota Handlers. The Sunday queue is distributed to
                rota Handlers first thing Monday morning.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, rotaOptIn && styles.toggleOn]}
              activeOpacity={0.8}
              onPress={() => updateRotaOptIn(!rotaOptIn)}
              accessibilityRole="button"
              accessibilityLabel={rotaOptIn ? 'Opt out of Monday rota' : 'Opt in to Monday rota'}
              accessibilityState={{ selected: rotaOptIn }}
            >
              <View style={[styles.toggleKnob, rotaOptIn && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
          {rotaOptIn && (
            <View style={styles.rotaNote}>
              <Text style={styles.rotaNoteText}>
                3 missed Monday check-ins in one week automatically removes your rota opt-in.
                You can re-opt-in manually anytime.
              </Text>
            </View>
          )}
        </Card>

        {/* Weekly template */}
        <Text style={styles.sectionEyebrow}>WEEKLY TEMPLATE</Text>
        <Text style={styles.sectionCaption}>
          The platform is closed Sunday, so there is no toggle for it here.
        </Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {DAYS.map(day => (
            <DayRow
              key={day}
              day={day}
              state={weekTemplate[day]}
              onChange={next => updateDay(day, next)}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.chromeFg, marginBottom: 8 },
  headerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 19 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 8, marginTop: spacing.lg,
  },
  sectionCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: -4, marginBottom: 4, lineHeight: 17 },
  editUnlinkedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },

  // Ghost handler
  ghostCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
  },
  ghostIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ghostText: { fontFamily: fonts.sans, fontSize: 13, color: '#92400E', lineHeight: 19, marginBottom: 10 },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: colors.surface,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  ghostBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },

  // Clock in/out
  clockCard: { alignItems: 'center' },
  clockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 14,
    marginBottom: 10,
  },
  clockBtnOn: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC' },
  clockBtnOff: { backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)' },
  clockDot: { width: 9, height: 9, borderRadius: 4.5 },
  clockBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.muted },
  clockBtnTextOn: { color: '#15803D' },
  clockHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },

  // Rota
  rotaCard: {},
  rotaTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rotaIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rotaTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  rotaCopy: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },
  rotaNote: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  rotaNoteText: { fontFamily: fonts.sans, fontSize: 12, color: '#B45309', lineHeight: 18, fontStyle: 'italic' },

  // Toggle switch
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(30,58,95,0.15)',
    padding: 3, flexShrink: 0,
  },
  toggleOn: { backgroundColor: colors.accentBg },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleKnobOn: { marginLeft: 18 },

  // Day rows
  dayCard: { padding: 16 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },

  dayDetails: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },

  timeStepper: { flex: 1 },
  timeStepperLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 6 },
  timeStepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.button,
    paddingHorizontal: 8, paddingVertical: 8,
  },
  timeArrowBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  timeValue: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14,
  },
  stepperLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.textPrimary, flex: 1, marginRight: 8 },
  stepperControl: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  stepperBtn: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, minWidth: 14, textAlign: 'center' },
  })
}
