import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Clock, Trash2, Lock, Flag } from 'lucide-react-native'
import LiveMoment from '../components/live/LiveMoment'
import { useReport } from '../components/safety/ReportProvider'
import { fonts, radius } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { MOODS, moodDef } from '../constants/moods'
import { AUDIENCES } from '../constants/pillars'
import { fetchMyReactions, setReaction, clearReaction } from '../lib/feed'
import {
  fetchLiveById, signLivePaths, isLiveNow, timeLeftLabel, markSeen, deleteLive,
} from '../lib/live'

// Watch one Live (full screen, always dark so the picture is the focus).
//
// route.params: { postId }
// Others can watch for 24 hours. A viewer can react with a mood (the same mood
// words as a reaction on any post; tap the same one again to take it back).
// Report and Block are on every Live that is not yours. The poster can open
// their own Live here at any time (including from the archive, when it is
// private) and can delete it.

export default function LiveViewerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { openReport } = useReport()
  const postId = route?.params?.postId

  const [post, setPost] = useState(null)
  const [urls, setUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [myMood, setMyMood] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!postId) { setLoading(false); return }
    try {
      const row = await fetchLiveById(postId)
      setPost(row)
      if (row) {
        const [signed, reactions] = await Promise.all([
          signLivePaths([row.live_path, row.live_front_path]),
          user?.id ? fetchMyReactions([row.id], user.id).catch(() => ({})) : Promise.resolve({}),
        ])
        setUrls(signed)
        setMyMood(reactions[row.id] || null)
        if (user?.id) markSeen(user.id, row.id)
      }
    } catch {
      setPost(null)
    } finally {
      setLoading(false)
    }
  }, [postId, user?.id])

  useEffect(() => { load() }, [load])

  const isMine = !!post && post.user_id === user?.id
  const live = !!post && isLiveNow(post)

  async function react(moodId) {
    if (!post || !user?.id || isMine || !live) return
    const previous = myMood
    const removing = previous === moodId
    setMyMood(removing ? null : moodId)
    setPost(p => p ? { ...p, reaction_count: Math.max(0, (p.reaction_count || 0) + (removing ? -1 : previous ? 0 : 1)) } : p)
    try {
      if (removing) await clearReaction(post.id, user.id)
      else await setReaction(post.id, user.id, moodId)
    } catch {
      setMyMood(previous)
      setError('Could not save your reaction. Please try again.')
    }
  }

  async function remove() {
    if (!post || busy) return
    setBusy(true)
    try {
      await deleteLive(post)
      navigation.goBack()
    } catch {
      setError('Could not delete this Live. Please try again.')
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const name = post?.author_name || 'UniBlueprint member'
  const audienceLabel = post
    ? (post.also_course && post.audience !== 'course'
      ? `${AUDIENCES[post.audience]?.label || 'Course Connect'} and Course Connect`
      : (AUDIENCES[post.audience]?.label || 'Course Connect'))
    : ''

  return (
    <View style={s.screen}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={s.round} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <X size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {!!post && !isMine && (
          <TouchableOpacity
            style={s.round}
            onPress={() => openReport({
              contentType: 'feed_post', contentId: post.id, reportedUserId: post.user_id, userName: post.author_name, noun: 'Live',
            })}
            accessibilityRole="button"
            accessibilityLabel="Report or block"
            hitSlop={8}
          >
            <Flag size={18} color="#fff" strokeWidth={1.9} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#fff" /></View>
      ) : !post ? (
        <View style={s.center}>
          <Clock size={28} color="rgba(255,255,255,0.8)" strokeWidth={1.6} />
          <Text style={s.endTitle}>This Live is no longer available</Text>
          <Text style={s.endBody}>A Live can be watched for 24 hours.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <View style={s.who}>
            <View style={s.avatar}><Text style={s.avatarText}>{initialsOf(name)}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.name} numberOfLines={1}>{isMine ? 'You' : name}</Text>
              <Text style={s.meta} numberOfLines={1}>{audienceLabel}</Text>
            </View>
            <View style={s.timePill}>
              {live ? <Clock size={13} color="#fff" strokeWidth={2} /> : <Lock size={13} color="#fff" strokeWidth={2} />}
              <Text style={s.timeText}>{live ? timeLeftLabel(post) : 'Archived'}</Text>
            </View>
          </View>

          <LiveMoment backUrl={urls[post.live_path]} frontUrl={post.live_front_path ? urls[post.live_front_path] : null} style={s.moment} />

          {!!post.body && <Text style={s.caption}>{post.body}</Text>}

          {isMine ? (
            <View style={s.mineBox}>
              <Text style={s.mineText}>
                {live
                  ? `Others can see this for ${timeLeftLabel(post).replace(' left', '')} more.`
                  : 'Only you can see this. It is in your private archive.'}
              </Text>
              <Text style={s.mineSub}>{post.reaction_count || 0} {(post.reaction_count || 0) === 1 ? 'reaction' : 'reactions'}</Text>
              {confirmDelete ? (
                <View style={s.confirmRow}>
                  <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={remove} disabled={busy} accessibilityRole="button">
                    <Text style={s.btnDangerText}>{busy ? 'Deleting' : 'Delete for good'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btn} onPress={() => setConfirmDelete(false)} accessibilityRole="button">
                    <Text style={s.btnText}>Keep it</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.deleteLink} onPress={() => setConfirmDelete(true)} accessibilityRole="button" accessibilityLabel="Delete this Live">
                  <Trash2 size={15} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
                  <Text style={s.deleteText}>Delete this Live</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : live ? (
            <View style={s.reactBox}>
              <Text style={s.reactTitle}>React with a mood</Text>
              <View style={s.reactRow}>
                {MOODS.map(m => {
                  const on = myMood === m.id
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.moodBtn, on && { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                      onPress={() => react(m.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`React ${m.label}`}
                    >
                      <Text style={s.moodEmoji}>{m.emoji}</Text>
                      <Text style={[s.moodLabel, on && { color: '#0B0F18' }]} numberOfLines={1}>{m.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {!!myMood && <Text style={s.reactHint}>You reacted {moodDef(myMood)?.label}. Tap it again to take it back.</Text>}
            </View>
          ) : null}

          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
      )}
    </View>
  )
}

function initialsOf(name) {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0F18' },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  round: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  endTitle: { fontFamily: fonts.serif, fontSize: 22, color: '#fff', textAlign: 'center' },
  endBody: { fontFamily: fonts.sans, fontSize: 14.5, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  who: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#fff' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  meta: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
  },
  timeText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: '#fff' },
  moment: { width: '100%', aspectRatio: 4 / 5 },
  caption: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: '#fff', marginTop: 16 },

  reactBox: { marginTop: 22, gap: 12 },
  reactTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' },
  reactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  moodEmoji: { fontSize: 18 },
  moodLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: '#fff' },
  reactHint: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' },

  mineBox: { marginTop: 22, gap: 6 },
  mineText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: '#fff' },
  mineSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  deleteLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, alignSelf: 'flex-start', paddingVertical: 6 },
  deleteText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: 'rgba(255,255,255,0.85)' },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.16)' },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: '#fff' },
  btnDanger: { backgroundColor: '#fff' },
  btnDangerText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: '#9B1C1C' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: '#FFB4B4', marginTop: 16, textAlign: 'center' },
})
