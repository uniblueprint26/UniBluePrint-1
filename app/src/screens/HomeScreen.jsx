import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Bell, User, FileText, TrendingUp, Building2,
  Heart, BookOpen, Compass, Calculator, Megaphone,
  ChevronRight,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { key: 'foundation',  label: 'Foundation',     Icon: FileText,   action: 'blueprint', tab: 'Foundation' },
  { key: 'elevation',   label: 'Elevation',      Icon: TrendingUp, action: 'blueprint', tab: 'Elevation' },
  { key: 'campus',      label: 'Campus',         Icon: Building2,  action: 'connect',   tab: 'Campus' },
  { key: 'lifestyle',   label: 'Lifestyle',      Icon: Heart,      action: 'lifestyle' },
  { key: 'course',      label: 'Course\nConnect', Icon: BookOpen,  action: 'connect',   tab: 'Course' },
  { key: 'compass',     label: 'Compass',        Icon: Compass,    action: 'external',  url: 'https://coursecompass.ie' },
  { key: 'budgeting',   label: 'Budgeting',      Icon: Calculator, action: 'lifestyle' },
  { key: 'adboard',     label: 'Ad Board',       Icon: Megaphone,  action: 'tab',       tabName: 'AdBoard' },
]

const QUICK_CARDS = [
  { label: 'Foundation Blueprint', sub: 'CVs, cover letters, personal statements', Icon: FileText,   bg: '#EFF6FF', action: 'blueprint', tab: 'Foundation' },
  { label: 'Elevation Blueprint',  sub: 'Coaching and mentorship',                 Icon: TrendingUp, bg: '#F0FDF4', action: 'blueprint', tab: 'Elevation' },
  { label: 'Campus Connect',       sub: 'Boards, events, carpooling',              Icon: Building2,  bg: '#FFF7ED', action: 'connect',   tab: 'Campus' },
  { label: 'Course Connect',       sub: 'Notes and study groups',                  Icon: BookOpen,   bg: '#F0F9FF', action: 'connect',   tab: 'Course' },
]

const LIVE_FEED = [
  { text: 'Abdullah submitted a CV for review',         dot: '#F59E0B' },
  { text: 'New coaching session available in Dublin',   dot: colors.navy },
  { text: 'Siofra completed her Foundation Blueprint',  dot: '#16A34A' },
  { text: 'Ciarán joined a Course Connect study group', dot: '#2E6DB4' },
]

