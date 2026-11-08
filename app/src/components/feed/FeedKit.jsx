import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Modal, Linking, ScrollView,
} from 'react-native'
import { Camera, Smile, ExternalLink, Users, MessageCircle, Send, Bookmark } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'
import { MOODS, moodDef } from '../../constants/moods'
import { BUZZ_WINDOWS, CAMPUS_PULSE_MIN_THREADS } from '../../lib/feed'
import { avatarColorFor, initialsFor } from '../../screens/DirectoryScreen'

// ── shared helpers ───────────────────────────────────────────────────────────

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

const AVATAR_BG = ['#FFF7ED', '#F0F9FF', '#FDF4FF', '#F0FDF4', '#EFF6FF', '#FEF2F2']
function avatarBgFor(seed) {
  let hash = 0
  for (const ch of seed || '') hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_BG.length
  return AVATAR_BG[Math.abs(hash)]
}

// ── Composer entry bar ───────────────────────────────────────────────────────

export function ComposerEntryBar({ name, onPress }) {
  return (
    <TouchableOpacity style={k.composerBar} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Start a new post">
      <View style={k.composerAvatar}><Text style={k.composerAvatarText}>{initialsOf(name)}</Text></View>
      <Text style={k.composerPlaceholder}>Share your mood or a snapshot…</Text>
      <View style={k.composerCameraWrap}>
        <Camera size={15} color={colors.navy} strokeWidth={1.9} />
      </View>
    </TouchableOpacity>
  )
}

// ── Buzz strip (filter chips) ────────────────────────────────────────────────

