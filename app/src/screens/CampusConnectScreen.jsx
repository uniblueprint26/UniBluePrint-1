import { useState, useRef } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Users, Car, CalendarDays, Lightbulb,
  Search, ChevronLeft, MapPin, AlertCircle, Plus, MessageSquare,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import FeatureCard from '../components/ui/FeatureCard'
import MockContentBanner from '../components/ui/MockContentBanner'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// ─── Feature Products ─────────────────────────────────────────────────────────

const CAMPUS_FEATURES = [
  {
    key: 'boards', label: 'CAMPUS BOARDS', Icon: Users, color: '#FFF7ED',
    headline: 'Find rooms, sell stuff, stay connected',
    sub: 'Eleven community boards covering accommodation, societies, and more.',
    count: 'Live at launch',
    preview: [
      { text: 'Room near UCD, €600/month, bills included. Available from August.', meta: '2h ago' },
      { text: 'Chess Society looking for new members, all levels welcome!', meta: '1h ago' },
    ],
  },
  {
    key: 'carpool', label: 'CARPOOLING', Icon: Car, color: '#F0FDF4',
    headline: 'Split the cost of your commute',
    sub: 'Match with people on your route every day and cut your travel costs every week.',
    count: 'Live at launch',
    preview: [
      { text: 'Limerick City → UL Campus · Mon–Fri · 8:30am', meta: '2 seats' },
      { text: 'Cork City → UCC Main Gate · Mon/Wed/Fri · 9:00am', meta: '3 seats' },
    ],
  },
  {
    key: 'events', label: 'CAMPUS EVENTS', Icon: CalendarDays, color: '#EFF6FF',
    headline: "Never miss what's on this week",
    sub: 'Society events, open days, campus talks, and student-run nights, all in one feed.',
    count: 'Live at launch',
    preview: [
      { text: 'UCD Law Society mixer, Thursday · Free entry with student card', meta: 'Thu' },
      { text: 'TCD Drama Society auditions, Monday 7pm · All welcome', meta: 'Mon' },
    ],
  },
  {
    key: 'projects', label: 'PROJECT COLLABORATION', Icon: Lightbulb, color: '#FDF4FF',
    headline: 'Build something real with your peers',
    sub: 'Post project ideas, find teammates from any campus, and ship something worth showing.',
    count: 'Live at launch', isNew: true,
    preview: [
      { text: 'Campus Sustainability App · UCD · 2 spots open', meta: 'Mobile Dev' },
      { text: 'AI Study Planner (Final Year) · TCD · 3 spots open', meta: 'AI/ML' },
    ],
  },
]

// ─── Boards (11 boards) ───────────────────────────────────────────────────────

