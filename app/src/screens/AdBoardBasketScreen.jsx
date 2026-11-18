/**
 * AdBoardBasketScreen — one basket of the Ad Board Marketplace: Deals, Jobs,
 * Tutors, Buy and sell, or From UBP. Params: { basket }.
 *
 * It is never a bare empty page. A basket with no rows shows its UBP starter
 * cards or "Be the first to post here", and if the network fails the starters
 * and a calm retry line still show.
 *
 * AdBoardScreen opens this through the 'AdBoardBasket' route when that route
 * is registered in the Ad Board stack. If it is not, AdBoardScreen draws this
 * same component over the tab instead (props `basketKey` and `onClose`).
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, WifiOff, Sparkles, PackageOpen, Pin } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import ListingCard from '../components/ads/ListingCard'
import PinnedJobCard from '../components/ads/PinnedJobCard'
import TrialHero from '../components/ads/TrialHero'
import Notice from '../components/ads/Notice'
import useListingActions from '../components/ads/useListingActions'
import { useAdTokens } from '../components/ads/adTheme'
import { fetchListings, ubpItems, pinnedJobItems, exampleTutorItems } from '../lib/adBoard'
import { BASKET_BY_KEY, EXAMPLE_TUTOR_NOTE, PLACEMENTS_INTRO } from '../constants/adBoardContent'
import { fonts } from '../constants/theme'

export default function AdBoardBasketScreen({ navigation, route, basketKey, onClose }) {
  const t = useAdTokens()
  const { colors } = t
  const insets = useSafeAreaInsets()
  const key = basketKey || route?.params?.basket || 'deals'
  const basket = BASKET_BY_KEY[key] || BASKET_BY_KEY.deals

  const [state, setState] = useState({ items: [], failed: false })
  const [loading, setLoading] = useState(key !== 'ubp')
  const [refreshing, setRefreshing] = useState(false)
  const reqId = useRef(0)

  const load = useCallback(async ({ silent } = {}) => {
    if (key === 'ubp') { setLoading(false); setRefreshing(false); return }
    const id = ++reqId.current
    if (!silent) setLoading(true)
    let result
    try { result = await fetchListings(key) } catch { result = { items: [], failed: true } }
    if (id !== reqId.current) return
    setState(result)
    setLoading(false)
    setRefreshing(false)
  }, [key])

  useEffect(() => { load() }, [load])

  const { openItem, openUbpCard, openPost, openLink, modals } = useListingActions(navigation, { onAdClosed: () => load({ silent: true }) })

  // In the overlay the back button closes the basket instead of popping a stack.
  const headerNav = useMemo(() => {
    if (!onClose || !navigation) return navigation
    return Object.assign(Object.create(navigation), { canGoBack: () => true, goBack: onClose })
  }, [navigation, onClose])

  const real = state.items
  const tap = item => (item.card ? openUbpCard(item.card) : openItem(item))

  // ── What this basket shows ────────────────────────────────────────────────
  let lead = null
  let list = real
  let tail = null
  let pinned = null
  let afterList = null

  if (key === 'deals') {
    lead = <TrialHero />
    tail = (
      <Notice Icon={Sparkles} title="More deals coming soon." sub="More Lifestyle partner offers will appear here." />
    )
  } else if (key === 'jobs') {
    // The UBP internships sit above any real jobs, under a small Pinned label.
    pinned = (
      <View style={s.pinned}>
        <View style={s.pinRow}>
          <Pin size={14} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={[s.pinLabel, { color: colors.textPrimary }]}>Pinned</Text>
        </View>
        <Text style={[s.intro, { color: colors.textSecondary }]}>{PLACEMENTS_INTRO}</Text>
        {pinnedJobItems().map(item => (
          <PinnedJobCard key={item.key} item={item} onApply={i => openLink(i.applyUrl)} />
        ))}
      </View>
    )
    if (real.length === 0) {
      tail = <Notice Icon={PackageOpen} title="Be the first to post here" sub="Part-time work, internships and volunteering from students and employers." ctaLabel="Post a job" onCta={openPost} />
    }
  } else if (key === 'tutors') {
    // Real tutors first, then the examples. The examples always show.
    afterList = (
      <View style={s.examples}>
        <Notice Icon={PackageOpen} title="Example tutors" sub={EXAMPLE_TUTOR_NOTE} ctaLabel="Post yours" onCta={openPost} />
        {exampleTutorItems().map(item => <ListingCard key={item.key} item={item} />)}
      </View>
    )
  } else if (key === 'marketplace' && real.length === 0) {
    list = ubpItems('marketplace')
    tail = <Notice Icon={PackageOpen} title="Be the first to post here" sub="Sell an item, or offer a skill, and it will show up in this basket." ctaLabel="Post a listing" onCta={openPost} />
  } else if (key === 'ubp') {
    list = ubpItems()
    lead = (
      <Text style={[s.intro, { color: colors.textSecondary }]}>
        Posted by UBP so you can see what to post where. Feel free to advertise jobs you may be offering too.
      </Text>
    )
  }

  const showFailed = state.failed && !loading

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={headerNav} showBack />
      <PageTitle
        title={basket.label}
        subtitle={basket.line}
        right={key === 'ubp' ? null : (
          <TouchableOpacity
            style={[s.postBtn, { backgroundColor: t.accent }]}
            activeOpacity={0.85}
            onPress={openPost}
            accessibilityRole="button"
            accessibilityLabel="Post a listing"
          >
            <Plus size={16} color={t.accentInk} strokeWidth={2.6} />
            <Text style={[s.postBtnText, { color: t.accentInk }]}>Post</Text>
          </TouchableOpacity>
        )}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load({ silent: true }) }} tintColor={t.accent} colors={[t.accent]} />}
      >
        {showFailed && (
          <Notice
            Icon={WifiOff}
            title="Can't load the latest right now"
            sub="Check your connection. Here is what you can do in the meantime."
            ctaLabel="Try again"
            onCta={() => load()}
            dashed={false}
          />
        )}
        {lead}
        {pinned}
        {key === 'jobs' && real.length > 0 && !loading && (
          <Text style={[s.pinLabel, { color: colors.textPrimary }]}>More jobs</Text>
        )}
        {loading ? <Skeleton /> : list.map(item => (
          <ListingCard key={item.key} item={item} onPress={() => tap(item)} />
        ))}
        {!loading && afterList}
        {!loading && tail}
      </ScrollView>

      {modals}
    </View>
  )
}

function Skeleton() {
  const { colors } = useAdTokens()
  const block = { backgroundColor: colors.tabFill, borderRadius: 8 }
  return (
    <View style={{ gap: 14 }} accessibilityLabel="Loading">
      {[0, 1, 2].map(i => (
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
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, marginBottom: 2 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  pinned: { gap: 14 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  examples: { gap: 14 },
  intro: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  skel: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
})
