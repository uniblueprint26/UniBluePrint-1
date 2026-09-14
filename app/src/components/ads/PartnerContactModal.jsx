/**
 * PartnerContactModal — the Ad Board's branded contact card.
 *
 * Replaces the bare system Alert.alert() popup that used to show a partner's
 * contact options when a curated Ad Board listing (see data/adBoardAds.js)
 * had no direct booking link. That system alert rendered with the device's
 * generic styling — no UBP branding, no icons, no layout — and looked broken
 * next to the rest of the app. This is the same information (brand, what
 * they offer, how to reach them), in a centered, dismissible, on-brand card.
 *
 * Used for every CURATED_ADS partner uniformly, including ones that
 * genuinely have no contact info on file yet (contact: null — real data,
 * not a bug): those get a clear "coming soon" state plus a fallback to
 * message the UniBlueprint team, rather than an empty or missing card.
 */
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { X, MessageCircle, AtSign, Globe, Mail, Clock, Megaphone, ChevronRight } from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { CATEGORY } from '../../data/adBoardAds'

const NAVY = colors.navy

// One row per contact channel this partner has on file. Order mirrors
// getAdPressHandler's own priority (WhatsApp, Instagram, website, email) so
// the card and the old alert agree on what leads.
function buildContactMethods(contact) {
  if (!contact) return []
  const methods = []
  if (contact.phone) {
    methods.push({
      key: 'phone',
      Icon: MessageCircle,
      label: 'WhatsApp',
      value: contact.phone,
      onPress: () => Linking.openURL(`https://wa.me/${contact.phone.replace(/[^\d]/g, '')}`),
    })
  }
  if (contact.instagram) {
    methods.push({
      key: 'instagram',
      Icon: AtSign,
      label: 'Instagram',
      value: `@${contact.instagram}`,
      onPress: () => Linking.openURL(`https://instagram.com/${contact.instagram}`),
    })
  }
  if (contact.website) {
    methods.push({
      key: 'website',
      Icon: Globe,
      label: 'Website',
      value: contact.website.replace(/^https?:\/\//, ''),
      onPress: () => Linking.openURL(contact.website),
    })
  }
  if (contact.email) {
    methods.push({
      key: 'email',
      Icon: Mail,
      label: 'Email',
      value: contact.email,
      onPress: () => Linking.openURL(`mailto:${contact.email}`),
    })
  }
  return methods
}

export default function PartnerContactModal({ ad, visible, onClose }) {
  if (!ad) return null

  const name = ad.brand || ad.title
  const cat = ad.category ? CATEGORY[ad.category] : null
  const methods = buildContactMethods(ad.contact)
  const hasContact = methods.length > 0

  const messageTeam = () => {
    Linking.openURL(
      'mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Interested in: ' + name),
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation?.()}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={[styles.logo, { backgroundColor: cat?.bg || colors.cream }]}>
              {cat ? <cat.Icon size={24} color={cat.color} strokeWidth={1.8} /> : <Megaphone size={24} color={NAVY} strokeWidth={1.8} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand} numberOfLines={2}>{name}</Text>
              {!!ad.title && ad.title !== name && (
                <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>
              )}
            </View>
          </View>

          <View style={styles.rule} />

          {!!ad.description && (
            <Text style={styles.description}>{ad.description}</Text>
          )}

          {hasContact ? (
            <View style={styles.contactSection}>
              <Text style={styles.sectionLabel}>GET IN TOUCH</Text>
              <View style={styles.methodList}>
                {methods.map(m => (
                  <TouchableOpacity
                    key={m.key}
                    style={styles.methodRow}
                    activeOpacity={0.75}
                    onPress={m.onPress}
                  >
                    <View style={styles.methodIconWrap}>
                      <m.Icon size={15} color={NAVY} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodLabel}>{m.label}</Text>
                      <Text style={styles.methodValue} numberOfLines={1}>{m.value}</Text>
                    </View>
                    <ChevronRight size={14} color={colors.light} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Clock size={18} color={colors.light} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>Contact details coming soon</Text>
              <Text style={styles.emptyBody}>
                {name} hasn't added a direct contact yet. Message the UniBlueprint team and we'll connect you.
              </Text>
              <TouchableOpacity style={styles.teamBtn} activeOpacity={0.85} onPress={messageTeam}>
                <Mail size={14} color={colors.cream} strokeWidth={2} />
                <Text style={styles.teamBtnText}>Message the UniBlueprint team</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,58,95,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    ...shadows.elevated,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 30 },
  logo: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand: { fontFamily: fonts.serif, fontSize: 20, color: NAVY, lineHeight: 24 },
  title: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },

  rule: { width: 34, height: 2, backgroundColor: colors.gold, borderRadius: 1, marginTop: 16, marginBottom: 14 },

  description: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 19 },

  contactSection: { marginTop: 18 },
  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8 },
  methodList: { marginTop: 10, gap: 8 },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cream, borderRadius: radius.button,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  methodIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  methodLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  methodValue: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: NAVY, marginTop: 1 },

  emptyState: { marginTop: 18, alignItems: 'center', paddingVertical: 6 },
  emptyIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: NAVY, marginTop: 10 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 17, paddingHorizontal: 6 },
  teamBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: NAVY, borderRadius: radius.button,
    paddingHorizontal: 16, paddingVertical: 11, marginTop: 16, alignSelf: 'stretch',
  },
  teamBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.cream },
})
