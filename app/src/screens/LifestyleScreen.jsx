import { useState, useRef, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Image, Animated, Modal, Pressable,
} from 'react-native'
import {
  Heart, PiggyBank, Tag, ShoppingBag, ChevronRight,
  ChevronDown, ChevronUp, Phone, Mail, AtSign, Link2, Lock, HelpCircle, ExternalLink,
  Dumbbell, Sparkles, UtensilsCrossed, Wrench, Map as MapIcon, LayoutGrid, X,
  Siren, GraduationCap, LifeBuoy, Utensils, CloudRain, ShieldAlert, UserRound, Sun, MessagesSquare,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import PartnerMap from '../components/ui/PartnerMap'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { COACHES } from './ElevationScreen'
import { PARTNERS, MYSTERY_MAP_COUNTIES, maskComingSoonName } from '../data/lifestylePartners'
import { MENTAL_HEALTH_CATEGORIES } from '../data/mentalHealthSupport'

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

// ─── Coming Soon grid card — deliberately anonymous: black-and-white only
// (the one exception being the gold question-mark badge, matching the map's
// gold-for-live / grey-for-incoming language), name masked into a run of "?"
// the same word/letter shape as the real name, only Location and Category
// visible. Tapping opens the same "Coming Soon" sheet as a map pin — nothing
// further is revealed either way. ───────────────────────────────────────────
function ComingSoonGridCard({ partner, onPress }) {
  return (
    <TouchableOpacity style={styles.soonCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.soonIconWrap}>
        <HelpCircle size={18} color="#FFFFFF" strokeWidth={2.4} />
      </View>
      <Text style={styles.soonBrand} numberOfLines={2}>{maskComingSoonName(partner.brand)}</Text>
      {!!(partner.county || partner.counties) && (
        <Text style={styles.soonLocation} numberOfLines={1}>
          {partner.county || partner.counties.join(' · ')}
        </Text>
      )}
      <Text style={styles.soonCategory} numberOfLines={1}>{partner.category}</Text>
    </TouchableOpacity>
  )
}

// ─── Partner Grid Card — compact square-ish tile for the live-partner grid.
// Coming Soon has its own compact grid card above; this is the "live" sibling,
// deliberately kept to logo + name + category + deal so a 2-up grid stays
// tidy — tapping opens the full listing in PartnerDetailSheet below rather
// than expanding in place, which would break the grid's rhythm. ─────────────
function PartnerGridCard({ partner, onPress, highlighted }) {
  const accent = CATEGORY_META[partner.filterKey]?.accent || colors.navy

  return (
    <TouchableOpacity
      style={[styles.gridCard, highlighted && styles.gridCardHighlighted]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.gridCardAccent, { backgroundColor: accent }]} />
      <View style={styles.gridCardTop}>
        <PartnerLogo partner={partner} size={44} />
        <VerifiedBadge verified={partner.verified} compact />
      </View>
      <Text style={styles.gridCardName} numberOfLines={2}>{partner.brand}</Text>
      <Text style={styles.gridCardCategory} numberOfLines={2}>{partner.category}</Text>
      {partner.deal ? (
        <View style={styles.gridDealPill}>
          <Text style={styles.gridDealPillText} numberOfLines={2}>{partner.deal}</Text>
        </View>
      ) : (
        <View style={styles.gridCardSpacer} />
      )}
    </TouchableOpacity>
  )
}

