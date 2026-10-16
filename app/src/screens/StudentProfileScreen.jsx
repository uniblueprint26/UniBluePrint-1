import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal, Linking, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, GraduationCap, MapPin, AtSign, Link2, ThumbsUp, X, Check, MessageSquareQuote,
} from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { supabase } from '../lib/supabase'
import { startDirectChat, fetchRoomContextId } from '../lib/directMessaging'
import { STATUS_LABEL_BY_KEY, SOCIAL_LINK_FIELDS } from '../constants/directory'
import {
  ENDORSEMENT_TAGS, CUSTOM_ENDORSEMENT_TAG, MAX_CUSTOM_ENDORSEMENT_LENGTH,
} from '../constants/endorsements'
import { userTypeLabel } from '../constants/userTypes'
import { STATUS_STYLES, avatarColorFor, initialsFor } from './DirectoryScreen'
import Button from '../components/ui/Button'

// ── A student's full Directory profile ──────────────────────────────────────
//
// Reached by tapping a card on the compact Directory list/feed
// (DirectoryScreen.jsx), which already has every field this screen needs
// (get_directory_profiles() — see the
// 20261015140000_directory_credentials_endorsements migration — returns the
// full display-safe row), so the whole `student` object is passed via route
// params rather than re-fetched. Two things only this screen shows, by
// deliberate product decision (see that migration's own header comment):
//   - the self-reported social links (profiles.social_links) collected in
//     Profile > Directory Profile but never rendered anywhere until now.
//   - peer skill-endorsement tags + counts (peer_endorsements /
//     peer_endorsement_counts), plus an "add an endorsement" action for any
//     other signed-in viewer — intentionally NOT surfaced on the compact
//     card/list, so endorsements never turn Directory browsing into a
//     leaderboard. Alongside the 6 fixed preset tags, a viewer can also
//     leave a free-typed custom endorsement (peer_endorsements rows with
//     tag = CUSTOM_ENDORSEMENT_TAG, text in custom_text — see the
//     20261016090000_peer_endorsements_custom_text migration). Custom notes
//     don't aggregate into a count the way presets do, so they're rendered
//     as their own "What people are saying" list instead of a chip.

function openSocialLink(key, rawValue) {
  const value = String(rawValue || '').trim()
  if (!value) return
  if (/^https?:\/\//i.test(value)) {
    Linking.openURL(value)
    return
  }
  if (key === 'instagram') {
    Linking.openURL(`https://www.instagram.com/${value.replace(/^@/, '')}`)
    return
  }
  // LinkedIn/"Other" typed without a protocol — best-effort https://.
  Linking.openURL(`https://${value}`)
}

const SOCIAL_ICON = { instagram: AtSign, linkedin: Link2, other: Link2 }

// ── Add an endorsement modal ─────────────────────────────────────────────────
// Lets the viewer give the profile owner either one tag from the shared,
// fixed ENDORSEMENT_TAGS vocabulary, OR a free-typed custom note — the same
// "pick from a list OR type your own" pattern used for interests
// (hooks/useInterests.js) and Directory credentials
// (constants/directory.js' MAX_CREDENTIAL_LENGTH), just applied here to
// endorsements. Preset tags already given by this viewer to this person are
// excluded from the list entirely (peer_endorsements_unique_preset_idx
// enforces this at the database level too — this is just the UI not
// offering a tag that would fail); a custom note has no such limit, so the
// text field is always available.

