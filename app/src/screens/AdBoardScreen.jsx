/**
 * AdBoardScreen — the Ad Board tab.
 *
 * Top to bottom: the Weekly Blueprint magazine, this week's blogs, a Post a
 * listing button, then the Marketplace as a grid of baskets (Deals, Jobs,
 * Tutors, Buy and sell, From UBP). Each basket opens its own list
 * (AdBoardBasketScreen). Posting and the paid-ad flow live in
 * components/ads/useListingActions.
 *
 * This screen is never a bare empty state. If the network fails the magazine,
 * the blogs and every basket still show, with a calm retry line.
 *
 * Ride shares, Lost and found and Notes are Campus Connect features and are
 * deliberately not part of the Ad Board.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { setStatusBarStyle } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, WifiOff } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import WeeklyHero from '../components/ads/WeeklyHero'
import BlogRow from '../components/ads/BlogRow'
import BasketShape from '../components/ads/BasketShape'
import Notice from '../components/ads/Notice'
import useListingActions from '../components/ads/useListingActions'
import AdBoardBasketScreen from './AdBoardBasketScreen'
import { useAdTokens } from '../components/ads/adTheme'
import SlowLoad from '../components/ui/SlowLoad'
import { AD_BOARD_KINDS, fetchListings, fetchCurrentIssue, ubpItems } from '../lib/adBoard'
import { useFoundationEnabled } from '../hooks/useAppFlags'
import { BASKETS, UBP_PLACEMENTS } from '../constants/adBoardContent'
import { fonts } from '../constants/theme'

export default function AdBoardScreen({ navigation }) {
  const t = useAdTokens()
  const { colors, isDark } = t
  const insets = useSafeAreaInsets()
  useFoundationEnabled() // re-render when the flag arrives, so the From UBP count is right

  const [counts, setCounts] = useState({})        // basket key -> number
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [issue, setIssue] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [overlay, setOverlay] = useState(null)    // basket key, when drawn in place
  const reqId = useRef(0)

  // The header and page are the surface colour, so the status bar icons
  // follow the theme (dark icons on light, light icons on dark).
  useFocusEffect(useCallback(() => {
    setStatusBarStyle(isDark ? 'light' : 'dark')
    return () => setStatusBarStyle('light')
  }, [isDark]))

  const load = useCallback(async () => {
    const id = ++reqId.current
    const [issueRes, ...results] = await Promise.all([
      fetchCurrentIssue().catch(() => null),
      ...AD_BOARD_KINDS.map(k => fetchListings(k).catch(() => ({ items: [], failed: true }))),
    ])
    if (id !== reqId.current) return
    const next = {}
    AD_BOARD_KINDS.forEach((k, i) => { next[k] = results[i].items.length })
    setCounts(next)
    setFailed(results.every(r => r.failed))
    setIssue(issueRes)
    setRefreshing(false)
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  const { openPost, modals } = useListingActions(navigation, { onAdClosed: load })

  function openBasket(key) {
    const registered = navigation.getState?.()?.routeNames?.includes('AdBoardBasket')
    if (registered) navigation.navigate('AdBoardBasket', { basket: key })
    else setOverlay(key)
  }

  function countLabel(b) {
    if (b.key === 'ubp') return ubpItems().length
    // The pinned UBP internships are always in Jobs, so they always count.
    const pinned = b.key === 'jobs' ? UBP_PLACEMENTS.length : 0
    if (failed) return pinned || null
    const n = (counts[b.key] || 0) + pinned
    return n > 0 ? n : null
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} />
      <PageTitle title="Ad Board" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={t.accent} colors={[t.accent]} />}
      >
        <View style={s.pad}>
          <WeeklyHero issue={issue} onPress={() => navigation.navigate('WeeklyBlueprint')} />
        </View>

        <View style={s.gapTop}>
          <BlogRow onOpenPost={slug => navigation.navigate('Article', { slug })} onSeeAll={() => navigation.navigate('Blog')} />
        </View>

        <View style={[s.pad, s.gapTop]}>
          <TouchableOpacity
            style={[s.postBtn, { backgroundColor: t.accent }]}
            activeOpacity={0.85}
            onPress={openPost}
            accessibilityRole="button"
            accessibilityLabel="Post a listing"
          >
            <Plus size={18} color={t.accentInk} strokeWidth={2.6} />
            <Text style={[s.postBtnText, { color: t.accentInk }]}>Post a listing</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.pad, s.gapTop]}>
          <Text style={[s.heading, { color: colors.textPrimary }]}>Marketplace</Text>

          {failed && (
            <Notice
              Icon={WifiOff}
              title="Can't reach the Ad Board right now"
              sub="The baskets are still here. Counts will come back when you are online."
              ctaLabel="Try again"
              onCta={load}
              dashed={false}
              style={s.retry}
            />
          )}

          <View style={s.grid}>
            {BASKETS.map(b => (
              <View key={b.key} style={b.key === 'ubp' ? s.cellWide : s.cell}>
                <BasketShape
                  visual={b.visual}
                  title={b.label}
                  line={b.line}
                  count={countLabel(b)}
                  wide={b.key === 'ubp'}
                  onPress={() => openBasket(b.key)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {modals}

      <SlowLoad loading={!loaded} />

      {overlay && (
        <View style={StyleSheet.absoluteFill}>
          <AdBoardBasketScreen navigation={navigation} basketKey={overlay} onClose={() => setOverlay(null)} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 8 },
  pad: { paddingHorizontal: 16 },
  gapTop: { marginTop: 32 },
  heading: { fontFamily: fonts.serif, fontSize: 22, marginBottom: 14 },
  postBtn: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  retry: { marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '47.5%', flexGrow: 1, flexDirection: 'column' },
  cellWide: { width: '100%' },
})
