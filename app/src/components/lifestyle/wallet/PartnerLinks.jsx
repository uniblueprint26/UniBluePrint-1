import { useState } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { Globe, Instagram, MessageCircle, Phone, Mail } from 'lucide-react-native'
import { fonts } from '../../../constants/theme'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../context/AuthContext'
import { usePartnerContact } from '../../../hooks/usePartnerContact'
import ProUpgradeGate from '../../ui/ProUpgradeGate'
import { logPartnerEvent } from '../../../lib/partnerEvents'

// Round icon buttons (Instagram, TikTok, website, each only when the link exists) and
// the Get in touch button for one partner. Contact details are never in
// the app bundle. They come from hooks/usePartnerContact.js (the backend RPC), which
// also decides whether the member may see them (Pro).
// Get in touch opens the real contact options. Tapping one counts as claiming the deal.

function Chip({ Icon, label, onPress, colors, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Icon size={15} color={colors.textPrimary} strokeWidth={1.9} />
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

function RoundButton({ children, label, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={2}
      style={[styles.round, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {children}
    </Pressable>
  )
}

const cleanHandle = h => String(h || '').trim().replace(/^@+/, '').replace(/[^\w.]/g, '')

// forceOpen (optional) lets a screen with its own Get in touch button control the options.
export default function PartnerLinks({ partner, enabled = true, showGetInTouch = true, forceOpen }) {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { contact, requiresPro } = usePartnerContact(partner.id, { enabled: enabled && !!partner.hasContact })
  const [touchState, setTouchOpen] = useState(false)
  const touchOpen = forceOpen ?? touchState
  const website = contact?.websiteUrl || partner.website || null
  const insta = cleanHandle(contact?.instagramHandle) || null
  const tiktok = cleanHandle(contact?.tiktokHandle) || null

  function claim(open) {
    if (user?.id) logPartnerEvent({ userId: user.id, partnerSlug: partner.id, type: 'partner_deal_claimed', title: `Claimed ${partner.brand}'s deal` })
    open()
  }

  const rows = []
  if (insta) {
    rows.push(
      <RoundButton key="ig" colors={colors} label={`${partner.brand} on Instagram`} onPress={() => claim(() => Linking.openURL(`https://instagram.com/${insta}`))}>
        <Instagram size={19} color={colors.textPrimary} strokeWidth={1.9} />
      </RoundButton>,
    )
  }
  if (tiktok) {
    rows.push(
      <RoundButton key="tt" colors={colors} label={`${partner.brand} on TikTok`} onPress={() => claim(() => Linking.openURL(`https://www.tiktok.com/@${tiktok}`))}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 0.3, color: colors.textPrimary }}>TT</Text>
      </RoundButton>,
    )
  }
  if (website) {
    rows.push(
      <RoundButton key="web" colors={colors} label={`${partner.brand} website`} onPress={() => Linking.openURL(website)}>
        <Globe size={19} color={colors.textPrimary} strokeWidth={1.9} />
      </RoundButton>,
    )
  }
  if (showGetInTouch && partner.hasContact) {
    rows.push(<Chip key="git" Icon={MessageCircle} label="Get in touch" colors={colors} onPress={() => setTouchOpen(v => !v)} />)
  }
  if (rows.length === 0 && !touchOpen) return null

  return (
    <View>
      {rows.length > 0 && <View style={styles.row}>{rows}</View>}
      {touchOpen && requiresPro && (
        <ProUpgradeGate
          variant="inline"
          title="Contact details are part of Pro"
          message={`Pro members can contact ${partner.brand} to claim the deal.`}
          style={{ marginTop: 12, marginHorizontal: 0 }}
        />
      )}
      {touchOpen && contact && (
        <View style={[styles.row, { marginTop: 10 }]}>
          {contact.phone ? <Chip Icon={Phone} label="Call or text" colors={colors} onPress={() => claim(() => Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`))} /> : null}
          {contact.email ? <Chip Icon={Mail} label="Email" colors={colors} onPress={() => claim(() => Linking.openURL(`mailto:${contact.email}`))} /> : null}
          {!contact.phone && !contact.email && !tiktok && !insta ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>Contact options are on the way.</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
})
