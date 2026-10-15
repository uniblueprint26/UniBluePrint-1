import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Users, Calendar, Clock, MessageSquare, TrendingUp, UserCog, Save, Wallet, Award, Percent, CreditCard, Receipt,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import ImageUploader from '../../components/ui/ImageUploader'
import PartnerTierBadge from '../../components/ui/PartnerTierBadge'
import FoundingPartnerBadge from '../../components/ui/FoundingPartnerBadge'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Upcoming Sessions and the header stats now read live coach_bookings rows
// (20260907120000) via the coach's own matching_coach_reads_own_coach_bookings
// policy — no more fabricated names/counts shown to a real coach.
//
// Client Activity and Earnings were re-investigated once payments went live
// (#95/#56) to see whether either stub could honestly show a real number
// now.
//
//  - Client Activity: chat_rooms/chat_participants/direct_messages
//    (20260805000000, 20261011224102) support generic 1:1 messaging, but no
//    chat room is ever created from a coach_bookings row and there is no
//    goals/milestone table anywhere — a coach-student conversation existing
//    in the DB would be indistinguishable from any other direct message, so
//    there is no "client activity for this coach" feed to query. Still an
//    honest "not built yet" state rather than a fabricated one.
//
//  - Earnings: real now. The platform collects the student's payment
//    directly for Elevation coach bookings (CoachBookingScreen.jsx,
//    create-coach-checkout-session, coach_payments — 20261015014215), so
//    coach_bookings/coach_payments carry a real amount_cents/paid. What a
//    coach is actually OWED from that is read via get_my_coach_earnings()
//    (20261015144526) — gross collected, plus the coach's computed share
//    IF their Partner Tiering tier + payment option (and, for Option B, a
//    logged negotiated rate) are assigned; otherwise the section shows the
//    gross figure only and says plainly that the split is pending tier
//    assignment, rather than guessing one. See useCoachEarnings() below.
//
//  - Payout account: as of 20261015150039, a resolvable share is also
//    AUTOMATICALLY transferred via Stripe Connect once the coach's Express
//    account is verified — see PayoutAccountSection below, the self-service
//    onboarding surface for that Connect account. TransferHistorySection
//    below now reads coach_payment_transfers directly — RLS already scopes
//    it to the coach's own rows, same shape PayoutAccountSection already
//    relies on for coach_connect_accounts, so no new RPC was needed.
//
// Specialisms are read from the coach's own coach_profiles.specialisation —
// the only specialism field the schema has today (a single free-text value,
// same column homeActivityFeed.js reads for the "New X coach available"
// feed item). A coach sometimes lists more than one, comma- or slash-
// separated, so that's split into individual pills rather than shown as one
// run-on string.
function parseSpecialisms(raw) {
  if (!raw) return []
  return raw
    .split(/[,/]/)
    .map(s => s.trim())
    .filter(Boolean)
}

// ── Edit My Profile ──────────────────────────────────────────────────────────
// Self-serve bio/photo editing for a coach whose coach_profiles row has
// already been linked (coach_slug set) by Operations/Founder. A coach cannot
// create that link themselves — RLS only grants coaches UPDATE on their own
// row, not INSERT — so an unlinked coach sees a clear next step instead of a
// broken form. Every save is picked up by a database trigger that notifies
// Operations/Founder, so self-edit is never silent.
function EditProfileSection({ userId }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [profile, setProfile]   = useState(null) // { coach_slug, bio, photo_url } or null if unlinked
  const [bio, setBio]           = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('coach_profiles')
      .select('coach_slug, bio, photo_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { setLoadError(true); setLoading(false); return }
        setProfile(data || null)
        setBio(data?.bio || '')
        setPhotoUrl(data?.photo_url || null)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [userId])

  async function save() {
    if (!profile?.coach_slug) return
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from('coach_profiles')
        .update({ bio: bio.trim(), photo_url: photoUrl })
        .eq('user_id', userId)
      if (error) throw error
      setSaved(true)
    } catch {
      // Best-effort UI feedback only — ImageUploader/save button already
      // guard the common failure paths (auth, network).
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
        <UserCog size={14} color={colors.textPrimary} />
        <Text style={styles.sectionEyebrow}>EDIT MY PROFILE</Text>
      </View>

      <Card style={styles.editCard}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : !profile ? (
          <Text style={styles.editUnlinkedText}>
            Your coach profile hasn't been linked yet. Contact Operations to get your bio and photo
            connected to your live listing, once that's done you can edit both here anytime.
          </Text>
        ) : (
          <>
            <ImageUploader
              bucket="coach-photos"
              storagePath={`${profile.coach_slug}/photo.jpg`}
              currentUrl={photoUrl}
              onUpload={setPhotoUrl}
              label="Profile Photo"
              size={84}
            />
            <Text style={styles.editLabel}>Bio</Text>
            <TextInput
              style={styles.editInput}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Tell people what you help with and how you work..."
              placeholderTextColor={colors.light}
            />
            <TouchableOpacity
              style={[styles.editSaveBtn, saving && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={save}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.accentFg} />
                : <>
                    <Save size={14} color={colors.accentFg} strokeWidth={2} />
                    <Text style={styles.editSaveBtnText}>Save Changes</Text>
                  </>
              }
            </TouchableOpacity>
            {saved && <Text style={styles.editSavedText}>Saved. Operations has been notified.</Text>}
          </>
        )}
      </Card>
    </>
  )
}

