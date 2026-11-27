import { View, Text, StyleSheet } from 'react-native'
import { fonts } from '../../../constants/theme'
import { blendKind, withAlpha } from '../../../data/partnerCards'
import { cleanCopy } from '../../../lib/plainCopy'
import { cardSize } from './BankCard'
import QrCode from './QrCode'

// The back of the card. Same bank card shape as the front.
// A dark band, how to claim, a QR code of the member code, and (when the partner
// has one) today's special. The action buttons sit under the card, not on it,
// so the card never grows taller than a real bank card.
export default function CardBack({ partner, cfg, width, code, revealed, todaySpecial }) {
  const { w, h, radius, s } = cardSize(width)
  const fg = cfg.textColor
  const dark = blendKind(cfg.brandColor) === 'dark'
  const band = dark ? 'rgba(255,255,255,0.13)' : fg === '#FFFFFF' ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.2)'
  const pad = Math.round(14 * s)
  const qr = Math.round(66 * s)
  return (
    <View
      style={[styles.card, { width: w, height: h, borderRadius: radius, backgroundColor: cfg.brandColor }]}
      accessibilityLabel={`${partner.brand}, back of the card`}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: Math.round(16 * s), height: Math.round(34 * s), backgroundColor: band }} />
      </View>
      <View style={{ position: 'absolute', left: pad, right: pad, top: Math.round(58 * s) }}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, color: fg, opacity: 0.85 }}>How to claim</Text>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: Math.round(14 * s), lineHeight: Math.round(19 * s), color: fg, marginTop: 2 }} numberOfLines={2}>
          {cleanCopy(cfg.claimText)}
        </Text>
      </View>
      <View style={{ position: 'absolute', left: pad, right: pad, bottom: pad, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: qr, height: qr, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          {revealed ? (
            <QrCode value={code.full} size={qr} />
          ) : (
            <Text style={styles.qrWait}>Scratch the front first</Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, color: fg, opacity: 0.85 }}>Your member code</Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: Math.round(14 * s), letterSpacing: 1.6, color: fg, marginTop: 2 }} numberOfLines={1}>
            {revealed ? code.full : code.masked}
          </Text>
          {!!todaySpecial && (
            <View style={[styles.special, { borderColor: withAlpha(fg, 0.4) }]}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, lineHeight: 14, color: fg }} numberOfLines={2}>
                Today: {cleanCopy(todaySpecial)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  qrWait: { fontFamily: fonts.sansMedium, fontSize: 9, color: '#555555', textAlign: 'center', paddingHorizontal: 4 },
  special: { marginTop: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
})
