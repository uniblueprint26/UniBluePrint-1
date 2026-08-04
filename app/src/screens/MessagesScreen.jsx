import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MessageSquare, Users, ChevronRight, Pencil } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ── Shell conversations (replace with live Supabase query when messages launch) ─
const CONVERSATIONS = [
  {
    id: 1,
    name: 'UniBlueprint Team',
    initials: 'UB',
    initBg: colors.navy,
    preview: 'Your CV review is ready to view. Here is what our team found...',
    time: '2m',
    unread: true,
    unreadCount: 2,
  },
  {
    id: 2,
    name: 'Elevation Support',
    initials: 'ES',
    initBg: '#0369A1',
    preview: 'Your coaching session is confirmed for Wednesday at 3pm.',
    time: '1h',
    unread: false,
    unreadCount: 0,
  },
  {
    id: 3,
    name: 'Aoife Keogh',
    initials: 'AK',
    initBg: '#7C3AED',
    preview: 'Happy to set up a call to talk through your portfolio. Let me know what works.',
    time: 'Yesterday',
    unread: true,
    unreadCount: 1,
  },
  {
    id: 4,
    name: 'Course Connect',
    initials: 'CC',
    initBg: '#15803D',
    preview: 'A student replied to your Business Law module notes.',
    time: 'Mon',
    unread: false,
    unreadCount: 0,
  },
]

// ── Conversation row ──────────────────────────────────────────────────────────

function ConversationRow({ conv, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.convRow, !isLast && styles.convDivider]}
      activeOpacity={0.72}
    >
      {/* Avatar */}
      <View style={styles.convAvatarWrap}>
        <View style={[styles.convAvatar, { backgroundColor: conv.initBg }]}>
          <Text style={styles.convAvatarText}>{conv.initials}</Text>
        </View>
        {conv.unread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.convContent}>
        <View style={styles.convNameRow}>
          <Text
            style={[styles.convName, conv.unread && styles.convNameUnread]}
            numberOfLines={1}
          >
            {conv.name}
          </Text>
          <Text style={[styles.convTime, conv.unread && styles.convTimeUnread]}>
            {conv.time}
          </Text>
        </View>
        <View style={styles.convPreviewRow}>
          <Text
            style={[styles.convPreview, conv.unread && styles.convPreviewUnread]}
            numberOfLines={1}
          >
            {conv.preview}
          </Text>
          {conv.unread && conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onDirectoryPress, onConnectPress }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <MessageSquare size={34} color={colors.navy} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySub}>
        When you connect with coaches, campus handlers, or other young people, your conversations will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyPrimaryBtn}
        onPress={onDirectoryPress}
        activeOpacity={0.8}
      >
        <Users size={16} color={colors.cream} strokeWidth={1.8} />
        <Text style={styles.emptyPrimaryBtnText}>Browse the Directory</Text>
        <ChevronRight size={14} color={colors.cream} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.emptySecondaryBtn}
        onPress={onConnectPress}
        activeOpacity={0.8}
      >
        <Text style={styles.emptySecondaryBtnText}>Explore Campus Connect</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  const hasConversations = CONVERSATIONS.length > 0

  function goToDirectory() {
    navigation.getParent()?.navigate('Directory')
  }

  function goToConnect() {
    navigation.getParent()?.navigate('Home')
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <UBPLogo height={28} color={colors.cream} />
        <TouchableOpacity style={styles.composeBtn} activeOpacity={0.8}>
          <Pencil size={16} color={colors.cream} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Messages</Text>
        <Text style={styles.screenSub}>
          {hasConversations
            ? `${CONVERSATIONS.filter(c => c.unread).length} unread`
            : 'Direct messages with coaches and young people'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {hasConversations ? (
          <Card style={styles.convList}>
            {CONVERSATIONS.map((conv, i) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                isLast={i === CONVERSATIONS.length - 1}
              />
            ))}
          </Card>
        ) : (
          <EmptyState
            onDirectoryPress={goToDirectory}
            onConnectPress={goToConnect}
          />
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
    paddingTop: 14, paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  headingWrap: {
    paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10,
  },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: 4 },

  // Conversation list
  convList: { padding: 0 },

  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  convDivider: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)',
  },

  convAvatarWrap: { position: 'relative', flexShrink: 0 },
  convAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  convAvatarText: { fontFamily: fonts.serif, fontSize: 16, color: colors.cream },
  unreadDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 2, borderColor: colors.white,
  },

  convContent: { flex: 1, minWidth: 0 },
  convNameRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  convName: {
    fontFamily: fonts.sansMedium, fontSize: 15, color: colors.navy,
    flex: 1, marginRight: 8,
  },
  convNameUnread: { fontFamily: fonts.sansSemiBold },
  convTime:        { fontFamily: fonts.sans, fontSize: 11, color: colors.light, flexShrink: 0 },
  convTimeUnread:  { color: colors.muted },

  convPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convPreview: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.light,
    flex: 1, lineHeight: 18,
  },
  convPreviewUnread: { color: colors.muted },

  unreadBadge: {
    backgroundColor: colors.navy, borderRadius: 9999,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, flexShrink: 0,
  },
  unreadBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.cream },

  // Empty state
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
    lineHeight: 22, textAlign: 'center', marginBottom: 32,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 22, paddingVertical: 14,
    marginBottom: 12, width: '100%', justifyContent: 'center',
  },
  emptyPrimaryBtnText: {
    fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream,
  },
  emptySecondaryBtn: {
    paddingVertical: 12,
  },
  emptySecondaryBtnText: {
    fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted,
  },
})