// ── Tier & Terms self-view ───────────────────────────────────────────────
// Read-only self-view of a coach's own Access/Plus/Signature tier,
// Founding Partner Badge, and payment option/negotiated rate, via
// get_my_tier_status() (20261012104351_partner_tiering_framework). Same
// RPC and shape as PartnerPortalScreen's "YOUR TIER & TERMS" section for
// business partners — this is the coach-facing equivalent the framework
// doc calls for ("Lifestyle Blueprint businesses and coaches sit under one
// unified tiering system"). Every real coach today reads back
// tier/payment_option = null (see the Earnings section's own comment
// above) -- that is shown honestly as "Not yet classified" / "Not yet
// set", the same empty state PartnerPortalScreen already uses, not hidden
// just because nothing is populated yet.
function TierTermsSection({ userId }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [tierStatus, setTierStatus] = useState(null)

  function load() {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    supabase.rpc('get_my_tier_status').then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setLoadError('Could not load your tier and terms.')
      } else {
        setTierStatus((data && data[0]) || null)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }
  useEffect(load, [userId])

  return (
    <>
      <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
        <Award size={14} color={colors.textPrimary} />
        <Text style={styles.sectionEyebrow}>YOUR TIER &amp; TERMS</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : loadError ? (
        <View style={styles.tierErrorRow}>
          <Text style={styles.tierErrorText}>{loadError}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.7} style={styles.tierRetryBtn} accessibilityRole="button">
            <Text style={styles.tierRetryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Card>
          <View style={styles.tierBadgeRow}>
            {tierStatus?.tier ? (
              <PartnerTierBadge tier={tierStatus.tier} />
            ) : (
              <Text style={styles.tierUnsetText}>Not yet classified</Text>
            )}
            <FoundingPartnerBadge founding={!!tierStatus?.founding_badge} />
          </View>

          <View style={styles.tierTermRow}>
            <Text style={styles.tierTermLabel}>Payment option</Text>
            <Text style={styles.tierTermValue}>
              {tierStatus?.payment_option === 'negotiated' ? 'Negotiated (Option B)'
                : tierStatus?.payment_option === 'fixed' ? 'Fixed (Option A)'
                : 'Not yet set'}
            </Text>
          </View>

          {tierStatus?.payment_option === 'negotiated' && (
            <View style={styles.tierNegotiatedBox}>
              <View style={styles.tierNegotiatedHeaderRow}>
                <Percent size={13} color={colors.goldDeep} />
                <Text style={styles.tierNegotiatedRate}>
                  {tierStatus?.negotiated_commission_pct != null
                    ? `${tierStatus.negotiated_commission_pct}% commission`
                    : 'Rate on file with Finance'}
                </Text>
              </View>
              {!!tierStatus?.negotiated_rationale && (
                <Text style={styles.tierNegotiatedRationale}>“{tierStatus.negotiated_rationale}”</Text>
              )}
            </View>
          )}
        </Card>
      )}
    </>
  )
}

