import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, MapPin, AtSign, Mail, Phone, Link2, User,
} from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ── Link helper ───────────────────────────────────────────────────────────────

function openLink(type, value) {
  if (!value) return
  const urls = {
    instagram: `https://www.instagram.com/${value}`,
    tiktok:    `https://www.tiktok.com/@${value}`,
    linktree:  value,
    email:     `mailto:${value}`,
    phone:     `tel:${value}`,
  }
  Linking.openURL(urls[type])
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CoachProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { coach } = route.params

  function handleEnquire() {
    if (!coach.contact) return
    if (coach.contact.email)     return openLink('email',     coach.contact.email)
    if (coach.contact.phone)     return openLink('phone',     coach.contact.phone)
    if (coach.contact.instagram) return openLink('instagram', coach.contact.instagram)
    if (coach.contact.linktree)  return openLink('linktree',  coach.contact.linktree)
  }

  return (
    <View style={styles.screen}>

      {/* ── Navy header with frosted glass avatar ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={styles.backBtnText}>Coaches</Text>
        </TouchableOpacity>

        {/* Frosted glass avatar — double-ring treatment */}
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <User
              size={44}
              color={coach.shell ? 'rgba(245,240,232,0.3)' : 'rgba(245,240,232,0.6)'}
              strokeWidth={1.2}
            />
          </View>
        </View>

        <View style={styles.headerChip}>
          <Text style={styles.headerChipText}>
            {coach.shell ? 'Coming Soon' : (coach.from || 'Enquire for pricing')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Identity ── */}
        <View style={styles.identityBlock}>
          <Text style={styles.coachName}>{coach.name}</Text>
          {coach.title && <Text style={styles.coachTitle}>{coach.title}</Text>}
          <Text style={styles.coachCategory}>{coach.category}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.muted} strokeWidth={1.8} />
            <Text style={styles.locationText}>{coach.location}</Text>
          </View>
          {coach.rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{coach.rating}</Text>
              <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
            </View>
          )}
        </View>

        {/* ── Tagline ── */}
        {coach.tagline && (
          <View style={styles.taglineBlock}>
            <Text style={styles.taglineText}>{coach.tagline}</Text>
          </View>
        )}

        {/* ── Shell placeholder ── */}
        {coach.shell && coach.shellMessage && (
          <View style={styles.section}>
            <View style={styles.shellBlock}>
              <Text style={styles.shellText}>{coach.shellMessage}</Text>
            </View>
          </View>
        )}

        {/* ── Bio ── */}
        {coach.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bioText}>{coach.bio}</Text>
          </View>
        )}

        {/* ── Quote ── */}
        {coach.quote && (
          <View style={styles.section}>
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteText}>"{coach.quote}"</Text>
            </View>
          </View>
        )}

        {/* ── Services ── */}
        {coach.services && coach.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Services</Text>
            <View style={styles.servicePills}>
              {coach.services.map(s => (
                <View key={s} style={styles.servicePill}>
                  <Text style={styles.servicePillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Pricelist ── */}
        {coach.pricelist && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pricing</Text>
            <View style={styles.pricelistCard}>
              {coach.pricelist.map((p, i) => (
                <View
                  key={p.label}
                  style={[
                    styles.pricelistRow,
                    i < coach.pricelist.length - 1 && styles.pricelistDivider,
                  ]}
                >
                  <Text style={styles.pricelistLabel}>{p.label}</Text>
                  <Text style={styles.pricelistPrice}>{p.price}</Text>
                </View>
              ))}
            </View>
            {coach.pricingNote && (
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>{coach.pricingNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Pricing note (no pricelist) ── */}
        {!coach.pricelist && coach.pricingNote && (
          <View style={styles.section}>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{coach.pricingNote}</Text>
            </View>
          </View>
        )}

        {/* ── Package inclusions ── */}
        {coach.package && coach.package.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What's included</Text>
            <View style={styles.packageCard}>
              {coach.package.map((item, i) => (
                <View key={i} style={styles.packageRow}>
                  <View style={styles.packageDot} />
                  <Text style={styles.packageText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Booking note ── */}
        {coach.bookingNote && (
          <View style={styles.section}>
            <View style={styles.bookingCard}>
              <Text style={styles.bookingText}>{coach.bookingNote}</Text>
            </View>
          </View>
        )}

        {/* ── Contact ── */}
        {coach.contact && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Get in touch</Text>
            <View style={styles.contactList}>
              {coach.contact.instagram && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('instagram', coach.contact.instagram)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><AtSign size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Instagram</Text>
                    <Text style={styles.contactHandle}>@{coach.contact.instagram}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.tiktok && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('tiktok', coach.contact.tiktok)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><AtSign size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>TikTok</Text>
                    <Text style={styles.contactHandle}>@{coach.contact.tiktok}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('email', coach.contact.email)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Mail size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Email</Text>
                    <Text style={styles.contactHandle} numberOfLines={1}>{coach.contact.email}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('phone', coach.contact.phone)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Phone size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Phone / WhatsApp</Text>
                    <Text style={styles.contactHandle}>{coach.contact.phone}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.linktree && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('linktree', coach.contact.linktree)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Link2 size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Linktree</Text>
                    <Text style={styles.contactHandle}>View all links</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── CTA ── */}
        {!coach.shell && (
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8} onPress={handleEnquire}>
            <Text style={styles.ctaBtnText}>Book / Enquire</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: {},

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 36,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },

  // Double-ring frosted glass avatar
  avatarOuter: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderWidth: 2, borderColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.cream,
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  avatarInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(245,240,232,0.07)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.13)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerChip: {
    marginTop: 16,
    backgroundColor: 'rgba(245,240,232,0.10)',
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)',
    paddingHorizontal: 16, paddingVertical: 7,
  },
  headerChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Identity
  identityBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl, paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  coachName:     { fontFamily: fonts.serif, fontSize: 30, color: colors.navy, textAlign: 'center', lineHeight: 36, marginBottom: 6 },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, opacity: 0.6, marginBottom: 8 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  ratingStar:    { fontSize: 15, color: '#F59E0B' },
  ratingValue:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  ratingCount:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  // Tagline
  taglineBlock: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    padding: 18, alignItems: 'center',
  },
  taglineText: {
    fontFamily: fonts.serif, fontSize: 17, color: colors.navy,
    textAlign: 'center', lineHeight: 26, fontStyle: 'italic',
  },

  // Shell
  shellBlock: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: 24, alignItems: 'center', ...shadows.card,
  },
  shellText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },

  // Generic section
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12,
  },
  bioText: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, lineHeight: 23 },

  // Quote
  quoteBlock: {
    backgroundColor: colors.white,
    borderLeftWidth: 3, borderLeftColor: colors.navy,
    borderRadius: 6, padding: 18, ...shadows.card,
  },
  quoteText: { fontFamily: fonts.serif, fontSize: 15, color: colors.navy, lineHeight: 24, fontStyle: 'italic' },

  // Services
  servicePills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicePill:     { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.10)', ...shadows.card },
  servicePillText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },

  // Pricing
  pricelistCard:    { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  pricelistRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  pricelistDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  pricelistLabel:   { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, flex: 1, marginRight: 12 },
  pricelistPrice:   { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },

  // Notes
  noteCard:    { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#FDE68A', marginTop: 12 },
  noteText:    { fontFamily: fonts.sans, fontSize: 13, color: '#92400E', lineHeight: 20 },
  bookingCard: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  bookingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },

  // Package
  packageCard: { backgroundColor: '#F0FDF4', borderRadius: radius.card, padding: 18, gap: 10 },
  packageRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  packageDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D', marginTop: 7, flexShrink: 0 },
  packageText: { fontFamily: fonts.sans, fontSize: 14, color: '#166534', lineHeight: 21, flex: 1 },

  // Contact
  contactList: { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  contactIcon:     { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactPlatform: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 2 },
  contactHandle:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  // CTA
  ctaBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.md },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
