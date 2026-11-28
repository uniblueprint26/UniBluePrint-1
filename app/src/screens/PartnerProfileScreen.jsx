import { useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, Platform, StyleSheet, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Heart, MessageCircle, Clock } from 'lucide-react-native'
import AppHeader from '../components/ui/AppHeader'
import BrandProfile, { ProfileButton, Chip, ProfileSection } from '../components/profile/BrandProfile'
import BankCard from '../components/lifestyle/wallet/BankCard'
import PartnerLinks from '../components/lifestyle/wallet/PartnerLinks'
import { useCardWidth } from '../components/lifestyle/wallet/PartnerWallet'
import { PARTNERS } from '../data/lifestylePartners'
import { getCardConfig, endsTag } from '../data/partnerCards'
import { usePartnerContact } from '../hooks/usePartnerContact'
import { useBrandFollow } from '../hooks/useBrandFollow'
import { useWallet } from '../lib/walletStore'
import { cleanCopy } from '../lib/plainCopy'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { pillarTint } from '../constants/pillarTints'

// A partner's profile, in the shared BrandProfile layout: banner in the brand colour,
// logo avatar, name with the verified tick, category and county, a short bio, Follow
// (only when the remote flag partner_follow_enabled is on), Get in touch, the deal
// card (tap it to open the wallet card), a photo gallery and, when the partner has
// them, opening hours. The menu or price list shows on the website build only.

export function PartnerProfileView({ partner, onOpenCard, forceFollow }) {
  const { colors, isDark } = useTheme()
  const cfg = useMemo(() => getCardConfig(partner), [partner])
  const wallet = useWallet()
  const cardW = useCardWidth()
  const accent = pillarTint('lifestyle', isDark)
  const { contact } = usePartnerContact(partner.id, { enabled: !!partner.hasContact })
  const follow = useBrandFollow('partner', partner.id)
  const [touchOpen, setTouchOpen] = useState(false)
  const showFollow = follow.enabled || forceFollow
  const handle = contact?.instagramHandle || null
  const county = partner.county || (partner.counties || []).join(', ') || null
  const bio = cleanCopy(partner.description) || cleanCopy(partner.tagline)
  const photos = cfg.photos || []
  const menu = Platform.OS === 'web' && Array.isArray(partner.pricelist) && partner.pricelist.length > 0 ? partner.pricelist : null
  // The full services list when the partner has one, else the three short chips.
  const services = Array.isArray(partner.services) && partner.services.length ? partner.services : (cfg.serviceChips || [])
  const regular = wallet.isRegular(partner.id)
  const tag = endsTag(cfg.endsOn)

  const subtitle = [handle ? `@${handle}` : null, cleanCopy(partner.category), county].filter(Boolean).join(' · ')

  return (
    <BrandProfile
      banner={{ color: cfg.brandColor }}
      avatar={cfg.logo
        ? { image: cfg.logo, fit: 'contain', tileBg: cfg.logoBg }
        : { initials: cfg.initials, bg: cfg.brandColor, fg: cfg.textColor }}
      name={partner.brand}
      verified={partner.verified !== false}
      subtitle={subtitle}
      chips={[
        <Chip key="p" label="Partner" accent={accent} strong />,
        <Chip key="d" label={cfg.discountLabel} accent={accent} />,
        regular ? <Chip key="r" label="Regular" accent={accent} strong /> : null,
        tag ? <Chip key="e" label={tag} accent={accent} /> : null,
      ].filter(Boolean)}
      actions={(
        <>
          {showFollow && (
            <ProfileButton
              label={follow.following ? 'Following' : 'Follow'}
              Icon={Heart}
              variant={follow.following ? 'secondary' : 'primary'}
              onPress={follow.toggle}
              accessibilityLabel={follow.following ? `Unfollow ${partner.brand}` : `Follow ${partner.brand}`}
            />
          )}
          {partner.hasContact && (
            <ProfileButton label="Get in touch" Icon={MessageCircle} variant={showFollow ? 'secondary' : 'primary'} onPress={() => setTouchOpen(v => !v)} />
          )}
        </>
      )}
      bio={bio}
      links={<PartnerLinks partner={partner} showGetInTouch={false} forceOpen={touchOpen} />}
      gallery={photos}
    >
      <ProfileSection title="The offer">
        <Pressable
          onPress={() => onOpenCard?.(partner.id)}
          accessible
          accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
          accessibilityLabel={`${partner.brand} discount card. Open it in your wallet`}
          style={{ alignSelf: 'center' }}
        >
          <BankCard partner={partner} cfg={cfg} width={Math.min(cardW, 358)} variant="static" regular={regular} tag={tag} hideHeart />
        </Pressable>
      </ProfileSection>

      {services.length > 0 && (
        <ProfileSection title="Services">
          <View style={styles.wrap}>{services.map(sv => <Chip key={sv} label={cleanCopy(sv)} accent={accent} />)}</View>
        </ProfileSection>
      )}

      {!!cfg.hours && (
        <ProfileSection title="Opening hours">
          <View style={[styles.hours, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Clock size={18} color={colors.textSecondary} />
            <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 21, color: colors.textPrimary }}>{cleanCopy(cfg.hours)}</Text>
          </View>
        </ProfileSection>
      )}

      {menu && (
        <ProfileSection title="Menu and prices">
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {menu.map((m, i) => (
              <View key={m.label} style={[styles.menuRow, i < menu.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary }}>{cleanCopy(m.label)}</Text>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary }}>{m.price}</Text>
              </View>
            ))}
          </View>
        </ProfileSection>
      )}
    </BrandProfile>
  )
}

export default function PartnerProfileScreen({ navigation, route }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const id = route?.params?.partnerId
  const partner = PARTNERS.find(p => p.id === id && p.status === 'live')
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader navigation={navigation} showBack />
      {partner ? (
        <ScrollView testID="profile-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <PartnerProfileView partner={partner} onOpenCard={pid => navigation.navigate('Lifestyle', { highlightId: pid })} />
        </ScrollView>
      ) : (
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.textSecondary, padding: 20 }}>We could not find that partner.</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hours: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  menu: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
})