// ── Intro Call Offer ─────────────────────────────────────────────────────
// Self-service "intro call" / taster-session tier (Desmond-approved — see
// migration 20261015150000_coach_intro_call_offers.sql). Desmond deliberately
// does NOT want this assigned centrally: every coach decides for themself
// whether to offer one and at what price (default OFF). This is a NEW,
// separate offer layered on top of a coach's existing pricelist (set
// centrally in ElevationScreen.jsx's COACHES array) — it never edits or
// replaces anything already there. Same unlinked-profile guard as
// EditProfileSection above — a coach without a linked coach_profiles row
// (coach_slug) has nothing to attach this offer to yet.
function IntroCallOfferSection({ userId }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [coachSlugValue, setCoachSlugValue] = useState(null) // null if unlinked
  const [active, setActive]                 = useState(false)
  const [priceEuros, setPriceEuros]         = useState('0')
  const [durationMinutes, setDurationMinutes] = useState('15')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const { data: profile, error: profileErr } = await supabase
        .from('coach_profiles')
        .select('coach_slug')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      if (profileErr || !profile?.coach_slug) {
        setLoadError(!!profileErr)
        setLoading(false)
        return
      }
      setCoachSlugValue(profile.coach_slug)

      // RLS lets a coach read their own row regardless of active state
      // (coach_manage_own_intro_call_offer) — unlike the authenticated
      // active-only read policy students get, so a coach can see and edit
      // a currently-OFF offer here.
      const { data: offer, error: offerErr } = await supabase
        .from('coach_intro_call_offers')
        .select('active, price_cents, duration_minutes')
        .eq('coach_slug', profile.coach_slug)
        .maybeSingle()
      if (cancelled) return
      if (offerErr) { setLoadError(true); setLoading(false); return }
      if (offer) {
        setActive(offer.active)
        setPriceEuros((offer.price_cents / 100).toFixed(2))
        setDurationMinutes(String(offer.duration_minutes))
      }
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [userId])

  async function save() {
    if (!coachSlugValue) return
    const parsedPrice = Math.round(parseFloat(String(priceEuros).replace(',', '.')) * 100)
    const parsedDuration = parseInt(durationMinutes, 10)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setSaveError('Enter a valid price — 0 or more (0 for a free intro call).')
      return
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      setSaveError('Enter a valid duration in minutes — more than 0.')
      return
    }
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      // Upsert — this is the coach's first save (insert) if they've never
      // set an offer before, or an update on every save after that; RLS's
      // "coach_manage_own_intro_call_offer" with-check covers both since
      // coach_slug always matches this coach's own linked row.
      const { error } = await supabase
        .from('coach_intro_call_offers')
        .upsert({
          coach_slug: coachSlugValue,
          active,
          price_cents: parsedPrice,
          duration_minutes: parsedDuration,
        }, { onConflict: 'coach_slug' })
      if (error) throw error
      setSaved(true)
    } catch (err) {
      setSaveError(err?.message || 'Could not save your intro call offer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
        <Wallet size={14} color={colors.textPrimary} />
        <Text style={styles.sectionEyebrow}>INTRO CALL OFFER</Text>
      </View>

      <Card style={styles.editCard}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : loadError ? (
          <Text style={styles.editUnlinkedText}>Couldn't load your intro call offer right now. Pull to refresh or check back shortly.</Text>
        ) : !coachSlugValue ? (
          <Text style={styles.editUnlinkedText}>
            Your coach profile hasn't been linked yet. Contact Operations to get your bio and listing
            connected, once that's done you can set up your own intro call offer here.
          </Text>
        ) : (
          <>
            <Text style={styles.introCallIntro}>
              Offer students a short intro / taster call at a price you set. Off by default — you decide
              whether to turn it on, what to charge (including free), and how long it runs.
            </Text>

            <View style={styles.introCallToggleRow}>
              <Text style={styles.introCallToggleLabel}>Show this offer to students</Text>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: 'rgba(30,58,95,0.15)', true: colors.accentBg }}
              />
            </View>

            <Text style={styles.editLabel}>Price (EUR — 0 for a free intro call)</Text>
            <TextInput
              style={styles.introCallInput}
              value={priceEuros}
              onChangeText={setPriceEuros}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.light}
            />

            <Text style={styles.editLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.introCallInput}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              placeholder="15"
              placeholderTextColor={colors.light}
            />

            {!!saveError && <Text style={styles.introCallError}>{saveError}</Text>}

            <TouchableOpacity
              style={[styles.editSaveBtn, saving && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={save}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.accentFg} />
                : <>
                    <Save size={14} color={colors.accentFg} strokeWidth={2} />
                    <Text style={styles.editSaveBtnText}>Save Intro Call Offer</Text>
                  </>
              }
            </TouchableOpacity>
            {saved && (
              <Text style={styles.editSavedText}>
                Saved{active ? ' — now visible to students on your profile and booking page.' : ' — currently hidden from students.'}
              </Text>
            )}
          </>
        )}
      </Card>
    </>
  )
}

