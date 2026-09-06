/**
 * BoardDetailScreen — the shared browse + post screen for every Campus
 * Connect board. Route params: { boardKey, openPostForm? }.
 *
 * The generic path (fields/filters/card rendering driven entirely by
 * `constants/campusBoards.js`) covers most boards unmodified. A handful of
 * boards need bespoke browse UI beyond a generic card list — those are
 * gated on `board.special` and handled inline below rather than as
 * separate screens, per the brief's "shared pattern... where that doesn't
 * compromise a board's specific needs":
 *   accommodation — static "From Roomy.ie" link-out panel
 *   clubs         — join/leave + member counts + "request a new society"
 *   projects      — "this is an example" sheet on seeded projects
 *   problems      — solutions thread with upvoting
 *   reviews       — aggregate rating header
 *   suggestions   — upvote, sorted most-upvoted first
 *   ads           — mark sold / remove (no auto-expiry)
 *   notes/papers  — Course Connect only: download button + count, no chat
 *
 * `registry` route param ('campus', default, or 'course') selects which
 * board list (campusBoards.js vs courseConnectBoards.js) `boardKey` is
 * looked up in, and switches two Campus-Connect-specific behaviours off for
 * Course Connect: the back-button label/destination, and the "select your
 * campus before posting" gate (Course Connect boards are cross-Ireland and
 * never require a campus on file).
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, Image, Linking, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, Plus, MessageSquare, Flag, Trash2, ThumbsUp, ExternalLink,
  Users, Star, X, Search, AlertCircle, Send, CheckCircle2, RotateCcw,
  Download, FileText, Image as ImageIcon,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import PostFormModal from '../components/campusConnect/PostFormModal'
import CampusGateModal from '../components/campusConnect/CampusGateModal'
import { getBoard } from '../constants/campusBoards'
import { getCourseBoard } from '../constants/courseConnectBoards'
import { getMarketplaceBoard } from '../constants/marketplaceBoards'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

const RATING_CATEGORIES = [
  ['overall_rating', 'Overall'],
  ['teaching_quality', 'Teaching Quality'],
  ['campus_facilities', 'Campus Facilities'],
  ['student_support', 'Student Support'],
  ['social_life', 'Social Life'],
  ['value_for_money', 'Value for Money'],
]

const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Safety concern', 'Other']

export function fileTypeLabel(item) {
  const mime = (item.file_mime || '').toLowerCase()
  const url = (item.file_url || '').toLowerCase()
  if (mime.includes('pdf') || url.endsWith('.pdf')) return 'PDF'
  return 'Image'
}

function Stars({ value, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} color={colors.gold} fill={n <= Math.round(value) ? colors.gold : 'transparent'} strokeWidth={1.4} />
      ))}
    </View>
  )
}

export default function BoardDetailScreen({ navigation, route }) {
  const { boardKey, openPostForm, registry = 'campus' } = route.params ?? {}
  const board = registry === 'course' ? getCourseBoard(boardKey)
    : registry === 'marketplace' ? getMarketplaceBoard(boardKey)
    : getBoard(boardKey)
  const backLabel = registry === 'course' ? 'Course Connect' : registry === 'marketplace' ? 'Marketplace' : 'Campus Connect'
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState({})
  const [postOpen, setPostOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // fn to run once campus is set

  // clubs
  const [clubCounts, setClubCounts] = useState({})
  const [clubMine, setClubMine] = useState(new Set())
  const [clubRequestOpen, setClubRequestOpen] = useState(false)

  // suggestions / solutions upvotes
  const [mySuggestionVotes, setMySuggestionVotes] = useState(new Set())
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [solutions, setSolutions] = useState([])
  const [mySolutionVotes, setMySolutionVotes] = useState(new Set())
  const [solutionVoteCounts, setSolutionVoteCounts] = useState({})
  const [solutionDraft, setSolutionDraft] = useState('')
  const [solutionSaving, setSolutionSaving] = useState(false)

  // projects
  const [exampleSheetOpen, setExampleSheetOpen] = useState(false)

  // ads
  const [adBusyId, setAdBusyId] = useState(null)

  // notes / papers
  const [downloadBusyId, setDownloadBusyId] = useState(null)

  const load = useCallback(async () => {
    if (!board) return
    setLoading(true)
    if (board.key === 'clubs') {
      const [{ data: clubs }, { data: members }] = await Promise.all([
        supabase.from('clubs_societies').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('society_members').select('society_id,user_id'),
      ])
      const counts = {}
      const mine = new Set()
      ;(members || []).forEach(m => {
        counts[m.society_id] = (counts[m.society_id] || 0) + 1
        if (m.user_id === user?.id) mine.add(m.society_id)
      })
      setClubCounts(counts)
      setClubMine(mine)
      setRows(clubs || [])
    } else if (board.key === 'suggestions') {
      const [{ data: suggestions }, { data: votes }] = await Promise.all([
        supabase.from('campus_suggestions').select('*'),
        supabase.from('suggestion_votes').select('suggestion_id,user_id'),
      ])
      const counts = {}
      const mine = new Set()
      ;(votes || []).forEach(v => {
        counts[v.suggestion_id] = (counts[v.suggestion_id] || 0) + 1
        if (v.user_id === user?.id) mine.add(v.suggestion_id)
      })
      const withCounts = (suggestions || []).map(s => ({ ...s, _upvotes: counts[s.id] || 0 }))
      withCounts.sort((a, b) => (b._upvotes - a._upvotes) || (new Date(b.created_at) - new Date(a.created_at)))
      setMySuggestionVotes(mine)
      setRows(withCounts)
    } else {
      const { data } = await supabase.from(board.table).select('*').order('created_at', { ascending: false })
      setRows(data || [])
    }
    setLoading(false)
  }, [board, user?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (openPostForm) {
      // Runs once on mount — matches the picker flow ("choose a board, land
      // straight in its post form").
      handlePostPress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!board) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Board not found.</Text>
      </View>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'

  function hasCampus() {
    return !!user?.user_metadata?.institution
  }

  function requireCampus(action) {
    // Course Connect is cross-Ireland and never gates posting on having a
    // campus on file — only Campus Connect boards do.
    if (registry !== 'campus' || hasCampus()) { action(); return }
    setPendingAction(() => action)
    setGateOpen(true)
  }

  function onCampusSelected() {
    setGateOpen(false)
    const action = pendingAction
    setPendingAction(null)
    if (action) action()
  }

  function handlePostPress() {
    requireCampus(() => {
      if (board.special === 'clubs') setClubRequestOpen(true)
      else setPostOpen(true)
    })
  }

  function handlePosted(row) {
    setPostOpen(false)
    setRows(prev => [row, ...prev])
  }

  function handleClubRequestPosted() {
    setClubRequestOpen(false)
    Alert.alert('Thanks!', 'Your request has been sent — the UniBlueprint team will review it and add the society if it fits.')
  }

  async function removeRow(id) {
    const { error } = await supabase.from(board.table).delete().eq('id', id)
    if (!error) setRows(prev => prev.filter(r => r.id !== id))
  }

  function confirmRemove(item) {
    Alert.alert('Remove this post?', 'This takes it off the board for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeRow(item.id) },
    ])
  }

  function report(item, targetType) {
    Alert.alert('Report this post', 'What best describes the issue?', [
      ...REPORT_REASONS.map(reason => ({
        text: reason,
        onPress: async () => {
          const { error } = await supabase.from('operations_flags').insert({
            flagged_by: user.id, target_type: targetType || board.table, target_id: item.id, reason,
          })
          Alert.alert(error ? 'Something went wrong' : 'Reported', error ? 'Please try again.' : 'Thanks — the UniBlueprint team will take a look.')
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function openChat(item, roomName, subtitle) {
    navigation.navigate('ChatRoom', {
      contextType: 'board',
      contextId: `${board.key}-${item.id}`,
      roomName,
      subtitle,
    })
  }

  // ── Clubs ────────────────────────────────────────────────────────────────
  async function joinClub(club) {
    requireCampus(async () => {
      const { error } = await supabase.from('society_members').insert({ society_id: club.id, user_id: user.id })
      if (!error) {
        setClubMine(prev => new Set(prev).add(club.id))
        setClubCounts(prev => ({ ...prev, [club.id]: (prev[club.id] || 0) + 1 }))
      }
    })
  }
  async function leaveClub(club) {
    const { error } = await supabase.from('society_members').delete().eq('society_id', club.id).eq('user_id', user.id)
    if (!error) {
      setClubMine(prev => { const next = new Set(prev); next.delete(club.id); return next })
      setClubCounts(prev => ({ ...prev, [club.id]: Math.max(0, (prev[club.id] || 1) - 1) }))
    }
  }

  // ── Suggestions ──────────────────────────────────────────────────────────
  async function toggleSuggestionVote(item) {
    requireCampus(async () => {
      const already = mySuggestionVotes.has(item.id)
      if (already) {
        await supabase.from('suggestion_votes').delete().eq('suggestion_id', item.id).eq('user_id', user.id)
      } else {
        await supabase.from('suggestion_votes').insert({ suggestion_id: item.id, user_id: user.id })
      }
      setMySuggestionVotes(prev => {
        const next = new Set(prev)
        already ? next.delete(item.id) : next.add(item.id)
        return next
      })
      setRows(prev => prev
        .map(r => r.id === item.id ? { ...r, _upvotes: r._upvotes + (already ? -1 : 1) } : r)
        .sort((a, b) => (b._upvotes - a._upvotes) || (new Date(b.created_at) - new Date(a.created_at))))
    })
  }

  // ── Problems & Solutions ─────────────────────────────────────────────────
  async function openProblem(problem) {
    setSelectedProblem(problem)
    const [{ data: sols }, { data: votes }] = await Promise.all([
      supabase.from('problem_solutions').select('*').eq('problem_id', problem.id).order('created_at', { ascending: true }),
      supabase.from('solution_votes').select('solution_id,user_id'),
    ])
    const counts = {}
    const mine = new Set()
    ;(votes || []).forEach(v => {
      counts[v.solution_id] = (counts[v.solution_id] || 0) + 1
      if (v.user_id === user?.id) mine.add(v.solution_id)
    })
    setSolutionVoteCounts(counts)
    setMySolutionVotes(mine)
    setSolutions(sols || [])
  }
  async function postSolution() {
    if (!solutionDraft.trim() || solutionSaving) return
    requireCampus(async () => {
      setSolutionSaving(true)
      const { data, error } = await supabase.from('problem_solutions').insert({
        problem_id: selectedProblem.id, user_id: user.id, poster_name: displayName, body: solutionDraft.trim(),
      }).select().single()
      setSolutionSaving(false)
      if (!error) {
        setSolutions(prev => [...prev, data])
        setSolutionDraft('')
      }
    })
  }
  async function toggleSolutionVote(sol) {
    requireCampus(async () => {
      const already = mySolutionVotes.has(sol.id)
      if (already) await supabase.from('solution_votes').delete().eq('solution_id', sol.id).eq('user_id', user.id)
      else await supabase.from('solution_votes').insert({ solution_id: sol.id, user_id: user.id })
      setMySolutionVotes(prev => { const next = new Set(prev); already ? next.delete(sol.id) : next.add(sol.id); return next })
      setSolutionVoteCounts(prev => ({ ...prev, [sol.id]: (prev[sol.id] || 0) + (already ? -1 : 1) }))
    })
  }

  // ── Ads / Marketplace (mark sold-or-equivalent, no auto-expiry) ─────────
  async function setAdStatus(item, status) {
    setAdBusyId(item.id)
    const { error } = await supabase.from(board.table).update({ status }).eq('id', item.id)
    setAdBusyId(null)
    if (!error) setRows(prev => prev.map(r => r.id === item.id ? { ...r, status } : r))
  }

  // ── Notes / Past Papers ──────────────────────────────────────────────────
  async function downloadFile(item) {
    setDownloadBusyId(item.id)
    const rpcName = board.special === 'notes' ? 'increment_shared_note_downloads' : 'increment_past_paper_downloads'
    const rpcArg = board.special === 'notes' ? { note_id: item.id } : { paper_id: item.id }
    await supabase.rpc(rpcName, rpcArg)
    setRows(prev => prev.map(r => r.id === item.id ? { ...r, download_count: (r.download_count || 0) + 1 } : r))
    setDownloadBusyId(null)
    if (Platform.OS === 'web') window.open(item.file_url, '_blank')
    else Linking.openURL(item.file_url)
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter(item => {
      return (board.filters || []).every(filter => {
        const fv = filterValues[filter.key]
        if (!fv) return true
        // A filter can bring its own predicate (e.g. Buy & Sell's price-range
        // buckets, which compare a numeric column against a labelled range
        // rather than an equality match) — checked before the generic paths.
        if (filter.matches) return filter.matches(item, fv)
        if (filter.type === 'search') return String(item[filter.key] ?? '').toLowerCase().includes(String(fv).toLowerCase())
        if (filter.key === 'is_ticketed') return fv === 'Ticketed' ? !!item.is_ticketed : !item.is_ticketed
        return item[filter.key] === fv
      })
    })
  }, [rows, filterValues, board.filters])

  const posterLine = item => {
    const anon = item.anonymous
    const who = anon ? 'Anonymous student' : (item.poster_name || 'A student')
    return `${who} · ${timeAgo(item.created_at)}`
  }

  const isOwn = item => (item.user_id != null ? item.user_id === user?.id : item.created_by === user?.id)

  // ── Render helpers ───────────────────────────────────────────────────────

  function renderFilterBar() {
    if (!board.filters?.length) return null
    return (
      <View style={styles.filterBar}>
        {board.filters.map(filter => filter.type === 'search' ? (
          <View key={filter.key} style={styles.filterSearch}>
            <Search size={13} color={colors.muted} />
            <TextInput
              style={styles.filterSearchInput}
              placeholder={filter.label}
              placeholderTextColor={colors.light}
              value={filterValues[filter.key] || ''}
              onChangeText={v => setFilterValues(prev => ({ ...prev, [filter.key]: v }))}
            />
          </View>
        ) : (
          <ScrollView key={filter.key} horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.filterChip, !filterValues[filter.key] && styles.filterChipActive]}
                onPress={() => setFilterValues(prev => ({ ...prev, [filter.key]: null }))}
              >
                <Text style={[styles.filterChipText, !filterValues[filter.key] && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {filter.options.map(opt => {
                const active = filterValues[filter.key] === opt
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilterValues(prev => ({ ...prev, [filter.key]: opt }))}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        ))}
      </View>
    )
  }

  function renderGenericActions(item, extra) {
    const own = isOwn(item)
    return (
      <View style={styles.actionsRow}>
        {extra}
        {!own && (
          <TouchableOpacity style={styles.msgBtn} activeOpacity={0.8} onPress={() => openChat(item, board.cardTitle ? (board.cardTitle(item) || board.title) : board.title, board.title)}>
            <MessageSquare size={12} color={colors.navy} strokeWidth={2} />
            <Text style={styles.msgBtnText}>Message</Text>
          </TouchableOpacity>
        )}
        {!own && (
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => report(item)} accessibilityRole="button" accessibilityLabel="Report post">
            <Flag size={13} color={colors.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}
        {own && (
          <TouchableOpacity style={styles.msgBtn} activeOpacity={0.8} onPress={() => confirmRemove(item)}>
            <Trash2 size={12} color={colors.navy} strokeWidth={2} />
            <Text style={styles.msgBtnText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  function renderGenericCard(item) {
    const title = board.cardTitle ? board.cardTitle(item) : null
    const meta = board.cardMeta ? board.cardMeta(item) : []
    const body = board.cardBody ? board.cardBody(item) : null
    return (
      <Card key={item.id} style={styles.card}>
        {!!title && <Text style={styles.cardTitle}>{title}</Text>}
        {meta.length > 0 && (
          <View style={styles.metaRow}>
            {meta.map((m, i) => <View key={i} style={styles.metaPill}><Text style={styles.metaPillText}>{m}</Text></View>)}
          </View>
        )}
        {!!body && <Text style={styles.cardBody} numberOfLines={4}>{body}</Text>}
        {!!item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.cardPhoto} resizeMode="cover" />}
        <Text style={styles.posterLine}>{posterLine(item)}</Text>
        {renderGenericActions(item)}
      </Card>
    )
  }

  // ── Special: Clubs ───────────────────────────────────────────────────────
  function renderClubCard(club) {
    const joined = clubMine.has(club.id)
    return (
      <Card key={club.id} style={styles.card}>
        <Text style={styles.cardTitle}>{club.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}><Text style={styles.metaPillText}>{club.category}</Text></View>
          <View style={styles.metaPill}><Users size={11} color={colors.navy} /><Text style={styles.metaPillText}> {clubCounts[club.id] || 0} member{(clubCounts[club.id] || 0) !== 1 ? 's' : ''}</Text></View>
        </View>
        <Text style={styles.cardBody} numberOfLines={4}>{club.description}</Text>
        {!!club.contact && <Text style={styles.posterLine}>Contact: {club.contact}</Text>}
        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnActive]}
          activeOpacity={0.85}
          onPress={() => joined ? leaveClub(club) : joinClub(club)}
        >
          <Text style={[styles.joinBtnText, joined && styles.joinBtnTextActive]}>{joined ? 'Joined · Leave' : 'Join / Express Interest'}</Text>
        </TouchableOpacity>
      </Card>
    )
  }

  // ── Special: Projects ────────────────────────────────────────────────────
  function renderProjectCard(p) {
    return (
      <Card key={p.id} style={styles.card}>
        <Text style={styles.cardTitle}>{p.title}</Text>
        <Text style={styles.cardBody} numberOfLines={4}>{p.description}</Text>
        {p.skills_needed?.length > 0 && (
          <View style={styles.metaRow}>
            {p.skills_needed.map(s => <View key={s} style={styles.metaPill}><Text style={styles.metaPillText}>{s}</Text></View>)}
          </View>
        )}
        <Text style={styles.posterLine}>
          {p.timeline} · {p.collaborators_needed} spot{p.collaborators_needed !== 1 ? 's' : ''} needed
          {!p.is_example && ` · ${posterLine(p)}`}
        </Text>
        <TouchableOpacity
          style={styles.joinBtn}
          activeOpacity={0.85}
          onPress={() => p.is_example ? setExampleSheetOpen(true) : openChat(p, p.title, 'Project Collaboration')}
        >
          <Text style={styles.joinBtnText}>Join</Text>
        </TouchableOpacity>
      </Card>
    )
  }

  // ── Special: Problems ────────────────────────────────────────────────────
  function renderProblemCard(item) {
    return (
      <TouchableOpacity key={item.id} activeOpacity={0.85} onPress={() => openProblem(item)}>
        <Card style={styles.card}>
          <View style={styles.metaRow}><View style={styles.metaPill}><Text style={styles.metaPillText}>{item.category}</Text></View></View>
          <Text style={styles.cardBody} numberOfLines={3}>{item.description}</Text>
          <View style={[styles.metaRow, { marginTop: 10 }]}>
            <Text style={styles.posterLine}>{posterLine(item)}</Text>
            <Text style={styles.viewSolutionsText}>View solutions →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  // ── Special: Suggestions ─────────────────────────────────────────────────
  function renderSuggestionCard(item) {
    const voted = mySuggestionVotes.has(item.id)
    return (
      <Card key={item.id} style={[styles.card, { flexDirection: 'row', gap: 12 }]}>
        <TouchableOpacity style={[styles.voteCol, voted && styles.voteColActive]} activeOpacity={0.8} onPress={() => toggleSuggestionVote(item)}>
          <ThumbsUp size={16} color={voted ? colors.cream : colors.navy} fill={voted ? colors.cream : 'transparent'} />
          <Text style={[styles.voteCount, voted && { color: colors.cream }]}>{item._upvotes}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.metaRow}><View style={styles.metaPill}><Text style={styles.metaPillText}>{item.category}</Text></View></View>
          <Text style={styles.cardBody} numberOfLines={3}>{item.description}</Text>
          <Text style={styles.posterLine}>{posterLine(item)}</Text>
        </View>
      </Card>
    )
  }

  // ── Special: Reviews ─────────────────────────────────────────────────────
  function renderReviewCard(r) {
    return (
      <Card key={r.id} style={styles.card}>
        <View style={styles.metaRow}>
          <Stars value={r.overall_rating} size={15} />
          {!!r.institution && <View style={styles.metaPill}><Text style={styles.metaPillText}>{r.institution}</Text></View>}
        </View>
        <Text style={styles.cardBody}>{r.review_text}</Text>
        <View style={styles.ratingGrid}>
          {RATING_CATEGORIES.slice(1).map(([key, label]) => (
            <View key={key} style={styles.ratingGridItem}>
              <Text style={styles.ratingGridLabel}>{label}</Text>
              <Stars value={r[key]} size={10} />
            </View>
          ))}
        </View>
        <Text style={styles.posterLine}>{posterLine(r)}</Text>
      </Card>
    )
  }

  // ── Special: Ads ─────────────────────────────────────────────────────────
  function renderAdCard(item) {
    const own = isOwn(item)
    const sold = item.status === 'sold'
    return (
      <Card key={item.id} style={[styles.card, sold && { opacity: 0.6 }]}>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}><Text style={styles.metaPillText}>{item.ad_type}</Text></View>
          {sold && <View style={[styles.metaPill, { backgroundColor: colors.navy }]}><Text style={[styles.metaPillText, { color: colors.cream }]}>SOLD</Text></View>}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.price != null && <Text style={styles.priceText}>€{item.price}</Text>}
        <Text style={styles.cardBody} numberOfLines={4}>{item.description}</Text>
        {!!item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.cardPhoto} resizeMode="cover" />}
        <Text style={styles.posterLine}>{posterLine(item)}</Text>
        {renderGenericActions(item, own && (
          <TouchableOpacity
            style={styles.msgBtn}
            activeOpacity={0.8}
            disabled={adBusyId === item.id}
            onPress={() => setAdStatus(item, sold ? 'active' : 'sold')}
          >
            {sold ? <RotateCcw size={12} color={colors.navy} strokeWidth={2} /> : <CheckCircle2 size={12} color={colors.navy} strokeWidth={2} />}
            <Text style={styles.msgBtnText}>{sold ? 'Mark active' : 'Mark sold'}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    )
  }

  // ── Special: Marketplace (Skills / Buy & Sell) ───────────────────────────
  // No auto-expiry — the poster marks their own listing sold/filled or
  // reopens it, same "mark sold" convention as Campus Connect's Student Ads.
  function renderMarketplaceCard(item) {
    const own = isOwn(item)
    const soldStatus = board.soldStatus || 'sold'
    const sold = item.status === soldStatus
    return (
      <Card key={item.id} style={[styles.card, sold && { opacity: 0.6 }]}>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}><Text style={styles.metaPillText}>{item.listing_type}</Text></View>
          <View style={styles.metaPill}><Text style={styles.metaPillText}>{item.category}</Text></View>
          {sold && <View style={[styles.metaPill, { backgroundColor: colors.navy }]}><Text style={[styles.metaPillText, { color: colors.cream }]}>{soldStatus.toUpperCase()}</Text></View>}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.price != null && <Text style={styles.priceText}>€{item.price}</Text>}
        {item.rate_amount != null && <Text style={styles.priceText}>€{item.rate_amount} · {item.rate_type}</Text>}
        {item.rate_amount == null && item.rate_type && <Text style={styles.posterLine}>{item.rate_type}</Text>}
        {!!item.condition && <Text style={styles.posterLine}>Condition: {item.condition}</Text>}
        <Text style={styles.cardBody} numberOfLines={4}>{item.description}</Text>
        {!!item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.cardPhoto} resizeMode="cover" />}
        <Text style={styles.posterLine}>{posterLine(item)}</Text>
        {renderGenericActions(item, own && (
          <TouchableOpacity
            style={styles.msgBtn}
            activeOpacity={0.8}
            disabled={adBusyId === item.id}
            onPress={() => setAdStatus(item, sold ? 'active' : soldStatus)}
          >
            {sold ? <RotateCcw size={12} color={colors.navy} strokeWidth={2} /> : <CheckCircle2 size={12} color={colors.navy} strokeWidth={2} />}
            <Text style={styles.msgBtnText}>{sold ? (board.activeLabel || 'Mark active') : (board.soldLabel || 'Mark sold')}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    )
  }

  // ── Special: Shared Notes / Past Papers ──────────────────────────────────
  function renderFileCard(item) {
    const own = isOwn(item)
    const isPdf = fileTypeLabel(item) === 'PDF'
    return (
      <Card key={item.id} style={styles.card}>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            {isPdf ? <FileText size={11} color={colors.navy} /> : <ImageIcon size={11} color={colors.navy} />}
            <Text style={styles.metaPillText}> {fileTypeLabel(item)}</Text>
          </View>
          {!!item.institution && <View style={styles.metaPill}><Text style={styles.metaPillText}>{item.institution}</Text></View>}
        </View>
        <Text style={styles.cardTitle}>{board.cardTitle(item)}</Text>
        <View style={styles.metaRow}>
          {(board.cardMeta ? board.cardMeta(item) : []).map((m, i) => <View key={i} style={styles.metaPill}><Text style={styles.metaPillText}>{m}</Text></View>)}
        </View>
        <View style={[styles.metaRow, { justifyContent: 'space-between' }]}>
          <Text style={styles.posterLine}>{posterLine(item)} · {item.download_count || 0} download{(item.download_count || 0) !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.joinBtn} activeOpacity={0.85} disabled={downloadBusyId === item.id} onPress={() => downloadFile(item)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <Download size={13} color={colors.cream} strokeWidth={2} />
              <Text style={styles.joinBtnText}>Download</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRow}>
          {own ? (
            <TouchableOpacity style={styles.msgBtn} activeOpacity={0.8} onPress={() => confirmRemove(item)}>
              <Trash2 size={12} color={colors.navy} strokeWidth={2} />
              <Text style={styles.msgBtnText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => report(item)} accessibilityRole="button" accessibilityLabel="Report file">
              <Flag size={13} color={colors.muted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    )
  }

  // ── Special: Accommodation card (adds post_type + rent + Roomy context) ──
  function renderAccommodationCard(item) {
    return renderGenericCard(item)
  }

  function renderCard(item) {
    if (board.special === 'clubs') return renderClubCard(item)
    if (board.special === 'projects') return renderProjectCard(item)
    if (board.special === 'problems') return renderProblemCard(item)
    if (board.special === 'suggestions') return renderSuggestionCard(item)
    if (board.special === 'reviews') return renderReviewCard(item)
    if (board.special === 'ads') return renderAdCard(item)
    if (board.special === 'marketplace') return renderMarketplaceCard(item)
    if (board.special === 'accommodation') return renderAccommodationCard(item)
    if (board.special === 'notes' || board.special === 'papers') return renderFileCard(item)
    return renderGenericCard(item)
  }

  // ── Reviews aggregate header ─────────────────────────────────────────────
  function renderReviewsAggregate() {
    if (rows.length === 0) return null
    return (
      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <Text style={styles.aggregateTitle}>Average ratings from {rows.length} review{rows.length !== 1 ? 's' : ''}</Text>
        <View style={styles.ratingGrid}>
          {RATING_CATEGORIES.map(([key, label]) => {
            const avg = rows.reduce((sum, r) => sum + (r[key] || 0), 0) / rows.length
            return (
              <View key={key} style={styles.ratingGridItem}>
                <Text style={styles.ratingGridLabel}>{label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Stars value={avg} size={11} />
                  <Text style={styles.ratingGridValue}>{avg.toFixed(1)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </Card>
    )
  }

  // ── Roomy.ie panel (Accommodation only) ──────────────────────────────────
  function renderRoomyPanel() {
    const listings = [
      { title: 'Verified student rooms', sub: 'Roomy.ie lists vetted rooms and houseshares across every Irish college town.' },
      { title: 'Landlord-verified listings', sub: 'Every listing on Roomy.ie is checked before it goes live.' },
    ]
    return (
      <View style={styles.roomyPanel}>
        <Text style={styles.roomyLabel}>FROM ROOMY.IE</Text>
        <Text style={styles.roomySub}>An external accommodation partner — browse their live listings without leaving your campus board search.</Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          {listings.map(l => (
            <View key={l.title} style={styles.roomyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomyCardTitle}>{l.title}</Text>
                <Text style={styles.roomyCardSub}>{l.sub}</Text>
              </View>
              <TouchableOpacity style={styles.roomyBtn} activeOpacity={0.85} onPress={() => Linking.openURL('https://www.roomy.ie')}>
                <Text style={styles.roomyBtnText}>View on Roomy.ie</Text>
                <ExternalLink size={12} color={colors.navy} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>{backLabel}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroIcon}>{board.icon}</Text>
          <Text style={styles.heroTitle}>{board.title}</Text>
          <Text style={styles.heroSub}>{board.tagline}</Text>
        </View>

        <View style={styles.content}>
          {board.special === 'accommodation' && renderRoomyPanel()}

          {renderFilterBar()}

          <TouchableOpacity style={styles.postBtn} activeOpacity={0.85} onPress={handlePostPress}>
            <Plus size={15} color={colors.cream} />
            <Text style={styles.postBtnText}>{board.postCta}</Text>
          </TouchableOpacity>

          {board.special === 'reviews' && renderReviewsAggregate()}

          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.xl }} />
          ) : filteredRows.length === 0 ? (
            <Text style={styles.emptyText}>Nothing here yet — be the first to post.</Text>
          ) : (
            <View style={{ gap: 10, marginTop: spacing.md }}>
              {filteredRows.map(renderCard)}
            </View>
          )}
        </View>
      </ScrollView>

      <PostFormModal
        visible={postOpen}
        onClose={() => setPostOpen(false)}
        board={board}
        onPosted={handlePosted}
        extraValues={board.captureInstitution ? { institution: user?.user_metadata?.institution_short || user?.user_metadata?.institution || null } : undefined}
      />

      {/* Clubs: request a new society, shares PostFormModal with a different target table/column */}
      <PostFormModal
        visible={clubRequestOpen}
        onClose={() => setClubRequestOpen(false)}
        board={board}
        titleOverride="Request a New Society"
        tableOverride="clubs_societies"
        extraValues={{ status: 'requested' }}
        userIdField="created_by"
        includePosterName={false}
        onPosted={handleClubRequestPosted}
      />

      <CampusGateModal visible={gateOpen} onClose={() => setGateOpen(false)} onSelected={onCampusSelected} />

      {/* Projects: "this is an example" confirmation sheet */}
      <Modal visible={exampleSheetOpen} transparent animationType="fade" onRequestClose={() => setExampleSheetOpen(false)}>
        <View style={styles.exampleBackdrop}>
          <View style={styles.exampleSheet}>
            <AlertCircle size={22} color={colors.gold} />
            <Text style={styles.exampleTitle}>This is an example project</Text>
            <Text style={styles.exampleBody}>
              It's shown to illustrate what Project Collaboration looks like. There's no real team to join yet — real
              student-posted projects will appear here and above this example set as soon as they're posted.
            </Text>
            <TouchableOpacity style={styles.exampleBtn} activeOpacity={0.85} onPress={() => setExampleSheetOpen(false)}>
              <Text style={styles.exampleBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Problems: solutions thread */}
      <Modal visible={!!selectedProblem} animationType="slide" onRequestClose={() => setSelectedProblem(null)}>
        <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setSelectedProblem(null)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
              <ChevronLeft size={20} color={colors.navy} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.threadHeaderTitle}>Problem & Solutions</Text>
            <View style={{ width: 20 }} />
          </View>
          {!!selectedProblem && (
            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
              <View style={styles.metaRow}><View style={styles.metaPill}><Text style={styles.metaPillText}>{selectedProblem.category}</Text></View></View>
              <Text style={[styles.cardBody, { fontSize: 15, marginTop: 8 }]}>{selectedProblem.description}</Text>
              <Text style={styles.posterLine}>{posterLine(selectedProblem)}</Text>

              <Text style={styles.solutionsHeading}>{solutions.length} solution{solutions.length !== 1 ? 's' : ''}</Text>
              <View style={{ gap: 10 }}>
                {solutions.map(sol => {
                  const voted = mySolutionVotes.has(sol.id)
                  return (
                    <Card key={sol.id} style={[styles.card, { flexDirection: 'row', gap: 12, padding: 14 }]}>
                      <TouchableOpacity style={[styles.voteCol, voted && styles.voteColActive]} activeOpacity={0.8} onPress={() => toggleSolutionVote(sol)}>
                        <ThumbsUp size={14} color={voted ? colors.cream : colors.navy} fill={voted ? colors.cream : 'transparent'} />
                        <Text style={[styles.voteCount, voted && { color: colors.cream }]}>{solutionVoteCounts[sol.id] || 0}</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardBody}>{sol.body}</Text>
                        <Text style={styles.posterLine}>{posterLine(sol)}</Text>
                      </View>
                    </Card>
                  )
                })}
                {solutions.length === 0 && <Text style={styles.emptyText}>No solutions yet — share what worked for you.</Text>}
              </View>
            </ScrollView>
          )}
          <View style={[styles.solutionInputRow, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={styles.solutionInput}
              placeholder="Share a solution..."
              placeholderTextColor={colors.light}
              value={solutionDraft}
              onChangeText={setSolutionDraft}
              multiline
            />
            <TouchableOpacity style={styles.solutionSendBtn} activeOpacity={0.8} onPress={postSolution} disabled={solutionSaving}>
              <Send size={16} color={colors.cream} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  notFound: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, padding: spacing.md },

  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroIcon: { fontSize: 30, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, lineHeight: 32 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 6, lineHeight: 20 },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, height: 50, marginBottom: spacing.sm,
  },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  filterBar: { marginBottom: spacing.sm },
  filterSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.card, height: 42, paddingHorizontal: 12, marginBottom: 8, ...shadows.card,
  },
  filterSearchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  filterChip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
  filterChipTextActive: { color: colors.cream },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.lg, textAlign: 'center' },

  card: { padding: 16 },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21 },
  cardBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  metaPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  metaPillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },
  cardPhoto: { width: '100%', height: 160, borderRadius: radius.card, marginTop: 10, backgroundColor: colors.cream },
  posterLine: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 10 },
  priceText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginTop: 4 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 6 },
  msgBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  iconBtn: { padding: 4 },

  joinBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  joinBtnActive: { backgroundColor: colors.cream, borderWidth: 1, borderColor: 'rgba(30,58,95,0.2)' },
  joinBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  joinBtnTextActive: { color: colors.navy },

  viewSolutionsText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, marginLeft: 'auto' },

  voteCol: { width: 46, borderRadius: radius.card, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 3 },
  voteColActive: { backgroundColor: colors.navy },
  voteCount: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  ratingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  ratingGridItem: { width: '46%' },
  ratingGridLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 3 },
  ratingGridValue: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  aggregateTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  roomyPanel: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card },
  roomyLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 0.8 },
  roomySub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  roomyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cream, borderRadius: radius.card, padding: 12 },
  roomyCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  roomyCardSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 },
  roomyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)' },
  roomyBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy },

  exampleBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  exampleSheet: { backgroundColor: colors.white, borderRadius: radius.card, padding: 22, alignItems: 'center', maxWidth: 340 },
  exampleTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.navy, marginTop: 10, textAlign: 'center' },
  exampleBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19, textAlign: 'center' },
  exampleBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 24, paddingVertical: 11, marginTop: 16 },
  exampleBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  threadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)' },
  threadHeaderTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  solutionsHeading: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 20, marginBottom: 10 },
  solutionInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)', backgroundColor: colors.white,
  },
  solutionInput: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: fonts.sans, fontSize: 13, color: colors.navy, maxHeight: 90,
  },
  solutionSendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
})
