import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User, CalendarDays, Clock, CheckCircle2, Wallet } from 'lucide-react-native'
import ScreenHeader from '../components/ui/ScreenHeader'
import Button from '../components/ui/Button'
import ProUpgradeGate from '../components/ui/ProUpgradeGate'
import CoachCheckoutModal from '../components/elevation/CoachCheckoutModal'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProAccess } from '../hooks/useProAccess'
import { coachSlug } from './ElevationScreen'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { getCoachPricingShape, formatEuro, withIntroCallOffer } from '../lib/coachPricing'
import { fetchActiveIntroCallOffer } from '../lib/introCallOffers'

// ── Book a Coach ─────────────────────────────────────────────────────────────
// A dedicated pick-date -> pick-time -> confirm flow, reachable from a
// coach's profile ("Book a Coach"). No coach has a published hours calendar
// anywhere in the schema yet (see the coach_bookings migration header), so
// the candidate slots offered here are generated client-side — standard
// weekday coaching hours over the next two weeks. What IS real: confirming
// writes an actual row to coach_bookings, which the coach (if they're a
// registered platform user) and Operations/Founder both see and can action,
// exactly like the existing coach_enquiries "quick message" path.
//
// Real payment (task #95's sibling, Elevation): coach pricing isn't a clean
// fixed table like Foundation's 8 services (see lib/coachPricing.js's own
// header for the three shapes it parses out of ElevationScreen's COACHES
// array). For a coach with a `pricelist`, Step 3 below asks which item the
// student is booking; for a coach with a parseable `from` price, that price
// is shown directly. Either way, confirming opens Stripe Checkout
// (CoachCheckoutModal) and the booking is only ever inserted as a real
// 'requested' row once Stripe confirms the charge — same "pay before
// confirmation" shape as Foundation's "pay before Handler review". A coach
// priced `Available on request` (or an unparseable/free pricelist item) has
// nothing to charge, so it keeps the original enquiry-only insert, no
// payment step at all.
//
// Self-service intro call (Desmond-approved, see migration
// 20261015150000_coach_intro_call_offers.sql): a coach can separately opt
// into a self-priced "intro call" offer from their own CoachStudioScreen —
// independent of the static COACHES pricelist above. `effectivePricing`
// below merges that ACTIVE offer (if any) into whatever `pricing` shape
// getCoachPricingShape already produced (see lib/coachPricing.js's
// withIntroCallOffer), as one more selectable item. A free (€0) intro call
// still books directly through the existing free-item path below — never a
// second free-booking code path; a priced one is charged by the same
// create-coach-checkout-session call, just with `intro_call: true` so it
// resolves the amount from coach_intro_call_offers instead of the hand-kept
// COACH_PRICING map.

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
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
  // route.params can legitimately be missing entirely — e.g. navigation
  // restoring a persisted stack after a cold start, or any future caller
  // that navigates here without a coach (today's only call site,
  // CoachProfileScreen, always passes one, but nothing enforces that) — so
  // this falls back rather than crashing on destructuring, same guard every
  // other params-driven screen in this app uses. The `if (!coach)` return
  // below (after the Pro-access check, matching CoachProfileScreen's own
  // ordering) renders a plain "not found" state instead of crashing.
  const { coach } = route.params || {}
  // Defense in depth — CoachProfileScreen already gates the "Book a Coach"
  // CTA that leads here, but this screen is reachable by direct navigation
  // too, so it enforces the same Elevation-is-Pro-only rule itself rather
  // than trusting the caller.
  const { canAccess: hasProAccess, loading: proLoading } = useProAccess()

  const days = useMemo(() => buildUpcomingDays(10), [])
  // getCoachPricingShape already reads coach?.pricelist defensively, so a
  // missing coach just resolves to its 'enquiry' fallback shape here.
  const pricing = useMemo(() => getCoachPricingShape(coach), [coach])
  // The coach's own self-set intro call offer, if they've turned one on
  // (see header comment) — null until fetched, and stays null for the vast
  // majority of coaches who have none active.
  const [introOffer, setIntroOffer] = useState(null)
  useEffect(() => {
    if (!coach) return
    let cancelled = false
    fetchActiveIntroCallOffer(coachSlug(coach.id)).then(offer => {
      if (!cancelled) setIntroOffer(offer)
    })
    return () => { cancelled = true }
  }, [coach?.id])
  const effectivePricing = useMemo(() => withIntroCallOffer(pricing, introOffer), [pricing, introOffer])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const checkoutRef = useRef(null)
  // Holds the id of a 'pending_payment' coach_bookings row across a
  // cancelled-and-retried checkout attempt, so retrying re-uses it instead
  // of inserting a duplicate row for the same selection.
  const pendingBookingIdRef = useRef(null)

  const itemReady = effectivePricing.kind !== 'pricelist' || !!selectedItem
  const ready = !!(selectedDay && selectedTime && itemReady)

  if (proLoading) return null

  // No coach in route.params at all — see the header comment on the coach
  // destructure above for how this can happen.
  if (!coach) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          variant="navy"
          onBack={safeGoBack}
          eyebrow="BOOK A COACH"
          title="Coach not found"
          style={styles.header}
          titleStyle={styles.headerTitle}
        />
      </View>
    )
  }

  if (!hasProAccess) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          variant="navy"
          onBack={safeGoBack}
          eyebrow="BOOK A COACH"
          title={coach.name}
          subtitle={coach.category}
          style={styles.header}
          titleStyle={styles.headerTitle}
        />
        <ProUpgradeGate
          variant="screen"
          title="Elevation Blueprint is a Pro feature"
          message={`Booking requests to ${coach.name} are part of Pro. Upgrade to send one.`}
        />
      </View>
    )
  }

  async function confirm() {
    if (!user?.id) {
      setErrorMsg('Please sign in to book a coach.')
      return
    }
    if (!ready) return
    setSending(true)
    setErrorMsg(null)
    try {
      // Enquiry-only coach ('Available on request', or no parseable price
      // at all, AND no active intro call offer either) — original flow,
      // completely untouched: a plain request, no payment gate.
      if (effectivePricing.kind === 'enquiry') {
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
        return
      }

      const amountCents = effectivePricing.kind === 'pricelist' ? selectedItem.cents : effectivePricing.cents
      const itemLabel = effectivePricing.kind === 'pricelist' ? selectedItem.label : null
      const isIntroCall = effectivePricing.kind === 'pricelist' && !!selectedItem.isIntroCall

      if (!amountCents || amountCents <= 0) {
        // A free pricelist item (e.g. "Initial consultation" — €0, or a
        // coach's own free intro call offer) — nothing to charge, so this
        // books directly too, tagged with which free item was requested.
        const { error } = await supabase.from('coach_bookings').insert({
          user_id: user.id,
          coach_slug: coachSlug(coach.id),
          coach_name: coach.name,
          slot_date: isoDate(selectedDay),
          slot_label: selectedTime,
          message: message.trim() || null,
          pricelist_item: itemLabel,
          amount_cents: 0,
        })
        if (error) throw error
        setSent(true)
        return
      }

      // Real money — insert (or re-use, on a retry) a held booking row,
      // then gate on Stripe actually confirming the charge before it
      // becomes a real 'requested' booking anyone sees — same "pay before
      // confirmation" shape as Foundation's "pay before Handler review".
      let bookingId = pendingBookingIdRef.current
      if (!bookingId) {
        const { data: booking, error: bookingErr } = await supabase
          .from('coach_bookings')
          .insert({
            user_id: user.id,
            coach_slug: coachSlug(coach.id),
            coach_name: coach.name,
            slot_date: isoDate(selectedDay),
            slot_label: selectedTime,
            message: message.trim() || null,
            status: 'pending_payment',
            pricelist_item: itemLabel,
            amount_cents: amountCents,
          })
          .select('id')
          .single()
        if (bookingErr || !booking) throw bookingErr || new Error('Could not start your booking. Please try again.')
        bookingId = booking.id
        pendingBookingIdRef.current = bookingId
      }

      await checkoutRef.current.start({ bookingId, itemLabel, introCall: isIntroCall })
      pendingBookingIdRef.current = null
      setSent(true)
    } catch (err) {
      // If payment was explicitly cancelled, free up the held booking row
      // (the one RLS transition a student can make on it) so a retry with
      // a different selection doesn't leave debris behind.
      if (err?.message === 'Payment cancelled.' && pendingBookingIdRef.current) {
        await supabase.from('coach_bookings').update({ status: 'cancelled' }).eq('id', pendingBookingIdRef.current)
        pendingBookingIdRef.current = null
      }
      setErrorMsg(err?.message || 'Could not send your booking request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          variant="navy"
          onBack={safeGoBack}
          title="Request Sent"
          style={styles.header}
          titleStyle={styles.headerTitle}
        />
        <View style={styles.confirmWrap}>
          <View style={styles.confirmIconWrap}>
            <CheckCircle2 size={48} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.confirmTitle}>Booking request sent</Text>
          <Text style={styles.confirmBody}>
            You've requested {selectedTime} on {selectedDay.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })} with {coach.name}. They'll confirm directly, and we'll notify you the moment they reply — a push notification plus an update in your Notifications either way.
          </Text>
          <Button
            label={`Back to ${coach.name}'s Profile`}
            onPress={() => navigation.navigate('CoachProfile', { coach })}
            variant="primary"
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        eyebrow="BOOK A COACH"
        title={coach.name}
        subtitle={coach.category}
        style={styles.header}
        titleStyle={styles.headerTitle}
      />

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
            <CalendarDays size={14} color={colors.textPrimary} />
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

          {/* Step 2 — time. These are candidate slots, not the coach's real
              calendar (see the header comment) — labelled "preferred time"
              throughout rather than "available time" so this reads as a
              request the coach still has to confirm, not a live booking
              against their actual availability. */}
          <View style={[styles.stepRow, { marginTop: spacing.lg }]}>
            <Clock size={14} color={colors.textPrimary} />
            <Text style={styles.stepLabel}>2. Pick a preferred time</Text>
          </View>
          {!selectedDay ? (
            <Text style={styles.hintText}>Choose a date above to pick a preferred time.</Text>
          ) : (
            <>
              <Text style={styles.hintText}>Preferred times — {coach.name} will confirm what actually works.</Text>
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
            </>
          )}

          {/* Step 3 — what's being booked/paid for. Only shown for a coach
              with a real chargeable price (see lib/coachPricing.js) — an
              "Available on request" coach has nothing to pick here and
              goes straight to the note/confirm step below, unchanged. */}
          {effectivePricing.kind === 'pricelist' && (
            <>
              <View style={[styles.stepRow, { marginTop: spacing.lg }]}>
                <Wallet size={14} color={colors.textPrimary} />
                <Text style={styles.stepLabel}>3. Choose what you're booking</Text>
              </View>
              <Text style={styles.hintText}>Paid items are charged now to confirm the request; free items send straight away.</Text>
              <View style={styles.pricelistWrap}>
                {effectivePricing.items.map(item => {
                  const active = selectedItem?.label === item.label
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.pricelistRow, active && styles.pricelistRowActive]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedItem(item)}
                    >
                      <Text style={[styles.pricelistLabel, active && styles.pricelistTextActive]}>{item.label}</Text>
                      <Text style={[styles.pricelistPrice, active && styles.pricelistTextActive]}>
                        {item.chargeable ? item.priceLabel : (item.cents === 0 ? 'Free' : item.priceLabel || 'Ask')}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}

          {effectivePricing.kind === 'flat' && (
            <View style={styles.flatPriceCard}>
              <Wallet size={14} color={colors.textPrimary} />
              <Text style={styles.flatPriceText}>
                This session is <Text style={styles.summaryStrong}>{formatEuro(effectivePricing.cents)}</Text> — you'll pay when you confirm below.
              </Text>
            </View>
          )}

          {/* Step 4 — confirm */}
          <View style={[styles.stepRow, { marginTop: spacing.lg }]}>
            <Text style={styles.stepLabel}>{effectivePricing.kind === 'pricelist' ? '4' : '3'}. Add a note (optional) and confirm</Text>
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
                </Text>{' '}with {coach.name}
                {effectivePricing.kind === 'pricelist' && selectedItem && (
                  <>{' '}for <Text style={styles.summaryStrong}>{selectedItem.label}</Text></>
                )}
                .
                {effectivePricing.kind === 'pricelist' && selectedItem?.chargeable && (
                  <Text style={styles.summaryStrong}> Paying {selectedItem.priceLabel} now.</Text>
                )}
                {effectivePricing.kind === 'flat' && (
                  <Text style={styles.summaryStrong}> Paying {formatEuro(effectivePricing.cents)} now.</Text>
                )}
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
              ? <ActivityIndicator size="small" color={colors.accentFg} />
              : <Text style={styles.confirmCtaText}>
                  {(effectivePricing.kind === 'flat' || (effectivePricing.kind === 'pricelist' && selectedItem?.chargeable))
                    ? 'Pay & Send Booking Request'
                    : 'Send Booking Request'}
                </Text>
            }
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            {(effectivePricing.kind === 'flat' || (effectivePricing.kind === 'pricelist' && selectedItem?.chargeable))
              ? `Confirming opens secure payment in your browser. Your request to ${coach.name} is sent once that's done — it isn't confirmed until they accept.`
              : `This sends a request, it isn't confirmed until ${coach.name} accepts.`}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <CoachCheckoutModal ref={checkoutRef} />
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.chromeFg },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  coachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 14,
    marginBottom: spacing.xl, ...shadows.card,
  },
  coachAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  coachName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  coachMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  stepLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },

  dayRow: { gap: 8, paddingRight: spacing.md },
  dayChip: {
    width: 58, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  dayChipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  dayChipWeekday: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.muted, textTransform: 'uppercase' },
  dayChipDate:    { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginVertical: 1 },
  dayChipMonth:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted },
  dayChipTextActive: { color: colors.accentFg },

  hintText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  timeChipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  timeChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  timeChipTextActive: { color: colors.accentFg },

  input: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 90, marginTop: 4,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
    ...shadows.card,
  },

  pricelistWrap: { gap: 8 },
  pricelistRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 14, paddingVertical: 12, ...shadows.card,
  },
  pricelistRowActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  pricelistLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary, flex: 1, paddingRight: 10 },
  pricelistPrice: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  pricelistTextActive: { color: colors.accentFg },

  flatPriceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.surface, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, ...shadows.card,
  },
  flatPriceText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 19 },

  summaryCard: {
    backgroundColor: 'rgba(201,162,75,0.10)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(201,162,75,0.35)',
    padding: 14, marginTop: 16,
  },
  summaryText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  summaryStrong: { fontFamily: fonts.sansSemiBold },

  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginTop: 12, textAlign: 'center' },

  confirmCta: {
    backgroundColor: colors.accentBg, borderRadius: radius.button, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  confirmCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  disclaimer: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'center', marginTop: 10 },

  // Confirmation state
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  confirmIconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadows.elevated,
  },
  confirmTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  confirmBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  })
}
