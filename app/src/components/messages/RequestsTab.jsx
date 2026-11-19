import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { ShieldCheck, Inbox } from 'lucide-react-native'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Avatar from '../directory/Avatar'
import FollowButton from '../directory/FollowButton'
import ReportButton from '../safety/ReportButton'
import { courseLine, sameCourse } from '../directory/helpers'
import { fonts, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS } from '../../constants/pillars'
import { startDirectChat, fetchRoomContextId } from '../../lib/directMessaging'
import { timeAgo } from './format'

// Message requests: nobody can message you until you accept. connection_requests
// has no message column, so each request shows a plain one-line note about the
// request itself rather than anything the sender wrote.
function RequestCard({ request, person, busy, onAccept, onDecline, onOpenProfile }) {
  const { colors } = useTheme()
  const name = person?.full_name || 'UniBlueprint student'
  const sent = timeAgo(request.created_at)
  return (
    <Card style={s.card}>
      <TouchableOpacity
        style={s.head}
        activeOpacity={person ? 0.7 : 1}
        disabled={!person}
        onPress={() => onOpenProfile(person)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}'s profile`}
      >
        <Avatar person={person || { id: request.requester_id, full_name: name }} size={52} />
        <View style={s.headText}>
          <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
          {!!courseLine(person) && <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={1}>{courseLine(person)}</Text>}
        </View>
      </TouchableOpacity>

      <View style={[s.note, { backgroundColor: colors.tabFill }]}>
        <Text style={[s.noteText, { color: colors.textPrimary }]}>
          Wants to message you{sent ? `, sent ${sent === 'Just now' ? 'just now' : sent === 'Yesterday' ? 'yesterday' : `${sent} ago`}` : ''}
        </Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.action, { backgroundColor: colors.accentBg }]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => onAccept(request, person)}
          accessibilityRole="button"
          accessibilityLabel={`Accept ${name}`}
        >
          {busy ? <ActivityIndicator size="small" color={colors.accentFg} /> : <Text style={[s.actionText, { color: colors.accentFg }]}>Accept</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.action, { backgroundColor: colors.tabFill }]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => onDecline(request)}
          accessibilityRole="button"
          accessibilityLabel={`Decline ${name}`}
        >
          <Text style={[s.actionText, { color: colors.textPrimary }]}>Decline</Text>
        </TouchableOpacity>
        <ReportButton
          size={18}
          style={s.reportBtn}
          target={{ contentType: 'message_request', contentId: request.id, reportedUserId: request.requester_id, userName: name, noun: 'request' }}
          label={`Report or block ${name}`}
        />
      </View>
    </Card>
  )
}

export default function RequestsTab({
  navigation, requestsState, directory, follows, onOpenProfile, bottomPad,
}) {
  const { colors, isDark } = useTheme()
  const { requests, loading, respond } = requestsState
  const [busyId, setBusyId] = useState(null)

  const peopleById = new Map((directory.candidates || []).map(c => [c.id, c]))
  const requesterIds = new Set(requests.map(r => r.requester_id))
  const mayKnow = directory.viewer.course
    ? directory.candidates
        .filter(c => sameCourse(directory.viewer.course, c) && !follows.isFollowing(c.id) && !requesterIds.has(c.id))
        .slice(0, 8)
    : []

  async function handleAccept(request, person) {
    if (busyId) return
    setBusyId(request.id)
    try {
      const { roomId, blocked, error } = await startDirectChat(request.requester_id, person?.full_name)
      if (blocked) {
        Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
        return
      }
      if (error || !roomId) throw error || new Error('No room id returned')
      const { contextId } = await fetchRoomContextId(roomId)
      if (!contextId) throw new Error('Could not resolve the new conversation.')
      const saved = await respond(request.id, 'accepted')
      if (!saved) throw new Error('Could not save')
      navigation.navigate('ChatRoom', {
        contextType: 'direct',
        contextId,
        roomName:    person?.full_name || 'Chat',
        subtitle:    null,
        posterId:    request.requester_id,
        posterName:  person?.full_name || null,
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not accept the request. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDecline(request) {
    if (busyId) return
    setBusyId(request.id)
    const ok = await respond(request.id, 'declined')
    setBusyId(null)
    if (!ok) Alert.alert('Something went wrong', 'Could not decline the request. Please try again.')
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.textPrimary} /></View>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests right now"
          subtitle="When someone wants to message you, it will show up here."
          style={s.empty}
        />
      ) : (
        requests.map(r => (
          <RequestCard
            key={r.id}
            request={r}
            person={peopleById.get(r.requester_id)}
            busy={busyId === r.id}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onOpenProfile={onOpenProfile}
          />
        ))
      )}

      {mayKnow.length > 0 && (
        <View style={s.section}>
          <View style={s.labelRow}>
            <View style={[s.dot, { backgroundColor: PILLARS.course.color }]} />
            <Text style={[s.label, { color: colors.textSecondary }]}>PEOPLE YOU MAY KNOW FROM YOUR COURSE</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {mayKnow.map(p => (
              <View key={p.id} style={[s.mini, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? null : s.miniShadow]}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenProfile(p)} style={s.miniId} accessibilityRole="button">
                  <Avatar person={p} size={44} />
                  <Text style={[s.miniName, { color: colors.textPrimary }]} numberOfLines={1}>{p.full_name || 'Student'}</Text>
                </TouchableOpacity>
                <FollowButton compact following={follows.isFollowing(p.id)} onPress={() => follows.toggleFollow(p.id)} name={p.full_name} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={s.reassure}>
        <ShieldCheck size={16} color={colors.textSecondary} strokeWidth={1.8} />
        <Text style={[s.reassureText, { color: colors.textSecondary }]}>No one can message you until you accept</Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: 8 },
  loading: { alignItems: 'center', paddingVertical: 48 },
  empty: { paddingTop: 24 },

  card: { padding: 18, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headText: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  sub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  note: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  noteText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  reportBtn: { alignSelf: 'center', paddingHorizontal: 6 },

  section: { marginTop: 12, marginHorizontal: -spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.9 },
  hScroll: { paddingHorizontal: spacing.md, gap: 12, paddingVertical: 4 },
  mini: { width: 124, borderRadius: 16, borderWidth: 1, padding: 12, gap: 12 },
  miniShadow: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  miniId: { alignItems: 'center', gap: 4 },
  miniName: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 6, maxWidth: 100 },

  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28 },
  reassureText: { fontFamily: fonts.sans, fontSize: 13 },
})
