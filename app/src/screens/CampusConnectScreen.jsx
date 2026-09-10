import { useState, useMemo } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, ChevronLeft, Plus } from 'lucide-react-native'

import FeatureCard from '../components/ui/FeatureCard'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import BoardPickerModal from '../components/campusConnect/BoardPickerModal'
import { CAMPUS_BOARDS } from '../constants/campusBoards'
import { colors, fonts, spacing, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'

// ─── Board showcase (14 boards, one consistent card treatment) ─────────────
// Restyled to match Course Connect's hub layout: one full-width FeatureCard
// per board (headline, sub, live preview posts, Open CTA). Every board —
// Carpooling and Project Collaboration included — now lives in CAMPUS_BOARDS
// and gets the identical card and the identical "tap → BoardDetail" behaviour;
// both used to keep their own bespoke inline sections further down this
// screen (real posted routes/projects, filters, join flow) before they moved
// onto the shared board-engine pattern, matching every other board here.

// Short, punchy headline per board — the FeatureCard equivalent of
// COURSE_FEATURES' headline field (e.g. "Talk to everyone on your course").
// board.tagline (from campusBoards.js, single source of truth) becomes the
// card's `sub` line, so this is the only new copy this restyle adds.
const BOARD_HEADLINES = {
  accommodation: 'Find your next room',
  events: "Never miss what's on this week",
  'study-groups': 'Study with people who get it',
  'lost-found': 'Lost something? Found something?',
  conversations: "Say what's actually on your mind",
  clubs: 'Find your people',
  projects: 'Build something real with your peers',
  problems: 'Get real answers, fast',
  subscriptions: 'Split the cost, keep the perks',
  reviews: 'The honest take on your college',
  suggestions: 'Pitch the fix, campus decides',
  ads: 'Buy, sell, or offer your skills',
  opportunities: 'Find your next opportunity',
  carpool: 'Split the cost of your commute',
}

// Sample posts for each board's mini preview inside its card — every board
// (including Carpooling and Project Collaboration) draws from BOARDS_DATA
// below the same way, now that both are ordinary CAMPUS_BOARDS entries.
function buildBoardTiles(boardsData) {
  return CAMPUS_BOARDS.map(b => {
    const sample = boardsData.find(x => x.key === b.key)?.posts?.map(p => ({ text: p.text, meta: p.time }))
    return {
      key: b.key,
      label: b.title.toUpperCase(),
      emoji: b.icon,
      color: b.color,
      headline: BOARD_HEADLINES[b.key] || b.title,
      sub: b.tagline,
      count: 'Live at launch',
      preview: sample && sample.length ? sample : undefined,
    }
  })
}

// ─── Boards (sample posts feeding buildBoardTiles above) ───────────────────

const BOARDS_DATA = [
  {
    key: 'accommodation', title: 'Accommodation', icon: '🏠', color: '#EFF6FF',
    posts: [
      { text: 'Room available near UCD, €600/month, bills included. Available from August.', time: '2h ago' },
      { text: 'Looking for 2 flatmates in Smithfield. Modern apt, €750pp. DM for info.', time: '5h ago' },
    ],
  },
  {
    key: 'carpool', title: 'Carpooling', icon: '🚗', color: '#F0FDF4',
    posts: [
      { text: 'Limerick City → UL Campus · Mon–Fri · 8:30am', time: '2 seats' },
      { text: 'Cork City → UCC Main Gate · Mon/Wed/Fri · 9:00am', time: '3 seats' },
    ],
  },
  {
    key: 'events', title: 'Campus Events', icon: '🎉', color: '#FDF4FF',
    posts: [
      { text: 'UCD Law Society mixer this Thursday, free entry with student card.', time: '30m ago' },
      { text: 'TCD Drama Society auditions, Monday 7pm, all welcome.', time: '4h ago' },
    ],
  },
  {
    key: 'study-groups', title: 'Study Groups', icon: '📚', color: '#F0F9FF',
    posts: [
      { text: 'FIN301 exam prep group forming, meet Thursdays in the library.', time: '1h ago' },
      { text: 'Looking for two more for a CS2001 study group, hybrid format.', time: '3h ago' },
    ],
  },
  {
    key: 'lost-found', title: 'Lost and Found', icon: '🔍', color: '#FFF7ED',
    posts: [
      { text: 'Found: Blue North Face jacket in Library. Posted to security desk.', time: '6h ago' },
      { text: 'Lost: AirPods Pro near Arts building, please DM if found.', time: '1d ago' },
    ],
  },
  {
    key: 'conversations', title: 'Campus Conversation Boards', icon: '💬', color: '#FDF4FF',
    posts: [
      { text: 'Anyone else find the new library hours a pain?', time: '45m ago' },
      { text: 'Best spots to study on campus that aren’t the library?', time: '3h ago' },
    ],
  },
  {
    key: 'clubs', title: 'Join Clubs and Societies', icon: '🤝', color: '#F0FDF4',
    posts: [
      { text: 'Chess Society looking for new members, all levels welcome!', time: '2h ago' },
      { text: 'St. Vincent de Paul, volunteering every Tuesday evening.', time: '1d ago' },
    ],
  },
  {
    key: 'projects', title: 'Project Collaboration', icon: '💡', color: '#FDF4FF',
    posts: [
      { text: 'Campus Sustainability App · 2 spots open', time: 'Mobile Dev' },
      { text: 'AI Study Planner (Final Year) · 3 spots open', time: 'AI/ML' },
    ],
  },
  {
    key: 'problems', title: 'Problems & Solutions', icon: '🧩', color: '#FEF9C3',
    posts: [
      { text: 'Anyone know how to appeal a CAO change of mind decision? Need help urgently.', time: '1h ago' },
      { text: 'Accommodation deposit taken but landlord gone silent, what are my rights?', time: '3h ago' },
    ],
  },
  {
    key: 'subscriptions', title: 'Shared Subscriptions', icon: '🔗', color: '#F0F9FF',
    posts: [
      { text: 'Sharing Spotify Premium family plan, 2 spots left, €4/month each.', time: '2h ago' },
      { text: 'Netflix account share, 1 spot open, €5/month.', time: '5h ago' },
    ],
  },
  {
    key: 'reviews', title: 'College Reviews', icon: '⭐', color: '#F0FDF4',
    posts: [
      { text: 'UCD Commerce, solid for networking, weak on small group teaching.', time: '4h ago' },
      { text: 'TCD Law, incredibly challenging but library resources are unmatched.', time: '1d ago' },
    ],
  },
  {
    key: 'suggestions', title: 'Campus Suggestions', icon: '💭', color: '#FDF4FF',
    posts: [
      { text: '24hr study room in the Arts block, high demand during exam season.', time: '6h ago' },
      { text: 'More microwaves in the SU, lunch queues are 20 minutes.', time: '1d ago' },
    ],
  },
  {
    key: 'ads', title: 'Student Ads', icon: '📢', color: '#F5F0E8',
    posts: [
      { text: 'Guitar lessons available, €25/session. Beginners welcome.', time: '1h ago' },
      { text: 'Professional CV & cover letter service, €25. Fast turnaround.', time: '2h ago' },
    ],
  },
  {
    key: 'opportunities', title: 'Opportunities', icon: '💼', color: '#FEF9C3',
    posts: [
      { text: 'Part-time barista role, €13.50/hr, 3 mins from UCD. Apply now.', time: '45m ago' },
      { text: 'Marketing intern wanted by Dublin startup, 20 hrs/week, paid.', time: '3h ago' },
    ],
  },
]

export default function CampusConnectScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const institutionShort = user?.user_metadata?.institution_short
  const [search, setSearch] = useState('')

  // ── Post to Board picker ────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false)

  // ── Board showcase (14 boards, one card treatment) ─────────────────────────
  const boardTiles = useMemo(() => buildBoardTiles(BOARDS_DATA), [])
  const filteredBoardTiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return boardTiles
    return boardTiles.filter(t =>
      t.label.toLowerCase().includes(q) || t.headline.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q))
  }, [boardTiles, search])

  function openBoardTile(key) {
    navigation.navigate('BoardDetail', { boardKey: key })
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Scrollable content — header now scrolls with the page, same as every other screen ── */}
      <ScrollView
        style={styles.scrollView}
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
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Home</Text>
            </TouchableOpacity>
            <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
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
              <Text style={styles.heroStatNumber}>14</Text>
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

          {/* Search — filters the board showcase below by name or topic */}
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search boards..."
              placeholderTextColor={colors.light}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── Board showcase: every board, one consistent card ── */}
          <SectionHeader eyebrow="What's Available" title="14 Boards, One Place" style={{ marginTop: spacing.lg }} />
          <Text style={styles.boardsIntro}>
            Live from day one — browse any board straight away, no campus sign-up required. Posting just needs your
            institution on file.
          </Text>
          <View style={{ gap: 14 }}>
            {filteredBoardTiles.map(f => (
              <FeatureCard key={f.key} feature={f} onPress={() => openBoardTile(f.key)} />
            ))}
            {filteredBoardTiles.length === 0 && (
              <Text style={styles.emptyBoardsText}>No boards match “{search}”.</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => setPickerOpen(true)}
          >
            <Plus size={16} color={colors.cream} />
            <Text style={styles.primaryBtnText}>Post to Campus Board</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <BoardPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={board => {
          setPickerOpen(false)
          navigation.navigate('BoardDetail', { boardKey: board.key, openPostForm: true })
        }}
      />
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

  // THE fix for the header floating/overlapping content on native — a
  // ScrollView needs an explicit flex (not just contentContainerStyle) on
  // its own `style`, or native has nothing to size its clipped viewport
  // against. See HomeScreen.jsx's mainScroll comment for the full story.
  scrollView: { flex: 1 },
  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 8,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },
  boardsIntro: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 6, marginBottom: 12, lineHeight: 18 },
  emptyBoardsText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.md },

  // CTA
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: 8, height: 54, marginTop: spacing.lg },
  primaryBtnText:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
