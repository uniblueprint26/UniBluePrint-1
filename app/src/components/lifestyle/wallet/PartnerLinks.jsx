import { useState } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { Globe, AtSign, MessageCircle, Phone, Mail } from 'lucide-react-native'
import { fonts } from '../../../constants/theme'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../context/AuthContext'
import { usePartnerContact } from '../../../hooks/usePartnerContact'
import ProUpgradeGate from '../../ui/ProUpgradeGate'
import { logPartnerEvent } from '../../../lib/partnerEvents'

// Website, Instagram and Get in touch for one partner. Contact details are never in
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

// forceOpen (optional) lets a screen with its own Get in touch button control the options.
export default function PartnerLinks({ partner, enabled = true, showGetInTouch = true, forceOpen }) {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { contact, requiresPro } = usePartnerContact(partner.id, { enabled: enabled && !!partner.hasContact })
  const [touchState, setTouchOpen] = useState(false)
  const touchOpen = forceOpen ?? touchState
  const website = contact?.websiteUrl || partner.website || null
  const insta = contact?.instagramHandle || null

  function claim(open) {
    if (user?.id) logPartnerEvent({ userId: user.id, partnerSlug: partner.id, type: 'partner_deal_claimed', title: `Claimed ${partner.brand}'s deal` })
    open()
  }

  const rows = []
  if (website) rows.push(<Chip key="web" Icon={Globe} label="Website" colors={colors} onPress={() => Linking.openURL(website)} />)
  if (insta) rows.push(<Chip key="ig" Icon={AtSign} label="Instagram" colors={colors} accessibilityLabel={`${partner.brand} on Instagram`} onPress={() => claim(() => Linking.openURL(`https://instagram.com/${insta}`))} />)
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
          {contact.tiktokHandle ? <Chip Icon={AtSign} label="TikTok" colors={colors} onPress={() => claim(() => Linking.openURL(`https://www.tiktok.com/@${contact.tiktokHandle}`))} /> : null}
          {!contact.phone && !contact.email && !contact.tiktokHandle && !insta ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>Contact options are on the way.</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
})
