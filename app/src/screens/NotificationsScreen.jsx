import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, ChevronLeft, FileText, Calendar, Star, Megaphone } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ── Notification type config ──────────────────────────────────────────────────

const TYPE_CONFIG = {
  document:    { Icon: FileText,  color: '#1d4ed8', bg: '#EFF6FF' },
  session:     { Icon: Calendar,  color: '#15803D', bg: '#F0FDF4' },
  update:      { Icon: Star,      color: '#B45309', bg: '#FEF3C7' },
  announcement:{ Icon: Megaphone, color: '#7C3AED', bg: '#F5F3FF' },
}

// ── Shell notifications (replace with live Supabase query when ready) ─────────

const NOTIFICATIONS = []   // empty — no live notifications yet

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({ notif, isLast }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.update
  return (
    <TouchableOpacity
      style={[styles.notifRow, !isLast && styles.notifDivider]}
      activeOpacity={0.75}
    >
      <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
        <cfg.Icon size={16} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={2}>
          {notif.title}
        </Text>
        {notif.body ? (
          <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
        ) : null}
        <Text style={styles.notifTime}>{notif.time}</Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Bell size={34} color={colors.navy} strokeWidth={1.4} />
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
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATIONS.length > 0 ? (
          <Card style={styles.notifList}>
            {NOTIFICATIONS.map((notif, i) => (
              <NotifRow
                key={notif.id}
                notif={notif}
                isLast={i === NOTIFICATIONS.length - 1}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

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
  notifTitle:   { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, lineHeight: 20 },
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
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  emptyTitle: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.navy,
    marginBottom: 12, textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    lineHeight: 22, textAlign: 'center',
  },
})
