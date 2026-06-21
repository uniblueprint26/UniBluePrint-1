import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { FileText, Target, Users, Heart, Zap, ChevronRight } from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'

const QUICK_ACTIONS = [
  { label: 'Submit CV', icon: FileText },
  { label: 'Book Coach', icon: Target },
  { label: 'Campus Board', icon: Users },
  { label: 'Deals', icon: Heart },
  { label: 'Course Mates', icon: Zap },
]

const PILLARS = [
  { label: 'Foundation Blueprint', sub: 'CVs, essays, cover letters', icon: FileText, color: '#EFF6FF' },
  { label: 'Elevation Blueprint', sub: 'Coaching, mentorship, careers', icon: Target, color: '#F0FDF4' },
  { label: 'Campus Connect', sub: 'Boards, events, carpooling', icon: Users, color: '#FFF7ED' },
  { label: 'Lifestyle Blueprint', sub: 'Deals, mental health, budgeting', icon: Heart, color: '#FDF4FF' },
  { label: 'Course Connect', sub: 'Notes, study groups, modules', icon: Zap, color: '#F0F9FF' },
]

const ACTIVITY = [
  { title: 'CV Review — In Review', time: '2 hours ago', dot: '#F59E0B' },
  { title: 'Cover Letter — Delivered', time: 'Yesterday', dot: colors.success },
  { title: 'Coaching Session Confirmed', time: '2 days ago', dot: colors.navy },
]

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <TopBar notificationCount={3} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingHeading}>Welcome back.</Text>
          <Text style={styles.greetingSub}>University College Dublin · Business</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
              <TouchableOpacity key={label} style={styles.chip} activeOpacity={0.7}>
                <Icon size={14} color={colors.navy} />
                <Text style={styles.chipLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured deals strip */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>Featured Deals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {['Student Beans', 'ASOS 20%', 'Spotify', 'Deliveroo'].map(label => (
              <View key={label} style={styles.dealCard}>
                <View style={styles.dealIcon} />
                <Text style={styles.dealLabel}>{label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pillars grid */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>Services</Text>
          {PILLARS.map(({ label, sub, icon: Icon, color }) => (
            <TouchableOpacity key={label} activeOpacity={0.75} style={{ marginBottom: 10 }}>
              <Card style={styles.pillarCard}>
                <View style={[styles.pillarIcon, { backgroundColor: color }]}>
                  <Icon size={20} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pillarTitle}>{label}</Text>
                  <Text style={styles.pillarSub}>{sub}</Text>
                </View>
                <ChevronRight size={16} color={colors.light} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        <View style={[styles.section, { paddingBottom: 32 }]}>
          <Text style={styles.eyebrow}>Recent Activity</Text>
          <Card>
            {ACTIVITY.map(({ title, time, dot }, i) => (
              <View key={title} style={[styles.activityRow, i < ACTIVITY.length - 1 && styles.activityDivider]}>
                <View style={[styles.activityDot, { backgroundColor: dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{title}</Text>
                  <Text style={styles.activityTime}>{time}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingHeading: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.navy,
  },
  greetingSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chipScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.1)',
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.navy,
  },
  dealCard: {
    width: 96,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  dealIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.cream,
    marginBottom: 8,
  },
  dealLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.navy,
    textAlign: 'center',
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.navy,
  },
  pillarSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  activityDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  activityTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.navy,
  },
  activityTime: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
})
