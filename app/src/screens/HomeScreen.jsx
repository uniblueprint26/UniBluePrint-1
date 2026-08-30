import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Bell, User, FileText, TrendingUp, Building2,
  Heart, Globe, Compass, Calculator, Megaphone,
  ChevronRight, ChevronUp, ChevronDown, Pencil,
  LayoutGrid, MessageSquare, Users, X,
} from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import PortalSwitcher from '../components/ui/PortalSwitcher'
import ActiveMemberBadge from '../components/ui/ActiveMemberBadge'
import { colors, fonts, spacing } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── Constants ────────────────────────────────────────────────────────────────

const SHORTCUTS_KEY = '@ubp:quick_shortcuts_v1'
const DEFAULT_SHORTCUTS = ['foundation', 'elevation', 'campus', 'course']

// All possible Quick Access destinations
const ALL_SHORTCUTS = [
  { key: 'foundation', label: 'Foundation Blueprint', sub: 'CVs, cover letters, statements', Icon: FileText,      bg: '#EFF6FF', action: 'foundation' },
  { key: 'elevation',  label: 'Elevation Blueprint',  sub: 'Coaching and mentorship',        Icon: TrendingUp,    bg: '#F0FDF4', action: 'elevation'  },
  { key: 'lifestyle',  label: 'Lifestyle Blueprint',  sub: 'Deals and mental health',        Icon: Heart,         bg: '#FDF4FF', action: 'lifestyle'  },
  { key: 'campus',     label: 'Campus Connect',       sub: 'Boards, events, carpooling',     Icon: Building2,     bg: '#FFF7ED', action: 'campus_connect' },
  { key: 'course',     label: 'Course Connect',       sub: 'Notes and study groups',         Icon: Globe,         bg: '#F0F9FF', action: 'course_connect' },
  { key: 'compass',    label: 'Compass',              sub: 'Course guidance tools',          Icon: Compass,       bg: '#F5F0E8', action: 'compass' },
  { key: 'budgeting',  label: 'Budgeting',            sub: 'Budget tools and SUSI guide',    Icon: Calculator,    bg: '#F0FDF4', action: 'budgeting' },
  { key: 'adboard',    label: 'Ad Board',             sub: 'Weekly magazine, blog, and marketplace', Icon: Megaphone, bg: '#FFF7ED', action: 'tab',       tabName: 'AdBoard' },
  { key: 'messages',   label: 'Messages',             sub: 'Direct messages',                Icon: MessageSquare, bg: '#F0F9FF', action: 'tab',       tabName: 'Messages' },
  { key: 'directory',  label: 'Directory',            sub: 'People directory',               Icon: Users,         bg: '#EFF6FF', action: 'tab',       tabName: 'Directory' },
  { key: 'profile',    label: 'Profile',              sub: 'Your profile and settings',      Icon: User,          bg: '#FDF4FF', action: 'tab',       tabName: 'Profile' },
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

// Activity type dot colours
const ACTIVITY_DOT = {
  document_submitted: '#F59E0B',
  handler_review:     '#16A34A',
  session_booked:     colors.navy,
  note_saved:         '#2E6DB4',
  ad_posted:          '#7C3AED',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(displayName) {
  if (!displayName) return 'there'
  return displayName.split(' ')[0]
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Edit Shortcuts Modal ─────────────────────────────────────────────────────

function EditShortcutsModal({ visible, selected, onSave, onClose }) {
  const [local, setLocal] = useState(selected)

  useEffect(() => {
    if (visible) setLocal(selected)
  }, [visible, selected])

  function moveUp(i) {
    if (i === 0) return
    const next = [...local]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setLocal(next)
  }

  function moveDown(i) {
    if (i === local.length - 1) return
    const next = [...local]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setLocal(next)
  }

  function remove(key) { setLocal(local.filter(k => k !== key)) }

  function add(key) {
    if (local.length >= 4) return
    setLocal([...local, key])
  }

  const selectedItems = local.map(k => ALL_SHORTCUTS.find(s => s.key === k)).filter(Boolean)
  const available     = ALL_SHORTCUTS.filter(s => !local.includes(s.key))
  const isFull        = local.length >= 4

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <View>
            <Text style={m.headerTitle}>Quick Access</Text>
            <Text style={m.headerSub}>Choose up to 4 shortcuts. Reorder with arrows.</Text>
          </View>
          <TouchableOpacity style={m.doneBtn} onPress={() => onSave(local)} activeOpacity={0.8}>
            <Text style={m.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Selected shortcuts */}
          <Text style={m.sectionLabel}>YOUR SHORTCUTS ({local.length}/4)</Text>

          {selectedItems.length === 0 && (
            <Text style={m.emptyHint}>No shortcuts selected. Add some below.</Text>
          )}

          {selectedItems.map((item, i) => (
            <View key={item.key} style={m.selectedRow}>
              <View style={[m.rowIcon, { backgroundColor: item.bg }]}>
                <item.Icon size={16} color={colors.navy} />
              </View>
              <Text style={m.rowLabel} numberOfLines={1}>{item.label}</Text>
              <View style={m.rowActions}>
                <TouchableOpacity onPress={() => moveUp(i)} style={m.arrowBtn} disabled={i === 0}>
                  <ChevronUp size={16} color={i === 0 ? colors.light : colors.navy} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(i)} style={m.arrowBtn} disabled={i === selectedItems.length - 1}>
                  <ChevronDown size={16} color={i === selectedItems.length - 1 ? colors.light : colors.navy} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.key)} style={m.removeBtn}>
                  <X size={13} color="#DC2626" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Available to add */}
          {available.length > 0 && (
            <>
              <Text style={[m.sectionLabel, { marginTop: 28 }]}>ADD SHORTCUT</Text>
              {isFull && (
                <Text style={m.emptyHint}>Remove one above before adding another.</Text>
              )}
              {available.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[m.availableRow, isFull && { opacity: 0.38 }]}
                  onPress={() => add(item.key)}
                  disabled={isFull}
                  activeOpacity={0.75}
                >
                  <View style={[m.rowIcon, { backgroundColor: item.bg }]}>
                    <item.Icon size={16} color={colors.navy} />
                  </View>
                  <Text style={m.rowLabel}>{item.label}</Text>
                  <View style={m.addChip}>
                    <Text style={m.addChipText}>+ Add</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const m = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    padding: 20, paddingTop: 28, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  headerSub:   { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.6)', marginTop: 4 },
  doneBtn: {
    backgroundColor: colors.cream, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 9, marginTop: 4,
  },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 10,
  },
  emptyHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 19 },

  selectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  availableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  rowIcon:    { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:   { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  arrowBtn:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeBtn:  {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  addChip: {
    backgroundColor: colors.navy, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  addChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },
})

// ── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const {
    user, isAnyPortalEligible, isHandler, isFounder, isOperations, isBusiness,
    studioLabel, isComplimentaryPro, portalMode, setPortalMode,
  } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const firstName   = getFirstName(displayName)

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

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Quick Access state
  const [shortcuts, setShortcuts]     = useState(DEFAULT_SHORTCUTS)
  const [editVisible, setEditVisible] = useState(false)

  // Sidebar active key — reset to dashboard whenever this screen regains focus
  const [activeNavKey, setActiveNavKey] = useState('dashboard')
  useFocusEffect(useCallback(() => {
    setActiveNavKey('dashboard')
  }, []))

  // Live activity state
  const [activity, setActivity]             = useState([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  // Load persisted shortcuts
  useEffect(() => {
    AsyncStorage.getItem(SHORTCUTS_KEY).then(val => {
      if (val) {
        try { setShortcuts(JSON.parse(val)) } catch {}
      }
    })
  }, [])

  // Load live activity from Supabase
  useEffect(() => {
    if (!user?.id) { setLoadingActivity(false); return }
    fetchActivity()
  }, [user?.id])

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

  async function fetchActivity() {
    setLoadingActivity(true)
    try {
      const { data, error } = await supabase
        .from('activity_events')
        .select('id, type, title, detail, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)
      if (!error && data) setActivity(data)
    } catch {}
    finally { setLoadingActivity(false) }
  }

  async function saveShortcuts(newKeys) {
    setShortcuts(newKeys)
    setEditVisible(false)
    await AsyncStorage.setItem(SHORTCUTS_KEY, JSON.stringify(newKeys))
  }

  function handleNav(item) {
    if (!item) return
    if (item.action === 'home') { setActiveNavKey('dashboard'); return }
    setActiveNavKey(item.key)
    if      (item.action === 'foundation')     navigation.navigate('Foundation')
    else if (item.action === 'elevation')      navigation.navigate('Elevation')
    else if (item.action === 'campus_connect') navigation.navigate('CampusConnect')
    else if (item.action === 'course_connect') navigation.navigate('CourseConnect')
    else if (item.action === 'lifestyle')      navigation.navigate('Lifestyle')
    else if (item.action === 'compass')    navigation.navigate('Compass')
    else if (item.action === 'budgeting')  navigation.navigate('Budgeting')
    else if (item.action === 'tab')        navigation.getParent()?.navigate(item.tabName)
    else if (item.action === 'external')   Linking.openURL(item.url)
  }

  const currentShortcutItems = shortcuts
    .map(k => ALL_SHORTCUTS.find(s => s.key === k))
    .filter(Boolean)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.layout}>

        {/* ── SIDEBAR ── */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoWrap}>
            <UBPLogo height={30} color={colors.cream} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.key === activeNavKey
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.navItemOuter}
                  activeOpacity={0.65}
                  onPress={() => handleNav(item)}
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
              <Text style={styles.topGreeting} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              <Text style={styles.topTitle} numberOfLines={1}>
                {firstName}'s UniBlueprint Dashboard
              </Text>
              {isComplimentaryPro && <ActiveMemberBadge style={{ marginTop: 6 }} />}
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notifications')}
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
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Access */}
            <View style={styles.sectionRow}>
              <Text style={styles.eyebrow}>Quick Access</Text>
              <TouchableOpacity onPress={() => setEditVisible(true)} style={styles.editIconBtn} activeOpacity={0.7}>
                <Pencil size={13} color={colors.muted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardRow}>
              {currentShortcutItems.slice(0, 2).map(card => (
                <TouchableOpacity
                  key={card.key}
                  style={[styles.quickCard, { backgroundColor: card.bg }]}
                  activeOpacity={0.8}
                  onPress={() => handleNav(card)}
                >
                  <View style={styles.quickIconWrap}>
                    <card.Icon size={17} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={2}>{card.label}</Text>
                  <Text style={styles.quickSub} numberOfLines={2}>{card.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.cardRow, { marginBottom: 24 }]}>
              {currentShortcutItems.slice(2, 4).map(card => (
                <TouchableOpacity
                  key={card.key}
                  style={[styles.quickCard, { backgroundColor: card.bg }]}
                  activeOpacity={0.8}
                  onPress={() => handleNav(card)}
                >
                  <View style={styles.quickIconWrap}>
                    <card.Icon size={17} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={2}>{card.label}</Text>
                  <Text style={styles.quickSub} numberOfLines={2}>{card.sub}</Text>
                </TouchableOpacity>
              ))}
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
                <View style={[styles.feedRow, { paddingVertical: 18 }]}>
                  <Text style={[styles.feedText, { color: colors.muted }]}>
                    No activity yet. Complete your first action to see it here.
                  </Text>
                </View>
              ) : (
                activity.map((item, i) => (
                  <View key={item.id} style={[styles.feedRow, i < activity.length - 1 && styles.divider]}>
                    <View style={[styles.feedDot, { backgroundColor: ACTIVITY_DOT[item.type] ?? colors.navy }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedText} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.feedTime}>{timeAgo(item.created_at)}</Text>
                    </View>
                    <ChevronRight size={13} color={colors.light} />
                  </View>
                ))
              )}
            </Card>

          </ScrollView>
        </View>
      </View>

      <EditShortcutsModal
        visible={editVisible}
        selected={shortcuts}
        onSave={saveShortcuts}
        onClose={() => setEditVisible(false)}
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
  mainTopBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  topGreeting: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  topTitle:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  portalSwitchRow: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
    alignItems: 'flex-start',
  },

  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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

  scroll: { paddingHorizontal: 14, paddingTop: 18 },

  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10,
  },
  editIconBtn: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  livePulse: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },

  // Quick cards
  cardRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickCard: {
    flex: 1, borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.07)',
    minHeight: 112,
  },
  quickIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, lineHeight: 16, marginBottom: 4 },
  quickSub:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, lineHeight: 14 },

  // Activity feed
  feedRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  divider:  { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  feedDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  feedText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, lineHeight: 17, flex: 1 },
  feedTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 2 },
})