// Live upcoming-session rows for this coach, plus the two header stats
// derived from the same query — active client count (distinct students with
// a confirmed booking) and this calendar month's confirmed booking count.
function useCoachBookings(userId) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [bookings, setBookings] = useState([])
  const [specialisation, setSpecialisation] = useState(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const { data: profile, error: profileError } = await supabase
        .from('coach_profiles')
        .select('coach_slug, specialisation')
        .eq('user_id', userId)
        .maybeSingle()

      if (cancelled) return
      setSpecialisation(profile?.specialisation || null)
      if (profileError || !profile?.coach_slug) {
        setLoadError(!!profileError)
        setBookings([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('coach_bookings')
        .select('id, user_id, slot_date, slot_label, status')
        .eq('coach_slug', profile.coach_slug)
        .eq('status', 'confirmed')
        .order('slot_date', { ascending: true })

      if (cancelled) return
      if (error) { setLoadError(true); setBookings([]); setLoading(false); return }
      setBookings(data || [])
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [userId])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const upcoming = bookings.filter(b => new Date(b.slot_date) >= today)
  const activeClientCount = new Set(bookings.map(b => b.user_id)).size
  const monthlyBookings = bookings.filter(b => {
    const d = new Date(b.slot_date)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  return { loading, loadError, upcoming, activeClientCount, monthlyBookings, specialisation }
}

// Earnings — reads get_my_coach_earnings() (20261015144526): what students
// have actually paid the platform for this coach (coach_payments, real
// Stripe charges), and the coach's computed share if a tier/payment_option
// is assigned. Resolves strictly to the caller's own linked coach_profiles
// row server-side (SECURITY DEFINER, user_id = auth.uid()) — this screen
// never passes a coach identifier itself.
function useCoachEarnings(userId) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [earnings, setEarnings] = useState(null) // single row, or null (unlinked/no data)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    supabase
      .rpc('get_my_coach_earnings')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { setLoadError(true); setLoading(false); return }
        setEarnings((data && data[0]) || null)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })

    return () => { cancelled = true }
  }, [userId])

  return { loading, loadError, earnings }
}

function formatEuros(cents) {
  return `€${(cents / 100).toFixed(2)}`
}

