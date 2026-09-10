/**
 * Shared partner-listing building blocks for the Lifestyle Blueprint —
 * used by both LifestyleScreen (the hub, showing a capped preview) and
 * LifestylePartnersScreen (the standalone "Explore more" browse screen),
 * so the grid, filters, and the detail sheet look and behave identically
 * wherever a partner card is tapped. Extracted out of LifestyleScreen so
 * the two screens don't duplicate this markup — same pattern the Ad Board
 * used for PostAdModal / data/adBoardAds.js when Blog and Marketplace were
 * split into their own screens.
 */
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image, Modal, Pressable, ScrollView } from 'react-native'
import {
  ChevronRight, Phone, Mail, AtSign, Link2, HelpCircle, X,
  Dumbbell, Sparkles, ShoppingBag, UtensilsCrossed, Wrench,
} from 'lucide-react-native'
import VerifiedBadge from '../ui/VerifiedBadge'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { COACHES } from '../../screens/ElevationScreen'
import { maskComingSoonName } from '../../data/lifestylePartners'

// ─── Filter Pills ────────────────────────────────────────────────────────────
// Labels widened to actually cover everyone grouped under them: "Beauty"
// on its own reads as nail/lash/makeup only, but the group also holds every
// barber; "Services" was too vague for a group that's mostly photography,
// marketing, and design work with automotive/housing mixed in.
export const FILTERS = [
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
export const CATEGORY_META = {
  fitness:  { label: 'Health & Fitness',   Icon: Dumbbell,        accent: '#15803D' },
  beauty:   { label: 'Beauty & Grooming',  Icon: Sparkles,        accent: '#BE185D' },
  fashion:  { label: 'Fashion',            Icon: ShoppingBag,     accent: '#1D4ED8' },
  food:     { label: 'Food & Drink',       Icon: UtensilsCrossed, accent: '#B45309' },
  services: { label: 'Creative & Services', Icon: Wrench,         accent: '#0369A1' },
}

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
export function PartnerLogo({ partner, size = 44 }) {
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
// colour matching that category's filter pill, so a long list of live
// partners reads as curated sections rather than one flat pile.
export function CategorySectionHeader({ filterKey }) {
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
export function ComingSoonGridCard({ partner, onPress }) {
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
export function PartnerGridCard({ partner, onPress, highlighted }) {
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
// tapping a grid card, from either the Lifestyle hub's preview grid or the
// standalone LifestylePartnersScreen's full grid. Everything PartnerCard
// used to reveal inline now lives here, unchanged in content — only the
// presentation moved from an in-place accordion to a bottom sheet, so the
// grid above it can stay a real grid. ───────────────────────────────────────
export function PartnerDetailSheet({ partner, visible, onClose, navigation }) {
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

          <View style={{ flex: 1, marginTop: 10 }}>
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Styles shared by every piece above, plus the grid/filter layout markup
// both LifestyleScreen and LifestylePartnersScreen render directly. ─────────
export const styles = StyleSheet.create({
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

  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 24 },

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
  // no-deal card doesn't read as visually "cut short" against its neighbours.
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
  // every screen-root ScrollView elsewhere in the app.
  detailScroll: { flex: 1 },
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
})
