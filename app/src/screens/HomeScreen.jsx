import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import {
  Bell, User, FileText, TrendingUp, Building2,
  Heart, Globe, Compass, Calculator, Megaphone,
  LayoutGrid, MessageSquare, Users, Menu, CheckCircle,
  Activity as ActivityIcon,
} from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import PortalSwitcher from '../components/ui/PortalSwitcher'
import ActiveMemberBadge from '../components/ui/ActiveMemberBadge'
import QuickAccessGrid from '../components/home/QuickAccessGrid'
import DestinationPickerModal from '../components/home/DestinationPickerModal'
import { colors, fonts } from '../constants/theme'
import { openMenu } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchHomeActivity } from '../lib/homeActivityFeed'

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SHORTCUTS = ['foundation', 'my_outputs', 'find_coach', 'campus']
const MAX_SHORTCUTS = 4
const ACTIVITY_REFRESH_MS = 60000

// Every destination the Quick Access "+" picker can offer. `label` is the
// canonical name shown in the picker; `homeLabel`/`homeSub`/`homeIcon` let a
// destination present differently as a Quick Access card (e.g. Foundation
// Blueprint shows as "Submit a Service" there) without being a separate,
// confusing entry in the picker itself.
const ALL_SHORTCUTS = [
  { key: 'foundation',    label: 'Foundation Blueprint', sub: 'CVs, cover letters, statements', Icon: FileText,      bg: '#EFF6FF', action: 'foundation',
    homeLabel: 'Submit a Service', homeSub: 'Order a Foundation Blueprint service' },
  { key: 'elevation',     label: 'Elevation Blueprint',  sub: 'Coaching and mentorship',        Icon: TrendingUp,    bg: '#F0FDF4', action: 'elevation' },
  { key: 'lifestyle',     label: 'Lifestyle Blueprint',  sub: 'Deals and mental health',        Icon: Heart,         bg: '#FDF4FF', action: 'lifestyle' },
  { key: 'campus',        label: 'Campus Connect',       sub: 'Boards, events, carpooling',     Icon: MessageSquare, bg: '#FFF7ED', action: 'campus_connect',
    homeLabel: 'Campus Board', homeSub: 'See what campus is talking about' },
  { key: 'course',        label: 'Course Connect',       sub: 'Notes and study groups',         Icon: Globe,         bg: '#F0F9FF', action: 'course_connect' },
  { key: 'compass',       label: 'Course Compass',       sub: 'Course guidance tools',          Icon: Compass,       bg: '#F5F0E8', action: 'compass' },
  { key: 'budgeting',     label: 'Budgeting',            sub: 'Budget tools and SUSI guide',    Icon: Calculator,    bg: '#F0FDF4', action: 'budgeting' },
  { key: 'adboard',       label: 'Ad Board',             sub: 'Weekly magazine, blog, and marketplace', Icon: Megaphone, bg: '#FFF7ED', action: 'tab', tabName: 'AdBoard' },
  { key: 'my_outputs',    label: 'My Outputs',           sub: 'Your completed documents',       Icon: CheckCircle,   bg: '#ECFDF5', action: 'my_outputs' },
  { key: 'find_coach',    label: 'Find a Coach',         sub: 'Book time with a coach',         Icon: Users,         bg: '#EFF6FF', action: 'elevation' },
  { key: 'messages',      label: 'Messages',             sub: 'Direct messages',                Icon: MessageSquare, bg: '#F0F9FF', action: 'tab', tabName: 'Messages' },
  { key: 'directory',     label: 'Directory',            sub: 'People directory',               Icon: Users,         bg: '#EFF6FF', action: 'tab', tabName: 'Directory' },
  { key: 'profile',       label: 'Profile',              sub: 'Your profile and settings',      Icon: User,          bg: '#FDF4FF', action: 'tab', tabName: 'Profile' },
  { key: 'notifications', label: 'Notifications',        sub: 'Everything that needs your attention', Icon: Bell,    bg: '#FEF3C7', action: 'notifications' },
]