// ─── Partner Detail Sheet — the full listing (credentials, description,
// services, pricing, how-to-start, hours, contact, cross-link), opened from
// tapping a grid card. Everything PartnerCard used to reveal inline now lives
// here, unchanged in content — only the presentation moved from an in-place
// accordion to a bottom sheet, so the grid above it can stay a real grid. ───
function PartnerDetailSheet({ partner, visible, onClose, navigation }) {
  if (!partner) return null
  const accent = CATEGORY_META[partner.filterKey]?.accent || colors.navy

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailBackdrop} onPress={onClose}>
        <Pressable style={styles.detailSheet} onPress={e => e.stopPropagation?.()}>
          <View style={styles.detailHandle} />
          <TouchableOpacity
            style={styles.detailCloseBtn}
            onPress={onClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.detailHeaderRow}>
            <PartnerLogo partner={partner} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailBrandName}>{partner.brand}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                <Text style={styles.categoryLabel}>{partner.category}</Text>
                <VerifiedBadge verified={partner.verified} compact />
              </View>
            </View>
          </View>
          <View style={[styles.detailAccentLine, { backgroundColor: accent }]} />

          {partner.deal && (
            <View style={styles.dealPill}>
              <Text style={styles.dealPillText}>{partner.deal}</Text>
            </View>
          )}

          <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
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
                  if (coach) {
                    onClose()
                    navigation.navigate('CoachProfile', { coach })
                  }
                }}
              >
                <Text style={styles.crossLinkText}>{partner.crossLink.label}</Text>
                <ChevronRight size={14} color="#6D28D9" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

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
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
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

              {/* Live partners, grouped by category, as a real 2-up square
                  grid — tapping a tile opens the full listing in a sheet
                  rather than expanding in place, so the grid stays a grid. */}
              {liveGroups.map(group => (
                <View key={group.key} style={{ marginBottom: spacing.lg }}>
                  {showSectionHeaders && <CategorySectionHeader filterKey={group.key} />}
                  <View style={styles.partnerGrid}>
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
                    {soonVisible.map(p => (
                      <ComingSoonGridCard key={p.id} partner={p} onPress={() => setComingSoonOpen(true)} />
                    ))}
                  </View>
                </View>
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
      <ComingSoonSheet visible={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
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

  emptyText:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 24 },

  // Partner grid — 2-up square-ish tiles. gap handles the column/row spacing;
  // each tile is a touch target that opens the full listing in a sheet.
  partnerGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    paddingHorizontal: 12, paddingBottom: 12,
    ...shadows.card,
  },
  gridCardHighlighted: {
    borderWidth: 1.5, borderColor: colors.gold,
  },
  gridCardAccent: { height: 4, marginHorizontal: -12, marginBottom: 10 },
  gridCardTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6,
  },
  gridCardName: {
    fontFamily: fonts.serif, fontSize: 15, color: colors.navy,
    marginTop: 10, lineHeight: 19,
  },
  gridCardCategory: {
    fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted,
    marginTop: 3, lineHeight: 15,
  },
  gridDealPill: {
    alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: 'rgba(20,90,62,0.1)', borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  gridDealPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: '#145A3E', lineHeight: 14 },
  // Reserves the same vertical rhythm a deal pill would take up, so a
  // no-deal card (Z Vision Apparel, by design) doesn't read as visually
  // "cut short" against its neighbours in the grid.
  gridCardSpacer: { height: 4, marginTop: 8 },

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
  // Black-and-white only — the gold icon badge is the one deliberate
  // exception (matches the map's gold = live / grey = incoming language).
  soonCard: {
    width: '47%',
    backgroundColor: '#FFFFFF', borderRadius: radius.card,
    borderWidth: 1, borderColor: '#000000',
    padding: 12, ...shadows.card,
  },
  soonIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  soonBrand:    { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#000000', marginTop: 10, lineHeight: 17, letterSpacing: 1 },
  soonLocation: { fontFamily: fonts.sans, fontSize: 10.5, color: '#000000', marginTop: 4 },
  soonCategory: { fontFamily: fonts.sans, fontSize: 10.5, color: '#4B5563', marginTop: 2 },

  // Partner Detail Sheet — full listing, opened from a grid card tap.
  detailBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: '85%',
  },
  detailHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(30,58,95,0.15)', alignSelf: 'center', marginBottom: 14,
  },
  detailCloseBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 34 },
  detailBrandName: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy },
  detailAccentLine: { height: 3, borderRadius: 2, marginTop: 14 },
  // Explicit flex:1 (not just contentContainerStyle) so this ScrollView reliably
  // clips to the sheet's maxHeight instead of growing past it — same fix as
  // the screen's own root ScrollView above.
  detailScroll: { flex: 1, marginTop: 10 },
  detailScrollContent: { paddingBottom: 28 },

  // Expanded detail content (inside the Partner Detail Sheet)
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
