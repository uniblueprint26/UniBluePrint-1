import { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  Bell, FileText, Calendar, Star, Megaphone,
  Clock, AlertTriangle, Sun, CreditCard, Archive, Repeat,
  MessageCircle, MessagesSquare, UserCheck, Mail, CheckCheck,
  TrendingUp, CalendarClock, Tag,
} from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader, { HeaderIconButton } from '../components/ui/ScreenHeader'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { goToRelatedEntity } from '../lib/notificationRouting'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

// ── Notification category config ────────────────────────────────────────────
// Keys match public.notifications.category values. 'welcome' and the four
// generic legacy keys (document/session/update/announcement) are kept for
// backward compatibility with existing rows; everything else maps to a
// category introduced by the portals/operations schema.

function getTypeConfig(colors) {
  return {
  welcome:            { Icon: Star,          color: '#15803D', bg: colors.successBg },
  document:           { Icon: FileText,      color: '#1d4ed8', bg: colors.infoBg },
  session:            { Icon: Calendar,      color: '#15803D', bg: colors.successBg },
  update:             { Icon: Star,          color: colors.warning, bg: colors.warningBg },
  announcement:       { Icon: Megaphone,     color: colors.newBadge, bg: '#F5F3FF' },
  checkin_reminder:   { Icon: Clock,         color: '#1d4ed8', bg: colors.infoBg },
  ghost_handler:      { Icon: AlertTriangle, color: colors.warning, bg: colors.warningBg },
  sunday_flock:       { Icon: Sun,           color: colors.warning, bg: colors.warningBg },
  ticket_reassigned:  { Icon: Repeat,        color: colors.newBadge, bg: '#F5F3FF' },
  subscription:       { Icon: CreditCard,    color: '#15803D', bg: colors.successBg },
  wallet:             { Icon: Archive,       color: colors.warning, bg: colors.warningBg },
  foundation_blueprint: { Icon: FileText,    color: '#1d4ed8', bg: colors.infoBg },
  coach_booking:      { Icon: UserCheck,     color: '#15803D', bg: colors.successBg },
  chat_message:       { Icon: MessageCircle, color: '#1d4ed8', bg: colors.infoBg },
  board_reply:        { Icon: MessagesSquare, color: colors.newBadge, bg: '#F5F3FF' },
  coach_enquiry:      { Icon: Mail,          color: '#1d4ed8', bg: colors.infoBg },
  // Pro-only "Weekly Blueprint Report" (subscription-pricing-model.md §1.2)
  // — generated every Monday by generate_weekly_blueprint_reports(), see
  // 20261015130000_weekly_blueprint_report.sql.
  weekly_summary:     { Icon: TrendingUp,    color: colors.newBadge, bg: '#F5F3FF' },
  // Application Tracker's deadline reminder (within 3 days, once per
  // application) — see handle_application_deadline_reminders() in
  // 20261015140000_job_application_tracker.sql.
  job_application_reminder: { Icon: CalendarClock, color: colors.warning, bg: colors.warningBg },
  // A followed Lifestyle Blueprint partner posted a new deal — see
  // notify_followers_of_new_deal() in
  // 20261015140500_partner_follow_notifications.sql.
  partner_deal:       { Icon: Tag,            color: '#B45309', bg: '#FEF3C7' },
  }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ notif, isLast, onPress }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const TYPE_CONFIG = getTypeConfig(colors)
  const cfg = TYPE_CONFIG[notif.category] || TYPE_CONFIG.update
  return (
    <TouchableOpacity
      style={[styles.notifRow, !isLast && styles.notifDivider]}
      activeOpacity={0.75}
      onPress={() => onPress(notif)}
    >
      <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
        <cfg.Icon size={16} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={2}>
          {notif.title}
        </Text>
        {notif.message ? (
          <Text style={styles.notifBody} numberOfLines={2}>{notif.message}</Text>
        ) : null}
        <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Bell size={34} color={colors.textPrimary} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptySub}>
        Notifications from UniBlueprint, your Campus Handler, and your coaches will appear here.
      </Text>
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNotifications() {
    if (!user?.id) { setLoading(false); return }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, category, title, message, read, created_at, related_entity_type, related_entity_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) setNotifications(data)
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { fetchNotifications() }, [user?.id]))

  // Realtime: new notifications (check-in reminders, Ghost Handler welfare
  // checks, Sunday flock, ticket reassignment, subscription changes) appear
  // the moment they're inserted, not just on next screen focus.
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  async function handlePress(notif) {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
    }
    await goToRelatedEntity(navigation, notif, user?.id)
  }

  const hasUnread = notifications.some(n => !n.read)

  async function markAllRead() {
    if (!user?.id || !hasUnread) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  function onRefresh() {
    setRefreshing(true)
    fetchNotifications()
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        compact
        variant="navy"
        onBack={safeGoBack}
        backLabel=""
        title="Notifications"
        titleStyle={styles.topTitle}
        rightAccessory={hasUnread && (
          <HeaderIconButton
            icon={CheckCheck}
            color={colors.chromeFg}
            onPress={markAllRead}
            accessibilityLabel="Mark all as read"
          />
        )}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textPrimary} size="small" />
          </View>
        ) : notifications.length > 0 ? (
          <Card style={styles.notifList}>
            {notifications.map((notif, i) => (
              <NotifRow
                key={notif.id}
                notif={notif}
                isLast={i === notifications.length - 1}
                onPress={handlePress}
              />
            ))}
          </Card>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.chromeFg },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  loadingWrap: { alignItems: 'center', paddingVertical: 48 },

  notifList: { padding: 0 },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  notifDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },

  notifIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  notifContent: { flex: 1 },
  notifTitle:   { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  notifTitleUnread: { fontFamily: fonts.sansSemiBold },
  notifBody:    { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  notifTime:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 4 },

  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B', flexShrink: 0, marginTop: 6,
  },

  emptyWrap: {
    alignItems: 'center', paddingHorizontal: 32, paddingTop: 48,
  },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  emptyTitle: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary,
    marginBottom: 12, textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    lineHeight: 22, textAlign: 'center',
  },
  })
}