// Sidebar nav items — corrected order per spec
const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Dashboard',             Icon: LayoutGrid, action: 'home'      },
  { key: 'foundation', label: 'Foundation\nBlueprint', Icon: FileText,   action: 'foundation' },
  { key: 'elevation',  label: 'Elevation\nBlueprint',  Icon: TrendingUp, action: 'elevation'  },
  { key: 'lifestyle',  label: 'Lifestyle\nBlueprint',  Icon: Heart,      action: 'lifestyle'  },
  { key: 'campus',     label: 'Campus\nConnect',       Icon: Building2,  action: 'campus_connect' },
  { key: 'course',     label: 'Course\nConnect',       Icon: Globe,      action: 'course_connect' },
  { key: 'compass',    label: 'Compass',               Icon: Compass,    action: 'compass' },
  { key: 'budgeting',  label: 'Budgeting',             Icon: Calculator, action: 'budgeting' },
  { key: 'adboard',    label: 'Ad Board',              Icon: Megaphone,  action: 'tab',       tabName: 'AdBoard' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(displayName) {
  if (!displayName) return 'there'
  return displayName.split(' ')[0]
}

// 05:00–11:59 morning · 12:00–16:59 afternoon · 17:00–22:59 evening · 23:00–04:59 night
function getGreetingWord(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12)  return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 23) return 'Good evening'
  return 'Good night'
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const {
    user, isAnyPortalEligible, isHandler, isFounder, isOperations, isBusiness,
    studioLabel, isComplimentaryPro, portalMode, setPortalMode,
  } = useAuth()

  // Profile row — full_name (canonical source of truth) and this student's
  // persisted Quick Access selection.
  const [profileRow, setProfileRow] = useState(null)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase.from('profiles').select('full_name, quick_access_preferences').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setProfileRow(data || null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id])

  const fullName  = profileRow?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const firstName = getFirstName(fullName)
  const greeting  = getGreetingWord()

  // Dual portal — one tap in the top nav switches My Blueprint <-> the
  // internal-team professional workspace. Landing screen depends on role;
  // a user can only hold one of these at a time in practice, so the first
  // match wins.
  function handlePortalSwitch(mode) {
    setPortalMode(mode)
    if (mode === 'studio') {
      const landing = isHandler ? 'StudioQueue'
        : isFounder ? 'FounderPortal'
        : isOperations ? 'OperationsPortal'
        : isBusiness ? 'PartnerPortalApp'
        : 'CoachStudio'
      navigation.navigate(landing)
    }
  }

  // ── Quick Access ────────────────────────────────────────────────────────
  const [shortcutKeys, setShortcutKeys] = useState(DEFAULT_SHORTCUTS)
  const [editingQA, setEditingQA]       = useState(false)
  const [pickerOpen, setPickerOpen]     = useState(false)

  useEffect(() => {
    if (!profileRow) return
    const stored = Array.isArray(profileRow.quick_access_preferences) ? profileRow.quick_access_preferences : null
    const valid = (stored || []).filter(k => ALL_SHORTCUTS.some(s => s.key === k)).slice(0, MAX_SHORTCUTS)
    setShortcutKeys(valid.length > 0 ? valid : DEFAULT_SHORTCUTS)
  }, [profileRow])

  async function persistShortcuts(keys) {
    setShortcutKeys(keys)
    if (!user?.id) return
    try {
      await supabase.from('profiles').update({ quick_access_preferences: keys }).eq('id', user.id)
    } catch { /* best effort — local state already reflects the change */ }
  }

  function enterEditMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setEditingQA(true)
  }
  function toggleEditMode() {
    if (editingQA) { setEditingQA(false) } else { enterEditMode() }
  }

  function handlePick(key) {
    setPickerOpen(false)
    if (shortcutKeys.length >= MAX_SHORTCUTS || shortcutKeys.includes(key)) return
    persistShortcuts([...shortcutKeys, key])
  }

  const shortcutItems = shortcutKeys.map(k => ALL_SHORTCUTS.find(s => s.key === k)).filter(Boolean)
  const pickerOptions = ALL_SHORTCUTS.filter(s => !shortcutKeys.includes(s.key))

  // "Tap outside to exit edit mode" — a capture-phase responder on the whole
  // screen swallows any touch that lands outside the measured Quick Access
  // block while editing; touches inside it (cards, X, +, Done) fall through
  // to their own handlers as normal. See gridBlockRef/measureGridBlock.
  const gridBlockRef  = useRef(null)
  const gridBoundsRef = useRef(null)
  function measureGridBlock() {
    requestAnimationFrame(() => {
      gridBlockRef.current?.measureInWindow?.((x, y, width, height) => {
        gridBoundsRef.current = { x, y, width, height }
      })
    })
  }
  useEffect(() => { if (editingQA) measureGridBlock() }, [editingQA, shortcutItems.length])

  function handleCaptureCheck(evt) {
    if (!editingQA) return false
    const b = gridBoundsRef.current
    const { pageX, pageY } = evt.nativeEvent
    if (!b) return true
    const inside = pageX >= b.x && pageX < b.x + b.width && pageY >= b.y && pageY < b.y + b.height
    return !inside
  }

  // Sidebar active key — reset to dashboard whenever this screen regains focus
  const [activeNavKey, setActiveNavKey] = useState('dashboard')
  useFocusEffect(useCallback(() => {
    setActiveNavKey('dashboard')
  }, []))

  // ── Live Activity — refetches every 60s in the background (not realtime) ──
  const [activity, setActivity]               = useState([])
  const [loadingActivity, setLoadingActivity]  = useState(true)

  const loadActivity = useCallback(async () => {
    if (!user?.id) { setLoadingActivity(false); return }
    try {
      const events = await fetchHomeActivity({ userId: user.id, firstName })
      setActivity(events)
    } catch { /* keep whatever we already had */ }
    finally { setLoadingActivity(false) }
  }, [user?.id, firstName])

  useEffect(() => {
    loadActivity()
    const interval = setInterval(loadActivity, ACTIVITY_REFRESH_MS)
    return () => clearInterval(interval)
  }, [loadActivity])

  // Unread notification count for the bell badge, kept live via realtime so
  // it clears the moment a notification is read elsewhere and increments the
  // moment a new one lands, without needing to revisit this screen.
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    if (!user?.id) return
    async function fetchUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
    const channel = supabase
      .channel(`unread-badge-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  function handleNav(item) {
    if (!item) return
    if (item.action === 'home') { setActiveNavKey('dashboard'); return }
    setActiveNavKey(item.key)
    if      (item.action === 'foundation')     navigation.navigate('Foundation')
    else if (item.action === 'elevation')      navigation.navigate('Elevation')
    else if (item.action === 'campus_connect') navigation.navigate('CampusConnect')
    else if (item.action === 'course_connect') navigation.navigate('CourseConnect')
    else if (item.action === 'lifestyle')      navigation.navigate('Lifestyle')
    else if (item.action === 'compass')        navigation.navigate('Compass')
    else if (item.action === 'budgeting')      navigation.navigate('Budgeting')
    else if (item.action === 'my_outputs')     navigation.navigate('MyOutputs')
    else if (item.action === 'notifications')  navigation.navigate('Notifications')
    else if (item.action === 'tab')            navigation.getParent()?.navigate(item.tabName)
    else if (item.action === 'external')       Linking.openURL(item.url)
  }

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top }]}
      onStartShouldSetResponderCapture={handleCaptureCheck}
      onResponderRelease={() => setEditingQA(false)}
      onResponderTerminationRequest={() => true}
    >
      <View style={styles.layout}>

        {/* ── SIDEBAR ──
            The complete, fixed navigation: every section of UniBlueprint,
            always in the same order, never personalised. This is
            deliberately distinct from Quick Access below (the user's own,
            editable shortcuts) — see the "MENU" label and each row's
            accessibility hint, which spell that out for anyone relying on
            a screen reader too. */}
        <View style={styles.sidebar} accessibilityRole="navigation" accessibilityLabel="Full navigation menu">
          <View style={styles.sidebarLogoWrap}>
            <UBPLogo height={33} color={colors.cream} onPress={() => handleNav({ action: 'home' })} />
          </View>
          <Text style={styles.sidebarCaption}>MENU</Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.key === activeNavKey
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.navItemOuter}
                  activeOpacity={0.65}
                  onPress={() => handleNav(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label.replace('\n', ' ')}
                >
                  {isActive && <View style={styles.navHighlight} />}
                  <item.Icon
                    size={20}
                    color={isActive ? colors.cream : 'rgba(245,240,232,0.58)'}
                    strokeWidth={isActive ? 2 : 1.6}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* ── MAIN ── */}
        <View style={styles.main}>

          {/* Topbar */}
          <View style={styles.mainTopBar}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.topTitle} numberOfLines={2}>
                {fullName ? `${firstName}'s Dashboard` : 'Your Dashboard'}
              </Text>
              <Text style={styles.topGreeting} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              {isComplimentaryPro && <ActiveMemberBadge style={{ marginTop: 6 }} />}
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.menuBtn}
                activeOpacity={0.7}
                onPress={() => openMenu(navigation)}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <Menu size={19} color={colors.navy} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notifications')}
                accessibilityRole="button"
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <Bell size={19} color={colors.navy} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarBtn}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('Profile')}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                <User size={16} color={colors.navy} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dual portal switcher — Handlers and Coaches only. My Blueprint
              is this screen; switching to Studio hands off to the
              professional workspace, which contains no student-facing
              submission forms. */}
          {isAnyPortalEligible && (
            <View style={styles.portalSwitchRow}>
              <PortalSwitcher
                active={portalMode}
                onSwitch={handlePortalSwitch}
                studioLabel={studioLabel}
              />
            </View>
          )}

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!editingQA}
          >
            {/* Quick Access */}
            <View
              ref={gridBlockRef}
              onLayout={measureGridBlock}
              collapsable={false}
            >
              <View style={styles.sectionRow}>
                <View>
                  <Text style={styles.eyebrow}>Quick Access</Text>
                  <Text style={styles.sectionCaption}>Your own shortcuts — pick any 4</Text>
                </View>
                {editingQA ? (
                  <TouchableOpacity
                    onPress={() => setEditingQA(false)}
                    style={styles.doneBtn}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Done editing Quick Access"
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.editHint}>Press &amp; hold to edit</Text>
                )}
              </View>

              <View style={{ marginBottom: 24 }}>
                <QuickAccessGrid
                  items={shortcutItems}
                  editing={editingQA}
                  onNavigate={handleNav}
                  onReorder={persistShortcuts}
                  onRemove={key => persistShortcuts(shortcutKeys.filter(k => k !== key))}
                  onAddPress={() => setPickerOpen(true)}
                  onLongPressToggle={toggleEditMode}
                />
              </View>
            </View>

            {/* Live Activity */}
            <View style={styles.sectionRow}>
              <Text style={[styles.eyebrow, { marginBottom: 0 }]}>Live Activity</Text>
              <View style={styles.livePulse} />
            </View>
            <Card style={{ padding: 0, marginTop: 10, marginBottom: 8 }}>
              {loadingActivity ? (
                <View style={styles.feedRow}>
                  <Text style={styles.feedText}>Loading activity...</Text>
                </View>
              ) : activity.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <ActivityIcon size={28} color="#9CA3AF" strokeWidth={1.6} />
                  <Text style={styles.emptyFeedText}>
                    Your Blueprint is quiet right now — activity will appear here as things happen.
                  </Text>
                </View>
              ) : (
                activity.map((item, i) => (
                  <View key={item.id} style={[styles.feedRow, i < activity.length - 1 && styles.divider]}>
                    <View style={[styles.feedDot, { backgroundColor: item.dot }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedText} numberOfLines={2}>{item.text}</Text>
                      <Text style={styles.feedTime}>{timeAgo(item.at)}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

          </ScrollView>
        </View>
      </View>

      <DestinationPickerModal
        visible={pickerOpen}
        options={pickerOptions}
        slotsLeft={MAX_SHORTCUTS - shortcutKeys.length}
        onPick={handlePick}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.navy },
  layout:  { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 78,
    backgroundColor: colors.navy,
    borderRightWidth: 1,
    borderRightColor: 'rgba(245,240,232,0.09)',
  },
  sidebarLogoWrap: {
    paddingTop: 16, paddingBottom: 16, paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,240,232,0.09)',
  },
  // Small caption clarifying this rail's role — the complete, fixed
  // navigation — distinct from the personalised Quick Access grid below.
  sidebarCaption: {
    fontFamily: fonts.sansSemiBold, fontSize: 8.5,
    color: 'rgba(245,240,232,0.4)', letterSpacing: 1,
    textAlign: 'center', textTransform: 'uppercase',
    marginTop: 10, marginBottom: 2,
  },
  navItemOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 6,
    position: 'relative',
  },
  navHighlight: {
    position: 'absolute',
    top: 5, left: 5, right: 5, bottom: 5,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navLabel: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: 'rgba(245,240,232,0.5)',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 12,
  },
  navLabelActive: { color: 'rgba(245,240,232,0.92)' },

  // Main
  main: { flex: 1, backgroundColor: colors.cream },
  // The header block below is a normal in-flow sibling ABOVE the
  // ScrollView, not an absolutely-positioned overlay — so on a correctly
  // measured screen it never needs to fight the ScrollView for space.
  // The explicit zIndex/elevation here is defensive, not the primary fix:
  // it guarantees the header still paints above scrolled content on
  // Android even during the brief window before layout has fully
  // resolved (first frame, safe-area insets arriving late, etc.), since
  // Android can otherwise let an elevated descendant (e.g. the Live
  // Activity Card's shadow) paint over a plain sibling. The real fix for
  // "header floats/overlaps content" is on the ScrollView itself — see
  // `mainScroll` below.
  mainTopBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
    zIndex: 10, elevation: 10,
  },
  topTitle:    { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, lineHeight: 27 },
  topGreeting: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginTop: 3 },

  portalSwitchRow: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
    alignItems: 'flex-start',
    zIndex: 9, elevation: 9,
  },

  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
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

  // THE fix for the header floating/overlapping content on native: a
  // ScrollView's own `style` sizes its outer, clipped viewport — separate
  // from `contentContainerStyle`, which only styles the inner scrollable
  // content. Without an explicit flex (or fixed height) on `style`,
  // native's Yoga layout has no constraint to size the ScrollView's own
  // frame against, so it sizes the viewport to wrap its content instead of
  // filling the remaining space below mainTopBar/portalSwitchRow — on a
  // long dashboard that's taller than the screen, meaning the (unclipped)
  // ScrollView frame extends up over the header, which paints first and
  // so sits underneath. react-native-web's ScrollView happens to survive
  // this same omission because it's really a `<div style="overflow-y:auto">`
  // — CSS gives a scrollable flex item an automatic minimum size of 0
  // (its content stays internally scrollable) even without a numeric
  // flex-basis, so the exact same missing style silently looks correct
  // in an Expo-web/Playwright check while still being broken on-device.
  // Always pair contentContainerStyle with an explicit `style={{flex:1}}`
  // (or equivalent) on every ScrollView sitting below a fixed header.
  mainScroll: { flex: 1 },
  scroll: { paddingHorizontal: 14, paddingTop: 18 },

  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCaption: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    color: colors.light,
    marginTop: 2,
  },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, marginBottom: 10,
  },
  editHint: { fontFamily: fonts.sans, fontSize: 10, color: colors.light },
  doneBtn: {
    backgroundColor: colors.navy, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },
  livePulse: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },

  // Activity feed
  feedRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  divider:  { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  feedDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  feedText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, lineHeight: 17, flex: 1 },
  feedTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 2 },
  emptyFeed: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 10 },
  emptyFeedText: { fontFamily: fonts.sans, fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
})
