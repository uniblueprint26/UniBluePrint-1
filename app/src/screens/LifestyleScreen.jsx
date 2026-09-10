import { useState, useRef, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Animated,
} from 'react-native'
import {
  Heart, PiggyBank, Tag, ShoppingBag, ChevronRight,
  ChevronDown, ChevronUp, Phone, ExternalLink,
  Map as MapIcon, LayoutGrid,
  Siren, GraduationCap, LifeBuoy, Utensils, CloudRain, ShieldAlert, UserRound, Sun, MessagesSquare,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import PartnerMap from '../components/ui/PartnerMap'
import {
  FILTERS, CategorySectionHeader, PartnerGridCard, PartnerDetailSheet,
  styles as partnerStyles,
} from '../components/lifestyle/PartnerCards'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../data/lifestylePartners'
import { MENTAL_HEALTH_CATEGORIES } from '../data/mentalHealthSupport'

// Re-exported so existing imports elsewhere in the app (FounderPortalScreen,
// PartnerMap) keep working — the actual data now lives in one shared module
// so this screen and the map component don't import each other.
export { PARTNERS, MYSTERY_MAP_COUNTIES }

// Live partners are previewed here, capped, with an "Explore N more" button
// that pushes LifestylePartnersScreen for the full browsable set — the grid,
// filters, and PartnerDetailSheet there are the exact same shared components,
// just uncapped. Keeps this hub screen from turning into one long scroll
// through every live + coming-soon partner on top of Wellbeing and Budgeting.
const PREVIEW_CAP = 6

// Icon + accent per Mental Health & Support category — same visual language
// as CATEGORY_META above, so a long stack of 10 categories reads as a set of
// clearly distinct, scannable groups rather than one undifferentiated list.
const MH_CATEGORY_META = {
  crisis:              { Icon: Siren,          accent: '#DC2626' },
  counselling:         { Icon: MessagesSquare,  accent: '#0369A1' },
  student:             { Icon: GraduationCap,   accent: '#7C3AED' },
  addiction:           { Icon: LifeBuoy,        accent: '#B45309' },
  eating:              { Icon: Utensils,        accent: '#BE185D' },
  bereavement:         { Icon: CloudRain,       accent: '#4B5563' },
  'domestic-violence': { Icon: ShieldAlert,     accent: '#991B1B' },
  mens:                { Icon: UserRound,       accent: '#1D4ED8' },
  womens:              { Icon: UserRound,       accent: '#DB2777' },
  wellbeing:           { Icon: Sun,             accent: '#15803D' },
}

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress',          type: 'Guide',    readTime: '4 min read', tag: 'Mental Health' },
  { title: 'Sleep & Academic Performance',  type: 'Article',  readTime: '6 min read', tag: 'Wellbeing' },
  { title: "Student Anxiety: What's Normal", type: 'Resource', readTime: '5 min read', tag: 'Support' },
  { title: 'Mindfulness for Students',      type: 'Guide',    readTime: '3 min read', tag: 'Wellbeing' },
]

// ─── Budget Tools ─────────────────────────────────────────────────────────────
const BUDGET_TOOLS = [
  { title: 'Budget Calculator', sub: 'Plan rent, food, transport and more', Icon: PiggyBank, screen: 'Budgeting', params: { tab: 'budget' } },
  { title: 'Grants & Schemes',  sub: 'SUSI and every other Irish student grant worth knowing', Icon: Tag, screen: 'Budgeting', params: { tab: 'susi' } },
  // No dedicated job-board feature exists yet — the Ad Board is the closest
  // real "browse listings" screen in the app until one is built. Navigated
  // via the parent tab so it switches tabs correctly, not just pushes a
  // screen within Home's own stack.
  { title: 'Part-Time Work Finder', sub: 'Flexible roles near your campus', Icon: ShoppingBag, screen: 'AdBoard', params: { screen: 'AdBoardMain' } },
]

