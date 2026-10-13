import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Users, Calendar, Clock, MessageSquare, TrendingUp, UserCog, Save,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import ImageUploader from '../../components/ui/ImageUploader'
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
// now. Neither can, so both still show an honest "not built yet" state
// rather than a fabricated one:
//
//  - Client Activity: chat_rooms/chat_participants/direct_messages
//    (20260805000000, 20261011224102) support generic 1:1 messaging, but no
//    chat room is ever created from a coach_bookings row and there is no
//    goals/milestone table anywhere — a coach-student conversation existing
//    in the DB would be indistinguishable from any other direct message, so
//    there is no "client activity for this coach" feed to query.
//
//  - Earnings: coach_bookings (20260907120000) has no price/amount column —
//    a confirmed booking alone says nothing about what it was worth.
//    partner_tier_assignments / partner_negotiation_log
//    (20261012100000_partner_tiering_framework) DO support a per-coach
//    negotiated commission %, but it is empty, decision-pending
//    infrastructure today: tier/payment_option default null, and even a
//    populated negotiated_commission_pct would be a percentage of a coach
//    revenue stream that does not exist — Elevation/coaching access is
//    bundled into the flat Pro subscription (create-checkout-session has no
//    per-coach line item at all), so there is no base amount to apply a
//    rate to. Multiplying anything together here would be a fabricated
//    number wearing real-looking decimal places. "Sessions Delivered"
//    stays the headline stat because it IS real; "This Period" earnings
//    says plainly that revenue-share isn't set up instead of showing a
//    dead-end "Coming soon" button that pre-payments copy made okay but
//    now reads as broken.
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
        <UserCog size={14} color={colors.navy} />
        <Text style={styles.sectionEyebrow}>EDIT MY PROFILE</Text>
      </View>

      <Card style={styles.editCard}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} />
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
                ? <ActivityIndicator size="small" color={colors.cream} />
                : <>
                    <Save size={14} color={colors.cream} strokeWidth={2} />
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

export default function CoachStudioScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()
  const { loading: bookingsLoading, loadError: bookingsError, upcoming, activeClientCount, monthlyBookings, specialisation } = useCoachBookings(user?.id)
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
          <Calendar size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>UPCOMING SESSIONS</Text>
        </View>
        {bookingsLoading ? (
          <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={colors.navy} />
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
          <MessageSquare size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>CLIENT ACTIVITY</Text>
        </View>
        <Card>
          <Text style={styles.editUnlinkedText}>
            Not built yet — there's no messaging or milestone tracking tied to your coaching clients today.
          </Text>
        </Card>

        {/* Earnings — Sessions Delivered is real (same monthlyBookings as the
            header stat). "This Period" earnings cannot honestly be a number:
            bookings carry no price, and Elevation access is bundled into the
            flat Pro subscription with no per-coach revenue-share decided or
            populated yet (partner_tier_assignments / partner_negotiation_log
            are empty infrastructure for every real coach today). So this
            says that plainly instead of showing a dead-end button. */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <TrendingUp size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>EARNINGS</Text>
        </View>
        <Card style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsTile}>
              <Text style={styles.earningsTileLabel}>Sessions Delivered</Text>
              <Text style={styles.earningsTileValue}>{monthlyBookings}</Text>
            </View>
            <View style={[styles.earningsTile, styles.earningsTileBorder]}>
              <Text style={styles.earningsTileLabel}>This Period</Text>
              <Text style={[styles.earningsTileValue, { fontSize: 15 }]}>Not tracked yet</Text>
            </View>
          </View>
          <Text style={styles.earningsNote}>
            Elevation coaching is included in Pro membership today — there's no revenue-share or per-coach
            payout set up yet. We'll let you know here once that's decided.
          </Text>
        </Card>

        {/* Specialisms */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Users size={14} color={colors.navy} />
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

        {/* Edit My Profile — self-serve bio + photo */}
        <EditProfileSection userId={user?.id} />

      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginBottom: 16 },

  headerStatsRow: { flexDirection: 'row' },
  headerStat: { flex: 1 },
  headerStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(245,240,232,0.15)', paddingLeft: 16, marginLeft: 4 },
  headerStatValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream },
  headerStatLabel: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,232,0.6)', marginTop: 2 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  sessionCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  sessionClient: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  sessionType: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  sessionTimeWrap: { alignItems: 'flex-end' },
  sessionDate: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
  sessionTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  sessionTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  activityDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.navy, marginTop: 5, flexShrink: 0 },
  activityText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 19 },
  activityName: { fontFamily: fonts.sansSemiBold },
  activityTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  earningsCard: {},
  earningsRow: { flexDirection: 'row', marginBottom: 14 },
  earningsTile: { flex: 1 },
  earningsTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14 },
  earningsTileLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  earningsTileValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  earningsNote: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)', paddingTop: 12,
  },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialismPill: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    ...shadows.card,
  },
  specialismPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  editCard: { alignItems: 'stretch' },
  editUnlinkedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },
  editLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 18, marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 110,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  editSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 13,
    marginTop: 14,
  },
  editSaveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  editSavedText: {
    fontFamily: fonts.sans, fontSize: 12, color: '#15803D',
    textAlign: 'center', marginTop: 10,
  },
  })
}
