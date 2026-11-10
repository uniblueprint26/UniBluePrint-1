import { memo, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Modal, Linking, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Camera, Smile, ExternalLink, Users, MessageCircle, Send, Bookmark } from 'lucide-react-native'
import { fonts, radius, spacing, shadows, sheen } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
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

// A thin gradient "ring" behind an avatar circle — the one place gold earns
// its keep as a genuinely special accent (an identity frame), not a
// workhorse color. Renders the gradient as a slightly larger circle behind
// the real avatar, with a small gap so the ring actually reads as a ring
// rather than a glow bleeding into the avatar itself.
export function AvatarRing({ size, children }) {
  const ringSize = size + 5
  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={['#E4C77E', '#C9A24B', '#A5813B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: ringSize, height: ringSize, borderRadius: ringSize / 2 }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  )
}

// A soft glossy highlight along the top edge of an elevated surface — real
// light-catching depth instead of a flat color with a border drawn around
// it. Absolutely positioned over whatever it wraps; pointerEvents 'none' so
// it never intercepts taps.
function Sheen({ isDark, radius: r }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={isDark ? sheen.dark : sheen.light}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', borderTopLeftRadius: r, borderTopRightRadius: r }}
    />
  )
}

// ── Composer entry bar ───────────────────────────────────────────────────────
// Two distinct affordances (mood + photo), not one blended placeholder line
// — reads as "two things you can do here" rather than a generic text field.

export function ComposerEntryBar({ name, onPress }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <TouchableOpacity style={k.composerBar} onPress={onPress} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel="Start a new post">
      <Sheen isDark={isDark} radius={radius.pill} />
      <AvatarRing size={38}>
        <View style={k.composerAvatar}><Text style={k.composerAvatarText}>{initialsOf(name)}</Text></View>
      </AvatarRing>
      <View style={{ flex: 1 }}>
        <Text style={k.composerPlaceholder}>Share your mood or a snapshot…</Text>
        <Text style={k.composerSub}>Mood Board, Thread, or Photo</Text>
      </View>
      <View style={k.composerIconWrap}>
        <Smile size={15} color={colors.gold} strokeWidth={1.9} />
      </View>
      <View style={k.composerIconWrap}>
        <Camera size={15} color={colors.textPrimary} strokeWidth={1.9} />
      </View>
    </TouchableOpacity>
  )
}

// ── Buzz strip (filter chips) ────────────────────────────────────────────────

