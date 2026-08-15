import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Image,
} from 'react-native'
import {
  Heart, PiggyBank, Tag, ShoppingBag, ChevronRight,
  ChevronDown, ChevronUp, Phone, Mail, AtSign, Link2, Lock,
  Dumbbell, Sparkles, UtensilsCrossed, Wrench, Map as MapIcon, List as ListIcon,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import PartnerMap from '../components/ui/PartnerMap'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { COACHES } from './ElevationScreen'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../data/lifestylePartners'

// Re-exported so existing imports elsewhere in the app (FounderPortalScreen,
// PartnerMap) keep working — the actual data now lives in one shared module
// so this screen and the map component don't import each other.
export { PARTNERS, MYSTERY_MAP_COUNTIES }

// ─── Filter Pills ────────────────────────────────────────────────────────────
// Labels widened to actually cover everyone grouped under them: "Beauty"
// on its own reads as nail/lash/makeup only, but the group also holds every
// barber; "Services" was too vague for a group that's mostly photography,
// marketing, and design work with automotive/housing mixed in.
const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'fitness',  label: 'Health & Fitness' },
  { key: 'beauty',   label: 'Beauty & Grooming' },
  { key: 'fashion',  label: 'Fashion' },
  { key: 'food',     label: 'Food & Drink' },
  { key: 'services', label: 'Creative & Services' },
]

// Section grouping metadata for the "All" view — same categories as the
// filter pills, minus "All" itself, each with an icon and its own accent so
// scanning a long list reads as curated sections, not one flat pile.
const CATEGORY_META = {
  fitness:  { label: 'Health & Fitness',   Icon: Dumbbell,        accent: '#15803D' },
  beauty:   { label: 'Beauty & Grooming',  Icon: Sparkles,        accent: '#BE185D' },
  fashion:  { label: 'Fashion',            Icon: ShoppingBag,     accent: '#1D4ED8' },
  food:     { label: 'Food & Drink',       Icon: UtensilsCrossed, accent: '#B45309' },
  services: { label: 'Creative & Services', Icon: Wrench,         accent: '#0369A1' },
}

// ─── Wellbeing & Support ─────────────────────────────────────────────────────
const SUPPORT_LINES = [
  { name: 'Samaritans Ireland',  number: '116 123',        hours: '24/7',        link: 'tel:116123' },
  { name: 'Pieta House',         number: '1800 247 247',   hours: '24/7',        link: 'tel:1800247247' },
  { name: 'Niteline',            number: '1800 793 793',   hours: 'Term nights', link: 'tel:1800793793' },
  { name: 'SpunOut',             number: 'spunout.ie',     hours: 'Online',      link: 'https://spunout.ie' },
  { name: 'Jigsaw',              number: 'jigsaw.ie',      hours: 'Online',      link: 'https://jigsaw.ie' },
  { name: 'Turn2Me',             number: 'turn2me.ie',     hours: 'Online',      link: 'https://turn2me.ie' },
  { name: 'MyMind',              number: '01 820 5277',    hours: 'Mon–Fri',     link: 'tel:018205277' },
  { name: 'Student Counselling', number: 'Your college',   hours: 'On campus',   link: null },
]

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress',          type: 'Guide',    readTime: '4 min read', tag: 'Mental Health' },
  { title: 'Sleep & Academic Performance',  type: 'Article',  readTime: '6 min read', tag: 'Wellbeing' },
  { title: "Student Anxiety: What's Normal", type: 'Resource', readTime: '5 min read', tag: 'Support' },
  { title: 'Mindfulness for Students',      type: 'Guide',    readTime: '3 min read', tag: 'Wellbeing' },
]

// ─── Budget Tools ─────────────────────────────────────────────────────────────
const BUDGET_TOOLS = [
  { title: 'Budget Calculator', sub: 'Plan rent, food, transport and more', Icon: PiggyBank, screen: 'Budgeting', params: { tab: 'budget' } },
  { title: 'SUSI Grant Guide',  sub: 'Check eligibility and application steps', Icon: Tag, screen: 'Budgeting', params: { tab: 'susi' } },
  // No dedicated job-board feature exists yet — the Ad Board is the closest
  // real "browse listings" screen in the app until one is built. Navigated
  // via the parent tab so it switches tabs correctly, not just pushes a
  // screen within Home's own stack.
  { title: 'Part-Time Work Finder', sub: 'Flexible roles near your campus', Icon: ShoppingBag, screen: 'AdBoard', params: { screen: 'AdBoardMain' } },
]