const BOARDS_DATA = [
  {
    title: 'Accommodation', icon: '🏠', color: '#EFF6FF', postCount: 14,
    posts: [
      { text: 'Room available near UCD, €600/month, bills included. Available from August.', time: '2h ago' },
      { text: 'Looking for 2 flatmates in Smithfield. Modern apt, €750pp. DM for info.', time: '5h ago' },
    ],
  },
  {
    title: 'Events', icon: '🎉', color: '#FDF4FF', postCount: 8,
    posts: [
      { text: 'UCD Law Society mixer this Thursday, free entry with student card.', time: '30m ago' },
      { text: 'TCD Drama Society auditions, Monday 7pm, all welcome.', time: '4h ago' },
    ],
  },
  {
    title: 'Lost & Found', icon: '🔍', color: '#FFF7ED', postCount: 5,
    posts: [
      { text: 'Found: Blue North Face jacket in Library. Posted to security desk.', time: '6h ago' },
      { text: 'Lost: AirPods Pro near Arts building, please DM if found.', time: '1d ago' },
    ],
  },
  {
    title: 'Societies', icon: '🤝', color: '#F0F9FF', postCount: 9,
    posts: [
      { text: 'Chess Society looking for new members, all levels welcome!', time: '2h ago' },
      { text: 'St. Vincent de Paul UCC, volunteering every Tuesday evening.', time: '1d ago' },
    ],
  },
  {
    title: 'Opportunities', icon: '💼', color: '#FEF9C3', postCount: 12,
    posts: [
      { text: 'Part-time barista role, €13.50/hr, 3 mins from UCD. Apply now.', time: '45m ago' },
      { text: 'Marketing intern wanted by Dublin startup, 20 hrs/week, paid.', time: '3h ago' },
    ],
  },
  {
    title: 'Problems & Solutions', icon: '💡', color: '#FEF9C3', postCount: 6,
    posts: [
      { text: 'Anyone know how to appeal a CAO change of mind decision? Need help urgently.', time: '1h ago' },
      { text: 'Accommodation deposit taken but landlord gone silent, what are my rights?', time: '3h ago' },
    ],
  },
  {
    title: 'Shared Subscriptions', icon: '🔗', color: '#F0F9FF', postCount: 4,
    posts: [
      { text: 'Sharing Spotify Premium family plan, 2 spots left, €4/month each.', time: '2h ago' },
      { text: 'Netflix account share, 1 spot open, €5/month. UCD area.', time: '5h ago' },
    ],
  },
  {
    title: 'Shared Notes', icon: '📝', color: '#EFF6FF', postCount: 9,
    posts: [
      { text: 'MG4021 Week 8 notes, Google Drive link in comments.', time: '30m ago' },
      { text: 'CS2001 Binary Trees summary, anyone want a copy? DM me.', time: '2h ago' },
    ],
  },
  {
    title: 'College Reviews', icon: '⭐', color: '#F0FDF4', postCount: 11,
    posts: [
      { text: 'UCD Commerce, solid for networking, weak on small group teaching. 7/10.', time: '4h ago' },
      { text: 'TCD Law, incredibly challenging but library resources are unmatched.', time: '1d ago' },
    ],
  },
  {
    title: 'Campus Suggestions', icon: '💬', color: '#FDF4FF', postCount: 3,
    posts: [
      { text: '24hr study room in the Arts block, high demand during exam season.', time: '6h ago' },
      { text: 'More microwaves in the SU, lunch queues are 20 minutes.', time: '1d ago' },
    ],
  },
  {
    title: 'Student Ads', icon: '📢', color: '#F5F0E8', postCount: 7,
    posts: [
      { text: 'Guitar lessons available, €25/session, Dublin. Beginners welcome.', time: '1h ago' },
      { text: 'Professional CV & cover letter service, €25. Fast turnaround.', time: '2h ago' },
    ],
  },
]

// ─── Carpooling posts ─────────────────────────────────────────────────────────

const CARPOOL_POSTS = [
  { from: 'Limerick City', to: 'UL Campus', time: 'Mon–Fri · 8:30am', seats: 2 },
  { from: 'Cork City Centre', to: 'UCC Main Gate', time: 'Mon/Wed/Fri · 9:00am', seats: 3 },
  { from: 'Galway City', to: 'NUIG Concourse', time: 'Daily · 8:00am', seats: 1 },
]

// ─── Open projects ────────────────────────────────────────────────────────────

const PROJECTS = [
  { title: 'Campus Sustainability App', tags: ['Mobile Dev', 'UI/UX', 'Sustainability'], team: 2, need: 2, university: 'UCD' },
  { title: 'AI Study Planner, Final Year Project', tags: ['AI/ML', 'Python', 'React'], team: 1, need: 3, university: 'TCD' },
  { title: 'Student Budget Tracker', tags: ['Finance', 'App Dev', 'Open to All'], team: 3, need: 1, university: 'UL' },
]

// ─── Chat context helpers ─────────────────────────────────────────────────────

