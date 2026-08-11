import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Users, Calendar, Clock, MessageSquare, TrendingUp, ChevronRight, ArrowLeftRight, UserCog, Save,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ImageUploader from '../../components/ui/ImageUploader'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// DEMO DATA — replace with a live Supabase query filtered by coach_id once
// the coaching booking and messaging schema exists.

const DEMO_UPCOMING_SESSIONS = [
  { id: 'sess1', clientFirstName: 'Ruth', sessionType: 'Career Strategy Session', date: 'Mon, 11 Aug', time: '10:00 AM' },
  { id: 'sess2', clientFirstName: 'Cian', sessionType: 'Mock Interview', date: 'Mon, 11 Aug', time: '3:00 PM' },
  { id: 'sess3', clientFirstName: 'Molly', sessionType: 'Goal Setting Check-in', date: 'Wed, 13 Aug', time: '9:30 AM' },
  { id: 'sess4', clientFirstName: 'Tadhg', sessionType: 'Career Strategy Session', date: 'Thu, 14 Aug', time: '1:00 PM' },
]

const DEMO_CLIENT_ACTIVITY = [
  { id: 'act1', clientFirstName: 'Ruth', detail: 'Sent a message ahead of tomorrow\'s session.', time: '2h ago' },
  { id: 'act2', clientFirstName: 'Cian', detail: 'Completed the pre-session goals worksheet.', time: '5h ago' },
  { id: 'act3', clientFirstName: 'Molly', detail: 'Hit a milestone: first interview booked.', time: 'Yesterday' },
  { id: 'act4', clientFirstName: 'Tadhg', detail: 'Left a 5-star review after last session.', time: '2d ago' },
]

const DEMO_SPECIALISMS = ['Career Strategy', 'Interview Coaching', 'Postgraduate Planning', 'Confidence Building']

// ── Edit My Profile ──────────────────────────────────────────────────────────
// Self-serve bio/photo editing for a coach whose coach_profiles row has
// already been linked (coach_slug set) by Operations/Founder. A coach cannot
// create that link themselves — RLS only grants coaches UPDATE on their own
// row, not INSERT — so an unlinked coach sees a clear next step instead of a
// broken form. Every save is picked up by a database trigger that notifies
// Operations/Founder, so self-edit is never silent.
function EditProfileSection({ userId }) {
  const [loading, setLoading]   = useState(true)
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
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data || null)
        setBio(data?.bio || '')
        setPhotoUrl(data?.photo_url || null)
        setLoading(false)
      })
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

export default function CoachStudioScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { setPortalMode, user } = useAuth()

  const activeClientCount = 12
  const monthlyBookings = 9

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerEyebrow}>THE ELEVATION STUDIO</Text>
          <TouchableOpacity style={styles.backLink} activeOpacity={0.75} onPress={backToMyBlueprint}>
            <ArrowLeftRight size={12} color="rgba(245,240,232,0.6)" strokeWidth={2} />
            <Text style={styles.backLinkText}>My Blueprint</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Your Workspace</Text>

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
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Upcoming sessions */}
        <View style={styles.sectionRow}>
          <Calendar size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>UPCOMING SESSIONS</Text>
        </View>
        <View style={{ gap: 8 }}>
          {DEMO_UPCOMING_SESSIONS.map(sess => (
            <Card key={sess.id} style={styles.sessionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionClient}>{sess.clientFirstName}</Text>
                <Text style={styles.sessionType}>{sess.sessionType}</Text>
              </View>
              <View style={styles.sessionTimeWrap}>
                <Text style={styles.sessionDate}>{sess.date}</Text>
                <View style={styles.sessionTimeRow}>
                  <Clock size={11} color={colors.muted} />
                  <Text style={styles.sessionTime}>{sess.time}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Client activity feed */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <MessageSquare size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>CLIENT ACTIVITY</Text>
        </View>
        <Card style={{ padding: 0 }}>
          {DEMO_CLIENT_ACTIVITY.map((item, i, arr) => (
            <View key={item.id} style={[styles.activityRow, i < arr.length - 1 && styles.divider]}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityName}>{item.clientFirstName}</Text> {item.detail}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Earnings */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <TrendingUp size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>EARNINGS</Text>
        </View>
        <Card style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsTile}>
              <Text style={styles.earningsTileLabel}>This Period</Text>
              <Text style={styles.earningsTileValue}>€[AMOUNT]</Text>
            </View>
            <View style={[styles.earningsTile, styles.earningsTileBorder]}>
              <Text style={styles.earningsTileLabel}>Sessions Delivered</Text>
              <Text style={styles.earningsTileValue}>{monthlyBookings}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.earningsCta} activeOpacity={0.8}>
            <Text style={styles.earningsCtaText}>View Full Earnings Breakdown</Text>
            <ChevronRight size={14} color={colors.cream} />
          </TouchableOpacity>
        </Card>

        {/* Specialisms */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Users size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>YOUR SPECIALISMS</Text>
        </View>
        <View style={styles.pillWrap}>
          {DEMO_SPECIALISMS.map(label => (
            <View key={label} style={styles.specialismPill}>
              <Text style={styles.specialismPillText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Edit My Profile — self-serve bio + photo */}
        <EditProfileSection userId={user?.id} />

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
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
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
  earningsRow: { flexDirection: 'row', marginBottom: 16 },
  earningsTile: { flex: 1 },
  earningsTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14 },
  earningsTileLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  earningsTileValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  earningsCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 13,
  },
  earningsCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

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