function AddEndorsementModal({
  visible, onClose, availableTags, onPick, saving,
  customDraft, onCustomDraftChange, onSubmitCustom,
}) {
  const { colors } = useTheme()
  const m = __gs_m(colors)
  const trimmedCustom = customDraft.trim()
  const canSubmitCustom = trimmedCustom.length > 0 && !saving

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.backdrop}>
        <View style={m.sheet}>
          <View style={m.headerRow}>
            <Text style={m.title}>Give an endorsement</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={m.sub}>
            Pick what best describes working or connecting with this person. You can give one of each tag.
          </Text>
          {availableTags.length === 0 ? (
            <Text style={m.doneAll}>You've already given every preset endorsement tag to this person.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {availableTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={m.tagRow}
                  activeOpacity={0.75}
                  disabled={saving}
                  onPress={() => onPick(tag)}
                  accessibilityRole="button"
                >
                  <Text style={m.tagRowText}>{tag}</Text>
                  {saving ? <ActivityIndicator size="small" color={colors.textPrimary} /> : <Check size={16} color={colors.muted} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={m.divider} />

          <Text style={m.customLabel}>Or write your own</Text>
          <Text style={m.sub}>
            Say something specific — you can give this person more than one custom note.
          </Text>
          <TextInput
            value={customDraft}
            onChangeText={onCustomDraftChange}
            placeholder="e.g. Always helped me prep for exams"
            placeholderTextColor={colors.muted}
            style={m.customInput}
            multiline
            maxLength={MAX_CUSTOM_ENDORSEMENT_LENGTH}
            editable={!saving}
          />
          <View style={m.customFooterRow}>
            <Text style={m.customCount}>{trimmedCustom.length}/{MAX_CUSTOM_ENDORSEMENT_LENGTH}</Text>
            <TouchableOpacity
              style={[m.customSubmitBtn, !canSubmitCustom && m.customSubmitBtnDisabled]}
              activeOpacity={0.75}
              disabled={!canSubmitCustom}
              onPress={() => onSubmitCustom(customDraft)}
              accessibilityRole="button"
              accessibilityLabel="Submit custom endorsement"
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.accentFg} />
                : <Text style={m.customSubmitBtnText}>Add note</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StudentProfileScreen({ route, navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
  const { student } = route.params || {}

  const [connecting, setConnecting] = useState(false)

  // Endorsement counts (everyone's, aggregated) + which tags the viewer has
  // already given this person — both read fresh on mount/focus rather than
  // trusted from anywhere else, since they can change from other viewers'
  // actions too.
  const [counts, setCounts] = useState({})
  const [myGivenTags, setMyGivenTags] = useState([])
  // Free-typed custom endorsements (tag = CUSTOM_ENDORSEMENT_TAG) for this
  // profile — read fresh alongside the preset counts/mine, same reasoning:
  // other viewers can add their own at any time. Rendered as its own "What
  // people are saying" list since, unlike presets, these don't aggregate
  // into a count.
  const [customEndorsements, setCustomEndorsements] = useState([])
  const [customDraft, setCustomDraft] = useState('')
  const [endorsementsLoading, setEndorsementsLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const canEndorse = !!user?.id && !!student?.id && user.id !== student.id

  const loadEndorsements = useCallback(async () => {
    if (!student?.id) { setEndorsementsLoading(false); return }
    setEndorsementsLoading(true)
    try {
      const countsPromise = supabase
        .from('peer_endorsement_counts')
        .select('tag, endorsement_count')
        .eq('endorsed_id', student.id)
      const customPromise = supabase
        .from('peer_endorsements')
        .select('id, custom_text, created_at')
        .eq('endorsed_id', student.id)
        .eq('tag', CUSTOM_ENDORSEMENT_TAG)
        .order('created_at', { ascending: false })
      const minePromise = canEndorse
        ? supabase
            .from('peer_endorsements')
            .select('tag')
            .eq('endorsed_id', student.id)
            .eq('endorser_id', user.id)
        : Promise.resolve({ data: [] })

      const [{ data: countRows }, { data: customRows }, { data: mineRows }] =
        await Promise.all([countsPromise, customPromise, minePromise])
      const byTag = {}
      for (const row of countRows || []) byTag[row.tag] = row.endorsement_count
      setCounts(byTag)
      setCustomEndorsements(customRows || [])
      setMyGivenTags((mineRows || []).map(r => r.tag))
    } catch {
      // Leave whatever was last successfully loaded (or the zeroed default)
      // rather than show a broken count.
    } finally {
      setEndorsementsLoading(false)
    }
  }, [student?.id, canEndorse, user?.id])

  useEffect(() => { loadEndorsements() }, [loadEndorsements])

  async function giveEndorsement(tag) {
    if (!canEndorse || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('peer_endorsements').insert({
        endorser_id: user.id,
        endorsed_id: student.id,
        tag,
      })
      if (error) throw error
      setAddOpen(false)
      await loadEndorsements()
    } catch {
      Alert.alert('Could not save that', 'Please try again in a moment.')
    } finally {
      setSaving(false)
    }
  }

  // Trims, collapses whitespace, and length-caps a free-typed custom
  // endorsement — same normalize-at-the-write-boundary convention as
  // normalizeInterestLabel() (hooks/useInterests.js) and
  // updateDirectoryProfile()'s credentials handling (AuthContext.jsx). A
  // string that's pure whitespace trims to '' and is rejected below, so a
  // blank note can never be saved.
  function normalizeCustomEndorsement(raw) {
    return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, MAX_CUSTOM_ENDORSEMENT_LENGTH)
  }

  async function giveCustomEndorsement(rawText) {
    if (!canEndorse || saving) return
    const clean = normalizeCustomEndorsement(rawText)
    if (!clean) return
    setSaving(true)
    try {
      const { error } = await supabase.from('peer_endorsements').insert({
        endorser_id: user.id,
        endorsed_id: student.id,
        tag: CUSTOM_ENDORSEMENT_TAG,
        custom_text: clean,
      })
      if (error) throw error
      setCustomDraft('')
      setAddOpen(false)
      await loadEndorsements()
    } catch {
      Alert.alert('Could not save that', 'Please try again in a moment.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConnect() {
    if (connecting || !student?.id) return
    setConnecting(true)
    try {
      const { roomId, blocked, error } = await startDirectChat(student.id, student.full_name)
      if (blocked) {
        Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
        return
      }
      if (error || !roomId) throw error || new Error('No room id returned')

      const { contextId } = await fetchRoomContextId(roomId)
      if (!contextId) throw new Error('Could not resolve the new conversation.')

      navigation.getParent()?.navigate('Messages', {
        screen: 'ChatRoom',
        params: {
          contextType: 'direct',
          contextId,
          roomName:    student.full_name || 'Chat',
          subtitle:    null,
          posterId:    student.id,
          posterName:  student.full_name,
        },
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not start the conversation. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  if (!student) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 28 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={safeGoBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.chromeFg} strokeWidth={2} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.noteText}>This profile is no longer available.</Text>
        </View>
      </View>
    )
  }

  const credentials = Array.isArray(student.directory_credentials) ? student.directory_credentials : []
  const interests    = Array.isArray(student.interests) ? student.interests : []
  const statuses     = Array.isArray(student.statuses) ? student.statuses : []
  const socialLinks  = (student.social_links && typeof student.social_links === 'object') ? student.social_links : {}
  const availableTags = ENDORSEMENT_TAGS.filter(tag => !myGivenTags.includes(tag))

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={safeGoBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.chromeFg} strokeWidth={2} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={[styles.avatar, { backgroundColor: avatarColorFor(student.id) }]}>
            <Text style={styles.avatarText}>{initialsFor(student.full_name)}</Text>
          </View>

          <Text style={styles.headerName}>{student.full_name || 'UniBlueprint Student'}</Text>
          {!!student.user_type && (
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{userTypeLabel(student.user_type)}</Text>
            </View>
          )}
        </View>

        <View style={styles.identityBlock}>
          {!!student.course && <Text style={styles.courseText}>{student.course}</Text>}
          {!!student.institution && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.muted} strokeWidth={1.8} />
              <Text style={styles.locationText}>{student.institution}</Text>
            </View>
          )}
        </View>

        {/* Credentials — short self-written list */}
        {credentials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Credentials</Text>
            <View style={styles.credRow}>
              {credentials.map(c => (
                <View key={c} style={styles.credChip}>
                  <GraduationCap size={12} color={colors.textPrimary} strokeWidth={1.8} />
                  <Text style={styles.credChipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        {!!student.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bioText}>{student.bio}</Text>
          </View>
        )}

        {/* Statuses */}
        {statuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Open to</Text>
            <View style={styles.statusRow}>
              {statuses.map(s => {
                const st = STATUS_STYLES[s]
                if (!st) return null
                return (
                  <View key={s} style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{STATUS_LABEL_BY_KEY[s] || s}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <View style={styles.tagRow}>
              {interests.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Social links */}
        {SOCIAL_LINK_FIELDS.some(f => !!socialLinks[f.key]) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Links</Text>
            <View style={styles.contactList}>
              {SOCIAL_LINK_FIELDS.filter(f => !!socialLinks[f.key]).map((f, i, arr) => {
                const Icon = SOCIAL_ICON[f.key] || Link2
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.contactRow, i < arr.length - 1 && styles.contactDivider]}
                    onPress={() => openSocialLink(f.key, socialLinks[f.key])}
                    activeOpacity={0.75}
                  >
                    <View style={styles.contactIcon}><Icon size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactPlatform}>{f.label}</Text>
                      <Text style={styles.contactHandle} numberOfLines={1}>{socialLinks[f.key]}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* ── Peer skill-endorsements — full profile only ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Endorsements</Text>
          {endorsementsLoading ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginVertical: 8 }} />
          ) : (
            <View style={styles.endorseGrid}>
              {ENDORSEMENT_TAGS.map(tag => {
                const count = counts[tag] || 0
                return (
                  <View key={tag} style={[styles.endorseChip, count > 0 && styles.endorseChipActive]}>
                    <ThumbsUp size={12} color={count > 0 ? colors.accentFg : colors.muted} strokeWidth={1.8} />
                    <Text style={[styles.endorseChipText, count > 0 && styles.endorseChipTextActive]}>{tag}</Text>
                    {count > 0 && (
                      <View style={styles.endorseCountBadge}>
                        <Text style={styles.endorseCountText}>{count}</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Free-typed custom endorsements — distinct from the counted
              preset chips above, since each one is its own note rather than
              something that aggregates into a count. */}
          {!endorsementsLoading && customEndorsements.length > 0 && (
            <View style={styles.customEndorseWrap}>
              <Text style={styles.customEndorseLabel}>What people are saying</Text>
              <View style={{ gap: 8 }}>
                {customEndorsements.map(e => (
                  <View key={e.id} style={styles.customEndorseCard}>
                    <MessageSquareQuote size={14} color={colors.muted} strokeWidth={1.8} />
                    <Text style={styles.customEndorseText}>{e.custom_text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {canEndorse && !endorsementsLoading && (
            <TouchableOpacity
              style={styles.addEndorseBtn}
              activeOpacity={0.75}
              onPress={() => setAddOpen(true)}
            >
              <ThumbsUp size={14} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={styles.addEndorseBtnText}>Add an endorsement</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          label={connecting ? 'Connecting…' : 'Connect'}
          onPress={handleConnect}
          variant="primary"
          loading={connecting}
          disabled={connecting}
          style={{ marginHorizontal: spacing.md }}
        />
      </ScrollView>

      <AddEndorsementModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        availableTags={availableTags}
        onPick={giveEndorsement}
        saving={saving}
        customDraft={customDraft}
        onCustomDraftChange={setCustomDraft}
        onSubmitCustom={giveCustomEndorsement}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: {},

  header: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.chromeFg },

  avatar: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 28, color: '#fff' },

  headerName: { fontFamily: fonts.serif, fontSize: 24, color: colors.chromeFg, textAlign: 'center', marginTop: 14 },

  typePill: {
    marginTop: 8,
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.2)',
    paddingHorizontal: 12, paddingVertical: 5,
  },
  typePillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: 'rgba(245,240,232,0.85)', letterSpacing: 0.3 },

  identityBlock: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, alignItems: 'center' },
  courseText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12,
  },
  bioText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, lineHeight: 22 },

  credRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  credChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)', ...shadows.card,
  },
  credChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  tagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  contactList: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  contactDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  contactIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactPlatform: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 2 },
  contactHandle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },

  endorseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  endorseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  endorseChipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  endorseChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
  endorseChipTextActive: { color: colors.accentFg },
  endorseCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: radius.pill,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  endorseCountText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.accentFg },

  customEndorseWrap: { marginTop: 14 },
  customEndorseLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  customEndorseCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.card,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card,
  },
  customEndorseText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 19 },

  addEndorseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: radius.button, marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
  },
  addEndorseBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  noteText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center' },
  })
}

function __gs_m(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 },
  doneAll: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  tagRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  tagRowText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary },

  divider: { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginVertical: 18 },
  customLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  customInput: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    paddingHorizontal: 14, paddingVertical: 12,
    minHeight: 72, textAlignVertical: 'top',
  },
  customFooterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10,
  },
  customCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  customSubmitBtn: {
    backgroundColor: colors.accentBg, borderRadius: radius.pill,
    paddingHorizontal: 18, paddingVertical: 10,
    minWidth: 92, alignItems: 'center',
  },
  customSubmitBtnDisabled: { opacity: 0.4 },
  customSubmitBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.accentFg },
  })
}
