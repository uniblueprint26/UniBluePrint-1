import { useState, useRef, useEffect, useMemo } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Search, ChevronLeft, MapPin, AlertCircle, Plus, MessageSquare, X, Flag, Trash2, Minus,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import FeatureCard from '../components/ui/FeatureCard'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import BoardPickerModal from '../components/campusConnect/BoardPickerModal'
import { CAMPUS_BOARDS } from '../constants/campusBoards'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Board showcase (14 boards, one consistent card treatment) ─────────────
// Restyled to match Course Connect's hub layout: one full-width FeatureCard
// per board (headline, sub, live preview posts, Open CTA) instead of the
// previous two-tier layout — a handful of boards summarised into a single
// "Campus Boards" tile up top, with the other 12 squeezed into a small
// horizontal-scroll strip further down. That split is exactly what earlier
// feedback flagged as some boards (Accommodation, Campus Events, Study
// Groups...) feeling hidden/messy next to Carpooling and Project
// Collaboration, which got the full-card treatment. Every board — including
// Carpooling, which predates the generic board engine and isn't in
// CAMPUS_BOARDS — now gets the identical card. Carpooling and Project
// Collaboration still keep their own rich sections further down the page
// (real posted routes/projects, filters, join flow); their tile here is a
// consistent entry point that scrolls straight to that section.
const CARPOOL_TILE = {
  key: 'carpool', title: 'Carpooling', icon: '🚗', color: '#F0FDF4',
  tagline: 'Match with people on your route every day and cut your travel costs every week.',
  preview: [
    { text: 'Limerick City → UL Campus · Mon–Fri · 8:30am', meta: '2 seats' },
    { text: 'Cork City → UCC Main Gate · Mon/Wed/Fri · 9:00am', meta: '3 seats' },
  ],
}

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

