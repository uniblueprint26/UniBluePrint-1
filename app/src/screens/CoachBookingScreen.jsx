import { useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, User, CalendarDays, Clock, CheckCircle2 } from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { coachSlug } from './ElevationScreen'

// ── Book a Coach ─────────────────────────────────────────────────────────────
// A dedicated pick-date -> pick-time -> confirm flow, reachable from a
// coach's profile ("Book a Coach"). No coach has a published hours calendar
// anywhere in the schema yet (see the coach_bookings migration header), so
// the candidate slots offered here are generated client-side — standard
// weekday coaching hours over the next two weeks. What IS real: confirming
// writes an actual row to coach_bookings, which the coach (if they're a
// registered platform user) and Operations/Founder both see and can action,
// exactly like the existing coach_enquiries "quick message" path.

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM']
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildUpcomingDays(count = 14) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; days.length < count && i < count + 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    // Skip weekends — most coaches here train/coach clients Mon-Fri.
    if (d.getDay() === 0 || d.getDay() === 6) continue
    days.push(d)
  }
  return days
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CoachBookingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { coach } = route.params

  const days = useMemo(() => buildUpcomingDays(10), [])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const ready = !!(selectedDay && selectedTime)

  async function confirm() {
    if (!user?.id) {
      setErrorMsg('Please sign in to book a coach.')
      return
    }
    if (!ready) return
    setSending(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase.from('coach_bookings').insert({
        user_id: user.id,
        coach_slug: coachSlug(coach.id),
        coach_name: coach.name,
        slot_date: isoDate(selectedDay),
        slot_label: selectedTime,
        message: message.trim() || null,
      })
      if (error) throw error
      setSent(true)
    } catch {
      setErrorMsg('Could not send your booking request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Profile</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Sent</Text>
        </View>
        <View style={styles.confirmWrap}>
          <View style={styles.confirmIconWrap}>
            <CheckCircle2 size={48} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.confirmTitle}>Booking request sent</Text>
          <Text style={styles.confirmBody}>
            You've requested {selectedTime} on {selectedDay.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })} with {coach.name}. They'll confirm directly, and you'll get a notification either way.
          </Text>
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CoachProfile', { coach })}
          >
            <Text style={styles.confirmBtnText}>Back to {coach.name}'s Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={styles.backBtnText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>BOOK A COACH</Text>
        <Text style={styles.headerTitle}>{coach.name}</Text>
        <Text style={styles.headerSub}>{coach.category}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Coach recap */}
          <View style={styles.coachRow}>
            <View style={styles.coachAvatar}>
              <User size={20} color={colors.light} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachMeta}>{coach.from || 'Available on request'}</Text>
            </View>
          </View>

          {/* Step 1 — date */}
          <View style={styles.stepRow}>
            <CalendarDays size={14} color={colors.navy} />
            <Text style={styles.stepLabel}>1. Pick a date</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {days.map(d => {
              const active = selectedDay && isoDate(selectedDay) === isoDate(d)
              return (
                <TouchableOpacity
                  key={isoDate(d)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  activeOpacity={0.85}
                  onPress={() => { setSelectedDay(d); setSelectedTime(null) }}
                >
                  <Text style={[styles.dayChipWeekday, active && styles.dayChipTextActive]}>{WEEKDAY_LABELS[d.getDay()]}</Text>
                  <Text style={[styles.dayChipDate, active && styles.dayChipTextActive]}>{d.getDate()}</Text>
                  <Text style={[styles.dayChipMonth, active && styles.dayChipTextActive]}>{MONTH_LABELS[d.getMonth()]}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Step 2 — time */}
          <View style={[styles.stepRow, { marginTop: spacing.lg }]}>
            <Clock size={14} color={colors.navy} />
            <Text style={styles.stepLabel}>2. Pick a time</Text>
          </View>
          {!selectedDay ? (
            <Text style={styles.hintText}>Choose a date above to see available times.</Text>
          ) : (
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map(t => {
                const active = selectedTime === t
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Step 3 — confirm */}
          <View style={[styles.stepRow, { marginTop: spacing.lg }]}>
            <Text style={styles.stepLabel}>3. Add a note (optional) and confirm</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. What you'd like to focus on this session..."
            placeholderTextColor={colors.light}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {ready && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                Requesting <Text style={styles.summaryStrong}>{selectedTime}</Text> on{' '}
                <Text style={styles.summaryStrong}>
                  {selectedDay.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>{' '}with {coach.name}.
              </Text>
            </View>
          )}

          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          <TouchableOpacity
            style={[styles.confirmCta, (!ready || sending) && { opacity: 0.5 }]}
            activeOpacity={0.85}
            onPress={confirm}
            disabled={!ready || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.cream} />
              : <Text style={styles.confirmCtaText}>Send Booking Request</Text>
            }
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            This sends a request, it isn't confirmed until {coach.name} accepts.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream },
  headerSub:   { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.65)', marginTop: 2 },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  coachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: radius.card, padding: 14,
    marginBottom: spacing.xl, ...shadows.card,
  },
  coachAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  coachName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  coachMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  stepLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  dayRow: { gap: 8, paddingRight: spacing.md },
  dayChip: {
    width: 58, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  dayChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayChipWeekday: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.muted, textTransform: 'uppercase' },
  dayChipDate:    { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, marginVertical: 1 },
  dayChipMonth:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted },
  dayChipTextActive: { color: colors.cream },

  hintText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: colors.white, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  timeChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  timeChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  timeChipTextActive: { color: colors.cream },

  input: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 90, marginTop: 4,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
    ...shadows.card,
  },

  summaryCard: {
    backgroundColor: 'rgba(201,162,75,0.10)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(201,162,75,0.35)',
    padding: 14, marginTop: 16,
  },
  summaryText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },
  summaryStrong: { fontFamily: fonts.sansSemiBold },

  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginTop: 12, textAlign: 'center' },

  confirmCta: {
    backgroundColor: colors.navy, borderRadius: radius.button, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  confirmCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  disclaimer: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'center', marginTop: 10 },

  // Confirmation state
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  confirmIconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadows.elevated,
  },
  confirmTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, textAlign: 'center', marginBottom: 10 },
  confirmBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  confirmBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 24 },
  confirmBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})