// ── Payout Account (Stripe Connect) ──────────────────────────────────────
// Self-service onboarding for the coach's Stripe Express Connect account —
// the piece that makes the Earnings section's "your share" figure above an
// actual bank transfer rather than just a computed number (20261015150039).
// Same unlinked-profile guard as the other self-service sections — a coach
// without a linked coach_profiles row has nothing to attach a Connect
// account to yet. Status (not started / pending / verified) is read
// straight from coach_connect_accounts (RLS: a coach reads only their own
// row) — never inferred from anything else, since Stripe is the only real
// source of truth for whether charges_enabled/payouts_enabled are true.
function PayoutAccountSection({ userId }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [unlinked, setUnlinked]   = useState(false)
  const [connectStatus, setConnectStatus] = useState(null) // null = not started, else { charges_enabled, payouts_enabled }
  const [starting, setStarting]   = useState(false)
  const [startError, setStartError] = useState(null)

  function load() {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    setStartError(null)

    async function run() {
      const { data: profile, error: profileErr } = await supabase
        .from('coach_profiles')
        .select('id, coach_slug')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      if (profileErr) { setLoadError(true); setLoading(false); return }
      if (!profile?.coach_slug) { setUnlinked(true); setLoading(false); return }

      const { data: connect, error: connectErr } = await supabase
        .from('coach_connect_accounts')
        .select('charges_enabled, payouts_enabled')
        .eq('coach_profile_id', profile.id)
        .maybeSingle()
      if (cancelled) return
      if (connectErr) { setLoadError(true); setLoading(false); return }
      setConnectStatus(connect || null)
      setLoading(false)
    }

    run().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }
  useEffect(load, [userId])

  const verified = !!(connectStatus?.charges_enabled && connectStatus?.payouts_enabled)
  const started  = !!connectStatus

  async function startOnboarding() {
    setStarting(true)
    setStartError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-coach-connect-account')
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Could not start payout onboarding. Please try again.')
      }
      if (data.already_verified) {
        setConnectStatus({ charges_enabled: true, payouts_enabled: true })
        return
      }
      if (data.url) {
        await Linking.openURL(data.url)
        // Re-check once the coach comes back from Stripe's hosted flow —
        // there's no in-app callback, so a plain reload on return is the
        // simplest honest refresh (same "pull to refresh" shape every other
        // section on this screen already relies on for async state).
        load()
      }
    } catch (err) {
      setStartError(err?.message || 'Could not start payout onboarding. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
        <CreditCard size={14} color={colors.textPrimary} />
        <Text style={styles.sectionEyebrow}>PAYOUT ACCOUNT</Text>
      </View>
      <Card style={styles.editCard}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : loadError ? (
          <Text style={styles.editUnlinkedText}>Couldn't load your payout account status right now. Pull to refresh or check back shortly.</Text>
        ) : unlinked ? (
          <Text style={styles.editUnlinkedText}>
            Your coach profile hasn't been linked yet. Contact Operations first — once that's done you can
            set up automatic payouts here.
          </Text>
        ) : (
          <>
            <View style={styles.payoutStatusRow}>
              <View style={[styles.payoutStatusDot, verified ? styles.payoutStatusDotVerified : started ? styles.payoutStatusDotPending : styles.payoutStatusDotNotStarted]} />
              <Text style={styles.payoutStatusText}>
                {verified ? 'Verified — payouts are active' : started ? 'Pending verification with Stripe' : 'Not started'}
              </Text>
            </View>
            <Text style={styles.introCallIntro}>
              {verified
                ? 'Your Stripe payout account is verified. Your share of every new paid booking is transferred automatically — no further action needed.'
                : started
                ? 'You started Stripe onboarding but it isn\'t fully verified yet. Continue where you left off to finish bank/identity verification with Stripe.'
                : 'Connect a bank account via Stripe so your share of each booking payment can be paid out to you automatically, as soon as it\'s collected.'}
            </Text>
            {!!startError && <Text style={styles.introCallError}>{startError}</Text>}
            {!verified && (
              <TouchableOpacity
                style={[styles.editSaveBtn, starting && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={startOnboarding}
                disabled={starting}
              >
                {starting
                  ? <ActivityIndicator size="small" color={colors.accentFg} />
                  : <>
                      <CreditCard size={14} color={colors.accentFg} strokeWidth={2} />
                      <Text style={styles.editSaveBtnText}>{started ? 'Continue Onboarding' : 'Set Up Payouts'}</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </>
        )}
      </Card>
    </>
  )
}

// ── Payout History (Stripe Connect transfer attempts) ────────────────────
// Reads coach_payment_transfers (20261015150039) directly via the Supabase
// JS client — confirmed live that coach_read_own_payment_transfers already
// scopes every row to this coach's own coach_profile_id the exact same way
// coach_connect_accounts' own RLS does (via coach_profiles.user_id =
// auth.uid()), the shape PayoutAccountSection above already relies on for a
// plain .from() select — so a new SECURITY DEFINER RPC would only add
// surface area for no extra safety here. Every real coach today has zero
// rows (no coach yet has both a resolvable commission split AND a verified
// Connect account, per 20261015150039's own migration header), shown as a
// plain "No payouts yet" empty state rather than an error. pending_reason/
// error_message are translated to plain language — never the raw enum/
// Stripe text — via describeTransferReason() below.
function describeTransferReason(row) {
  if (row.status === 'pending') {
    switch (row.pending_reason) {
      case 'pending_tier_assignment':
        return 'Pending — your Partner Tier / payment option hasn\'t been assigned yet.'
      case 'no_connect_account':
        return 'Pending — you haven\'t set up your payout account yet.'
      case 'connect_account_not_verified':
        return 'Pending — your payout account isn\'t fully verified with Stripe yet.'
      default:
        return 'Pending — this payout hasn\'t been resolved yet.'
    }
  }
  if (row.status === 'failed') {
    return row.error_message
      ? `Failed — ${row.error_message}`
      : 'Failed — Stripe could not complete this transfer.'
  }
  return null
}

function TransferHistorySection({ userId }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [unlinked, setUnlinked]   = useState(false)
  const [transfers, setTransfers] = useState([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const { data: profile, error: profileErr } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      if (profileErr) { setLoadError(true); setLoading(false); return }
      if (!profile?.id) { setUnlinked(true); setLoading(false); return }

      // RLS (coach_read_own_payment_transfers) already restricts this to
      // the caller's own rows regardless of the filter below; the explicit
      // .eq keeps the query's intent legible and matches the shape
      // PayoutAccountSection uses for coach_connect_accounts above.
      const { data, error } = await supabase
        .from('coach_payment_transfers')
        .select('id, gross_amount_cents, status, pending_reason, error_message, attempted_at')
        .eq('coach_profile_id', profile.id)
        .order('attempted_at', { ascending: false })
        .limit(50)
      if (cancelled) return
      if (error) { setLoadError(true); setLoading(false); return }
      setTransfers(data || [])
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [userId])

  return (
    <>
      <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
        <Receipt size={14} color={colors.textPrimary} />
        <Text style={styles.sectionEyebrow}>PAYOUT HISTORY</Text>
      </View>
      {loading ? (
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={colors.textPrimary} />
        </Card>
      ) : loadError ? (
        <Card>
          <Text style={styles.editUnlinkedText}>Couldn't load your payout history right now. Pull to refresh or check back shortly.</Text>
        </Card>
      ) : unlinked ? (
        <Card>
          <Text style={styles.editUnlinkedText}>
            Your coach profile hasn't been linked yet, so there's nothing to show here.
          </Text>
        </Card>
      ) : transfers.length === 0 ? (
        <Card>
          <Text style={styles.editUnlinkedText}>No payouts yet.</Text>
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {transfers.map(t => {
            const reason = describeTransferReason(t)
            return (
              <Card key={t.id} style={styles.transferCard}>
                <View style={styles.transferHeaderRow}>
                  <Text style={styles.transferDate}>
                    {new Date(t.attempted_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={styles.transferAmount}>{formatEuros(t.gross_amount_cents)}</Text>
                </View>
                <View style={styles.transferStatusRow}>
                  <View
                    style={[
                      styles.transferStatusDot,
                      t.status === 'transferred' ? styles.transferStatusDotTransferred
                        : t.status === 'failed' ? styles.transferStatusDotFailed
                        : styles.transferStatusDotPending,
                    ]}
                  />
                  <Text style={styles.transferStatusText}>
                    {t.status === 'transferred' ? 'Transferred' : t.status === 'failed' ? 'Failed' : 'Pending'}
                  </Text>
                </View>
                {!!reason && <Text style={styles.transferReasonText}>{reason}</Text>}
              </Card>
            )
          })}
        </View>
      )}
    </>
  )
}

export default function CoachStudioScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()
  const { loading: bookingsLoading, loadError: bookingsError, upcoming, activeClientCount, monthlyBookings, specialisation } = useCoachBookings(user?.id)
  const { loading: earningsLoading, loadError: earningsError, earnings } = useCoachEarnings(user?.id)
  const specialisms = parseSpecialisms(specialisation)

  function backToMyBlueprint() {
    setPortalMode('personal')
    // React Navigation v7's navigate() pushes rather than pops, which would
    // grow the stack on every switch; popTo returns to the existing HomeMain.
    navigation.popTo('HomeMain')
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        eyebrow="THE ELEVATION STUDIO"
        exitTo={{ label: 'My Blueprint', onPress: backToMyBlueprint }}
        title="Your Workspace"
        style={styles.header}
        titleStyle={styles.headerTitle}
      >
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{activeClientCount}</Text>
            <Text style={styles.headerStatLabel}>Active Clients</Text>
          </View>
          <View style={[styles.headerStat, styles.headerStatBorder]}>
            <Text style={styles.headerStatValue}>{monthlyBookings}</Text>
            <Text style={styles.headerStatLabel}>Bookings This Month</Text>
          </View>
        </View>
      </ScreenHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Upcoming sessions */}
        <View style={styles.sectionRow}>
          <Calendar size={14} color={colors.textPrimary} />
          <Text style={styles.sectionEyebrow}>UPCOMING SESSIONS</Text>
        </View>
        {bookingsLoading ? (
          <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={colors.textPrimary} />
          </Card>
        ) : bookingsError ? (
          <Card>
            <Text style={styles.editUnlinkedText}>Couldn't load your sessions right now. Pull to refresh or check back shortly.</Text>
          </Card>
        ) : upcoming.length === 0 ? (
          <Card>
            <Text style={styles.editUnlinkedText}>No confirmed sessions yet. Booking requests will show here once you confirm them.</Text>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {upcoming.map(sess => (
              <Card key={sess.id} style={styles.sessionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionType}>Confirmed session</Text>
                </View>
                <View style={styles.sessionTimeWrap}>
                  <Text style={styles.sessionDate}>{new Date(sess.slot_date).toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                  <View style={styles.sessionTimeRow}>
                    <Clock size={11} color={colors.muted} />
                    <Text style={styles.sessionTime}>{sess.slot_label}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Client activity — no chat room is ever created from a booking and
            there is no goals/milestone table anywhere, so there is nothing
            real to show that is actually scoped to a coaching relationship.
            Honest placeholder rather than fabricated activity. */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <MessageSquare size={14} color={colors.textPrimary} />
          <Text style={styles.sectionEyebrow}>CLIENT ACTIVITY</Text>
        </View>
        <Card>
          <Text style={styles.editUnlinkedText}>
            Not built yet — there's no messaging or milestone tracking tied to your coaching clients today.
          </Text>
        </Card>

        {/* Earnings — real money now. Gross collected and paid-booking count
            come straight from coach_payments (actual confirmed Stripe
            charges). The coach's share is only ever shown when a tier +
            payment option (and, for Option B, a logged negotiated rate) is
            actually assigned — get_my_coach_earnings() returns null/pending
            otherwise, and this never computes a guessed split. Nothing here
            claims a payout has been made; that is explicitly out of scope
            (no payout-transfer tracking exists in the schema yet) and the
            note below says so. */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <TrendingUp size={14} color={colors.textPrimary} />
          <Text style={styles.sectionEyebrow}>EARNINGS</Text>
        </View>
        <Card style={styles.earningsCard}>
          {earningsLoading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : earningsError ? (
            <Text style={styles.editUnlinkedText}>Couldn't load your earnings right now. Pull to refresh or check back shortly.</Text>
          ) : !earnings ? (
            <Text style={styles.editUnlinkedText}>
              Your coach profile hasn't been linked yet, so there's nothing to show here. Once Operations
              connects your account, any payments students make for your sessions will appear here.
            </Text>
          ) : (
            <>
              <View style={styles.earningsRow}>
                <View style={styles.earningsTile}>
                  <Text style={styles.earningsTileLabel}>Paid Bookings</Text>
                  <Text style={styles.earningsTileValue}>{earnings.paid_bookings_count}</Text>
                </View>
                <View style={[styles.earningsTile, styles.earningsTileBorder]}>
                  <Text style={styles.earningsTileLabel}>Total Collected</Text>
                  <Text style={[styles.earningsTileValue, { fontSize: 20 }]}>{formatEuros(earnings.total_collected_cents)}</Text>
                </View>
              </View>

              {earnings.pending_tier_assignment ? (
                <Text style={styles.earningsNote}>
                  This is the gross amount students have paid for your sessions — collected by UBP via Stripe.
                  Your share isn't shown yet because your Partner Tier / payment option hasn't been assigned.
                  We'll show your exact split here as soon as that's set.
                </Text>
              ) : (
                <>
                  <View style={styles.earningsShareRow}>
                    <Text style={styles.earningsShareLabel}>
                      Your share{earnings.commission_source === 'negotiated' ? ' (negotiated rate)' : ` (${earnings.tier} tier, Option A)`}
                      {' — '}{(100 - Number(earnings.commission_pct)).toFixed(0)}%
                    </Text>
                    <Text style={styles.earningsShareValue}>{formatEuros(earnings.coach_share_cents)}</Text>
                  </View>
                  <Text style={styles.earningsNote}>
                    Once your Payout Account below is verified, your share of each new payment is sent to you
                    automatically via Stripe — this figure reflects every payment students have made for your
                    sessions through UBP, at your current {Number(earnings.commission_pct).toFixed(0)}% platform commission.
                  </Text>
                </>
              )}
            </>
          )}
        </Card>

        {/* Specialisms */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Users size={14} color={colors.textPrimary} />
          <Text style={styles.sectionEyebrow}>YOUR SPECIALISMS</Text>
        </View>
        {specialisms.length === 0 ? (
          <Card>
            <Text style={styles.editUnlinkedText}>No specialism on file yet. Operations can add one to your coach profile.</Text>
          </Card>
        ) : (
          <View style={styles.pillWrap}>
            {specialisms.map(label => (
              <View key={label} style={styles.specialismPill}>
                <Text style={styles.specialismPillText}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tier & Terms — read-only self-view */}
        <TierTermsSection userId={user?.id} />

        {/* Payout Account — Stripe Connect onboarding (automated transfers) */}
        <PayoutAccountSection userId={user?.id} />

        {/* Payout History — past coach_payment_transfers attempts */}
        <TransferHistorySection userId={user?.id} />

        {/* Edit My Profile — self-serve bio + photo */}
        <EditProfileSection userId={user?.id} />

        {/* Intro Call Offer — self-serve toggle + price + duration */}
        <IntroCallOfferSection userId={user?.id} />

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
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.chromeFg, marginBottom: 16 },

  headerStatsRow: { flexDirection: 'row' },
  headerStat: { flex: 1 },
  headerStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(245,240,232,0.15)', paddingLeft: 16, marginLeft: 4 },
  headerStatValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.chromeFg },
  headerStatLabel: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,232,0.6)', marginTop: 2 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  tierBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tierUnsetText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  tierTermRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  tierTermLabel: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted },
  tierTermValue: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary },
  tierNegotiatedBox: { marginTop: 12, padding: 12, borderRadius: radius.button, backgroundColor: '#FFFBEB' },
  tierNegotiatedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierNegotiatedRate: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.goldDeep },
  tierNegotiatedRationale: { fontFamily: fonts.sans, fontSize: 12, color: colors.textPrimary, fontStyle: 'italic', marginTop: 6, lineHeight: 17 },
  tierErrorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button, padding: 14,
  },
  tierErrorText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  tierRetryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(220,38,38,0.1)' },
  tierRetryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.destructive },

  sessionCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  sessionClient: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  sessionType: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  sessionTimeWrap: { alignItems: 'flex-end' },
  sessionDate: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary },
  sessionTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  sessionTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  activityDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textPrimary, marginTop: 5, flexShrink: 0 },
  activityText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  activityName: { fontFamily: fonts.sansSemiBold },
  activityTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  earningsCard: {},
  earningsRow: { flexDirection: 'row', marginBottom: 14 },
  earningsTile: { flex: 1 },
  earningsTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14 },
  earningsTileLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  earningsTileValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  earningsShareRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, marginBottom: 4,
  },
  earningsShareLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary, flex: 1, marginRight: 10 },
  earningsShareValue: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary },
  earningsNote: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)', paddingTop: 12,
  },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialismPill: {
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    ...shadows.card,
  },
  specialismPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary },

  editCard: { alignItems: 'stretch' },
  editUnlinkedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  editLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 18, marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 110,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
  },
  editSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 13,
    marginTop: 14,
  },
  editSaveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },
  editSavedText: {
    fontFamily: fonts.sans, fontSize: 12, color: '#15803D',
    textAlign: 'center', marginTop: 10,
  },

  introCallIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 },
  introCallToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  introCallToggleLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, flex: 1, marginRight: 12,
  },
  introCallInput: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 12, marginTop: 8, marginBottom: 16,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
  },
  introCallError: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginBottom: 10 },

  payoutStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  payoutStatusDot: { width: 8, height: 8, borderRadius: 4 },
  payoutStatusDotVerified: { backgroundColor: '#15803D' },
  payoutStatusDotPending: { backgroundColor: colors.goldDeep },
  payoutStatusDotNotStarted: { backgroundColor: colors.muted },
  payoutStatusText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },

  transferCard: { padding: 14 },
  transferHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transferDate: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textPrimary },
  transferAmount: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary },
  transferStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  transferStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  transferStatusDotTransferred: { backgroundColor: '#15803D' },
  transferStatusDotPending: { backgroundColor: colors.goldDeep },
  transferStatusDotFailed: { backgroundColor: colors.destructive },
  transferStatusText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },
  transferReasonText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 5 },
  })
}