// Sample posts for each board's mini preview inside its card — sourced from
// BOARDS_DATA below (12 generic boards) plus Carpooling's and Project
// Collaboration's own examples, reused rather than invented fresh.
function buildBoardTiles(boardsData, projectsPreview) {
  const ordered = [CAMPUS_BOARDS[0], CARPOOL_TILE, ...CAMPUS_BOARDS.slice(1)]
  return ordered.map(b => {
    const sample = b.key === 'carpool' ? b.preview
      : b.key === 'projects' ? projectsPreview
      : boardsData.find(x => x.key === b.key)?.posts?.map(p => ({ text: p.text, meta: p.time }))
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

const PROJECTS_PREVIEW = [
  { text: 'Campus Sustainability App · UCD · 2 spots open', meta: 'Mobile Dev' },
  { text: 'AI Study Planner (Final Year) · TCD · 3 spots open', meta: 'AI/ML' },
]

// ─── Boards (12 generic boards' sample posts, feeding buildBoardTiles above —
// Carpooling and Project Collaboration keep their own rich sections below,
// since they predate/extend beyond a generic board card) ───────────────────

const BOARDS_DATA = [
  {
    key: 'accommodation', title: 'Accommodation', icon: '🏠', color: '#EFF6FF',
    posts: [
      { text: 'Room available near UCD, €600/month, bills included. Available from August.', time: '2h ago' },
      { text: 'Looking for 2 flatmates in Smithfield. Modern apt, €750pp. DM for info.', time: '5h ago' },
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

const CARPOOL_TERMS_VERSION = 'v1'

const CARPOOL_REPORT_REASONS = ['Inappropriate content', 'Spam', 'Safety concern', 'Other']

// ─── Carpool: terms sheet ───────────────────────────────────────────────────
// Real gate, not decoration — the app shows this before ever attempting a
// post, but supabase/migrations/20260829150000_carpool_routes.sql enforces
// the same requirement at the database level via a trigger, so this can't be
// bypassed by skipping the UI.
function CarpoolTermsModal({ visible, onClose, onAccept, accepting }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cm.backdrop}>
        <View style={cm.sheet}>
          <View style={cm.headerRow}>
            <Text style={cm.title}>Carpool Safety Terms</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            <Text style={cm.body}>
              UniBlueprint connects students who want to share a route. It does not vet drivers,
              passengers, or vehicles, and does not guarantee anyone's identity or safety.{'\n\n'}
              By posting or contacting a route, you agree to:{'\n'}
              • Verify who you're travelling with before you get in a car, through your campus
              student services or your own judgement.{'\n'}
              • Share your trip details (who, when, route) with someone you trust before travelling.{'\n'}
              • Meet in a public place for a first trip where possible.{'\n'}
              • Report anything that feels wrong using the report option on a post.{'\n\n'}
              UniBlueprint is not responsible for arrangements made between students through this
              feature.
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[cm.acceptBtn, accepting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={onAccept}
            disabled={accepting}
          >
            <Text style={cm.acceptBtnText}>{accepting ? 'Saving…' : 'Accept & Continue'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Carpool: post a route ──────────────────────────────────────────────────
const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CONTRIBUTION_OPTIONS = ['Yes', 'No', 'Flexible']

function formatDays(days) {
  if (!days || days.length === 0) return ''
  if (days.length === 5 && DAY_OPTIONS.slice(0, 5).every(d => days.includes(d))) return 'Mon–Fri'
  if (days.length === 7) return 'Every day'
  return days.join(', ')
}

function PostRouteModal({ visible, onClose, onPosted, userId, posterName }) {
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const [days, setDays]       = useState([])
  const [departureTime, setDepartureTime] = useState('')
  const [seats, setSeats]     = useState(1)
  const [contribution, setContribution] = useState('Flexible')
  const [contactPreference, setContactPreference] = useState('')
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  function reset() {
    setFrom(''); setTo(''); setDays([]); setDepartureTime(''); setSeats(1)
    setContribution('Flexible'); setContactPreference(''); setNotes(''); setErrorMsg(null)
  }

  function toggleDay(day) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  async function submit() {
    if (!from.trim() || !to.trim() || days.length === 0 || !departureTime.trim() || !contactPreference.trim()) {
      setErrorMsg('From, to, at least one day, departure time, and contact preference are required.')
      return
    }
    setSaving(true)
    setErrorMsg(null)
    try {
      const { data, error } = await supabase
        .from('carpool_routes')
        .insert({
          user_id: userId,
          poster_name: posterName,
          from_location: from.trim(),
          to_location: to.trim(),
          days,
          departure_time: departureTime.trim(),
          seats_available: seats,
          contribution,
          contact_preference: contactPreference.trim(),
          notes: notes.trim() || null,
        })
        .select()
        .single()
      if (error) throw error
      onPosted(data)
      reset()
    } catch {
      setErrorMsg('Could not post your route. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cm.backdrop}>
        <View style={cm.sheet}>
          <View style={cm.headerRow}>
            <Text style={cm.title}>Post your route</Text>
            <TouchableOpacity
              onPress={() => { reset(); onClose() }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={cm.fieldLabel}>From</Text>
            <TextInput style={cm.input} value={from} onChangeText={setFrom} placeholder="e.g. Limerick City" placeholderTextColor={colors.light} />
            <Text style={cm.fieldLabel}>To</Text>
            <TextInput style={cm.input} value={to} onChangeText={setTo} placeholder="e.g. UL Campus" placeholderTextColor={colors.light} />
            <Text style={cm.fieldLabel}>Days</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DAY_OPTIONS.map(day => {
                const active = days.includes(day)
                return (
                  <TouchableOpacity
                    key={day}
                    style={[cm.dayChip, active && cm.dayChipActive]}
                    activeOpacity={0.8}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[cm.dayChipText, active && cm.dayChipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={cm.fieldLabel}>Departure time</Text>
            <TextInput style={cm.input} value={departureTime} onChangeText={setDepartureTime} placeholder="e.g. 8:30am" placeholderTextColor={colors.light} />
            <Text style={cm.fieldLabel}>Seats available</Text>
            <View style={cm.stepperRow}>
              <TouchableOpacity
                style={cm.stepperBtn}
                activeOpacity={0.8}
                onPress={() => setSeats(s => Math.max(1, s - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease seats available"
              >
                <Minus size={14} color={colors.navy} />
              </TouchableOpacity>
              <Text style={cm.stepperValue}>{seats}</Text>
              <TouchableOpacity
                style={cm.stepperBtn}
                activeOpacity={0.8}
                onPress={() => setSeats(s => Math.min(4, s + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increase seats available"
              >
                <Plus size={14} color={colors.navy} />
              </TouchableOpacity>
            </View>
            <Text style={cm.fieldLabel}>Contribution towards fuel/costs</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CONTRIBUTION_OPTIONS.map(opt => {
                const active = contribution === opt
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[cm.dayChip, active && cm.dayChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setContribution(opt)}
                  >
                    <Text style={[cm.dayChipText, active && cm.dayChipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={cm.fieldLabel}>Contact preference</Text>
            <TextInput style={cm.input} value={contactPreference} onChangeText={setContactPreference} placeholder="Email, phone, or in-app chat" placeholderTextColor={colors.light} />
            <Text style={cm.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[cm.input, { minHeight: 64 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else worth knowing, e.g. splitting fuel cost"
              placeholderTextColor={colors.light}
              multiline
              textAlignVertical="top"
            />
            {!!errorMsg && <Text style={cm.error}>{errorMsg}</Text>}
            <TouchableOpacity
              style={[cm.acceptBtn, saving && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={submit}
              disabled={saving}
            >
              <Text style={cm.acceptBtnText}>{saving ? 'Posting…' : 'Post Route'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const cm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '85%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, flex: 1, marginRight: 12 },
  body: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted, lineHeight: 21 },
  fieldLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  stepperValue: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, minWidth: 20, textAlign: 'center' },
  dayChip: {
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.3, borderColor: 'rgba(30,58,95,0.15)', backgroundColor: colors.white,
  },
  dayChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },
  dayChipTextActive: { color: colors.cream },
  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginTop: 12 },
  acceptBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  acceptBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})

// ─── Screen ───────────────────────────────────────────────────────────────────

// Carpooling and Project Collaboration tiles jump down to their existing
// rich sections further on this screen rather than pushing BoardDetail —
// every other board tile navigates straight to BoardDetail instead.
const FEATURE_SECTION = { carpool: 'carpool', projects: 'projects' }

export default function CampusConnectScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const institutionShort = user?.user_metadata?.institution_short
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'
  const [search, setSearch] = useState('')

  // ── Carpool: real routes, terms gate, posting ──────────────────────────────
  const [routes, setRoutes] = useState([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null) // null = unknown yet
  const [termsOpen, setTermsOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [acceptingTerms, setAcceptingTerms] = useState(false)

  // ── Post to Board picker ────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false)

  // ── Carpool: route/day/time filters ─────────────────────────────────────────
  const [routeFilter, setRouteFilter] = useState('')
  const [dayFilter, setDayFilter]     = useState(null)
  const [timeFilter, setTimeFilter]   = useState('')
  const filteredRoutes = routes.filter(r => {
    if (routeFilter.trim()) {
      const q = routeFilter.trim().toLowerCase()
      if (!r.from_location.toLowerCase().includes(q) && !r.to_location.toLowerCase().includes(q)) return false
    }
    if (dayFilter && !(r.days || []).includes(dayFilter)) return false
    if (timeFilter.trim() && !(r.departure_time || '').toLowerCase().includes(timeFilter.trim().toLowerCase())) return false
    return true
  })

  // ── Project Collaboration preview (real rows, incl. seed examples) ─────────
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    supabase.from('project_collaborations').select('*').order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => { setProjects(data || []); setLoadingProjects(false) })
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    Promise.all([
      supabase.from('carpool_routes').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('carpool_terms_acceptance').select('id').eq('user_id', user.id).limit(1),
    ]).then(([routesRes, termsRes]) => {
      if (cancelled) return
      setRoutes(routesRes.data || [])
      setHasAcceptedTerms((termsRes.data || []).length > 0)
      setLoadingRoutes(false)
    })
    return () => { cancelled = true }
  }, [user?.id])

  function openAddRoute() {
    if (hasAcceptedTerms) setPostOpen(true)
    else setTermsOpen(true)
  }

  async function acceptTerms() {
    if (acceptingTerms) return
    setAcceptingTerms(true)
    const { error } = await supabase
      .from('carpool_terms_acceptance')
      .insert({ user_id: user.id, version: CARPOOL_TERMS_VERSION })
    setAcceptingTerms(false)
    if (error) {
      Alert.alert('Something went wrong', 'Please try again.')
      return
    }
    setHasAcceptedTerms(true)
    setTermsOpen(false)
    setPostOpen(true)
  }

  function handleRoutePosted(route) {
    setRoutes(prev => [route, ...prev])
    setPostOpen(false)
  }

  async function removeRoute(routeId) {
    const { error } = await supabase.from('carpool_routes').delete().eq('id', routeId)
    if (!error) setRoutes(prev => prev.filter(r => r.id !== routeId))
  }

  function reportRoute(route) {
    Alert.alert(
      'Report this route',
      'What best describes the issue?',
      [
        ...CARPOOL_REPORT_REASONS.map(reason => ({
          text: reason,
          onPress: async () => {
            const { error } = await supabase.from('operations_flags').insert({
              flagged_by: user.id,
              target_type: 'carpool_route',
              target_id: route.id,
              reason,
            })
            Alert.alert(error ? 'Something went wrong' : 'Reported', error ? 'Please try again.' : "Thanks — the UniBlueprint team will take a look.")
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    )
  }

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

  // ── Board showcase (14 boards, one card treatment) ─────────────────────────
  const boardTiles = useMemo(() => buildBoardTiles(BOARDS_DATA, PROJECTS_PREVIEW), [])
  const filteredBoardTiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return boardTiles
    return boardTiles.filter(t =>
      t.label.toLowerCase().includes(q) || t.headline.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q))
  }, [boardTiles, search])

  function openBoardTile(key) {
    if (key === 'carpool' || key === 'projects') { scrollToFeature(key); return }
    navigation.navigate('BoardDetail', { boardKey: key })
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Scrollable content — header now scrolls with the page, same as every other screen ── */}
      <ScrollView
        ref={scrollRef}
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

          <View onLayout={registerSection('carpool')} />
          <SectionHeader eyebrow="Active Routes" title="Carpooling" style={{ marginTop: spacing.xl }} />
          <View style={styles.safetyBanner}>
            <AlertCircle size={15} color="#92400E" />
            <Text style={styles.safetyBannerText}>
              Always meet in a public place first. Share your plans with someone you trust.
            </Text>
          </View>

          <View style={styles.carpoolFilters}>
            <View style={styles.filterSearchWrap}>
              <Search size={14} color={colors.muted} />
              <TextInput
                style={styles.filterSearchInput}
                placeholder="Filter by route (e.g. Cork)"
                placeholderTextColor={colors.light}
                value={routeFilter}
                onChangeText={setRouteFilter}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={[cm.dayChip, !dayFilter && cm.dayChipActive]} onPress={() => setDayFilter(null)}>
                  <Text style={[cm.dayChipText, !dayFilter && cm.dayChipTextActive]}>All days</Text>
                </TouchableOpacity>
                {DAY_OPTIONS.map(day => (
                  <TouchableOpacity key={day} style={[cm.dayChip, dayFilter === day && cm.dayChipActive]} onPress={() => setDayFilter(day)}>
                    <Text style={[cm.dayChipText, dayFilter === day && cm.dayChipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.filterSearchWrap}>
              <Search size={14} color={colors.muted} />
              <TextInput
                style={styles.filterSearchInput}
                placeholder="Filter by time (e.g. 8:30am)"
                placeholderTextColor={colors.light}
                value={timeFilter}
                onChangeText={setTimeFilter}
              />
            </View>
          </View>

          {loadingRoutes ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.md }} />
          ) : filteredRoutes.length === 0 ? (
            <Text style={styles.emptyRoutesText}>
              {routes.length === 0 ? 'No routes posted yet. Be the first to share yours.' : 'No routes match those filters.'}
            </Text>
          ) : (
            <View style={{ gap: 10, marginTop: spacing.sm }}>
              {filteredRoutes.map(route => {
                const isOwn = route.user_id === user?.id
                return (
                  <Card key={route.id} style={styles.carpoolCard}>
                    <View style={styles.carpoolRouteRow}>
                      <View style={styles.carpoolDot} />
                      <Text style={styles.carpoolFrom}>{route.from_location}</Text>
                    </View>
                    <View style={[styles.carpoolRouteRow, { marginTop: 6 }]}>
                      <MapPin size={10} color={colors.navy} />
                      <Text style={styles.carpoolTo}>{route.to_location}</Text>
                    </View>
                    <View style={styles.carpoolMetaRow}>
                      <View style={styles.carpoolMetaPill}><Text style={styles.carpoolMetaPillText}>{formatDays(route.days)}</Text></View>
                      <View style={styles.carpoolMetaPill}><Text style={styles.carpoolMetaPillText}>Contribution: {route.contribution}</Text></View>
                    </View>
                    {!!route.notes && <Text style={styles.carpoolNotes}>{route.notes}</Text>}
                    <Text style={styles.carpoolPoster}>
                      Posted by {isOwn ? 'you' : (route.poster_name || 'a student')} · Contact: {route.contact_preference}
                    </Text>
                    <View style={styles.carpoolFooter}>
                      <Text style={styles.carpoolTime}>{route.departure_time}</Text>
                      <View style={styles.carpoolRight}>
                        <View style={styles.seatBadge}>
                          <Text style={styles.seatBadgeText}>
                            {route.seats_available} seat{route.seats_available !== 1 ? 's' : ''} free
                          </Text>
                        </View>
                        {isOwn ? (
                          <TouchableOpacity
                            style={styles.chatBtn}
                            activeOpacity={0.8}
                            onPress={() => Alert.alert(
                              'Remove this route?',
                              'This takes it off the board for everyone.',
                              [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeRoute(route.id) }],
                            )}
                          >
                            <Trash2 size={12} color={colors.navy} strokeWidth={2} />
                            <Text style={styles.chatBtnText}>Remove</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.reportBtn}
                              activeOpacity={0.8}
                              onPress={() => reportRoute(route)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityRole="button"
                              accessibilityLabel={`Report route from ${route.from_location} to ${route.to_location}`}
                            >
                              <Flag size={13} color={colors.muted} strokeWidth={2} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.chatBtn}
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('ChatRoom', {
                                contextType: 'carpool',
                                contextId:   route.id,
                                roomName:    `${route.from_location} → ${route.to_location}`,
                                subtitle:    route.departure_time,
                              })}
                            >
                              <MessageSquare size={12} color={colors.navy} strokeWidth={2} />
                              <Text style={styles.chatBtnText}>Chat</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  </Card>
                )
              })}
            </View>
          )}
          <TouchableOpacity
            style={[styles.secondaryBtn, { marginTop: spacing.md }]}
            activeOpacity={0.8}
            onPress={openAddRoute}
          >
            <Plus size={14} color={colors.navy} />
            <Text style={styles.secondaryBtnText}>Add Your Route</Text>
          </TouchableOpacity>

          <View onLayout={registerSection('projects')} />
          <SectionHeader eyebrow="Project Collaboration" title="Open Projects" style={{ marginTop: spacing.xl }} />
          {loadingProjects ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.md }} />
          ) : (
            <View style={{ gap: 12 }}>
              {projects.map(p => (
                <Card key={p.id} style={styles.projectCard}>
                  <Text style={styles.projectTitle}>{p.title}</Text>
                  <View style={styles.projectTags}>
                    {(p.skills_needed || []).map(t => (
                      <View key={t} style={styles.projectTag}>
                        <Text style={styles.projectTagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.projectFooter}>
                    <View style={styles.projectMeta}>
                      <Text style={styles.projectMetaText}>{p.timeline}</Text>
                      <Text style={styles.projectMetaText}>·</Text>
                      <Text style={[styles.projectMetaText, { color: colors.navy, fontFamily: fonts.sansSemiBold }]}>
                        {p.collaborators_needed} spot{p.collaborators_needed !== 1 ? 's' : ''} open
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinBtn}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('BoardDetail', { boardKey: 'projects' })}
                    >
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.secondaryBtn, { marginTop: spacing.md }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BoardDetail', { boardKey: 'projects' })}
          >
            <Text style={styles.secondaryBtnText}>See All Projects & Post Your Own</Text>
          </TouchableOpacity>

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
          if (board.key === 'carpool') openAddRoute()
          else navigation.navigate('BoardDetail', { boardKey: board.key, openPostForm: true })
        }}
      />

      <CarpoolTermsModal
        visible={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={acceptTerms}
        accepting={acceptingTerms}
      />
      <PostRouteModal
        visible={postOpen}
        onClose={() => setPostOpen(false)}
        onPosted={handleRoutePosted}
        userId={user?.id}
        posterName={displayName}
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

  // Carpooling
  safetyBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#D97706',
  },
  safetyBannerText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  carpoolFilters:   { marginTop: spacing.md, gap: 4 },
  filterSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.card, height: 42, paddingHorizontal: 12, marginTop: 8, ...shadows.card,
  },
  filterSearchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  emptyRoutesText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.md },
  carpoolCard:      { padding: 14 },
  carpoolRouteRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carpoolDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  carpoolFrom:      { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  carpoolTo:        { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  carpoolMetaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  carpoolMetaPill:  { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  carpoolMetaPillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },
  carpoolNotes:     { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  carpoolPoster:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 6 },
  carpoolFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  carpoolTime:      { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  carpoolRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seatBadge:        { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  seatBadgeText:    { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  reportBtn:        { padding: 4 },

  // Chat CTA, consistent across board cards and carpool posts
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,58,95,0.08)',
    borderRadius: radius.badge,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  chatBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

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