const YOUR_ACTIVITY = [
  { title: 'CV Review',         status: 'In Review',  dot: '#F59E0B' },
  { title: 'Cover Letter',      status: 'Delivered',  dot: '#16A34A' },
  { title: 'Coaching Session',  status: 'Confirmed',  dot: colors.navy },
]

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const university  = user?.user_metadata?.university || 'Your University'
  const course      = user?.user_metadata?.course || ''

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  function handleNav(item) {
    if (item.action === 'blueprint') navigation.navigate('Blueprint', { initialTab: item.tab })
    else if (item.action === 'connect')   navigation.navigate('Connect',   { initialTab: item.tab })
    else if (item.action === 'lifestyle') navigation.navigate('Lifestyle')
    else if (item.action === 'tab')       navigation.getParent()?.navigate(item.tabName)
    else if (item.action === 'external')  Linking.openURL(item.url)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.layout}>

        {/* ── LEFT SIDEBAR ── */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoWrap}>
            <UBPLogo height={22} color={colors.cream} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {NAV_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.navItem}
                activeOpacity={0.65}
                onPress={() => handleNav(item)}
              >
                <item.Icon size={20} color="rgba(245,240,232,0.72)" strokeWidth={1.8} />
                <Text style={styles.navLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── MAIN CONTENT ── */}
        <View style={styles.main}>

          {/* Main topbar */}
          <View style={styles.mainTopBar}>
            <View>
              <Text style={styles.topBarGreeting}>{greeting}</Text>
              <Text style={styles.topBarTitle}>Your Blueprint</Text>
            </View>
            <View style={styles.topBarActions}>
              <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
                <Bell size={19} color={colors.navy} strokeWidth={1.8} />
                <View style={styles.badge}><Text style={styles.badgeText}>4</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7}>
                <User size={16} color={colors.navy} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Greeting */}
            <View style={styles.greetBlock}>
              <Text style={styles.greetName}>{displayName}</Text>
              {(university || course) ? (
                <Text style={styles.greetSub}>{university}{course ? ` · ${course}` : ''}</Text>
              ) : null}
            </View>

            {/* Quick-access cards — 2 per row */}
            <Text style={styles.eyebrow}>Quick Access</Text>
            <View style={styles.cardRow}>
              {QUICK_CARDS.slice(0, 2).map(card => (
                <TouchableOpacity
                  key={card.label}
                  style={[styles.quickCard, { backgroundColor: card.bg }]}
                  activeOpacity={0.8}
                  onPress={() => handleNav({ action: card.action, tab: card.tab })}
                >
                  <View style={styles.quickIconWrap}>
                    <card.Icon size={17} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={2}>{card.label}</Text>
                  <Text style={styles.quickSub}>{card.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.cardRow, { marginBottom: 22 }]}>
              {QUICK_CARDS.slice(2).map(card => (
                <TouchableOpacity
                  key={card.label}
                  style={[styles.quickCard, { backgroundColor: card.bg }]}
                  activeOpacity={0.8}
                  onPress={() => handleNav({ action: card.action, tab: card.tab })}
                >
                  <View style={styles.quickIconWrap}>
                    <card.Icon size={17} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={2}>{card.label}</Text>
                  <Text style={styles.quickSub}>{card.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Live Activity */}
            <View style={styles.feedHeaderRow}>
              <Text style={[styles.eyebrow, { marginBottom: 0 }]}>Live Activity</Text>
              <View style={styles.livePulse} />
            </View>
            <Card style={{ padding: 0, marginBottom: 20 }}>
              {LIVE_FEED.map(({ text, dot }, i) => (
                <View
                  key={i}
                  style={[styles.feedRow, i < LIVE_FEED.length - 1 && styles.divider]}
                >
                  <View style={[styles.feedDot, { backgroundColor: dot }]} />
                  <Text style={styles.feedText} numberOfLines={2}>{text}</Text>
                </View>
              ))}
            </Card>

            {/* Your Activity */}
            <Text style={styles.eyebrow}>Your Activity</Text>
            <Card style={{ padding: 0, marginBottom: 8 }}>
              {YOUR_ACTIVITY.map(({ title, status, dot }, i) => (
                <View
                  key={title}
                  style={[styles.feedRow, i < YOUR_ACTIVITY.length - 1 && styles.divider]}
                >
                  <View style={[styles.feedDot, { backgroundColor: dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actTitle}>{title}</Text>
                    <Text style={styles.actStatus}>{status}</Text>
                  </View>
                  <ChevronRight size={13} color={colors.light} />
                </View>
              ))}
            </Card>

          </ScrollView>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.navy },
  layout:  { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 74,
    backgroundColor: colors.navy,
    borderRightWidth: 1,
    borderRightColor: 'rgba(245,240,232,0.09)',
  },
  sidebarLogoWrap: {
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,240,232,0.09)',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
  },
  navLabel: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: 'rgba(245,240,232,0.55)',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Main area
  main: { flex: 1, backgroundColor: colors.cream },
  mainTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  topBarGreeting: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted },
  topBarTitle:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 1 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: { position: 'relative', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 3, right: 3,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 8, color: '#fff' },
  avatarBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.cream,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 14, paddingTop: 16 },

  greetBlock:  { marginBottom: 20 },
  greetName:   { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, lineHeight: 26 },
  greetSub:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3 },

  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Quick-access cards
  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickCard: {
    flex: 1,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.07)',
    minHeight: 110,
  },
  quickIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, lineHeight: 16, marginBottom: 4 },
  quickSub:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, lineHeight: 14 },

  // Feed / activity rows
  feedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  livePulse: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#16A34A', marginTop: -10 },

  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  feedDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  feedText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.navy, lineHeight: 17 },

  actTitle:  { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
  actStatus: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
})
