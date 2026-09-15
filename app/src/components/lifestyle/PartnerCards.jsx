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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronRight, ChevronDown, Phone, Mail, AtSign, Link2, HelpCircle, X,
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

// ─── Partner Hero / Gallery Image ─────────────────────────────────────────────
// Aspect-ratio-aware image frame used for a partner's hero photo (grid card +
// detail sheet) and gallery thumbnails. Photos supplied by partners come in
// whatever ratio they were shot in — portrait product flat-lays, square
// lifestyle shots, landscape group photos — and must never be cropped or
// stretched to fit. Rather than force `resizeMode: 'cover'` (which crops),
// this renders a fixed-ratio box in the card's own cream surface colour and
// letterboxes the photo inside it with `resizeMode: 'contain'`, so the full
// frame — logo, face, product — is always fully visible.
//
// source follows the same shape as PartnerLogo's `partner.logo`: a string
// (remote Storage URL) or a number (static require() result).
export function PartnerHeroImage({ source, aspectRatio = 4 / 3, style, imageStyle }) {
  if (!source) return null
  const resolved = typeof source === 'string' ? { uri: source } : source
  return (
    <View style={[styles.heroFrame, { aspectRatio }, style]}>
      <Image source={resolved} style={[styles.heroFrameImage, imageStyle]} resizeMode="contain" />
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
      {partner.hero && (
        <PartnerHeroImage source={partner.hero} aspectRatio={1} style={styles.gridCardHero} />
      )}
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

// ─── Partner List Row — the compact "list" tier of Explore's collapsible
// category → list → card pattern: sits inside an expanded CategoryAccordion
// below, one row per partner, tapping it opens PartnerExpandCard (the same
// click-to-expand card used by The Collection). ─────────────────────────────
export function PartnerListRow({ partner, onPress, highlighted }) {
  return (
    <TouchableOpacity
      style={[styles.listRow, highlighted && styles.listRowHighlighted]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <PartnerLogo partner={partner} size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.listRowName} numberOfLines={1}>{partner.brand}</Text>
        <Text style={styles.listRowCategory} numberOfLines={1}>{partner.category}</Text>
      </View>
      {partner.deal ? (
        <View style={styles.listRowDealPill}>
          <Text style={styles.listRowDealText} numberOfLines={1}>{partner.deal}</Text>
        </View>
      ) : null}
      <ChevronRight size={16} color={colors.light} />
    </TouchableOpacity>
  )
}

// ─── Category Accordion — one collapsible section of Explore: tapping the
// header expands/collapses the category, revealing its PartnerListRows below.
// Categories with no live partners render nothing, same defensive pattern
// FEATURED_DEALS uses elsewhere in Lifestyle. ────────────────────────────────
export function CategoryAccordion({ filterKey, items, expanded, onToggle, onPressPartner, highlightId }) {
  const meta = CATEGORY_META[filterKey]
  if (!meta || items.length === 0) return null
  return (
    <View style={styles.accordionSection}>
      <TouchableOpacity
        style={styles.accordionHeader}
        activeOpacity={0.75}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.categoryHeaderIcon, { backgroundColor: `${meta.accent}1A` }]}>
          <meta.Icon size={14} color={meta.accent} strokeWidth={2} />
        </View>
        <Text style={styles.accordionHeaderText}>{meta.label}</Text>
        <Text style={styles.accordionCount}>{items.length}</Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={colors.muted} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionList}>
          {items.map(p => (
            <PartnerListRow
              key={p.id}
              partner={p}
              highlighted={p.id === highlightId}
              onPress={() => onPressPartner(p.id)}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// ─── Partner Expand Card — the click-to-expand card interaction shared by
// The Collection and Explore's list rows: tapping a partner opens this
// (same modal/bottom-sheet scaffold as PartnerDetailSheet below, just with
// lighter content) showing the partner's uncropped photo, brand name, and
// social handle — nothing else, so it reads as a quick peek rather than the
// full listing. `onViewFull`, when passed, adds a CTA into the full
// PartnerDetailSheet for pricing/services/contact — the same one destination
// every partner listing in the app already ends at. ─────────────────────────
export function PartnerExpandCard({ partner, visible, onClose, onViewFull }) {
  const insets = useSafeAreaInsets()
  if (!partner) return null

  const social = partner.contact?.instagram
    ? { type: 'instagram', handle: partner.contact.instagram }
    : partner.contact?.tiktok
      ? { type: 'tiktok', handle: partner.contact.tiktok }
      : null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.expandSheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={e => e.stopPropagation?.()}
        >
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

          {partner.hero ? (
            <PartnerHeroImage source={partner.hero} aspectRatio={4 / 3} style={styles.expandHero} />
          ) : (
            <View style={[styles.expandHero, styles.expandNoPhoto]}>
              <PartnerLogo partner={partner} size={64} />
            </View>
          )}

          <Text style={styles.expandBrandName}>{partner.brand}</Text>

          {social && (
            <TouchableOpacity
              style={styles.expandSocialRow}
              activeOpacity={0.75}
              onPress={() => Linking.openURL(
                social.type === 'instagram'
                  ? `https://instagram.com/${social.handle}`
                  : `https://www.tiktok.com/@${social.handle}`,
              )}
            >
              <AtSign size={13} color={colors.gold} />
              <Text style={styles.expandSocialText}>@{social.handle}</Text>
            </TouchableOpacity>
          )}

          {onViewFull && (
            <TouchableOpacity
              style={styles.expandViewFullBtn}
              activeOpacity={0.8}
              onPress={() => { onClose(); onViewFull(partner.id) }}
            >
              <Text style={styles.expandViewFullText}>View full listing</Text>
              <ChevronRight size={14} color={colors.navy} />
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
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
  // Bottom safe-area inset (home indicator on iOS, gesture bar on Android) —
  // this sheet is anchored flush to the bottom of the screen (backdrop is
  // justifyContent: 'flex-end'), and previously had no bottom padding of
  // its own beyond a fixed 28px on the inner ScrollView's content. On a
  // device with a tall inset that isn't enough clearance: the sheet's own
  // last ~20-30px (and on a short listing, real content sitting there —
  // contact chips, the cross-link card) sits under the home
  // indicator/gesture bar, reading as "cut off" or "too low" — exactly the
  // reported symptom. Feeding insets.bottom into the sheet's own bottom
  // padding (not just the inner ScrollView's) fixes it regardless of how
  // much content there is.
  const insets = useSafeAreaInsets()
  if (!partner) return null
  const accent = CATEGORY_META[partner.filterKey]?.accent || colors.navy

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.detailSheet, { paddingBottom: insets.bottom + 12 }]}
          onPress={e => e.stopPropagation?.()}
        >
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

          {partner.hero && (
            <PartnerHeroImage source={partner.hero} aspectRatio={4 / 3} style={styles.detailHero} />
          )}

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

              {partner.gallery && partner.gallery.length > 0 && (
                <>
                  <Text style={[styles.expandLabel, { marginTop: 16 }]}>GALLERY</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryRow}
                  >
                    {partner.gallery.map((src, i) => (
                      <PartnerHeroImage
                        key={i}
                        source={src}
                        aspectRatio={3 / 4}
                        style={styles.galleryThumb}
                      />
                    ))}
                  </ScrollView>
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
                        <Text style={[styles.priceRowLabel, row.soldOut && styles.priceRowLabelSoldOut]}>
                          {row.label}
                        </Text>
                        {row.soldOut ? (
                          <View style={styles.soldOutPill}>
                            <Text style={styles.soldOutPillText}>Sold Out</Text>
                          </View>
                        ) : (
                          <Text style={styles.priceRowValue}>{row.price}</Text>
                        )}
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
  // Hero thumbnail bleeds edge-to-edge under the accent bar, above the
  // logo/name block — same cream letterbox treatment as the detail sheet's
  // larger hero, just square to keep the 2-up grid tidy.
  gridCardHero: { marginHorizontal: -12, marginBottom: 10, borderRadius: 0 },
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

  // Aspect-ratio-aware hero/gallery frame — see PartnerHeroImage above.
  // Cream letterbox background (matches the card/sheet surface) so a photo
  // that doesn't natively match the frame's ratio pillar/letterboxes onto a
  // colour that reads as intentional, not empty space.
  heroFrame: {
    width: '100%',
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFrameImage: { width: '100%', height: '100%' },

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

  // Partner List Row — Explore's collapsible category → list → card pattern
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  listRowHighlighted: { borderColor: colors.gold, borderWidth: 1.5 },
  listRowName:     { fontFamily: fonts.serif, fontSize: 14.5, color: colors.navy },
  listRowCategory: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  listRowDealPill: {
    backgroundColor: 'rgba(20,90,62,0.1)', borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: 8, maxWidth: 100,
  },
  listRowDealText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: '#145A3E' },

  // Category Accordion — collapsible section wrapping a category's list rows
  accordionSection: { marginBottom: 10 },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  accordionHeaderText: {
    flex: 1, fontFamily: fonts.sansBold, fontSize: 13, color: colors.navy,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  accordionCount: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted },
  accordionList: { paddingLeft: 2 },

  // Partner Expand Card — click-to-expand quick peek (photo + brand + social),
  // same modal scaffold as the Partner Detail Sheet below, lighter content.
  expandSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  expandHero: { marginTop: 6, marginBottom: 16 },
  expandNoPhoto: {
    aspectRatio: 4 / 3, backgroundColor: colors.cream, borderRadius: radius.card,
    alignItems: 'center', justifyContent: 'center',
  },
  expandBrandName: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.navy, textAlign: 'center',
  },
  expandSocialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    marginTop: 10,
  },
  expandSocialText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.gold },
  expandViewFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 20, paddingVertical: 12, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cream,
  },
  expandViewFullText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

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
  // Detail sheet hero — inset (not edge-bled) so its own rounded corners sit
  // cleanly inside the sheet's padding, above the logo/name row.
  detailHero: { marginBottom: 14 },
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

  // Gallery — horizontal scroller of letterboxed thumbnails, portrait ratio
  // (most partner photos supplied are portrait product/lifestyle shots).
  galleryRow: { flexDirection: 'row', gap: 8 },
  galleryThumb: { width: 110 },

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
  priceRowLabelSoldOut: { color: colors.light, textDecorationLine: 'line-through' },
  soldOutPill: {
    backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soldOutPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.destructive },

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