function boardContextId(title) {
  return 'campus-board-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function carpoolContextId(post) {
  return 'carpool-' + (post.from + '-to-' + post.to)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── Screen ───────────────────────────────────────────────────────────────────

// Feature-card "Open" buttons jump down to the matching section already on
// this screen rather than pushing a new one — Events lives inside the
// Community Boards section (it’s one of the 11 boards), not its own section.
const FEATURE_SECTION = { boards: 'boards', carpool: 'carpool', events: 'boards', projects: 'projects' }

export default function CampusConnectScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const institutionShort = user?.user_metadata?.institution_short
  const [search, setSearch] = useState('')

  const scrollRef = useRef(null)
  const sectionY = useRef({})
  function registerSection(key) {
    return e => { sectionY.current[key] = e.nativeEvent.layout.y }
  }
  function scrollToFeature(featureKey) {
    const sectionKey = FEATURE_SECTION[featureKey]
    const y = sectionY.current[sectionKey]
    if (y != null) scrollRef.current?.scrollTo({ y: y - 12, animated: true })
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Scrollable content — header now scrolls with the page, same as every other screen ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 56 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Integrated header + hero ── */}
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Home</Text>
            </TouchableOpacity>
            <UBPLogo height={30} color={colors.cream} />
            <View style={{ width: 70 }} />
          </View>

          <Text style={styles.heroEyebrow}>CAMPUS CONNECT</Text>
          <Text style={styles.heroTitle}>
            {institutionShort ? `Campus Connect ${institutionShort}` : 'Campus Connect'}
          </Text>
          <Text style={styles.heroSub}>
            From accommodation to study groups, carpooling to project collaboration: your campus community, all in one place.
          </Text>

          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>All</Text>
              <Text style={styles.heroStatLabel}>Irish Institutions{'\n'}Welcome</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>12</Text>
              <Text style={styles.heroStatLabel}>Campus Boards{'\n'}per College</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>Free</Text>
              <Text style={styles.heroStatLabel}>To join{'\n'}your campus</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Find your campus..."
              placeholderTextColor={colors.light}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <SectionHeader eyebrow="What's Available" title="Campus Features" style={{ marginTop: spacing.lg }} />
          <View style={{ gap: 14 }}>
            {CAMPUS_FEATURES.map(f => <FeatureCard key={f.key} feature={f} onPress={() => scrollToFeature(f.key)} />)}
          </View>

          <View onLayout={registerSection('boards')} />
          <SectionHeader eyebrow="Community Boards" title="12 Boards, One Place" style={{ marginTop: spacing.xl }} />
          <MockContentBanner
            title="Example content, live when your campus goes live"
            subtitle="These posts are shown as examples. All 11 boards launch when real students join your campus community."
          />
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {BOARDS_DATA.map(board => (
              <TouchableOpacity
                key={board.title}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ChatRoom', {
                  contextType: 'board',
                  contextId:   boardContextId(board.title),
                  roomName:    board.title,
                  subtitle:    `${board.postCount} posts · Campus board`,
                })}
              >
                <View style={[styles.boardCard, { backgroundColor: board.color }]}>
                  <View style={styles.boardHeader}>
                    <Text style={styles.boardEmoji}>{board.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boardTitle}>{board.title}</Text>
                      <Text style={styles.boardCount}>{board.postCount} posts</Text>
                    </View>
                  </View>
                  {board.posts.map((post, i) => (
                    <View key={i} style={[styles.boardPost, i > 0 && { marginTop: 8 }]}>
                      <Text style={styles.boardPostText} numberOfLines={2}>{post.text}</Text>
                      <Text style={styles.boardPostTime}>{post.time}</Text>
                    </View>
                  ))}
                  <View style={styles.boardChatHint}>
                    <MessageSquare size={11} color="rgba(30,58,95,0.4)" strokeWidth={1.8} />
                    <Text style={styles.boardChatHintText}>Open discussion</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View onLayout={registerSection('carpool')} />
          <SectionHeader eyebrow="Active Routes" title="Carpooling" style={{ marginTop: spacing.xl }} />
          <View style={styles.safetyBanner}>
            <AlertCircle size={15} color="#92400E" />
            <Text style={styles.safetyBannerText}>
              Always verify carpool drivers through your campus student services before travelling.
            </Text>
          </View>
          <View style={{ gap: 10, marginTop: spacing.sm }}>
            {CARPOOL_POSTS.map((post, i) => (
              <Card key={i} style={styles.carpoolCard}>
                <View style={styles.carpoolRouteRow}>
                  <View style={styles.carpoolDot} />
                  <Text style={styles.carpoolFrom}>{post.from}</Text>
                </View>
                <View style={[styles.carpoolRouteRow, { marginTop: 6 }]}>
                  <MapPin size={10} color={colors.navy} />
                  <Text style={styles.carpoolTo}>{post.to}</Text>
                </View>
                <View style={styles.carpoolFooter}>
                  <Text style={styles.carpoolTime}>{post.time}</Text>
                  <View style={styles.carpoolRight}>
                    <View style={styles.seatBadge}>
                      <Text style={styles.seatBadgeText}>{post.seats} seat{post.seats !== 1 ? 's' : ''} free</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.chatBtn}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('ChatRoom', {
                        contextType: 'carpool',
                        contextId:   carpoolContextId(post),
                        roomName:    `${post.from} → ${post.to}`,
                        subtitle:    post.time,
                      })}
                    >
                      <MessageSquare size={12} color={colors.navy} strokeWidth={2} />
                      <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.secondaryBtn, { marginTop: spacing.md }]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Add my carpooling route'))}
          >
            <Plus size={14} color={colors.navy} />
            <Text style={styles.secondaryBtnText}>Add Your Route</Text>
          </TouchableOpacity>

          <View onLayout={registerSection('projects')} />
          <SectionHeader eyebrow="Project Collaboration" title="Open Projects" style={{ marginTop: spacing.xl }} />
          <View style={{ gap: 12 }}>
            {PROJECTS.map((p, i) => (
              <Card key={i} style={styles.projectCard}>
                <Text style={styles.projectTitle}>{p.title}</Text>
                <View style={styles.projectTags}>
                  {p.tags.map(t => (
                    <View key={t} style={styles.projectTag}>
                      <Text style={styles.projectTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.projectFooter}>
                  <View style={styles.projectMeta}>
                    <Text style={styles.projectMetaText}>{p.university}</Text>
                    <Text style={styles.projectMetaText}>·</Text>
                    <Text style={styles.projectMetaText}>{p.team} in team</Text>
                    <Text style={styles.projectMetaText}>·</Text>
                    <Text style={[styles.projectMetaText, { color: colors.navy, fontFamily: fonts.sansSemiBold }]}>
                      {p.need} spot{p.need !== 1 ? 's' : ''} open
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.joinBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`mailto:uniblueprintoperations@gmail.com?subject=${encodeURIComponent(`Join project: ${p.title}`)}`)}
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Post to Campus Board'))}
          >
            <Plus size={16} color={colors.cream} />
            <Text style={styles.primaryBtnText}>Post to Campus Board</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Hero
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, lineHeight: 38, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },
  heroStats:       { flexDirection: 'row', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(245,240,232,0.12)' },
  heroStatItem:    { flex: 1, alignItems: 'flex-start' },
  heroStatNumber:  { fontFamily: fonts.serif, fontSize: 22, color: colors.cream, lineHeight: 26 },
  heroStatLabel:   { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,232,0.5)', marginTop: 3, lineHeight: 15 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(245,240,232,0.12)', marginHorizontal: 16, alignSelf: 'stretch' },

  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 8,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },

  // Boards
  rowScroll:   { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  boardCard:   { width: 228, borderRadius: radius.card, padding: 14, marginRight: 12 },
  boardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  boardEmoji:  { fontSize: 22 },
  boardTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  boardCount:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  boardPost:   { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: 8 },
  boardPostText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy, lineHeight: 16 },
  boardPostTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 3 },

  // Carpooling
  safetyBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(146,64,14,0.2)',
  },
  safetyBannerText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  carpoolCard:      { padding: 14 },
  carpoolRouteRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carpoolDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  carpoolFrom:      { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  carpoolTo:        { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  carpoolFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  carpoolTime:      { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  carpoolRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seatBadge:        { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  seatBadgeText:    { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  // Chat CTA, consistent across board cards and carpool posts
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,58,95,0.08)',
    borderRadius: radius.badge,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  chatBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  // Board card chat hint (inside each board card)
  boardChatHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  boardChatHintText: { fontFamily: fonts.sansMedium, fontSize: 11, color: 'rgba(30,58,95,0.45)' },

  // Projects
  projectCard:     { padding: 16 },
  projectTitle:    { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21 },
  projectTags:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  projectTag:      { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  projectTagText:  { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  projectFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  projectMeta:     { flexDirection: 'row', gap: 5, alignItems: 'center' },
  projectMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  joinBtn:         { backgroundColor: colors.navy, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  joinBtnText:     { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // CTAs
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: 8, height: 54, marginTop: spacing.lg },
  primaryBtnText:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  secondaryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 8, height: 46, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)' },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