export function BuzzStrip({ selected, onSelect }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
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
              accessibilityRole="button"
              accessibilityLabel={`${w.label} buzz window`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[k.buzzChipText, active && k.buzzChipTextActive]}>{w.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ── Mood Pulse ───────────────────────────────────────────────────────────────
// Named "Mood Pulse" (not "Campus Pulse") deliberately — Campus Connect
// already has its own real "Campus Pulse" feature (a weekly rotating prompt
// + replies, see components/campusConnect/CampusPulseCard.jsx), a wholly
// different thing. This widget aggregates mood tags across Thread posts
// app-wide, not scoped to campus specifically, so neither the name nor the
// data pretends otherwise. Reused with a `title` override per screen
// ("Campus Mood" / "Course Mood") so it reads as that screen's own flavour
// of the same signal rather than one more "Pulse"-branded thing.
//
// Given its own quiet card rather than floating loose on the page — the six
// mood colors are a real, useful signal, but showing them all at full
// strength with nothing containing them was competing with the navy/cream
// identity. A composed card reads as "here's a considered data point," not
// a stray rainbow strip.

export function MoodPulse({ pulse, title = 'Mood Pulse' }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  const total = pulse?.total || 0
  const hasEnoughData = total >= CAMPUS_PULSE_MIN_THREADS

  return (
    <View style={k.pulseWrap}>
      <Text style={k.buzzEyebrow}>{title}</Text>
      <View style={k.pulseCard}>
        {hasEnoughData ? (
          <>
            <View style={k.pulseBar}>
              {MOODS.map(m => {
                const count = pulse.counts[m.id] || 0
                const share = count / total
                if (share <= 0) return null
                return <View key={m.id} style={{ flex: share, backgroundColor: m.color, opacity: 0.88 }} />
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
    </View>
  )
}

// ── Mood reaction picker (bottom sheet) ─────────────────────────────────────

export function MoodPickerSheet({ visible, currentMood, onPick, onClose }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
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
                    selected ? { backgroundColor: m.bg, borderColor: m.color } : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' },
                  ]}
                  onPress={() => onPick(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={k.sheetEmoji}>{m.emoji}</Text>
                  <Text style={[k.sheetLabel, { color: selected ? m.color : colors.textPrimary }]}>{m.label}</Text>
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
// Icon-only when there's nothing to react with yet — no "React" text label.
// Real apps never caption the action, just show the icon; a count only
// appears once there's a real count to show.

function ReactionPill({ myMood, count, onPress, colors, k }) {
  const def = myMood ? moodDef(myMood) : null
  return (
    <TouchableOpacity
      style={[k.reactPill, def ? { backgroundColor: def.bg } : null]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={def ? `Reacted ${def.label}, ${count || 0}` : `React with a mood, ${count || 0}`}
    >
      {def ? <Text style={k.reactPillEmoji}>{def.emoji}</Text> : <Smile size={17} color={colors.textPrimary} strokeWidth={1.8} />}
      {count > 0 && (
        <Text style={[k.reactPillText, def ? { color: def.color } : null]}>{count}</Text>
      )}
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

function EngagementRow({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave, colors, k }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isPost = post.post_type === 'post'

  function handlePick(moodId) {
    setSheetOpen(false)
    onReact(post.id, moodId === myMood ? null : moodId)
  }

  return (
    <>
      <View style={[k.engagementRow, isPost && { paddingTop: 12 }]}>
        <ReactionPill myMood={myMood} count={post.reaction_count} onPress={() => setSheetOpen(true)} colors={colors} k={k} />
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onComment?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Comment, ${commentCount || 0}`}
        >
          <MessageCircle size={18} color={colors.textPrimary} strokeWidth={1.8} />
          {commentCount > 0 && <Text style={k.engageBtnText}>{commentCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onShare?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Send size={17} color={colors.textPrimary} strokeWidth={1.8} />
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
            size={18}
            color={saved ? colors.goldText : colors.textPrimary}
            fill={saved ? colors.goldText : 'transparent'}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      </View>
      <MoodPickerSheet visible={sheetOpen} currentMood={myMood} onPick={handlePick} onClose={() => setSheetOpen(false)} />
    </>
  )
}

// ── Post header (avatar, name, mood badge, timestamp) ───────────────────────

function PostHeader({ post, colors, k }) {
  const mood = post.mood ? moodDef(post.mood) : null
  const name = post.author_name || 'UniBlueprint member'
  return (
    <View style={k.cardHeaderRow}>
      <AvatarRing size={38}>
        <View style={[k.avatar, { backgroundColor: avatarBgFor(post.user_id) }]}>
          <Text style={k.avatarText}>{initialsOf(name)}</Text>
        </View>
      </AvatarRing>
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

// ── Memoization comparator (shared by FeedPostCard/BuzzingHighlightCard) ───
// Deliberately omits onReact/onComment/onShare/onToggleSave: HomeScreen
// recreates all four on every render (they're plain function declarations,
// not useCallback-wrapped), so comparing them would make this memoization a
// no-op. That's safe to ignore, not just convenient, because of how
// HomeScreen's handlers are written:
//   - handleReact/handleToggleSave mutate state only through React's
//     functional setState form (`setMyReactions(r => ...)`, `setFeedPosts(
//     posts => ...)`, `setSavedPostIds(prev => ...)`), which always applies
//     against the LATEST state at call time, never a closure snapshot — so a
//     stale closure can't write stale data.
//   - Their one direct (non-functional) reads — `myReactions[postId]` in
//     handleReact, `savedPostIds.has(postId)` in handleToggleSave — are keyed
//     by THIS card's own post id. The only way that specific value could
//     differ between the stale closure and current state is if THIS post's
//     own myMood/saved status changed — and that's exactly the condition the
//     comparator below checks, which forces a fresh render (and a fresh
//     closure) before that could happen. A stale closure only exists while
//     this post's own myMood/saved value hasn't moved, so the read is always
//     current when it matters.
//   - handleCommentPost/handleSharePost read no per-post mutable state at
//     all, so staleness isn't a concern for them either.
// `post` is compared by reference, not deep-equality: HomeScreen's
// handleReact updates feedPosts via `posts.map(p => p.id === postId ? {
// ...p, reaction_count } : p)`, which hands back the exact same object
// reference for every post that wasn't the one just reacted to — so
// reference equality already correctly detects "this post's own data
// changed" without a manual field-by-field diff.
function arePostCardPropsEqual(prevProps, nextProps) {
  return (
    prevProps.post === nextProps.post &&
    prevProps.myMood === nextProps.myMood &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.saved === nextProps.saved
  )
}

// ── Main feed post card (Post or Thread) ────────────────────────────────────

export const FeedPostCard = memo(function FeedPostCard({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <View style={k.postRow}>
      <PostHeader post={post} colors={colors} k={k} />
      {!!post.body && <Text style={k.bodyText}>{post.body}</Text>}
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
        colors={colors}
        k={k}
      />
    </View>
  )
}, arePostCardPropsEqual)

// ── Buzzing highlight card ───────────────────────────────────────────────────

export const BuzzingHighlightCard = memo(function BuzzingHighlightCard({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <View style={[k.postRow, k.highlightRow]}>
      <View style={k.highlightBadge}>
        <Text style={k.highlightBadgeText}>🔥 Buzzing</Text>
      </View>
      <PostHeader post={post} colors={colors} k={k} />
      {!!post.body && <Text style={k.bodyText}>{post.body}</Text>}
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
        colors={colors}
        k={k}
      />
    </View>
  )
}, arePostCardPropsEqual)

// ── Promoted placement ("Ad") card ───────────────────────────────────────────

export function AdCard({ placement }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  const hasCta = !!placement.cta_label && !!placement.cta_url
  return (
    <View style={[k.card, k.adCard]}>
      <Sheen isDark={isDark} radius={radius.card} />
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
          <ExternalLink size={13} color={colors.accentFg} strokeWidth={2} />
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
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  if (!profiles?.length) return null
  return (
    <View style={[k.card, k.suggestedCard]}>
      <Sheen isDark={isDark} radius={radius.card} />
      <View style={k.suggestedEyebrowRow}>
        <Users size={13} color={colors.muted} strokeWidth={1.9} />
        <Text style={k.suggestedEyebrow}>Suggested for you</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={k.suggestedRow}>
        {profiles.map(p => (
          <View key={p.id} style={k.suggestedChip}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => onViewProfile?.(p)}>
              <AvatarRing size={44}>
                <View style={[k.suggestedAvatar, { backgroundColor: avatarColorFor(p.id) }]}>
                  <Text style={k.suggestedAvatarText}>{initialsFor(p.full_name)}</Text>
                </View>
              </AvatarRing>
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
// Theme-aware (light/dark) — every FeedKit component calls useTheme() itself
// and builds its own copy of these via getStyles(colors, isDark). Cards lean
// on `shadows.glow`/`glowDark` for elevation instead of a border fighting a
// shadow — see theme.js's comment on why that read as "blocky."

function getStyles(colors, isDark) {
  const cardShadow = isDark ? shadows.glowDark : shadows.glow
  return StyleSheet.create({
  composerBar: {
    backgroundColor: colors.surface, borderRadius: radius.pill,
    overflow: 'hidden',
    paddingVertical: 12, paddingHorizontal: 12, paddingLeft: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...cardShadow,
  },
  composerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  composerAvatarText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.cream },
  composerPlaceholder: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary },
  composerSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  composerIconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt,
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
    backgroundColor: colors.surfaceAlt,
  },
  buzzChipActive: { backgroundColor: colors.accentBg },
  buzzChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted },
  buzzChipTextActive: { color: colors.accentFg },

  pulseWrap: { marginTop: 20 },
  pulseCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: spacing.md, ...cardShadow,
  },
  pulseBar: {
    flexDirection: 'row', height: 9, borderRadius: 4.5, overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  pulseLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  pulseLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  pulseLegendText: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted },
  pulsePlaceholder: {
    height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  pulsePlaceholderText: {
    fontFamily: fonts.sans, fontSize: 9, color: colors.light,
    position: 'absolute', top: 13,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(11,22,35,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md, paddingBottom: 28,
  },
  sheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 14, textAlign: 'center' },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sheetChip: {
    width: '31%', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  sheetEmoji: { fontSize: 22, lineHeight: 24 },
  sheetLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, textAlign: 'center' },

  card: {
    marginHorizontal: spacing.md, marginBottom: 16,
    backgroundColor: colors.surface, borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  // Borderless, X/Threads-style feed row — a hairline divider is the only
  // separation between posts, no surface/shadow/radius box. The photo
  // breaks out of this row's own horizontal padding to bleed full-width
  // (see `photo` below).
  postRow: {
    paddingHorizontal: spacing.md, paddingTop: 15, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.navy },
  nameMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary },
  moodBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  moodBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
  // Gold is otherwise retired as a workhorse color — this is the one
  // "little detail" moment it's reserved for.
  timestamp: { fontFamily: fonts.sans, fontSize: 11, color: colors.goldText, flexShrink: 0 },
  bodyText: { fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginTop: 12 },
  photo: {
    height: 260, backgroundColor: colors.surfaceAlt, marginTop: 12,
    marginHorizontal: -spacing.md,
  },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12 },

  reactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceAlt,
  },
  reactPillEmoji: { fontSize: 15 },
  reactPillText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },

  engageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  engageBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary },

  highlightRow: { backgroundColor: isDark ? 'rgba(224,192,108,0.08)' : 'rgba(180,146,58,0.05)' },
  highlightBadge: {
    position: 'absolute', top: 12, right: 12, zIndex: 1,
    backgroundColor: isDark ? 'rgba(224,192,108,0.2)' : 'rgba(180,146,58,0.12)', borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  highlightBadgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.goldText },

  adCard: { backgroundColor: colors.surfaceAlt },
  adLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, paddingBottom: 6 },
  adLabel: { backgroundColor: colors.surface, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  adLabelText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.muted, letterSpacing: 0.5 },
  adSponsor: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.muted, flex: 1 },
  adTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary, paddingHorizontal: spacing.md },
  adBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 18, paddingHorizontal: spacing.md, marginTop: 4 },
  adImage: { width: '100%', height: 160, marginTop: 10, backgroundColor: colors.border },
  adCtaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.accentBg, borderRadius: radius.pill,
    marginHorizontal: spacing.md, marginTop: 12, marginBottom: spacing.md,
    paddingVertical: 10,
  },
  adCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },

  suggestedCard: { paddingVertical: spacing.md },
  suggestedEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, marginBottom: 12 },
  suggestedEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  suggestedRow: { paddingHorizontal: spacing.md, gap: 12 },
  suggestedChip: {
    width: 128, alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  suggestedAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  suggestedAvatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.cream },
  suggestedName: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary, textAlign: 'center' },
  suggestedMeta: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, textAlign: 'center' },
  suggestedConnectBtn: {
    borderRadius: radius.pill, backgroundColor: colors.surface,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 2,
  },
  suggestedConnectText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textPrimary },
  })
}
