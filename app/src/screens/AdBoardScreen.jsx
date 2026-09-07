/**
 * AdBoardScreen — the Ad Board's own landing page: the live ad list itself,
 * plus clear entry points out to the Blog, the Marketplace, and this week's
 * Weekly Blueprint magazine. Blog and Marketplace are dedicated standalone
 * screens (BlogScreen / MarketplaceScreen), not scrolled sections nested in
 * this page — tapping either pushes into its own screen. The Weekly
 * Blueprint magazine (WeeklyBlueprintScreen) is reached the same way, via
 * "Open This Week's Issue", rather than this page doubling as the flip-book
 * reader itself.
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Plus, ChevronRight, Megaphone, Menu, BookOpen, ShoppingBag, Sparkles,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import PostAdModal from '../components/ads/PostAdModal'
import { supabase } from '../lib/supabase'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { goToHome, openMenu } from '../navigation/helpers'
import { CATEGORY, CURATED_ADS, getAdPressHandler } from '../data/adBoardAds'
import { POSTS as BLOG_POSTS } from '../data/blogPosts'

const NAVY = colors.navy

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

export default function AdBoardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [liveBoardAds, setLiveBoardAds] = useState([])
  const [issue, setIssue] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [liveAdsRes, issueRes] = await Promise.allSettled([
        supabase.from('ads').select('*').eq('active', true).overlaps('boards', ['cross-ireland', 'campus', 'course']),
        supabase.rpc('get_current_weekly_issue'),
      ])
      if (cancelled) return
      setLiveBoardAds((liveAdsRes.status === 'fulfilled' ? liveAdsRes.value.data : null) || [])
      setIssue((issueRes.status === 'fulfilled' ? issueRes.value.data?.[0] : null) || null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const ads = [...CURATED_ADS, ...liveBoardAds]

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <UBPLogo height={26} color={colors.cream} onPress={() => goToHome(navigation)} />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => openMenu(navigation)}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={19} color={colors.cream} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postBtn} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Plus size={14} color={colors.navy} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>

        {/* ── The Weekly Blueprint — magazine cover + Open button ────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('WeeklyBlueprint')}>
          <Card style={styles.magazineCard}>
            <LinearGradient
              colors={[shade(NAVY, -12), NAVY, shade(NAVY, 10)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.magazineCover}
            >
              <View style={styles.magazineBadge}>
                <Text style={styles.magazineBadgeText}>{issue ? `ISSUE ${issue.issue_number}` : 'THIS WEEK'}</Text>
              </View>
              <Text style={styles.magazineCoverTitle}>The{'\n'}Weekly{'\n'}Blueprint</Text>
            </LinearGradient>
            <View style={styles.magazineInfo}>
              <Text style={styles.magazineKicker}>THE WEEKLY BLUEPRINT</Text>
              <Text style={styles.magazineTitle} numberOfLines={2}>{issue?.theme || 'The structure behind your success.'}</Text>
              <Text style={styles.magazineSub}>Deals, coach spotlights, campus news, the Blog and Marketplace, and more — all in one weekly issue.</Text>
              <View style={styles.magazineCta}>
                <Text style={styles.magazineCtaText}>Open This Week's Issue</Text>
                <ChevronRight size={15} color={colors.cream} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* ── Entry points: Blog / Marketplace ────────────────────────────── */}
        <View style={styles.entryRow}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => navigation.navigate('Blog')}>
            <Card style={styles.entryCard}>
              <View style={[styles.entryIconWrap, { backgroundColor: '#F5F0E8' }]}>
                <BookOpen size={20} color={NAVY} strokeWidth={1.8} />
              </View>
              <Text style={styles.entryTitle}>Blog</Text>
              <Text style={styles.entrySub}>Real Irish education news and guides</Text>
              <View style={styles.entryFooter}>
                <Text style={styles.entryFooterText}>{BLOG_POSTS.length} articles</Text>
                <ChevronRight size={14} color={colors.light} />
              </View>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => navigation.navigate('Marketplace')}>
            <Card style={styles.entryCard}>
              <View style={[styles.entryIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <ShoppingBag size={20} color="#6D28D9" strokeWidth={1.8} />
              </View>
              <Text style={styles.entryTitle}>Marketplace</Text>
              <Text style={styles.entrySub}>Offer a skill, or buy and sell with students</Text>
              <View style={styles.entryFooter}>
                <Text style={styles.entryFooterText}>Skills · Buy & Sell</Text>
                <ChevronRight size={14} color={colors.light} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* ── The Ad Board itself — live ads ──────────────────────────────── */}
        <Text style={styles.sectionKicker}>THIS WEEK'S AD BOARD</Text>
        <Text style={styles.sectionHeading}>Real deals, real students</Text>
        <Text style={styles.sectionSub}>Curated partners and student-posted ads from across Ireland.</Text>

        <Card style={{ marginTop: 14, padding: 6 }}>
          {loading ? (
            <Text style={styles.emptyNote}>Loading the Ad Board...</Text>
          ) : ads.length === 0 ? (
            <Text style={styles.emptyNote}>No ads live right now — be the first to post one.</Text>
          ) : ads.map((ad, i) => {
            const cat = ad.category ? CATEGORY[ad.category] : null
            return (
              <TouchableOpacity
                key={ad.id}
                style={[styles.adRow, i === ads.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.8}
                onPress={getAdPressHandler(ad)}
              >
                <View style={[styles.adIcon, { backgroundColor: cat?.bg || '#F5F0E8' }]}>
                  {cat ? <cat.Icon size={16} color={cat.color} strokeWidth={1.8} /> : <Megaphone size={16} color={NAVY} strokeWidth={1.8} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adBrand}>{ad.brand || ad.title}</Text>
                  <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
                </View>
                <ChevronRight size={14} color={colors.light} />
              </TouchableOpacity>
            )
          })}
        </Card>

        <TouchableOpacity style={styles.advertiseCta} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
          <Sparkles size={14} color={colors.cream} strokeWidth={2} />
          <Text style={styles.advertiseCtaText}>Advertise With Us</Text>
        </TouchableOpacity>

      </ScrollView>

      <PostAdModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: NAVY, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  menuBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: NAVY },

  // Magazine card
  magazineCard: { flexDirection: 'row', padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  magazineCover: { width: 92, padding: 12, justifyContent: 'space-between' },
  magazineBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,240,232,0.14)', borderRadius: radius.badge, paddingHorizontal: 7, paddingVertical: 3 },
  magazineBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 8, color: 'rgba(245,240,232,0.85)', letterSpacing: 0.5 },
  magazineCoverTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.cream, lineHeight: 19 },
  magazineInfo: { flex: 1, padding: 16 },
  magazineKicker: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  magazineTitle: { fontFamily: fonts.serif, fontSize: 16, color: NAVY, marginTop: 5, lineHeight: 20 },
  magazineSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 6, lineHeight: 16 },
  magazineCta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: NAVY, borderRadius: radius.button, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10, alignSelf: 'flex-start' },
  magazineCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },

  // Entry cards (Blog / Marketplace)
  entryRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  entryCard: { padding: 16 },
  entryIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { fontFamily: fonts.serif, fontSize: 16, color: NAVY, marginTop: 10 },
  entrySub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 4, lineHeight: 16, minHeight: 32 },
  entryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  entryFooterText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.light },

  sectionKicker: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeading: { fontFamily: fonts.serif, fontSize: 22, color: NAVY, marginTop: 6 },
  sectionSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.light, fontStyle: 'italic', padding: 14 },
  adRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  adIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  adBrand: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  adTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: NAVY, marginTop: 2 },

  advertiseCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: NAVY, borderRadius: radius.button, paddingVertical: 14, marginTop: 16,
  },
  advertiseCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})
