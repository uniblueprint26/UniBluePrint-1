import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import {
  Users, BookOpen, Car, CalendarDays, FileText,
  MessageSquare, BookMarked, Search, ChevronRight,
  MapPin, Lightbulb, Plus,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Campus Connect data ──────────────────────────────────────────────────────
const CAMPUS_FEATURES = [
  {
    icon: Users, color: '#FFF7ED',
    title: 'Campus Board',
    sub: 'Peer notices — sublets, events, lost & found, announcements',
    count: '42 live posts',
  },
  {
    icon: Car, color: '#F0FDF4',
    title: 'Carpooling',
    sub: 'Match with students on your route and split the cost',
    count: '17 active routes',
  },
  {
    icon: CalendarDays, color: '#EFF6FF',
    title: 'Campus Events',
    sub: "What's on across your campus this week",
    count: '8 this week',
  },
  {
    icon: Lightbulb, color: '#FDF4FF',
    title: 'Project Collaboration',
    sub: 'Post project ideas, find teammates, build something real',
    count: '11 open projects',
    isNew: true,
  },
]

const CARPOOL_POSTS = [
  { from: 'Limerick City', to: 'UL Campus', time: 'Mon–Fri · 8:30am', seats: 2, daysLeft: 'Ongoing' },
  { from: 'Cork City Centre', to: 'UCC Main Gate', time: 'Mon/Wed/Fri · 9:00am', seats: 3, daysLeft: 'Ongoing' },
  { from: 'Galway City', to: 'NUIG Concourse', time: 'Daily · 8:00am', seats: 1, daysLeft: 'Ongoing' },
]

const PROJECTS = [
  {
    title: 'Campus Sustainability App',
    tags: ['Mobile Dev', 'UI/UX', 'Sustainability'],
    team: 2, need: 2, university: 'UCD',
  },
  {
    title: 'AI Study Planner — Final Year Project',
    tags: ['AI/ML', 'Python', 'React'],
    team: 1, need: 3, university: 'TCD',
  },
  {
    title: 'Student Budget Tracker',
    tags: ['Finance', 'App Dev', 'Open to All'],
    team: 3, need: 1, university: 'UL',
  },
]

// ─── Course Connect data ──────────────────────────────────────────────────────
const COURSE_FEATURES = [
  { icon: FileText,       color: '#EFF6FF', title: 'Notes Exchange',  sub: 'Upload and access peer notes and module summaries', count: '1,200+ notes' },
  { icon: Users,          color: '#F0FDF4', title: 'Study Groups',    sub: 'Form or join groups by module, topic, or deadline', count: '34 active groups' },
  { icon: MessageSquare,  color: '#FDF4FF', title: 'Module Q&A',      sub: 'Ask and answer course-specific questions', count: '280 answers' },
  { icon: BookMarked,     color: '#FFF7ED', title: 'Exam Resources',  sub: 'Past papers, tips, and revision guides', count: '500+ resources' },
]

const RECENT_NOTES = [
  { module: 'MG4021', title: 'Consumer Behaviour — Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures — Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law — Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting — Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// ─── Campus tab ───────────────────────────────────────────────────────────────
function CampusTab() {
  const [search, setSearch] = useState('')

  return (
    <View>
      {/* University search */}
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

      {/* Feature tiles */}
      <SectionHeader eyebrow="What's Available" title="Campus Features" style={{ marginTop: spacing.lg }} />
      <View style={{ gap: 12 }}>
        {CAMPUS_FEATURES.map(({ icon: Icon, color, title, sub, count, isNew }) => (
          <TouchableOpacity key={title} activeOpacity={0.8}>
            <Card style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <Icon size={20} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  {isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureSub}>{sub}</Text>
                <Text style={styles.featureCount}>{count}</Text>
              </View>
              <ChevronRight size={16} color={colors.light} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Project Collaboration — open projects */}
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
              <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      {/* Carpooling */}
      <SectionHeader eyebrow="Active Routes" title="Carpooling" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 10 }}>
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
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>{post.seats} seat{post.seats !== 1 ? 's' : ''} free</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Post to Campus Board</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Course tab ───────────────────────────────────────────────────────────────
function CourseTab() {
  return (
    <View>
      {/* Stats bar */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>1,200+</Text>
          <Text style={styles.statLabel}>Notes Shared</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>34</Text>
          <Text style={styles.statLabel}>Study Groups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>280</Text>
          <Text style={styles.statLabel}>Q&A Answers</Text>
        </View>
      </View>

      {/* Feature tiles */}
      <SectionHeader eyebrow="Academic Support" title="Course Tools" style={{ marginTop: spacing.lg }} />
      <View style={{ gap: 12 }}>
        {COURSE_FEATURES.map(({ icon: Icon, color, title, sub, count }) => (
          <TouchableOpacity key={title} activeOpacity={0.8}>
            <Card style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <Icon size={20} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSub}>{sub}</Text>
                <Text style={styles.featureCount}>{count}</Text>
              </View>
              <ChevronRight size={16} color={colors.light} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular notes */}
      <SectionHeader eyebrow="Recently Shared" title="Popular Notes" style={{ marginTop: spacing.xl }} />
      <View style={{ gap: 10 }}>
        {RECENT_NOTES.map((note, i) => (
          <Card key={i} style={styles.noteCard}>
            <View style={styles.noteModuleBadge}>
              <Text style={styles.noteModuleText}>{note.module}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteMeta}>
                <Text style={styles.noteMetaText}>{note.university}</Text>
                <Text style={styles.noteMetaText}>·</Text>
                <Text style={styles.noteMetaText}>{note.views} views</Text>
                <Text style={styles.noteMetaText}>·</Text>
                <Text style={styles.noteMetaText}>{note.saved} saves</Text>
              </View>
            </View>
            <ChevronRight size={14} color={colors.light} style={{ alignSelf: 'center' }} />
          </Card>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Share Your Notes</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ConnectScreen() {
  const [tab, setTab] = useState('campus')

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>COMMUNITY</Text>
          <Text style={styles.heroTitle}>Connect</Text>
          <Text style={styles.heroSub}>
            Campus life, academic support, and project collaboration — all in one place.
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'campus' && styles.tabBtnActive]}
            onPress={() => setTab('campus')}
          >
            <Users size={15} color={tab === 'campus' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'campus' && styles.tabBtnTextActive]}>Campus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'course' && styles.tabBtnActive]}
            onPress={() => setTab('course')}
          >
            <BookOpen size={15} color={tab === 'course' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'course' && styles.tabBtnTextActive]}>Course</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {tab === 'campus' ? <CampusTab /> : <CourseTab />}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 48 },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 5,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: radius.button,
  },
  tabBtnActive: { backgroundColor: colors.navy },
  tabBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tabBtnTextActive: { color: colors.white },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },

  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  featureIcon: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  featureSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  featureCount: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy, marginTop: 4, opacity: 0.6 },

  newBadge: { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  projectCard: { padding: 16 },
  projectTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21 },
  projectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  projectTag: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  projectTagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  projectMeta: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  projectMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  joinBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  joinBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  carpoolCard: { padding: 14 },
  carpoolRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carpoolDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  carpoolFrom: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  carpoolTo: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  carpoolFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  carpoolTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  seatBadge: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  seatBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.navy,
    borderRadius: radius.card, padding: spacing.md, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel: { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0,
  },
  noteModuleText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta: { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