export function BuzzStrip({ selected, onSelect }) {
  return (
    <View style={k.buzzRow}>
      <Text style={k.buzzEyebrow}>This Week's Buzz</Text>
      <View style={k.buzzChipsRow}>
        {BUZZ_WINDOWS.map(w => {
          const active = w.id === selected
          return (
            <TouchableOpacity
              key={w.id}
              onPress={() => onSelect(w.id)}
              style={[k.buzzChip, active && k.buzzChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[k.buzzChipText, active && k.buzzChipTextActive]}>{w.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ── Campus Pulse ─────────────────────────────────────────────────────────────

export function CampusPulse({ pulse }) {
  const total = pulse?.total || 0
  const hasEnoughData = total >= CAMPUS_PULSE_MIN_THREADS

  return (
    <View style={k.pulseWrap}>
      <Text style={k.buzzEyebrow}>Campus Pulse</Text>
      {hasEnoughData ? (
        <>
          <View style={k.pulseBar}>
            {MOODS.map(m => {
              const count = pulse.counts[m.id] || 0
              const share = count / total
              if (share <= 0) return null
              return <View key={m.id} style={{ flex: share, backgroundColor: m.color }} />
            })}
          </View>
          <View style={k.pulseLegend}>
            {MOODS.map(m => (
              <View key={m.id} style={k.pulseLegendItem}>
                <View style={[k.pulseLegendDot, { backgroundColor: m.color }]} />
                <Text style={k.pulseLegendText}>{m.emoji} {m.label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={k.pulsePlaceholder}>
          <Text style={k.pulsePlaceholderText}>This is where your Campus Pulse will show</Text>
        </View>
      )}
    </View>
  )
}

// ── Mood reaction picker (bottom sheet) ─────────────────────────────────────

export function MoodPickerSheet({ visible, currentMood, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={k.sheetBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={k.sheet} onPress={() => {}}>
          <Text style={k.sheetTitle}>React with a mood</Text>
          <View style={k.sheetGrid}>
            {MOODS.map(m => {
              const selected = m.id === currentMood
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    k.sheetChip,
                    selected ? { backgroundColor: m.bg, borderColor: m.color } : { backgroundColor: colors.white, borderColor: 'rgba(30,58,95,0.12)' },
                  ]}
                  onPress={() => onPick(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={k.sheetEmoji}>{m.emoji}</Text>
                  <Text style={[k.sheetLabel, { color: selected ? m.color : colors.navy }]}>{m.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Reaction pill (shared by post + highlight cards) ────────────────────────

function ReactionPill({ myMood, count, onPress }) {
  const def = myMood ? moodDef(myMood) : null
  return (
    <TouchableOpacity
      style={[k.reactPill, def ? { backgroundColor: def.bg, borderColor: def.color } : null]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {def ? <Text style={k.reactPillEmoji}>{def.emoji}</Text> : <Smile size={15} color={colors.muted} strokeWidth={1.8} />}
      <Text style={[k.reactPillText, def ? { color: def.color } : null]}>
        {count > 0 ? count : 'React'}
      </Text>
    </TouchableOpacity>
  )
}

// ── Engagement row (reaction pill, comment, share, save) ───────────────────
// The reaction pill (a mood) IS the "Like" mechanic — never a second plain
// heart alongside it. Comment/Send/Save are purely additive.
//
// Post (photo+caption) leans Instagram: icon-only Comment/Send, Save pushed
// to the far right. Thread (mood+text) leans Twitter: everything stays in
// one tight left-aligned run, Save included — per the founder's "instagramy
// twitter vibe" direction, the two post shapes read a little differently
// rather than forcing one identical engagement bar on both.

function EngagementRow({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isPost = post.post_type === 'post'

  function handlePick(moodId) {
    setSheetOpen(false)
    onReact(post.id, moodId === myMood ? null : moodId)
  }

  return (
    <>
      <View style={[k.engagementRow, isPost && { paddingTop: 12 }]}>
        <ReactionPill myMood={myMood} count={post.reaction_count} onPress={() => setSheetOpen(true)} />
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onComment?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Comment, ${commentCount || 0}`}
        >
          <MessageCircle size={17} color={colors.muted} strokeWidth={1.8} />
          {commentCount > 0 && <Text style={k.engageBtnText}>{commentCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onShare?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Send size={16} color={colors.muted} strokeWidth={1.8} />
        </TouchableOpacity>
        {isPost && <View style={{ flex: 1 }} />}
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onToggleSave?.(post.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from Saved Posts' : 'Save post'}
          accessibilityState={{ selected: !!saved }}
        >
          <Bookmark
            size={17}
            color={saved ? colors.gold : colors.muted}
            fill={saved ? colors.gold : 'transparent'}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      </View>
      <MoodPickerSheet visible={sheetOpen} currentMood={myMood} onPick={handlePick} onClose={() => setSheetOpen(false)} />
    </>
  )
}

// ── Post header (avatar, name, mood badge, timestamp) ───────────────────────

function PostHeader({ post }) {
  const mood = post.mood ? moodDef(post.mood) : null
  const name = post.author_name || 'UniBlueprint member'
  return (
    <View style={k.cardHeaderRow}>
      <View style={[k.avatar, { backgroundColor: avatarBgFor(post.user_id) }]}>
        <Text style={k.avatarText}>{initialsOf(name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={k.nameMoodRow}>
          <Text style={k.name} numberOfLines={1}>{name}</Text>
          {mood && (
            <View style={[k.moodBadge, { backgroundColor: mood.bg }]}>
              <Text style={[k.moodBadgeText, { color: mood.color }]}>{mood.emoji} {mood.label}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={k.timestamp}>{timeAgo(post.created_at)}</Text>
    </View>
  )
}

// ── Main feed post card (Post or Thread) ────────────────────────────────────

export function FeedPostCard({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave }) {
  return (
    <View style={k.card}>
      <View style={{ padding: spacing.md }}>
        <PostHeader post={post} />
        {!!post.body && <Text style={k.bodyText}>{post.body}</Text>}
      </View>
      {post.post_type === 'post' && !!post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={k.photo} resizeMode="cover" />
      )}
      <EngagementRow
        post={post}
        myMood={myMood}
        onReact={onReact}
        commentCount={commentCount}
        saved={saved}
        onComment={onComment}
        onShare={onShare}
        onToggleSave={onToggleSave}
      />
    </View>
  )
}

// ── Buzzing highlight card ───────────────────────────────────────────────────

export function BuzzingHighlightCard({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave }) {
  return (
    <View style={[k.card, k.highlightCard]}>
      <View style={k.highlightBadge}>
        <Text style={k.highlightBadgeText}>🔥 Buzzing</Text>
      </View>
      <View style={{ padding: spacing.md }}>
        <PostHeader post={post} />
        {!!post.body && <Text style={k.bodyText}>{post.body}</Text>}
      </View>
      {post.post_type === 'post' && !!post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={k.photo} resizeMode="cover" />
      )}
      <EngagementRow
        post={post}
        myMood={myMood}
        onReact={onReact}
        commentCount={commentCount}
        saved={saved}
        onComment={onComment}
        onShare={onShare}
        onToggleSave={onToggleSave}
      />
    </View>
  )
}

// ── Promoted placement ("Ad") card ───────────────────────────────────────────

export function AdCard({ placement }) {
  const hasCta = !!placement.cta_label && !!placement.cta_url
  return (
    <View style={[k.card, k.adCard]}>
      <View style={k.adLabelRow}>
        <View style={k.adLabel}><Text style={k.adLabelText}>Ad</Text></View>
        <Text style={k.adSponsor} numberOfLines={1}>{placement.sponsor_name}</Text>
      </View>
      <Text style={k.adTitle}>{placement.title}</Text>
      {!!placement.body && <Text style={k.adBody}>{placement.body}</Text>}
      {!!placement.image_url && (
        <Image source={{ uri: placement.image_url }} style={k.adImage} resizeMode="cover" />
      )}
      {hasCta && (
        <TouchableOpacity style={k.adCtaBtn} onPress={() => Linking.openURL(placement.cta_url)} activeOpacity={0.85}>
          <Text style={k.adCtaText}>{placement.cta_label}</Text>
          <ExternalLink size={13} color={colors.cream} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Suggested profiles card ──────────────────────────────────────────────────
// Reuses DirectoryScreen's get_directory_profiles() candidates (already
// discoverable/block-filtered) and its own avatarColorFor/initialsFor, so a
// person renders identically here and in the Directory. Connect re-plays
// DirectoryScreen's own "start a direct chat" flow via the handlers passed
// down from HomeScreen.

export function SuggestedProfilesCard({ profiles, connectingId, onConnect, onViewProfile }) {
  if (!profiles?.length) return null
  return (
    <View style={[k.card, k.suggestedCard]}>
      <View style={k.suggestedEyebrowRow}>
        <Users size={13} color={colors.muted} strokeWidth={1.9} />
        <Text style={k.suggestedEyebrow}>Suggested for you</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={k.suggestedRow}>
        {profiles.map(p => (
          <View key={p.id} style={k.suggestedChip}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => onViewProfile?.(p)}>
              <View style={[k.suggestedAvatar, { backgroundColor: avatarColorFor(p.id) }]}>
                <Text style={k.suggestedAvatarText}>{initialsFor(p.full_name)}</Text>
              </View>
              <Text style={k.suggestedName} numberOfLines={1}>{p.full_name || 'UniBlueprint member'}</Text>
              {!!p.course && <Text style={k.suggestedMeta} numberOfLines={1}>{p.course}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={k.suggestedConnectBtn}
              activeOpacity={0.85}
              disabled={connectingId === p.id}
              onPress={() => onConnect?.(p)}
            >
              <Text style={k.suggestedConnectText}>{connectingId === p.id ? 'Connecting…' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const k = StyleSheet.create({
  composerBar: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    paddingVertical: 9, paddingHorizontal: 10, paddingLeft: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    ...shadows.card,
  },
  composerAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  composerAvatarText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.cream },
  composerPlaceholder: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.light },
  composerCameraWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  buzzRow: { marginTop: 22 },
  buzzEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  buzzChipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  buzzChip: {
    borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7,
    backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
  },
  buzzChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  buzzChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted },
  buzzChipTextActive: { color: colors.cream },

  pulseWrap: { marginTop: 20 },
  pulseBar: {
    flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden',
    backgroundColor: 'rgba(30,58,95,0.06)',
  },
  pulseLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  pulseLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  pulseLegendText: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted },
  pulsePlaceholder: {
    height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.16)',
    borderStyle: 'dashed', backgroundColor: 'rgba(30,58,95,0.03)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  pulsePlaceholderText: {
    fontFamily: fonts.sans, fontSize: 9, color: colors.light,
    position: 'absolute', top: 14,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(30,58,95,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md, paddingBottom: 28,
  },
  sheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 14, textAlign: 'center' },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sheetChip: {
    width: '31%', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  sheetEmoji: { fontSize: 22, lineHeight: 24 },
  sheetLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, textAlign: 'center' },

  card: {
    marginHorizontal: spacing.md, marginBottom: 14,
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.06)',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.navy },
  nameMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },
  moodBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  moodBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
  timestamp: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, flexShrink: 0 },
  bodyText: { fontFamily: fonts.sans, fontSize: 15, color: colors.navy, lineHeight: 22, marginTop: 12 },
  photo: { width: '100%', height: 260, backgroundColor: colors.border },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingBottom: 14 },

  reactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(30,58,95,0.04)',
  },
  reactPillEmoji: { fontSize: 14 },
  reactPillText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted },

  engageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  engageBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },

  highlightCard: { borderColor: 'rgba(194,87,43,0.3)', borderWidth: 1.5 },
  highlightBadge: {
    position: 'absolute', top: 12, right: 12, zIndex: 1,
    backgroundColor: 'rgba(194,87,43,0.12)', borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  highlightBadgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, color: '#C2572B' },

  adCard: { backgroundColor: 'rgba(30,58,95,0.025)' },
  adLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, paddingBottom: 6 },
  adLabel: { backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  adLabelText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.muted, letterSpacing: 0.5 },
  adSponsor: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.muted, flex: 1 },
  adTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.navy, paddingHorizontal: spacing.md },
  adBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 18, paddingHorizontal: spacing.md, marginTop: 4 },
  adImage: { width: '100%', height: 160, marginTop: 10, backgroundColor: colors.border },
  adCtaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.pill,
    marginHorizontal: spacing.md, marginTop: 12, marginBottom: spacing.md,
    paddingVertical: 10,
  },
  adCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  suggestedCard: { paddingVertical: spacing.md },
  suggestedEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, marginBottom: 12 },
  suggestedEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  suggestedRow: { paddingHorizontal: spacing.md, gap: 12 },
  suggestedChip: {
    width: 128, alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(30,58,95,0.025)', borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.06)',
    paddingVertical: 14, paddingHorizontal: 8,
  },
  suggestedAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  suggestedAvatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.cream },
  suggestedName: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, textAlign: 'center' },
  suggestedMeta: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, textAlign: 'center' },
  suggestedConnectBtn: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(30,58,95,0.16)',
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 2,
  },
  suggestedConnectText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy },
})
