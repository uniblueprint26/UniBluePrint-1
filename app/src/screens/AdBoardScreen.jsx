/**
 * AdBoardScreen — the Ad Board: one calm list of listings.
 *
 * Filter chips (Deals, Jobs, Rides, Lost and found, Tutors, Notes) each read
 * their own set of existing tables through lib/adBoard.js. Tapping a card
 * opens the same contact flows as before (partner contact card, a paid ad's
 * own link, or a detail card that can message the poster or open the file).
 * "Post a listing" opens the existing post flows for each source, and paid
 * ads still go through PostAdModal and its checkout unchanged.
 *
 * The old editorial pages (The Weekly Blueprint, Blog, Marketplace) are not
 * part of this view any more. They stay reachable from the quiet row at the
 * bottom of the list.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, Platform,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { setStatusBarStyle } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, Tag, BookOpen, ShoppingBag, Newspaper, AlertCircle } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import FilterChips from '../components/ads/FilterChips'
import FeaturedDealCard from '../components/ads/FeaturedDealCard'
import ListingCard from '../components/ads/ListingCard'
import ListingDetailModal from '../components/ads/ListingDetailModal'
import PostListingSheet from '../components/ads/PostListingSheet'
import PostAdModal from '../components/ads/PostAdModal'
import PartnerContactModal from '../components/ads/PartnerContactModal'
import { useAdTokens } from '../components/ads/adTheme'
import { AD_BOARD_KINDS, fetchListings } from '../lib/adBoard'
import { supabase } from '../lib/supabase'
import { fonts } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Safety concern', 'Other']

const EMPTY_COPY = {
  deals:  { title: 'No deals yet', subtitle: 'Partner deals and student listings will show up here.' },
  jobs:   { title: 'No jobs yet', subtitle: 'Part-time work, internships and volunteering will show up here.' },
  rides:  { title: 'No rides yet', subtitle: 'Heading somewhere with a spare seat? Post a route.' },
  lost:   { title: 'Nothing lost or found', subtitle: 'Lost something, or found something? Post it here.' },
  tutors: { title: 'No tutors yet', subtitle: 'Offer tutoring, or ask for help with a subject.' },
  notes:  { title: 'No notes yet', subtitle: 'Share your notes to help other students.' },
}

export default function AdBoardScreen({ navigation }) {
  const t = useAdTokens()
  const { colors, isDark } = t
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [kind, setKind] = useState('deals')
  const [data, setData] = useState({})          // kind -> { items, failed }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [adOpen, setAdOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [contactAd, setContactAd] = useState(null)
  const reqId = useRef(0)

  // The header and page are the surface colour, so the status bar icons
  // follow the theme (dark icons on light, light icons on dark).
  useFocusEffect(useCallback(() => {
    setStatusBarStyle(isDark ? 'light' : 'dark')
    return () => setStatusBarStyle('light')
  }, [isDark]))

  const load = useCallback(async (k, { silent } = {}) => {
    const id = ++reqId.current
    if (!silent) setLoading(true)
    let result
    try {
      result = await fetchListings(k)
    } catch {
      result = { items: [], failed: true }
    }
    if (id !== reqId.current) return
    setData(prev => ({ ...prev, [k]: result }))
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load(kind) }, [kind, load])

  function onRefresh() {
    setRefreshing(true)
    load(kind, { silent: true })
  }

  const current = data[kind]
  const items = current?.items || []
  const hero = kind === 'deals' ? items.find(i => i.source === 'deals' && i.percent) : null
  const list = hero ? items.filter(i => i !== hero) : items

  // ── Taps ────────────────────────────────────────────────────────────────
  function openLink(url) {
    if (!url) return
    if (Platform.OS === 'web') window.open(url, '_blank')
    else Linking.openURL(url)
  }

  function openItem(item) {
    if (item.action === 'link') return openLink(item.link)
    if (item.action === 'partner') {
      return setContactAd({
        id: item.id,
        brand: item.partner?.name || item.title,
        title: item.title,
        description: item.description,
        partnerSlug: item.partner?.slug || null,
        hasContact: !!item.partner?.slug,
      })
    }
    setDetail(item)
  }

  function openBoard(item) {
    const b = item.board
    if (!b) return
    setDetail(null)
    navigation.navigate('BoardDetail', { boardKey: b.key, ...(b.registry !== 'campus' ? { registry: b.registry } : {}) })
  }

  function messagePoster(item) {
    const b = item.board
    setDetail(null)
    navigation.navigate('ChatRoom', {
      contextType: 'board',
      contextId: `${b?.key || item.source}-${item.id}`,
      roomName: item.title,
      subtitle: b?.title || 'Ad Board',
      posterId: item.ownerId,
      posterName: item.posterName,
    })
  }

  async function openFile(item) {
    // Same download count as the Shared Notes board.
    await supabase.rpc('increment_shared_note_downloads', { note_id: item.id })
    openLink(item.fileUrl)
  }

  function report(item) {
    Alert.alert('Report this listing', 'What best describes the issue?', [
      ...REPORT_REASONS.map(reason => ({
        text: reason,
        onPress: async () => {
          const { error } = await supabase.from('operations_flags').insert({
            flagged_by: user?.id, target_type: item.source, target_id: item.id, reason,
          })
          Alert.alert(error ? 'Something went wrong' : 'Reported', error ? 'Please try again.' : 'Thanks. The UniBlueprint team will take a look.')
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function pickPost(option) {
    setPostOpen(false)
    if (option.paid) { setAdOpen(true); return }
    const { boardKey, registry } = option.route
    navigation.navigate('BoardDetail', { boardKey, openPostForm: true, ...(registry ? { registry } : {}) })
  }

  const accentBtn = { backgroundColor: t.accent }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} />

      <PageTitle
        title="Ad Board"
        color={t.accent}
        right={(
          <TouchableOpacity
            style={[s.postBtn, accentBtn]}
            activeOpacity={0.85}
            onPress={() => setPostOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Post a listing"
          >
            <Plus size={16} color={t.accentInk} strokeWidth={2.6} />
            <Text style={[s.postBtnText, { color: t.accentInk }]}>Post a listing</Text>
          </TouchableOpacity>
        )}
      />

      <FilterChips kinds={AD_BOARD_KINDS} value={kind} onChange={setKind} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} colors={[t.accent]} />}
      >
        {loading && !current ? (
          <Skeleton />
        ) : current?.failed ? (
          <View style={s.notice}>
            <AlertCircle size={28} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={[s.noticeTitle, { color: colors.textPrimary }]}>Could not load the board</Text>
            <Text style={[s.noticeSub, { color: colors.textSecondary }]}>Check your connection and try again.</Text>
            <TouchableOpacity style={[s.retry, accentBtn]} activeOpacity={0.85} onPress={() => load(kind)}>
              <Text style={[s.retryText, { color: t.accentInk }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={EMPTY_COPY[kind].title}
            subtitle={EMPTY_COPY[kind].subtitle}
            ctaLabel="Post a listing"
            onCtaPress={() => setPostOpen(true)}
          />
        ) : (
          <View style={s.list}>
            {hero && <FeaturedDealCard deal={hero} onPress={() => openItem(hero)} />}
            {list.map(item => <ListingCard key={item.key} item={item} onPress={() => openItem(item)} />)}
            {loading && <ActivityIndicator color={t.accent} style={{ marginTop: 8 }} />}
          </View>
        )}

        {!(loading && !current) && (
          <View style={s.more}>
            <Text style={[s.moreLabel, { color: colors.textSecondary }]}>More from the Ad Board</Text>
            <View style={s.moreRow}>
              <MoreLink Icon={Newspaper} label="Weekly Blueprint" onPress={() => navigation.navigate('WeeklyBlueprint')} />
              <MoreLink Icon={BookOpen} label="Blog" onPress={() => navigation.navigate('Blog')} />
              <MoreLink Icon={ShoppingBag} label="Marketplace" onPress={() => navigation.navigate('Marketplace')} />
            </View>
          </View>
        )}
      </ScrollView>

      <PostListingSheet visible={postOpen} onClose={() => setPostOpen(false)} onPick={pickPost} />
      <PostAdModal visible={adOpen} onClose={() => { setAdOpen(false); load(kind, { silent: true }) }} />
      <PartnerContactModal ad={contactAd} visible={!!contactAd} onClose={() => setContactAd(null)} />
      <ListingDetailModal
        item={detail}
        visible={!!detail}
        isOwn={!!detail && !!user?.id && detail.ownerId === user.id}
        onClose={() => setDetail(null)}
        onMessage={messagePoster}
        onOpenLink={openLink}
        onOpenFile={openFile}
        onOpenBoard={openBoard}
        onReport={report}
      />
    </View>
  )
}

function MoreLink({ Icon, label, onPress }) {
  const t = useAdTokens()
  return (
    <TouchableOpacity
      style={[s.moreLink, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={14} color={t.colors.textSecondary} strokeWidth={1.8} />
      <Text style={[s.moreLinkText, { color: t.colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// Honest loading: grey cards in the shape of the real ones.
function Skeleton() {
  const { colors } = useAdTokens()
  const block = { backgroundColor: colors.tabFill, borderRadius: 8 }
  return (
    <View style={s.list} accessibilityLabel="Loading listings">
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={[s.skel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[block, { width: 52, height: 52, borderRadius: 14 }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[block, { width: '35%', height: 10 }]} />
            <View style={[block, { width: '80%', height: 14 }]} />
            <View style={[block, { width: '55%', height: 10 }]} />
          </View>
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 14, borderRadius: 21, marginBottom: 2 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  list: { gap: 12 },
  skel: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  notice: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 8 },
  noticeTitle: { fontFamily: fonts.serif, fontSize: 22, marginTop: 8, textAlign: 'center' },
  noticeSub: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center' },
  retry: { marginTop: 12, height: 44, paddingHorizontal: 24, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  more: { marginTop: 32, alignItems: 'center', gap: 10 },
  moreLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.4 },
  moreRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  moreLink: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  moreLinkText: { fontFamily: fonts.sansMedium, fontSize: 13 },
})
