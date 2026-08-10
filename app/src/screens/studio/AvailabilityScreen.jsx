import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, Minus, Plus, Sunrise, AlertTriangle, Phone,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

// Set true locally to preview the Ghost Handler welfare-check state.
// This stays off by default, it's a conditional state driven by missed
// check-in data once that tracking exists server-side, not something to
// show every Handler by default.
const DEMO_SHOW_GHOST_WARNING = false

// Platform is closed Sunday, so the weekly template only covers Monday to
// Saturday.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

function TimeStepper({ label, valueIdx, onChange }) {
  function step(dir) {
    const next = Math.min(TIME_SLOTS.length - 1, Math.max(0, valueIdx + dir))
    onChange(next)
  }
  return (
    <View style={styles.timeStepper}>
      <Text style={styles.timeStepperLabel}>{label}</Text>
      <View style={styles.timeStepperRow}>
        <TouchableOpacity style={styles.timeArrowBtn} activeOpacity={0.7} onPress={() => step(-1)}>
          <ChevronLeft size={14} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.timeValue}>{TIME_SLOTS[valueIdx]}</Text>
        <TouchableOpacity style={styles.timeArrowBtn} activeOpacity={0.7} onPress={() => step(1)}>
          <ChevronRight size={14} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function DayRow({ day, state, onChange }) {
  function update(patch) { onChange({ ...state, ...patch }) }

  return (
    <Card style={styles.dayCard}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName}>{day}</Text>
        <TouchableOpacity
          style={[styles.toggle, state.available && styles.toggleOn]}
          activeOpacity={0.8}
          onPress={() => update({ available: !state.available })}
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
              >
                <Minus size={13} color={colors.navy} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{state.maxTickets}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => update({ maxTickets: Math.min(12, state.maxTickets + 1) })}
              >
                <Plus size={13} color={colors.navy} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Card>
  )
}

export default function AvailabilityScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  const [weekTemplate, setWeekTemplate] = useState(() =>
    Object.fromEntries(DAYS.map(d => [d, makeDefaultDayState()])))

  const [rotaOptIn, setRotaOptIn] = useState(false)
  const [clockedIn, setClockedIn] = useState(false)

  // Demo count of currently-active tickets, used only for the clock-out
  // confirmation copy below.
  const activeTicketCount = 2

  function updateDay(day, next) {
    setWeekTemplate(prev => ({ ...prev, [day]: next }))
  }

  function handleClockToggle() {
    if (clockedIn && activeTicketCount > 0) {
      Alert.alert(
        'Clock Out',
        `You have ${activeTicketCount} active tickets. Clocking out will return these to the queue. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', style: 'destructive', onPress: () => setClockedIn(false) },
        ],
      )
      return
    }
    setClockedIn(v => !v)
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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

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
                onPress={() => { /* TODO: wire to Operations contact flow (call or message) */ }}
              >
                <Phone size={12} color={colors.navy} />
                <Text style={styles.ghostBtnText}>Contact Operations</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Clock In / Clock Out */}
        <Text style={styles.sectionEyebrow}>CLOCK IN / CLOCK OUT</Text>
        <Card style={styles.clockCard}>
          <TouchableOpacity
            style={[styles.clockBtn, clockedIn ? styles.clockBtnOn : styles.clockBtnOff]}
            activeOpacity={0.85}
            onPress={handleClockToggle}
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
              <Sunrise size={16} color={colors.navy} />
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
              onPress={() => setRotaOptIn(v => !v)}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginBottom: 8 },
  headerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 19 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 8, marginTop: spacing.lg,
  },
  sectionCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: -4, marginBottom: 4, lineHeight: 17 },

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
    alignSelf: 'flex-start', backgroundColor: colors.white,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  ghostBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  // Clock in/out
  clockCard: { alignItems: 'center' },
  clockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 14,
    marginBottom: 10,
  },
  clockBtnOn: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC' },
  clockBtnOff: { backgroundColor: colors.cream, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)' },
  clockDot: { width: 9, height: 9, borderRadius: 4.5 },
  clockBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.muted },
  clockBtnTextOn: { color: '#15803D' },
  clockHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },

  // Rota
  rotaCard: {},
  rotaTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rotaIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rotaTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 4 },
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
  toggleOn: { backgroundColor: colors.navy },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleKnobOn: { marginLeft: 18 },

  // Day rows
  dayCard: { padding: 16 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  dayDetails: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },

  timeStepper: { flex: 1 },
  timeStepperLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 6 },
  timeStepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cream, borderRadius: radius.button,
    paddingHorizontal: 8, paddingVertical: 8,
  },
  timeArrowBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  timeValue: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14,
  },
  stepperLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, flex: 1, marginRight: 8 },
  stepperControl: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  stepperBtn: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, minWidth: 14, textAlign: 'center' },
})
