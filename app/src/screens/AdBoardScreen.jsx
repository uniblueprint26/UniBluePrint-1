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
  Star, GraduationCap, Building2, Wallet,
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

// A representative slice of the magazine's real, fixed 13-section table of
// contents (see WeeklyBlueprintScreen's own TOC entries) — enough to read as
// a genuine content teaser on the hub card without trying to list all 13.
const TEASER_SECTIONS = [
  { label: 'Deals & Discounts', Icon: Star },
  { label: 'Coach Spotlights',  Icon: GraduationCap },
  { label: 'Lifestyle Edit',    Icon: Sparkles },
  { label: 'Campus Connect',    Icon: Building2 },
  { label: 'Money Moves',       Icon: Wallet },
]

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

        {/* ── The Weekly Blueprint — magazine banner + real content teaser ── */}
        <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('WeeklyBlueprint')}>
          <Card style={styles.magazineCard}>
            <LinearGradient
              colors={[shade(NAVY, -12), NAVY, shade(NAVY, 10)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.magazineBanner}
            >
              <View style={styles.magazineBadge}>
                <Text style={styles.magazineBadgeText}>{issue ? `ISSUE ${issue.issue_number}` : 'THIS WEEK'}</Text>
              </View>
              <Text style={styles.magazineBannerTitle}>The Weekly Blueprint</Text>
              <View style={styles.magazineRule} />
              <Text style={styles.magazineBannerTheme} numberOfLines={2}>
                {issue?.theme || 'The structure behind your success.'}
              </Text>
            </LinearGradient>

            <View style={styles.magazineInfo}>
              <Text style={styles.magazineKicker}>WHAT'S INSIDE THIS WEEK</Text>
              <View style={styles.teaserRow}>
                {TEASER_SECTIONS.map(s => (
                  <View key={s.label} style={styles.teaserChip}>
                    <s.Icon size={12} color={NAVY} strokeWidth={2} />
                    <Text style={styles.teaserChipText}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.magazineFooter}>
                <View style={styles.magazineCta}>
                  <Text style={styles.magazineCtaText}>Open This Week's Issue</Text>
                  <ChevronRight size={15} color={colors.cream} />
                </View>
                <Text style={styles.magazineFooterNote}>13 sections, every week</Text>
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

  // Magazine card — full-width gradient banner on top (readable at any
  // width, unlike the old 92px cover column it replaced) with a real
  // content teaser below, so the hub's hero card reads as the biggest,
  // most inviting thing on the page rather than a cramped sliver.
  magazineCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  magazineBanner: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  magazineBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(201,162,75,0.22)', borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  magazineBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.goldLight, letterSpacing: 0.8 },
  magazineBannerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, marginTop: 10, lineHeight: 30 },
  magazineRule: { width: 34, height: 2, backgroundColor: colors.gold, borderRadius: 1, marginTop: 10, marginBottom: 10 },
  magazineBannerTheme: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(245,240,232,0.78)', lineHeight: 18 },

  magazineInfo: { padding: 16 },
  magazineKicker: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },

  teaserRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  teaserChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,58,95,0.06)', borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 6,
  },
  teaserChipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: NAVY },

  magazineFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  magazineCta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: NAVY, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 10 },
  magazineCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.cream },
  magazineFooterNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, fontStyle: 'italic' },

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
