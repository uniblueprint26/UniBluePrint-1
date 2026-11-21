import { useState, useEffect, useMemo } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Users, MessageSquare, BookMarked, Search, Briefcase, Star,
  GraduationCap, Compass, Globe, Lightbulb,
  PenLine, BookOpenCheck, CalendarDays, Clock, BookOpen,
  ChevronRight, Plus, Heart, TrendingUp,
} from 'lucide-react-native'

import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import IrishFlag from '../components/ui/IrishFlag'
import PulseQuestions from '../components/campusConnect/PulseQuestions'
import { Card, Pill, SectionRow, TileGrid, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { HelpCircle } from 'lucide-react-native'
import ScreenHeader from '../components/ui/ScreenHeader'
import FeatureCard from '../components/ui/FeatureCard'
import MockContentBanner from '../components/ui/MockContentBanner'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import Button from '../components/ui/Button'
import CourseBoardPickerModal from '../components/courseConnect/CourseBoardPickerModal'
import InterestsModal from '../components/profile/InterestsModal'
import { MoodPulse } from '../components/feed/FeedKit'
import LiveRail from '../components/live/LiveRail'
import { fetchMoodPulse, DEFAULT_BUZZ_WINDOW } from '../lib/feed'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { goToHome } from '../navigation/helpers'
import { useUserType } from '../hooks/useUserType'
import { useFoundationEnabled } from '../hooks/useAppFlags'
import { useComingSoonEnabled } from '../constants/comingSoon'
import { useInterests } from '../hooks/useInterests'
import { supabase } from '../lib/supabase'
import {
  USER_TYPE_STUDENT, USER_TYPE_APPRENTICE, USER_TYPE_GAP_YEAR, USER_TYPE_WORKER,
} from '../constants/userTypes'

// ─── Reframe, round 3: interests + real popularity, not stages ─────────────
// Round 2 (the journey_stage system: 4 self-reported "stages", a Your Stage
// banner, a stage-grouped "Journey Match" section) has been REMOVED per the
// founder's direct correction: "its not about stages its about maybe giving
// them an expanded version of interests to pick and even add their own but
// course connect should just show popular content like campus [Connect]."
// That system — the journey_stage column, useJourneyStage(), JourneyStageModal,
// constants/journeyStages.js, and every piece of UI built on it — is gone
// (see 20260915110000_drop_profiles_journey_stage.sql).
//
// What replaces it, concretely:
//  1. A real, expandable interest-tag system (data/interests.js +
//     hooks/useInterests.js, backed by profiles.interests) — predefined tags
//     AND self-typed custom ones, built as shared infrastructure so
//     Directory's upcoming tag filters (Task #12) read the exact same
//     column/hook rather than a Course-Connect-only copy.
//  2. "Popular Right Now" below, ranked by real recent post counts from
//     course_boards_posts — not a designed taxonomy, not fake numbers.
// Both connect people across student/apprentice/gap-year/worker by what's
// actually true of the data (a shared interest, a course everyone's
// actively posting in) rather than a self-reported life-stage category.
// PATH_CONTENT below stays: userType still legitimately changes which
// boards/copy make sense to *show* someone, which is a different question
// from what *connects* them to other people — see the demoted "viewing as"
// note further down for why that distinction now matters more, not less.
const PATH_CONTENT = {
  [USER_TYPE_STUDENT]: {
    banner: 'Course Connect is the course of life: a nationwide network of people on the same journey, getting better together.',
    sub: 'Meet people across Ireland on the same journey as you. Share notes, study together, and get started with confidence.',
    academicEyebrow: 'STUDY SUPPORT',
    academicTitle: 'Built for studying and getting started',
    toolsSub: 'Practical tools and shared notes to help you get started.',
  },
  [USER_TYPE_APPRENTICE]: {
    banner: "As an apprentice, you're on the same course as everyone here: learning your trade and working toward a common goal.",
    sub: 'Meet apprentices and tradespeople across Ireland learning on the job and working toward the same goal. Ask, share, and get better together.',
    academicEyebrow: 'TRADE SUPPORT',
    academicTitle: 'Built for learning the trade',
    toolsSub: "Practical tools and peer advice for learning on the job, whatever stage you're at.",
  },
  [USER_TYPE_GAP_YEAR]: {
    banner: 'On a gap year, Course Connect shows you where every path leads, from people already studying, training, and working.',
    sub: 'Working out what comes next? Talk to people already on every path across Ireland, all heading toward something better.',
    academicEyebrow: 'SUPPORT FOR YOUR NEXT STEP',
    academicTitle: 'Built for your next step',
    toolsSub: 'Tools and resources that work whichever way you end up going next.',
  },
  [USER_TYPE_WORKER]: {
    banner: 'As a worker, Course Connect connects you with people across Ireland working to progress and get better, wherever you are.',
    sub: 'Industry discussions, career chats, and a peer network for people in work, all moving forward together.',
    academicEyebrow: 'WORK SUPPORT',
    academicTitle: 'Built for working and moving up',
    toolsSub: 'Practical tools and peer advice for getting ahead at work, whatever your industry.',
  },
}

// Hero stats: the sourced CAO/HE figures below are genuinely student- and
// CAO-specific, so showing them to an Apprentice, Gap Year, or Worker user
// would misrepresent what the hub covers for them. Rather than fabricate
// pathway-specific figures with no real source, those three user types see
// three honest, unsourced-figure-free stats instead (all 32 counties,
// the live tool/board count below, free to join) — the same category of
// claim Campus Connect's hero already uses.
const LIVE_TOOL_COUNT = 9 // COURSE_FEATURES.length, all "Live now" — see below

// ─── Course feature products (9 total, all live) ────────────────────────────

const COURSE_FEATURES = [
  {
    key: 'course_boards', label: 'COURSE BOARDS', Icon: GraduationCap, color: '#EFF6FF',
    headline: 'Talk to everyone on your path',
    sub: 'Discussion boards scoped to your course, programme, or workplace, not your campus. Open to everyone on it, anywhere in Ireland.',
    count: 'Live now',
    preview: [
      { text: 'Computer Science, UCD · Anyone doing the optional AI module next year?', meta: 'CS' },
      { text: 'Electrical apprenticeship, ETB · Anyone else on Phase 4 this block?', meta: 'Trade' },
    ],
  },
  {
    key: 'notes', label: 'NOTES EXCHANGE', Icon: FileText, color: '#EFF6FF',
    headline: 'Get ahead with peer notes',
    sub: 'Upload and access module summaries, lecture notes, and revision guides shared by students like you.',
    count: 'Live now',
    preview: [
      { text: 'MG4021, Consumer Behaviour · Week 7 Summary · UL', meta: '142 views' },
      { text: 'CS2001, Data Structures · Linked Lists & Trees · UCD', meta: '98 views' },
    ],
  },
  {
    key: 'groups', label: 'STUDY GROUPS', Icon: Users, color: '#F0FDF4',
    headline: 'Study with people who get it',
    sub: 'Form or join groups by module, topic, or upcoming deadline, at any Irish college or training centre.',
    count: 'Live now',
    preview: [
      { text: 'CS2001 Exam Prep Group · UCD · 4 members', meta: 'Active' },
      { text: 'MG4021 Week 7 Revision · UL · 3 members', meta: 'Active' },
    ],
  },
  {
    key: 'qa', label: 'MODULE Q&A', Icon: MessageSquare, color: '#FDF4FF',
    headline: 'Get unstuck, fast',
    sub: 'Ask questions about your course, module, or on-the-job training, and get answers from people who have already been there.',
    count: 'Live now',
    preview: [
      { text: "What's the best way to approach Big O notation for the upcoming exam?", meta: 'CS2001' },
      { text: 'Can anyone explain the difference between void and voidable contracts?', meta: 'LA1102' },
    ],
  },
  {
    key: 'exams', label: 'EXAM RESOURCES', Icon: BookMarked, color: '#FFF7ED',
    headline: 'Past papers and revision guides in one place',
    sub: 'Access a growing library of past papers, exam tips, and revision guides across all Irish universities.',
    count: 'Live now',
    preview: [
      { text: 'UCD Business, 2023 Past Papers Bundle', meta: 'Past Paper' },
      { text: 'TCD Law, Essay structure and exam technique guide', meta: 'Guide' },
    ],
  },
  {
    key: 'resources', label: 'RESOURCE FINDER', Icon: Search, color: '#F0F9FF',
    headline: 'Find resources from any institution',
    sub: 'Search shared notes and past papers by subject, course, or keyword, across Ireland.',
    count: 'Live now',
  },
  {
    key: 'industry', label: 'INDUSTRY DISCUSSIONS', Icon: Briefcase, color: '#FEF9C3',
    headline: 'Talk to people already in your field',
    sub: 'Industry-specific discussions for young people exploring careers, on any route in. Ask, listen, and connect with those ahead of you.',
    count: 'Live now',
  },
  {
    key: 'college_reviews', label: 'COLLEGE REVIEWS', Icon: Star, color: '#F0FDF4',
    headline: 'Real reviews of Irish colleges and courses',
    sub: 'Honest assessments from students across all institutions. Search by course, campus, or subject area.',
    count: 'Live now',
  },
  {
    key: 'cross_projects', label: 'PROJECT COLLABORATION', Icon: Lightbulb, color: '#FDF4FF',
    headline: 'Build something real, with anyone in Ireland',
    sub: 'Find teammates for college projects and side projects, from students at any Irish institution.',
    count: 'Live now',
    preview: [
      { text: 'Cross-college Hackathon Team · UCD + TCD · 2 spots open', meta: 'Mobile Dev' },
      { text: 'Sustainability Research Project · UCC · 1 spot open', meta: 'Research' },
    ],
  },
]

// Maps each Course Tools feature key to the real Supabase table backing it,
// so tile order can be driven by genuine recent-activity counts instead of
// the fixed order above. 'resources' has no table of its own (Resource
// Finder searches shared_notes and past_papers together), so its count is
// derived from 'notes' + 'exams' rather than queried separately.
const FEATURE_ACTIVITY_TABLE = {
  course_boards: 'course_boards_posts',
  notes: 'shared_notes',
  groups: 'course_connect_study_groups',
  qa: 'module_questions',
  exams: 'past_papers',
  industry: 'industry_discussions',
  college_reviews: 'college_reviews',
  cross_projects: 'cross_ireland_projects',
}
const POPULARITY_WINDOW_DAYS = 30

async function countRecentRows(table, cutoffIso) {
  try {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoffIso)
    return count || 0
  } catch {
    return 0
  }
}

