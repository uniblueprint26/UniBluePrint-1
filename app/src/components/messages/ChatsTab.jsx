import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { MessageSquare, Pin } from 'lucide-react-native'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import { fonts, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS } from '../../constants/pillars'
import { avatarColorFor } from '../directory/helpers'
import { timeAgo, roomInitials } from './format'
import ErrorState from '../ui/ErrorState'

// Pinned rows come from the user's real rooms only: a society chat (a Campus
// Connect club room) and a course group chat (a Course Connect board room).
// Nothing is invented: if the user is not in one, there is no pinned row.
function pinKind(room) {
  if (room.contextType !== 'board') return null
  const id = String(room.contextId || '')
  if (id.startsWith('clubs-')) return { label: 'Society chat', color: PILLARS.campus.color }
  if (id.startsWith('course-boards-')) return { label: 'Course group', color: PILLARS.course.color }
  return null
}

function avatarBg(room) {
  const kind = pinKind(room)
  if (kind) return kind.color
  return avatarColorFor(room.otherUserId || room.id)
}

function Row({ room, pin, isLast, onPress }) {
  const { colors } = useTheme()
  const unread = room.unreadCount > 0
  return (
    <TouchableOpacity
      style={[s.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}
      activeOpacity={0.72}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${room.name}${unread ? ', unread' : ''}`}
    >
      <View style={[s.avatar, { backgroundColor: avatarBg(room) }]}>
        <Text style={s.avatarText}>{roomInitials(room.name)}</Text>
      </View>
      <View style={s.body}>
        <View style={s.line}>
          <Text style={[s.name, { color: colors.textPrimary, fontFamily: unread ? fonts.sansBold : fonts.sansSemiBold }]} numberOfLines={1}>{room.name}</Text>
          <Text style={[s.time, { color: unread ? colors.textPrimary : colors.textTertiary }]}>{timeAgo(room.lastMessageAt)}</Text>
        </View>
        {!!pin && (
          <View style={s.pinRow}>
            <Pin size={11} color={pin.color} strokeWidth={2} />
            <Text style={[s.pinLabel, { color: pin.color }]}>{pin.label}</Text>
          </View>
        )}
        <View style={s.line}>
          <Text style={[s.preview, { color: unread ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
            {room.lastMessage ? `${room.lastAuthor ? `${room.lastAuthor}: ` : ''}${room.lastMessage}` : 'No messages yet'}
          </Text>
          {unread && <View style={[s.unreadDot, { backgroundColor: colors.accentBg }]} accessibilityLabel="Unread" />}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function ChatsTab({ rooms, loading, failed, onRetry, onOpenRoom, onFindPeople, bottomPad }) {
  const { colors } = useTheme()

  if (loading) {
    return <View style={s.loading}><ActivityIndicator color={colors.textPrimary} /></View>
  }
  if (rooms.length === 0 && failed) {
    return <ErrorState title="Could not load your chats" onRetry={onRetry} />
  }
  if (rooms.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <EmptyState
          icon={MessageSquare}
          title="No chats yet"
          subtitle="Join a board or a carpool route, or find people in Discover, and your chats will show up here."
          ctaLabel="Find your people"
          onCtaPress={onFindPeople}
        />
      </ScrollView>
    )
  }

  // At most one pinned row of each kind, so the top stays calm.
  const pinned = []
  for (const r of rooms) {
    const kind = pinKind(r)
    if (kind && !pinned.some(p => p.kind.label === kind.label)) pinned.push({ room: r, kind })
  }
  const pinnedIds = new Set(pinned.map(p => p.room.id))
  const rest = rooms.filter(r => !pinnedIds.has(r.id))

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
      {pinned.length > 0 && (
        <Card style={s.card}>
          {pinned.map((p, i) => (
            <Row key={p.room.id} room={p.room} pin={p.kind} isLast={i === pinned.length - 1} onPress={() => onOpenRoom(p.room)} />
          ))}
        </Card>
      )}
      {rest.length > 0 && (
        <Card style={s.card}>
          {rest.map((r, i) => (
            <Row key={r.id} room={r} isLast={i === rest.length - 1} onPress={() => onOpenRoom(r)} />
          ))}
        </Card>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: 8, gap: 16 },
  loading: { alignItems: 'center', paddingVertical: 48 },
  card: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18, paddingHorizontal: 18 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serif, fontSize: 18, color: '#FFFFFF' },
  body: { flex: 1, minWidth: 0, gap: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 16 },
  time: { fontFamily: fonts.sans, fontSize: 12 },
  preview: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pinLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.3 },
})