// ─── Partner Logo / Initials Fallback ────────────────────────────────────────
// Renders the partner's logo when one is available, falling back to a coloured
// initials circle for every partner that doesn't have a logo yet.
//
// partner.logo can be:
//   null / undefined , render initials fallback (permanent for shell cards)
//   string (URL)     , remote image from Supabase Storage (partner-logos bucket)
//   number           , static require() result, if ever used for bundled assets
//
// New partners are added with logo: null and updated via the admin-only
// partner-logos Storage bucket. No logo assets should be committed to the repo.
function PartnerLogo({ partner, size = 44 }) {
  const bg       = partner.initBg
  const label    = partner.initials
  const fontSize = label.length > 2 ? 10 : 13

  if (partner.logo) {
    const source = typeof partner.logo === 'string'
      ? { uri: partner.logo }   // remote URL from Storage
      : partner.logo            // static require() (number), kept for future use
    return (
      <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
      </View>
    )
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.circleText, { fontSize }]}>{label}</Text>
    </View>
  )
}

// ─── Contact Chip ─────────────────────────────────────────────────────────────
function ContactChip({ type, value }) {
  const handlers = {
    instagram: () => Linking.openURL(`https://instagram.com/${value}`),
    tiktok:    () => Linking.openURL(`https://www.tiktok.com/@${value}`),
    phone:     () => Linking.openURL(`tel:${value.replace(/\s/g, '')}`),
    email:     () => Linking.openURL(`mailto:${value}`),
    website:   () => Linking.openURL(value),
  }
  const labels  = { instagram: `@${value}`, tiktok: `@${value}`, phone: value, email: value, website: 'Portfolio' }
  const icons   = {
    instagram: <AtSign size={12} color={colors.cream} />,
    tiktok:    <AtSign size={12} color={colors.cream} />,
    phone:     <Phone  size={12} color={colors.cream} />,
    email:     <Mail   size={12} color={colors.cream} />,
    website:   <Link2  size={12} color={colors.cream} />,
  }
  if (!handlers[type]) return null
  return (
    <TouchableOpacity style={styles.contactChip} onPress={handlers[type]} activeOpacity={0.8}>
      {icons[type]}
      <Text style={styles.contactChipText}>{labels[type]}</Text>
    </TouchableOpacity>
  )
}

// ─── Category Section Header ──────────────────────────────────────────────────
// Marks the start of a category group in the "All" view — an icon + accent
// colour matching that category's filter pill, so a long list of 20+ live
// partners reads as curated sections rather than one flat pile.
function CategorySectionHeader({ filterKey }) {
  const meta = CATEGORY_META[filterKey]
  if (!meta) return null
  return (
    <View style={styles.categoryHeader}>
      <View style={[styles.categoryHeaderIcon, { backgroundColor: `${meta.accent}1A` }]}>
        <meta.Icon size={14} color={meta.accent} strokeWidth={2} />
      </View>
      <Text style={styles.categoryHeaderText}>{meta.label}</Text>
    </View>
  )
}

// ─── Coming Soon grid card — compact, two-up, visually distinct from the live
// cards rather than the same row style just greyed out. ───────────────────────
function ComingSoonGridCard({ partner }) {
  return (
    <View style={styles.soonCard}>
      <View style={styles.soonTopRow}>
        <PartnerLogo partner={partner} size={32} />
        <View style={styles.soonLockBadge}>
          <Lock size={8} color={colors.muted} />
        </View>
      </View>
      <Text style={styles.soonBrand} numberOfLines={2}>{partner.brand}</Text>
      <Text style={styles.soonCategory} numberOfLines={1}>{partner.category}</Text>
    </View>
  )
}