// Maps each Course Tools feature card to its real destination.
function openCourseFeature(navigation, key) {
  const boardRoute = k => navigation.navigate('BoardDetail', { boardKey: k, registry: 'course' })
  if (key === 'course_boards') return boardRoute('course-boards')
  if (key === 'notes') return boardRoute('notes')
  if (key === 'groups') return boardRoute('study-groups')
  if (key === 'qa') return navigation.navigate('ModuleQA')
  if (key === 'exams') return boardRoute('papers')
  if (key === 'resources') return navigation.navigate('ResourceFinder')
  if (key === 'industry') return boardRoute('industry')
  if (key === 'college_reviews') return boardRoute('course-reviews')
  if (key === 'cross_projects') return boardRoute('projects')
}

// ─── Academic Support: Course Tools (shells, exact tool set TBD) ─────────────
// NOTE: Exact tool set to be confirmed. Pattern and card structure built here.
const ACADEMIC_TOOLS = [
  {
    key: 'essay',       label: 'ESSAY & WRITING',    Icon: PenLine,      color: '#EFF6FF',
    headline: 'Write clearer, more structured essays',
    sub: 'Guidance on essay structure, argumentation, and academic writing style across disciplines.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'referencing', label: 'REFERENCING',         Icon: BookOpenCheck, color: '#F0FDF4',
    headline: 'Generate references in any style',
    sub: 'APA, Harvard, Chicago, and more. Build and export your bibliography in seconds.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'timetable',   label: 'TIMETABLE PLANNER',  Icon: CalendarDays,  color: '#FDF4FF',
    headline: 'Build your week before the week builds you',
    sub: 'Plan lectures, study sessions, and deadlines in one clear view. Syncs with your module list.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'tracker',     label: 'MODULE TRACKER',      Icon: Clock,         color: '#FFF7ED',
    headline: 'Stay on top of every assignment',
    sub: 'Log assessments, track grades, and never miss a submission deadline again.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'research',    label: 'RESEARCH SKILLS',     Icon: Search,        color: '#F0F9FF',
    headline: 'Find and evaluate academic sources',
    sub: 'Guidance on searching databases, evaluating sources, and building strong literature reviews.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'integrity',   label: 'ACADEMIC INTEGRITY',  Icon: BookOpen,      color: '#FEF9C3',
    headline: "Know your college's academic guidelines",
    sub: 'Plain-language summaries of plagiarism rules, proper citation, and what counts as collaboration.',
    count: 'Coming soon', coming: true,
  },
]

