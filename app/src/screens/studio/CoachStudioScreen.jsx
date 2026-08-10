import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Users, Calendar, Clock, MessageSquare, TrendingUp, ChevronRight,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

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

export default function CoachStudioScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  const activeClientCount = 12
  const monthlyBookings = 9

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>THE ELEVATION STUDIO</Text>
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
})