// ─── Partner Card — live listings only now; Coming Soon has its own compact
// grid card above, so this can commit fully to looking like a real listing. ──
function PartnerCard({ partner, navigation, autoOpen }) {
  const [open, setOpen] = useState(!!autoOpen)
  const accent = CATEGORY_META[partner.filterKey]?.accent || colors.navy

  return (
    <View style={styles.partnerCard}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      {/* Column: card row + (optional) expanded detail stack vertically,
          sitting beside the accent bar rather than each being a sibling
          row-item of it. */}
      <View style={styles.cardColumn}>
        <TouchableOpacity
          style={styles.cardRow}
          activeOpacity={0.75}
          onPress={() => setOpen(v => !v)}
        >
          <PartnerLogo partner={partner} size={56} />

          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.brandName} numberOfLines={1}>{partner.brand}</Text>
              {open
                ? <ChevronUp   size={16} color={colors.navy} />
                : <ChevronDown size={16} color={colors.muted} />}
            </View>

            <Text style={styles.categoryLabel}>{partner.category}</Text>

            {partner.deal && (
              <View style={styles.dealPill}>
                <Text style={styles.dealPillText}>{partner.deal}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded detail */}
        {open && (
          <View style={styles.expandedSection}>
            {partner.credentials && (
              <Text style={styles.credentialsText}>{partner.credentials}</Text>
            )}

            <View style={styles.expandDivider} />

            {partner.description && (
              <>
                <Text style={styles.expandLabel}>ABOUT</Text>
                <Text style={styles.expandBody}>{partner.description}</Text>
              </>
            )}

            {partner.services && (
              <View style={styles.servicePills}>
                {partner.services.map(s => (
                  <View key={s} style={styles.servicePill}>
                    <Text style={styles.servicePillText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {partner.pricelist && (
              <>
                <Text style={[styles.expandLabel, { marginTop: 16 }]}>PRICING</Text>
                <View style={styles.priceTable}>
                  {partner.pricelist.map((row, i) => (
                    <View
                      key={i}
                      style={[
                        styles.priceRow,
                        i < partner.pricelist.length - 1 && styles.priceRowBorder,
                      ]}
                    >
                      <Text style={styles.priceRowLabel}>{row.label}</Text>
                      <Text style={styles.priceRowValue}>{row.price}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {partner.pricingNote && (
              <Text style={styles.pricingNote}>{partner.pricingNote}</Text>
            )}

            {partner.howToStart && (
              <>
                <Text style={[styles.expandLabel, { marginTop: 16 }]}>HOW TO START</Text>
                <Text style={styles.expandBody}>{partner.howToStart}</Text>
              </>
            )}

            {partner.hours && (
              <Text style={styles.hoursText}>{partner.hours}</Text>
            )}

            {partner.contact && (
              <View style={styles.contactRow}>
                {partner.contact.instagram && (
                  <ContactChip type="instagram" value={partner.contact.instagram} />
                )}
                {partner.contact.tiktok && (
                  <ContactChip type="tiktok" value={partner.contact.tiktok} />
                )}
                {partner.contact.phone && (
                  <ContactChip type="phone" value={partner.contact.phone} />
                )}
                {partner.contact.email && (
                  <ContactChip type="email" value={partner.contact.email} />
                )}
                {partner.contact.website && (
                  <ContactChip type="website" value={partner.contact.website} />
                )}
              </View>
            )}

            {partner.crossLink && (
              <TouchableOpacity
                style={styles.crossLinkCard}
                activeOpacity={0.75}
                onPress={() => {
                  const coach = COACHES.find(c => c.id === partner.crossLink.coachId)
                  if (coach) navigation.navigate('CoachProfile', { coach })
                }}
              >
                <Text style={styles.crossLinkText}>{partner.crossLink.label}</Text>
                <ChevronRight size={14} color="#6D28D9" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
  const [viewMode, setViewMode] = useState('list') // 'list' | 'map'

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

  function handleViewListing(id) {
    const target = PARTNERS.find(p => p.id === id)
    setMapHighlightId(id)
    setActiveFilter(target ? target.filterKey : 'all')
    setViewMode('list')
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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

          {/* List / Map toggle */}
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <ListIcon size={14} color={viewMode === 'list' ? colors.white : colors.navy} />
              <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
            >
              <MapIcon size={14} color={viewMode === 'map' ? colors.white : colors.navy} />
              <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>Map</Text>
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
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {FILTERS.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
                    onPress={() => setActiveFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillText, activeFilter === f.key && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Live partners, grouped by category */}
              {liveGroups.map(group => (
                <View key={group.key} style={{ marginBottom: spacing.lg }}>
                  {showSectionHeaders && <CategorySectionHeader filterKey={group.key} />}
                  <View style={styles.partnerList}>
                    {group.items.map(p => (
                      <PartnerCard
                        key={p.id}
                        partner={p}
                        navigation={navigation}
                        autoOpen={p.id === highlightId}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {liveVisible.length === 0 && soonVisible.length === 0 && (
                <Text style={styles.emptyText}>No partners in this category yet.</Text>
              )}

              {/* Coming Soon — compact grid, separate from the live listings */}
              {soonVisible.length > 0 && (
                <View style={{ marginTop: spacing.sm }}>
                  <View style={styles.soonHeaderRow}>
                    <Lock size={12} color={colors.muted} />
                    <Text style={styles.soonHeaderText}>Coming Soon · Locked Until Launch</Text>
                  </View>
                  <View style={styles.soonGrid}>
                    {soonVisible.map(p => <ComingSoonGridCard key={p.id} partner={p} />)}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Mental Health & Wellbeing ─────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Wellbeing" title="Mental Health & Support" />

          <View style={styles.supportBanner}>
            <Heart size={16} color={colors.cream} fill={colors.cream} />
            <Text style={styles.supportBannerText}>
              Need to talk? Free, confidential support is available 24/7.
            </Text>
          </View>

          <View style={styles.supportList}>
            {SUPPORT_LINES.map(line => (
              <TouchableOpacity
                key={line.name}
                activeOpacity={line.link ? 0.8 : 1}
                onPress={() => line.link && Linking.openURL(line.link)}
              >
                <Card style={styles.supportCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportName}>{line.name}</Text>
                    <Text style={styles.supportHours}>{line.hours}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.supportNumber}>{line.number}</Text>
                    {line.link && <Phone size={12} color={colors.muted} style={{ marginTop: 3 }} />}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

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
        <View style={styles.section}>
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
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.cream },
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

  // Filter pills
  filterScroll:  { marginHorizontal: -spacing.md, marginBottom: spacing.md },
  filterContent: { paddingHorizontal: spacing.md, gap: 8, flexDirection: 'row' },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterPillText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  filterPillTextActive: { color: colors.cream },

  // List / Map toggle
  viewToggleRow: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 4,
    borderRadius: radius.button, gap: 4, marginBottom: spacing.md, ...shadows.card,
  },
  viewToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: radius.button - 2,
  },
  viewToggleBtnActive: { backgroundColor: colors.navy },
  viewToggleText:       { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  viewToggleTextActive: { color: colors.white },
  mapSection: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: spacing.md, marginTop: 4,
  },

  // Category section headers (shown in the "All" view)
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  categoryHeaderIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryHeaderText: {
    fontFamily: fonts.sansBold, fontSize: 12, color: colors.navy,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Partner list
  partnerList: { gap: 10 },
  emptyText:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 24 },

  // Partner card
  partnerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.card,
  },
  accentBar: { width: 4 },
  cardColumn: { flex: 1 },
  cardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Logo variant: white bg with subtle border, image fills the frame
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.1)',
    overflow: 'hidden',
  },
  circleText: { fontFamily: fonts.sansBold, color: '#FFFFFF', letterSpacing: 0.3 },

  cardBody:   { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  brandName: { fontFamily: fonts.serif, fontSize: 17, color: colors.navy, flex: 1 },

  categoryLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  dealPill: {
    alignSelf: 'flex-start', marginTop: 7,
    backgroundColor: 'rgba(20,90,62,0.1)', borderRadius: radius.badge,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  dealPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: '#145A3E' },

  // Coming Soon grid — compact, two-up
  soonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  soonHeaderText: {
    fontFamily: fonts.sansBold, fontSize: 12, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  soonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  soonCard: {
    width: '47%',
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    padding: 12,
  },
  soonTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  soonLockBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  soonBrand:    { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 8, lineHeight: 17 },
  soonCategory: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.light, marginTop: 3 },

  // Expanded section
  expandedSection: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandDivider: { height: 1, backgroundColor: colors.border, marginBottom: 14, marginTop: 2 },
  expandLabel:   { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 },
  expandBody:    { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },

  credentialsText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    lineHeight: 18, marginTop: 12, marginBottom: 4,
  },

  servicePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  servicePill: {
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  servicePillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  // Pricing table
  priceTable: {
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  priceRowLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, flex: 1, marginRight: 8 },
  priceRowValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  pricingNote: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.muted,
    fontStyle: 'italic', marginTop: 8, lineHeight: 16,
  },

  hoursText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    marginTop: 8,
  },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  contactChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.navy, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  contactChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.cream },

  // Cross-link (partner ↔ coach profile)
  crossLinkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: '#F5F3FF', borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#DDD6FE', marginTop: 16,
  },
  crossLinkText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#6D28D9', lineHeight: 19, flex: 1 },

  // Wellbeing
  supportBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  supportBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.white, flex: 1, lineHeight: 19 },
  supportList: { gap: 10, marginTop: spacing.md },
  supportCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  supportName:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  supportHours:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  supportNumber: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

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