// ─── Popular Notes ────────────────────────────────────────────────────────────
// Was a hardcoded RECENT_NOTES array (4 fake notes with made-up view/save
// counts) shown under a "these are examples" MockContentBanner. Replaced
// with get_popular_notes() (20261012163000_popular_notes_rpc.sql) — the
// real top shared_notes rows ranked by genuine download_count, the same
// counter BoardDetailScreen.jsx/ResourceFinderScreen.jsx already bump on
// every real download. See loadPopularNotes() in the screen component
// below. POPULAR_NOTES_LIMIT caps how many rows the widget asks for.
const POPULAR_NOTES_LIMIT = 4

// ─── Popular Right Now ────────────────────────────────────────────────────────
// Replaces the old "Journey Match" stage-grouped mock profile grid entirely.
// No mock data here — see loadPopularCourses() in the screen component,
// which groups real course_boards_posts rows by `course` (case-insensitive,
// original casing kept for display) over the last POPULARITY_WINDOW_DAYS
// days and ranks by count. `course` is free text a poster fills in
// themselves — "Computer Science, UCD", "Electrical Apprenticeship, ETB",
// "Marketing Assistant, Version 1" all live in the same column — so ranking
// by real post volume naturally interleaves student/apprentice/gap-year/
// worker activity instead of requiring a designed taxonomy to do it.
function groupPopularCourses(rows) {
  const counts = {} // lowercased key -> { label, count }
  rows.forEach(row => {
    const raw = (row.course || '').trim()
    if (!raw) return
    const key = raw.toLowerCase()
    if (!counts[key]) counts[key] = { label: raw, count: 0 }
    counts[key].count += 1
  })
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8)
}