// ─── Mental Health support line card — a thin accent bar in the category's
// colour ties every card back to its category header, the same visual
// language as the partner cards' accentBar, so a long page of 10 categories
// stays easy to tell apart at a glance rather than reading as one grey block. ──
function SupportLineCard({ line, accent }) {
  return (
    <TouchableOpacity
      activeOpacity={line.link ? 0.8 : 1}
      onPress={() => line.link && Linking.openURL(line.link)}
    >
      <Card style={styles.supportCard}>
        <View style={[styles.supportAccent, { backgroundColor: accent }]} />
        <View style={styles.supportCardBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportName}>{line.name}</Text>
            <Text style={styles.supportHours}>{line.hours}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.supportNumber}>{line.number}</Text>
            {line.link?.startsWith('tel:') || line.link?.startsWith('sms:') ? (
              <Phone size={12} color={colors.muted} style={{ marginTop: 3 }} />
            ) : line.link ? (
              <ExternalLink size={12} color={colors.muted} style={{ marginTop: 3 }} />
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

// ─── Mental Health category — an icon + colour header (matching CATEGORY_META's
// visual language for partner sections) leads 3 featured cards, then an
// "Explore N more" section that animates open in place below them. ─────────────
function MentalHealthCategorySection({ category, first }) {
  const [expanded, setExpanded] = useState(false)
  const fade = useRef(new Animated.Value(0)).current
  const featured = category.items.slice(0, 3)
  const rest = category.items.slice(3)
  const meta = MH_CATEGORY_META[category.key] || { Icon: Heart, accent: colors.navy }

  function toggle() {
    if (expanded) {
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: false })
        .start(() => setExpanded(false))
    } else {
      setExpanded(true)
      fade.setValue(0)
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: false }).start()
    }
  }

  return (
    <View style={[styles.mhCategory, !first && styles.mhCategoryDivider]}>
      <View style={styles.mhCategoryHeader}>
        <View style={[styles.mhCategoryIcon, { backgroundColor: `${meta.accent}1A` }]}>
          <meta.Icon size={15} color={meta.accent} strokeWidth={2.1} />
        </View>
        <Text style={styles.supportSectionLabel}>{category.label}</Text>
      </View>
      <View style={styles.supportList}>
        {featured.map(line => <SupportLineCard key={line.name} line={line} accent={meta.accent} />)}
      </View>

      {rest.length > 0 && (
        <>
          <TouchableOpacity style={styles.exploreMoreBtn} activeOpacity={0.75} onPress={toggle}>
            <Text style={styles.exploreMoreText}>
              {expanded ? 'Show less' : `Explore ${rest.length} more`}
            </Text>
            {expanded
              ? <ChevronUp size={14} color={colors.navy} />
              : <ChevronDown size={14} color={colors.navy} />}
          </TouchableOpacity>

          {expanded && (
            <Animated.View style={[styles.supportList, { opacity: fade, marginTop: 10 }]}>
              {rest.map(line => <SupportLineCard key={line.name} line={line} accent={meta.accent} />)}
            </Animated.View>
          )}
        </>
      )}
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LifestyleScreen({ navigation, route }) {
  const routeHighlightId = route?.params?.highlightId
  const [mapHighlightId, setMapHighlightId] = useState(null)
  const highlightId = mapHighlightId || routeHighlightId

  const [activeFilter, setActiveFilter] = useState(() => {
    if (!routeHighlightId) return 'all'
    const target = PARTNERS.find(p => p.id === routeHighlightId)
    return target ? target.filterKey : 'all'
  })
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'
  const [detailPartnerId, setDetailPartnerId] = useState(null)

  // Refs for the quick-jump tool buttons alongside the Grid/Map toggle — each
  // target section reports its own offset on layout, so "Mental Health" and
  // "Budgeting" can scroll straight to it without a hardcoded pixel guess.
  const scrollRef = useRef(null)
  const mentalHealthY = useRef(0)
  const budgetingY = useRef(0)

  function scrollToSection(yRef) {
    scrollRef.current?.scrollTo({ y: Math.max(yRef.current - 12, 0), animated: true })
  }

  const liveVisible = PARTNERS.filter(p =>
    p.status === 'live' && (activeFilter === 'all' || p.filterKey === activeFilter))
  const soonVisible = PARTNERS.filter(p =>
    p.status === 'shell' && (activeFilter === 'all' || p.filterKey === activeFilter))

  // Grouped into sections when browsing everything; a single filter already
  // does the grouping for you, so headers would just repeat the filter pill.
  const showSectionHeaders = activeFilter === 'all'
  const liveGroups = showSectionHeaders
    ? FILTERS
        .filter(f => f.key !== 'all')
        .map(f => ({ key: f.key, items: liveVisible.filter(p => p.filterKey === f.key) }))
        .filter(g => g.items.length > 0)
    : [{ key: activeFilter, items: liveVisible }]

  // Cap the hub's own grid to a short preview and hand everything past that
  // off to the standalone LifestylePartnersScreen — "Explore N more" pushes
  // a real screen instead of animating the rest open in place below the fold.
  let previewRemaining = PREVIEW_CAP
  const previewGroups = []
  for (const group of liveGroups) {
    if (previewRemaining <= 0) break
    if (group.items.length <= previewRemaining) {
      previewGroups.push(group)
      previewRemaining -= group.items.length
    } else {
      previewGroups.push({ key: group.key, items: group.items.slice(0, previewRemaining) })
      previewRemaining = 0
    }
  }
  const hiddenLiveCount = liveVisible.length - (PREVIEW_CAP - Math.max(previewRemaining, 0))
  const moreCount = hiddenLiveCount + soonVisible.length

  const detailPartner = PARTNERS.find(p => p.id === detailPartnerId) || null

  function handleViewListing(id) {
    const target = PARTNERS.find(p => p.id === id)
    setMapHighlightId(id)
    setActiveFilter(target ? target.filterKey : 'all')
    setViewMode('grid')
    setDetailPartnerId(id)
  }

  // A highlight arriving from a deep link (route param) opens straight to
  // that partner's full listing, same as tapping "View full listing" on the map.
  useEffect(() => {
    if (routeHighlightId && !mapHighlightId) setDetailPartnerId(routeHighlightId)
  }, [routeHighlightId])

  return (
    <View style={styles.screen}>
      <TopBar navigation={navigation} showBack />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
          <Text style={styles.heroTitle}>Lifestyle Blueprint</Text>
          <Text style={styles.heroSub}>
            Partner deals, wellbeing support, and money tools, built around what life actually costs.
          </Text>
        </View>

        {/* ── Partner Listings ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Confirmed Partners" title="Partner Listings" />

          {/* Grid / Map toggle, plus quick-jump tool shortcuts to the two
              other Lifestyle sections — styled as one control row so all four
              read as the same family of button, even though only the first
              two hold "active" state (view modes) and the last two just jump
              the page to where they live. Mental Health and Wellbeing are the
              same on-page section, so this is one shortcut, not two. */}
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('grid')}
              activeOpacity={0.8}
            >
              <LayoutGrid size={14} color={viewMode === 'grid' ? colors.white : colors.navy} />
              <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
            >
              <MapIcon size={14} color={viewMode === 'map' ? colors.white : colors.navy} />
              <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>Map</Text>
            </TouchableOpacity>
            <View style={styles.viewToggleDivider} />
            <TouchableOpacity
              style={styles.viewToggleBtn}
              onPress={() => scrollToSection(mentalHealthY)}
              activeOpacity={0.8}
            >
              <Heart size={14} color={colors.navy} />
              {/* Labelled "Wellbeing" (matching the section's own eyebrow),
                  not "Mental Health" — shorter, fits one line at narrow
                  widths, and covers the same single entry point either way. */}
              <Text style={styles.viewToggleText}>Wellbeing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewToggleBtn}
              onPress={() => scrollToSection(budgetingY)}
              activeOpacity={0.8}
            >
              <PiggyBank size={14} color={colors.navy} />
              <Text style={styles.viewToggleText}>Budgeting</Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'map' ? (
            <View style={styles.mapSection}>
              <PartnerMap onViewListing={handleViewListing} />
            </View>
          ) : (
            <>
              {/* Filter pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={partnerStyles.filterScroll}
                contentContainerStyle={partnerStyles.filterContent}
              >
                {FILTERS.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[partnerStyles.filterPill, activeFilter === f.key && partnerStyles.filterPillActive]}
                    onPress={() => setActiveFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[partnerStyles.filterPillText, activeFilter === f.key && partnerStyles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Live partners, grouped by category, as a real 2-up square
                  grid — tapping a tile opens the full listing in a sheet
                  rather than expanding in place, so the grid stays a grid.
                  Capped to a short preview; "Explore N more" below pushes
                  the standalone screen with the full set + Coming Soon. */}
              {previewGroups.map(group => (
                <View key={group.key} style={{ marginBottom: spacing.lg }}>
                  {showSectionHeaders && <CategorySectionHeader filterKey={group.key} />}
                  <View style={partnerStyles.partnerGrid}>
                    {group.items.map(p => (
                      <PartnerGridCard
                        key={p.id}
                        partner={p}
                        highlighted={p.id === highlightId}
                        onPress={() => setDetailPartnerId(p.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {liveVisible.length === 0 && soonVisible.length === 0 && (
                <Text style={partnerStyles.emptyText}>No partners in this category yet.</Text>
              )}

              {moreCount > 0 && (
                <TouchableOpacity
                  style={styles.exploreMoreBtn}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('LifestylePartners', { filterKey: activeFilter })}
                >
                  <Text style={styles.exploreMoreText}>
                    {liveVisible.length === 0
                      ? `${soonVisible.length} coming soon in this category`
                      : `Explore ${moreCount} more`}
                  </Text>
                  <ChevronRight size={14} color={colors.navy} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── Mental Health & Wellbeing ─────────────────────────────────────── */}
        <View
          style={styles.section}
          onLayout={e => { mentalHealthY.current = e.nativeEvent.layout.y }}
        >
          <SectionHeader eyebrow="Wellbeing" title="Mental Health & Support" />

          {/* Crisis Support leads every time — whoever needs it most sees it
              first, before the "Need to Talk" prompt or anything else. */}
          <MentalHealthCategorySection category={MENTAL_HEALTH_CATEGORIES[0]} first />

          <View style={styles.supportBanner}>
            <Heart size={16} color={colors.cream} fill={colors.cream} />
            <Text style={styles.supportBannerText}>
              Need to talk? Free, confidential support is available 24/7.
            </Text>
          </View>

          {MENTAL_HEALTH_CATEGORIES.slice(1).map(category => (
            <MentalHealthCategorySection key={category.key} category={category} />
          ))}

          <SectionHeader eyebrow="Resources" title="Wellbeing Reads" style={{ marginTop: spacing.xl }} />
          <View style={styles.supportList}>
            {WELLBEING_RESOURCES.map((r, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => Linking.openURL('https://spunout.ie')}>
                <Card style={styles.articleCard}>
                  <View style={styles.articleTag}>
                    <Text style={styles.articleTagText}>{r.tag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleTitle}>{r.title}</Text>
                    <Text style={styles.articleMeta}>{r.type} · {r.readTime}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Budgeting Tools ───────────────────────────────────────────────── */}
        <View
          style={styles.section}
          onLayout={e => { budgetingY.current = e.nativeEvent.layout.y }}
        >
          <SectionHeader eyebrow="Money & Finance" title="Budgeting Tools" />
          <View style={styles.supportList}>
            {BUDGET_TOOLS.map(({ title, sub, Icon, screen, params }) => (
              <TouchableOpacity key={title} activeOpacity={0.8} onPress={() => navigation.navigate(screen, params)}>
                <Card style={styles.budgetCard}>
                  <View style={styles.budgetIconWrap}>
                    <Icon size={20} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.budgetTitle}>{title}</Text>
                    <Text style={styles.budgetSub}>{sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Card style={styles.tipCard}>
            <Text style={styles.tipEyebrow}>MONEY TIP OF THE WEEK</Text>
            <Text style={styles.tipText}>
              Cook in bulk on Sundays. Young people who meal prep spend significantly less on food per week than those who don't.
            </Text>
          </Card>
        </View>

      </ScrollView>

      <PartnerDetailSheet
        partner={detailPartner}
        visible={!!detailPartner}
        onClose={() => { setDetailPartnerId(null); setMapHighlightId(null) }}
        navigation={navigation}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.cream },
  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed navy header on every platform.
  scrollView: { flex: 1 },
  scroll:  { paddingBottom: 56 },

  // Hero
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },

  // Filter pills, category headers, the partner grid, Coming Soon grid, and
  // the Partner Detail Sheet all live in components/lifestyle/PartnerCards
  // (imported above as `partnerStyles`) — shared with LifestylePartnersScreen
  // so both render identically.

  // Grid / Map toggle + Mental Health / Budgeting quick-jump shortcuts — one
  // unified control row. flex:1 on every button divides the row evenly so
  // all four read as the same family of control at a glance.
  viewToggleRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 4,
    borderRadius: radius.button, gap: 2, marginBottom: spacing.md, ...shadows.card,
  },
  viewToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, paddingHorizontal: 2, borderRadius: radius.button - 2,
  },
  viewToggleBtnActive: { backgroundColor: colors.navy },
  viewToggleText:       { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.navy },
  viewToggleTextActive: { color: colors.white },
  viewToggleDivider:    { width: 1, height: 20, backgroundColor: colors.border },
  mapSection: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: spacing.md, marginTop: 4,
  },

  // Wellbeing
  // marginTop/marginBottom give the banner clear air from the Crisis Support
  // cards above it and the next category below, rather than sitting flush
  // against either.
  supportBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    marginTop: spacing.md, marginBottom: spacing.lg,
  },
  supportBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.white, flex: 1, lineHeight: 19 },
  // Mental Health categories — icon + colour header per category (mirrors
  // CATEGORY_META's partner-section language), a thin divider between
  // categories after the first, and generous vertical rhythm so 10 categories
  // read as distinct groups on the way down the page, not one long scroll.
  mhCategory: { marginBottom: spacing.xl },
  mhCategoryDivider: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,58,95,0.08)',
  },
  mhCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  mhCategoryIcon: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  supportSectionLabel: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.navy, letterSpacing: 0.2 },
  supportList: { gap: 8, marginTop: spacing.sm },
  // Left accent bar (matching the category's colour) sits flush with the
  // card edge, so the padded content needs its own inner wrapper — the same
  // structure the partner grid card's accent bar uses.
  supportCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  supportAccent: { width: 3, alignSelf: 'stretch' },
  supportCardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14 },
  supportName:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  supportHours:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  supportNumber: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  exploreMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 10, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  exploreMoreText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  // Articles
  articleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  articleTag: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0,
  },
  articleTagText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream },
  articleTitle:   { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  articleMeta:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  // Budget
  budgetCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  budgetIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  budgetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  budgetSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  tipCard:     { marginTop: spacing.md, backgroundColor: colors.navy, padding: 18 },
  tipEyebrow:  { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1 },
  tipText:     { fontFamily: fonts.sans, fontSize: 14, color: colors.cream, lineHeight: 21, marginTop: 8 },
})