// Small tile grid for the popular-courses cards below — same measured-width,
// flex-wrap tile pattern Campus Connect's board grid uses (see
// CampusConnectScreen.jsx's BoardTileGrid), adapted to 2 columns since these
// tiles carry a full course name rather than a single emoji + short label.
const POPULAR_TILE_COLUMNS = 2
const POPULAR_TILE_GAP = 10

function PopularCourseGrid({ items, onPress }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [containerWidth, setContainerWidth] = useState(0)
  const tileWidth = containerWidth > 0
    ? (containerWidth - POPULAR_TILE_GAP * (POPULAR_TILE_COLUMNS - 1)) / POPULAR_TILE_COLUMNS
    : 0

  return (
    <View style={styles.popularGrid} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {containerWidth > 0 && items.map(item => (
        <TouchableOpacity
          key={item.label}
          style={[styles.popularTile, { width: tileWidth }]}
          activeOpacity={0.82}
          onPress={() => onPress(item.label)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.label} Course Board`}
        >
          <View style={styles.popularTileTop}>
            <TrendingUp size={13} color={colors.goldDeep} strokeWidth={2.2} />
            <Text style={styles.popularTileCount}>{item.count} post{item.count !== 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.popularTileLabel} numberOfLines={2}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Course Discussions ───────────────────────────────────────────────────────

const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour, anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
  { module: 'LA1102', question: 'Can anyone explain the difference between void and voidable contracts?', replies: 22, university: 'TCD', time: '1d ago' },
]

// ─── Cross-Ireland Features ───────────────────────────────────────────────────
// For graduates, prospective students, apprentices, and young workers.
const CROSS_IRELAND_FEATURES = [
  {
    key: 'grad_network', label: 'GRADUATE NETWORK', Icon: GraduationCap, color: 'rgba(245,240,232,0.15)',
    headline: 'Stay connected after you graduate',
    sub: 'A network for recent graduates across Irish institutions. Share opportunities, advice, and experience.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'cao_guide', label: 'CAO COURSE GUIDE', Icon: Compass, color: 'rgba(245,240,232,0.15)',
    headline: 'Find your course before you apply',
    sub: 'Course profiles, points history, and student reviews for every CAO-listed course in Ireland.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'apprenticeship', label: 'APPRENTICESHIP CONNECT', Icon: Briefcase, color: 'rgba(245,240,232,0.15)',
    headline: 'Navigate apprenticeships and vocational routes',
    sub: 'For young people in trade apprenticeships or vocational training. Resources, community, and support.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'industry_paths', label: 'INDUSTRY PATHWAYS', Icon: Globe, color: 'rgba(245,240,232,0.15)',
    headline: 'Explore where your course leads',
    sub: 'Industry-specific routes, salary benchmarks, and career insights for graduates and final-year students.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'all_reviews', label: 'COLLEGE REVIEWS (ALL-IRELAND)', Icon: Star, color: 'rgba(245,240,232,0.15)',
    headline: 'Every Irish college, reviewed honestly',
    sub: 'Open to current students, graduates, and prospective applicants. Search by course or institution.',
    count: 'Live now',
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────
// Course Connect hub (founder pick r3-17 A): your interests first, then Course
// Pulse, then the tools as tiles, then recent questions. Open to everyone on a
// course of life, nationwide: students, apprentices and workers.

const TOOL_TITLES = {
  course_boards: 'Course boards', notes: 'Notes', groups: 'Study groups', qa: 'Q&A',
  exams: 'Exam resources', resources: 'Resource finder', industry: 'Industry discussions',
  college_reviews: 'College reviews', cross_projects: 'Project collaboration',
}

export default function CourseConnectScreen({ navigation }) {
  const { colors, accent, tint } = useTone('course')
  const comingSoonOn = useComingSoonEnabled()
  const insets = useSafeAreaInsets()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [interestsModalOpen, setInterestsModalOpen] = useState(false)
  const [allTools, setAllTools] = useState(false)

  const [moodPulse, setMoodPulse] = useState({ total: 0, counts: {} })
  useEffect(() => { fetchMoodPulse(DEFAULT_BUZZ_WINDOW).then(setMoodPulse).catch(() => {}) }, [])
  const { interests } = useInterests()

  // Real activity counts for the tile lines (last 30 days).
  const [featureCounts, setFeatureCounts] = useState({})
  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - POPULARITY_WINDOW_DAYS * 86400000).toISOString()
    ;(async () => {
      const entries = Object.entries(FEATURE_ACTIVITY_TABLE)
      const results = await Promise.all(entries.map(async ([key, table]) => [key, await countRecentRows(table, cutoff)]))
      if (cancelled) return
      const counts = Object.fromEntries(results)
      counts.resources = (counts.notes || 0) + (counts.exams || 0)
      setFeatureCounts(counts)
    })()
    return () => { cancelled = true }
  }, [])

  // Popular right now: real post counts per course over 30 days.
  const [popularCourses, setPopularCourses] = useState([])
  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - POPULARITY_WINDOW_DAYS * 86400000).toISOString()
    ;(async () => {
      const { data } = await supabase.from('course_boards_posts').select('course, created_at').gte('created_at', cutoff).limit(2000)
      if (!cancelled) setPopularCourses(groupPopularCourses(data || []))
    })()
    return () => { cancelled = true }
  }, [])

  // Popular notes: real downloads.
  const [popularNotes, setPopularNotes] = useState([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.rpc('get_popular_notes', { limit_count: POPULAR_NOTES_LIMIT })
      if (!cancelled) setPopularNotes(data || [])
    })()
    return () => { cancelled = true }
  }, [])

  // Recent questions: the latest real Q&A, with how many answers each has.
  const [recent, setRecent] = useState([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: qs } = await supabase.from('module_questions').select('id, question_text, course, module, created_at').order('created_at', { ascending: false }).limit(3)
        if (cancelled || !qs?.length) { if (!cancelled) setRecent([]); return }
        const { data: ans } = await supabase.from('module_answers').select('question_id').in('question_id', qs.map(q => q.id))
        const counts = {}
        ;(ans || []).forEach(a => { counts[a.question_id] = (counts[a.question_id] || 0) + 1 })
        if (!cancelled) setRecent(qs.map(q => ({ ...q, answers: counts[q.id] || 0 })))
      } catch { /* optional */ }
    })()
    return () => { cancelled = true }
  }, [])

  const tools = useMemo(() => {
    const list = COURSE_FEATURES.map(f => ({
      key: f.key, title: TOOL_TITLES[f.key] || f.label, Icon: f.Icon,
      sub: featureCounts[f.key] > 0 ? `${featureCounts[f.key]} this month` : '',
    }))
    return allTools ? list : list.slice(0, 6)
  }, [featureCounts, allTools])

  const comingSoon = comingSoonOn ? [...ACADEMIC_TOOLS, ...CROSS_IRELAND_FEATURES.filter(f => f.coming)] : []

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="Course Connect" />
        <View style={s.sub}>
          <IrishFlag size={14} />
          <Text style={[s.subText, { color: colors.textSecondary }]}>Everyone on the same course of life.</Text>
        </View>

        <LiveRail audience="course" navigation={navigation} />

        <View style={s.body}>
          <Card onPress={() => setInterestsModalOpen(true)} accessibilityLabel="Your interests. Edit">
            <View style={s.interests}>
              <View style={[s.iconBox, { backgroundColor: tint }]}><Heart size={22} color={accent} strokeWidth={1.8} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Your interests</Text>
                <Text style={[s.small, { color: colors.textSecondary }]} numberOfLines={2}>
                  {interests.length
                    ? `Matched on ${interests.slice(0, 3).join(', ')}${interests.length > 3 ? ' and more' : ''}`
                    : 'Add what you are into and meet people who share it.'}
                </Text>
              </View>
              <Text style={[s.edit, { color: accent }]}>{interests.length ? 'Edit' : 'Add'}</Text>
            </View>
          </Card>

          <View style={{ marginTop: 16 }}>
            <PulseQuestions navigation={navigation} audience="course" />
          </View>

          <SectionRow title="Tools" kind="course" action={allTools ? 'Show fewer' : `All ${COURSE_FEATURES.length}`} onAction={() => setAllTools(v => !v)} />
          <TileGrid kind="course" items={tools} onPress={t => openCourseFeature(navigation, t.key)} />

          <SectionRow title="Recent questions" kind="course" action="See all" onAction={() => navigation.navigate('ModuleQA')} />
          {recent.length === 0 ? (
            <EmptyNote Icon={HelpCircle} title="No questions yet" body="Ask the first one. Anyone on the course of life can answer.">
              <PrimaryButton label="Ask a question" onPress={() => navigation.navigate('ModuleQA', { openAsk: true })} />
            </EmptyNote>
          ) : recent.map(q => (
            <Card key={q.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('ModuleQA', { openQuestionId: q.id })} accessibilityLabel={q.question_text}>
              <View style={s.qRow}>
                <Pill kind="course" tone="accent" label={q.answers ? `${q.answers} answer${q.answers === 1 ? '' : 's'}` : 'Unanswered'} />
                <Text style={[s.q, { color: colors.textPrimary }]} numberOfLines={3}>{q.question_text}</Text>
              </View>
            </Card>
          ))}

          {popularCourses.length > 0 && (
            <>
              <SectionRow title="Busiest right now" kind="course" />
              <View style={s.wrap}>
                {popularCourses.map(c => (
                  <TouchableOpacity key={c.label} onPress={() => navigation.navigate('BoardDetail', { boardKey: 'course-boards', registry: 'course', presetFilter: { course: c.label } })}
                    style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button">
                    <Text style={[s.chipText, { color: colors.textPrimary }]} numberOfLines={1}>{c.label}</Text>
                    <Text style={[s.chipCount, { color: accent }]}>{c.count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {popularNotes.length > 0 && (
            <>
              <SectionRow title="Popular notes" kind="course" action="Open" onAction={() => navigation.navigate('BoardDetail', { boardKey: 'notes', registry: 'course' })} />
              <Card style={{ padding: 4 }}>
                {popularNotes.map((n, i) => (
                  <TouchableOpacity key={n.id} onPress={() => navigation.navigate('BoardDetail', { boardKey: 'notes', registry: 'course' })}
                    style={[s.noteRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]} accessibilityRole="button">
                    <FileText size={18} color={accent} strokeWidth={1.8} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardTitle, { color: colors.textPrimary, fontSize: 15 }]} numberOfLines={1}>{n.title}</Text>
                      <Text style={[s.small, { color: colors.textSecondary }]} numberOfLines={1}>{[n.subject, n.course].filter(Boolean).join(', ')}</Text>
                    </View>
                    <Text style={[s.small, { color: colors.textSecondary }]}>{n.download_count || 0} downloads</Text>
                  </TouchableOpacity>
                ))}
              </Card>
            </>
          )}

          {comingSoon.length > 0 && (
            <>
              <SectionRow title="Coming soon" kind="course" />
              <Text style={[s.small, { color: colors.textSecondary, marginBottom: 10 }]}>Stay tuned. Coming soon.</Text>
              <View style={s.wrap}>
                {comingSoon.map(c => (
                  <View key={c.key} style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <c.Icon size={14} color={accent} strokeWidth={1.8} />
                    <Text style={[s.chipText, { color: colors.textPrimary }]} numberOfLines={1}>{c.label.charAt(0) + c.label.slice(1).toLowerCase()}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ marginTop: 24 }}>
            <MoodPulse pulse={moodPulse} title="Course Mood" />
          </View>
        </View>
      </ScrollView>

      <View style={[s.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <PrimaryButton label="Post to a board" Icon={Plus} onPress={() => setPickerOpen(true)} style={{ marginTop: 0 }} />
      </View>

      <CourseBoardPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={board => {
          setPickerOpen(false)
          navigation.navigate('BoardDetail', { boardKey: board.key, registry: 'course', openPostForm: true })
        }}
      />
      <InterestsModal visible={interestsModalOpen} onClose={() => setInterestsModalOpen(false)} />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  subText: { fontFamily: fonts.sans, fontSize: 14 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  interests: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  small: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19 },
  edit: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  q: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 23 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, maxWidth: '100%' },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14, flexShrink: 1 },
  chipCount: { fontFamily: fonts.sansBold, fontSize: 13 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'flex-end' },
})
